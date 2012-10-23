/**
* Absolutely under construction
*/

var DOM = {
	helper : {
		asNumber : function(value){
			return isNaN(value=Number((''+value).replace(/[^\-0-9.]/g,''))) ? 0 : value;
		}
	},
	defaults : {
		loopTimeout : 50
	},
	query : function(query,parent){
		return parent instanceof HTMLElement ? 
			DOM.Iterator.for(parent.querySelectorAll(query))
			:
			DOM.Iterator.for(document.querySelectorAll(query));
	}
};


/**
* DOM.Iterator
* This tool with help you handle DOM element groups.
*/
DOM.Iterator = function(){
	this.current = function(){ return DOM.Element(this.protected.target[this.protected.position]); };

	this.css = function(addendum){
		for(this.rewind();this.valid();this.next())
			this.current().css(addendum);
		return this;
	};
	
	this.move = function(offset,value){
		for(this.rewind();this.valid();this.next())
			this.current().offsetAction(offset,value);
		return this;
	};

}.inherits(ArrayIterator);


/**
* DOM.Element
* This class gives the basic HTMLElement objects extended functionality
*/
DOM.Element = function(element){

	if(element!==undefined)
	{
		if(typeof(element)=='string')
			element = document.querySelector(element);

		if(typeof(element)=='object' && element._jspp === undefined)
			DOM.Element.apply(element)

		return element;
	}

	// check if extension is done
	if(this._jspp !== undefined)
		return this;
	else
		this._jspp = true;


	// style
	this.css = function(addendum)
	{
		for(var i in addendum)
		{
			if(typeof(this.style[i])!='undefined')
				this.style[i] = addendum[i];
		}
		return this;
	};


	// helpers
	this.computedStyle = function(){return window.getComputedStyle(this);};
	this.clientRect = function(){return this.getBoundingClientRect();};


	// query
	this.query = function(query){
		return DOM.Iterator.for(this.querySelectorAll(query));
	};
	this.query.subTree = function(){
		return DOM.Iterator.for(this.querySelectorAll("*"));
	}.bind(this);
	this.query.children = function(){
		return DOM.Iterator.instance(this.children);
	}.bind(this);
	

	// dimensions
	this.dimensions = {
		//-------------------------------------------------------------------------------------------- dimensions.width
		width : function(set){

			if(set===undefined)
				return this.clientRect().width;

			var computedStyle = this.computedStyle(),
			    n = DOM.helper.asNumber;

			if(set===null || typeof(set)=='string' && (set.charAt(0)=='-' || set.charAt(0)=='+'))
			{
				if(set===null)
					return this.css({width:''});
				else if(set.charAt(0)=='-')
					return this.css({width:(n(computedStyle.width) - n(set.substr(1)))+'px'});
				else
					return this.css({width:(n(computedStyle.width) + n(set.substr(1)))+'px'});
			}

			var extraWidth = 
					n(computedStyle.borderLeftWidth)+n(computedStyle.borderRightWidth)
					+ n(computedStyle.paddingLeft)+n(computedStyle.paddingRight);

			return this.css({width : (set-extraWidth)+'px'});
		}.bind(this),
		//------------------------------------------------------------------------------------------- dimensions.height
		height : function(set){

			if(set===undefined)
				return this.clientRect().height;

			var computedStyle = this.computedStyle(),
			    n = DOM.helper.asNumber;

			if(set===null || typeof(set)=='string' && (set.charAt(0)=='-' || set.charAt(0)=='+'))
			{
				if(set===null)
					return this.css({height:''});
				else if(set.charAt(0)=='-')
				{
					return this.css({height:(n(computedStyle.height) - n(set.substr(1)))+'px'});
				}
				else
					return this.css({height:(n(computedStyle.height) + n(set.substr(1)))+'px'});
			}

			var extraHeight = 
					n(computedStyle.borderTopWidth)+n(computedStyle.borderBottomWidth)
					+ n(computedStyle.paddingTop)+n(computedStyle.paddingBottom);

			return this.css({height : (set-extraHeight)+'px'});
		}.bind(this)
	};


	// offset
	this.offsetAction = function(direction,value){
		var real = this.clientRect()[direction],
			set = {};

		if(value===undefined)
			return real;

		var computedStyle = this.computedStyle(),
		    relative = DOM.helper.asNumber(computedStyle[direction]),
			diff = real-relative;

		if(computedStyle.position=='static')
			this.css({position : 'relative'});

		if(value===null || typeof(value)=='string' && (value.charAt(0)=='-' || value.charAt(0)=='+'))
		{
			if(value===null)
				set[direction] = '0px';
			else if(value.charAt(0)=='-')
				set[direction] = (relative-DOM.helper.asNumber(value.substr(1)))+'px';
			else
				set[direction] = (relative+DOM.helper.asNumber(value.substr(1)))+'px';
			return this.css(set);
		}
		
		if(computedStyle.position=='absolute')
			set[direction] = value+'px';
		else
			set[direction] = (value-diff)+'px';

		return this.css(set);
	};
	this.offset = {
		left   : this.offsetAction.bind(this,'left'),
		top    : this.offsetAction.bind(this,'top'),
		right  : this.offsetAction.bind(this,'right'),
		bottom : this.offsetAction.bind(this,'bottom'),
		rect   : this.clientRect.bind(this)
	};


	// attributes doodle
	this.attr = [
		'get',
		'add',
		'set',
		'remove', //?
		'override'
	];


	// events
	this.events = {
		//----------------------------------------------------------------------------------------------- events.create
		create : function(event){
			
			// create listener
			if(typeof(this.events[event+'Listener'])=='undefined')
			{
				this.events[event+'Listener'] = function(eventName,e){
					var returnSum = undefined,returnOne;

					if(typeof(this.events[eventName])=='function')
					{
						returnSum = this.events[eventName].call(this,e);
					}
					else
					{
						for(var i in this.events[eventName])
						{
							if(typeof(this.events[eventName][i])=='function'
							   && (this.events[eventName][i].listen===undefined || this.events[eventName][i].listen)
							){
								returnOne = this.events[eventName][i].call(this,e);
								if(returnOne===false)
									returnSum = false;
							}
						}
					}
					return false;
				}.bind(this,event);
				this.events[event+'Listener'].active = false;
			}
			// create container
			if(typeof(this.events[event])=='undefined')
				this.events[event] = {};
			
			return this.events[event];
		}.bind(this),
		
		//----------------------------------------------------------------------------------------------- events.listen
		listen : function(event,onEventMode){
			this.events.create(event);
			if(!this.events[event+'Listener'].active)
			{
				this.events[event+'Listener'].active = true;
				if(onEventMode)
				{
					this.events[event+'Listener'].onEvent = true;
					(this)['on'+event] = this.events[event+'Listener'];
				}else{
					this.addEventListener(event, this.events[event+'Listener'], false);
					this.events[event+'Listener'].onEvent = false;
				}
			}
			return this.events[event];
		}.bind(this),

		//------------------------------------------------------------------------------------------------- events.stop
		stop : function(event){
			this.events.create(event);
			if(this.events[event+'Listener'].active)
			{
				this.events[event+'Listener'].active = false;
				if(this.events[event+'Listener'].onEvent)
					(this)['on'+event] = null;
				else
					this.removeEventListener(event, this.events[event+'Listener'], false);
			}
			return this.events[event];
		}.bind(this),
		
		//------------------------------------------------------------------------------------- events.disableListeners
		disableListeners : function(event,list){
			for(var i in list)
			{
				this.events[event][list[i]].listen = false;
			}
			return this.events;
		}.bind(this),

		//-------------------------------------------------------------------------------------- events.enableListeners
		enableListeners : function(event,list){
			for(var i in list)
			{
				this.events[event][list[i]].listen = true;
			}
			return this.events;
		}.bind(this),

		//---------------------------------------------------------------------------------------------- events.trigger
		trigger : function(event,data){
			var evt = document.createEvent('Event');
			evt.initEvent(event, true, true);
			evt.data = data;
			return this.dispatchEvent(evt);
		}.bind(this),

		//-------------------------------------------------------------------------------------- events.preventOriginal
		preventOriginal : function(event){
			(this)['on'+event] = function(){return false;}
			return this.events;
		}.bind(this),

		//------------------------------------------------------------------------------------------------ basic events
		click     : {},
		dblclick  : {},
		mousedown : {},
		mouseup   : {},
		mousemove : {},
		mouseover : {},
		mouseout  : {},

		keydown   : {},
		keyup     : {},
		keypress  : {},

		blur      : {},
		focus     : {}
	};

	
	// for passing variables
	this.data = {};
	
	
	// loops
	this.createLoop = function(name,condition,action,final,timeout){
		this.loops || (this.loops = {});
	
		this.loops[name] = function(name){
			var loop = this.loops[name];
			if(loop.active!==undefined && !loop.active)
			{
				loop.running = false;
				return false;
			}
			if(loop.condition===true || loop.condition.call(this,loop))
			{
				loop.running = true;
				loop.action.call(this,loop);
				loop.timer = window.setTimeout(loop,loop.timeout);
			}
			else
			{
				loop.running = false;
				loop.timer = 0;
				if(loop.final)
					loop.final.call(this,loop);
			}
		}.bind(this,name);
		
		this.loops[name].timeout = timeout || DOM.defaults.loopTimeout;
		this.loops[name].condition = condition;
		this.loops[name].action = action;
		this.loops[name].final = final;

		return this.loops[name];
	};
};
