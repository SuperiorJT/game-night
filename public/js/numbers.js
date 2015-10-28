var expAnimate = function(end) {

    var start = state.user.exp;

        $({value: start}).animate({value: end}, {
            	duration: 3000,
            	easing: "swing",
            	step: function() {
            		$('.exp-amount').text(Math.floor(this.value));
                    $('.exp-fill').css({
                        width: 100*(this.value/((state.user.rank + 1)*1000)) + "%"
                    });
            	},
            	complete: function() {
            	   if (parseInt($('.exp-amount').text()) !== end) {
            	       $('.exp-amount').text(end);
            	   }
            	}
            });

};
