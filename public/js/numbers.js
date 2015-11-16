var expAnimate = function(end) {

    var start = state.user.exp;

        $({value: start}).animate({value: end}, {
            	duration: 3000,
            	easing: "swing",
            	step: function() {
                    var decimalPercent = (this.value - (state.user.rank * 1000)) / 1000;
            		$('.exp-amount').text(Math.floor(this.value));
                    if (decimalPercent >= 1) {
                        rankUp();
                    }
                    fillExp(decimalPercent);
            	},
            	complete: function() {
            	   if (parseInt($('.exp-amount').text()) !== end) {
                       var decimalPercent = (end - (state.user.rank * 1000)) / 1000;
            	       $('.exp-amount').text(end);
                       if (decimalPercent >= 1) {
                           rankUp();
                           decimalPercent = (end - (state.user.rank * 1000)) / 1000;
                       }
                       fillExp(decimalPercent);
            	   }
            	}
            });

};

function rankUp() {
    state.user.rank++;
    $('.rank-value').text(state.user.rank + 1);
    $('.exp-rank').text(state.user.rank + 2);
};

function fillExp(decimalPercent) {
    $('.exp-fill').css({
        width: 100*decimalPercent + "%"
    });
}
