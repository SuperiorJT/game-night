var joinSession = $('#join-session');
var autoJoinSession = $('#auto-join-session');
var triggerSession = $('#trigger-session');
var createLobby = $('#create-lobby');

var profileOpen = false;

joinSession.click(function() {
    console.log(state.session);
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
    console.log(state.sessionAvailable);
    if (state.sessionAvailable) {
        socket.emit('session end', { id: localStorage.userID });
    } else {
        console.log(socket);
        socket.emit('session start', { id: localStorage.userID });
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
    console.log('derp');
    delete localStorage.userID;
    socket.emit('logout', state.user);
});

socket.on('logged out', function() {
    console.log('derp');
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
    sessionStatus.sessionUnavailable();
    transition.sessionLeave();
});

socket.on('session joined', function(data) {
    console.log(data);
    state.session = data;
    socket.emit('fetch users');
    socket.emit('fetch games');
    socket.emit('fetch rounds');
    sessionAutoJoin = false;
    if (state.admin) {
        createLobby.show();
    }
    sessionStatus.lobbyNotFound();
    transition.sessionJoin();
});

socket.on('session left', function() {
    state.session = null;
    createLobby.hide();
    sessionStatus.sessionAvailable();
    transition.sessionLeave();
});
