var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var client = require('../helpers/db');
var format = require('../helpers/response-format');
var users = require('../helpers/users');

router.post('/', function(req, res) {
    var user = req.body;
    users.existsForUsername(user.username, function(taken, id) {
        if (taken) {
            users.login(user.password, id, function(valid) {
                if (valid) {
                    res.status(200).json(format.success("successfully logged in!", id));
                } else {
                    res.status(400).json(format.fail("username or password is incorrect.", null));
                }
            });
        } else {
            res.status(400).json(format.fail("username or password is incorrect.", null));
        }
    });
});

module.exports = router;
