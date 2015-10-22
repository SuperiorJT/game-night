var socket = io();

var state = {
    online : false,
    admin : false,
    session : null,
    games : [],
    rounds : [],
    round : null
};

var transition = {

    login: function() {
        console.log("login transition");
    },

    joinSession: function() {
        console.log("session transition");
    }

};

socket.on('connect', function() {
    console.log("Successfully connected to the game night server!");
    if (localStorage.userID) {
        socket.emit('login', localStorage.userID);
        if (state.session) {
            socket.emit('fetch all')
            socket.emit('session join', {
                id: localStorage.userID
            });
            if (state.round) {

            }
        }
    }
});

socket.on('disconnect', function() {
    console.log("Disconnected to the game night server!");
});

socket.on('reconnect', function() {
    if (localStorage.userID) {
        console.log("Successfully reconnected to the game night server!");
    }
});

socket.on('notification', function(data) {
    console.log(data.msg);
});

socket.on('logged in', function(data) {
    state.online = true;
    state.admin = data;
    transition.login();
    socket.emit('session start', {
        id: localStorage.userID
    });
});

socket.on('session started', function() {
    socket.emit('session join', {
        id: localStorage.userID
    });
});

socket.on('session joined', function(data) {
    state.session = data;
    socket.emit('fetch games');
    socket.emit('fetch rounds');
    transition.joinSession();
});

socket.on('receive games', function(data) {
    state.games = data;
});

socket.on('receive rounds', function(data) {
    state.rounds = data;
});

var userInput = $('input#username');
var passInput = $('input#password');
var formInput = $('.login-form .form-control');

console.log(formInput);

$('#login').click(function() {
    if (userInput.val() == "") {
        userInput.parent().addClass('has-error');
        return false;
    }
    if (passInput.val() == "") {
        passInput.parent().addClass('has-error');
        return false;
    }
    $('.login-form input').prop('disabled', true);
    $.ajax({
        type: "POST",
        url: "api/user/login",
        contentType: 'application/json',
        data: JSON.stringify({
            "username": userInput.val(),
            "password": passInput.val()
        })
    })
    .always(function() {
        console.log("called");
        $('.login-form input').prop('disabled', false);
    })
    .fail(function(data) {

    })
    .done(function(data) {
        console.log(data.data);
        localStorage.userID = data.data;
    });
    return false;
});

formInput.change(function(e) {
    if ($(e.target).parent().hasClass('has-error')) {
        $(e.target).parent().removeClass('has-error');
    }
});

// socket.emit('create game', {
//
//     id: 1,
//     data: {
//         name: "Halo: The Master Chief Collection",
//         type: "First Person"
//     }
//
// });
