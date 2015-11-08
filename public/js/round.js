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

socket.on('round closed', function(data) {
    state.rounds = data;
    updateDisplayedRounds();
});

socket.on('round joined', function(data) {
    state.round = data;
    displayRound(data);
});

socket.on('receive round', function(data) {
    console.log('received round');
    state.round = data;
    displayRound(data);
});

socket.on('round users updated', function(data) {
    state.round = data;
    updateCurrentRound();
});

socket.on('receive rounds', function(data) {
    state.rounds = data;
    updateDisplayedRounds();
});

var updateCurrentRound = function() {
    $('.lobby-active-status-value').text(state.round.status);
    $('.lobby-active-players').html('<div>Players</div>');
    state.round.users.forEach(function(val) {
        $('.lobby-active-players').append('<div class="lobby-active-player">' + val.username + '</div>');
    });
}

var displayRound = function(data) {
    $('.lobby-active-leader-value').text(data.admin.username);
    $('.lobby-active-game-value').text(data.game.name);
    $('.lobby-active-status-value').text(data.status);
    $('.lobby-active-panel').fadeIn('fast');
    $('.lobby-panel, .activity-panel, .popup').fadeOut('fast');
};
