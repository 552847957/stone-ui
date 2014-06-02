/**
 * Drag
 * 
 * 实现DOM元素的拖动
 * 
 * Dependencies :
 *     - Core
 */
(function ($) {
    var stone = window.stone,
    Widget = stone.Widget,
    
    // DropTarget callback
    DRAGENTER = 'dragenter',
    DRAGLEAVE = 'dragleave',
    DRAGOVER = 'dragover',
    DROP = 'drop';
    
    /**
     * Options :
     *     proxy : 拖拽代理('clone':克隆, function:自定义)
     *     revert : 拖拽结束后元素是否返回开始位置(true: 返回)
     *     cursor : 鼠标指针样式
     *     handle : 选择器, 定义可以拖动的选择器对象
     *     disabled : 定义是否可以拖动，true为禁止
     *     edge : 距离边缘多少宽度的时候开始拖动，单位是px
     *     axis : 定义可以向哪个方向拖动, y or x 如果设为y就只能垂直拖动，如果设为x，则只能水平拖动
     * 
     *     onDragStart : 目标对象开始拖动时触发
     *     onDrag : 目标对象被拖动的时候触发
     *     onDragStop : 目标对象拖动结束的时候触发
     */
    var Drag = Widget.extend({
        dragging : false,
        name : 'drag',
        init : function (element, options) {
            Widget.fn.init.call(this, element, options);
        },
        defaults: {
            proxy : null,
            revert : false,
            cursor : 'move',
            handle : null,
            disabled : false,
            edge : 0,
            axis : null,
            
            // callback
            onDragStart : function (e) {},
            onDrag : function (e) {},
            onDragStop : function (e) {}
        },
        setDisable : function (status) {
            this.options.disabled = status;
        },
        bindEvents : function () {
            var that = this;
            
            // 支持给多个元素绑定事件
            this.element.each(function() {
                var opts = that.options;
                var handle = opts.handle ? (typeof opts.handle == 'string' ? $(opts.handle, this) : opts.handle) : $(this);
                
                $.data(this, 'draggable', {options: opts, handle: handle});
                
                // bind mouse event using event namespace draggable
                handle.unbind('.draggable').bind('mousemove.draggable', {target : this}, function(e) {
                    if (that.dragging) {
                        return;
                    }
                    if (that._checkRegion(e)) {
                        $(this).css('cursor', that.options.cursor);
                    } else {
                        $(this).css('cursor', '');
                    }
                    
                }).bind('mousedown.draggable', {target : this}, function (e) {
                    if (that._checkRegion(e) == false) {
                        return false;
                    }
                    $(document).bind('mousedown.draggable', e.data, $.proxy(that, '_mouseStart'));
                    $(document).bind('mousemove.draggable', e.data, $.proxy(that, '_mouseMove'));
                    $(document).bind('mouseup.draggable', e.data, $.proxy(that, '_mouseStop'));
                });
            });
        },
        /**
         * 鼠标按下事件
         * 
         * @param event jQuery包装后的event对象
         * @returns {Boolean}
         */
        _mouseStart : function (event) {
            var that = this;
            this.dragging = true;
            var state = $.data(event.data.target, 'draggable');
            var opts = state.options;
            
            var position = $(event.data.target).position();
            var offset = $(event.data.target).offset();
            // cache the position of the original element
            $.extend(event.data, {
                target : event.data.target,
                parent : $(event.data.target).parent()[0],
                startPosition : $(event.data.target).css('position'),
                startLeft : position.left,
                startTop : position.top,
                startX : event.pageX,
                startY : event.pageY,
                left : position.left,
                top : position.top
            });
            
            // droppables
            var droppables = $('.droppable').filter(function() {
                return event.data.target != this;
            }).filter(function () {
                var accept = $.data(this, 'droppable').options.accept;
                if (accept) {
                    return $(accept).filter(function () {
                        return this == event.data.target;
                    }).length > 0;
                } else {
                    return true;
                }
            });
            state.droppables = droppables;
            
            if (!state.proxy) {
                that._createProxy(event);
            }
            
            that._change(event);
            that._applyDrag(event);
            opts.onDragStart.call(event.data.target, event);
            
            $('body').css('cursor', this.options.cursor);
            return false;
        },
        /**
         * 鼠标移动事件
         * 
         * @param event jQuery包装后的event对象
         * @returns {Boolean}
         */
        _mouseMove : function (event) {
            var that = this;
            var state = $.data(event.data.target, 'draggable');
            
            that._change(event);
            
            if (state.options.onDrag.call(event.data.target, event) != false) {
                that._applyDrag(event);
            }
            
            var source = event.data.target;
            // trigger drop events
            state.droppables.each(function () {
                var receive = $(this);
                
                if (that.isInteract(event, receive)) {
                    if (!this.entered) {
                        $(this).trigger(DRAGENTER, [source]);
                        this.entered = true;
                    }
                    $(this).trigger(DRAGOVER, [source]);
                } else {
                    if (this.entered) {
                        $(this).trigger(DRAGLEAVE, [source]);
                        this.entered = false;
                    }
                }
            });
            
            return false;
        },
        /**
         * 鼠标弹起事件
         * 
         * @param event jQuery包装后的event对象
         * @returns {Boolean}
         */
        _mouseStop : function (event) {
            var that = this;
            this.dragging = false;
            that._mouseMove(event);
            
            var state = $.data(event.data.target, 'draggable');
            var proxy = state.proxy;
            var opts = state.options;
            if (opts.revert) {
                if (that._checkDroppables(event) == true) {
                    $(event.data.target).css({
                        position : event.data.startPosition,
                        left : event.data.startLeft,
                        top : event.data.startTop
                    });
                } else {
                    if (proxy) {
                        proxy.animate({
                            left: event.data.startLeft,
                            top: event.data.startTop
                        }, function() {
                            that._removeProxy(state);
                        });
                    } else {
                        $(event.data.target).animate({
                            left : event.data.startLeft,
                            top : event.data.startTop
                        }, function() {
                            $(event.data.target).css('position', event.data.startPosition);
                        });
                    }
                }
            } else {
                $(event.data.target).css({
                    position:'absolute',
                    left : event.data.left,
                    top : event.data.top
                });
                that._checkDroppables(event);
            }
            
            opts.onDragStop.call(event.data.target, event);
            
            $(document).unbind('.draggable');
            setTimeout(function () { $('body').css('cursor',''); }, 100);
            
            return false;
        },
        _change : function (event) {
            var state = $.data(event.data.target, 'draggable');
            var opts = state.options;
            var proxy = state.proxy;
            
            var data = event.data;
            var left = data.startLeft + event.pageX - data.startX;
            var top = data.startTop + event.pageY - data.startY;
            
            if (event.data.parent != document.body) {
                left += $(event.data.parent).scrollLeft();
                top += $(event.data.parent).scrollTop();
            }
            
            if (opts.axis == 'x') {
                data.left = left;
            } else if (opts.axis == 'y') {
                data.top = top;
            } else {
                data.left = left;
                data.top = top;
            }
        },
        _applyDrag : function (event) {
            var state = $.data(event.data.target, 'draggable');
            var proxy = state.proxy || $(event.data.target);
            proxy.css({
                left : event.data.left,
                top : event.data.top
            });
        },
        /**
         * 创建代理
         * @param event
         */
        _createProxy : function (event) {
            var state = $.data(event.data.target, 'draggable');
            var opts = state.options;
            var proxy = state.proxy;
            if (opts.proxy) {
                if (opts.proxy == 'clone') {
                    proxy = $(event.data.target).clone().insertAfter(event.data.target);
                } else if (typeof opts.proxy == 'function') {
                    proxy = opts.proxy.call(event.data.target, event.data.target);
                }
                state.proxy = proxy;
            } else {
                proxy = $(event.data.target);
            }
            proxy.css('position', 'absolute');
        },
        /**
         * 删除代理
         * @param event
         */
        _removeProxy : function (state) {
            var proxy = state.proxy;
            if (proxy) {
                proxy.remove();
            }
            state.proxy = null;
        },
        /**
         * 检查区域是否可以拖拽
         */
        _checkRegion : function (event) {
            if (this.options.disabled) {
                return false;
            }
            var state = $.data(event.data.target, 'draggable');
            var handle = state.handle;
            var offset = $(handle).offset();
            var width = $(handle).outerWidth();
            var height = $(handle).outerHeight();
            var t = event.pageY - offset.top;
            var r = offset.left + width - event.pageX;
            var b = offset.top + height - event.pageY;
            var l = event.pageX - offset.left;
            
            return Math.min(t,r,b,l) > state.options.edge;
        },
        _checkDroppables : function (event) {
            var that = this, 
            state = $.data(event.data.target, 'draggable'), 
            opts = state.options, 
            dropped = false;

            if (state.droppables) {
                state.droppables.each(function() {
                    var receive = $(this);
                    
                    if (that.isInteract(event, receive)) {
                        if (opts.revert) {
                            $(event.data.target).css({
                                position : event.data.startPosition,
                                left : event.data.startLeft,
                                top : event.data.startTop
                            });
                        }
                        $(this).trigger(DROP, [event.data.target]);
                        that._removeProxy(state);
                        dropped = true;
                        this.entered = false;
                        return false;
                    }
                });
            }
            if (!dropped && !opts.revert) {
                that._removeProxy(state);
            }
            return dropped;
        },
        isInteract : function (event, node) {
            var offset = node.offset(),
            pageX = event.pageX, 
            pageY = event.pageY;

            var left = offset.left, top = offset.top;
            if ((pageX > left) && (pageX < left + node.outerWidth()) && (pageY > top) && (pageY < top + node.outerHeight())) {
                return true;
            }
            return false;
        },
        destroy : function () {
            $.each(this.element, function() {
                var state = $.data(this, 'draggable');
                if (state) {
                    state.handle.unbind('.draggable');
                }
                $(this).removeData('draggable');
            });
            Widget.fn.destroy.call(this);
        }
    });
    
    var Drop = Widget.extend({
        init : function (options) {
            Widget.fn.init.call(this, options);
        },
        bindEvents : function () {
            var that = this;
            this.element.each(function () {
                var state = $.data(this, 'droppable');
                if (state) {
                    $.extend(state.options, options);
                } else {
                    that.droppable(this);
                    $.data(this, 'droppable', {
                        options: $.extend({}, that.droppable.defaults, options)
                    });
                }
            });
        },
        defaults : {
            accept : null, //可接受元素
            onDragEnter : function (e, source) {},
            onDragOver : function (e, source) {},
            onDragLeave : function (e, source) {},
            onDrop : function (e, source) {}
        },
        droppable : function (target) {
            $(target).addClass('droppable');
            $(target).bind(DRAGENTER, function(e, source) {
                $.data(target, 'droppable').options.onDragEnter.apply(target, [e, source]);
            });
            $(target).bind(DRAGLEAVE, function(e, source) {
                $.data(target, 'droppable').options.onDragLeave.apply(target, [e, source]);
            });
            $(target).bind(DRAGOVER, function(e, source) {
                $.data(target, 'droppable').options.onDragOver.apply(target, [e, source]);
            });
            $(target).bind(DROP, function(e, source) {
                $.data(target, 'droppable').options.onDrop.apply(target, [e, source]);
            });
        },
        destroy : function () {
            $(this.element).undelegate();
        }
    });
    
    stone.Drag = Drag;
    stone.Drop = Drop;
    stone.bridgeTojQuery("drag", Drag);
    stone.bridgeTojQuery("drop", Drop);
    
})(jQuery);