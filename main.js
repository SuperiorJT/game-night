var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Server is currently listening on port " + port);
});
