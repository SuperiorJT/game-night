var format = require('./response-format');

module.exports.success = function(channel, msg, data) {
    channel.emit('notification', format.success(msg, data));
}

module.exports.fail = function(channel, msg, data) {
    channel.emit('notification', format.fail(msg, data));
}
