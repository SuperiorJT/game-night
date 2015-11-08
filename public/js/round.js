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
    if (!currentRoundIsAvailable()) {
        transition.lobbyToSession();
        state.round = null;
    }
    updateDisplayedRounds();
});

function currentRoundIsAvailable() {
    return state.rounds.some(function(val) {
        if (val.id == state.round.id) {
            return true;
        } else {
            return false;
        }
    });
}

socket.on('round joined', function(data) {
    state.round = data;
    transition.sessionToLobby();
});

socket.on('receive round', function(data) {
    console.log('received round');
    state.round = data;
    transition.sessionToLobby();
});

socket.on('round users updated', function(data) {
    state.round = data;
    updateCurrentRound();
});

socket.on('receive rounds', function(data) {
    state.rounds = data;
    updateDisplayedRounds();
});

function updateCurrentRound() {
    $('.lobby-active-status-value').text(state.round.status);
    $('.lobby-active-players').html('<div>Players</div>');
    state.round.users.forEach(function(val) {
        $('.lobby-active-players').append('<div class="lobby-active-player">' + val.username + '</div>');
    });
};
