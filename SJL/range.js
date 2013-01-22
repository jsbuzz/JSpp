	/** **************************************************************************************************************** ++ dependecies - Node.js ++
	* dependecies - Node.js
	*/
	if(typeof(require)=='function')
	{
		var Class = JSpp || require('JSpp');
		var ReversibleIterator = require('./iterators.js').ReversibleIterator;
	}

	/** **************************************************************************************************************** Range
	* class Range
	*/
	var Range = Class(function(min, max){
		if(!Class.instanceOf(min,Range.Item) || !Class.instanceOf(max,Range.Item))
			throw new TypeError('Range can be declared only by Range.Item instances');

		if(!min.less(max))
		{
			var t = min;
			min = max;
			max = t;
			this.flipped = true;
		}
		else
			this.flipped = false;

		this.min = min;
		this.max = max;

	}).extend({

		at : function(index){
			return this.min.create(this.min.index() + index);
		},

		contains : function(element){
			return (Class.instanceOf(element,Range.Item) || (element = this.min.instance(element))) && element.index() <= this.max.index() && element.index() >= this.min.index();
		},

		getIterator : function(){ return new RangeIterator(this)}
	});


	/** **************************************************************************************************************** Range.Item
	* abstract class Range.Item
	*/
	Range.Item = Class.interface(
		'index',
		'create'
	).extend({
		less : function(other) { return this.index() < other.index()},
		instance : function(element) { return new this.constructor(element)}
	}).extendStatic({
		range : function(min,max) { return new Range(new this(min),new this(max))}
	},true);


	//------------------------------------------------------------------------------------------------------------------ Range.Item.Integer
	Range.Item.Integer = function(n){
		this.number = n;
		this.index = Number.prototype.valueOf.bind(n);
		this.create = function(n){return n};
	}.inherits(Range.Item);


	//------------------------------------------------------------------------------------------------------------------ Range.Item.Char
	Range.Item.Char = function(c){
		this.char = c;
		this.index = function(){return this.char.charCodeAt(0)};
		this.create = String.fromCharCode;
	}.inherits(Range.Item);


	//------------------------------------------------------------------------------------------------------------------ Range.of...
	// short aliases for readibility
	Range.of = {
		Chars   : Range.Item.range.bind(Range.Item.Char),
		Numbers : Range.Item.range.bind(Range.Item.Integer)
	};



	/** **************************************************************************************************************** RangeIterator
	* class RangeIterator : ReversibleIterator
	*/
	var RangeIterator = function(range){

		// protected scope
		this.protected({
			target   : range,
			position : 0,
		});

		// Iterator methods
		this.getTarget = function(){ return this.protected.target; };
		this.rewind    = function(){ this.protected.position = this.protected.target.min.index(); return this; };
		this.reverse   = function(){ this.protected.position = this.protected.target.max.index(); return this; };
		this.current   = function(){ return this.protected.target.at(this.protected.position-this.protected.target.min.index()) };
		this.key       = function(){ return this.protected.position };
		this.previous  = function(){ this.protected.position--; return this; };
		this.next      = function(){ this.protected.position++; return this; };
		this.valid     = function(){ return this.protected.position>=this.protected.target.min.index() && this.protected.position<=this.protected.target.max.index() };		

		if(range.flipped)
			this.flip();
		this.rewind();
	
	}.inherits(ReversibleIterator);



	/** **************************************************************************************************************** ++ Node.js ++
	*/
	if(typeof(module)=='object')
	{
		module.exports = {
			Range         : Range,
			RangeIterator : RangeIterator
		};
	}
