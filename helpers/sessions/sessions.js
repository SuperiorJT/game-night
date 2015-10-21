var client = require('../db');
var format = require('../response-format');
var users = require('../users');
var cache = require('../cache');

module.exports.start = function(data, callback) {
    if (!cache.session.id) {
        client.get('session:gen-id', function(err, reply) {
            if (err) {
                callback(err, false);
            } else {
                var date = new Date().getTime();
                data.id = reply;
                data.date = date;
                data.attendees = "[]";
                data.rounds = "[]"
                client.hmset('session:' + reply, data, function(err, reply) {
                    if (err) {
                        callback(err, false);
                    } else {
                        data.attendees = [];
                        data.rounds = [];
                        cache.session = data;
                        client.incr('session:gen-id');
                        callback(null, data);
                    }
                });
            }
        });
    } else {
        callback(null, format.fail("Session is already in progress", null));
    }
};

module.exports.join = function(data, callback) {
    if (!cache.session.id) {
        callback(format.fail("Session must be started before joining one", null));
    } else {
        users.checkStatus(data.id, function(reply) {
            if (reply.error) {
                callback(reply);
            } else {
                if (cache.session.attendees.indexOf(data.id) == -1) {
                    cache.session.attendees.push(data.id);
                }
                users.updateState(reply.idea, cache.session.id, null);
                callback(true);
            }
        });
    }
};

module.exports.end = function(data, callback) {
    if (!cache.session.id) {
        callback(format.fail("Session must be started before ending one", null));
    } else {
        cache.session.attendees.forEach(function(val) {
            client.hset('user:' + val, 'session', 0);
        });
        client.hset('session:' + data.id, 'attendees', JSON.stringify(cache.session.attendees));
        client.hset('session:' + data.id, 'rounds', JSON.stringify(cache.session.rounds));
        cache.session = {};
        callback(true);
    }
};
