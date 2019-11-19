/*jshint esversion: 6 */
require('dotenv').config();
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const app = express();
// const expressValidator = require('express-validator');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');



// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(expressValidator());
app.use(cookieParser());
app.use(expressSession({ secret: 'cambiaEsteSecretPorfavor', saveUninitialized: false, resave: false, cookie: { expires: 600000 } }));

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
require('./server/routes/chapters')(app);
require('./server/routes/posts')(app);
require('./server/routes/forum')(app);
require('./server/routes/adminPanel')(app);

// View engine setup
app.engine('handlebards', exphbs());
app.set('view engine', 'handlebars');

// Static folder
app.use('server', express.static(path.join(__dirname, 'server')));

const port = parseInt(process.env.port, 10) || 3000;

app.get('*', (req, res) => {
    res.status(200).send({ message: "NodeJS server initialized" });
});

var server = http.createServer(app);

server.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('running at http://' + host + ':' + port);
});

module.exports = app;