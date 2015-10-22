var express = require('express');
var router = express.Router();
var client = require('../helpers/db');
var format = require('../helpers/response-format');
var users = require('../helpers/users');

router.post('/register', function(req, res) {
    var user = req.body;
    users.existsForUsername(user.username, function(taken) {
        if (!taken) {
            users.create(user, function(err, reply) {
                res.status(200).json(format.success("successfully created user!", null));
            })
        } else {
            res.status(400).json(format.fail("user already exists for given username.", null));
        }
    });
});

router.post('/login', function(req, res) {
    var user = req.body;
    console.log(user);
    users.existsForUsername(user.username, function(taken, id) {
        if (taken) {
            users.login(user.password, id, function(valid) {
                if (valid) {
                    res.status(200).json(format.success("successfully logged in!", parseInt(id)));
                } else {
                    res.status(400).json(format.fail("username or password is incorrect.", null));
                }
            });
        } else {
            res.status(400).json(format.fail("username or password is incorrect.", null));
        }
    });
});

router.put('/change-password', function(req, res) {
    var data = req.body;
    users.changePassword(data, function(err, valid) {
        if (err) {
            res.status(400).json(format.fail("could not change password.", null));
        }
        if (valid) {
            res.status(200).json(format.success("password changed!", null));
        } else {
            res.status(400).json(format.fail("old password does not match current.", null));
        }
    });
});

module.exports = router;
