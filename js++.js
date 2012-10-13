/**
 * js++ 1.0 [2012.10.07.]
 *
 * JavaScript OOP extension
 * Key Features:
 *	- class inheritance
 *	- multiple ancestors
 * 	- unlimited inheritance chain
 *	- fast built-in instanceof support
 *	- short construction time - less object merging more real inheritance
 *	- access all ancestors methods via this.super() function
 *	- supports private methods and properties (e.g. var private=1)
 *	- easy and fast recursive class extension to all subclasses and all instances
 *	- supports all types of constructor functions
 *	- readable syntax
 *
 * @author Matyas Buczko matyas.buczko@gmail.com
 */


/********************************************************************************************************************
* Class - basic functionality
*/

/** ***************************************************************************************************************** Class::constructor
* You can use this function to improve readibility of your code or to use multiple ancestors for a new class.
* e.g.: 
*		var A = Class(function(){
*			...
*		});
*
*	// simple inheritance
*		var B = Class(A).derived(function(){
*			...
*		});
*
*	// multiple inheritance
*		var C = Class([A,B]).derived(function(){
*			...
*		});
*/
var Class = function(fn){
	if(typeof(fn)== 'function')
	{
		Class._provideBasicFunctions(fn,true);
		return fn;
	}else if(typeof(fn)=='object' && typeof(fn.length)=='number'){
		var t = function(){};
		t._isWrapper = fn;
		return t;
	}
};


/** ***************************************************************************************************************** Class::_provideBasicFunctions
* Give OOP functionality to a function - and to its prototype
*/
Class._provideBasicFunctions = function(fn,_prototype,_bind){
	fn.extend || (fn.extend = _bind ? Class.extend.bind(_bind) : Class.extend);
	fn.extendStatic || (fn.extendStatic = _bind ? Class.extendStatic.bind(_bind) : Class.extendStatic);
	fn._params || (fn._params = Class._params);

	if(fn && _prototype)
	{
		if(typeof(fn.prototype)!='object')
			fn.prototype={};
			
		fn.prototype.instanceOf = Class.prototype.instanceOf;
		fn.prototype.super = Class.prototype.super;
	}
};


/** ***************************************************************************************************************** Class::_lastCreated
* garbage collector issue fix. We need a global scope for creating the inherited objects 
* otherwise the GC kills the object after the constructor finishes.
*/
Class._lastCreated = null;


/** ***************************************************************************************************************** Class::_applyConstructor
* this function applies the given constructor on the object. It also merges the return values and the prototypes.
*/
Class._applyConstructor = function(fn,obj,args,constructor){
	constructor.prototype || (constructor.prototype = {});
	for(var i in fn.prototype)
		constructor.prototype[i] = fn.prototype[i];
	var returnValues = fn.apply(obj,args); // return {...} type of constructor ready :)
	for(var i in returnValues)
	{
		if(typeof(returnValues[i])!=='undefined')
			obj[i] = returnValues[i];
	}
}


/** ***************************************************************************************************************** Class::_constructor
* This is the constructor replacement for inherited objects. The function applies all the inherited constructors 
* on the object in the right order.
*/
Class._constructor = function(child,parents,constructor,paramChannels)
{
	var args = Array.prototype.slice.call(arguments,4);

	var paramMap = new Array(paramChannels.length+1);
	paramMap[paramChannels.length] = args;
	for(var i=paramChannels.length-1;i>=0;i--)
		paramMap[i] = paramChannels[i].apply(null,paramMap[paramChannels[i].parent]);

	Class._lastCreated = new constructor;
	for(var i=0;i<parents.length;i++)
	{
		Class._lastCreated.constructor = child._caller.constructors[i]._caller || child._caller.constructors[i];
		Class._applyConstructor(parents[i],Class._lastCreated,paramMap[i],constructor);
	}
	Class._lastCreated.constructor = child._caller;
	Class._applyConstructor(child,Class._lastCreated,args,constructor);

	return Class._lastCreated;
}


/** ***************************************************************************************************************** Class::_inherits
* This method links the child and parent classes in the inheritance chain.
*/
Class._inherits = function(child,parent)
{
	(parent._childClasses || (parent._childClasses=[])).push(child);
	(child._ancestors || (child._ancestors=[])).push(parent);
}


/** ***************************************************************************************************************** Class.prototype::super
* access to the super class' methods
*/
Class.prototype.super = function()
{
	if(!this.constructor._supers)
		throw new Error("I have no superclass!");
	
	// Interpret the 'Class::method' nice format
	var t,parentClass = false;
	if(typeof(arguments[0])=='string' && (t=arguments[0].split('::')).length > 1)
	{
		arguments[0] = t[1];

		if(!this.constructor._classNames || typeof(parentClass = this.constructor._classNames[t[0]])=='undefined')
			throw new Error("superclass '"+t[0]+"' not found");
	}
		
	for(var i=0; i <  this.constructor._supers.length; i++)
	{
		if(parentClass!==false)
			i = parentClass;

		// ! creating the superinstance can divert the Class._lastCreated reference !
		t = Class._lastCreated; // << so save it
		// do the construction :
		this.constructor._supers[i]._instance || (this.constructor._supers[i]._instance = new this.constructor._supers[i]);
		Class._lastCreated = t; // << and place it back where it should point
		
		if(arguments.length)
		{
			var fn = arguments[0],args = Array.prototype.slice.call(arguments,1);
			if(typeof(this.constructor._supers[i])!=='undefined' && typeof(fn = this.constructor._supers[i]._instance[fn])=='function' || typeof(this.constructor._supers[i]._prototype)!=='undefined' && typeof(fn = this.constructor._supers[i]._prototype.prototype[fn])=='function')
			{
				var savedConstructor = this.constructor;
				this.constructor = this.constructor._supers[i]; // step up in hierarchy
				var returnValue = fn.apply(this,args);
				this.constructor = savedConstructor; // step back
				return returnValue;
			}
		}
		else
			return this.constructor._supers[i]._instance; // direct access... Do I really want it? It returns with the first one

		if(parentClass!==false)
			return false;
	}
	return false;
};



/** ***************************************************************************************************************** Class::instanceOf and Class.prototype::instanceOf
* This is the replacement for the JS instanceof operator.
*/
Class.instanceOf = function(child,parent){return Class.prototype.instanceOf.call(child,parent)};
Class.prototype.instanceOf = function(parent){

	if(this instanceof parent || this.constructor===parent)
		return true;

	if(!this.constructor.constructors)
		return false;

	var constructors = parent.constructors || [parent];

	j = 0;
	for(var i=0;i<this.constructor.constructors.length;i++)
	{
		if(this.constructor.constructors[i]==constructors[j])
		{
			if(++j>=constructors.length)
				return true;
		}else if(j)
			return false;
	}

	return true;
};



/** ***************************************************************************************************************** Class::extend
* This method is for extending all instances of a class on the fly.
* Use the recursive option to apply the extension on every derived class' instance as well.
*/
Class.extend = function(addendum,recursive){
	var constructor = (typeof(this._prototype)=='undefined' ? this : this._prototype);

	for (var i in addendum)
		constructor.prototype[i] = addendum[i];

	if(recursive)
	{
		for (var i in this._childClasses)
			this._childClasses[i].extend(addendum,true);
	}

	return this;
};


/** ***************************************************************************************************************** Class::extendStatic
* This method is for extending the class itself.
* Use the recursive option to apply the extension on every derived class.
*/
Class.extendStatic = function(addendum,recursive){

	for (var i in addendum)
		this[i] = addendum[i];

	if(recursive)
	{
		for (var i in this._childClasses)
			this._childClasses[i].extendStatic(addendum,true);
	}

	return this;
};



/********************************************************************************************************************
* Function.prototype - extension to all functions
*/


/** ***************************************************************************************************************** Function.prototype.derived
* This way any function can be the ancestor of others.
* fixedParams is used to call the ancestor's cosntructor with predefined parameters. 
* This way you can specialize thru inheritance.
*/
Function.prototype.derived = function(childConstructor,paramQuery){

	if(this._isWrapper)
	{
		return childConstructor.inherits(this._isWrapper,paramQuery);
	}

	Class._provideBasicFunctions(this,true);

	var constructors = this.constructors || [this];
	var DerivedClass = function(){};

	paramChannel = paramQuery ? Class._paramQuery(paramQuery) : Class._paramQuery.proxy.bind(this);
	var paramChannels = (this.paramChannels || []).concat([paramChannel]);
	paramChannel.parent = paramChannels.length;

	var t = Class._constructor.bind(childConstructor,childConstructor,constructors,DerivedClass,paramChannels);

	childConstructor._caller = t;
	t._supers = [this];
	Class._provideBasicFunctions(t,false,t);
	t.constructors = constructors.concat([childConstructor]);
	t._prototype = DerivedClass;
	t._prototype.prototype = this._prototype && this._prototype.prototype || {};
	t.paramChannels = paramChannels; // avoid GC delete

	Class._inherits(t,this);

	return t;
}


/** ***************************************************************************************************************** Function.prototype.inherits
* The same as derived, but from the other side
*/
Function.prototype.inherits = function(parents,paramQuery)
{
	parents = parents || Class;
	if(typeof(parents)=='object')
	{
		var classNames = {},
			paramChannel = [];

		// convert the readable format to array format
		if(typeof(parents.length)=='undefined')
		{
			var i=0,arrayVersion = [];

			for(var className in parents)
			{
				arrayVersion.push(parents[className]['class']);
				paramChannel.push(Class._paramQuery(parents[className].params) || false)
				classNames[className] = i++;
			}
			parents = arrayVersion;
		}


		var paramChannels = (this.paramChannels || []),
			constructors = [],
			pChannels = paramChannel ? paramChannel : Array.prototype.slice.call(arguments,1),
			prototype = {};

		for(var i=0;i<parents.length;i++)
		{
			constructors = constructors.concat(typeof(parents[i].constructors)!='undefined' ? parents[i].constructors : [parents[i]]);
			Class._provideBasicFunctions(parents[i],true);
			paramChannels = paramChannels.concat(parents[i].paramChannels || []).concat([null]);
			if(parents[i]._prototype && parents[i]._prototype.prototype)
			for(var p in parents[i]._prototype.prototype)
				prototype[p] = parents[i]._prototype.prototype[p];
		}
		
		var channelIndex = 0;
		for(var i=0;i<paramChannels.length;i++)
		{
			if(paramChannels[i]===null)
			{
				paramChannels[i] = pChannels[channelIndex++] || Class._paramQuery.proxy.bind(this);
				paramChannels[i].parent = paramChannels.length;
			}
		}


		var MultiDerivedClass = function(){};
		var t = Class._constructor.bind(this,this,constructors,MultiDerivedClass,paramChannels);

		Class._provideBasicFunctions(t,false,t);
		
		this._caller = t;
		t._supers = parents;
		t._classNames = classNames;

		t.constructors = constructors.concat([this]);
		t._prototype = MultiDerivedClass;
		t._prototype.prototype = prototype;
		t.paramChannels = paramChannels; // avoid GC delete

		for(var i=0;i<parents.length;i++)
			Class._inherits(t,parents[i]);

		return t;
	}
	else if(typeof(parents)=='function')
		return parents.derived(this,paramQuery);
};





/** ***************************************************************************************************************** param handling
* These tools are made for the readable and smart parameter passing
*/
Class._paramQuery = function(query){

	function trim(str)
	{
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	}

	if(typeof(query)=='object' && query.paramsFrom)
	{
		query = '('+query.paramsFrom+')=>('+query.map.join()+')';
	}

	query = trim(query).split("=>");
	if(query.length==1)
	{
		query[1] = query[0];
		query[0] = "()";
	}else if(!trim(query[0]).length)
		query[0] = "()";

	query[1] = trim(query[1]);
	var tmp;
	eval("tmp = function"+query[0]+"{return ["+query[1].substring(query[1].indexOf('(')+1,query[1].lastIndexOf(')'))+"];}");
	return tmp;
};

Class._paramQuery.proxy = function(){return Array.prototype.slice.call(arguments)};

Class.paramsFrom = function(paramList){
	return {
		paramsFrom: paramList,
		map : [],
		to: function(param){
			this.map.push(typeof(param)=='object' ? JSON.stringify(param) : param);
			return this;
		}
	};
}