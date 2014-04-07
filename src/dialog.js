/**
 * Dialog
 * 
 * 对话框
 * 
 * Dependencies :
 * 	- Core
 *  - Draggable
 */
(function ($) {
	var stone = window.stone,
	Widget = stone.Widget,
	Drag = stone.Drag;
	
	stone.zIndex = 99;
	
	var template = 
		'<div class="s-dialog s-outer">' + 
			'<div class="s-dialog-header">' +
				'<div class="s-dialog-title"></div>' +
				'<div class="s-dialog-actions"><div class="s-ico-close"></div></div>' +
			'</div>' +
			'<div class="s-dialog-content"></div>' +
			'<div class="s-dialog-buttons"></div>' +
		'</div>';

	$(window).resize(function(){
		$('body>div.s-window-mask').css({
			width: $(window).width(),
			height: $(window).height()
		});
	});
	
	var Dialog = function () {};
	Dialog = Widget.extend({
		name : 'dialog',
		init : function (element, options) {
			if (!options) {
				options = element;
				element = null;
			}
			Widget.fn.init.call(this, element, options);
		},
		defaults: {
			title : '',
			content : '',
			//buttons : [{text : 'ok', click : function () {alert('ok');}}, {text : 'cacel', click : function () {alert('cancel');}}],
			buttons : null,
			width: 200,
        	height: 120,
        	position: {},
	        modal: false,
	        pin : false,
	        timeout : 0,
	        draggable : true
		},
		renderUI : function () {
			var that = this, opts = this.options, win = this.win = $(template);
			this.wrap = {
				win : win,
				content : $(".s-dialog-content", win),
				header : $(".s-dialog-header", win),
				title : $(".s-dialog-title", win),
				actions : $(".s-dialog-actions", win),
				buttons : $(".s-dialog-buttons", win),
			};
			
			if (opts.buttons) {
				var buttons = this.wrap.buttons;
				$.each(opts.buttons, function (i, n) {
					var btn = $('<button class="s-button"></button>').appendTo(buttons);
					btn.html(n.text);
					n.click && btn.click(function () { n.click(n, that);});
				});
			} else {
				this.wrap.buttons.remove();
			}
			$('body').append(win);
		},
		bindEvents : function () {
			var that = this;
            this._setOptions();
            // create mask
			if (this.mask) this.mask.remove();
			if (this.options.modal == true){
				this.mask = $('<div class="s-window-mask"></div>').appendTo('body');
				this.mask.css({
					width: $(window).width(),
					height: $(window).height()
				});
			}
			
			$('.s-ico-close', this.wrap.actions).click(function (e) {
				that.close();
			});
			
			var timer = null, timeout = this.options.timeout;
			
			if (timeout > 0){
				timer = setTimeout(function(){
					that.close();
				}, timeout);
			}

			this.win.hover(
				function(){
					if (timer){
						clearTimeout(timer);
					}
				},
				function(){
					if (timeout > 0){
						timer = setTimeout(function(){
							that.close();
						}, timeout);
					}
				}
			);
			this.active();
		},
		_setOptions : function () {
			this.setTitle(this.options.title);
			this._setContent();
			this._dimensions();
			this._postion();
			
			if (this.options.pin) {
				this.pin();
			}
            this._draggable();
		},
		setTitle : function(title) {
			var wrap = this.wrap;
			if (!typeof(title) === 'undefined') {
				$('.s-dialog-title', wrap.header).html(title);
			}
		},
		_setContent : function () {
			var opts = this.options, wrap = this.wrap;
			
			if (opts.content) {
				if (opts.content instanceof jQuery) {
					opts.content.appendTo(wrap.content);
					opts.content.css({
						display : '',
						visibility : 'visible'
					});
				} else {
					$("<div/>").addClass('s-dialog-inner').html(opts.content).appendTo(wrap.content);
				}
			} else if (this.element) {
				this.element.appendTo(wrap.content);
				this.element.css({
					display : '',
					visibility : 'visible'
				});
			}
		},
		_dimensions: function() {
			var that = this, wrap = this.wrap;
            opts = that.options;
			
            that.win.css({
				width : opts.width
			});
            
            wrap.content.css({
            	height : opts.height - wrap.actions.outerHeight() - wrap.buttons.outerHeight()
            });
		},
		_postion : function () {
			var wrap = this.wrap;
        	var position = this.options.position || {};
        	
        	if (position.top !== undefined && position.left !== undefined) {
                position.top = position.top.toString();
                position.left = position.left.toString();
            
                wrap.win.css({
	                top: position.top || "",
	                left: position.left || ""
	            });
			} else if (position.right !== undefined && position.bottom !== undefined) {
                position.right = position.right.toString();
                position.bottom = position.bottom.toString();
            
                wrap.win.css({
                	right: position.right || "",
                	bottom: position.bottom || ""
	            });
			} else {
				this.center();
			}
		},
		_draggable : function () {
        	var that = this,
        	win = this.win,
        	opts = this.options;
        	
        	if (Drag && opts.draggable === true) {
				that.drag = new Drag(win, {
					handle:'.s-dialog-title',
					disabled: that.options.draggable == false,
					onDragStart: function (e) {
						that.active();
						
						if (!that.proxy){
							that.proxy = $('<div class="s-window-proxy"></div>').insertAfter(that.win);
						}
						that.proxy.css({
							display : 'none',
							zIndex : stone.zIndex ++,
							left : e.data.left,
							top : e.data.top,
							width : (that.win.outerWidth()),
							height : (that.win.outerHeight())
						});
						setTimeout(function(){
							if (that.proxy) that.proxy.show();
						}, 500);
					},
					onDrag: function(e){
						that.proxy.css({
							display:'block',
							left: e.data.left,
							top: e.data.top
						});
						return false;
					},
					onDragStop: function(e){
						that.proxy.remove();
						that.proxy = null;
					}
				});
			}
        },
        
		center: function () {
            var that = this,
            win = that.win,
            documentWindow = $(window);
            win.css({
                left: documentWindow.scrollLeft() + Math.max(0, (documentWindow.width() - win.width()) / 2),
                top: documentWindow.scrollTop() + Math.max(0, (documentWindow.height() - win.height()) / 2)
            });
            return that;
        },
        
        close : function () {
        	var that = this;
        	that.hide();
			setTimeout(function () { that.destroy(); }, 200);
        },
        
		hide: function () {
			var that = this;
			this.win.removeClass('s-state-visible');
			setTimeout(function () { that.win.css('visibility', 'hidden'); }, 200);
			
			if (this.mask) {
	        	this.mask.fadeOut('fast');
	        }
	    },
	    
	    show: function () {
	        this.win.css('visibility', 'visible').addClass('s-state-visible');
	    },
	    
	    pin: function() {
            var that = this,
                win = that.win,
                top = parseInt(win.css("top"), 10),
                left = parseInt(win.css("left"), 10);

            if (!that.options.pinned) {
            	win.css({position: "fixed", top: top - $(window).scrollTop(), left: left - $(window).scrollLeft()});
                that.isPinned = true;
            }
        },
        
        active: function () {
            var that = this;
            if (that.isMinimized) {
                that.show();
            }
            that.actived = true;
            that.show();
            that.win.css('z-index', stone.zIndex ++);
        },
        
	    destroy: function () {
	    	var that = this;
	    	if (that.mask) that.mask.remove();
	    	this.win.remove();
	    	this.wrap = null;
	    }
	});
	
	/***** Dialog  *****/
	
	Dialog.icons = {
		alert : 's-dialog-alert',
		confirm : 's-dialog-confirm',
		error : 's-dialog-error',
		success : 's-dialog-success'
	};
	
	Dialog.getIcon = function (icon) {
		var ico = this.icons[icon] || icon;
		return '<div class="s-dialog-icon ' + ico + '"></div>';
	};
	
	/**
	 * 
	 * options: {
	 * 		title : 'title',
	 * 		content : 'content',
	 * 		icon : alert|confirm|error|success|custom icon class
	 * 		onSure : function (button, dialog) {}
	 * }
	 * 
	 */
	Dialog.alert = function (options) {
		var content = this.getIcon(options.icon || 'alert') + '<div class="s-dialog-bubble">' + options.content + '</div></div>';
		options = stone.extend(options, {
			content : content,
			buttons : [{
				text : '确定',
				click : function (btn , dialog) {
					(options.onSure || $.noop).call(btn, dialog);
					dialog.close();
				}
			}],
        }, true);
		return new Dialog(options);
	};
	
	/**
	 * 
	 * options: {
	 * 		title : 'title',
	 * 		content : 'content',
	 * 		icon : alert|confirm|error|success|custom icon class
	 * 		onSure : function (button, dialog) {}
	 * 		onCancel : function (button, dialog) {}
	 * }
	 * 
	 */
	Dialog.confirm = function (options) {
		var content = this.getIcon(options.icon || 'confirm') + '<div class="s-dialog-bubble">' + options.content + '</div></div>';
		options = stone.extend(options, {
			content : content,
			buttons : [{
				text : '确定',
				click : function (btn , dialog) {
					(options.onSure || $.noop).call(btn, dialog);
					dialog.close();
				}
			}, {
				text : '取消',
				click : function (btn , dialog) {
					(options.onCancel || $.noop).call(btn, dialog);
					dialog.close();
				}
			}],
        }, true);
		return new Dialog(options);
	};
	
	Dialog.prompt = function (options) {
		options = stone.extend(options, {
			buttons : [{
				text : '确定',
				click : function (btn , dialog) {
					(options.onSure || $.noop).call(btn, dialog);
					dialog.close();
				}
			}]
        }, true);
		return new Dialog(options);
	};
	
	stone.Dialog = Dialog;
	stone.bridgeTojQuery("dialog", Dialog);
	
})(window.jQuery);