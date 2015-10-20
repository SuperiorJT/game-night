var games = require('./games/games-io');

module.exports = function(io) {
    io.on('connection', function(socket) {
        var conn = {
            "io": io,
            "socket": socket
        };
        console.log(socket.request.connection.remoteAddress + " has connected to the server.");
        socket.on('login', function(username) {
            console.log(username + " has joined the server!");
            io.emit('user joined server', username + " joined the game night server!");
        });

        // Modules to be bootstrapped must be initialized below

        games.init(conn);

    });
};
