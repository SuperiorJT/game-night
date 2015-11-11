var timerInterval;

$('#leave-lobby').click(function() {
    socket.emit('round leave', {
        id: localStorage.userID,
        round: state.round.id
    });
});

$('#round-start').click(function() {
    socket.emit('round start', {
        id: localStorage.userID,
        round: state.round.id
    });
});

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
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (!currentRoundIsAvailable()) {
        transition.lobbyToSession();
        state.round = null;
    }
    updateDisplayedRounds();
});

socket.on('round left', function(data) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    transition.lobbyToSession();
    state.round = null;
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

socket.on('round started', function(data) {
    if (state.round && state.round.id == data.id) {
        state.round = data;
        startRoundTimerInterval();
    }
});

function startRoundTimerInterval() {
    timerInterval = setInterval(function() {
        calculateAndDisplayRoundTime();
    }, 1000);
}

function calculateAndDisplayRoundTime() {
    function addZ(n) {
        return (n<10? '0':'') + n;
     }

    var currentTime = new Date().getTime();
    var difference = currentTime - state.round.startTime;
    var ms = difference % 1000;
    difference = (difference - ms) / 1000;
    var secs = difference % 60;
    difference = (difference - secs) / 60;
    var mins = difference % 60;
    $('.lobby-active-status-value').text(addZ(mins) + ":" + addZ(secs));
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
