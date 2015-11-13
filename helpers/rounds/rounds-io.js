var rounds = require('./rounds');
var client = require('../db');
var notify = require('../socket-notifications');
var cache = require('../cache');
var users = require('../users');

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
                    conn.io.to('session room ' + cache.session.id).emit('round created', reply);
                    console.log("Round created for " + reply.game.name);
                    notify.success(conn.io.to('session room ' + cache.session.id), "A new lobby for " + reply.game.name + " has been created!", {
                        id: reply.id,
                        img: reply.game.img
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
                conn.socket.emit('round joined', reply);
                conn.socket.join('round room ' + data.round);
                conn.io.to('round room ' + data.round).emit('round users updated', reply);
                var username = cache.users.filter(function(val) {
                    return val.id == data.id;
                })[0].username;
                notify.neutral(conn.io.to('round room ' + cache.session.id), username + " has joined the lobby!")
            }
        });
    });

    conn.socket.on('round leave', function(data) {
        roundLeave(data, conn);
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
                    conn.io.to('session room ' + cache.session.id).emit('round started', reply);
                }
            });
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
                    conn.io.to('round room ' + data.round).emit('round finished', reply);
                    setTimeout(function() {
                        cache.rounds.some(function(round, index, array) {
                            if (round.id == data.round) {
                                if (round.winners.length < round.users.length) {
                                    round.users.forEach(function(val) {
                                        var user = round.winners.filter(function(winnerVal) {
                                            return winnerVal.user.id == val.id;
                                        })[0];
                                        if (!user) {
                                            cache.rounds[index].winners.push({
                                                user: val,
                                                place: cache.rounds[index].users.length
                                            });
                                        }
                                    });
                                }
                                conn.io.to('round room ' + data.round).emit('round claimed complete', reply);
                                return true;
                            } else {
                                return false;
                            }
                        });
                    }, 30000);
                }
            })
        } else {
            notify.fail(conn.socket, "You are not authorized to finish a round", null);
        }
    });

    conn.socket.on('round claim', function(data) {
        users.checkStatus(data.id, function(reply) {
            if (reply.error) {
                console.log("ERROR");
            } else {
                rounds.claimVictory(data, function(reply) {
                    if (reply.error) {
                        notify.fail(conn.socket, reply.msg, reply.data);
                        conn.socket.emit('round claim failed', null);
                    } else {
                        conn.io.to('round room ' + data.round).emit('round claimed', reply);
                        if (reply.winners.length == reply.users.length) {
                            conn.io.to('round room ' + data.round).emit('round claimed complete', reply);
                        }
                    }
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
                cache.users.forEach(function(val) {
                    conn.io.sockets.connected[val.sid].leave('round room ' + data.round);
                });
                rounds.updateStats(reply, function(err, user) {
                    if (err) {
                        throw err;
                    }
                    conn.io.sockets.connected[user.sid].emit('exp update', user.exp);

                }, function(err, round) {
                    if (err) {
                        throw err;
                    }
                    console.log('round closed');
                    round.users.forEach(function(val) {
                        users.updateState(val, null, null, 0);
                    });
                    conn.io.to('session room ' + cache.session.id).emit('round closed', cache.rounds);
                });
            }
        });
    });

    conn.socket.on('round close', function(data) {
        var user = cache.users.filter(function(val) {
            return val.id == data.id;
        })[0];
        if (user.admin) {
            roundClose(data);
        } else {
            notify.fail(conn.socket, "You are not authorized to close this lobby", null);
        }
    });

    conn.socket.on('fetch round', function(data) {
        var round = cache.rounds.filter(function(val) {
            return val.id == data.round;
        })[0];
        if (round) {
            conn.socket.emit('receive round', round);
        }

    });

    conn.socket.on('fetch rounds', function(data) {
        conn.socket.emit('receive rounds', cache.rounds);
    });

};

var roundLeave = function(data, conn) {
    rounds.leave(data, function(reply) {
        if (reply.error) {
            notify.fail(conn.socket, reply.msg, reply.data);
            conn.socket.emit('round leave failed', null);
        } else {
            var round = reply;
            cache.rounds.some(function(round, index) {
                if (round.id == data.round) {
                    conn.socket.emit('round left', round);
                    conn.io.to('round room ' + round.id).emit('round users updated', round);
                    conn.socket.leave('round room ' + round.id);
                    if (round.admin.id == data.id) {
                        roundClose(data, conn);
                    }
                    return true;
                } else {
                    return false;
                }
            });
        }
    });
};

var roundClose = function(data, conn) {
    rounds.close(data, function(reply) {
        if (reply.error) {
            notify.fail(conn.socket, reply.msg, reply.data);
            conn.socket.emit('round close failed', null);
        } else {
            client.hgetall('round:' + data.round, function(err, reply) {
                cache.users.forEach(function(val) {
                    conn.io.sockets.connected[val.sid].leave('round room ' + data.round);
                });
                conn.io.to('session room ' + cache.session.id).emit('round closed', cache.rounds);
            });
        }
    });
}

module.exports.leave = roundLeave;
