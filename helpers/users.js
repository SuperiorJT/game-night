var client = require('../helpers/db');
var bcrypt = require('bcrypt');

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
        bcrypt.hash(user.password, 10, function(err, hash) {
            client.hmset('user:' + reply, {
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
            callback();
        });
    });
};

module.exports.changePassword = function(data, callback) {
    client.hget('user:' + data.id, 'password', function(err, reply) {
        bcrypt.compare(data.oldPass, reply, function(err, res) {
            if (err) {
                callback(false);
            }
            if (res) {
                bcrypt.hash(data.newPass, 10, function(err, hash) {
                    client.hset('user:' + data.id, 'password', hash, function() {
                        callback(true);
                    });
                });
            } else {
                callback(false);
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
