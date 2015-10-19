var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var client = require('./helpers/db');
var register = require('./routes/register');
var login = require('./routes/login');

app.use(express.static('public'));

app.use(bodyParser.json());

app.use('/api/register', register);
app.use('/api/login', login);

client.on('connect', function() {
    console.log('connected to redis server');
    client.exists('user:gen-id', function(err, reply) {
        if (!reply) {
            client.set('user:gen-id', 1);
        }
    });
    client.exists('session:gen-id', function(err, reply) {
        if (!reply) {
            client.set('session:gen-id', 1);
        }
    });
    client.keys('*', function(err, replies) {
        console.log(replies);
    });
});

server.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Server is currently listening on port " + port);
});
