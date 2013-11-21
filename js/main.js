$(document).ready(function() {
	$.get("/api/slideshow_images.php", slideshowSetup, "json");
	
	currentPageInfo = {content: $('#main-content').html(), path: document.location.pathname, title: document.title.substring(TITLE_PREFIX.length)};
	history.replaceState(currentPageInfo, document.title);
	
	$('a.local:not([target="_BLANK"])').click(function(event) {
		var link = $(this);
		event.preventDefault();
		
		if (changingPages) return;
		
		if (link.is(".home-link")) {
			$('nav a').removeClass("active");
			link.addClass("active");
			setSlideshowMode(true);
			$('#show-slideshow').hide();
			var pageInfo = {content: "", path: "/", title: "Home"};
			document.title = getPageTitle(pageInfo);
			pushPageInfo(pageInfo);
			return;
		}
		
		changingPages = true;
		$.get("/content_wrapper.php?" + $(this).attr("href"), function(newPageInfo) {
			changingPages = false;
			$('#show-slideshow').show();
		
			setPageContent(newPageInfo, link);
			
			setSlideshowMode(false);
			pushPageInfo(newPageInfo);
		}, "json");
	});
	
	window.onpopstate = function(event) {
		if (event.state != null) {
		
			if (getPageId(event.state) == "home") {
				$('nav a').removeClass("active");
				$('.home-link').addClass("active");
				setSlideshowMode(true);
				$('#show-slideshow').hide();
				document.title = getPageTitle(event.state);
				return;
			}
			
			$('#show-slideshow').show();
			setPageContent(event.state, $("#link" + event.state.path.replace("/", "-")));
			currentPageInfo = event.state;
			setSlideshowMode(false);
		}
	};
});

var TITLE_PREFIX = "Melanie Anne Photography - ";

var imageInfos = [];
var images = [];
var currImg = null;

var paused = false;

var skipNext = false;

var slideshowMode = false;

var lastClickTime = 0;

var currentPageInfo = null;
var changingPages = false;

function getPageId(pageInfo) {
	if (pageInfo.path.length > 1) {
		return pageInfo.path.substring(1).split("/")[0];
	} else {
		return "home";
	}
}

function getPageTitle(pageInfo) {
	return document.title = "Melanie Anne Photography - " + pageInfo.title;
}

function pushPageInfo(newPageInfo) {
	currentPageInfo = newPageInfo
	history.pushState(currentPageInfo, document.title, currentPageInfo.path);
}

function setPageContent(pageInfo, activeLink) {
	$('#main-content').html(pageInfo.content);
	$('nav a').removeClass("active");
	activeLink.addClass("active");
	document.title = getPageTitle(pageInfo);
				
	$('body').attr("page", getPageId(pageInfo));
}

function toggleSlideshowMode() {
	setSlideshowMode(!slideshowMode);
}

function setSlideshowMode(on) {
	slideshowMode = on;
	if (on) {
		$('body').addClass("no-scroll");
		$(window).scrollTop(0);
		var winW = 630, winH = 460;
		if (document.body && document.body.offsetWidth) {
			winW = document.body.offsetWidth;
			winH = document.body.offsetHeight;
		}
		if (document.compatMode=='CSS1Compat' &&
				document.documentElement &&
				document.documentElement.offsetWidth) {
			winW = document.documentElement.offsetWidth;
			winH = document.documentElement.offsetHeight;
		}
		if (window.innerWidth && window.innerHeight) {
			winW = window.innerWidth;
			winH = window.innerHeight;
		}
		
		var leftAdjust = ($('header').innerWidth() - winW) / 2;
		
		$('header').stop().animate({left: leftAdjust + "px"}, 500);
		$('#main-content, #copyright').stop().animate({opacity: 0}, 400);
		
		$("#show-slideshow").attr("caption", "Show Content");
		if ($("#" + $("#show-slideshow").attr("aria-describedby")).length) {
			$("#" + $("#show-slideshow").attr("aria-describedby")).text("Show Content");
		}
		$('body').attr("slideshow", "on");
		$('.slideshow-control:not(#show-slideshow)').show();
	} else {
		$('body').removeClass("no-scroll");
		$('header').stop().animate({left: 0}, 500);
		$('#main-content, #copyright').stop().animate({opacity: 0.8}, 400);
		$("#show-slideshow").attr("caption", "Hide Content");
		if ($("#" + $("#show-slideshow").attr("aria-describedby")).length) {
			$("#" + $("#show-slideshow").attr("aria-describedby")).text("Hide Content");
		}
		$('body').attr("slideshow", "off");
		$('.slideshow-control:not(#show-slideshow)').hide();
	}
}

function slideshowSetup(json) {
	$('#prev-slideshow').click(function() {
		skipNext = true;
		prevImage();
	});
	
	$('#next-slideshow').click(function() {
		skipNext = true;
		nextImage();
	});
	
	$('#pause-slideshow').click(function() {
		paused = !paused;
		$(this).toggleClass("paused");
		if (paused) {
			$(this).attr("caption", "Resume");
			$("#" + $(this).attr("aria-describedby")).text("Resume");
		} else {
			$(this).attr("caption", "Pause");
			$("#" + $(this).attr("aria-describedby")).text("Pause");
		}
	});
	
	$('#show-slideshow').click(toggleSlideshowMode);
	
	for (var i = 0; i < json.length; i++) {
		var img = $('<img />').addClass("slideshow-image").attr("src", json[i].filepath).css("opacity", 0);
		$('body').prepend(img);
		images[i] = img;
	}
	
	imageInfos = json;
	setSlideshowImage(Math.floor(Math.random() * imageInfos.length));
	$(window).resize(resizeSlideshowImage);
	
	$('#loading-slideshow').hide();
	
	setInterval(function() {
		if (skipNext) {
			skipNext = false;
			return;
		}
		
		if (!paused) {
			nextImage();
		}
	}, 10000);
	
	if (getPageId(currentPageInfo) == "home") {
		$('.slideshow-control:not(#show-slideshow)').show();
	} else {
		$('#show-slideshow').show();
	}
	
	$('.slideshow-control').tooltip({
		track: true,
		content: function() {
			var element = $(this);
			var content = "No Description Available";
			if (element.attr("caption")) content = element.attr("caption");
			return content;
		},
		show: {
			effect: "none"
		},
		hide: {
			effect: "none"
		}
	});
}

function nextImage() {
	setSlideshowImage(currImg + 1);
}

function prevImage() {
	setSlideshowImage(currImg - 1);
}

function setSlideshowImage(index) {
	//var now = new Date().getTime();
	//if (now - lastClickTime < 1000) {
	//	return;
	//}
	//
	//lastClickTime = now;

	if (index < 0) {
		index = images.length - 1;
	} else if (index >= images.length) {
		index = 0;
	}

	if (currImg == null) {
		currImg = index;
		resizeSlideshowImage();
		images[index].animate({opacity: 1}, 600);
	} else {
		var lastImg = currImg;
		currImg = index;
		resizeSlideshowImage();
		for (var i = 0; i < images.length; i++) {
			if (i == currImg) {
				images[i].css("z-index", "-1");
				images[i].stop().animate({opacity: 1}, 600);
			} else {
				images[i].css("z-index", "-2");
				images[i].stop().animate({opacity: 0}, 600);
			}
		}
	}
}

function resizeSlideshowImage() {
	var winW = 630, winH = 460;
	if (document.body && document.body.offsetWidth) {
		winW = document.body.offsetWidth;
		winH = document.body.offsetHeight;
	}
	if (document.compatMode=='CSS1Compat' &&
			document.documentElement &&
			document.documentElement.offsetWidth) {
		winW = document.documentElement.offsetWidth;
		winH = document.documentElement.offsetHeight;
	}
	if (window.innerWidth && window.innerHeight) {
		winW = window.innerWidth;
		winH = window.innerHeight;
	}
	
	if (slideshowMode || $('body[page="home"]').length) {
		if (winW < $('header').innerWidth()) {
			$('header').css("left", 0);
		} else if ($('header').css("left") == "0px" || $('header').css("left") == "0") {
			var leftAdjust = ($('header').innerWidth() - winW) / 2;
			$('header').stop().animate({left: leftAdjust + "px"}, 500);
		} else {
			var leftAdjust = ($('header').innerWidth() - winW) / 2;
			$('header').css("left", leftAdjust + "px");
		}
	} else if ($('header').css("left") != "0px" && $('header').css("left") != "0") {
		$('header').stop().animate({left: 0}, 500);
	}
	
	var imgW = parseInt(imageInfos[currImg].width), imgH = parseInt(imageInfos[currImg].height);
	var newW = imgW, newH = imgH;
	
	var imgRatio = imgW / imgH;
	var winRatio = winW / winH;
	
	var offsetW = 0, offsetH = 0;
	
	if (imgRatio < winRatio) {
		newW = winW;
		newH = Math.ceil(imgH * (newW / imgW));
		offsetH = (winH - newH) / 2;
	} else {
		newH = winH;
		newW = Math.ceil(imgW * (newH / imgH));
		offsetW = (winW - newW) / 2;
	}
	
	images[currImg].attr("width", newW).attr("height", newH).css("left", offsetW + "px")
			.css("top", offsetH + "px");
}