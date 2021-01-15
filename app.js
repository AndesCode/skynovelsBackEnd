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
require('./server/passport/local-auth');
require('dotenv').config();
const isProd = process.env.NODE_ENV === 'production' ? true : false;

let sessionConfiguration;
let whitelist = [];
if (isProd) {
    sessionConfiguration = JSON.parse(process.env.prodDataBaseSession);
    whitelist = ['https://skynovels.net', 'https://api.skynovels.net', 'https://www.skynovels.net'];
    console.log('Environment: production');
} else {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    sessionConfiguration = JSON.parse(process.env.devDataBaseSession);
    whitelist = ['http://localhost:4200', 'http://localhost:8100'];
    console.log('Environment: development');
}

const sessionStore = new MySQLStore(sessionConfiguration);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(helmet());

if (isProd) {
    app.use(session({
        name: 'sessionId',
        secret: process.env.prodSessionSecret,
        resave: false,
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
        secret: process.env.devSessionSecret,
        resave: false,
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
            console.log('whitelisted' + origin);
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions), (req, res, next) => {
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
server.listen(process.env.PORT || port, function() {
    console.log('server running on:');
    console.log(server.address());
});

module.exports = app;