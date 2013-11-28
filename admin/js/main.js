var WM_W = 1521;
var WM_H = 681;

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
		var createBlogPostItems = function(post, headerTitle, saveCallback) {
			var header = $('<header></header>').attr("post-id", post.id).text(headerTitle);
			
			var title = $('<input></input>').attr("type", "text").attr("placeholder", "Title").val(post.title);
			var content = $('<textarea></textarea>').attr("placeholder", "Type blog post here...").text(post.content);
			
			var saveButton = $('<button></button>').attr("post-id", post.id).text("Save").prop("disabled", true);
			saveButton.click(saveCallback(header, title, content, saveButton));
			
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
			
			return {header: header, article: article};
		};
		
		var normalSaveFunc = function(header, title, content, saveButton) {
			return function() {
				saveButton.add(title).add(content).prop("disabled", true);
				$.post("api/blog.php", {action: "update", id: parseInt(header.attr("post-id")), title: title.val(), content: content.val()}, function(json) {
					header.text(title.val());
					resetFields([title, content]);
					title.add(content).prop("disabled", false);
				}).error(function() {
					saveButton.add(title).add(content).prop("disabled", false);
					newMessage("Server Error", "There was an error updating the blog post. Try again.");
				});
			};
		};
		
		var newBlogPostElements = createBlogPostItems({id: 0, title: "", content: ""}, "New Blog Post", function(header, title, content, saveButton) {
			return function() {
				saveButton.add(title).add(content).prop("disabled", true);
				$.post("api/blog.php", {action: "create", title: title.val(), content: content.val()}, function(json) {
					title.add(content).prop("disabled", false);
					title.val("");
					content.val("");
					resetFields([title, content]);
					
					newBlogPostElements.article.hide();
					var elements = createBlogPostItems(json, json.title, normalSaveFunc);
					newBlogPostElements.article.after(elements.header, elements.article);
					elements.article.find("input").focus();
				}, "json").error(function() {
					saveButton.add(title).add(content).prop("disabled", false);
					newMessage("Server Error", "There was an error creating the blog post. Try again.");
				});
			};
		});
		
		$('section').append(newBlogPostElements.header, newBlogPostElements.article);
		newBlogPostElements.article.hide();
		
		for (var i = 0; i < json.posts.length; i++) {
			var elements = createBlogPostItems(json.posts[i], json.posts[i].title, normalSaveFunc);
			$('section').append(elements.header, elements.article);
			elements.article.hide();
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
		
		var insertAlbum = function(header, albumId, photos) {
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
						
						new ModifiableAlbum(albumId, $("#gallery"), photos, {
							uploadTrigger: uploadButton,
							uploadingIndicator: uploadingProgress,
							uploadCallback: function(imageInfo) {
								header.find(".album-image-strip").prepend($('<img />').attr("src", "/img/photos/" + imageInfo.thumb));
								header.find(".album-small-desc").text(photos.length + (photos.length == 1 ? " photo" : " photos"))
							}
						});
						
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
			
			insertAlbum(header, album.id, photos);
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
							var photos = new LinkedList(album.photos);
							var header = $('<header></header>').addClass("album").attr("album-id", album.id).data("photos", photos).append(
								$('<div></div>').addClass("album-image-strip"),
								$('<div></div>').append(
									$('<span></span>').addClass("album-title").text(album.title),
									$('<span></span>').addClass("album-small-desc").text(album.photos.length + (album.photos.length == 1 ? " photo" : " photos"))
								)
							);
			
							insertAlbum(header, album.id, photos);
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
	$(elements).each(function() {
		$(this).data("original", $(this).val()).attr("edited", false);
	});
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
	init: function(albumId, container, photos, options) {
		this.id = albumId;
		this.container = container.text("");
		this.photos = photos;
		this.lastLoadedPhoto = {next: photos.head, prev: photos.tail};
		this.options = arguments.length > 3 ? options : null;
		
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
			var div = this.generateThumbnail(imageInfo);
			div.data("photoNode", currentPhoto);
			
			this.addPhoto(div);
			this.lastLoadedPhoto = currentPhoto;
			currentPhoto = currentPhoto.next;
		}
		
		if (currentPhoto != null) return false;
		return true;
	},
	addPhoto: function(thumbnail) {
		this.container.append(thumbnail);
	},
	generateThumbnail: function(imageInfo) {
		var url = "/img/photos/" + imageInfo.thumb;
		
		var div = $("<div></div>");
		div.addClass("gallthumb");
		div.css("background-image", "url(" + url + ")");
		
		var ratio = Math.max(140/imageInfo.width, 140/imageInfo.height);
								
		div.css("background-size", (ratio * imageInfo.width) + "px " + (ratio * imageInfo.height) + "px");
		div.css("background-position", "-" + (((ratio * imageInfo.width) - 140) / 2) + "px -" + (((ratio * imageInfo.height) - 140) / 2) + "px");
		
		div.click(function(e) {
			new PhotoViewer($(this).data("photoNode"), {
				folderPrefix: "/img/photos/"
			});
		});
		
		return div;
	}
});

var ModifiableAlbum = Album.extend({
	init: function(albumId, container, photos, options) {
		if (arguments.length < 4) {
			throw "Must supply options";
		} else if (!options.hasOwnProperty("uploadTrigger")) {
			throw "Must supply upload trigger";
		}
		
		this._super(albumId, container, photos, options);
		
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
		}).change((function(album) {
			return function() {
				if ($(this).val() == "") {
					return;
				}
				album.uploadForm.attr("action", "api/gallery.php");
				album.uploadForm.attr("target", 'album_upload_target');
				album.options.uploadTrigger.addClass("disabled");
				if (album.options.hasOwnProperty("uploadingIndicator")) {
					album.options.uploadingIndicator.show();
				}
				var intervalId = setInterval(function() {
					album.options.uploadTrigger.removeClass("disabled");
					if (album.options.hasOwnProperty("uploadingIndicator")) {
						album.options.uploadingIndicator.hide();
					}
					
					
					var frame = album.uploadFrame[0];
					var result = frame.contentWindow.document.getElementById("imageresult");
					if (result == null || result.innerHTML == "") {
						return;
					}
					
					clearInterval(intervalId);
					var imageList = $.parseJSON(frame.contentWindow.document.getElementById("imageresult").innerHTML);
					frame.contentWindow.document.getElementById("imageresult").innerHTML = "";
			
					if (!imageList.hasOwnProperty("error")) {
						new WatermarkPhotoViewer(new LinkedList(imageList), album.id, function(imageInfo) {
							album.photos.prepend(imageInfo);
		
							var div = album.generateThumbnail(imageInfo);
							div.data("photoNode", album.photos.head);
							
							if (album.container.find(".gallthumb").length) {
								album.container.find(".gallthumb").first().before(div);
							} else {
								album.container.append(div);
							}
							if (album.options.hasOwnProperty("uploadCallback")) {
								album.options.uploadCallback(imageInfo);
							}
						});
					} else {
						var parts = imageList.error.split("|");
						newMessage(parts[0], parts[1]);
					}
				}, 500);
				album.uploadForm.submit();
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
		
		this.folderPrefix = "/img/photos/";
		if (arguments.length > 1) {
			if (options.hasOwnProperty("folderPrefix")) {
				this.folderPrefix = options.folderPrefix;
			}
		}
		
		lockScrolling();
		
		if (arguments.length < 2 || !options.hasOwnProperty("setImage") || options.setImage) {
			this.setPhoto(startingPhoto);
		}
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
		var img;
		if ($(this.holder).find('img[fullimg="' + imageId + '"]').length) {
			img = $(this.holder).find('img[fullimg="' + imageId + '"]').show();
			this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
				.css("marginTop", "-" + (imageInfo.height / 2) + "px")
				.css("cursor", "pointer");
		} else {
			img = $("<img />");
			img.attr("src", this.folderPrefix + imageInfo.thumb);
			img.attr("width", imageInfo.width);
			img.attr("height", imageInfo.height);
			this.holder.append(img);
			this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
				.css("marginTop", "-" + (imageInfo.height / 2) + "px")
				.css("cursor", "pointer");
			
			var fullImg = $("<img />").attr('src', this.folderPrefix + imageInfo.full).load((function(viewer) {
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
		return img;
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
		
		this.currentRatio = newW / imgW;
		
		currImg.attr("width", newW);
		currImg.attr("height", newH);
		
		this.holder.css("marginLeft", "-" + ((newW / 2) + 1) + "px")
				.css("marginTop", "-" + (newH / 2) + "px")
				.css("cursor", "pointer");
	}
});

var WatermarkPhotoViewer = PhotoViewer.extend({
	init: function(photos, albumId, addImageCallback) {
		this.albumId = albumId;
		this.addImageCallback = addImageCallback;
		this.photos = photos;
		this._super(photos.head, {lock: true, folderPrefix: "tmp/", setImage: false});
		
		this.holder.addClass("uploader");
		
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
					uploader.currentPhoto.value.wm.s += 0.01;
				} else {
					uploader.currentPhoto.value.wm.s -= 0.01;
				}
				uploader.resizeImage();
			};
		})(this));
		
		this.submitButton = $("<button></button>").text("Submit").click((function(uploader) {
			return function() {
				uploader.submitImage();
			};
		})(this));
		
		this.controls = $("<div></div>").addClass("controls").append(
			$("<button></button>").text("Invert Watermark").click((function(uploader) {
				return function() {
					uploader.wmBar.toggleClass("black");
					uploader.currentPhoto.value.wmBarWhite = !uploader.currentPhoto.value.wmBarWhite;
				};
			})(this)),
			$("<button></button>").text("Cancel Upload").click((function(uploader) {
				return function() { uploader.destroy() };
			})(this)),
			this.submitButton
		);
		
		this.holder.append(this.controls);
		
		$('body').append(this.bg, this.holder);
		
		var current = photos.head;
		while (current != null) {
			var watermark = {};
			watermark.x = 0;
			watermark.y = 0;
			watermark.s = current.value.height / 7 / WM_H;
			current.value.wm = watermark;
			current.value.wmBarWhite = true;
			current = current.next;
		}
		
		this.setPhoto(photos.head);
	},
	destroy: function(flag) {
		var force = arguments.length > 0 && flag;
		
		if (force) {
			hideMessage();
			this._super();
			return;
		}
		
		newMessage(	"Confirm Cancellation",
					"Are you sure you want to cancel the upload?",
					[
						$('<button></button>').text("No").click(hideMessage),
						$('<button></button>').text("Yes").click((function(uploader) {
							return function() {
								uploader.destroy(true);
							};
						})(this))
					]
		);
	},
	prev: function() { /* no-op */ },
	next: function() { /* no-op */ },
	setPhoto: function(photoNode) {
		var imageInfo = photoNode.value;
		
		this.holder.find("img:not(.watermark)").remove();
		this.currentPhoto = photoNode;
		
		var img = $("<img />");
		img.attr("src", imageInfo.filepath);
		img.attr("width", imageInfo.width);
		img.attr("height", imageInfo.height);
		this.holder.prepend(img);
		this.watermark.draggable("option", "containment", img);
		this.holder.css("marginLeft",  "-" + ((imageInfo.width / 2) + 1) + "px")
			.css("marginTop", "-" + (imageInfo.height / 2) + "px");
		
		this.resizeImage();
	},
	resizeImage: function() {
		this._super();
		
		var imageInfo = this.currentPhoto.value;
		
		this.watermark.css("left", Math.floor(imageInfo.wm.x * this.currentRatio) + "px")
				.css("top", Math.floor(imageInfo.wm.y * this.currentRatio) + "px")
				.width(Math.floor(WM_W * imageInfo.wm.s * this.currentRatio))
				.height(Math.floor(WM_H * imageInfo.wm.s * this.currentRatio));
		
		this.wmBar.css("top", Math.floor(imageInfo.wm.y * this.currentRatio) + "px")
			.height(Math.floor(WM_H * imageInfo.wm.s * this.currentRatio)).toggleClass("black", !imageInfo.wmBarWhite);
	},
	submitImage: function() {
		this.submitButton.prop("disabled", true).text("Submitting...");
		$.post("api/gallery.php", {action: "submit", album_id: this.albumId, image: this.currentPhoto.value}, (function(uploader) {
			return function(json) {
				uploader.addImageCallback(json.image_info);
				
				if (uploader.currentPhoto.next == null) {
					uploader.destroy(true);
				} else {
					uploader.setPhoto(uploader.currentPhoto.next);
					uploader.submitButton.prop("disabled", false).text("Submit");
				}
			};
		})(this), "json");
	}
});

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
			var temp = this.head;
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
	},
	toArray: function() {
		var result = [];
		var current = this.head;
		while (current != null) {
			result.push(current.value);
		}
		return result;
	}
});



var WM_W = 1521;
var WM_H = 681;



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