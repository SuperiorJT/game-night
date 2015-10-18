var express = require('express');
var router = express.Router();
var client = require('../helpers/db');
var format = require('../helpers/response-format');

router.post('/', function(req, res) {
    var user = req.body;
    client.smembers('users', function(err, reply) {
        console.log(reply);
        var taken = false;
        for (var member in reply) {
            console.log(reply[member]);
            if (user.username == JSON.parse(reply[member]).username)
                taken = true;
        }
        if (!taken) {
            client.get('user:gen-id', function(err, reply) {
                client.set('user:' + reply + ':username', user.username);
                client.set('user:' + reply + ':password', user.password);
                client.incr('user:gen-id');
                client.sadd(['users', JSON.stringify({
                    "id": reply,
                    "username": user.username
                })]);
                res.status(200).json(format.success("successfully created user!", null));
            });
        } else {
            res.status(400).json(format.fail("user already exists for given username.", null));
        }
    });
});

module.exports = router;
