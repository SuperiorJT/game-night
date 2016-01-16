var userList = [];

var userRow = function(user) {
    return $('<tr class="user-row-' + user.id + '"><th>' + user.username + '</th></tr>');
};

var clearUserList = function() {
    userList.forEach(function(val) {
        $('.user-row-' + val.id).remove();
    });
    userList = [];
};

var addUserToList = function(user) {
    var found = userList[user.id];
    if (!found) {
        displayUser(user);
        userList[user.id] = user;
    }
};

var removeUserFromList = function(user) {
    var found = userList[user.id];
    if (found) {
        delete userList[user.id];
        $('.user-row-' + user.id).remove();
    }
};

var displayUser = function(user) {
    var row = new userRow(user);
    row.appendTo('.user-list tbody');
};

socket.on('session user joined', function(data) {
    addUserToList(data);
});

socket.on('session user left', function(data) {
    removeUserFromList(data);
});

socket.on('receive users', function(data) {
    if (state.session) {
        clearUserList();
        state.users = data;
        userList = data;
        userList.forEach(function(val) {
            displayUser(val);
        });
    }
});
