function pass() {
    this.error = false;
    this.msg = "call successful";
}

function err (){
    this.error = true;
    this.msg = "call unsuccessful";
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

module.exports = format;
