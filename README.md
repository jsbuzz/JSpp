JavaScript OOP extension
========================
### Key Features:
 + class inheritance
 + multiple ancestors
 + unlimited inheritance chain
 + fast built-in **instanceof** support
 + **short construction time** [less object merging and more **real inheritance**]
 + access all ancestors' methods with **this.super() function**
 + **supports private methods and properties** (e.g. var private=1)
 + easy and fast recursive class extension to all subclasses and all instances
 + supports all types of constructor functions
 + **readable syntax**


### If You like this code, You'll like js++

Find the full example code in demo.html

	var _DEBUG = true;

	/**
	* class ABX : B,X
	* -> B::constructor (b,a)
	* -> X::constructor (x)
	*/
	var ABX = 
		function(a,b,x){
			_DEBUG && console.info('ABX::constructor('+Array.prototype.join.call(arguments)+')');

			var myPrivate=a;

			return {
				publicFunction : function(x){console.info('ABX::publicFunction()');return this.super('B::publicFunction',x)+this.super('X::publicFunction')+this.getP()},
				getP : function(){return myPrivate},
				setP : function(p){myPrivate=p}
			};
		}.inherits({
			B : {class : B, params : "(a,b,x)=>B(b||0,a||0)"},
			X : {class : X, params : "(a,b,x)=>X(x||0)"}
		});