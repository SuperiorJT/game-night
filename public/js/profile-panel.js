var userList = [];

var userRow = function(user) {
    return $('<tr class="user-row-' + user.id + '"><th>' + user.username + '</th></tr>');
};

var clearUserList = function() {
    userList.forEach(function(val) {
        $('.user-row-' + val.id).remove();
    });
    userList = [];
}

var addUserToList = function(user) {
    var notFound = userList.every(function(val) {
        if (val.username == user.username) {
            return false;
        } else {
            return true;
        }
    });
    if (notFound) {
        var row = new userRow(user);
        row.appendTo('.user-list tbody');
        userList.push(user);
    }
}

var removeUserFromList = function(user) {
    userList.some(function(val) {
        if (val.id == user.id) {
            userList = userList.filter(function(val) {
                return val.id != user.id;
            });
            $('.user-row-' + user.id).remove();
            return true;
        }
        return false;
    })
}

var displayUser = function(user) {
    var row = new userRow(user);
    row.appendTo('.user-list tbody');
}

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
