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

/** ******************************************************************************************************************* Class::constructor
* You can use this function to improve readibility of your code or to use multiple ancestors for a new class.
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


/** ******************************************************************************************************************* Class::_provideBasicFunctions
* Give basic js++ functionality to a function - and to its prototype
*/
Class._provideBasicFunctions = function(fn,_prototype,_bind){
	fn.extend || (fn.extend = _bind ? Class.extend.bind(_bind) : Class.extend);
	fn.extendStatic || (fn.extendStatic = _bind ? Class.extendStatic.bind(_bind) : Class.extendStatic);
	fn._params || (fn._params = Class._params);
	fn.applyTo = Class.applyTo;

	if(fn && _prototype)
	{
		if(typeof(fn.prototype)!='object')
			fn.prototype={};
			
		fn.prototype.scope = Class._scope;
		fn.prototype.protected = Class._protected;
		fn.prototype.instanceOf = Class.prototype.instanceOf;
		fn.prototype.super = Class.prototype.super;
	}
};


/** ******************************************************************************************************************* Class::_lastCreated
* garbage collector issue fix. We need a global scope for creating the inherited objects 
* otherwise the GC kills the object after the constructor finishes.
*/
Class._lastCreated = null;


/** ******************************************************************************************************************* Class::_applyConstructor
* this function applies the given constructor on the object. It also merges the return values and the prototypes.
*/
Class._applyConstructor = function(fn,obj,args,constructor){
	constructor.prototype || (constructor.prototype = {});
	for(var i in fn.prototype)
		constructor.prototype[i] = fn.prototype[i];
	var returnValues = fn.apply(obj,args); // return {...} type of constructor ready
	for(var i in returnValues)
	{
		if(typeof(returnValues[i])!=='undefined')
			obj[i] = returnValues[i];
	}
}


/** ******************************************************************************************************************* Class::_constructor
* This is the constructor replacement for derived classes. The function applies all the inherited constructors 
* on the object in the right order.
*/
Class._constructor = function(child,parents,constructor,paramChannels)
{
	var args = Array.prototype.slice.call(arguments,4);

	var paramMap = new Array(paramChannels.length+1);
	paramMap[paramChannels.length] = args;
	for(var i=paramChannels.length-1;i>=0;i--)
		paramMap[i] = paramChannels[i].apply(null,paramMap[paramChannels[i].parent]);

	child._caller._instance = new constructor;
	for(var i=0;i<parents.length;i++)
	{
		child._caller._instance.constructor = child._caller._constructors[i]._caller || child._caller._constructors[i];
		Class._applyConstructor(parents[i],child._caller._instance,paramMap[i],constructor);
	}
	child._caller._instance.constructor = child._caller;
	Class._applyConstructor(child,child._caller._instance,args,constructor);

	return child._caller._instance;
}



/** ******************************************************************************************************************* Class::applyTo
* under construction :)
*/
Class.applyTo = function(object)
{
	var args = Array.prototype.slice.call(arguments,1),
	    paramChannels = this._paramChannels || [],
		constructor = object.constructor || this;

	var paramMap = new Array(paramChannels.length+1);
	paramMap[paramChannels.length] = args;
	for(var i=paramChannels.length-1;i>=0;i--)
		paramMap[i] = paramChannels[i].apply(null,paramMap[paramChannels[i].parent]);

	for(var i=0;i < this._constructors.length;i++)
	{
		object.constructor = this._constructors[i]._caller || this._constructors[i];
		Class._applyConstructor(this._constructors[i],object,paramMap[i],constructor);
	}
	object.constructor = constructor;

	return object;
}


/** ******************************************************************************************************************* Class::_scope
* This is a useful method to add/extend custom scopes to your class to separate submodules
*/
Class._scope = function(scope,addendum){
	var me = this;
	me[scope] || (me[scope] = {});

	for(var p in addendum)
		me[scope][p] = scope[p];

	return me[scope];
};


/** ******************************************************************************************************************* Class::_protected
* The protected scope is the container for those properties/methods which need to be inheritable but shouldn't be
* reachable as object.property - they are still reachable but only by typing object.protected.property
* Using the protected scope is improves your code's readability and consistency
*/
Class._protected = function(scope){
	if(this.protected == Class._protected)
		this.protected = Class._protected.bind(this);

	for(var p in scope)
		this.protected[p] = scope[p];

	return this.protected;
};




/** ******************************************************************************************************************* Class::_inherits
* This method links the child and parent classes in the inheritance chain and provides inheritance of the static
* properties/methods
*/
Class._inherits = function(child,parent)
{
	(parent._childClasses || (parent._childClasses=[])).push(child);
	(child._ancestors || (child._ancestors=[])).push(parent);

	for(var i in parent._static)
	{
		child[i] = parent[i];
		(child._static || (child._static = {})) && (child._static[i] = i);
	}
}


/** ******************************************************************************************************************* Class.prototype::super
* access to the super class' methods (only the methods not the properties!)
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

		this.constructor._supers[i]._instance || (this.constructor._supers[i]._instance = new this.constructor._supers[i]);
		
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



/** ******************************************************************************************************************* Class::instanceOf and Class.prototype::instanceOf
* This is the replacement for the native instanceof operator.
*/
Class.instanceOf = function(child,parent){return Class.prototype.instanceOf.call(child,parent)};
Class.prototype.instanceOf = function(parent){

	if(this instanceof parent || this.constructor===parent)
		return true;

	if(!this.constructor._constructors)
		return false;

	var constructors = parent._constructors || [parent];

	j = 0;
	for(var i=0;i<this.constructor._constructors.length;i++)
	{
		if(this.constructor._constructors[i]==constructors[j])
		{
			if(++j>=constructors.length)
				return true;
		}else if(j)
			return false;
	}

	return true;
};



/** ******************************************************************************************************************* Class::extend
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


/** ******************************************************************************************************************* Class::extendStatic
* This method is for extending the class itself.
* Use the recursive option to apply the extension on every derived class and make the contents 
* of the addendum inheritable.
*/
Class.extendStatic = function(addendum,recursive){

	for (var i in addendum)
	{
		this[i] = addendum[i];
		if(recursive)
			(this._static || (this._static = {})) && (this._static[i] = i);
	}

	if(recursive)
	{
		for (var i in this._childClasses)
		{
			this._childClasses[i].extendStatic(addendum,true);
		}
	}

	return this;
};



/**********************************************************************************************************************
* Function.prototype - extension to all functions
*/


/** ******************************************************************************************************************* Function.prototype.derived
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

	var constructors = this._constructors || [this];
	var DerivedClass = function(){};

	paramChannel = paramQuery ? Class._paramQuery(paramQuery) : Class._paramQuery.proxy.bind(this);
	var paramChannels = (this._paramChannels || []).concat([paramChannel]);
	paramChannel.parent = paramChannels.length;

	var t = Class._constructor.bind(childConstructor,childConstructor,constructors,DerivedClass,paramChannels);

	childConstructor._caller = t;
	t._supers = [this];
	Class._provideBasicFunctions(t,false,t);
	t._constructors = constructors.concat([childConstructor]);
	t._prototype = DerivedClass;
	t._prototype.prototype = this._prototype && this._prototype.prototype || {};
	t._paramChannels = paramChannels; // avoid GC delete

	Class._inherits(t,this);

	return t;
}


/** ******************************************************************************************************************* Function.prototype.inherits
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


		var paramChannels = (this._paramChannels || []),
			constructors = [],
			pChannels = paramChannel ? paramChannel : Array.prototype.slice.call(arguments,1),
			prototype = {};

		for(var i=0;i<parents.length;i++)
		{
			constructors = constructors.concat(typeof(parents[i]._constructors)!='undefined' ? parents[i]._constructors : [parents[i]]);
			Class._provideBasicFunctions(parents[i],true);
			paramChannels = paramChannels.concat(parents[i]._paramChannels || []).concat([null]);
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


		var MultiDerivedClass = function _MultiDerivedClass(){};
		var t = Class._constructor.bind(this,this,constructors,MultiDerivedClass,paramChannels);

		Class._provideBasicFunctions(t,false,t);
		
		this._caller = t;
		t._supers = parents;
		t._classNames = classNames;

		t._constructors = constructors.concat([this]);
		t._prototype = MultiDerivedClass;
		t._prototype.prototype = prototype;
		t._paramChannels = paramChannels; // avoid GC delete

		for(var i=0;i<parents.length;i++)
			Class._inherits(t,parents[i]);

		return t;
	}
	else if(typeof(parents)=='function')
		return parents.derived(this,paramQuery);
};





/** ******************************************************************************************************************* param handling
* These tools are made for the readable and smart parameter passing
*/
Class._paramQuery = function(query){

	if(typeof(query)=='function')
		return query;
	
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
	return eval("(function"+query[0]+"{return ["+query[1].substring(query[1].indexOf('(')+1,query[1].lastIndexOf(')'))+"];})");
};

/**
* This is the default paramChannel which is transparent to parameters
*/
Class._paramQuery.proxy = function(){return Array.prototype.slice.call(arguments)};

/**
* This is the paramsFrom .to* syntax handler. Sometimes it is more readable than the paramQueries
*/
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


/** ******************************************************************************************************************* Class.interface
* This toolkit is for creating interfaces - abstract method packages for modelling a functionality
*/
Class.interface = function(){

	var implementation = '';

	for(var i=0;i<arguments.length;i++)
	{
		implementation += 'this.'+arguments[i]+'=function(){throw new Error("Interface method '+arguments[i]+'() is not implemented!")};\n';
	}
	Class._lastCreated = new Function(implementation);
	Class._lastCreated._methods = Array.prototype.slice.call(arguments);
	Class._lastCreated.check = Class.interface.check.bind(Class._lastCreated);

	Class._provideBasicFunctions(Class._lastCreated,true);

	return Class._lastCreated;
};


/** ******************************************************************************************************************* Class.interface.check
* This tool is for checking an interface if all its methods are implemented.
*/
Class.interface.check = function(throwException){
	var methods = {},
	    model = new this;

	for(var i in this._methods)
		methods[this._methods[i]] = model[this._methods[i]];

	for(var c=0;c < this._childClasses.length;c++)
	{
		this._childClasses[c]._instance || (this._childClasses[c]._instance = new this._childClasses[c]);
		for(var method in methods)
		{
			if(this._childClasses[c]._instance[method].toString()==methods[method].toString())
			{
				if(throwException)
					model[method]();
				return false;
			}
		}
	}
	return true;
}
