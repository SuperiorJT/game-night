var client = require('../db');
var format = require('../response-format');
var users = require('../users');
var cache = require('../cache');
var games = require('../games/games');
var _ = require('lodash');

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
                        var admin = cache.users[data.admin];
                        if (admin) {
                            data.admin = admin;
                        }
                        games.getGameById(data.game, function(reply) {
                            data.game = reply;
                            data.users = {};
                            data.winners = {};
                            data.status = 1 + " / " + data.size;
                            cache.rounds[data.id] = data;
                            console.log(cache.rounds);
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
        var round = cache.rounds[data.round];
        if (round) {
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
                        cache.rounds[round.id].users[reply.id] = reply;
                        var roundUsers = cache.rounds[round.id].users;
                        cache.rounds[round.id].status = _.size(roundUsers) + " / " + round.size;
                        users.updateState(data.id, null, null, round.id);
                        client.hset('round:' + data.round, 'users', JSON.stringify(roundUsers));
                        callback(cache.rounds[round.id]);
                    }
                });
            }
        } else {
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
        var round = cache.rounds[data.round];
        if (round) {
            var user = cache.rounds[round.id].users[data.id];
            if (user) {
                delete cache.rounds[round.id].users[user.id];
                var roundUsers = cache.rounds[round.id].users;
                cache.rounds[round.id].status = _.size(roundUsers) + " / " + round.size;
                client.hset('round:' + data.round, 'users', JSON.stringify(roundUsers));
                users.updateState(data.id, null, null, 0);
                callback(round);
            } else {
                callback(format.fail("You are not in that lobby.", null));
            }
        } else {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.start = function(data, callback) {
    if (!data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var round = cache.rounds[data.round];
        if (round) {
            if (_.size(round.users) > 1) {
                var time = new Date().getTime();
                cache.rounds[round.id].startTime = time;
                cache.rounds[round.id].status = "In Progress";
                callback(cache.rounds[round.id]);
            } else {
                callback(format.fail("Not enough players to start game!", null));
            }
        } else {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.finish = function(data, callback) {
    if (!data.round) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var round = cache.rounds[data.round];
        if (round) {
            var time = new Date().getTime();
            cache.rounds[round.id].endTime = time;
            cache.rounds[round.id].status = "Finishing...";
            callback(round);
        } else {
            callback(format.fail("Lobby does not exist or is not available.", null));
        }
    }
};

module.exports.claimVictory = function(data, callback) {
    if (!data.id || !data.round || !data.place) {
        callback(format.fail("Missing required fields.", null));
    } else {
        var round = cache.rounds[data.round];
        if (round) {
            var currentTime = new Date().getTime();
            if (currentTime - round.endTime < 30000) {
                var user = cache.rounds[round.id].users[data.id];
                if (user) {
                    cache.rounds[round.id].winners[user.id] = {
                        user: user,
                        place: data.place
                    };
                    callback(cache.rounds[round.id]);
                } else {
                    callback(format.fail("You are not in this lobby!", null));
                }
            } else {
                callback(format.fail("You are too late to claim victory.", null));
            }
        } else {
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
        var round = cache.rounds[data.round];
        if (round) {
            cache.rounds[round.id].winners = data.winners;
            cache.session.rounds[round.id] = round;
            _.forEach(round.users, function(val) {
                users.updateState(val, null, null, 0);
            });
            callback(round);
        } else {
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
        var round = cache.rounds[data.round];
        if (round) {
            client.del('round:' + round.id);
            _.forEach(round.users, function(val) {
                users.updateState(val.id, null, null, 0);
            });
            delete cache.rounds[round.id];
            callback(round);
        } else {
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
    _.forEach(round.users, function(user) {
        var exp = baseExpReward * bonusExpMultiplier * expTimeMultiplier;
        var winner = round.winners[user.id];
        if (winner) {
            if (winner.place != _.size(round.users)) {
                expWinMultiplier = 1 + (expWinMod / winner.place);
            } else {
                expWinMultiplier = 1;
            }
            user.exp = user.exp + (exp * expWinMultiplier);
            cache.users[user.id].exp = Math.floor(user.exp);
            userCallback(null, cache.users[user.id]);
            client.hset('user:' + user.id, 'exp', Math.floor(user.exp));
            if (Math.floor(user.exp) >= ((user.rank + 1) * 1000)) {
                cache.users[user.id].rank++;
                client.hset('user:' + user.id, 'rank', user.rank);
            }
        }
    });
    resetRoundToIds(round.id);
    round.status = "Complete";
    client.hmset('round:' + round.id, cache.rounds[round.id], function() {
        delete cache.rounds[round.id];
        callback(null, round);
    });
};

function resetRoundToIds(id) {
    var users = [];
    var winners = [];
    var admin = cache.rounds[id].admin.id;
    var game = cache.rounds[id].game.id;

    _.forEach(cache.rounds[id].users, function(val) {
        users.push(val.id);
    });

    _.forEach(cache.rounds[id].winners, function(val) {
        winners.push({
            user: val.user.id,
            place: val.place
        });
    });

    cache.rounds[id].users = users;
    cache.rounds[id].winners = winners;
    cache.rounds[id].admin = admin;
    cache.rounds[id].game = game;
};
