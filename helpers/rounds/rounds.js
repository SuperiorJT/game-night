var client = require('../db');
var format = require('../response-format');
var users = require('../users');
var cache = require('../cache');
var games = require('../games/games');

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
                        var admin = cache.users.filter(function(val) {
                            return val.id == data.admin;
                        })[0];
                        if (admin) {
                            data.admin = admin;
                        }
                        games.getGameById(data.game, function(reply) {
                            data.game = reply;
                            data.users = [];
                            data.winners = [];
                            data.status = 1 + " / " + data.size;
                            cache.rounds.push(data);
                            client.incr('round:gen-id');
                            callback(null, data);
                        });
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
                            cache.rounds[index].users.push(reply);
                            var roundUsers = cache.rounds[index].users;
                            roundUsers.forEach(function(val, index) {
                                roundUsers[index] = val;
                            });
                            cache.rounds[index].status = roundUsers.length + " / " + round.size;
                            users.updateState(data.id, null, null, round.id);
                            client.hset('round:' + data.round, 'users', JSON.stringify(roundUsers));
                            callback(cache.rounds[index]);
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
                    if (user.id == data.id) {
                        userFound = true;
                        cache.rounds[index].users = cache.rounds[index].users.filter(function(val) {
                            return val.id != user.id;
                        });
                        var roundUsers = cache.rounds[index].users;
                        roundUsers.forEach(function(val, index) {
                            roundUsers[index] = val;
                        });
                        cache.rounds[index].status = roundUsers.length + " / " + round.size;
                        client.hset('round:' + data.round, 'users', JSON.stringify(roundUsers));
                        users.updateState(data.id, null, null, 0);
                        callback(round);
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
                if (round.users.length > 1) {
                    var time = new Date().getTime();
                    cache.rounds[index].startTime = time;
                    cache.rounds[index].status = "In Progress";
                    callback(cache.rounds[index]);
                } else {
                    callback(format.fail("Not enough players to start game!", null));
                }
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
                cache.rounds[index].status = "Finishing...";
                callback(round);
            }
            return roundFound;
        });
        if (!roundFound) {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.claimVictory = function(data, callback) {
    if (!data.id || !data.round || !data.place) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var roundFound = false;
        cache.rounds.some(function(round, index, array) {
            if (round.id == data.round) {
                roundFound = true;
                var currentTime = new Date().getTime();
                if (currentTime - round.endTime < 30000) {
                    var userFound = cache.rounds[index].users.some(function(val) {
                        if (val.id == data.id) {
                            cache.rounds[index].winners.push({
                                user: val,
                                place: data.place
                            });
                            callback(cache.rounds[index]);
                            return true;
                        } else {
                            return false;
                        }
                    });
                    if (!userFound) {
                        callback(format.fail("You are not in this lobby!", null));
                    }
                } else {
                    callback(format.fail("You are too late to claim victory.", null));
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
                cache.rounds[index].winners = data.winners;
                if (cache.session.rounds.indexOf(data.round.id) == -1) {
                    cache.session.rounds.push(data.round.id);
                }
                round.users.forEach(function(val) {
                    users.updateState(val, null, null, 0);
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
                    users.updateState(val.id, null, null, 0);
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

module.exports.updateStats = function(round, userCallback, callback) {
    var length = round.endTime - round.startTime;
    var expTimeMultiplier = length / 100000;
    var expWinMultiplier = 1;
    var expWinMod = .25;
    var baseExpReward = 25;
    var bonusExpMultiplier = 1;
    round.users.forEach(function(user) {
        var exp = baseExpReward * bonusExpMultiplier * expTimeMultiplier;
        var winner = round.winners.filter(function(val) {
            return val.user.id == user.id;
        })[0];
        if (winner.place != round.users.length) {
            expWinMultiplier = 1 + (expWinMod / winner.place);
        } else {
            expWinMultiplier = 1;
        }
        user.exp = user.exp + (exp * expWinMultiplier);
        cache.users.some(function(val, index) {
            if (val.id == user.id) {
                cache.users[index].exp = Math.floor(user.exp);
                userCallback(null, cache.users[index]);
                return true;
            }
            return false;
        });
        client.hset('user:' + user.id, 'exp', Math.floor(user.exp));
    });
    cache.rounds.some(function(val, index) {
        if (val.id == round.id) {
            resetRoundToIds(index);
            round.status = "Complete";
            client.hmset('round:' + val.id, cache.rounds[index], function() {
                cache.rounds = cache.rounds.filter(function(val) {
                    return val.id != round.id;
                });
                callback(null, round);
            });
            return true;
        } else {
            return false;
        }
    });
}

function resetRoundToIds(index) {
    var users = [];
    var winners = [];
    var admin = cache.rounds[index].admin.id;
    var game = cache.rounds[index].game.id;

    cache.rounds[index].users.forEach(function(val) {
        users.push(val.id);
    });

    cache.rounds[index].winners.forEach(function(val) {
        winners.push({
            user: val.user.id,
            place: val.place
        });
    });

    cache.rounds[index].users = users;
    cache.rounds[index].winners = winners;
    cache.rounds[index].admin = admin;
    cache.rounds[index].game = game;
};
