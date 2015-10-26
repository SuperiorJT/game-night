var client = require('../db');
var format = require('../response-format');
var users = require('../users');
var cache = require('../cache');

module.exports.create = function(data, callback) {
    if (!cache.session.id) {
        callback(null, format.fail("Session must be started before creating a lobby", null));
    }
    if (!data.game || !data.admin || !data.size) {
        callback(null, format.fail("Missing required fields.", null));
    } else {
        client.get('round:gen-id', function(err, reply) {
            if (err) {
                callback(err, false);
            } else {
                data.id = reply;
                data.startTime = 0;
                data.endTime = 0;
                data.users = "[]";
                data.winners = "[]";
                data.session = cache.session.id;
                client.hmset('round:' + reply, data, function(err, reply) {
                    if (err) {
                        callback(err, false);
                    } else {
                        data.users = [];
                        data.winners = [];
                        cache.rounds.push(data);
                        client.incr('round:gen-id');
                        callback(null, reply);
                    }
                });
            }
        });
    }
};

/*

    State Change: User is added to lobby

*/
module.exports.join = function(data, callback) {
    if (!data.id || !data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index) {
            if (round.id == data.round) {
                roundFound = true;
                if (round.users.length == round.size) {
                    callback(format.fail("Lobby is full."), null);
                } else if (round.startTime) {
                    callback(format.fail("Cannot join lobby while round is in progress."), null);
                } else {
                    users.checkStatus(data.id, function(reply) {
                        if (reply.error) {
                            callback(reply);
                        } else if (reply.lobby) {
                            callback(format.fail("You are already in a lobby!", null));
                        } else {
                            cache.rounds[index].users.push(data.id);
                            users.updateState(data.id, null, null, round.id);
                            client.hset('round:' + data.round, 'users', JSON.stringify(users));
                            callback(true);
                        }
                    });
                }
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

/*

    State Change: User is removed from lobby

*/
module.exports.leave = function(data, callback) {
    if (!data.id || !data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                var userFound = false;
                cache.rounds[index].users.some(function(user, userIndex) {
                    if (user == data.id) {
                        userFound = true;
                        cache.rounds[index].users = cache.rounds[index].users.filter(function(val) {
                            return val.id != user.id;
                        });
                        client.hset('round:' + data.round, 'users', JSON.stringify(users));
                        users.updateState(data.id, null, null, 0);
                        callback(true);
                    }
                    return userFound;
                });
                if (!userFound) {
                    callback(format.fail("You are not in that lobby.", null));
                }
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.start = function(data, callback) {
    if (!data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                var time = new Date().getTime();
                cache.rounds[index].startTime = time;
                callback(true);
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.finish = function(data, callback) {
    if (!data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                var time = new Date().getTime();
                cache.rounds[index].endTime = time;
                callback(true);
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.claimVictory = function(data, callback) {
    if (!data.id || !data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                if (cache.rounds[index].users.indexOf(data.id) != -1) {
                    cache.rounds[index].winners.push(data.id);
                    callback(true);
                } else {
                    callback(format.fail("You are not in this lobby!", null));
                }
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

/*

    State Change: User is removed from lobby

*/
module.exports.declareWinners = function(data, callback) {
    if (!data.round || !data.winners) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                cache.rounds[index].winners = JSON.stringify(data.winners);
                cache.rounds[index].users = JSON.stringify(cache.rounds[index].users);
                client.hset('round:' + data.round, 'users', JSON.stringify(cache.rounds[index].users));
                client.hset('round:' + data.round, 'winners', JSON.stringify(cache.rounds[index].winners));
                if (cache.session.rounds.indexOf(data.round) == -1) {
                    cache.session.rounds.push(data.round);
                }
                round.users.forEach(function(val) {
                    users.updateState(val, null, null, 0);
                });
                cache.rounds = cache.rounds.filter(function(val) {
                    return val.id != round.id;
                });
                callback(round);
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

/*

    State Change: All users in lobby are removed from lobby

*/
module.exports.close = function(data, callback) {
    if (!data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                client.del('round:' + round.id);
                round.users.forEach(function(val) {
                    users.updateState(val, null, null, 0);
                });
                cache.rounds = cache.rounds.filter(function(val) {
                    return val.id != round.id;
                });
                callback(round);
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.updateStats = function(round, callback) {
    var length = round.endTime - round.startTime;
    var expTimeMultiplier = length / 100000;
    var expWinMultiplier = 1.25;
    var baseExpReward = 25;
    var bonusExpMultiplier = 1;
    client.hgetall('exp', function(err, reply) {
        if (err) {
            callback(err, false);
        }
        baseExpReward = reply.base;
        bonusExpMultiplier = reply.bonus;

        round.users.forEach(function(id) {
            client.hget('user:' + id, 'exp', function(err, reply) {
                if (err) {
                    callback(err, false);
                } else {
                    reply += baseExpReward * bonusExpMultiplier * expTimeMultiplier;
                    if (round.winners.indexOf(id) != -1) {
                        reply = reply * expWinMultiplier;
                    }
                    cache.users.some(function(val, index) {
                        if (val.id == id) {
                            cache.users[index].exp = reply;
                            callback(null, val);
                            return true;
                        }
                        return false;
                    });
                    client.hset('user:' + id, 'exp', reply);
                }
            });
        });
    });
}
