/*jshint esversion: 6 */
require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const session = require('express-session');
const Sequelize = require("sequelize");
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const app = express();

const SequelizeStore = require("connect-session-sequelize")(session.Store);

const sequelize = new Sequelize("skynovelsdb_new", "root", "andres23722", {
    dialect: "mysql",
    storage: "./session.mysql"
});

/**
 * Setting up CORS, such that it can work together with an Application at another domain / port
 */
/*const whitelist = ['http://localhost:4200'];
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
app.options(cors({ origin: true, credentials: true }));
require('./server/passport/local-auth');

/**
 * For being able to read request bodies
 */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));


/**
 * Initializing the session magic of express-session package
 */
/*app.use(session({
    name: 'sessionId',
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
        // cookie: { secure: true }
})); Usa esto para ambiente de desarrollo*/

app.use(session({
    name: 'sessionId',
    secret: 'keyboard cat',
    resave: false,
    store: new SequelizeStore({
        db: sequelize,
        checkExpirationInterval: 14400000, // The interval at which to cleanup expired sessions in milliseconds.
        expiration: 15550000000 // The maximum age (in milliseconds) of a valid session.
    }),
    saveUninitialized: false
        // cookie: { secure: true }
}));
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
    res.status(200).send({ message: 'Welcome to the server' });
});
const server = http.createServer(app);
server.listen(process.env.PORT || 3000, function() {
    const host = server.address().address;
    const port = server.address().port;
    console.log('running at http://' + host + ':' + port);
});
module.exports = app;