var windowWidth = null;
var groundAnimationDuration = null;
var groundAnimationShiftFactor = null;
var hillsElementWidth = null;
var hillsAnimationDuration = null;
var hillsAnimationShiftFactor = null;

$(document).ready(function() {
  initializeAnimations();
});

$(window).resize(function() {
  resetAnimations();
});

function initializeAnimations() {
  calculateAnimationParameters();
  animateBackground('.bg-0', groundAnimationDuration, groundAnimationShiftFactor);
  animateBackground('.bg-1', hillsAnimationDuration, hillsAnimationShiftFactor);
}

function resetAnimations() {
  calculateAnimationParameters();
  resetBackgroundAnimation('.bg-0', groundAnimationDuration, groundAnimationShiftFactor);
  resetBackgroundAnimation('.bg-1', hillsAnimationDuration, hillsAnimationShiftFactor);
}

function calculateAnimationParameters() {
  windowWidth = $(window).width();
  hillsElementWidth = $('.bg-1').width();
  groundAnimationDuration = windowWidth * 100 * (1000 / 60);
  groundAnimationShiftFactor = windowWidth * -100;
  hillsAnimationDuration = hillsElementWidth * (25000 / windowWidth );
  hillsAnimationShiftFactor = hillsElementWidth * -1;
  // hillsAnimationDuration = windowWidth * (1000 / 60);
  // hillsAnimationShiftFactor = windowWidth;
}

function animateBackground(element, duration, shiftFactor) {
  $(element).velocity({
    'backgroundPositionX': shiftFactor
  }, {
    duration: duration,
    easing: 'linear',
    complete: function() {
      $('.bg-1').css('backgroundPositionX', '0px');
      animateBackground(element, hillsAnimationDuration, hillsAnimationShiftFactor);
    }
  });
}

function resetBackgroundAnimation(element, duration, shiftFactor) {
  $(element).velocity('stop', true);
  $(element).css('backgroundPositionX', '0px');
  animateBackground(element, duration, shiftFactor);
}
