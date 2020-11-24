/*jshint esversion: 6 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const app = express();
const helmet = require("helmet");
const config = require(__dirname + '/server/config/config.json');
const fs = require('fs');

let sessionConfiguration;

// key and certs 
const key = fs.readFileSync(path.join(__dirname, '../ssl/keys/b488b_99ae9_e7c015ecebdcb61e95d824f2665262dc.key'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, '../ssl/certs/skynovelstesting_a2hosted_com_b488b_99ae9_1608016588_dfa422c0b725d4023b8fea4978ad675b.crt'), 'utf8');

const keyTest = fs.readFileSync(path.join(__dirname, '../ssltest/selfsigned.key'), 'utf8');
const certTest = fs.readFileSync(path.join(__dirname, '../ssltest/selfsigned.crt'), 'utf8');

const httpsOptions = {
    key: key,
    cert: cert
};

const httpsOptionsTest = {
    key: keyTest,
    cert: certTest
};

// console.log(httpsOptions);

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    app.use(cors({ origin: true, credentials: true }));
    sessionConfiguration = config.development_session;
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
    sessionConfiguration = config.production_session;
}

const sessionStore = new MySQLStore(sessionConfiguration);
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
        cookie: {
            // secure: true,
            maxAge: 3024000000
        }
    }));
} else {
    console.log('Environment: production test');
    // NODE_ENV=production node app.js
    app.use(session({
        name: 'sessionId',
        secret: '$2b$24$ze2wpHDHn5muWBmiq4XMHuJgn7R4_YSm6b0MDGxjr.CME4YKOriWK',
        resave: false,
        store: sessionStore,
        saveUninitialized: false,
        cookie: {
            secure: true,
            // sameSite: 'Strict', utilizar en servidor!!!,
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

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    app.get('*', (req, res) => {
        console.log('ruta actual: ' + req.originalUrl);
        res.status(200).send({ message: 'Welcome to the server' });
    });
} else {
    app.get('/api', (req, res) => {
        console.log('ruta actual: ' + req.originalUrl);
        res.status(200).send({ message: 'Welcome to the server' });
    });
}


let server;
let port;
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    port = 3000;
    server = http.createServer(app);
} else {
    port = 40000;
    server = https.createServer(httpsOptions, app);
}
server.listen(process.env.PORT || port, function() {
    console.log(server.address().port ? 'running at http://localhost:' + server.address().port : 'running at http://localhost:' + process.env.PORT);
    console.log(server.address());
});

module.exports = app;