
	var Range = function(min, max){
		if(!Class.instanceOf(min,Range.Item) || !Class.instanceOf(max,Range.Item))
			throw new TypeError('Range can be declared only by Range.Item instances');

		this.min = min;
		this.max = max;

		this.at = function(index){
			return this.min.create(min.index() + index);
		};

		//this.
	};


	Range.Item = Class.interface(
		'index',
		'create'
	).extend({
		less : function(other) { return this.index() < other.index()}
	}).extendStatic({
		range : function(min,max) { return new Range(new this(min),new this(max))}
	},true);


	Range.Item.Integer = function(n){
		this.number = n;
		this.index = Number.prototype.valueOf.bind(n);
		this.create = function(n){return n};
	}.inherits(Range.Item);


	Range.Item.Char = function(c){
		this.char = c;
		this.index = function(){return this.char.charCodeAt(0)};
		this.create = String.fromCharCode;
	}.inherits(Range.Item);



	/** **************************************************************************************************************** ArrayIterator
	* class RangeIterator : ReversibleIterator
	*/
	var RangeIterator = function(range){

		// protected scope
		this.protected({
			target   : range,
			position : 0,
		});

		// Iterator methods
		this.rewind    = function(){ this.protected.position = this.protected.target.min.index(); return this; };
		this.reverse   = function(){ this.protected.position = this.protected.target.max.index(); return this; };
		this.current   = function(){ return this.protected.target.at(this.protected.position) };
		this.key       = function(){ return this.protected.position };
		this.previous  = function(){ this.protected.position--; return this; };
		this.next      = function(){ this.protected.position++; return this; };
		this.valid     = function(){ return this.protected.position>=0 && this.protected.position<this.protected.target.length };		

		this.protected.position = this.protected.target.min.index();
	}.inherits(ReversibleIterator);