var games = require('./games');
var client = require('../db');
var notify = require('../socket-notifications');

module.exports.init = function(conn) {
    conn.socket.on('create game', function(data) {
        client.hget('user:' + data.id, 'admin', function(err, reply) {
            if (err) {
                notify.fail(conn.socket, "Could not create game", null);
            } else if (reply) {
                games.create(data.data, function(err, reply) {
                    if (err) {
                        notify.fail(conn.socket, "Could not create game", null);
                    } else if (reply.error) {
                        notify.fail(conn.socket, reply.msg, null);
                    } else {
                        console.log(data.data.name + " has been added to the games list!");
                        notify.success(conn.socket, data.data.name + " has been added to the games list!", null);
                    }
                });
            } else {
                notify.fail(conn.socket, "You are not authorized to create a game", null);
            }
        });
    });



    conn.socket.on('fetch games', function() {
        loadGames(conn);
    });
};

module.exports.emitGames = function(conn) {
    loadGames(conn);
};

var loadGames = function(conn) {
    var multi = client.multi();
    client.get('game:gen-id', function(err, reply) {
        if (err) {
            notify.fail(conn.socket, "Could not download list of games", null);
        } else {
            for (var i = 1; i < reply; i++) {
                multi.hgetall('game:' + i);
            }
            multi.exec(function(err, replies) {
                if (err || !replies.length) {
                    notify.fail(conn.socket, "Could not download list of games", null);
                } else {
                    var output = [];
                    for (reply in replies) {
                        if (reply) {
                            replies[reply].img = JSON.parse(replies[reply].img);
                            output.push(replies[reply]);
                        }
                    }
                    conn.socket.emit('receive games', output);
                }
            });
        }
    });
}
