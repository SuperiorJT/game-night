var games = require('./games/games-io');
var sessions = require('./sessions/sessions-io');
var rounds = require('./rounds/rounds-io');
var roundFuncs = require('./rounds/rounds');
var notify = require('./socket-notifications');
var users = require('./users');
var client = require('./db');
var cache = require('./cache');

module.exports = function(io) {
    io.on('connection', function(socket) {
        var conn = {
            "io": io,
            "socket": socket
        };
        console.log(socket.request.connection.remoteAddress + " has connected to the server. id: " + socket.id);
        socket.on('test global', function() {
            notify.neutral(io, "This is a global test", null);
            notify.success(io, "This is a global test", null);
            notify.fail(io, "This is a global test", null);
        });
        socket.on('login', function(id) {
            client.hgetall('user:' + id, function(err, reply) {
                if (err) {
                    throw err;
                }
                if (reply) {
                    reply.id = JSON.parse(reply.id);
                    reply.skill = JSON.parse(reply.skill);
                    reply.sessions = JSON.parse(reply.sessions);
                    reply.exp = JSON.parse(reply.exp);
                    reply.rank = JSON.parse(reply.rank);
                    reply.session = JSON.parse(reply.session);
                    if (reply.session != cache.session.id) {
                        reply.session = 0;
                    }
                    reply.admin = JSON.parse(reply.admin);
                    reply.lobby = JSON.parse(reply.lobby);
                    var roundAvailable = cache.rounds.filter(function(val) {
                        return val.id == reply.lobby;
                    })[0];
                    if (!roundAvailable) {
                        reply.lobby = 0;
                    }
                    reply.online = true;
                    reply.sid = socket.id;
                    delete reply.password;
                    cache.users.push(reply);
                    users.updateState(reply.id, true, reply.session, reply.lobby);
                    console.log(reply.username + " has joined the server!");
                    var sessionAvailable = false;
                    if (cache.session.id) {
                        sessionAvailable = true;
                    }
                    socket.emit('logged in', { user: reply, session: sessionAvailable });
                    notify.neutral(io, reply.username + " joined the game night server!", null);
                } else {
                    socket.emit('login failed', null);
                    notify.fail(socket, "Your local account data is invalid. Please login again.", null);
                }
            });
        });

        socket.on('disconnect', function() {
            console.log(socket.request.connection.remoteAddress + " has disconnected to the server. id: " + socket.id);
            cache.users.some(function(user) {
                if (user.sid == socket.id) {
                    var sessionId = null;
                    var round = null;
                    if (user.lobby) {
                        rounds.leave({
                            id: user.id,
                            round: user.lobby
                        }, conn);
                        round = 0;
                    }
                    if (user.session) {
                        sessions.leave({
                            id: user.id
                        }, conn);
                        sessionId = 0;
                    }
                    users.updateState(user.id, false, sessionId, round);
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

        socket.on('logout', function(user) {
            var sessionId = null;
            var round = null;
            if (user.lobby) {
                rounds.leave({
                    id: user.id,
                    round: user.lobby
                }, conn);
                round = 0;
            }
            if (user.session) {
                sessions.leave({
                    id: user.id
                }, conn);
                sessionId = 0;
            }
            users.updateState(user.id, false, sessionId, round);
            cache.users = cache.users.filter(function(val) {
                return val.id != user.id;
            });
            console.log(user.username + " has left the server!");
            socket.emit('logged out');
            io.emit('users updated', user.username + "left the game night server!");
        });

        socket.on('fetch users', function() {
            if (cache.session.id) {
                socket.to('session room ' + cache.session.id).emit('receive users', cache.users.filter(function(val) {
                    return val.session == cache.session.id;
                }));
            }
        });

        // Modules to be bootstrapped must be initialized below

        sessions.init(conn);
        rounds.init(conn);
        games.init(conn);

        socket.on('fetch all', function() {
            console.log("fetching for " + socket.id);
            if (cache.session.id) {
                socket.emit('receive users', cache.users.filter(function(val) {
                    return val.session == cache.session.id;
                }));
            }
            socket.emit('receive rounds', cache.rounds);
            games.emitGames(conn);
        });

    });
};
