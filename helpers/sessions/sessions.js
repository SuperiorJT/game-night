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

/*

    State Change: User is transferred to current session

*/

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
                    client.hset('session:' + cache.session.id, 'attendees', JSON.stringify(cache.session.attendees));
                }
                users.updateState(reply.id, null, cache.session.id, null);
                callback(true);
            }
        });
    }
};

/*

    State Change: User is removed from current session

*/

module.exports.leave = function(data, callback) {
    users.checkStatus(data.id, function(reply) {
        if (reply.error) {
            callback(reply);
        } else {
            users.updateState(reply.idea, null, 0, null);
            callback(true);
        }
    });
};

/*

    State Change: All session attendees are removed from current lobby and session

*/
module.exports.end = function(data, callback) {
    if (!cache.session.id) {
        callback(format.fail("Session must be started before ending one", null));
    } else {
        cache.session.attendees.forEach(function(val) {
            users.updateState(val, null, 0, 0);
        });
        client.hset('session:' + data.id, 'attendees', JSON.stringify(cache.session.attendees));
        client.hset('session:' + data.id, 'rounds', JSON.stringify(cache.session.rounds));
        cache.session = {};
        callback(null, true);
    }
};
