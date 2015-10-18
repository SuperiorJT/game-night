var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bcrypt = require('bcrypt');

app.use(express.static('public'));

app.use(bodyParser.json());

app.post('/api/register', function(req, res) {
    console.log(req.body);
    res.json(req.body);
});

server.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Server is currently listening on port " + port);
});
