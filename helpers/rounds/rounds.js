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
                            var users = cache.rounds[index].users;
                            users.push(data.id);
                            cache.rounds[index].users = users;
                            cache.users.some(function(user, index, array) {
                                if (data.id == user.id) {
                                    array[index].lobby = round.id;
                                }
                            });
                            reply.lobby = round.id;
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

module.exports.leave = function(data, callback) {
    if (!data.id || !data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                var users = array[index].users;
                var userFound = false;
                users.some(function(user, userIndex) {
                    if (user == data.id) {
                        userFound = true;
                        users = users.filter(function(val) {
                            return val.id != user.id;
                        });
                        cache.rounds[index].users = users;
                        client.hset('round:' + data.round, 'users', JSON.stringify(users));
                        cache.users.some(function(val, index, array) {
                            if (user == val.id) {
                                cache.users[index].lobby = null;
                                return true;
                            }
                            return false;
                        });
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
                cache.rounds = cache.rounds.filter(function(val) {
                    return val.id != round.id;
                });
                updateStats(round);
                callback(round);
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.close = function(data, callback) {
    if (!data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                client.del('round:' + round.id);
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

var updateStats = function(round) {
    var length = round.endTime - round.startTime;
    var expTimeMultiplier = length / 100000;
    var expWinMultiplier = 1.25;
    var baseExpReward = 25;
    var bonusExpMultiplier = 1;
    client.hgetall('exp', function(err, reply) {
        if (err) {
            throw err;
        }
        baseExpReward = reply.base;
        bonusExpMultiplier = reply.bonus;

        round.users.forEach(function(id) {
            client.hget('user:' + id, 'exp', function(err, reply) {
                if (err) {
                    throw err;
                } else {
                    reply += baseExpReward * bonusExpMultiplier * expTimeMultiplier;
                    if (round.winners.indexOf(id) != -1) {
                        reply = reply * 1.25;
                    }
                    client.hset('user:' + id, 'exp', reply);
                }
            });
        });
    });
}
