var client = require('../helpers/db');
var bcrypt = require('bcrypt');
var format = require('./response-format');
var cache = require('./cache');

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
                "sessions": JSON.stringify([])
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
    var userFound = false;
    cache.users.some(function(user) {
        if (user.id == id) {
            userFound = true;
            callback(format.success(user));
        }
        return userFound;
    });
    if (!userFound) {
        callback(format.fail("This account is not logged in!", null));
    }
}
