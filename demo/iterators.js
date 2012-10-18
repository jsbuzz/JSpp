		
	/** *************************************************************************************************************** Iterator
	* Iterator interface
	*/
	var Iterator = Class.interface(
		'rewind',
		'current',
		'key',
		'next',
		'valid',
		'getTarget',
		'plusOne' // this will throw error on Iterator.check(true)
	);


	/**
	* Iterator.foreach
	*/
	Iterator.foreach = function(iterator,action){
		if(!Class.instanceOf(iterator,Iterator))
			iterator = new ObjectIterator(iterator);

		for(iterator.rewind();iterator.valid();iterator.next())
		{
			if(action(iterator) === false) // break on false result
				break;
		}
	};


	/** *************************************************************************************************************** $AccessModel
	* $AccessModel class
	*/
	var $AccessModel = function(){

		this.$ = function(access,set)
		{
			var me = this;
			if(typeof(me[access])!='undefined')
				return set===undefined ? me[access] : (me[access]=set);
			if(typeof(me.protected[access])!='undefined')
				return set===undefined ? me.protected[access] : (me.protected[access]=set);
			
			throw new Error('$ Access to undefined property: '+access);
		};

		this.$$ = function(query){
			var varName = query,
			    operatorPos = query.length,
					me = this;
			
			for(var i=0;i<query.length;i++)
			{
				if(!query.charAt(i).match(/\w/))
				{
					varName=varName.substr(0,i);
					operatorPos=i;
					break;
				}
			}
			if(typeof(me[varName])!='undefined')
				varName = 'this.'+varName;
			else if(typeof(me.protected[varName])!='undefined')
				varName = 'this.protected.'+varName;
			else
				throw new Error('$$ Access to undefined property: '+varName);

			return eval('('+varName+query.substr(operatorPos)+')');
		};

	};


	/** *************************************************************************************************************** ArrayIterator
	* class ArrayIterator : Iterator,$AccessModel
	*/
	var ArrayIterator = function(target){

		// protected scope
		this.protected({
				target   : target,
				position : 0,
			});


		// methods
		this.getTarget = function(){
			return this.$('target');
		};

		this.rewind = function(){
			this.$$('position=0');
			return this;
		};

		this.current = function(){
			return this.$('target')[this.$('position')]
		};

		this.key = function(){
			return this.$('position')
		};

		this.next = function(){
			this.$$('position++');
			return this;
		};

		this.valid = function(){
			return this.$('position') < this.$('target').length
		};

	}.inherits([Iterator,$AccessModel]);

	
	/** *************************************************************************************************************** ObjectIterator
	* class ObjectIterator : Iterator
	*/
	var ObjectIterator = function(target){
		
		// protected scope
		this.protected({
				target   : target,
		    keys     : [],
				position : 0,
			});

		// map keys
		for(var i in target)
			this.protected.keys.push(i);

		// methods
		this.getTarget = function(){ return this.protected.target; };
		this.rewind    = function(){ this.protected.position = 0; return this; };
		this.current   = function(){ return this.protected.target[this.protected.keys[this.protected.position]] };
		this.key       = function(){ return this.protected.keys[this.protected.position] };
		this.next      = function(){ this.protected.position++; return this; };
		this.valid     = function(){ return this.protected.position<this.protected.keys.length };
	}
	.inherits(Iterator);
	
	
	/** *************************************************************************************************************** FilteredObjectIterator
	* class FilteredObjectIterator : ObjectIterator
	*/
	var FilteredObjectIterator = function(target,condition){

		// overwrite protected scope
		this.protected.target = target;
		this.protected.condition = condition;
		for(var i in target)
		{
			if(condition(target[i]))
				this.protected.keys.push(i);
		}
	}
	.inherits(ObjectIterator,'(target,condition)=>ObjectIterator()');
	
	
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
			
			var current = this.protected.current; // shorter alias

			if(current.childElementCount)
			{
				current = current.firstElementChild;
				this.protected.depth++;
			}
			else if(current.nextElementSibling)
			{
				current = current.nextElementSibling;
			}
			else
			{
				while(current && current!=this.protected.target)
				{
					this.protected.depth--;
					current = current.parentElement;
					if(current && current.nextElementSibling)
						break;
				}
				if(!current || current==this.protected.target)
					current = null;
				else
					current = current.nextElementSibling;
			}
			this.protected.current = current;
		};
		
		this.valid   = function(){ return this.protected.current };
		this.depth   = function(){ return this.protected.depth };

	}.inherits(Iterator);


	/** *************************************************************************************************************** Odd modifier
	* Odd modifier
	*/
	var Odd = function(iteratorClass,target){
	
		// clone mode
		if(arguments.length==1)
		{
			target = iteratorClass.getTarget();
			iteratorClass = iteratorClass.constructor;
		}

		// default mode
		var instance = new iteratorClass(target);

		instance.next_ = instance.next;
		instance.next = function(){
			var i = 2;
			while(this.valid() && i--)
				this.next_();
		};

		return instance;
	};

	
	/** *************************************************************************************************************** Even modifier
	* Even modifier
	*/
	var Even = function(iteratorClass,target){
	
		// clone mode
		if(arguments.length==1)
		{
			target = iteratorClass.getTarget();
			iteratorClass = iteratorClass.constructor;
		}

		// default mode
		var instance = new iteratorClass(target);

		instance.rewind_ = instance.rewind;
		instance.rewind = function(){
			this.rewind_();
			this.valid() && this.next_();
			return this;
		};

		instance.next_ = instance.next;
		instance.next = function(){
			var i = 2;
			while(this.valid() && i--)
				this.next_();
		};

		return instance;
	};



	/** *************************************************************************************************************** Iterator.extend
	* extend showoff as usual :)
	*/
	Iterator.extend({
		foreach : function(action){Iterator.foreach(this,action)}
	},true);
