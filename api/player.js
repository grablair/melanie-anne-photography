$(document).ready(function() {
	$('.profileContentArea').hide();//.append($("<div></div>").addClass("shadow"));
	$('.profileButton').click(function(e) {
		showArea($(e.target).attr("id").substring(0, $(e.target).attr("id").length - 3));
	});
	
	if ($('#playerModel').length) {
		setTimeout("refreshAvatar()", 500);
	}
	
	if ($("#profileAchHolder img").length) $('#noachievements').hide();
	
	gallery = new Gallery();
	
	$('#galleryloadtrigger').hide();
	$.get("scripts/players/getGalleryImages.php", {id: $('#playerId').val()}, function(images) {
		$('#galleryloading').hide();
		gallery.setImageList(images);
	}, "json");
	
	$('#noimages').hide();
	toggleLinksTable(false);
	
	$('#profileLinksBtn').click(editProfileLinks);
	
	$('#aboutMe, #signature').hide();
	
	toggleAboutMe();
	toggleSignature();
	
	$('#aboutMeBtn').click(toggleAboutMe);
	$('#sigBtn').click(toggleSignature);
	
	$('#aboutMeConfirmBtn').click(function(e) {
		$(e.target).toggle();
		alterProfile("aboutMe", $('#aboutMeEdit').val().trim(), postTextAjax, function(ajax) {
			$("#aboutMeConfirmBtn").toggle();
			doAjaxError(ajax);
		});
	});
	
	$('#sigConfirmBtn').click(function(e) {
		$(e.target).toggle();
		alterProfile("signature", $('#sigEdit').val().trim(), postTextAjax, function(ajax) {
			$("#sigConfirmBtn").toggle();
			doAjaxError(ajax);
		});
	});
	
	if (window.location.hash  && window.location.hash != "#settings" 
			&& $(window.location.hash.substring(1) + "Area")) {
		currentView = window.location.hash.substring(1);
	}
	
	$("#" + currentView + "Area").show();
	$("#" + currentView + "Btn").addClass("active");
	$('#upload_ajax').hide();
	
	setInterval("refreshView()", 100); 
	
	$('.achievement').tooltip({
		track: true,
		content: function() {
			var element = $(this);
			return "<span class=\"achTitle\">" + element.attr("ach-name") + "</span><br/>" +
					element.attr("ach-desc");
		},
		show: {
			effect: "none"
		},
		hide: {
			effect: "none"
		}
	});
	
	$('.activitydescription a').tooltip({
		track: true,
		show: {
			effect: "none"
		},
		hide: {
			effect: "none"
		}
	});
});

var currentView = "activity";

var gallery;

function refreshAvatar() {
	var img = $("<img />").attr('src', 'scripts/players/playerModel.php?username=' + $('#playerModel').attr("minecraft-name") + '&size=128').load(function() {
		if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
			return;
		} else {
			$("#playerModel").replaceWith(img);
		}
	});
}

function showArea(thisView) {
	if (thisView != "activity" || window.location.hash != "") window.location.hash = thisView;

	if (currentView == thisView) {
		return;
	}

	$("#" + currentView + "Area").hide();
	$("#" + thisView + "Area").show();
	currentView = thisView;
	$('.profileButton').removeClass("active");
	$('#' + currentView + "Btn").addClass("active");
}

function refreshView() {
	if (window.location.hash.substring(1) == currentView || (window.location.hash.substring(1) == "" && currentView == "activity")) return;
	if ($('#' + window.location.hash.substring(1) + "Area").length) {
		showArea(window.location.hash.substring(1));
	} else {
		showArea("activity");
	}
}

function toggleAboutMe() {
	$("#aboutMe, #aboutMeEditHolder, #aboutMeConfirmBtn").toggle();
}

function toggleSignature() {
	$('#signature, #sigEditHolder, #sigConfirmBtn').toggle();
}

function postTextAjax(ajax) {
	var attrib = ajax.attrib;
	var valueParsed = ajax.value;
	
	if (attrib == "aboutMe") {
		if (valueParsed == "") {
			$('#aboutMeContainer').html("<em>This player has not entered anything yet.</em>");
		} else {
			$('#aboutMeContainer').html(valueParsed);
		}
		
		$('#aboutMeConfirmBtn').toggle();
		toggleAboutMe();
	} else {
		if (valueParsed == "") {
			$('#sigContainer').html("<em>This player has not set their signature yet.</em>");
		} else {
			$('#sigContainer').html(valueParsed);
		}
		
		$('#sigConfirmBtn').toggle();
		toggleSignature();
	}
	
	refreshUrls();
}

function toggleLinksTable(editing) {
	if (editing) {
		$('#profileTable .show').hide();
		$('#profileTable .edit').show();
	} else {
		$('#profileTable .show').show();
		$('#profileTable .edit').hide();
	}
}

function alterProfile(attrib, value, success, failure) {
	failure = typeof failure !== 'undefined' ? failure : doAjaxError;
	$.post("scripts/players/alterProfile.php", {attribute: attrib, value: value, profileID: $('#playerId').val()}, 
			success, "json").fail(failure);
}

function editProfileLinks() {
	if ($('#profileLinksBtn').text() == "Edit") {
		$('#profileLinksBtn').text("Confirm");
		toggleLinksTable(true);
	} else if ($('#profileLinksBtn').text() == "Confirm") {
		$('profileLinksBtn').text("Editing...");
		
		var value = "";
		$('#profileTable input').each(function() {
			value += "," + this.id.substring(4) + "->" + this.value.trim();
			if (this.value.trim().indexOf(",") != -1) {
				newMessage(	"Invalid Input",
							"You cannot put comma's in your links.");
				$("#profileLinksBtn").text("Confirm");
				return;
			} else if (this.value.trim().indexOf("->") != -1) {
				newMessage(	"Invalid Input",
							"You cannot put the string '->' in your links.");
				$("#profileLinksBtn").text("Confirm");
				return;
			}
		});
		
		value = value.substring(1);
		alterProfile("links", value, postLinks, function(ajax) {
			$("#profileLinksBtn").text("Confirm");
			doAjaxError(ajax);
		});
	}
}

function postLinks(ajax) {
	$('#profileLinksBtn').text("Edit");
	toggleLinksTable(false);
	
	var parts = ajax.split("|");
	var linkParts = parts[3].split(",");
	for (var i = 0; i < linkParts.length; i++) {
		var link = linkParts[i].split("->");
		var anchor;
		if (link[1].trim().length == 0) {
			anchor = "<em>--</em>";
		} else {
			anchor = '<a href="' + link[1] + '" target="_BLANK">' + link[1] + '</a>';
		}
		
		$("#" + link[0] + "Link").html(anchor);
	}
}

var Gallery = Class.extend({
	init: function() {
		this.holder = $("<div></div>");
		this.holder.hide();
		this.holder.attr("id", "galleryimgholder");
		this.holder.click(function() { gallery.next() });
		this.bg = $("<div></div>");
		this.bg.attr("id", "gallerybg");
		this.bg.hide();
		this.bg.click(function() { gallery.hide() });
		$('body').append(this.bg, this.holder);
		this.currentId = -1;
		this.loadedImageCount = 0;
		this.uploadedImages = 0;
				
		$(window).resize(function() { gallery.resizeImage() });
		
		$(document).keydown(function(event) {
			if (gallery.holder.is(":visible")) {
				if (event.which == 37) {
					gallery.previous();
				} else if (event.which == 39) {
					gallery.next();
				} else if (event.which == 27) {
					gallery.hide();
				}
			}
		});
		
		$('#file').change(function() {
			$('#file_upload_form').attr("target", 'upload_target'); //'upload_target' is the name of the iframe
			$('#file_upload_form').submit();
			
			$('#upload_ajax').show();
			$('#file_upload_form').hide();
		});
		
		setInterval("gallery.checkUpload()", 100);
		setInterval("gallery.triggerLoadMore()", 500);
	},
	setImageList: function(images) {
		this.imageList = images;
		if (images == null) {
			$('noimages').show();
		}
		if (this.loadMoreImages()) $('#galleryloading').show();
		else $('#galleryloading').hide();
	},
	show: function(imageId) {
		this.setImage(parseInt(imageId));
		
		this.bg.show();;
		this.holder.show();
		
		this.resizeImage();
		
		var scrollPosition = [
			self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
			self.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop
		];
		
		var html = jQuery('html'); // it would make more sense to apply this to body, but IE7 won't have that
		html.data('scroll-position', scrollPosition);
		html.data('previous-overflow', html.css('overflow'));
		html.css('overflow', 'hidden');
		window.scrollTo(scrollPosition[0], scrollPosition[1]);
	},
	hide: function() {
		this.bg.hide();
		this.holder.hide();
		
		var html = jQuery('html');
		var scrollPosition = html.data('scroll-position');
		html.css('overflow', html.data('previous-overflow'));
		window.scrollTo(scrollPosition[0], scrollPosition[1])
	},
	next: function() {
		this.setImage(this.currentId + 1);
	},
	previous: function() {
		this.setImage(this.currentId - 1);
	},
	setImage: function(imageId) {
		if (imageId >= 0 && imageId < this.imageList.length) {
			this.currentId = parseInt(imageId);
			$(this.holder).find("img").hide();
			var imageInfo = this.imageList[imageId];
			if ($(this.holder).find('img[fullimg="' + imageId + '"]').length) {
				$(this.holder).find('img[fullimg="' + imageId + '"]').show();
				this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
					.css("marginTop", "-" + (imageInfo.height / 2) + "px")
					.css("cursor", "pointer");
				this.resizeImage();
				return;
			} 
			var img = $("<img />");
			img.attr("src", imageInfo.smallpath);
			img.attr("width", imageInfo.width);
			img.attr("height", imageInfo.height);
			this.holder.append(img);
			this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
				.css("marginTop", "-" + (imageInfo.height / 2) + "px")
				.css("cursor", "pointer");
				
			var fullImg = $("<img />").attr('src', imageInfo.filepath).load(function() {
				if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0 || gallery.currentId != imageId) {
					return;
				} else {
					img.replaceWith(fullImg);
					fullImg.attr("fullimg", imageId);
					gallery.resizeImage();
				}
			});
			
			this.resizeImage();
		}
	},
	triggerLoadMore: function() {
		if (isScrolledIntoView($("#galleryloading"))) {
			if (!this.loadMoreImages()) {
				$('#galleryloading').hide();
			}
		}
	},
	loadMoreImages: function() {
		var before = this.loadedImageCount;
		var i;
		for (i = 0; i < 12 && this.loadedImageCount < this.imageList.length - this.uploadedImages; i++) {
			var imageInfo = this.imageList[this.loadedImageCount];
			var url = imageInfo.smallpath;
			
			var div = $("<div></div>");
			div.attr("id", "gallimg_" + this.loadedImageCount);
			div.addClass("gallthumb");
			div.css("background-image", "url(" + url + ")");
			
			var ratio = Math.max(140/imageInfo.width, 140/imageInfo.height);
									
			div.css("background-size", (ratio * imageInfo.width) + "px " + (ratio * imageInfo.height) + "px");
			div.css("background-position", "-" + (((ratio * imageInfo.width) - 140) / 2) + "px -" + (((ratio * imageInfo.height) - 140) / 2) + "px");
			
			div.click(function(e) {
				gallery.show(parseInt(e.target.id.substring(8)) + gallery.uploadedImages);
			});
			
			$('#gallery').append(div);
			this.loadedImageCount++;
		}
		if (this.imageList.length == 0) {
			$('#noimages').show();
		}
		if (i < 12) return false;
		return true;
	},
	resizeImage: function() {
		if (this.holder.find("img:visible").length) {
			var currImg = this.holder.find("img:visible");
			var imageInfo = this.imageList[this.currentId];
			currImg.attr("width", imageInfo.width);
			currImg.attr("height", imageInfo.height);
			
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
			
			var imgW = parseInt(currImg.attr("width")), imgH = parseInt(currImg.attr("height"));
			var newW = imgW, newH = imgH;
			if (winW < imgW + 154) {
				newW = winW - 154;
				newH = Math.ceil(imgH * (newW / imgW));
			}
			
			if (winH < newH + 154) {
				newH = winH - 154;
				newW = Math.ceil(imgW * (newH / imgH));
			}
			
			currImg.attr("width", newW);
			currImg.attr("height", newH);
			
			this.holder.css("marginLeft", "-" + ((newW / 2) + 1) + "px")
					.css("marginTop", "-" + (newH / 2) + "px")
					.css("cursor", "pointer");
		}
	},
	checkUpload: function() {
		if ($iFrame('imageresult')) {
			var resultSpan = $iFrame('imageresult');
			if (resultSpan.innerHTML == "") {
				return;
			}
			var imageInfo = $.parseJSON(resultSpan.innerHTML);
			this.lastUploadedImage = imageInfo;
			resultSpan.innerHTML = "";
			
			if (imageInfo.error == "") {
				var id;
				if (this.imageList == null) {
					id = 0;
					this.imageList = [imageInfo];
				} else {
					id = this.imageList.length;
					this.imageList.unshift(imageInfo);
				}
				
				var url = imageInfo.smallpath;
				
				var div = $("<div></div>");
				div.attr("id", "gallimg_" + id);
				div.addClass("uploaded, gallthumb");
				div.css("background-image", "url(" + url + ")");
				
				var ratio = Math.max(140/imageInfo.width, 140/imageInfo.height);
									
				div.css("background-size", (ratio * imageInfo.width) + "px " + (ratio * imageInfo.height) + "px");
				div.css("background-position", "-" + (((ratio * imageInfo.width) - 140) / 2) + "px -" + (((ratio * imageInfo.height) - 140) / 2) + "px");
				

				div.click(function(e) {
					var tmpId = parseInt(e.target.id.substring(8));
					gallery.show(Math.abs(tmpId - (gallery.imageList.length - gallery.uploadedImages) - gallery.uploadedImages + 1));
				});
				
				$('#gallery').prepend(div);
				$('#noimages').hide();
				this.uploadedImages++;
			} else {
				var parts = imageInfo.error.split("|");
				newMessage(parts[0], parts[1]);
			}
			
			$('#file_upload_form').show();
			$('#upload_ajax').hide();
		}
	}
});

function init() {
	document.getElementById('file_upload_form').onsubmit=function() {
		document.getElementById('file_upload_form').target = 'upload_target'; //'upload_target' is the name of the iframe
	}
}

var $iFrame = function(id) {
	if ( $('#upload_target')[0].contentDocument ) 
	{ // FF
		return $('#upload_target')[0].contentDocument.getElementById(id);
	}
	else if ( $('#upload_target')[0].contentWindow ) 
	{ // IE
		return $('#upload_target')[0].contentWindow.document.getElementById(id);
	}
	
	return false;
}

function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
