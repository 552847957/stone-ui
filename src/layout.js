/**
 * Layout
 * 
 * Dependencies :
 * 	- Core
 *  - Panel
 */
(function ($) {
	var stone = window.stone,
	Widget = stone.Widget,
	Panel = stone.Panel;
	Resizable = stone.Resizable;
	
	function isVisible(panelWidget){
		if (!panelWidget) return false;
		return panelWidget.isVisible();
	}
	
	var Layout = function () {};
	
	Layout = Widget.extend({
		name : 'layout',
		init : function (element, options) {
			if (!options) {
				options = element;
				element = null;
			}
			Widget.fn.init.call(this, element, options);
		},
		defaults : {
			fit : false
		},
		renderUI : function () {
			var that = this, element = this.element;
			
			if (element) {
				var state = $.data(element, 'layout');
				if (!state) {
					// 记住状态
					$.data(element, 'layout', {
						loaded : true
					});
					
					this.layout = element;
					
					element.addClass('layout');
					element.css({
//						margin:0,
						padding:0
					});
					
					$('<div class="layout-split-proxy-x"></div>').appendTo(element);
					$('<div class="layout-split-proxy-y"></div>').appendTo(element);
					
					var panels = {};
					panels.north = this.createPanel('north');
					panels.south = this.createPanel('south');
					panels.east = this.createPanel('east');
					panels.west = this.createPanel('west');
					panels.center = this.createPanel('center');
					
					this.panels = panels;
				}
				that.size();
			}
		},
		
		createPanel : function (dir) {
			var that = this, layout = this.layout;
			var p = $('>div[region='+dir+']', this.layout);
			
			if (p && p.length > 0) {
				var cls = 'layout-panel layout-panel-' + dir;
				if (p.attr('split') == 'true'){
					cls += ' layout-split-' + dir;
				}
				var toolCls = null;
				if (dir == 'north'){
					toolCls = 'layout-link-up';
				} else if (dir == 'south'){
					toolCls = 'layout-link-down';
				} else if (dir == 'east'){
					toolCls = 'layout-link-right';
				} else if (dir == 'west'){
					toolCls = 'layout-link-left';
				}
				
				var w = new Panel(p, {
					cls : cls,
					border : p.attr("border") == 'false' ? false : true,
					tools: [{
						iconCls: toolCls, 
						handler: function(){
							that.collapse(dir);
						}
					}]});
				
				if (p.attr('split') == 'true'){
					var panel = w.getPanel();
					var handles = '';
					if (dir == 'north') handles = 's';
					if (dir == 'south') handles = 'n';
					if (dir == 'east') handles = 'w';
					if (dir == 'west') handles = 'e';
					
					var resizable = new Resizable(panel, {
						handles : handles,
						onResizeStart : function(e){
							var proxy = null;
							if (dir == 'north' || dir == 'south'){
								proxy = $('>div.layout-split-proxy-y', layout);
							} else {
								proxy = $('>div.layout-split-proxy-x', layout);
							}
							var pos = {display: 'block'};
							if (dir == 'north'){
								pos.top = parseInt(panel.css('top')) + panel.outerHeight() - proxy.height();
								pos.left = parseInt(panel.css('left'));
								pos.width = panel.outerWidth();
								pos.height = proxy.height();
							} else if (dir == 'south'){
								pos.top = parseInt(panel.css('top'));
								pos.left = parseInt(panel.css('left'));
								pos.width = panel.outerWidth();
								pos.height = proxy.height();
							} else if (dir == 'east'){
								pos.top = parseInt(panel.css('top')) || 0;
								pos.left = parseInt(panel.css('left')) || 0;
								pos.width = proxy.width();
								pos.height = panel.outerHeight();
							} else if (dir == 'west'){
								pos.top = parseInt(panel.css('top')) || 0;
								pos.left = panel.outerWidth() - proxy.width();
								pos.width = proxy.width();
								pos.height = panel.outerHeight();
							}
							proxy.css(pos);
							
							$('<div class="layout-mask"></div>').css({
								left:0,
								top:0,
								width: layout.width(),
								height: layout.height()
							}).appendTo(layout);
						},
						onResize: function(e){
							if (dir == 'north' || dir == 'south'){
								var proxy = $('>div.layout-split-proxy-y', layout);
								proxy.css('top', e.pageY - $(layout).offset().top - proxy.height()/2);
							} else {
								var proxy = $('>div.layout-split-proxy-x', layout);
								proxy.css('left', e.pageX - $(layout).offset().left - proxy.width()/2);
							}
							return false;
						},
						onResizeStop: function(){
							$('>div.layout-split-proxy-y', layout).css('display','none');
							$('>div.layout-split-proxy-x', layout).css('display','none');
							var opts = w.getOptions();
							opts.width = panel.outerWidth();
							opts.height = panel.outerHeight();
							opts.left = panel.css('left');
							opts.top = panel.css('top');
							w.size();
							that.size();
							
							layout.find('>div.layout-mask').remove();
						}
					});
					
					w.addPlugin(resizable);
				}
				
				return w;
			}
			return null;
		},
		
		createExpandPanel : function (dir) {
			var that = this, layout = this.layout, icon = null;

			if (dir == 'east') {
				icon = 'layout-link-left'; 
			} else if (dir == 'west') {
				icon = 'layout-link-right';
			} else if (dir == 'north') {
				icon = 'layout-link-down';
			} else if (dir == 'south') {
				icon = 'layout-link-up';
			}
			
			var p = $('<div></div>').appendTo(layout);
			
			var panel = new Panel(p, {
				cls: 'layout-expand',
				title: '&nbsp;',
				closed: true,
				doSize: false,
				tools: [{
					iconCls: icon,
					handler:function(){
						that.expand(dir);
					}
				}]
			});
			return panel;
		},
		
		bindEvents : function () {
			var that = this;
			
			$(window).resize(function(){
				that.size();
			});
		},
		
		size : function () {
			var opts = this.options, layout = this.layout, panels = this.panels;
			
			if (opts.fit == true){
				var p = layout.parent();
				layout.css({
					width : p.width(),
					height : p.height()
				});
			}
			
			var centerPos = {
				top:0,
				left:0,
				width:layout.width(),
				height:layout.height()
			};
			
			// set north panel size
			function setNorthSize(p){
				if (!p) return;
				
				var _opts = p.getOptions();
				p.size({
					width: layout.width(),
					height: _opts.height,
					left: 0,
					top: 0
				});
				centerPos.top += _opts.height;
				centerPos.height -= _opts.height;
//				if (pp.getOptions().border) {
//					cpos.top--;
//					cpos.height++;
//				}
			}
			if (isVisible(panels.expandNorth)){
				setNorthSize(panels.expandNorth);
			} else {
				setNorthSize(panels.north);
			}
			
			// set south panel size
			function setSouthSize(p){
				if (!p) return;
				var _opts = p.getOptions();
				p.size({
					width: layout.width(),
					height: _opts.height,
					left: 0,
					top: layout.height() - _opts.height
				});
				centerPos.height -= _opts.height;
			}
			if (isVisible(panels.expandSouth)){
				setSouthSize(panels.expandSouth);
			} else {
				setSouthSize(panels.south);
			}
			
			// set east panel size
			function setEastSize(p){
				if (!p) return;
				var _opts = p.getOptions();
				p.size({
					width : _opts.width,
					height: centerPos.height,
					left: layout.width() - _opts.width,
					top: centerPos.top
				});
				centerPos.width -= _opts.width;
			}
			if (isVisible(panels.expandEast)){
				setEastSize(panels.expandEast);
			} else {
				setEastSize(panels.east);
			}
			
			// set west panel size
			function setWestSize(p){
				if (!p) return;
				var _opts = p.getOptions();
				p.size({
					width: _opts.width,
					height: centerPos.height,
					left: 0,
					top: centerPos.top
				});
				centerPos.left += _opts.width;
				centerPos.width -= _opts.width;
			}
			if (isVisible(panels.expandWest)){
				setWestSize(panels.expandWest);
			} else {
				setWestSize(panels.west);
			}
			panels.center.size(centerPos);
		},
		
		collapse : function (region){
			var that = this, layout = this.layout, panels = this.panels;
			
			if (region == 'east'){
				panels.center.size({
					width: panels.center.getOptions().width + panels.east.getOptions().width - 28
				});
				
				panels.east.getPanel().animate({left : layout.width()}, function () {
					panels.east.close();
					
					panels.expandEast.open();
					panels.expandEast.size({
						top: panels.east.getOptions().top,
						left: layout.width() - 28,
						width: 28,
						height: panels.east.getOptions().height
					});
				});
				if (!panels.expandEast) {
					panels.expandEast = that.createExpandPanel('east');
					panels.expandEast.getPanel().click(function(){
						that.expand('east');
						return false;
					});
				}
			} else if (region == 'west'){
				panels.center.size({
					width: panels.center.getOptions().width + panels.west.getOptions().width - 28,
					left: 28
				});
				panels.west.getPanel().animate({left:-panels.west.getOptions().width}, function(){
					panels.west.close();
					panels.expandWest.open();
					panels.expandWest.size({
						top: panels.west.getOptions().top,
						left: 0,
						width: 28,
						height: panels.west.getOptions().height
					});
					panels.west.getOptions().onCollapse.call(panels.west);
				});
				if (!panels.expandWest) {
					panels.expandWest = that.createExpandPanel('west');
					panels.expandWest.getPanel().click(function(){
						that.expand('west');
						return false;
					});
				}
			} else if (region == 'north'){
				var h = layout.height() - 28;
				if (isVisible(panels.expandSouth)){
					h -= panels.expandSouth.getOptions().height;
				} else if (isVisible(panels.south)){
					h -= panels.south.getOptions().height;
				}
				panels.center.size({top:28, height:h});
				panels.east.size({top:28, height:h});
				panels.west.size({top:28, height:h});
				if (isVisible(panels.expandEast)) panels.expandEast.size({top:28, height:h});
				if (isVisible(panels.expandWest)) panels.expandWest.size({top:28, height:h});
				
				panels.north.getPanel().animate({top:-panels.north.getOptions().height}, function(){
					panels.north.close();
					panels.expandNorth.open();
					panels.expandNorth.size({
						top: 0,
						left: 0,
						width: layout.width(),
						height: 28
					});
				});
				if (!panels.expandNorth) {
					panels.expandNorth = that.createExpandPanel('north');
					panels.expandNorth.getPanel().click(function(){
						that.expand('north');
						return false;
					});
				}
			} else if (region == 'south'){
				var h = layout.height() - 28;
				if (isVisible(panels.expandNorth)){
					h -= panels.expandNorth.getOptions().height;
				} else if (isVisible(panels.north)){
					h -= panels.north.getOptions().height;
				}
				panels.center.size({height:h});
				panels.east.size({height:h});
				panels.west.size({height:h});

				if (isVisible(panels.expandEast)) panels.expandEast.size({height:h});
				if (isVisible(panels.expandWest)) panels.expandWest.size({height:h});
				
				panels.south.getPanel().animate({top : layout.height()}, function(){
					panels.south.close();
					panels.expandSouth.open();
					panels.expandSouth.size({
						top: layout.height() - 28,
						left: 0,
						width: layout.width(),
						height: 28
					});
				});
				if (!panels.expandSouth) {
					panels.expandSouth = that.createExpandPanel('south');
					panels.expandSouth.getPanel().click(function(){
						that.expand('south');
						return false;
					});
				}
			}
		},
		
		expand : function (region) {
			var that = this, layout = this.layout, panels = this.panels;

			if (region == 'east' && panels.expandEast){
				panels.expandEast.close();
				panels.east.getPanel().stop(true,true);
				panels.east.open();
				panels.east.size({left:layout.width()});
				panels.east.getPanel().animate({
					left: layout.width() - panels.east.getOptions().width
				}, function(){
					that.size();
				});
			} else if (region == 'west' && panels.expandWest){
				panels.expandWest.close();
				panels.west.getPanel().stop(true,true);
				panels.west.open();
				panels.west.size({left: -panels.west.getOptions().width});
				panels.west.getPanel().animate({
					left: 0
				}, function(){
					that.size();
				});
			} else if (region == 'north' && panels.expandNorth){
				panels.expandNorth.close();
				panels.north.getPanel().stop(true,true);
				panels.north.open();
				panels.north.size({top:-panels.north.getOptions().height});
				panels.north.getPanel().animate({top:0}, function(){
					that.size();
				});
			} else if (region == 'south' && panels.expandSouth){
				panels.expandSouth.close();
				panels.south.getPanel().stop(true,true);
				panels.south.open();
				panels.south.size({top:layout.height()});
				panels.south.getPanel().animate({top:layout.height()-panels.south.getOptions().height}, function(){
					that.size();
				});
			}
		},
		
		destroy: function () {
			//this.panel.undelegate();
	    }
	});
	stone.Layout = Layout;
	stone.bridgeTojQuery("layout", Layout);
})(window.jQuery);