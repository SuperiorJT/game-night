module.exports = function(io) {
    io.on('connection', function(socket) {
        console.log(socket.request.connection.remoteAddress + " has connected to the server.");
        socket.on('login', function(username) {
            console.log(username + " has joined the server!");
            io.emit('user joined server', username + " joined the game night server!");
        });
    });
};
