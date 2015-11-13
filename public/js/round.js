var timerInterval;

$('#leave-lobby').click(function() {
    socket.emit('round leave', {
        id: localStorage.userID,
        round: state.round.id
    });
});

$('#round-start').click(function() {
    if (state.round.startTime) {
        socket.emit('round finish', {
            id: localStorage.userID,
            round: state.round.id
        });
    } else {
        socket.emit('round start', {
            id: localStorage.userID,
            round: state.round.id
        });
    }
});

socket.on('round created', function(data) {
    state.rounds.push(data);
    updateDisplayedRounds();
    if (data.admin.id == localStorage.userID) {
        $('#round-start').text('Start Round');
        socket.emit('round join', {
            id: localStorage.userID,
            round: data.id
        });
    }
});

socket.on('round finished', function(data) {
    state.round = data;
    clearInterval(timerInterval);
    updateCurrentRound();
    displayVictoryClaimPopup();
});

function displayVictoryClaimPopup() {
    $('.popup').fadeIn('fast');
    $('.popup').click(null);
    $('.popup-content').click(function(e) {
        e.stopPropagation();
    });
    $('.popup-content').load('templates/popup-claim-victory.html', function() {

        startVictoryClaimTimerInterval();
        loadClaimPlaceSelector();

        $('.claim-victory-counter').text('0 / ' + state.round.users.length);

        $('#victory-claim').click(function() {
            claimVictoryForPosition($('#victory-place').val());
            $('#victory-place, #victory-claim').hide();
            $('.claim-victory-loading').show();
        });

    });
};

function startVictoryClaimTimerInterval() {
    var currentTime = new Date().getTime();
    var endTime = currentTime + 30500;
    calculateAndDisplayClaimTimeRemaining(endTime);
    timerInterval = setInterval(function() {
        calculateAndDisplayClaimTimeRemaining(endTime);
    }, 1000);
};

function calculateAndDisplayClaimTimeRemaining(endTime) {
    function addZ(n) {
        return (n<10? '0':'') + n;
    }

    var currentTime = new Date().getTime();
    var difference = endTime - currentTime;
    var ms = difference % 1000;
    difference = (difference - ms) / 1000;
    var secs = difference % 60;
    difference = (difference - secs) / 60;
    var mins = difference % 60;
    $('.claim-victory-timer-value').text(addZ(mins) + ":" + addZ(secs));
    if (secs == 0) {
        clearInterval(timerInterval);
    }
};

function claimVictoryForPosition(pos) {
    socket.emit('round claim', {
        id: localStorage.userID,
        round: state.round.id,
        place: pos
    });
};

function loadClaimPlaceSelector() {
    $('#victory-place').html('');
    for (var i = 1; i <= state.round.users.length; i++) {
        $('#victory-place').append('<option value="' + i + '">' + i + '</option>');
    }
};

socket.on('round claimed', function(data) {
    $('.claim-victory-counter').text(data.winners.length + ' / ' + data.users.length);
});

socket.on('round claimed complete', function(data) {
    state.round = data;
    if (state.round.admin.id == localStorage.userID) {
        $('.popup-content').load('templates/popup-declare-winners.html', function() {
            loadDeclarationPlayerList();

            $('#declare-winners').click(function() {
                var winners = generateWinnersList();
                socket.emit('round declare winners', {
                    round: state.round.id,
                    winners: winners
                });
            });
        });
    } else {
        $('#victory-place, #victory-claim, .claim-victory-timer').hide();
        $('.claim-victory-loading').show();
        $('.claim-victory-loading span:nth-child(2)').text('Waiting for leader to confirm');
    }
});

function loadDeclarationPlayerList() {
    $('.declare-winners-list').html('');
    state.round.winners.forEach(function(val) {
        var options = $('<select></select>');
        for (var i = 1; i <= state.round.users.length; i++) {
            var optionSelected = (i == val.place) ? "selected" : "";
            options.append('<option value="' + i + '" ' + optionSelected + '>' + i + '</option>');
        }
        $('.declare-winners-list').append('<li class="declare-winners-list-item"><span>' + val.user.username + '</span>' + options[0].outerHTML + '</li>');
    });
};

function generateWinnersList() {
    var winners = [];
    $('.declare-winners-list').children('li').each(function() {
        var li = $(this);
        var user = state.round.users.filter(function(val) {
            console.log(val.username + " " + li.children('span').eq(0).text());
            return val.username == li.children('span').eq(0).text();
        })[0];
        if (user) {
            winners.push({
                user: user,
                place: li.children('select').eq(0).val()
            });
        }
    });
    return winners;
}

socket.on('round closed', function(data) {
    state.rounds = data;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (!currentRoundIsAvailable()) {
        $('.popup').fadeOut('fast');
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
        $('#round-start').text('Finish Round');
        calculateAndDisplayRoundTime();
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

socket.on('exp update', function(exp) {
    var difference = Math.abs(exp - state.user.exp);
    expAnimate(exp);
    state.user.exp = exp;
    console.log(difference + " " + state.user.exp);
});

function updateCurrentRound() {
    $('.lobby-active-status-value').text(state.round.status);
    $('.lobby-active-players').html('<div>Players</div>');
    state.round.users.forEach(function(val) {
        $('.lobby-active-players').append('<div class="lobby-active-player">' + val.username + '</div>');
    });
};
