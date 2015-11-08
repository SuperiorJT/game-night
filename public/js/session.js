var joinSession = $('#join-session');
var autoJoinSession = $('#auto-join-session');
var triggerSession = $('#trigger-session');
var createLobby = $('#create-lobby');

var profileOpen = false;

joinSession.click(function() {
    if (!state.session) {
        socket.emit('session join', { id: localStorage.userID });
    } else {
        socket.emit('session leave', { id: localStorage.userID });
    }
});

autoJoinSession.click(function() {
    sessionAutoJoin = !sessionAutoJoin;
    if (sessionAutoJoin) {
        //TODO Show spinner, hide join button, change auto text
        autoJoinSession.text("Cancel Auto-Join");
        sessionStatus.sessionAutoJoin();
        $('.session-buttons .fa').attr('style', 'display: inline-block;');
    } else {
        $('.session-buttons .fa').hide();
        autoJoinSession.text("Auto-Join Session");
        sessionStatus.sessionUnavailable();
    }
});

triggerSession.click(function() {
    if (state.sessionAvailable) {
        socket.emit('session end', { id: localStorage.userID });
    } else {
        socket.emit('session start', { id: localStorage.userID });
    }
});

createLobby.click(function() {
    if (state.admin) {
        if (state.round) {

        } else {
            $('.popup').fadeIn('fast');
            $('.popup').click(function() {
                $(this).fadeOut('fast');
            });
            $('.popup-content').click(function(e) {
                e.stopPropagation();
            });
            $('.popup-content').load('templates/popup-create-lobby.html', function() {

                var checkInputs = function() {
                    if ($('.dd-selected-value').val() > 0 && $('#create-lobby-number').val() > 1) {
                        $('#finalize-lobby').attr({
                            disabled: false
                        });
                    } else {
                        $('#finalize-lobby').attr({
                            disabled: true
                        });
                    }
                }

                $('#create-lobby-game').append($('<option value="0">Select Game...</option>'));
                state.games.forEach(function(val) {
                    var option = $('<option value="' + val.id + '" data-imagesrc="' + val.img.icon + '" data-description="' + val.type + '">' + val.name + '</option>');
                    $('#create-lobby-game').append(option);
                });
                $('#create-lobby-game').ddslick({
                    width: '100%',
                    onSelected: checkInputs
                });
                $('#create-lobby-number').change(function() {
                    checkInputs();
                });
                $('#finalize-lobby').click(function() {
                    socket.emit('round create', {
                        id: localStorage.userID,
                        data: {
                            game: $('#create-lobby-game').data('ddslick').selectedData.value,
                            admin: localStorage.userID,
                            size: $('#create-lobby-number').val()
                        }
                    });
                    return false;
                });
            });
        }
    }
});

$('.profile-container').click(function() {
    if (!profileOpen) {
        profileOpen = true;
        $('.profile-mobile-row').velocity({
            top: 0
        });
        $('.profile-mobile').velocity({
            backgroundColorAlpha: 1
        });
        $('.profile-mobile-close').attr('style', 'display: inline-block').hide().fadeIn();
        $('.profile-logout').attr('style', 'display: inline-block').hide().fadeIn();
    }
});

$('.profile-mobile-close').click(function() {
    if (profileOpen) {
        profileOpen = false;
        $('.profile-mobile-row').velocity({
            top: '86vh'
        });
        $('.profile-mobile').velocity({
            backgroundColorAlpha: 0.7
        });
        $('.profile-mobile-close').fadeOut();
        $('.profile-logout').fadeOut();
    }
});

$('.profile-logout').click(function() {
    delete localStorage.userID;
    socket.emit('logout', state.user);
});

socket.on('logged out', function() {
    state = {
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
    transition.sessionToLogin();
});

socket.on('session started', function() {
    if (state.admin) {
        state.sessionAvailable = true;
        triggerSession.html('End Session');
    }
    autoJoinSession.hide();
    joinSession.show();
    sessionStatus.sessionAvailable();
    if (sessionAutoJoin) {
        socket.emit('session join', {
            id: localStorage.userID
        });
    }
});

socket.on('session ended', function() {
    if (state.admin) {
        state.sessionAvailable = false;
        triggerSession.html('Start Session');
    }
    state.session = null;
    joinSession.hide();
    createLobby.hide();
    autoJoinSession.show();
    clearUserList();
    sessionStatus.sessionUnavailable();
    transition.sessionLeave();
});

socket.on('session joined', function(data) {
    state.session = data;
    socket.emit('fetch all');
    sessionAutoJoin = false;
    if (state.admin) {
        createLobby.show();
    }
    if (state.user.lobby) {
        console.log('fetching round');
        socket.emit('fetch round', { round: state.user.lobby });
    }
    sessionStatus.lobbyNotFound();
    transition.sessionJoin();
});

socket.on('session left', function() {
    state.session = null;
    createLobby.hide();
    clearUserList();
    sessionStatus.sessionAvailable();
    transition.sessionLeave();
});

var updateDisplayedRounds = function() {
    $('.lobby-list tbody').html('');
    state.rounds.forEach(function(val) {
        console.log('added lobby');
        $('.lobby-list tbody').append('<tr><td>' + val.id + '</td><td>' + val.game.name + '</td><td>' + val.admin.username + '</td><td>' + val.status + '</td><td>' + val.startTime + '</td></tr>')
    });
    if (state.rounds.length) {
        console.log('display lobby');
        $('.lobby-status').hide();
        $('.lobby-list').fadeIn('fast');
    } else {
        $('.lobby-list').fadeOut('fast', function() {
            $('.lobby-status').show();
        });
    }
};
