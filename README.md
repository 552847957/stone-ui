### Stone UI 简介.
Stone 是一款开源免费的JS web ui 控件组合，使用插件式的开发模式，以简单为原则的设计，简单而又强大。
我们致力于快速打造Web前端界面解决方案。 框架采用面向对象的思想编码，具有微核心、易扩展的特点，且提供丰富的插件，每个插件尽量独立，并可依赖拓展。

需要注意的是：我们的插件中有对jQuery的依赖，使用插件的时候请提前将jQuery引入
```
<!-- include core.js -->
<script type="text/javascript" src="../src/js/core.js"></script>
<script>
	var Smile = stone.Class.extend({
		init: function() {
			Log.out('init smile');
			
			this.name = 'super';
		},
		smile : function(name) {
			
			Log.out('super\'s smile > ' + name);
		}
	});

	var Hello = Smile.extend({
		init: function(){
			Log.out('init hello');
			Smile.fn.init.call(this);
		},
		say: function(){
			Log.out('hello\'s say');
		}
	});

	var h = new Hello();
	h.say();
	h.smile('h');
</script>
```

更多的例子请参照工程目录下的 demo.
