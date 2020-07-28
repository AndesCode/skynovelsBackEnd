/*jshint esversion: 6 */
require('dotenv').config();
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

const options = {
    host: 'localhost',
    user: 'root',
    password: 'andres23722',
    database: 'skynovelsdb_new',
    expiration: 3024000000,
    checkExpirationInterval: 14400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'sessionId',
            expires: 'expires',
            data: 'data'
        }
    }
};

const sessionStore = new MySQLStore(options);

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    app.use(cors({ origin: true, credentials: true }));
} else {
    /*const whitelist = ['https://skynovels.net'];
    const corsOptions = {
        origin: function(origin, callback) {
            if (whitelist.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    };
    app.use(cors(corsOptions));*/
    app.use(cors({ origin: true, credentials: true }));
}
require('./server/passport/local-auth');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(helmet());

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    console.log('Environment: development');
    app.use(session({
        name: 'sessionId',
        secret: 'SimpleSecret',
        resave: false,
        store: sessionStore,
        saveUninitialized: false,
    }));
} else {
    console.log('Environment: production');
    app.use(session({
        name: 'sessionId',
        secret: '$2b$24$ze2wpHDHn5muWBmiq4XMHuJgn7R4_YSm6b0MDGxjr.CME4YKOriWK',
        resave: false,
        store: sessionStore,
        saveUninitialized: false,
        cookie: {
            secure: true,
            httpOnly: true,
            domain: 'skynovels.net',
            path: 'foo/bar',
            maxAge: 3024000000
        }
    }));
}

app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
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
app.get('*', (req, res) => {
    console.log('ruta actual: ' + req.originalUrl);
    res.status(200).send({ message: 'Welcome to the server' });
});
const server = http.createServer(app);
server.listen(process.env.PORT || 3000, function() {
    const port = server.address().port;
    console.log('running at http://localhost:' + port);
});
module.exports = app;