var client = require('../db');
var format = require('../response-format');

module.exports.create = function(data, callback) {
    if (!data.name || !data.type) {
        callback(null, format.fail("missing required fields.", null));
    } else {
        client.get('game:gen-id', function(err, reply) {
            if (err) {
                callback(err, false);
            } else {
                var img = encodeURIComponent(data.name);
                data.img = JSON.stringify({

                    icon: "http://static-cdn.jtvnw.net/ttv-boxart/" + img + "-52x72.jpg",
                    small: "http://static-cdn.jtvnw.net/ttv-boxart/" + img + "-143x200.jpg",
                    medium: "http://static-cdn.jtvnw.net/ttv-boxart/" + img + "-272x380.jpg",
                    large: "http://static-cdn.jtvnw.net/ttv-boxart/" + img + ".jpg"

                });
                data.id = reply;
                client.hmset('game:' + reply, data, function(err, reply) {
                    if (err) {
                        callback(err, false);
                    } else {
                        client.incr('game:gen-id');
                        callback(null, reply);
                    }
                });
            }
        });
    }
};
