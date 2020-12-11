/*jshint esversion: 6 */
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

let sessionConfiguration;
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    sessionConfiguration = JSON.parse(process.env.devDataBaseSession);
} else {
    sessionConfiguration = JSON.parse(process.env.prodDataBaseSession);
}

const sessionStore = new MySQLStore(sessionConfiguration);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(helmet());

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    console.log('Environment: development');
    app.use(session({
        name: 'sessionId',
        secret: process.env.devSessionSecret,
        resave: false,
        store: sessionStore,
        saveUninitialized: false,
        cookie: {
            maxAge: 5616000000
        }
    }));
} else {
    console.log('Environment: production');
    // NODE_ENV=production node app.js
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
            // sameSite: 'Strict', utilizar en servidor!!!,
            maxAge: 5616000000
        }
    }));
}

app.use(passport.initialize());
app.use(passport.session());

const whitelist = ['https://skynovelstesting.a2hosted.com', 'http://localhost:4200'];
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
    res.header('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Origin', 'https://skynovelstesting.a2hosted.com*'); utilizar en servidor!!!
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

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    port = 3000;
    app.get('*', (req, res) => {
        console.log('ruta actual: ' + req.originalUrl);
        res.status(200).send({ message: 'Welcome to the server' });
    });
} else {
    port = 40000;
    app.get('/api', (req, res) => {
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