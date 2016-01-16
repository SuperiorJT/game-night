var sessions = require('./sessions');
var client = require('../db');
var notify = require('../socket-notifications');
var cache = require('../cache');
var _ = require('lodash');

module.exports.init = function(conn) {

    conn.socket.on('session start', function(data) {
        var user = cache.users[data.id];
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
                var user = cache.users[data.id];
                conn.socket.emit('session joined', cache.session);
                conn.io.to('session room ' + cache.session.id).emit('session user joined', user);
                conn.socket.join('session room ' + cache.session.id);
                notify.neutral(conn.io.to('session room ' + cache.session.id), user.username + " joined the session!", null);
            }
        });
    });

    conn.socket.on('session leave', function(data) {
        sessionLeave(data, conn);
    });

    conn.socket.on('session end', function(data) {
        var user = cache.users[data.id];
        if (user.admin) {
            sessions.end(data, function(err, reply) {
                if (err) {
                    notify.fail(conn.socket, "Could not end session", null);
                } else if (reply.error) {
                    notify.fail(conn.socket, reply.msg, reply.data);
                } else {
                    _.forEach(cache.users, function(val) {
                        conn.io.sockets.connected[val.sid].leave('session room ' + cache.session.id);
                    });
                    notify.neutral(conn.io, 'The current session has ended!', null);
                    conn.io.emit('session ended', reply);
                }
            });
        } else {
            notify.fail(conn.socket, "You are not authorized to end a session", null);
        }
    });

}

var sessionLeave = function(data, conn) {
    sessions.leave(data, function(reply) {
        if (reply.error) {
            notify.fail(conn.socket, reply.msg, reply.data);
            conn.socket.emit('session leave failed', null);
        } else {
            var user = cache.users[data.id];
            conn.socket.emit('session left', null);
            conn.socket.leave('session room ' + cache.session.id);
            conn.io.to('session room ' + cache.session.id).emit('session user left', user);
            notify.success(conn.io, user.username + " left the session!", null);
        }
    });
}

module.exports.leave = sessionLeave;
