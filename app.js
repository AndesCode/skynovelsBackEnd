/*jshint esversion: 6 */
var http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();
var server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    var message = 'It works!\n',
        version = 'NodeJS ' + process.versions.node + '\n',
        response = [message, version].join('\n');
    res.end(response);
});

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

const port = process.env.PORT || 3000;
console.log(port);

server.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('running at http://' + host + ':' + port);
});

module.exports = app;