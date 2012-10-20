/**
* Absolutely under construction
*/

var DOM = {
	helper : {
		asNumber : function(value){
			return isNaN(value=parseInt(value)) ? 0 : value;
		}
	},
	query : function(query){
		return DOM.Element(query);
	}
};

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


	// dimensions
	this.dimensions = {
		//---------------------------------------------------------------------------------------- Iterator.foreach(fn)
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
		//---------------------------------------------------------------------------------------- Iterator.foreach(fn)
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
					return this.css({height:(n(computedStyle.height) - n(set.substr(1)))+'px'});
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
		left : this.offsetAction.bind(this,'left'),
		top : this.offsetAction.bind(this,'top'),
	};
};





/*
	ActiveContainer // triggers events
		'push',
		'pop',
		'...',
	
	DOMElement:
		protected
			node

		offset
			get
			set
			parent
			absolute
			relative
		
		attributes
			add
			remove
			switch
			get
			set

		dom
			parent -> DOMElement
			children -> DOMElementContainer // only the childElements
			? subTree -> DOMElement_Iterator positioned to firstChild
		
		text
			get
			set
			innerHTML
			outerHTML
		
*/