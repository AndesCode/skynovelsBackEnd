/*jshint esversion: 6 */
const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');


const app = express();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// Routes
require('./server/routes/usuarios')(app);
require('./server/routes/novelas')(app);
require('./server/routes/capitulos')(app);
require('./server/routes/posts')(app);
require('./server/routes/forum')(app);

// View engine setup
app.engine('handlebards', exphbs());
app.set('view engine', 'handlebars');

// Static folder
app.use('server', express.static(path.join(__dirname, 'server')));

app.get('*', (req, res) => {
    res.status(200).send({ message: "bienvenido al servidor NodeJS" });
});

module.exports = app;