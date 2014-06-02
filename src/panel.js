/**
 * Panel
 * 
 * 
 * Dependencies :
 *     - Core
 */
(function ($) {
    var stone = window.stone,
    Widget = stone.Widget;
    
    var Panel = function () {};
    
    Panel = Widget.extend({
        name : 'panel',
        init : function (element, options) {
            Widget.fn.init.call(this, element, options);
        },
        defaults: {
            title: '',
            width: 'auto',
            height: 'auto',
            left: null,
            top: null,
            href: null,
            fit: false,
            border: true,
            doSize: true,
            noheader: false,
            content: null,
            actions : [], // ['toggle', 'min', 'max', 'close']
            
            onResize: function(width,height){},
            onMaximize: function(){},
            onRestore: function(){},
            onMinimize: function(){},
            onCollapse: function(){},
            onExpand: function(){},
            onClose: function () {}
        },
        getOptions : function () {
            return this.options;
        },
        getPanel : function () {
            return this.panel;
        },
        renderUI : function () {
            var that = this, element = this.element, opts= this.options;
            
            var target = $(element);
            
            // load data
            var state = $.data(target, 'panel');
            if (!state) {
                // 记住状态
                $.data(target, 'panel', {
                    loaded : true
                });
                
                opts = $.extend({}, opts, {
                    width: (parseInt(target.css('width')) || undefined),
                    height: (parseInt(target.css('height')) || undefined),
                    left: (parseInt(target.css('left')) || undefined),
                    top: (parseInt(target.css('top')) || undefined),
                    title: target.attr('title')
                });
                
                // 覆盖 options
                that.options = opts;
                
                // wrap
                var panel = target.addClass('panel-body').wrap('<div class="panel"></div>').parent();
                
                that.panel = panel;
                
                if (opts.title && !opts.noheader){
                    var header = $('<div class="panel-header"></div>').prependTo(panel);
                    $('<div class="panel-title"></div').html(opts.title).appendTo(header);

                    var actions = $('<div class="panel-actions"></div>').appendTo(header);
                    
                    that.header = header;
                    that.actions = actions;
                }
                
                that.body = $('>.panel-body', panel);
                
                if (opts.content) {
                    target.html(opts.content);
                } else if (opts.href) {
                    panel.html;
                    var iframe = $("<iframe frameborder='0'></iframe>");
                    iframe.attr({
                        src : opts.href
                    });
                    target.empty().append(iframe);
                }
                
                that.headerHandler();
                that.borderHandler();
            }
            
            if (opts.doSize == true){
                that.panel.css('display','block');
                that.size();
            }

            if (opts.closed == true){
                that.panel.hide();
            } else {
                that.open();
            }
        },
        
        bindEvents : function () {
            var that = this, opts = this.options;
            $(window).resize(function(){
                if (opts.fit == true){
                    that.size();
                }
            });
        },
        
        /**
         * [position] : {width: x, height : x, left : x, top : x}
         */
        size : function (position) {
            var opts = this.options, panel = this.panel, header = panel.find('>div.panel-header'), body = this.body;
            
            if (position){
                if (position.width) opts.width = position.width;
                if (position.height) opts.height = position.height;
                if (position.left != null) opts.left = position.left;
                if (position.top != null) opts.top = position.top;
            }
            
            if (opts.fit == true){
                var p = panel.parent();
                opts.width = p.width();
                opts.height = p.height();
            }
            panel.css({
                left: opts.left,
                top: opts.top
            });
            panel.addClass(opts.cls);
            
            if (!isNaN(opts.width)) {
                if ($._boxModel == true) {
                    panel.width(opts.width - (panel.outerWidth() - panel.width()));
                    if (header) {
                        header.width(panel.width() - (header.outerWidth() - header.width()));
                    }
                    body.width(panel.width() - (body.outerWidth() - body.width()));
                } else {
                    panel.width(opts.width);
                    if (header) {
                        header.width(panel.width());
                    }
                    body.width(panel.width());
                }
            } else {
                panel.width('auto');
                body.width('auto');
            }
            if (!isNaN(opts.height)) {
                if ($._boxModel == true) {
                    panel.height(opts.height - (panel.outerHeight() - panel.height()));
                    body.height(panel.height() - header.outerHeight() - (body.outerHeight() - body.height()));
                } else {
                    panel.height(opts.height);
                    body.height(panel.height() - header.outerHeight());
                }
            } else {
                body.height('auto');
            }
            panel.css('height', null);
            
            // trigger onResize event
            opts.onResize.apply(panel, [opts.width, opts.height]);
        },
        
        headerHandler : function () {
            var that = this, opts = this.options, panel = this.panel, actions = this.actions;
            
            if (opts.title && !opts.noheader) {
                
                // key -> {class, handler}
                var actionsMap = {
                    toggle : {
                        iconCls : 'panel-action-collapse',
                        handler : function () {
                            that.toggle();
                        }
                    },
                    min : {
                        iconCls : 'panel-action-min',
                        handler : function () {
                            that.minimize();
                        }
                    },
                    max : {
                        iconCls : 'panel-action-max',
                        handler : function () {
                            that.maximize();
                        }
                    },
                    close: {
                        iconCls : 'panel-action-close',
                        handler : function () {
                            that.close();
                        }
                    }
                };
                
                // 添加按钮
                $.each(opts.actions, function (i, n) {
                    var act = actionsMap[n];
                    if (act) {
                        $('<a href="javascript:void(0)"></a>').addClass(act.iconCls).appendTo(actions).bind('click', act.handler);
                    }
                });
                
                // 添加自定义按钮
                if (opts.tools) {
                    for (var i = opts.tools.length-1; i >= 0; i--) {
                        var t = $('<a href=\"javascript:void(0)\"></a>').addClass(opts.tools[i].iconCls).appendTo(actions);
                        if (opts.tools[i].handler) {
                            t.bind('click', eval(opts.tools[i].handler));
                        }
                    }
                }
                panel.find('>div.panel-body').removeClass('panel-body-noheader');
            } else {
                panel.find('>div.panel-body').addClass('panel-body-noheader');
            }
        },
        
        borderHandler : function () {
            var opts = this.options, panel = this.panel;

            if (opts.border == true) {
                panel.find('>div.panel-header').removeClass('panel-header-noborder');
                panel.find('>div.panel-body').removeClass('panel-body-noborder');
            } else {
                panel.find('>div.panel-header').addClass('panel-header-noborder');
                panel.find('>div.panel-body').addClass('panel-body-noborder');
            }
        },
        toggle : function (collapse) {
            var opts = this.options, panel = this.panel, header = this.header;
            var body = panel.find('>div.panel-body');
            var action = $('.panel-action-collapse', header);
            
            var collapsed = this.collapsed;
            if (typeof (collapse) != 'undefined') {
                collapsed = collapse;
            }
            // expand
            if (collapsed) {
                body.stop(true, true);    // stop animation
                action.removeClass('panel-action-expand');
                body.slideDown('normal');
                this.collapsed = false;
                opts.onExpand.call(panel);
            } else {
                body.stop(true, true);    // stop animation
                action.addClass('panel-action-expand');
                body.slideUp('normal');
                this.collapsed = true;
                opts.onCollapse.call(panel);
            }
        },
        
        minimize : function () {
            var opts = this.options, panel = this.panel;
            panel.hide();
            this.minimized = true;
            this.maximized = false;
            opts.onMinimize.call(panel);
        },
        
        maximize : function () {
            var opts = this.options, panel = this.panel, header = this.header;
            
            var action = $('.panel-action-max', header);
            
            // restore
            if (this.maximized) {
                panel.show();
                action.removeClass('panel-action-restore');
                
                var original = this.original;
                opts.width = original.width;
                opts.height = original.height;
                opts.left = original.left;
                opts.top = original.top;
                opts.fit = original.fit;
                
                this.size();
                
                this.minimized = false;
                this.maximized = false;
                opts.onRestore.call(panel);
                
            } else { // max
                action.addClass('panel-action-restore');
                this.original = {
                    width: opts.width,
                    height: opts.height,
                    left: opts.left,
                    top: opts.top,
                    fit: opts.fit
                };
                opts.left = 0;
                opts.top = 0;
                opts.fit = true;
                
                this.size();
                
                this.minimized = false;
                this.maximized = true;
                opts.onMaximize.call(panel);
            }
        },
        
        isVisible : function () {
            //return this.closed;
            return this.panel.is(':visible');
        },
        
        open : function () {
            this.panel.show();
            this.closed = false;
            
//            if (this.options.collapsed) {
//                this.toggle(false);
//            }
        },
        
        close : function () {
            var opts = this.options, panel = this.panel;
            panel.hide();
            this.closed = true;
            opts.onClose.call(panel);
        },
        
        destroy: function () {
            this.panel.undelegate();
            
            this.panel.removeData('panel');
            // remove target wrap, data
        }
    });
    
    stone.Panel = Panel;
    stone.bridgeTojQuery("panel", Panel);
    
})(jQuery);