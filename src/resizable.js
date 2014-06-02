/**
 * Resizable 
 * 
 * 实现DOM元素的重设尺寸
 * 
 * Dependencies : 
 *  - Core
 */
(function ($) {
    var stone = window.stone,
    Widget = stone.Widget;
    
    /**
     * Options :
     *     disabled : 定义是否可以调整大小，true为禁止
     *     handles : 可调整的放向
     *     minWidth : 最小宽度
     *  minHeight : 最小高度
     *  maxWidth : 最大宽度
     *  maxHeight : 最大高度
     *  edge : 距离边缘多少宽度的时候开始调整，单位是px
     *  
     *  onResizeStart : 目标对象开始调整时触发
     *  onResize : 目标对象调整时触发
     *  onResizeStop : 目标对象结束调整时触发
     */
    var Resizable = Widget.extend({
        resizing : false,
        init : function (element, options) {
            Widget.fn.init.call(this, element, options);
        },
        defaults : {
            disabled : false,
            handles : 'n, e, s, w, ne, se, sw, nw, all',  // 重设尺寸的方向
            minWidth : 10,
            minHeight : 10,
            maxWidth : 9999,//$(document).width()
            maxHeight : 9999,//$(document).height()
            edge : 5,
            
            // callback events
            onResizeStart : function (e) {},
            onResize : function (e) {},
            onResizeStop : function (e) {}
        },
        setDisable : function (status) {
            this.options.disabled = status;
        },
        bindEvents : function () {
            var that = this;
            
            // 支持给多个元素绑定事件
            this.element.each(function () {
                var opts = that.options;

                $.data(this, 'resizable', {options: opts});
                
                $(this).unbind('.resizable');

                // .resizable is namespace 
                $(this).bind('mousemove.resizable', {target : this}, function (e) {
                    if (that.resizing || that.options.disabled) {
                        return;
                    }
                    var dir = that._getDirection(e);
                    if (dir == '') {
                        $(e.data.target).css('cursor', '');
                    } else {
                        $(e.data.target).css('cursor', dir + '-resize');
                    }
                }).bind('mousedown.resizable', {target : this}, function (e) {
                    var dir = that._getDirection(e);
                    
                    if (dir == '' || that.options.disabled) {
                        return;
                    }
                    
                    var position = $(e.data.target).position();
                    
                    var data = {
                        target : e.data.target,
                        dir : dir,
                        startLeft : position.left,
                        startTop : position.top,
                        left : position.left,
                        top : position.top,
                        startX : e.pageX,
                        startY : e.pageY,
                        startWidth : $(e.data.target).outerWidth(),
                        startHeight : $(e.data.target).outerHeight(),
                        width : $(e.data.target).outerWidth(),
                        height : $(e.data.target).outerHeight()
                    };
                    
                    $(document).bind('mousedown.resizable', data, $.proxy(that , '_mouseStart'));
                    $(document).bind('mousemove.resizable', data, $.proxy(that , '_mouseMove'));
                    $(document).bind('mouseup.resizable', data, $.proxy(that , '_mouseStop'));
                    
                    // 防止拖动过程中鼠标指针颤动的问题
                    $('body').css('cursor', dir+'-resize');
                });
            });
        },
        
        _mouseStart : function (e, dir) {
            var that = this, opts = this.options;
            that.resizing = true;
            opts.onResizeStart.call(e.data.target, e);
            return false;
        },
        
        _mouseMove : function (e) {
            var that = this, opts = this.options;
            that._resize(e);
            if (opts.onResize.call(e.data.target, e) != false){
                that._applySize(e);
            }
            return false;
        },
        
        _mouseStop : function (e) {
            var that = this, opts = this.options;
            that.resizing = false;
            that._resize(e);
            that._applySize(e);
            
            opts.onResizeStop.call(e.data.target, e);
            
            $(document).unbind('.resizable');
            setTimeout(function () { $('body').css('cursor',''); }, 100);
            return false;
        },
        
        _resize : function (e) {
            var data = e.data, opts = this.options;
            
            if (data.dir.indexOf('e') > -1) {
                var width = data.startWidth + e.pageX - data.startX;
                data.width = Math.min(
                    Math.max(width, opts.minWidth),
                    opts.maxWidth
                );
            }
            if (data.dir.indexOf('s') > -1) {
                var height = data.startHeight + e.pageY - data.startY;
                data.height = Math.min(
                    Math.max(height, opts.minHeight),
                    opts.maxHeight
                );
            }
            if (data.dir.indexOf('w') > -1) {
                var width = data.startWidth - e.pageX + data.startX;
                data.width = Math.min(
                    Math.max(width, opts.minWidth),
                    opts.maxWidth
                );
                data.left = data.startLeft + data.startWidth - data.width;
            }
            if (data.dir.indexOf('n') > -1) {
                var height = data.startHeight - e.pageY + data.startY;
                data.height = Math.min(
                    Math.max(height, opts.minHeight),
                    opts.maxHeight
                );
                data.top = data.startTop + data.startHeight - data.height;
            }
        },
        
        _applySize : function (e) {
            var data = e.data;
            var t = $(data.target);
            t.css({
                left: data.left,
                top: data.top
            });
            if (t.outerWidth() != data.width) {
                t._outerWidth(data.width);
            }
            if (t.outerHeight() != data.height) {
                t._outerHeight(data.height);
            }
        },
        
        /**
         * 获取调整的方向
         * @param e
         * @returns {String}
         */
        _getDirection : function (e) {
            var opts = this.options;
            var tt = $(e.data.target);
            
            var dir = '', edge = opts.edge, offset = tt.offset(), width = tt.outerWidth(), height = tt.outerHeight();
            
            if (e.pageY > offset.top && e.pageY < offset.top + edge) {
                dir += 'n';
            } else if (e.pageY < offset.top + height && e.pageY > offset.top + height - edge) {
                dir += 's';
            }
            if (e.pageX > offset.left && e.pageX < offset.left + edge) {
                dir += 'w';
            } else if (e.pageX < offset.left + width && e.pageX > offset.left + width - edge) {
                dir += 'e';
            }
            
            var handles = opts.handles.split(',');
            
            for (var i=0; i < handles.length; i++) {
                var handle = handles[i].replace(/(^\s*)|(\s*$)/g, '');
                if (handle == 'all' || handle == dir) {
                    return dir;
                }
            }
            return '';
        },
        destroy : function () {
            var that = this;
            $(that.element).unbind('.resizable').removeData('resizable');
        }
        
    });
    
    stone.Resizable = Resizable;
    stone.bridgeTojQuery("resizable", Resizable);
    
})(window.jQuery);