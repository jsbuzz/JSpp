
	var Range = function(min, max, step){
		this.min = min;
		this.max = max;
		this.direction = min.less(max) ? 1 : -1;
		this.step = typeof(step)=='function' ? step : function(i){return i + (min.less(max) ? 1 : -1) * (step || 1)};

		this.defaultStep = typeof(step)!='function';

		this.at = function(index){
			var min;
			if(this.defaultStep)
				return (min = this.direction ? this.min : this.max).create(min.index() + index);

			var current = this.min.index();
			for(var i = 0; i < index; i++)
				current = this.step(current);
			return this.min.create(current);
		};
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