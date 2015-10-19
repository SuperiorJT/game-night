var client = require('../helpers/db');

module.exports.create = function(data, callback) {
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
