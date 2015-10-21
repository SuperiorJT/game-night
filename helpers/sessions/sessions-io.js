var sessions = require('./sessions');
var client = require('../db');
var notify = require('../socket-notifications');
var cache = require('../cache');

module.exports.init = function(conn) {

    conn.socket.on('session start', function(data) {
        var user = cache.users.filter(function(val) {
            return val.id == data.id;
        })[0];
        if (user.admin) {
            sessions.start(data, function(err, reply) {
                if (err) {
                    notify.fail(conn.socket, "Could not start session", null);
                } else if (reply.error) {
                    notify.fail(conn.socket, reply.msg, reply.data);
                } else {
                    notify.success(conn.io, "New session started!", null);
                    conn.io.emit('session started', reply);
                }
            });
        } else {
            notify.fail(conn.socket, "You are not authorized to start a session", null);
        }
    });

    conn.socket.on('session join', function(data) {
        sessions.join(data, function(reply) {
            if (reply.error) {
                notify.fail(conn.socket, reply.msg, reply.data);
                conn.socket.emit('session join failed', null);
            } else {
                client.hget('user:' + data.id, 'username', function(err, reply) {
                    conn.socket.emit('session joined', cache.session);
                    conn.socket.join('session room ' + cache.session.id);
                    notify.success(conn.io, reply + " joined the session!", null);
                });
            }
        });
    });

    conn.socket.on('session end', function(data) {
        var user = cache.users.filter(function(val) {
            return val.id == data.id;
        })[0];
        if (user.admin) {
            sessions.end(data, function(err, reply) {
                if (err) {
                    notify.fail(conn.socket, "Could not end session", null);
                } else if (reply.error) {
                    notify.fail(conn.socket, reply.msg, reply.data);
                } else {
                    conn.io.emit('session ended', reply);
                }
            });
        } else {
            notify.fail(conn.socket, "You are not authorized to end a session", null);
        }
    });

}
