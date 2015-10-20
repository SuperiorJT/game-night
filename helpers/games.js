var client = require('../helpers/db');
var format = require('../helpers/response-format');

module.exports.create = function(data, callback) {
    if (data.img == null || data.name == null || data.type = null) {
        callback(null, format.fail("missing required fields.", null);
    }
    client.get('game:gen-id', function(err, reply) {
        if (err) {
            callback(err, false);
        }
        client.hmset('game:' + reply, data, function(err, reply) {
            if (err) {
                callback(err, false);
            }
            callback(null, reply);
        });
    });
};
