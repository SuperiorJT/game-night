var client = require('../helpers/db');
var bcrypt = require('bcrypt');
var format = require('./response-format');
var cache = require('./cache');
var _ = require('lodash');

module.exports.existsForUsername = function(name, callback) {
    client.smembers('users', function(err, reply) {
        var taken = false;
        var id = null;
        for (var member = 0; member < reply.length; member++) {
            if (name == JSON.parse(reply[member]).username) {
                taken = true;
                id = JSON.parse(reply[member]).id;
                member = reply.length;
            }
        }
        callback(taken, id);
    });
};

module.exports.create = function(user, callback) {
    client.get('user:gen-id', function(err, reply) {
        if (err) {
            callback(err, false);
            return;
        }
        bcrypt.hash(user.password, 10, function(err, hash) {
            if (err) {
                callback(err, false);
                return;
            }
            client.hmset('user:' + reply, {
                "id": reply,
                "username": user.username,
                "password": hash,
                "admin": false,
                "exp": 0,
                "rank": 0,
                "skill": JSON.stringify([]),
                "session": 0,
                "lobby": 0,
                "online": false,
                "avatar": 0
            });
            client.sadd(['users', JSON.stringify({
                "id": reply,
                "username": user.username
            })]);
            client.incr('user:gen-id');
            callback(null, reply);
        });
    });
};

module.exports.changePassword = function(data, callback) {
    client.hget('user:' + data.id, 'password', function(err, reply) {
        if (err) {
            callback(err, false);
            return;
        }
        bcrypt.compare(data.oldPass, reply, function(err, res) {
            if (err) {
                callback(err, false);
                return;
            }
            if (res) {
                bcrypt.hash(data.newPass, 10, function(err, hash) {
                    client.hset('user:' + data.id, 'password', hash, function() {
                        callback(null, true);
                    });
                });
            } else {
                callback(null, false);
            }
        });
    });
};

module.exports.login = function(password, id, callback) {
    client.hget('user:' + id, "password", function(err, reply) {
        bcrypt.compare(password, reply, function(err, res) {
            if (err) {
                callback(false);
            } else {
                callback(res);
            }
        });
    });
};

module.exports.checkStatus = function(id, callback) {
    var user = cache.users[id];
    if (user) {
        callback(user);
    } else {
        callback(format.fail("This account is not logged in!", null));
    }
};

module.exports.updateState = function(id, online, sessionId, lobbyId) {
    client.smembers('users', function(err, reply) {
        _.forEach(reply, function(val, key) {
            reply[key] = JSON.parse(val);
            reply[key].id = parseInt(reply[key].id);
        });
        if (_.find(reply, {'id': id})) {
            if (online != null) {
                if (cache.users[id]) {
                    cache.users[id].online = online;
                }
                client.hset('user:' + id, 'online', online);
            }
            if (lobbyId != null) {
                if (cache.users[id]) {
                    cache.users[id].lobby = lobbyId;
                }
                client.hset('user:' + id, 'lobby', lobbyId);
            }
            if (sessionId != null) {
                if (cache.users[id]) {
                    cache.users[id].session = sessionId;
                }
                client.hset('user:' + id, 'session', sessionId);
            }
        }
    });
};
