var notifications = {

    id: 0,
    queue: [],

    notify: function(data) {
        var mobile = false;
        if ($(window).width() < 768) {
            mobile = true;
        }
        if (this.queue.length == 0) {
            this.queue.push(data);
        }
        if (!mobile || this.queue.indexOf(data) == 0 || this.queue.length == 0) {
            var style = 'style="';
            if (data.error) {
                style += 'background-color: #FFB3B3; border-color: #c12624; color: #c12624;"';
            } else if (data.error == null) {
                style += 'background-color: #B3D8FF; border-color: #26b1ef; color: #1678a3;"';
            } else if (!data.error) {
                style += 'background-color: #B5E9B3; border-color: #00af02; color: #008b02;"';
            }

            data.id = this.id;
            this.id++;

            var div = $("<div class='notification-" + this.id + "' " + style + ">" +
                "<p>" + data.msg + "</p>" +
                "<i class='fa fa-times'></i>" +
                "</div>").hide();

            div.prependTo($('.notifications-list')).css({
                marginTop: -div.height() - 10
            }).show().velocity({
                marginTop: 15
            }, 'fast', 'easeOutExpo', function() {
                $(this).velocity({
                    right: -div.width() - 30
                }, {
                    delay: 10000,
                    duration: 'fast',
                    easing: 'easeInCubic',
                    complete: function() {
                        notifications.queue.shift();
                        $(this).remove();
                        if (mobile && notifications.queue.length > 0) {
                            notifications.notify(notifications.queue[0]);
                        }
                    }
                });
            });

            div.find('i').click(function(e) {
                div.velocity('stop', true);
                div.velocity({
                    right: -div.width() - 30
                }, 'fast', 'easeInCubic', function() {
                    console.log("derp");
                    notifications.queue.shift();
                    var others = div.nextAll();
                    if (mobile && notifications.queue.length > 0) {
                        notifications.notify(notifications.queue[0]);
                        div.remove();
                    }
                    if (!mobile) {
                        div.velocity({
                            minHeight: 0,
                            maxHeight: 0,
                            padding: 0,
                            marginTop: 0
                        }, {
                            duration: 'fast',
                            easing: 'easeInOutExpo',
                            complete: function() {
                                div.remove();
                            }
                        });
                    }
                });
            });

        } else {
            this.queue.push(data);
        }


    }



};

$('.test').click(function() {
    socket.emit('test global');
});
