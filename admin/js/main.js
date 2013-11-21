$(document).ready(function() {
	if ($('#logged-in-input').length) {
		$('.dashboard-button-wrapper').click(launchSection);
	}
});

function launchSection() {
	var section = $(this).find('.dashboard-button').attr('dash-section');
	var icon = $(this).find('img').attr("src");
	
	$.get("api/" + section + ".php", function(json) {
		showSection(json.section, json.title, icon);
		postGet[section](json);
	}, "json").error(ajaxError);
}

function showSection(section, title, icon) {
	if (!$('section[type="' + section + '"]').length) {
		lockScrolling();
		
		var bg = $('<div></div>').attr("id", "section-bg");
		var section = $('<div></div>').attr("id", "section-content").append(
			$('<header></header>').append($('<img />').attr("src", icon), title),
			$('<div></div>').addClass("divider"),
			$('<section></section>').attr("type", section)
		);
		var content = $('<div></div>').attr("id", "section-container").addClass("lockable").append(section);
		
		content.click(function() {
			var removeFunc = function() {
				$(this).remove();
			};
			var func = function() {
				bg.add(content).toggle("fade", {
					complete: removeFunc
				});
				unlockScrolling();
				hideMessage();
			}
			if ($(this).find('[edited="true"]').length) {
				newMessage(	"Changes Not Saved",
							"There are changes that you have not saved. Are you sure " +
							"you want to leave the " + title + " screen without saving?",
							[
								$("<button></button>").text("Cancel").click(hideMessage),
								$("<button></button>").text("Yes").click(func)
							]
				);
			} else {
				func();
			}
		});
		
		section.click(function(e) {
			e.stopPropagation();
		});
		
		$('body').append(bg, content);
		
		bg.hide().toggle("fade");
		content.hide().toggle("fade");
	}
}

var postGet = {
	blog: function(json) {
		for (var i = 0; i < json.posts.length; i++) {
			var post = json.posts[i];
			var header = $('<header></header>').attr("post-id", post.id).text(post.title);
			
			var title = $('<input></input>').attr("type", "text").attr("placeholder", "Title").val(post.title);
			var content = $('<textarea></textarea>').attr("placeholder", "Type blog post here...").text(post.content);
			
			var saveButton = $('<button></button>').attr("post-id", post.id).text("Save").prop("disabled", true).click(resetFields([title, content]));
			
			var article = $('<article></article>').attr("post-id", post.id).append(
				title,
				$('<div></div>').addClass("divider"),
				content,
				$('<div></div>').addClass("blog-post-controls").append(
					saveButton
				)
			);
			
			title.data("original", post.title);
			content.data("original", post.content);
			
			var onChange = (function(title, content, saveButton) {
				return function() {
					saveButton.prop("disabled", title.val() == title.data("original")
							&& content.val() == content.data("original")); 
				};
			})(title, content, saveButton);
			
			title.keyup(onChange).keyup(setEditFlag);
			content.keyup(onChange).keyup(setEditFlag);
			
			header.click(function() {
				var thisArticle = $('article[post-id="' + $(this).attr("post-id") + '"]');
				thisArticle.toggle("blind", 200);
				thisArticle.find("textarea").keyup();
			});
			
			$('section').append(header, article);
			article.hide();
		}
		
		$('section[type="blog"]').on('keyup', 'textarea', function () {
			$(this).height(0);
			$(this).height(this.scrollHeight);
		});
	},
	gallery: function(json) {
		var newAlbumHeader = $('<header></header>').addClass("album new-album").append(
			$('<div></div>').addClass("album-image-strip"),
			$('<div></div>').append(
				$('<span></span>').addClass("album-title").text("Create"),
				$('<span></span>').addClass("album-small-desc").text("New Album")
			)
		);
		var currentGallery = $('<div id="gallery"></div>').hide();
		var galleryLoading = $('<img id="galleryloading" src="img/ajax-ball.gif" />').hide();
		
		$('section').append(newAlbumHeader, currentGallery, galleryLoading);
		
		var insertAlbum = function(header, photos) {
			var photo = photos.head;
			while (photo != null) {
				header.find(".album-image-strip").append($('<img />').attr("src", "/img/photos/" + photo.value.thumb));
				photo = photo.next;
			}
			
			header.click(function(e) {
				e.stopPropagation();
				if ($(this).is(".animating")) return;
				
				$(this).addClass("animating");
				var doneAnimating = (function(elem) {
					return function() {
						elem.removeClass("animating");
					};
				})($(this));
				
				if (!$(this).is(".selected")) {
					$(this).addClass("selected");
				
					var completed = false;
					var completeFunction = function() {
						if (completed) return;
						completed = true;
						var uploadButton = $('<div></div>').addClass("upload-photo-btn").append(
							$('<span></span>').text("+")
						);
						
						var uploadingProgress = $('<div></div>').addClass("uploading-indicator").append(
							$('<img />').attr("src", "img/ajax-ball.gif")
						).hide();
						
						var album = new ModifiableAlbum($("#gallery"), photos, {
							uploadTrigger: uploadButton,
							uploadingIndicator: uploadingProgress,
							uploadCallback: function(imageInfo) {
								header.find(".album-image-strip").append($('<img />').attr("src", "/img/photos/" + imageInfo.thumb));
								header.find(".album-small-desc").text(gallery.imageList.length + (gallery.imageList.length == 1 ? " photo" : " photos"))
							}
						});
						
						/*			
						$('#gallery').append(uploadButton, uploadingProgress);
						
						var callback = function(imageInfo) {
							header.find(".album-image-strip").append($('<img />').attr("src", "/img/photos/" + imageInfo.thumb));
							header.find(".album-small-desc").text(gallery.imageList.length + (gallery.imageList.length == 1 ? " photo" : " photos"))
						};
						
						var gallery = 
						
						gallery.setUploadAndProgressAndInsertionPoint(uploadButton, uploadingProgress, uploadButton);
						gallery.setUploadImageCallback(callback);
						gallery.setImageList(album.photos);
						gallery.setCurrentAlbumId(album.id);
						*/
						
						$('#gallery').show("blind", {complete: doneAnimating});
					};
										
					$('header.album').not($(this)).hide("blind", {complete: completeFunction});
				} else {
					$(this).removeClass("selected").addClass("animating");
					
					var completeFunction = function() {
						$('#gallery').text("");
						$('header.album').show("blind", {complete: doneAnimating});
					}
					
					$('#gallery').hide("blind", {complete: completeFunction});
				}
			});
			
			newAlbumHeader.before(header);
		};
		
		for (var i = 0; i < json.albums.length; i++) {
			var album = json.albums[i];
			var photos = new LinkedList(album.photos);
			var header = $('<header></header>').addClass("album").attr("album-id", album.id).data("photos", photos).append(
				$('<div></div>').addClass("album-image-strip"),
				$('<div></div>').append(
					$('<span></span>').addClass("album-title").text(album.title),
					$('<span></span>').addClass("album-small-desc").text(album.photos.length + (album.photos.length == 1 ? " photo" : " photos"))
				)
			);
			
			insertAlbum(header, photos);
		}
		
		newAlbumHeader.click(function() {
			var submitButton = $('<button></button>').text("Submit").prop("disabled", true);
			var albumTitleInput = $('<input />').attr("placeholder", "Album Title").keyup(function() {
				submitButton.prop("disabled", $(this).val().length == 0);
			});
			
			newMessage(	
				"Choose Album Title",
				$().add("<br />").add(albumTitleInput),
				[
					$('<button></button>').text("Cancel").click(hideMessage),
					submitButton.click(function() {
						$(this).prop("disabled", true);
						$.post("api/gallery.php", {action: "new_album", title: albumTitleInput.val()}, function(json) {
							hideMessage();
							
							var album = json.album;
							var header = $('<header></header>').addClass("album").attr("album-id", album.id).append(
								$('<div></div>').addClass("album-image-strip"),
								$('<div></div>').append(
									$('<span></span>').addClass("album-title").text(album.title),
									$('<span></span>').addClass("album-small-desc").text(album.photos.length + (album.photos.length == 1 ? " photo" : " photos"))
								)
							);
			
							insertAlbum(header, album);
						}, "json").error(generalError);
					})
				]
			);
		});
	},
	clients: function(json) {
	
	}
};

var debug = false;

function setEditFlag() {
	$(this).attr("edited", $(this).val() != $(this).data("original"));
}

function resetFields(elements) {
	return function() {
		$(elements).each(function() {
			$(this).data("original", $(this).val()).attr("edited", false);
		});
		
		$(this).prop("disabled", true);
	}
}

function lockScrolling() {
	// lock scroll position, but retain settings for later
	var scrollPosition = [
		self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
		self.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop
	];
	var lock = $(".lockable:not(.locked)").first();
	lock.data('scroll-position', scrollPosition);
	lock.data('previous-overflow', lock.css('overflow'));
	lock.css('overflow', 'hidden');
	lock.addClass("locked");
	window.scrollTo(scrollPosition[0], scrollPosition[1]);
}

function unlockScrolling() {
	var unlock = $(".lockable.locked").last();
	var scrollPosition = unlock.data('scroll-position');
	unlock.css('overflow', unlock.data('previous-overflow'));
	unlock.removeClass("locked");
	window.scrollTo(scrollPosition[0], scrollPosition[1])
}




// Gallery Code

var gallery = false;

var Album = Class.extend({
	init: function(container, photos, options) {
		this.container = container.text("");
		this.photos = photos;
		this.lastLoadedPhoto = {next: photos.head, prev: photos.tail};
		this.options = arguments.length > 2 ? options : null;
		
		while(!this.loadMoreImages());
	},
	destroy: function() {
		// no-op
	},
	loadMoreImages: function() {
		var loadedPhotos = 0;
		var currentPhoto = this.lastLoadedPhoto.next;
		while (currentPhoto != null && loadedPhotos++ < 12) {
			var imageInfo = currentPhoto.value;
			var url = "/img/photos/" + imageInfo.thumb;
			
			var div = $("<div></div>");
			div.addClass("gallthumb");
			div.css("background-image", "url(" + url + ")");
			div.data("photoNode", currentPhoto);
			
			var ratio = Math.max(140/imageInfo.width, 140/imageInfo.height);
									
			div.css("background-size", (ratio * imageInfo.width) + "px " + (ratio * imageInfo.height) + "px");
			div.css("background-position", "-" + (((ratio * imageInfo.width) - 140) / 2) + "px -" + (((ratio * imageInfo.height) - 140) / 2) + "px");
			
			div.click(function(e) {
				new PhotoViewer($(this).data("photoNode"));
			});
			
			this.addPhoto(div);
			this.lastLoadedPhoto = currentPhoto;
			currentPhoto = currentPhoto.next;
		}
		
		if (currentPhoto != null) return false;
		return true;
	},
	addPhoto: function(thumbnail) {
		this.container.append(thumbnail);
	}
});

var ModifiableAlbum = Album.extend({
	init: function(container, photos, options) {
		if (arguments.length < 3) {
			throw "Must supply options";
		} else if (!options.hasOwnProperty("uploadTrigger")) {
			throw "Must supply upload trigger";
		}
		
		this._super(container, photos, options);
		
		if (options.hasOwnProperty("uploadingIndicator")) {
			this.container.prepend(options.uploadingIndicator.hide());
		}
		
		this.container.prepend(options.uploadTrigger);
		
		this.uploadForm = $('<form></form>').attr({
			method: "post",
			enctype: "multipart/form-data",
			action: "scripts/players/uploadImage.php"
		}).css({
			width: "0",
			height: "0",
			border: "0px solid #fff",
			visibility: "hidden"
		});
		this.uploadFrame = $('<iframe></iframe>').attr("name", "album_upload_target").css({
			width: "0",
			height: "0",
			border: "0px solid #fff",
			visibility: "hidden"
		});
		var actionInput = $('<input />').attr({
			name: "action",
			type: "hidden",
			value: "upload"
		});
		var fileInput = $('<input />').attr({
			name: "file[]",
			type: "file",
			multiple: "multiple",
			accept: ".jpg,.jpeg"
		}).change((function(viewer) {
			return function() {
				viewer.uploadForm.attr("action", "api/gallery.php");
				viewer.uploadForm.attr("target", 'album_upload_target');
				viewer.options.uploadTrigger.addClass("disabled");
				if (viewer.options.hasOwnProperty("uploadingIndicator")) {
					viewer.options.uploadingIndicator.show();
				}
				viewer.uploadForm.submit();
				viewer.uploadFrame.bind("load", function() {
					$(this).unbind("load");
					if (this.contentWindow.document.getElementById("imageresult").innerHTML == "") {
						return;
					}
					var imageList = $.parseJSON(this.contentWindow.document.getElementById("imageresult").innerHTML);
					this.contentWindow.document.getElementById("imageresult").innerHTML = "";
			
					if (!imageList.hasOwnProperty("error")) {
						new WatermarkPhotoViewer(new LinkedList(imageList.head));
					} else {
						var parts = imageList.error.split("|");
						newMessage(parts[0], parts[1]);
					}
			
					$('#file_upload_form').show();
					$('#upload_ajax').hide();
				});
			};
		})(this));
		
		options.uploadTrigger.click(function() {
			fileInput.trigger("click");
		})
		
		this.uploadForm.append(fileInput, actionInput, this.uploadFrame);
		
		this.container.after(this.uploadForm);
	},
	destroy: function() {
		this._super();
		this.uploadForm.remove();
	}
});

// A simple photo viewer.
var PhotoViewer = Class.extend({
	// Creates a new PhotoViewer with the given starting
	// photo and options.
	//
	// startingPhoto: a LinkedList node (JS object).
	//       options: options for the photo viewer.
	init: function(startingPhoto, options) {
		this.holder = $("<div></div>");
		this.holder.addClass("photo-viewer-holder");
		
		this.bg = $("<div></div>");
		this.bg.addClass("photo-viewer-bg");
		this.bg.addClass("lockable");
		this.bg.click((function(viewer) {
			return function() { viewer.destroy() };
		})(this));
		
		$('body').append(this.bg, this.holder);
		
		$(window).bind("resize.photoViewer", (function(viewer) {
			return function() { viewer.resizeImage() };
		})(this));
		
		if (arguments.length == 1 || !options.hasOwnProperty("lock") || options.lock) {
			this.holder.click((function(viewer) {
				return function() { viewer.next() };
			})(this));
			
			$(document).bind("keydown.photoViewer", (function(viewer) {
				return function(event) {
					if (event.which == 37) {
						viewer.prev();
					} else if (event.which == 39) {
						viewer.next();
					} else if (event.which == 27) {
						viewer.destroy();
					}
				};
			})(this));
		}
		
		lockScrolling();
		
		this.setPhoto(startingPhoto);
	},
	// Destroys the current PhotoViewer.
	destroy: function() {
		unlockScrolling();
		this.holder.remove();
		this.bg.remove();
		$(document).unbind("keydown.photoViewer");
		$(window).unbind("resize.photoViewer");
	},
	// Moves to the previous image.
	prev: function() {
		this.setPhoto(this.currentPhoto.prev);
	},
	// Moves to the next image.
	next: function() {
		this.setPhoto(this.currentPhoto.next);
	},
	// Sets the current photo.
	setPhoto: function(photoNode) {
		if (photoNode == null) return;
		
		this.currentPhoto = photoNode;
		$(this.holder).find("img").hide();
		
		var imageInfo = photoNode.value;
		var imageId = imageInfo.id;
		if ($(this.holder).find('img[fullimg="' + imageId + '"]').length) {
			$(this.holder).find('img[fullimg="' + imageId + '"]').show();
			this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
				.css("marginTop", "-" + (imageInfo.height / 2) + "px")
				.css("cursor", "pointer");
		} else {
			var img = $("<img />");
			img.attr("src", "/img/photos/" + imageInfo.thumb);
			img.attr("width", imageInfo.width);
			img.attr("height", imageInfo.height);
			this.holder.append(img);
			this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
				.css("marginTop", "-" + (imageInfo.height / 2) + "px")
				.css("cursor", "pointer");
			
			var fullImg = $("<img />").attr('src', "/img/photos/" + imageInfo.full).load((function(viewer) {
				return function() {
					if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0 || viewer.currentPhoto != photoNode) {
						return;
					} else {
						img.replaceWith(fullImg);
						fullImg.attr("fullimg", imageId);
						viewer.resizeImage();
					}
				};
			})(this));
		}
		
		this.resizeImage();
	},
	// Resizes the current photo to fit the screen.
	resizeImage: function() {
		var currImg = this.holder.find("img:visible");
		var imageInfo = this.currentPhoto.value;
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
		if (winW < imgW + (window.innerWidth * 0.2)) {
			newW = winW - (window.innerWidth * 0.2);
			newH = Math.ceil(imgH * (newW / imgW));
		}
		
		if (winH < newH + (window.innerHeight * 0.2)) {
			newH = winH - (window.innerHeight * 0.2);
			newW = Math.ceil(imgW * (newH / imgH));
		}
		
		currImg.attr("width", newW);
		currImg.attr("height", newH);
		
		this.holder.css("marginLeft", "-" + ((newW / 2) + 1) + "px")
				.css("marginTop", "-" + (newH / 2) + "px")
				.css("cursor", "pointer");
	}
});

var WatermarkPhotoViewer = PhotoViewer.extend({
	init: function(photoNode) {
		this._super(photoNode, {lock: true});
		
		this.watermark = $("<img />");
		this.watermark.attr("src", "img/watermark.png");
		this.watermark.addClass("watermark");
		this.holder.prepend(this.watermark);
		
		this.wmBar = $("<div></div>").addClass("wm-bar");
		this.holder.prepend(this.wmBar);

		this.watermark.draggable().on("drag", (function(uploader) {
			return function(event, ui) {
				uploader.currentPhoto.value.wm.x = Math.floor(ui.position.left / uploader.currentRatio);
				uploader.currentPhoto.value.wm.y = Math.floor(ui.position.top / uploader.currentRatio);
				uploader.wmBar.css("top", ui.position.top + "px");
			};
		})(this));
		
		$(window).bind("mousewheel", (function(uploader) {
			return function(event) {
				if (event.originalEvent.wheelDelta >= 0) {
					uploader.imageList[uploader.currentImage].wm.s += 0.01;
				} else {
					uploader.imageList[uploader.currentImage].wm.s -= 0.01;
				}
				uploader.resizeImage();
			};
		})(this));
		
		var closer = function(uploader) {
			return function() {
				uploader.deconstruct(false);
			};
		};
		
		this.submitButton = $("<button></button>").text("Submit").click((function(uploader) {
			return function() {
				uploader.submitImage();
			};
		})(this));
		
		this.controls = $("<div></div>").addClass("controls").append(/*
			$("<button></button>").text("<<").click((function(uploader) {
				return function() { uploader.previous() };
			})(this)),*/
			$("<button></button>").text("Invert Watermark").click((function(uploader) {
				return function() {
					uploader.wmBar.toggleClass("black");
					uploader.imageList[uploader.currentImage].wmBarWhite = !uploader.imageList[uploader.currentImage].wmBarWhite;
				};
			})(this)),
			$("<button></button>").text("Cancel Upload").click(closer(this)),
			this.submitButton
			/*,
			$("<button></button>").text(">>").click((function(uploader) {
				return function() { uploader.next() };
			})(this))*/
		);
		
		this.holder.append(this.controls);
		
		this.bg.click(closer(this));
		
		$('body').append(this.bg, this.holder);
				
		$(window).resize((function(uploader) {
			return function(event) {
				if (uploader.finished) {
					$(window).unbind(event);
					return;
				}
				
				uploader.resizeImage();
			};
		})(this));
		
		/*
		$(document).keydown((function(uploader) {
			return function(event) {
				if (uploader.holder.is(":visible")) {
					if (event.which == 37) {
						uploader.previous();
					} else if (event.which == 39) {
						uploader.next();
					}
				}
			};
		})(this));
		*/
		
		for (var i = 0; i < this.imageList.length; i++) {
			var watermark = {};
			watermark.x = 0;
			watermark.y = 0;
			watermark.s = this.imageList[i].height / 7 / WM_H;
			this.imageList[i].wm = watermark;
			this.imageList[i].wmBarWhite = true;
		}
	}
});

var Gallery = Class.extend({
	init: function(id) {
		this.holder = $("<div></div>");
		this.holder.hide();
		this.holder.attr("id", "galleryimgholder");
		
		this.holder.click((function(gallery) {
			return function() { gallery.next() };
		})(this));
		
		this.bg = $("<div></div>");
		this.bg.attr("id", "gallerybg");
		this.bg.hide();
		
		this.bg.click((function(gallery) {
			return function() { gallery.hide() };
		})(this));
		
		$('body').append(this.bg, this.holder);
		this.currentId = -1;
		this.loadedImageCount = 0;
		this.uploadedImages = 0;
		
		this.uploadCallback = false;
				
		$(window).resize((function(gallery) {
			return function() { gallery.resizeImage() };
		})(this));
		
		$(document).keydown((function(gallery) {
			return function(event) {
				if (gallery.holder.is(":visible")) {
					if (event.which == 37) {
						gallery.previous();
					} else if (event.which == 39) {
						gallery.next();
					} else if (event.which == 27) {
						gallery.hide();
					}
				}
			};
		})(this));
		
		$('#file').change((function(gallery) {
			return function() {
				$('#file_upload_form').attr("action", "api/gallery.php");
				$('#file_upload_form').attr("target", 'upload_target'); //'upload_target' is the name of the iframe
				gallery.uploadButton.hide();
				gallery.uploadProgress.show();
				$('#file_upload_form').submit();
			};
		})(this));
			
		
		setInterval(this.checkUpload, 100);
		setInterval(this.triggerLoadMore, 500);
	},
	setCurrentAlbumId: function(id) {
		this.albumId = id;
	},
	setImageList: function(images) {
		this.imageList = images;
		this.loadedImageCount = 0;
		this.uploadedImages = 0;
		this.currentId = -1;
		this.holder.find("img").remove();
		$('#gallery .gallthumb').remove();
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
			img.attr("src", "/img/photos/" + imageInfo.thumb);
			img.attr("width", imageInfo.width);
			img.attr("height", imageInfo.height);
			this.holder.append(img);
			this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
				.css("marginTop", "-" + (imageInfo.height / 2) + "px")
				.css("cursor", "pointer");
				
			var fullImg = $("<img />").attr('src', "/img/photos/" + imageInfo.full).load(function() {
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
			var url = "/img/photos/" + imageInfo.thumb;
			
			var div = $("<div></div>");
			div.attr("id", "gallimg_" + this.loadedImageCount);
			div.addClass("gallthumb");
			div.css("background-image", "url(" + url + ")");
			
			var ratio = Math.max(140/imageInfo.width, 140/imageInfo.height);
									
			div.css("background-size", (ratio * imageInfo.width) + "px " + (ratio * imageInfo.height) + "px");
			div.css("background-position", "-" + (((ratio * imageInfo.width) - 140) / 2) + "px -" + (((ratio * imageInfo.height) - 140) / 2) + "px");
			
			div.click(function(e) {
				gallery.show(parseInt(e.target.id.substring(8)));
			});
			
			this.insertionPoint.before(div);
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
			if (winW < imgW + (window.innerWidth * 0.2)) {
				newW = winW - (window.innerWidth * 0.2);
				newH = Math.ceil(imgH * (newW / imgW));
			}
			
			if (winH < newH + (window.innerHeight * 0.2)) {
				newH = winH - (window.innerHeight * 0.2);
				newW = Math.ceil(imgW * (newH / imgH));
			}
			
			
			
			currImg.attr("width", newW);
			currImg.attr("height", newH);
			
			this.holder.css("marginLeft", "-" + ((newW / 2) + 1) + "px")
					.css("marginTop", "-" + (newH / 2) + "px")
					.css("cursor", "pointer");
		}
	},
	setUploadAndProgressAndInsertionPoint: function(uploadButton, uploadProgress, insertionPoint) {
		uploadButton.click(function() {
			$('#file').trigger("click");
		});
		this.uploadButton = uploadButton;
		this.uploadProgress = uploadProgress;
		this.insertionPoint = insertionPoint;
	},
	setUploadImageCallback: function(callback) {
		this.uploadCallback = callback;
	},
	checkUpload: function() {
		if ($iFrame('imageresult')) {
			var resultSpan = $iFrame('imageresult');
			if (resultSpan.innerHTML == "") {
				return;
			}
			var imageList = $.parseJSON(resultSpan.innerHTML);
			resultSpan.innerHTML = "";
			
			if (!imageList.hasOwnProperty("error")) {
				var uploader = new Uploader(imageList, gallery);
				uploader.show(0);
			} else {
				var parts = imageList.error.split("|");
				newMessage(parts[0], parts[1]);
			}
			
			$('#file_upload_form').show();
			$('#upload_ajax').hide();
		}
	},
	addImage: function(imageInfo) {
		var id;
		if (this.imageList == null) {
			id = 0;
			this.imageList = [imageInfo];
		} else {
			id = this.imageList.length;
			this.imageList.push(imageInfo);
		}
		
		var url = "/img/photos/" + imageInfo.thumb;
		
		var div = $("<div></div>");
		div.attr("id", "gallimg_" + id);
		div.addClass("uploaded, gallthumb");
		div.css("background-image", "url(" + url + ")");
		
		var ratio = Math.max(140/imageInfo.width, 140/imageInfo.height);

		div.css("background-size", (ratio * imageInfo.width) + "px " + (ratio * imageInfo.height) + "px");
		div.css("background-position", "-" + (((ratio * imageInfo.width) - 140) / 2) + "px -" + (((ratio * imageInfo.height) - 140) / 2) + "px");
		
		div.click(function(e) {
			var tmpId = parseInt(e.target.id.substring(8));
			gallery.show(tmpId);
		});
		
		this.insertionPoint.before(div);
		this.uploadedImages++;
		this.uploadCallback(imageInfo);
	},
	uploadComplete: function() {
		this.uploadButton.show();
		this.uploadProgress.hide();
	}
});

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
	if (!$(elem).length || !$(elem).is(":visible")) {
		return false;
	}
	
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

var WM_W = 1521;
var WM_H = 681;

var UPLOADER = false;

var Uploader = Class.extend({
	init: function(images, gallery) {
		UPLOADER = this;
		
		this.album = gallery;
		
		this.imageList = images;
		this.currentImage = 0;
		
		this.holder = $("<div></div>");
		this.holder.hide();
		this.holder.attr("id", "uploaderimgholder");
		
		this.bg = $("<div></div>");
		this.bg.attr("id", "uploaderbg");
		this.bg.addClass("lockable");
		this.bg.hide();
		
		this.watermark = $("<img />");
		this.watermark.attr("src", "img/watermark.png");
		this.watermark.addClass("watermark");
		this.holder.prepend(this.watermark);
		
		this.wmBar = $("<div></div>").addClass("wm-bar");
		this.holder.prepend(this.wmBar);

		this.watermark.draggable().on("drag", (function(uploader) {
			return function(event, ui) {
				uploader.imageList[uploader.currentImage].wm.x = Math.floor(ui.position.left / uploader.currentRatio);
				uploader.imageList[uploader.currentImage].wm.y = Math.floor(ui.position.top / uploader.currentRatio);
				uploader.wmBar.css("top", ui.position.top + "px");
			};
		})(this));
		
		$(window).bind("mousewheel", (function(uploader) {
			return function(event) {
				if (event.originalEvent.wheelDelta >= 0) {
					uploader.imageList[uploader.currentImage].wm.s += 0.01;
				} else {
					uploader.imageList[uploader.currentImage].wm.s -= 0.01;
				}
				uploader.resizeImage();
			};
		})(this));
		
		var closer = function(uploader) {
			return function() {
				uploader.deconstruct(false);
			};
		};
		
		this.submitButton = $("<button></button>").text("Submit").click((function(uploader) {
			return function() {
				uploader.submitImage();
			};
		})(this));
		
		this.controls = $("<div></div>").addClass("controls").append(/*
			$("<button></button>").text("<<").click((function(uploader) {
				return function() { uploader.previous() };
			})(this)),*/
			$("<button></button>").text("Invert Watermark").click((function(uploader) {
				return function() {
					uploader.wmBar.toggleClass("black");
					uploader.imageList[uploader.currentImage].wmBarWhite = !uploader.imageList[uploader.currentImage].wmBarWhite;
				};
			})(this)),
			$("<button></button>").text("Cancel Upload").click(closer(this)),
			this.submitButton
			/*,
			$("<button></button>").text(">>").click((function(uploader) {
				return function() { uploader.next() };
			})(this))*/
		);
		
		this.holder.append(this.controls);
		
		this.bg.click(closer(this));
		
		$('body').append(this.bg, this.holder);
				
		$(window).resize((function(uploader) {
			return function(event) {
				if (uploader.finished) {
					$(window).unbind(event);
					return;
				}
				
				uploader.resizeImage();
			};
		})(this));
		
		/*
		$(document).keydown((function(uploader) {
			return function(event) {
				if (uploader.holder.is(":visible")) {
					if (event.which == 37) {
						uploader.previous();
					} else if (event.which == 39) {
						uploader.next();
					}
				}
			};
		})(this));
		*/
		
		for (var i = 0; i < this.imageList.length; i++) {
			var watermark = {};
			watermark.x = 0;
			watermark.y = 0;
			watermark.s = this.imageList[i].height / 7 / WM_H;
			this.imageList[i].wm = watermark;
			this.imageList[i].wmBarWhite = true;
		}
	},
	deconstruct: function(force) {
		var uploader = this;
		var deconstructFunc = function() {
			hideMessage();
			unlockScrolling();
			uploader.holder.remove();
			uploader.bg.remove();
			uploader.album.uploadComplete();
		};
		
		if (force) {
			deconstructFunc();
			return;
		}
		
		newMessage(	"Confirm Cancellation",
					"Are you sure you want to cancel the upload?",
					[
						$('<button></button>').text("No").click(hideMessage),
						$('<button></button>').text("Yes").click(deconstructFunc)
					]
		);
	},
	resizeImage: function() {
		if (this.holder.find("img:visible:not(.watermark)").length) {
			var currImg = this.holder.find("img:visible:not(.watermark)");
			var imageInfo = this.imageList[this.currentImage];
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
			if (winW < imgW + (window.innerWidth * 0.2)) {
				newW = winW - (window.innerWidth * 0.2);
				newH = Math.ceil(imgH * (newW / imgW));
			}
			
			if (winH < newH + (window.innerHeight * 0.2)) {
				newH = winH - (window.innerHeight * 0.2);
				newW = Math.ceil(imgW * (newH / imgH));
			}
			
			this.currentRatio = newW / imgW;
			
			this.watermark.css("left", Math.floor(imageInfo.wm.x * this.currentRatio) + "px")
					.css("top", Math.floor(imageInfo.wm.y * this.currentRatio) + "px")
					.width(Math.floor(WM_W * imageInfo.wm.s * this.currentRatio))
					.height(Math.floor(WM_H * imageInfo.wm.s * this.currentRatio));
			
			this.wmBar.css("top", Math.floor(imageInfo.wm.y * this.currentRatio) + "px")
				.height(Math.floor(WM_H * imageInfo.wm.s * this.currentRatio)).toggleClass("black", !imageInfo.wmBarWhite);
			
			currImg.attr("width", newW);
			currImg.attr("height", newH);
			
			this.holder.css("marginLeft", "-" + ((newW / 2) + 1) + "px")
					.css("marginTop", "-" + (newH / 2 + 20) + "px");
		}
	},
	next: function() {
		this.setImage(this.currentImage + 1);
	},
	previous: function() {
		this.setImage(this.currentImage - 1);
	},
	show: function(imageId) {
		this.setImage(parseInt(imageId));
		
		this.bg.show();
		this.holder.show();
		
		this.resizeImage();
		
		var scrollPosition = [
			self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
			self.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop
		];
		
		lockScrolling();
	},
	setImage: function(imageId) {
		if (imageId >= 0 && imageId < this.imageList.length) {
			this.currentImage = parseInt(imageId);
			$(this.holder).find("img:not(.watermark)").hide();
			var imageInfo = this.imageList[imageId];
			
			/*
			this.holder.find(".controls button").show();
			
			if (imageId == 0) {
				this.holder.find(".controls button").first().hide();
			}
			
			if (imageId == this.imageList.length - 1) {
				this.holder.find(".controls button").last().hide();
			}
			*/
			
			if ($(this.holder).find('img[fullimg="' + imageId + '"]').length) {
				$(this.holder).find('img[fullimg="' + imageId + '"]').show();
				this.watermark.draggable("option", "containment", $(this.holder).find('img[fullimg="' + imageId + '"]'));
				this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
					.css("marginTop", "-" + (imageInfo.height / 2) + "px");
				this.resizeImage();
				return;
			} 
			
			var img = $("<img />");
			img.attr("src", imageInfo.filepath);
			img.attr("width", imageInfo.width);
			img.attr("height", imageInfo.height);
			img.attr("fullimg", imageId);
			this.holder.prepend(img);
			this.watermark.draggable("option", "containment", img);
			this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
				.css("marginTop", "-" + (imageInfo.height / 2) + "px");
			
			this.resizeImage();
		}
	},
	submitImage: function() {
		this.submitButton.prop("disabled", true).text("Submitting...");
		$.post("api/gallery.php", {action: "submit", album_id: this.album.albumId, image: this.imageList[this.currentImage]}, (function(uploader) {
			return function(json) {
				uploader.album.addImage(json.image_info);
				
				if (uploader.currentImage == uploader.imageList.length - 1) {
					uploader.deconstruct(true);
				} else {
					uploader.next();
					uploader.submitButton.prop("disabled", false).text("Submit");
				}
			};
		})(this), "json");
	}
});

function objToString(obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str += p + '::' + obj[p] + '\n';
        }
    }
    return str;
}



// Start MessageBox Code

var cancelOK = true;

function initMessageBox() {
	$('#messagebg, #messagebox').remove();
	
	$('body').append(
		$('<div></div>').attr("id", "messagebg"),
		$('<div></div>').attr("id", "messagebox")
		.html('<h2 id="messagetitle">' +
				'Test' + 
			'</h2>' +
			'<div class="divider"></div>' +
			'<div id="loadingmessage"><img src="../img/ajax-load-bar.gif" alt="Loading..." /></div>' +
			'<p id="messagebody">' +
				'This is a test message.' +
			'</p>' +
			'<div id="messagebuttons">' +
				'<button id="messagebtn1">Confirm</button> <button id="messagebtn2">Cancel</button>' +
			'</div>')
	);
	
	$('#messagebox').draggable({handle: $('#messagetitle')});
	$('#messagebg, #messagebox, #loadingmessage').hide();
}

function newMessage(title, body, buttons) {
	initMessageBox();
	
	if (body.length < 80) {
		$('#messagebody').css("text-align", "center");
	} else {
		$('#messagebody').css("text-align", "justify");
	}
	
	$('#messagetitle').html(title);
	$('#messagebody').html(body);
	
	if (buttons == undefined) {
		var buttons = [$('<button></button>').text("Ok").click(hideMessage)];
	} 
	
	$('#messagebuttons').empty().append(buttons);
	
	$('#messagebg').show();
	$('#messagebox').show();
	
	lockScrolling();
	
	if ($('#messagebody').find("input").length) {
		$('#messagebody').find("input").focus();
	} else if (buttons.length > 0) {
		buttons[0].focus();
	}
}

function hideMessage() {
	if (cancelOK && $('#messagebox:visible').length) {
		$('#messagebg').hide();
		$('#messagebox').hide();
		unlockScrolling();
	}
}

function loadingMessage(title) {
	newMessage(title, "", []);
	$('#loadingmessage').show();
}

function ajaxError(jqXHR) {
	var json = $.parseJSON(jqXHR.responseText);
	newMessage(json.title, json.message);
}

function generalError() {
	newMessage("Server Error", "There was an error.");
}






var LinkedList = Class.extend({
	init: function(array) {
		this.head = this.tail = null;
		this.length = 0;
		
		if (arguments.length > 0) {
			for (var i = 0; i < array.length; i++) {
				this.append(array[i]);
			}
		}
	},
	prepend: function(value) {
		if (this.head == null) {
			this.head = this.tail = {
				value: value,
				prev: null,
				next: null
			};
		} else {
			var temp = this.tail;
			this.head = {
				value: value,
				prev: null,
				next: this.head
			};
			temp.prev = this.head;
		}
		
		this.length++;
		return this.head;
	},
	append: function(value) {
		if (this.head == null) {
			this.head = this.tail = {
				value: value,
				prev: null,
				next: null
			};
		} else {
			var temp = this.tail;
			this.tail = {
				value: value,
				prev: this.tail,
				next: null
			};
			temp.next = this.tail;
		}
		
		this.length++;
		return this.tail;
	},
	getNodeAt: function(index) {
		if (index >= this.length) {
			throw "IndexOutOfBounds: " + index;
		}
		
		var current;
		if (index <= this.length / 2) {
			current = this.tail;
			for (var i = this.length; i > index; i--) {
				current = current.prev;
			}
		} else {
			current = this.head;
			for (var i = 0; i < index; i++) {
				current = current.next;
			}
		}
		
		return current;
	}
});