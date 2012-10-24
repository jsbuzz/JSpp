/**
* Defaults
*/
DOM.defaults.ANIMATION_DURATION = 1000;
DOM.defaults.ANIMATION_STEP_TIME = 20;


/** ******************************************************************************************************************* DOM.ElementInterface
* DOM.ElementInterface
*/
DOM.ElementInterface = function(properties){
	this.properties = properties;

	this.init = function(element){
		var style = element.computedStyle();
		for(var i in this.properties)
		{
			if(style[i]!==undefined)
				element.style[i] = style[i];
			else
				delete this.properties[i];
		}
	}

	this.read = function(element){
		var state = {};
		for(var i in this.properties)
			state[i] = DOM.helper.asNumber(element.style[i]);
		return state;
	};
	
	this.write = function(element,state){
		for(var i in this.properties)
		{
			element.style[i] = state[i]+'px';
		}
	};
}

DOM.ElementInterface.Offset = function(){
	this.init = function(){};
	
	this.read = function(element){
		var state = {};
		for(var i in this.properties)
			state[i] = element.offset[i]();
		return state;
	};

	this.write = function(element,state){
		for(var i in this.properties)
			element.offsetAction(i,state[i]);
	};
}.inherits(DOM.ElementInterface);



/** ******************************************************************************************************************* DOM.EffectEngine
* DOM.EffectEngine : 
*/
DOM.EffectEngine = function(){
	this.id = 'DOM.EffectEngine::'+DOM.EffectEngine.staticID++;

	this.init = function(element,initState,target,animation){
		var numberOfSteps = animation.details.stepCount;
		
		this.elements = (this.elements || []).concat([element]);

		element.data[this.id] = {};
		element.data[this.id].normalSteps = {};
		element.data[this.id].finalSteps = {};
		element.data[this.id].initState = initState;

		for(var i in initState)
		{
			element.data[this.id].normalSteps[i] = parseInt((target[i]-initState[i])/(numberOfSteps));
			element.data[this.id].finalSteps[i] = (target[i]-initState[i])-element.data[this.id].normalSteps[i]*(numberOfSteps-1);
		}
	};

	this.step = function(element,animation){
		for(var i in element.data[this.id].initState)
		{
			element.data[this.id].initState[i] += (
				animation.protected.step == animation.details.stepCount-1 ? 
					element.data[this.id].finalSteps[i]
					:
					element.data[this.id].normalSteps[i]
			);
		}
			
		return element.data[this.id].initState;
	};
	
	this.cleanup = function(){
		for(var i in this.elements)
			delete this.elements[i].data[this.id];
			
		delete this.elements;
	};
};
DOM.EffectEngine.staticID = 0;


/** ******************************************************************************************************************* DOM.Effect
* DOM.Effect
*/
DOM.Effect = function(properties){
	this.init = function(){throw new Error('DOM.Effect::init not implemented')};
	this.step = function(){throw new Error('DOM.Effect::step not implemented')};
	this.cleanup = function(){};
	
	this.properties = properties;
};

DOM.Effect.ScalableEffect = function(engine,interface,properties){
	this.engine = new engine;
	this.interface = new interface(properties);

	this.init = function(element,animation){
		this.interface.init(element,properties);
		this.engine.init(element,this.interface.read(element),properties,animation);
	};
	
	this.step = function(element,animation){
		this.interface.write(element,this.engine.step(element,animation));
	};
	
	this.cleanup = function(){this.engine.cleanup();};
}.inherits(DOM.Effect);


/** ******************************************************************************************************************* DOM.Animation
* DOM.Animation
*/
DOM.Animation = function(effects,elements,details){

	this.effects = ArrayIterator.for(effects instanceof Array ? effects : [effects]);
	this.elements = Class.instanceOf(elements,DOM.Iterator) ? elements : DOM.Iterator.for([elements]);
	this.details = details instanceof Object ? details : {};
	this.finally = 0;
	
	this.effects.foreach(function(){
		if(!Class.instanceOf(this,DOM.Effect))
			throw new Error('DOM.Animation : invalid parameter for effects!');
	});
	
	this.protected = {
		step : 0,
		timer : 0,
		next : null,
		initDone : false,
		finish : function(){
			this.protected.timer = 0;
			this.protected.step = 0;
			this.protected.initDone = false;
			
			this.effects.foreach(function(){this.cleanup()});

			if(this.finally)
				this.finally();
			if(this.protected.next)
				this.protected.next.run();
		}.bind(this)
	};
	
	this.details.duration || (this.details.duration = DOM.defaults.ANIMATION_DURATION);
	this.details.duration = this.details.duration-this.details.duration%100;
	this.details.stepTime = DOM.defaults.ANIMATION_STEP_TIME;
	this.details.stepCount = this.details.duration/this.details.stepTime;
	
	this.init = function(){
		this.effects.animation = this;
		this.effects.foreach(function($){
			var effect = this,
			    animation = $.animation;
			$.animation.elements.foreach(function(){
				effect.init(this/*element*/,animation);
			});
		});
		this.protected.step = 0;
		this.protected.initDone = true;
	};
	
	this.run = function(){
		this.step(true);
	};
	
	this.step = function(play){
		if(!this.protected.initDone)
			this.init();
		if(this.protected.step < this.details.stepCount)
		{
			this.effects.animation = this;
			this.effects.foreach(function($){
				var effect = this,
				    animation = $.animation;
				$.animation.elements.foreach(function(){
					effect.step(this/*element*/,animation);
				});
			});
			this.protected.step++;
			if(play)
				this.protected.timer = window.setTimeout(this.step.bind(this,true),this.details.stepTime);
			return true;
		}else{
			this.protected.finish();
		}
		return false;
	};
	
	this.stop = function(){
		if(this.protected.timer)
		{
			window.clearTimeout(this.protected.timer);
			this.protected.timer = 0;
		}
	};
	
	this.concat = function(sibling)
	{
		if(!Class.instanceOf(sibling,DOM.Animation))
			throw new Error('DOM.Animation::concat invalid parameter for sibling!');
		this.protected.next = sibling;
		return this;
	}
};

DOM.Animation.create = function(effects,elements,details){return new this(effects,elements,details)};