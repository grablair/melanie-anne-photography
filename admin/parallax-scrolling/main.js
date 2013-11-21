// The ratio of actual content to background height.
// The higher the ratio, the "farther" away the background is.
var ratio = 6;

$(document).ready(function() {
	var func = function() {
		$('#parallax-background').height($('#content').outerHeight(true) / ratio + $(window).height());
		$('#parallax-background').width($('#content').outerHeight(true) / ratio + $(window).width());

		$('#parallax-container').css("top", -1 * $('#content-container').scrollTop() / ratio + "px");
		$('#parallax-container').css("left", -1 * $('#content-container').scrollLeft() / ratio + "px");
	};
	
	$('#content-container').scroll(func);
	$(window).resize(func);
	
	func();
});
