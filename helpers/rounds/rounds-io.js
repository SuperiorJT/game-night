var rounds = require('./rounds');
var client = require('../db');
var notify = require('../socket-notifications');
var cache = require('../cache');

module.exports.init = function(conn) {

    conn.socket.on('round create', function(data) {
        var user = cache.users.filter(function(val) {
            return val.id == data.id;
        })[0];
        if (user.admin) {
            data.data.admin = user.id;
            rounds.create(data.data, function(err, reply) {
                if (err) {
                    notify.fail(conn.socket, "Could not create round", null);
                } else if (reply.error) {
                    notify.fail(conn.socket, reply.msg, reply.data);
                } else {
                    conn.socket.emit('round created', cache.rounds[cache.rounds.length - 1]);
                    var round = reply;
                    client.hgetall('game:' + data.data.game, function(err, reply) {
                        if (err) {
                            console.log("Error grabbing game for round: " + reply.id);
                        } else {
                            console.log("Round created for " + reply.name);
                            notify.success(conn.io.to('session room ' + cache.session.id), "A new lobby for " + reply.name + " has been created!", {
                                id: round.id,
                                img: JSON.parse(reply.img)
                            });
                        }
                    });
                }
            });
        } else {
            notify.fail(conn.socket, "You are not authorized to create a round", null);
        }
    });

    conn.socket.on('round join', function(data) {
        rounds.join(data, function(reply) {
            if (reply.error) {
                notify.fail(conn.socket, reply.msg, reply.data);
                conn.socket.emit('round join failed', null);
            } else {
                client.hgetall('round:' + data.round, function(err, reply) {
                    conn.socket.emit('round joined', reply);
                    conn.socket.join('round room ' + data.round);
                    var username = cache.users.filter(function(val) {
                        return val.id == data.id;
                    })[0].username;
                    notify.success(conn.io.to('round room ' + cache.session.id), username + " has joined the lobby!")
                });
            }
        });
    });

    conn.socket.on('round leave', function(data) {
        rounds.leave(data, function(reply) {
            if (reply.error) {
                notify.fail(conn.socket, reply.msg, reply.data);
                conn.socket.emit('round leave failed', null);
            } else {
                client.hgetall('round:' + data.round, function(err, reply) {
                    conn.socket.emit('round left', reply);
                    conn.socket.leave('round room ' + data.round);
                    var username = cache.users.filter(function(val) {
                        return val.id == data.id;
                    })[0].username;
                    notify.success(conn.io.to('round room ' + cache.session.id), username + " has left the lobby!")
                });
            }
        });
    });

    conn.socket.on('round start', function(data) {
        var user = cache.users.filter(function(val) {
            return val.id == data.id;
        })[0];
        if (user.admin) {
            rounds.start(data, function(reply) {
                if (reply.error) {
                    notify.fail(conn.socket, reply.msg, reply.data);
                    conn.socket.emit('round start failed', null);
                } else {
                    client.hgetall('round:' + data.round, function(err, reply) {
                        conn.io.to('session room ' + cache.session.id).emit('round started', reply);
                    });
                }
            })
        } else {
            notify.fail(conn.socket, "You are not authorized to start a round", null);
        }
    });

    conn.socket.on('round finish', function(data) {
        var user = cache.users.filter(function(val) {
            return val.id == data.id;
        })[0];
        if (user.admin) {
            rounds.finish(data, function(reply) {
                if (reply.error) {
                    notify.fail(conn.socket, reply.msg, reply.data);
                    conn.socket.emit('round finish failed', null);
                } else {
                    client.hgetall('round:' + data.round, function(err, reply) {
                        conn.io.to('round room ' + data.round).emit('round finished', reply);
                    });
                }
            })
        } else {
            notify.fail(conn.socket, "You are not authorized to finished a round", null);
        }
    });

    conn.socket.on('round claim', function(data) {
        users.checkStatus(data.id, function(reply) {

        });
        rounds.claimVictory(data, function(reply) {
            if (reply.error) {
                notify.fail(conn.socket, reply.msg, reply.data);
                conn.socket.emit('round claim failed', null);
            } else {
                client.hgetall('round:' + data.round, function(err, reply) {
                    conn.io.to('round room ' + data.round).emit('round claimed', reply);
                });
            }
        });
    });

    conn.socket.on('round declare winners', function(data) {
        rounds.declareWinners(data, function(reply) {
            if (reply.error) {
                notify.fail(conn.socket, reply.msg, reply.data);
                conn.socket.emit('round claim failed', null);
            } else {
                client.hgetall('round:' + data.round, function(err, reply) {
                    conn.io.to('session room ' + cache.session.id).emit('round closed', reply);
                    updateStats(reply, function(err, user) {
                        if (err) {
                            throw err;
                        }
                        conn.io.sockets[user.sid].emit('exp update', user);
                    });
                });
            }
        });
    });

    conn.socket.on('round close', function(data) {
        var user = cache.users.filter(function(val) {
            return val.id == data.id;
        })[0];
        if (user.admin) {
            rounds.close(data, function(reply) {
                if (reply.error) {
                    notify.fail(conn.socket, reply.msg, reply.data);
                    conn.socket.emit('round close failed', null);
                } else {
                    client.hgetall('round:' + data.round, function(err, reply) {
                        conn.io.to('session room ' + cache.session.id).emit('round closed', reply);
                    });
                }
            });
        } else {
            notify.fail(conn.socket, "You are not authorized to close this lobby", null);
        }
    });

    conn.socket.on('fetch rounds', function(data) {
        conn.socket.to('session room ' + cache.session.id).emit('receive rounds', cache.rounds);
    });

}
