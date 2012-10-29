		
	/** **************************************************************************************************************** Iterator
	* Iterator interface
	*/
	var Iterator = Class.interface(
	//# abstract methods
		'rewind',
		'current',
		'key',
		'next',
		'valid',
		'getTarget'

	).extend({
	//# virtual methods
		first       : function(){ return this.rewind().current() },
		foreach     : function(action){ return Iterator.foreach(this,action) },
		clone       : function(){ return new this.constructor(this.getTarget()) },
		getIterator : function(){ return this }

	}).extendStatic({
	//# static methods
	//-------------------------------------------------------------------------------------------- Iterator.foreach(fn)
	/**
	* The foreach will iterate thru the target and call the action function with the following three parameters:
	*  1. iterator - the iterator instance
	*  2. step - the step count
	*  3. carry - an object to use as return value
	* If the action returns false it will break the iteration.
	*/
		foreach : function(iterator,action){
			if(!Class.instanceOf(iterator,this))
				iterator = this.for(iterator);

			var step = 0,
			    returnValue = {};
			for(iterator.rewind();iterator.valid();iterator.next())
			{
				if(action.call(iterator.current(),iterator,step++,returnValue) === false) // break on false result
					break;
			}
			// if anything is added to the returnValue
			for(var i in returnValue)
				return returnValue;

			return undefined;
		},
		
	//-------------------------------------------------------------------------------------------- Iterator.for(target)
	/**
	* This static method will create an ideal iterator instance for the given target
	*/
		for : function(target){
			
			// for future compatibility
			if(typeof(target)=='object' && typeof(target.getIterator)=='function')
			{
				var tmp = target.getIterator();
				if(Class.instanceOf(tmp,Iterator))
					return tmp;
			}

			if(this==Iterator) // basic behavior
			{
				if(target instanceof Array)
					return new ArrayIterator(target);

				return new ObjectIterator(target);
			}
			return new this(target); // derived classes should prefer their own constructor
		},
		
	//--------------------------------------------------------------------------------------------- Iterator.instance()
	/**
	* This static method will create an iterator instance for the given target
	*/
		instance : function(target,a,b,c){ return new this(target,a,b,c) }

	},true // recursive=true -> all derived classes will inherit these static methods
	);

	
	/** **************************************************************************************************************** ReversibleIterator
	* ReversibleIterator : Iterator
	*/
	var ReversibleIterator = Class.interface(
	//# abstract methods
		'previous',
		'reverse'
	)
	.extend({
	//# virtual methods
		last : function(){ return this.reverse().current() },
		flip : function(){
			
			var t = this.next;
			this.next = this.previous;
			this.previous = t;
			
			t = this.rewind;
			this.rewind = this.reverse;
			this.reverse = t;
			return this;
		}
	})
	.inherits(Iterator);


	/** **************************************************************************************************************** ArrayIterator
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
		
		// container access
		this.item  = function(n){ return n>=0 && n<this.protected.target.length ? this.protected.target[n] : false };
		this.count = function(n){ return this.protected.target.length };


	}.inherits(ReversibleIterator);

	
	/** **************************************************************************************************************** ObjectIterator
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
		this.reverse   = function(){ this.cacheKeys();this.protected.position = this.protected.keys.length-1; return this; };
		this.current   = function(){ return this.protected.target[this.protected.keys[this.protected.position]] };
		this.key       = function(){ return this.protected.keys[this.protected.position] };
		this.previous  = function(){ this.protected.position--; return this; };
		this.next      = function(){ this.protected.position++; return this; };
		this.valid     = function(){ return this.protected.position>=0 && this.protected.position<this.protected.keys.length };
	}
	.inherits(ReversibleIterator);
	
	
	/** **************************************************************************************************************** FilteredObjectIterator
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
	
	
	/** **************************************************************************************************************** PropertyIterator
	* class PropertyIterator : FilteredObjectIterator
	*/
	var PropertyIterator = function(target){}
		.inherits(
			FilteredObjectIterator,
			/* as */ function(target){return [target,function(t){return typeof(t)!="function"}]} // function injection mode
		);


	/** **************************************************************************************************************** MethodIterator
	* class MethodIterator : FilteredObjectIterator
	*/
	var MethodIterator = function(target){}
		.inherits(
			FilteredObjectIterator,
			/* as */ '(target)=>(target,function(t){return typeof(t)=="function"})'  // param query mode
		);


	/** **************************************************************************************************************** DOM_Iterator
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
		this.key       = function(){ return this.protected.current && this.protected.current.tagName };
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
				while(current && current!=this.protected.target.parentNode)
				{
					this.protected.depth--;
					current = current.parentElement;
					if(current && current.nextElementSibling)
						break;
				}
				// if we reached the end of the structure/subtree
				if(!current || current==this.protected.target.parentNode)
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


	/** **************************************************************************************************************** TAG_Iterator
	* class TAG_Iterator : DOM_Iterator
	*/
	var TAG_Iterator = function(element,tagName){
		
		// protected scope
		this.protected({
			tagName : tagName || element.tagName
		});

		// jumps to the next tag
		this.seekTag = function(){
			while(this.protected.current && this.protected.current.tagName!=this.protected.tagName)
			{
				this.super('next'); // call DOM_Iterator::next()
			}
			return this;
		};
		
		// rewind needs a seekTag
		this.rewind = function(){
			this.super('rewind'); // call DOM_Iterator::rewind()
			return this.seekTag();
		};
		
		// next needs a seekTag
		this.next = function(){
			this.super('next'); // call DOM_Iterator::next()
			return this.seekTag();
		};
		
		// construction needs a seekTag as well
		this.seekTag();
	}.inherits(DOM_Iterator);



	/** **************************************************************************************************************** Iterator modifiers
	* Iterator modifiers
	* These modifiers are used to modify default iterator behavior.
	* In case of chaining modifiers always use them in the following order to avoid any incompatibilities:
	*  [Infinite] [Odd|Even] [Reverse]
	*/


	/** **************************************************************************************************************** Infinite modifier
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

		instance.next_Infinite = instance.next;
		instance.next = function(){
			this.next_Infinite();
			if(!this.valid_Infinite())
				this.rewind();
			return this;
		};
		
		return instance;
	};


	/** **************************************************************************************************************** Odd modifier
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

	
	/** **************************************************************************************************************** Even modifier
	* Even modifier
	*/
	var Even = function(iterator){

		var instance = iterator.clone();

		instance.clone = function(){return this}; // modifier chainability
		instance.rewind_Even = instance.rewind;
		instance.rewind = function(){
			this.rewind_Even();
			this.next_Even();
			return this;
		};

		instance.next_Even = instance.next;
		instance.next = function(){
			for(var i=0;i<2;i++)
				this.next_Even();
			return this;
		};

		instance.next_Even(); // position the iterator to position 2

		return instance;
	};


	/** **************************************************************************************************************** Reverse modifier
	* Reverse modifier
	*/
	var Reverse = function(iterator){

		var instance = iterator.clone();

		if(!iterator.instanceOf(ReversibleIterator))
			return instance;

		instance.clone = function(){return this}; // modifier chainability
		instance.flip();

		return instance;
	};
