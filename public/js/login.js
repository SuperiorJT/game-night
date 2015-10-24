var userInput = $('input#username');
var passInput = $('input#password');
var formInput = $('.login-form .form-control');

console.log(formInput);

$('#login').click(function() {
    if (userInput.val() == "") {
        userInput.parent().addClass('has-error');
        return false;
    }
    if (passInput.val() == "") {
        passInput.parent().addClass('has-error');
        return false;
    }
    $('.login-form input').prop('disabled', true);
    $.ajax({
        type: "POST",
        url: "api/user/login",
        contentType: 'application/json',
        data: JSON.stringify({
            "username": userInput.val(),
            "password": passInput.val()
        })
    })
    .always(function() {
        console.log("called");
        $('.login-form input').prop('disabled', false);
    })
    .fail(function(data) {

    })
    .done(function(data) {
        console.log(data.data);
        localStorage.userID = data.data;
        socket.emit('login', localStorage.userID);
    });
    return false;
});

$('#register').click(function() {
    if (userInput.val() == "") {
        userInput.parent().addClass('has-error');
        return false;
    }
    if (passInput.val() == "") {
        passInput.parent().addClass('has-error');
        return false;
    }
    $('.login-form input').prop('disabled', true);
    $.ajax({
        type: "POST",
        url: "api/user/register",
        contentType: 'application/json',
        data: JSON.stringify({
            "username": userInput.val(),
            "password": passInput.val()
        })
    })
    .always(function() {
        console.log("called");
        $('.login-form input').prop('disabled', false);
    })
    .fail(function(data) {
        
    })
    .done(function(data) {
        notifications.notify(data);
    });
    return false;
});

formInput.change(function(e) {
    if ($(e.target).parent().hasClass('has-error')) {
        $(e.target).parent().removeClass('has-error');
    }
});
