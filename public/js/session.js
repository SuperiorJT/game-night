var joinSession = $('#join-session');
var triggerSession = $('#trigger-session');

joinSession.click(function() {
    if (!state.session) {
        socket.emit('session join', { id: localStorage.userID });
    } else {
        socket.emit('session leave', { id: localStorage.userID });
    }

});

triggerSession.click(function() {
    if (state.sessionAvailable) {
        socket.emit('session end', { id: localStorage.userID });
    } else {
        socket.emit('session start', { id: localStorage.userID });
    }
});

socket.on('session started', function() {
    if (state.admin) {
        state.sessionAvailable = true;
        triggerSession.html('End Session');
    }
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
    transition.sessionLeave();
});

socket.on('session joined', function(data) {
    state.session = data;
    socket.emit('fetch games');
    socket.emit('fetch rounds');
    transition.sessionJoin();
});

socket.on('session left', function() {
    state.session = null;
    transition.sessionLeave();
});
