/**
* Defaults
*/
DOM.defaults.ANIMATION_DURATION = 1000;
DOM.defaults.ANIMATION_STEP_TIME = 20;


/** ******************************************************************************************************************** DOM.ElementInterface
* DOM.ElementInterface
*/
DOM.ElementInterface = function(properties){
	this.properties = properties;

	this.init = function(element){
		var style = element.computedStyle();
		for(var i in this.properties)
		{
			if(style[i]!==undefined)
				element.style[i] = style[i]; // cache style for reading
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



/** ******************************************************************************************************************** DOM.EffectEngine
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
			    diff = Math.abs(target[prop]-initState[prop]),
			    normalStep = parseInt(diff/(numberOfSteps)),
			    extra = diff-normalStep*(numberOfSteps),
			    i = 0;
			
			this.$(element).direction = target[prop] > initState[prop] ? 1 : -1;

			for(i=0;i<numberOfSteps;i++)
				steps[i] = normalStep;

			// shift the array
			while(DOM.EffectEngine.Shifted.shiftArray(steps,this.shiftDirection));
			i = this.shiftDirection<0 ? numberOfSteps+this.shiftDirection : 0;
			for(i;i<steps.length-1 && i>=0;i+=this.shiftDirection)
				DOM.EffectEngine.Shifted.shiftArray(steps,this.shiftDirection,i);

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
			state[i] += this.$(element).direction * this.$(element).steps[i][animation.protected.step];
		}

		return state;
	};
}.inherits(DOM.EffectEngine);

DOM.EffectEngine.Flat = DOM.EffectEngine;
DOM.EffectEngine.Burst = function(){}.inherits(DOM.EffectEngine.Shifted,'()=>DOM.EffectEngine.Shifted(1)');
DOM.EffectEngine.Accelerate = function(){}.inherits(DOM.EffectEngine.Shifted,'()=>DOM.EffectEngine.Shifted(-1)');
DOM.EffectEngine.Lazy = DOM.EffectEngine.Accelerate;


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
		if(array[i]>1)
		{
			array[pos]++;
			--array[i];
		}
		nextStep = nextStep && (array[i] > 1);
		i+=direction;
	}
	i = pos+direction;
	if(nextStep && i>=0 && i<array.length)
		nextStep = DOM.EffectEngine.Shifted.shiftArray(array,direction,i);

	return nextStep;
};



/** ******************************************************************************************************************** DOM.Effect
* DOM.Effect
*/
DOM.Effect = function(properties){
	
	this.abstract(
		'init',
		'step'
	);

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
}.inherits(DOM.Effect,'(engine,interface,properties)=>DOM.Effect(properties)');


/** ******************************************************************************************************************** DOM.Animation
* DOM.Animation
*/
DOM.Animation = function(effects,details,elements,_finally){

	this.effects = ArrayIterator.for(effects instanceof Array ? effects : [effects]);
	this.elements = Class.instanceOf(elements,DOM.Iterator) ? elements : DOM.Iterator.for([elements]);
	this.details = details instanceof Object ? details : {};
	this.finally = _finally;
	
	this.id = DOM.Animation.id++;
	
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
			var animation = this;
			this.elements.foreach(function(){delete this.runningAnimations[animation.id]});

			if(typeof(this.finally)=='function')
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
					this.runningAnimations || (this.runningAnimations = {});
					this.runningAnimations[animation.id] = animation;
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
	};
};
DOM.Animation.id = 0;

DOM.Animation.create = function(effects,details,elements,_finally){return new this(effects,details,elements,_finally)};
DOM.Animation.factory = function(properties,elements,_finally){

	var effects = [],offsetChanges = false,cssChanges = false,engine = 'flat',details = {};
	
	// 
	for(var i in properties)
	{
		if(i=='duration')
		{
			details.duration = properties[i];
		}
		else if(i=='engine')
		{
			engine = properties[i];
		}
		else if(i=='left' || i=='right' || i=='top' || i=='bottom')
		{
			offsetChanges || (offsetChanges = {});
			offsetChanges[i] = properties[i];
		}
		else
		{
			cssChanges || (cssChanges = {});
			cssChanges[i] = properties[i];
		}
	}
	
	switch(engine)
	{
		case 'accelerate' : engine = DOM.EffectEngine.Accelerate; break;
		case 'lazy'       : engine = DOM.EffectEngine.Lazy; break;
		case 'burst'      : engine = DOM.EffectEngine.Burst; break;
		default           : engine = DOM.EffectEngine.Flat;
	}

	if(offsetChanges)
		effects.push(new DOM.Effect.ScalableEffect(engine,DOM.ElementInterface.Offset,offsetChanges));

	if(cssChanges)
		effects.push(new DOM.Effect.ScalableEffect(engine,DOM.ElementInterface,cssChanges));

	return new DOM.Animation(effects,details,elements,_finally);
};

DOM.Element.customMethods.stop = function(){
	for(var i in this.runningAnimations)
		this.runningAnimations[i].stop();
}