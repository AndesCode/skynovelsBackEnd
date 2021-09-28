/*jshint esversion: 6 */
/*jshint sub:true*/
const http = require('http');
const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const app = express();
const helmet = require("helmet");
const passportSocketIo = require("passport.socketio");
const cookieParser = require('cookie-parser');
const socketService = require('./server/services/socketService');
require('./server/passport/local-auth');
require('dotenv').config();
const isProd = process.env.NODE_ENV === 'production' ? true : false;

let sessionConfiguration;
let whitelist = [];
let allowedOrigin = '';
let sessionSecret = '';
if (isProd) {
    sessionConfiguration = JSON.parse(process.env.prodDataBaseSession);
    whitelist = ['https://skynovels.net', 'https://api.skynovels.net', 'https://www.skynovels.net', 'https://skynovels.net/', 'https://www.skynovels.net/'];
    allowedOrigin = 'https://www.skynovels.net';
    console.log('Environment: production');
    sessionSecret = process.env.prodSessionSecret;
} else {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    sessionConfiguration = JSON.parse(process.env.devDataBaseSession);
    whitelist = ['http://localhost:30000', 'http://localhost:4200', 'http://localhost:8100'];
    // allowedOrigin = 'http://localhost:30000';
    allowedOrigin = 'http://localhost:4200';
    // allowedOrigin = 'http://localhost:8100';
    console.log('Environment: development');
    sessionSecret = process.env.devSessionSecret;
}

const sessionStore = new MySQLStore(sessionConfiguration);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(helmet());

if (isProd) {
    app.use(session({
        name: 'sessionId',
        secret: sessionSecret,
        resave: false,
        key: 'sessionId',
        store: sessionStore,
        saveUninitialized: false,
        proxy: true,
        cookie: {
            secure: true,
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 5616000000
        }
    }));
} else {
    app.use(session({
        name: 'sessionId',
        secret: sessionSecret,
        resave: false,
        key: 'sessionId',
        store: sessionStore,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 5616000000
        }
    }));
}

app.use(passport.initialize());
app.use(passport.session());

const corsOptions = {
    origin: function(origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions), (req, res, next) => {
    if (isProd) {
        res.header('Access-Control-Allow-Origin', allowedOrigin);
    } else {
        res.header('Access-Control-Allow-Origin', allowedOrigin);
    }
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
// Routes
require('./server/routes/users')(app);
require('./server/routes/novels')(app);
require('./server/routes/forum')(app);
require('./server/routes/adminPanel')(app);
require('./server/routes/page')(app);
// View engine setup
app.set('view engine', 'handlebars');
// Static folder
app.use('server', express.static(path.join(__dirname, 'server')));

let port;

if (isProd) {
    port = 80;
    app.get('/api', (req, res) => {
        console.log('ruta actual: ' + req.originalUrl);
        res.status(200).send({ message: 'Welcome to the server' });
    });
} else {
    port = 3000;
    app.get('*', (req, res) => {
        console.log('ruta actual: ' + req.originalUrl);
        res.status(200).send({ message: 'Welcome to the server' });
    });
}

const server = http.createServer(app);

const io = socketService.init(server);
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'sessionId', // the name of the cookie where express/connect stores its session_id
    secret: sessionSecret, // the session_secret to parse the cookie
    store: sessionStore, // we NEED to use a sessionstore. no memorystore please
    success: onAuthorizeSuccess, // *optional* callback on success - read more below
    fail: onAuthorizeFail, // *optional* callback on fail/error - read more below
}));

function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io ' + data);
    accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
    if (error)
        throw new Error(message);
    console.log('failed connection to socket.io:', message + ' ' + error);
    accept(null, false);
    if (error)
        accept(new Error(message));
}

const usersSocketsConnections = [];
io.on('connection', (socket) => {
    const newConnection = {
        socket_id: socket.id,
        ip: socket.handshake.address,
        user_id: socket.request.user.id || null
    };
    console.log(newConnection.socket_id);
    usersSocketsConnections.push(newConnection);
    socketService.setOnlineUsers(usersSocketsConnections);

    socket.on('getOnlineUsersCount', data => {
        if (socket.request.user.user_rol === 'admin') {
            socket.emit('onlineUsersCount', usersSocketsConnections.length);
        }
    });

    socket.on('login', function(user_id) {
        if (usersSocketsConnections.find(x => x.socket_id === socket.id)) {
            usersSocketsConnections.find(x => x.socket_id === socket.id).user_id = user_id;
        }
        socketService.setOnlineUsers(usersSocketsConnections);
    });

    socket.on('logOut', function(user_id) {
        if (usersSocketsConnections.find(x => x.socket_id === socket.id)) {
            usersSocketsConnections.find(x => x.socket_id === socket.id).user_id = null;
        }
        socketService.setOnlineUsers(usersSocketsConnections);
    });

    socket.on('connect_error', function(err) {
        console.log(`connect_error due to ${err.message}`);
    });

    socket.on('disconnect', () => {
        usersSocketsConnections.splice(usersSocketsConnections.findIndex(x => x.socket_id === socket.id), 1);
        socketService.setOnlineUsers(usersSocketsConnections);
    });
});

server.listen(process.env.PORT || port, function() {
    console.log('server running on:');
    console.log(server.address());
});

module.exports = app;