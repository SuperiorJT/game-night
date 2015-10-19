var express = require('express');
var router = express.Router();
var client = require('../helpers/db');
var format = require('../helpers/response-format');
var users = require('../helpers/users');

router.post('/', function(req, res) {
    var user = req.body;
    users.existsForUsername(user.username, function(taken) {
        if (!taken) {
            console.log(user);
            users.create(user, function() {
                res.status(200).json(format.success("successfully created user!", null));
            })
        } else {
            res.status(400).json(format.fail("user already exists for given username.", null));
        }
    });
});

module.exports = router;
