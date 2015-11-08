var socket = io();

var state = {
    online : false,
    admin : false,
    session : null,
    sessionAvailable : false,
    games : [],
    rounds : [],
    round : null,
    user : null,
    users : []
};

var sessionAutoJoin = false;

var transition = {

    loginTo: function() {
        $(".login")
        .attr('style', 'display: -webkit-flex; display: flex; display: -ms-flexbox;')
        .hide()
        .fadeIn();
    },

    loginFrom: function() {
        console.log("loginFrom transition");
        $('.login').fadeOut('fast', function() {
            transition.sessionTo();
        });
    },

    sessionTo: function() {
        console.log("sessionTo transition");
        if (state.admin) {
            $('#trigger-session').show();
        }
        if (state.session || state.user.session) {
            $('#join-session').html('Leave Session');
        }
        $('.username').html(state.user.username);
        $('.session')
        .attr('style', 'display: -webkit-flex; display: flex; display: -ms-flexbox;')
        .hide()
        .fadeIn('fast');
    },

    sessionJoin: function() {
        console.log("session join transition");
        $('#join-session').html('Leave Session');
        $('#join-session').show();
        $('#auto-join-session').hide();
        $('#auto-join-session').text("Auto-Join Session");
        $('.session-buttons .fa').hide();
    },

    sessionLeave: function() {
        console.log("session leave transition");
        $('#join-session').html('Join Session');
    },

    sessionToLogin: function() {
        console.log("sessionFrom transition");
        if (state.admin) {
            $('#trigger-session').hide();
        }
        $('.session').fadeOut();
        transition.loginTo();
    },

    sessionToLobby: function() {
        $('.lobby-active-leader-value').text(state.round.admin.username);
        $('.lobby-active-game-value').text(state.round.game.name);
        $('.lobby-active-status-value').text(state.round.status);
        if (state.round.admin.id == localStorage.userID) {
            $('#round-start').show();
        }
        $('.lobby-active-panel').fadeIn('fast');
        $('.lobby-panel, .activity-panel, .popup').fadeOut('fast');
    },

    lobbyToSession: function() {
        $('.lobby-active-panel').fadeOut('fast');
        $('.lobby-panel, .activity-panel').fadeIn('fast');
        $('.lobby-active-leader-value').text('');
        $('.lobby-active-game-value').text('');
        $('.lobby-active-status-value').text('');
        $('#round-start').hide();
    }
};

var sessionStatus = {

    sessionAvailable: function() {
        $('.lobby-status').text('Join current session to view lobbies');
        $('#auto-join-session').hide();
        $('#join-session').show();
    },

    sessionUnavailable: function() {
        $('.lobby-status').text('No sessions in progress');
    },

    sessionAutoJoin: function() {
        $('.lobby-status').text('Waiting to join next available session');
    },

    lobbyNotFound: function() {
        $('.lobby-status').text('There are no active lobbies in this session');
    }

};

socket.on('connect', function() {
    console.log("Successfully connected to the game night server!");
    if (localStorage.userID) {
        socket.emit('login', localStorage.userID);
    } else {
        transition.loginTo();
    }
});

socket.on('disconnect', function() {
    console.log("Disconnected from the game night server!");
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
    state.user = data.user;
    state.admin = data.user.admin;
    state.sessionAvailable = data.session;
    if (state.sessionAvailable) {
        $('#trigger-session').html('End Session');
        sessionStatus.sessionAvailable();
    }
    if (state.session || state.user.session) {
        socket.emit('session join', {
            id: localStorage.userID
        });
    }
    transition.loginFrom();
});

socket.on('login failed', function() {
    console.log("login failed");
    transition.loginTo();
});

socket.on('receive games', function(data) {
    state.games = data;
});

// socket.emit('create game', {
//
//     id: 1,
//     data: {
//         name: "Super Smash Bros. for Wii U",
//         type: "Fighting"
//     }
//
// });

// socket.emit('create game', {
//
//     id: 1,
//     data: {
//         name: "Halo: The Master Chief Collection",
//         type: "First Person Shooter"
//     }
//
// });
