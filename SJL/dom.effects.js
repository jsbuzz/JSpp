/**
* Absolutely under construction
*/
DOM.NumericEffect = function(condition,engine,read,write){

	this.condition = condition;
	this.engine = engine;
	this.read = read;
	this.write = write;
	
	this.action = function(effectHandler){
		effectHandler.data.effect = this;
		effectHandler.foreach(function(iterator){
			var state = i.data.effect.read(this);
			state = i.data.effect.engine.call(this,iterator.properties,state);
			i.data.effect.write.call(this,state);
		});
	}
};




DOM.effectHandler = function(elements,effectType,properties){

	this.protected({
		target : Class.instanceOf(elements,DOM.Iterator) ? elements.protected.target : [elements],
		type : effectType,
		id : DOM.effectHandler.id++,
		removed : false
	});

	this.properties = properties;

	this.name = function(){ return this.protected.type+'/'+this.protected.id };
	this.type = function(){ return this.protected.type };

	this.stop = function(){
		if(this.removed)
			return false;
		this.foreach(function(i){
			this.loops[i.name()].active = false;
		});
		return this;
	};

	this.run = function(){
		if(this.removed)
			return false;
		this.foreach(function(i){
			this.loops[i.name()].active = true;
			this.loops[i.name()]();
		});
		return this;
	};
	
	this.isRunning = function(){
		if(this.removed)
			return false;
		return this.foreach(function(i,s,c){
			c.isRunning = c.isRunning || this.loops[i.name()].running ? true : false;
			if(c.isRunning)
			{
				return false;
			}
		}).isRunning;
	};

	this.remove = function(){
		this.removed = true;
		this.foreach(function(i){
			window.clearTimeout(this.loops[i.name()].timer);
			delete this.loops[i.name()];
		});
	};
}.inherits(DOM.Iterator,"(elements)=>DOM.Iterator()");

DOM.effectHandler.id = 0;

DOM.effects = {
	moveTo : function(elements,properties,final,autostart){
		var handler = new DOM.effectHandler(elements,'effects/move',properties);
		handler.foreach(function(i){
			this.createLoop(i.name(),
				function(){return this.offset.left()!=i.properties.x || this.offset.top()!=i.properties.y},
				function(){
					var myRect = this.offset.rect(),
						stepX = Math.max(1,parseInt(Math.abs(myRect.left-i.properties.x)/10)),
						stepY = Math.max(1,parseInt(Math.abs(myRect.top-i.properties.y)/10));

					if(myRect.left>i.properties.x)
						this.offset.left('-'+stepX);
					else if(myRect.left<i.properties.x)
						this.offset.left('+'+stepX);

					if(myRect.top>i.properties.y)
						this.offset.top('-'+stepY);
					else if(myRect.top<i.properties.y)
						this.offset.top('+'+stepY);
				},
				final || i.properties.final,
				i.properties.timeout || DOM.defaults.loopTimeout
			);
		});
		if(autostart===undefined || autostart)
			handler.run();
		return handler;
	},
	
	moveBy : function(elements,properties,final,autostart){
		var handler = new DOM.effectHandler(elements,'effects/move',properties);
		handler.foreach(function(i){
			this.createLoop(i.name(),
				function(loop){
					if(!loop.running)
						this.data[i.name()] = {x:this.offset.left()+i.properties.x, y:this.offset.top()+i.properties.y};

					return this.offset.left()!=this.data[i.name()].x || this.offset.top()!=this.data[i.name()].y
				},
				function(){
					var myRect = this.offset.rect(),
						stepX = Math.max(1,parseInt(Math.abs(myRect.left-this.data[i.name()].x)/10)),
						stepY = Math.max(1,parseInt(Math.abs(myRect.top-this.data[i.name()].y)/10));

					if(myRect.left>this.data[i.name()].x)
						this.offset.left('-'+stepX);
					else if(myRect.left<this.data[i.name()].x)
						this.offset.left('+'+stepX);

					if(myRect.top>this.data[i.name()].y)
						this.offset.top('-'+stepY);
					else if(myRect.top<this.data[i.name()].y)
						this.offset.top('+'+stepY);
				},
				final || i.properties.final,
				i.properties.timeout || DOM.defaults.loopTimeout
			);
		});
		if(autostart===undefined || autostart)
			handler.run();
		return handler;
	},
	
	css : function(elements,properties,final,autostart){
		var handler = new DOM.effectHandler(elements,'effects/css',properties);
		handler.foreach(function(i){
			var it = PropertyIterator.for(i.properties);
			this.createLoop(i.name(),
				function(loop){
					loop.styles = this.computedStyle();
					for(it.rewind();it.valid();it.next())
					{
						if(loop.styles[it.key()]!==undefined && 
						   DOM.helper.asNumber(loop.styles[it.key()])!=DOM.helper.asNumber(it.current()))
							return true;
					}
					return false;
				},
				function(loop){
					for(it.rewind();it.valid();it.next())
					{
						if(loop.styles[it.key()]!==undefined)
						{
							var current = DOM.helper.asNumber(loop.styles[it.key()]),
							    target  = DOM.helper.asNumber(it.current()),
								postfix = String.prototype.substr.call(loop.styles[it.key()],(''+current).length),
								set = {},divider = 1;
							
							if(it.key()=='opacity')
							{
								current*=100;
								target*=100;
								divider = 100;
							}
							if(current < target)
								set[it.key()] = (parseInt(current+Math.max(1,(target-current)/5))/divider) + postfix;
							else if(current > target)
								set[it.key()] = (parseInt(current-Math.max(1,(current-target)/5))/divider) + postfix;
							
							if(divider>1 && Math.abs(current-target)<1)
							{
								set[it.key()] = DOM.helper.asNumber(it.current())+postfix;
								i.properties[it.key()] = DOM.helper.asNumber(it.current())+postfix;
							}

							this.css(set);
						}
					}
				},
				final || i.properties.final,
				i.properties.timeout || DOM.defaults.loopTimeout
			);
		});
		if(autostart===undefined || autostart)
			handler.run();
		return handler;
	},
};
