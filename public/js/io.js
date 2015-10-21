var socket = io();

var state = {
    online : false,
    admin : false,
    session : {},
    games : [],
    rounds : []
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
    }
    socket.on('logged in', function(data) {
        state.online = true;
        state.admin = data;
        transition.login();
        socket.emit('session start', {
            id: localStorage.userID
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
            socket.on('receive games', function(data) {
                state.games = data;
            });
            socket.on('receive rounds', function(data) {
                state.rounds = data;
            });
            transition.joinSession();
        });
    });
    socket.on('notification', function(data) {
        console.log(data.msg);
    });
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
