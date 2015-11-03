var userList = [];

var userRow = function(name) {
    return $('<tr class="' + name + '"><th>' + name + '</th></tr>');
};

var clearUserList = function() {
    userList.forEach(function(val) {
        $('.' + val.username).remove();
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
        var row = new userRow(user.username);
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
            $('.' + user.username).remove();
            return true;
        }
        return false;
    })
}

var displayUser = function(name) {
    var row = new userRow(name);
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
        userList = data;
        userList.forEach(function(val) {
            displayUser(val.username);
        });
    }
});
