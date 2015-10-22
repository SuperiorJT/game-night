var games = require('./games/games-io');
var sessions = require('./sessions/sessions-io');
var rounds = require('./rounds/rounds-io');
var roundFuncs = require('./rounds/rounds');
var notify = require('./socket-notifications');
var client = require('./db');
var cache = require('./cache');

module.exports = function(io) {
    io.on('connection', function(socket) {
        var conn = {
            "io": io,
            "socket": socket
        };
        console.log(socket.request.connection.remoteAddress + " has connected to the server. id: " + socket.id);
        socket.on('login', function(id) {
            client.hgetall('user:' + id, function(err, reply) {
                if (err) {
                    throw err;
                }
                if (reply) {
                    reply.id = id;
                    reply.skill = JSON.parse(reply.skill);
                    reply.sessions = JSON.parse(reply.sessions);
                    reply.sid = socket.id;
                    reply.password = undefined;
                    cache.users.push(reply);
                    console.log(reply.username + " has joined the server!");
                    socket.emit('logged in', reply.admin);
                    notify.success(io, reply.username + " joined the game night server!", null);
                } else {
                    notify.fail(socket, "Your local account data is invalid. Please login again.", null);
                }
            });
        });

        socket.on('disconnect', function() {
            console.log(socket.request.connection.remoteAddress + " has disconnected to the server. id: " + socket.id);
            cache.users.some(function(user) {
                if (user.sid == socket.id) {
                    cache.users = cache.users.filter(function(val) {
                        return val.id != user.id;
                    });
                    console.log(user.username + " has left the server!");
                    io.emit('users updated', user.username + "left the game night server!");
                    return true;
                }
            });
        });

        socket.on('reconnect', function() {
            console.log(socket.request.connection.remoteAddress + " has reconnected to the server. id: " + socket.id);
        });

        socket.on('fetch users', function() {
            socket.to('session room ' + cache.session.id).emit('receive users', cache.users);
        });

        // Modules to be bootstrapped must be initialized below

        sessions.init(conn);
        rounds.init(conn);
        games.init(conn);

    });
};
