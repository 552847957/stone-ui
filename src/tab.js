/**
 * Tab
 * 
 * Dependencies :
 *     - Core
 */
(function ($) {
    var stone = window.stone,
    Widget = stone.Widget;
    
    var template = 
        '<div class="tabs-header">' +
           '<div class="tabs-link-left"></div>' +
           '<div class="tabs-link-right"></div>' +
           '<div class="tabs-links">' +
             '<ul class="tabs"></ul>' +
           '</div>' +
        '</div>';
    
    var Tab = function () {};
    
    Tab = Widget.extend({
        name : 'tab',
        idBase : 0,
        init : function (element, options) {
            Widget.fn.init.call(this, element, options);
        },
        
        defaults : {
            width: 'auto',
            height: 'auto',
            plain: false,
            fit: false,
            border: true,
            scrollIncrement: 100,
            onLoad: function(){},
            onSelect: function(title){},
            onClose: function(title){}
        },
        
        renderUI : function () {
            var that = this, element = this.element, opts= this.options;
            
            var state = $.data(element, 'tab');
            
            if (!state) {
                // 记住状态
                $.data(element, 'tab', {
                    loaded : true
                });
                
                opts = $.extend({}, opts, {
                    width: (parseInt(element.css('width')) || undefined),
                    height: (parseInt(element.css('height')) || undefined),
                    fit: (element.attr('fit') ? element.attr('fit') == 'true' : undefined),
                    border: (element.attr('border') ? element.attr('border') == 'true' : undefined),
                    plain: (element.attr('plain') ? element.attr('plain') == 'true' : undefined)
                });
                
                // 覆盖 options
                this.options = opts;
                
                // wrap element
                element.addClass('tabs-container');
                element.wrapInner('<div class="tabs-panels"/>');
                
                that.header = $(template).prependTo(element);
                that.panels = $('>div.tabs-panels', element);
                
                // -----------
                if (opts.plain == true) {
                    that.header.addClass('tabs-header-plain');
                } else {
                    that.header.removeClass('tabs-header-plain');
                }
                if (opts.border == true){
                    that.header.removeClass('tabs-header-noborder');
                    that.panels.removeClass('tabs-panels-noborder');
                } else {
                    that.header.addClass('tabs-header-noborder');
                    that.panels.addClass('tabs-panels-noborder');
                }
                // -----------
                
                $('>div', that.panels).each(function(){
                    if (!$(this).attr('id')) {
                        $(this).attr('id', 's-tab-' + that.idBase++);
                    }
                    
                    $(this).hide();
                    
                    var options = {
                        tabId: $(this).attr('id'),
                        title: $(this).attr('title'),
                        content: null,
                        href: $(this).attr('href'),
                        closable: $(this).attr('closable') == 'true',
                        icon: $(this).attr('icon'),
                        active: $(this).attr('active') == 'true'
                    };

                    that._createTab(options);
                });
            }
            
            this.resize();
            
        },
        
        bindEvents : function () {
            var that = this, opts = this.options;
            var header = this.header, panels = this.panels;
            
            var tabs = $('ul.tabs', header);
            
            $('li', tabs).unbind('.tabs').bind('click.tabs', function(){
                $('.tabs-active', tabs).removeClass('tabs-active');
                $(this).addClass('tabs-active');
                
                $('>div', panels).hide();
                
                var tabId = $(this).attr('tab-id');
                var panel = $('#' + tabId).css('display', 'block');
                
                opts.onSelect.call(panel, tabId);
            });
            
            $('a.tabs-close', tabs).unbind('.tabs').bind('click.tabs', function(){
                var elem = $(this).parent();
                var tabId = elem.attr('tab-id');
                that._closeTab(tabId);
            });
            
            $(window).resize(function(){
                that.resize();
            });
            
            this.activeTab();
        },
        
        _createTab : function (options) {
            var header = this.header;
            var tabs = $('ul.tabs', header);
            
            var tab = $('<li/>');
            var tab_span = $('<span class="tabs-title"/>').html(options.title);
            var tab_a = $('<a class="tabs-inner" href="javascript:void(0)"></a>').append(tab_span);
            tab.append(tab_a).appendTo(tabs);
            
            tab.attr('tab-id', options.tabId);
            
            if (options.closable) {
                tab_span.addClass('tabs-closable');
                tab_a.after('<a href="javascript:void(0)" class="tabs-close"></a>');
            }
            if (options.icon) {
                tab_span.addClass('tabs-with-icon');
                tab_span.after($('<span/>').addClass('tabs-icon').addClass(options.icon));
            }
            if (options.active) {
                tab.addClass('tabs-active');
            }
            var panel = $('#' + options.tabId).addClass('tab-pane');
            if (options.content) {
                panel.html(options.content);
            } else if (options.href) {
                panel.html;
                var iframe = $('<iframe frameborder="0"></iframe>');
                iframe.attr({
                    name : options.tabId,
                    src : options.href
                });
                panel.empty().append(iframe);
                
                //TODO: add progress bar
            }
            
            panel.removeAttr('title');
        },
        
        _closeTab : function (tabId) {
            var opts = this.options, header = this.header;
            
            var tab = $('li[tab-id="' + tabId + '"]', header);
            if (!tab) return;
            
            var panel = $('#' + tabId);
            
            if (opts.onClose.call(panel, tabId) == false) return;
            
            var active = $(tab).hasClass('tabs-active');
            
            $(tab).remove();
            panel.remove();
            
            this.resize();
            
            if (active) {
                this.activeTab();
            }
            
            this._setTabButton();
        },
        
        _addTabEvent : function (options) {
            var that = this, opts = this.options, tabs = $('ul.tabs', this.header);
            
            var tab = $('li[tab-id="' + options.tabId + '"]', tabs);
            
            tab.unbind('.tabs').bind('click.tabs', function(){
                $('.tabs-active', tabs).removeClass('tabs-active');
                $(this).addClass('tabs-active');
                
                $('>div', that.panels).hide();
                
                var tabId = $(this).attr('tab-id');
                var panel = $('#' + tabId).css('display', 'block');
                
                opts.onSelect.call(panel, tabId);
            });
            
            $('a.tabs-close', tab).unbind('.tabs').bind('click.tabs', function(){
                var elem = $(this).parent();
                var tabId = elem.attr('tab-id');
                that._closeTab(tabId);
            });
            
            if (options.active) {
                that.activeTab(options.tabId);
            }
            
            if (this._setTabButton()) {
                this.moveToLastTab();
            }
        },
        
        /**
         * 设置tab按钮(左和右),
         * return true: 显示, false: 隐藏
         */
        _setTabButton : function () {
            var header = this.header;
            var tabsWidth = 0;
            $("ul.tabs li", header).each(function () {
                tabsWidth += $(this).outerWidth(true);
            });
            
            var prev = $('.tabs-link-left', header);
            var next = $('.tabs-link-right', header);
            if (tabsWidth > header.width()) {
                prev.css({
                    display : 'block',
                    height : header.height()
                });
                next.css({
                    display : 'block',
                    height : header.height()
                });
                $('.tabs-links', header).addClass('tabs-scrolling');
                
                var width = header.width() - next.outerWidth() - next.outerWidth();
                $('.tabs-links', header).width(width);
            
                this._bindTabButtonEvent();
                return true;
            } else {
                prev.css('display', 'none');
                next.css('display', 'none');
                $('.tabs-links', header).removeClass('tabs-scrolling').scrollLeft(0);
                $('.tabs-links', header).width(header.width());
                return false;
            }
        },
        
        _bindTabButtonEvent : function () {
            var header = this.header, opts = this.options;
            $('.tabs-link-left', header).unbind('.tabs').bind('click.tabs', function(){
                var wrap = $('.tabs-links', header);
                var pos = wrap.scrollLeft() - opts.scrollIncrement;
                wrap.animate({scrollLeft:pos});
            });
            
            $('.tabs-link-right', header).unbind('.tabs').bind('click.tabs', function(){
                var wrap = $('.tabs-links', header);
                
                var tabsWidth = 0;
                $('ul.tabs li', header).each(function(){
                    tabsWidth += $(this).outerWidth(true);
                });
                var wrapWidth = $('.tabs-links', header).outerWidth();
                
                var pos = Math.min(
                        wrap.scrollLeft() + opts.scrollIncrement, (tabsWidth - wrapWidth)
                );
                wrap.animate({scrollLeft:pos});
            });
        },
        
        moveToLastTab : function () {
            var header = this.header;
            var tabsWidth = 0;
            $("ul.tabs li", header).each(function () {
                tabsWidth += $(this).outerWidth(true);
            });
            if (tabsWidth > header.width()) {
                var wrap = $('.tabs-links', header);
                wrap.animate({scrollLeft: (tabsWidth - wrap.width()) });
            }
        },
        
        /**
         * 调整容器的大小
         */
        resize : function () {
            var that = this, opts = this.options, header = this.header, panels = this.panels;
            var container = $(that.element);
            
            if (opts.fit == true){
                var p = container.parent();
                opts.width = p.width();
                opts.height = p.height();
            }
            container.css({
                width : opts.width,
                height : opts.height
            });
            
            if ($.boxModel == true) {
                var d = header.outerWidth() - header.width();
                header.width(container.width() - d);
            } else {
                header.width(container.width());
            }
            
            var width = opts.width, height = opts.height;
            
            if (!isNaN(height)) { // tips: must be a number to perform
                if ($.boxModel == true) {
                    var d = panels.outerHeight() - panels.height();
                    height = (height - header.outerHeight() - d) || 'auto';
                } else {
                    height = height - header.outerHeight();
                }
            }
            
            if (!isNaN(width)){
                if ($.boxModel == true) {
                    var d = panels.outerWidth() - panels.width();
                    width = width - d;
                }
            }
            
            panels.css({
                width : width,
                height : height
            });
        },
        
        addTab : function (options) {
            var that = this;
            
            options = $.extend({
                tabId: null,
                title: '',
                content: '',
                href: null,
                icon: null,
                closable: true,
                active: true
            }, options || {});
            
            if (options.active) {
                $('ul.tabs li', that.header).removeClass('tabs-active');
            }
            options.tabId = options.tabId || 's-tab-' + that.idBase ++;
            
            $('<div/>').attr({
                id: options.tabId,
                title: options.title
            }).appendTo(that.panels);
            
            if (that.exists(options.tabId)) {
                that.activeTab(options.tabId);
            } else {
                that._createTab(options);
                that._addTabEvent(options);
            }
        },
        
        activeTab : function (tabId) {
            var header = this.header;
            if (tabId) {
                var tab = $('li[tab-id="' + tabId + '"]', header);
                if (tab) {
                    tab.trigger('click');
                } else {
                    throw ('tabId [' + tabId + '] does not exist');
                }
            } else {
                var tabs = $('ul.tabs', header);
                if ($('.tabs-active', tabs).length == 0) {
                    $('li:first', tabs).trigger('click');
                } else {
                    $('.tabs-active', tabs).trigger('click');
                }
            }
        },
        
        /**
         * 判断tab是否存在
         */
        exists : function (tabId) {
            var header = this.header;
            return $('li[tab-id="' + tabId + '"]', header).length > 0;
        },
        
        destroy: function () {
            this.element.undelegate();
        }
    });
    
    stone.Tab = Tab;
    stone.bridgeTojQuery("tab", Tab);
    
})(window.jQuery);