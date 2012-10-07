JavaScript OOP extension: js++
==============================

## If You like this syntax, You'll like js++

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
	}).extend({
		showMe : function(x){console.info(this)}
	});