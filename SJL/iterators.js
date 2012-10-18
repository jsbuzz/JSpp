		
	/** *************************************************************************************************************** Iterator
	* Iterator interface
	*/
	var Iterator = Class.interface(
	//# abstract methods
		'rewind',
		'current',
		'key',
		'next',
		'valid',
		'getTarget',
		'plusOne' // this will throw error on Iterator.check(true)

	).extend({
	//# virtual methods
		foreach : function(action){ return Iterator.foreach(this,action) },
		clone   : function(){ return new this.constructor(this.getTarget()) }

	}).extendStatic({
	//# static methods
	//-------------------------------------------------------------------------------------------- Iterator.foreach(fn)
		foreach : function(iterator,action){
			if(!Class.instanceOf(iterator,this))
				iterator = this.for(iterator);

			var step = 0,
			    returnValue = {};
			for(iterator.rewind();iterator.valid();iterator.next())
			{
				if(action(iterator,step++,returnValue) === false) // break on false result
					break;
			}
			// if anything is added to the returnValue
			for(var i in returnValue)
				return returnValue;

			return undefined;
		},
		
	//-------------------------------------------------------------------------------------------- Iterator.for(target)
		for : function(target){
			
			// for future compatibility
			if(typeof(target)=='object' && typeof(target.getIterator)=='function')
			{
				var tmp = target.getIterator();
				if(Class.instanceOf(tmp,Iterator))
					return tmp;
			}

			if(this==Iterator)
			{
				if(target instanceof Array)
					return new ArrayIterator(target);

				return new ObjectIterator(target);
			}
			return new this(target);
		},
		
	//--------------------------------------------------------------------------------------------- Iterator.instance()
		instance : function(target){ return new this(target) }

	},true // recursive=true -> all derived classes will inherit these static methods
	);

	
	/** *************************************************************************************************************** ReversibleIterator
	* ReversibleIterator : Iterator
	*/
	var ReversibleIterator = Class.interface(
		'previous',
		'reverse'
	)
	.inherits(Iterator);


	/** *************************************************************************************************************** ArrayIterator
	* class ArrayIterator : ReversibleIterator
	*/
	var ArrayIterator = function(target){

		// protected scope
		this.protected({
			target   : target,
			position : 0,
		});

		// Iterator methods
		this.getTarget = function(){ return this.protected.target; };
		this.rewind    = function(){ this.protected.position = 0; return this; };
		this.reverse   = function(){ this.protected.position = this.protected.target.length-1; return this; };
		this.current   = function(){ return this.protected.target[this.protected.position] };
		this.key       = function(){ return this.protected.position };
		this.previous  = function(){ this.protected.position--; return this; };
		this.next      = function(){ this.protected.position++; return this; };
		this.valid     = function(){ return this.protected.position>=0 && this.protected.position<this.protected.target.length };

	}.inherits(ReversibleIterator);

	
	/** *************************************************************************************************************** ObjectIterator
	* class ObjectIterator : ReversibleIterator
	*/
	var ObjectIterator = function(target){
		
		// protected scope
		this.protected({
			target   : target,
			keys     : [],
			position : 0,
		});

		// 
		this.cacheKeys = function(){ 
			this.protected.keys = [];
			for(var i in this.protected.target)
				this.protected.keys.push(i);
		};

		// Iterator methods
		this.getTarget = function(){ return this.protected.target; };
		this.rewind    = function(){ this.cacheKeys();this.protected.position = 0; return this; };
		this.reverse   = function(){ this.protected.position = this.protected.keys.length-1; return this; };
		this.current   = function(){ return this.protected.target[this.protected.keys[this.protected.position]] };
		this.key       = function(){ return this.protected.keys[this.protected.position] };
		this.previous  = function(){ this.protected.position--; return this; };
		this.next      = function(){ this.protected.position++; return this; };
		this.valid     = function(){ return this.protected.position>=0 && this.protected.position<this.protected.keys.length };
	}
	.inherits(ReversibleIterator);
	
	
	/** *************************************************************************************************************** FilteredObjectIterator
	* class FilteredObjectIterator : ObjectIterator
	*/
	var FilteredObjectIterator = function(target,condition){

		// extend protected scope
		this.protected({
			condition : condition
		});
		
		// overload cacheKeys
		this.cacheKeys = function(){ 
			this.protected.keys = [];
			for(var i in this.protected.target)
			{
				if(this.protected.condition(this.protected.target[i]))
					this.protected.keys.push(i);
			}
		};
	}
	.inherits(ObjectIterator);
	
	
	/** *************************************************************************************************************** PropertyIterator
	* class PropertyIterator : FilteredObjectIterator
	*/
	var PropertyIterator = function(target){}
		.inherits(
			FilteredObjectIterator,
			/* as */ function(target){return [target,function(t){return typeof(t)!="function"}]} // function injection mode
		);


	/** *************************************************************************************************************** MethodIterator
	* class MethodIterator : FilteredObjectIterator
	*/
	var MethodIterator = function(target){}
		.inherits(
			FilteredObjectIterator,
			/* as */ '(target)=>(target,function(t){return typeof(t)=="function"})'  // param query mode
		);


	/** *************************************************************************************************************** DOM_Iterator
	* class DOM_Iterator : Iterator
	*/
	var DOM_Iterator = function(element){

		// protected scope
		this.protected({
			target   : element || document,
		    current  : element,
			depth    : 0
		});


		// methods
		this.getTarget = function(){ return this.protected.target; };
		this.rewind    = function(){ this.protected.current = this.protected.target; return this; };
		this.current   = function(){ return this.protected.current };
		this.key       = function(){ return this.protected.current.tagName };
		this.next      = function(){

			if(!this.protected.current)
				return this;

			var current = this.protected.current; // shorter alias

			// first try to go down
			if(current.childElementCount)
			{
				current = current.firstElementChild;
				this.protected.depth++;
			}
			// then to the next sibling
			else if(current.nextElementSibling)
			{
				current = current.nextElementSibling;
			}
			// then try to climb up
			else
			{
				while(current && current!=this.protected.target && current!=this.protected.target.parentNode)
				{
					this.protected.depth--;
					current = current.parentElement;
					if(current && current.nextElementSibling)
						break;
				}
				// if we reached the end of the structure/subtree
				if(!current || current==this.protected.target || current==this.protected.target.parentNode)
					current = null;
				else
					current = current.nextElementSibling;
			}
			this.protected.current = current;
			return this;
		};

		this.valid   = function(){ return this.protected.current };
		this.depth   = function(){ return this.protected.depth };

	}.inherits(Iterator);


	/**
	* Iterator modifiers
	* These modifiers are used to modify default iterator behavior.
	* In case of chaining modifiers always use them in the following order to avoid any incompatibilities:
	*  [Infinite] [Odd|Even] [Reverse]
	*/


	/** *************************************************************************************************************** Infinite modifier
	* Infinite modifier
	*/
	var Infinite = function(iterator){

		var instance = iterator.clone();

		instance.clone = function(){return this}; // modifier chainability
		instance.valid_Infinite = instance.valid;
		instance.valid = function(){
			if(!this.valid_Infinite())
				this.rewind();
			return true;
		};

		return instance;
	};


	/** *************************************************************************************************************** Odd modifier
	* Odd modifier
	*/
	var Odd = function(iterator){

		var instance = iterator.clone();

		instance.clone = function(){return this}; // modifier chainability
		instance.next_Odd = instance.next;
		instance.next = function(){
			for(var i=0;i<2;i++)
				this.next_Odd();
			return this;
		};

		return instance;
	};

	
	/** *************************************************************************************************************** Even modifier
	* Even modifier
	*/
	var Even = function(iterator){

		var instance = iterator.clone();

		instance.clone = function(){return this}; // modifier chainability
		instance.rewind_Even = instance.rewind;
		instance.rewind = function(){
			this.rewind_Even();
			this.valid() && this.next_Even();
			return this;
		};

		instance.next_Even = instance.next;
		instance.next = function(){
			for(var i=0;i<2;i++)
				this.next_Even();
			return this;
		};

		return instance;
	};


	/** *************************************************************************************************************** Reverse modifier
	* Reverse modifier
	*/
	var Reverse = function(iterator){

		var instance = iterator.clone();

		if(!iterator.instanceOf(ReversibleIterator))
			return instance;

		instance.clone = function(){return this}; // modifier chainability
		instance.next = instance.previous;
		instance.rewind = instance.reverse;

		return instance;
	};
