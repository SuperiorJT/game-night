function pass() {
    this.error = false;
    this.msg = "call successful";
}

function err() {
    this.error = true;
    this.msg = "call unsuccessful";
};

function none() {
    this.error = null;
    this.msg = "call neutral";
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
    return replaceResponseValues(new pass(), msg, data);
};

format.fail = function(msg, data) {
    return replaceResponseValues(new err(), msg, data);
};

format.neutral = function(msg, data) {
    return replaceResponseValues(new none(), msg, data);
};

module.exports = format;
