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

    loginTo: function() {
        $(".login")
        .attr('style', 'display: -webkit-flex; display: flex; display: -ms-flexbox;')
        .hide()
        .fadeIn();
    },

    loginFrom: function() {
        console.log("login transition");
        $('.login').fadeOut('fast', function() {
            $('.pre-session').fadeIn('fast', function() {
                
            });
        });
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
    } else {
        transition.loginTo();
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
    notifications.notify(data);
});

socket.on('logged in', function(data) {
    state.online = true;
    state.admin = data;
    transition.loginFrom();
});

socket.on('login failed', function() {
    console.log("login failed");
    transition.loginTo();
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

// socket.emit('create game', {
//
//     id: 1,
//     data: {
//         name: "Halo: The Master Chief Collection",
//         type: "First Person"
//     }
//
// });
