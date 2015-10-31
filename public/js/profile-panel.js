var userList = [];

var userRow = function(name) {
    return $('<tr class="' + name + '"><th>' + name + '</th></tr>');
};

var addUserToList = function(user) {
    var notFound = userList.every(function(val) {
        if (val.username == name) {
            return false;
        } else {
            return true;
        }
    });
    if (notFound) {
        var row = new userRow(user.username);
        row.appendTo('.user-list');
        userList.push(user);
    }
}

var removeUserFromList(user) {
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

socket.on('receive users', function(data) {
    console.log("users received");
    if (state.session) {
        userList = data;
        userList.forEach(function(val) {
            addUserToList(val);
        });
    }
});
