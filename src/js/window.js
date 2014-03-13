/**
 * Window
 * 
 * Dependencies : 
 * 	- Core
 * 	- Draggable
 * 	- Resizable
 */
(function ($) {
	var stone = window.stone,
	Widget = stone.Widget,
	Drag = stone.Drag,
	Resizable = stone.Resizable;
	
	stone.zIndex = 99;
	
	var template = 
		'<div class="s-window s-outer">' + 
			'<div class="s-window-header">' +
				'<div class="s-window-title"></div>' +
				'<div class="s-window-header-actions"></div>' +
			'</div>' +
			'<div class="s-window-content"></div>' +
		'</div>';
	
	function constrain(value, low, high) {
        return Math.max(Math.min(parseInt(value, 10), high === Infinity ? high : parseInt(high, 10)), parseInt(low, 10));
    }
	
	// when window resize, reset the width and height of the window's mask
	$(window).resize(function(){
		$('body>div.s-window-mask').css({
			width: $(window).width(),
			height: $(window).height()
		});
	});
	
	var Window = Widget.extend({
        windowCount : 0,
        defaults : {
        	title: '',
            actions: ['toggle', 'min', 'max', 'close'],
        	minWidth: 100,
        	minHeight: 50,
            maxWidth: Infinity,
            maxHeight: Infinity,
            appendTo : null,
            position: {},
	        modal: false,
	        visible : true,
	        draggable : true,
	        resizable : true
		},
		init : function (element, options) {
			if (!options) {
				options = element;
				element = null;
			}
			Widget.fn.init.call(this, element, options);
			
			this.isCollapsed = false;
			this.isMaximized = false;
			this.restoreOptions = {};
			this.collapsedOptions = {};
		},
		renderUI : function () {
			var opts = this.options;
			var appendTo = opts.appendTo || 'body';
			appendTo = typeof appendTo == 'string' ? $(appendTo) : appendTo;
			
			var win = this.win = $(template);
			var wrap = this.wrap = {
					win : win,
					content : $(".s-window-content", win),
					header : $(".s-window-header", win),
					title : $(".s-window-title", win),
					actions : $(".s-window-header-actions:first", win)
			};
			
			this._actionsHandler();
			this._setContent();
			
			$(appendTo).append(win);
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
			
			if (this.options.visible) {
				this.active();
			}
		},
		_setOptions : function () {
			this.setTitle(this.options.title);
			// 设置大小
			this._dimensions();
			this._postion();
			this._resizable();
            this._draggable();
		},
		setTitle : function (title) {
			var wrap = this.wrap;
			if (!typeof(title) === 'undefined') {
				$('.s-window-title', wrap.header).html(title);
			}
		},
		_setContent : function () {
			var opts = this.options, wrap = this.wrap;
			
			if (opts.href) {
				var loading = $('<div/>').addClass('s-loading').appendTo(wrap.content);
				
				var framename = "stone-window" + this.id;
				var iframe = $('<iframe/>');
				iframe.attr({
					src : opts.href,
					name : framename,
					frameborder : 0
				}).appendTo(wrap.content);
				
				iframe.bind('load', function () {
					loading.remove();
				});
			} else if (opts.content) {
				if (opts.content instanceof jQuery) {
					opts.content.appendTo(wrap.content);
					opts.content.css({
						display : '',
						visibility : 'visible'
					});
				} else {
					$("<div/>").html(opts.content).appendTo(wrap.content);
				}
			} else if (this.element) {
				this.element.appendTo(wrap.content);
				this.element.css({
					display : '',
					visibility : 'visible'
				});
			}
		},
		/**
		 * 设置窗口大小
		 */
		_dimensions: function() {
            var that = this,
                wrap = that.wrap,
                options = that.options,
                w = options.width,
                h = options.height;

            $.each(["minWidth", "maxWidth", "minHeight","maxHeight"], function(_, prop) {
                var value = options[prop];
                if (value && value != Infinity) {
                	wrap.win.css(prop, value);
                }
            });
            
            if (w) {
                if (w.toString().indexOf("%") > 0) {
                	wrap.win.width(w);
                } else {
                	wrap.win.width(constrain(w, options.minWidth, options.maxWidth));
                }
            }

            if (h) {
                if (h.toString().indexOf("%") > 0) {
                	wrap.win.height(h);
                } else {
                	var _h = constrain(h, options.minHeight, options.maxHeight);
                	wrap.win.height(_h);
                }
            }
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
			} else {
				this.center();
			}
        },
        _actionsHandler : function () {
        	var that = this, opts = this.options, actions = this.wrap.actions;
			
			// key -> {class, handler}
			var actionsMap = {
				toggle : {
					iconCls : 's-ico-toggle',
					handler : function (event) {
						that.toggle(event);
					}
				},
				min : {
					iconCls : 's-ico-min',
					handler : function (event) {
						that.minimize(event);
					}
				},
				max : {
					iconCls : 's-ico-max',
					handler : function (event) {
						that.maximize(event);
					}
				},
				close: {
					iconCls : 's-ico-close',
					handler : function (event) {
						that.close(event);
					}
				}
			};
			
			// 添加按钮
			$.each(opts.actions, function (i, n) {
				var act = actionsMap[n];
				if (act) {
					$('<div class="s-window-actions"></div>').addClass(act.iconCls).appendTo(actions).bind('click', act.handler);
				}
            });
        },
        center: function () {
            var that = this,
            win = that.win,
            documentWindow = $(window);
            if (that.options.isMaximized) {
                return that;
            }
            win.css({
                left: documentWindow.scrollLeft() + Math.max(0, (documentWindow.width() - win.width()) / 2),
                top: documentWindow.scrollTop() + Math.max(0, (documentWindow.height() - win.height()) / 2)
            });
            return that;
        },
        _resizable : function () {
        	var that = this,
        	win = this.win,
        	opts = this.options;
        	
        	if (Resizable && opts.resizable === true) {
        		that.resize = new Resizable(win, {
					handle:'.s-window',
					disabled: that.options.resizable == false,
					minWidth : opts.minWidth,
					minHeight : opts.minHeight,
					onResizeStart : function (e) {
						that.active();
						
						if (!that.proxy){
							that.proxy = $('<div class="s-window-proxy"></div>').insertAfter(that.win);
						}
						that.proxy.css({
							zIndex: stone.zIndex ++,
							left: e.data.left,
							top: e.data.top,
							width: ($._boxModel==true ? (e.data.width-(that.proxy.outerWidth()-that.proxy.width())) : e.data.width),
							height: ($._boxModel==true ? (e.data.height-(that.proxy.outerHeight()-that.proxy.height())) : e.data.height)
						});
						
						setTimeout(function(){
							if (that.proxy) that.proxy.show();
						}, 500);
					},
					onResize: function(e){
						that.proxy.css({
							left: e.data.left,
							top: e.data.top,
							width: ($._boxModel==true ? (e.data.width-(that.proxy.outerWidth()-that.proxy.width())) : e.data.width),
							height: ($._boxModel==true ? (e.data.height-(that.proxy.outerHeight()-that.proxy.height())) : e.data.height)
						});
					},
					onResizeStop: function(e){
						that.proxy.remove();
						that.proxy = null;
						that.active();
					}
				});
			}
        },
        _draggable : function () {
        	var that = this,
        	win = this.win,
        	opts = this.options;
        	
        	if (Drag && opts.draggable === true) {
				that.drag = new Drag(win, {
					handle:'.s-window-title',
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
							width : ($._boxModel==true ? (that.win.outerWidth()-(that.proxy.outerWidth()-that.proxy.width())) : that.win.outerWidth()),
							height : ($._boxModel==true ? (that.win.outerHeight()-(that.proxy.outerHeight()-that.proxy.height())) : that.win.outerHeight())
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
        toggle : function (event) {
        	var that = this;
        	var wrap = this.wrap,
        	opts = this.options,
        	win = this.win,
        	content = wrap.content;
        	
        	var target = event.target;
        	// restore
            if (that.isCollapsed == true) {
            	that.isCollapsed = false;
            	if (opts.minHeight) {
            		win.css("min-height", opts.minHeight);
            	}
                win.height(that.collapsedOptions.height);
                $(target).removeClass("s-ico-toggle-close");
                
            } else {
            	that.isCollapsed = true;
            	that.collapsedOptions = {
            		height : win.height()
            	};
                win.css({
                	 height: '',
                     minHeight: ''
                });
                $(target).addClass("s-ico-toggle-close");
            }
            content.toggle();
        },
        maximize : function (event) {
        	var that = this, win = this.win, target = event.target;
        	
        	if (this.isCollapsed) {
        		that.toggle(event);
        	}
        	
        	if (that.isMaximized == true) {
            	that.isMaximized = false;
            	var restoreOptions = that.restoreOptions;
            	win.css({
            		width : restoreOptions.width,
            		height : restoreOptions.height,
            		top : restoreOptions.top,
            		left : restoreOptions.left
            	}).removeClass('s-window-maximized');
                 
            } else {
             	that.isMaximized = true;
             	that.restoreOptions = {
             		width : win.outerWidth(),
             		height : win.outerHeight(),
             		top : win.css('top'),
             		left : win.css('left')
             	};
             	win.css({
             		width : $(window).width() ,
             		height : $(window).height(),
             		left : 0,
             		top : 0
             	}).addClass('s-window-maximized');
             	
                 that.active();
             }
             $(target).toggleClass('s-ico-restore');
        },
        minimize : function () {
        	this.wrap.win.hide();
            //l.win.removeTask(g);
            if (this.mask) this.mask.remove();
           
            this.isMinimized = true;
            this.actived = false;
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
		active: function () {
            var that = this;
            if (that.isMinimized) {
                that.show();
            }
            that.actived = true;
            that.minimize = false;
            that.show();
            console.log(stone.zIndex);
            that.win.css('z-index', stone.zIndex ++);
        },
        destroy: function () {
	    	var that = this;
	    	if (that.mask) that.mask.remove();
	    	
	    	if (this.win.children("iframe")) {
	    		this.win.children("iframe").undelegate().remove();
	    	}
	    	this.win.remove();
	    	this.wrap = null;
	    }
	});
	
	stone.Window = Window;
	stone.bridgeTojQuery("window", Window);
	
})(window.jQuery);