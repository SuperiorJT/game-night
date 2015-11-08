var roundUsers = [];

socket.on('round created', function(data) {
    state.rounds.push(data);
    updateDisplayedRounds();
    if (data.admin.id == localStorage.userID) {
        socket.emit('round join', {
            id: localStorage.userID,
            round: data.id
        });
    }
});

socket.on('round joined', function(data) {
    console.log(data);
    state.round = data;
    displayRound(data);
});

socket.on('receive round', function(data) {
    console.log('received round');
    state.round = data;
    displayRound(data);
});

socket.on('round users updated', function(data) {
    parseUsersForCurrentRound();
});

socket.on('receive rounds', function(data) {
    state.rounds = data;
    updateDisplayedRounds();
});

var parseUsersForCurrentRound = function() {
    if (state.round) {
        roundUsers = [];
        for (var i = 0; i < state.round.users.length; i++) {
            var user = state.users.filter(function(val) {
                return val.id == state.round.users[i];
            })[0];
            if (user) {
                roundUsers.push(user);
            }
        }
    }
};

var displayRound = function(data) {
    $('.lobby-active-leader-value').text(data.admin.username);
    $('.lobby-active-game-value').text(data.game.name);
    $('.lobby-active-status-value').text(data.users.length + ' / ' + data.size);
    $('.lobby-active-panel').fadeIn('fast');
    $('.lobby-panel, .activity-panel, .popup').fadeOut('fast');
};
