var socket = io();

socket.emit('login', "JT");

// socket.emit('create game', {
//
//     id: 1,
//     data: {
//         name: "Halo: The Master Chief Collection",
//         type: "First Person"
//     }
//
// });

socket.emit('request games');
socket.on('receive games', function(data) {
    console.log(data);
});

socket.on('notification', function(data) {
    console.log(data.msg);
});
