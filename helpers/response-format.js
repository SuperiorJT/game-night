var pass = {
    "error": false,
    "msg": "call successful"
};

var err = {
    "error": true,
    "msg": "call unsuccessful"
};

var replaceResponseValues = function(val, msg, data) {
    if (msg) {
        val.msg = msg;
    }
    if (data) {
        val.data = data;
    }
    return val;
};

var format = {};

format.success = function(msg, data) {
    return replaceResponseValues(pass, msg, data);
};

format.fail = function(msg, data) {
    return replaceResponseValues(err, msg, data);
};

module.exports = format;
