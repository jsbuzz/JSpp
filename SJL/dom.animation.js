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
	this.init = function(element,properties){
		for(var i in properties)
		{
			var prefix = (''+properties[i]).charAt(0);
			if(prefix=='+')
				properties[i] = element.offset[i]()+DOM.helper.asNumber(properties[i]);
			else if(prefix=='+')
				properties[i] = element.offset[i]()-DOM.helper.asNumber(properties[i]);
		}
	};
	
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
* DOM.EffectEngine
*/
DOM.EffectEngine = function(){
	this.id = 'DOM.EffectEngine::'+DOM.EffectEngine.staticID++;

	//------------------------------------------------------------------------------------------ DOM.EffectEngine::init
	this.init = function(element,initState,target,animation){
		var numberOfSteps = animation.details.stepCount;

		this.$(element).normalSteps = {};
		this.$(element).finalSteps = {};

		for(var i in initState)
		{
			this.$(element).normalSteps[i] = parseInt((target[i]-initState[i])/(numberOfSteps));
			this.$(element).finalSteps[i] = (target[i]-initState[i])-this.$(element).normalSteps[i]*(numberOfSteps-1);
		}
	};

	//------------------------------------------------------------------------------------------ DOM.EffectEngine::step
	this.step = function(element,state,animation){
		for(var i in state)
		{
			state[i] += (
				animation.protected.step == animation.details.stepCount-1 ? 
					this.$(element).finalSteps[i]
					:
					this.$(element).normalSteps[i]
			);
		}
			
		return state;
	};
	
	//--------------------------------------------------------------------------------------- DOM.EffectEngine::cleanup
	this.cleanup = function(){
		for(var i in this.elements)
			delete this.elements[i].data[this.id];
			
		delete this.elements;
	};
	
	//--------------------------------------------------------------------------------------------- DOM.EffectEngine::$
	this.$ = function(element){
		if(!element.data[this.id])
		{
			this.elements || (this.elements = []);
			this.elements.push(element);
			element.data[this.id] = {};
		}
		return element.data[this.id];
	};

};
DOM.EffectEngine.staticID = 0;


/**
* DOM.EffectEngine.Shifted
*/
DOM.EffectEngine.Shifted = function(direction){
	this.shiftDirection = direction || 1;
	
	//---------------------------------------------------------------------------------- DOM.EffectEngine.Shifted::init
	this.init = function(element,initState,target,animation){
		var numberOfSteps = animation.details.stepCount;
		
		this.$(element).steps = {};

		// for all the properties to change
		for(var prop in initState)
		{
			this.$(element).steps[prop] = new Array(numberOfSteps); // for state modifications

			var steps = this.$(element).steps[prop],
			    normalStep = parseInt((target[prop]-initState[prop])/(numberOfSteps)),
					extra = (target[prop]-initState[prop])-normalStep*(numberOfSteps),
					i = 0;

			for(i=0;i<numberOfSteps;i++)
				steps[i] = normalStep;

			DOM.EffectEngine.Shifted.shiftArray(steps,this.shiftDirection);

			i = this.shiftDirection<0 ? numberOfSteps+this.shiftDirection : 0;
			while(extra-->0)
			{
				++steps[i];
				i+=this.shiftDirection;
			}
		}
	};

	//---------------------------------------------------------------------------------- DOM.EffectEngine.Shifted::step
	this.step = function(element,state,animation){
		for(var i in state)
		{
			state[i] += this.$(element).steps[i][animation.protected.step];
		}
			
		return state;
	};
}.inherits(DOM.EffectEngine);


/**
* DOM.EffectEngine.Shifted.shiftArray (array,direction,pos)
* helper function for DOM.EffectEngine.Shifted objects
*/
DOM.EffectEngine.Shifted.shiftArray = function(array,direction,pos){
	direction = direction ? direction/Math.abs(direction) : 1;
	var i = pos===undefined ? (direction>0 ? 0 : array.length-1) : pos,
	    pos = i,
			nextStep = true;
	i+=direction;
	while(i>=0 && i<array.length)
	{
		array[pos]++;
		--array[i];
		nextStep = nextStep && (array[i] > 1);
		i+=direction;
	}
	i = pos+direction;
	if(nextStep && i>=0 && i<array.length)
		DOM.EffectEngine.Shifted.shiftArray(array,direction,i);
	return array;
};



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
		this.interface.write(element,this.engine.step(element,this.interface.read(element),animation));
	};
	
	this.cleanup = function(){this.engine.cleanup();};
}.inherits(DOM.Effect);


/** ******************************************************************************************************************* DOM.Animation
* DOM.Animation
*/
DOM.Animation = function(effects,details,elements){

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
	
	this.apply = function(elements){
		this.elements = Class.instanceOf(elements,DOM.Iterator) ? elements : DOM.Iterator.for([elements]);
		this.run();
	}
	
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