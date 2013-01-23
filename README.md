JavaScript OOP extension
========================
### Key Features:
 + class inheritance
 + multiple ancestors
 + unlimited inheritance chain
 + works both in **browsers** and **Node.js**
 + fast built-in **instanceof** support
 + **short construction time** [less object merging and more **real inheritance**]
 + access all ancestors' methods with **this.super() function**
 + **supports private methods and properties** (e.g. var private=1)
 + easy and fast recursive class extension to all subclasses and all instances
 + supports all types of constructor functions
 + **readable syntax**


## If You like this code, You'll like js++

Find full examples in the demo folder

	var ReversibleIterator = Class.interface(
	//# abstract methods
		'previous',
		'reverse'
	)
	.extend({
	//# virtual methods
		last : function(){ return this.reverse().current() },
		flip : function(){
			...
		}
	})
	.inherits(Iterator);

Node.js example

	require('../JSpp/jspp.compressed.js');

	JSpp.load('SJL/iterators.js');
	JSpp.load('SJL/range.js');

	String.prototype.repeat = function( num )
	{
	    return new Array( num + 1 ).join( this );
	}

	var range = Range.of.Chars('A','z'),
		left  = Odd(Iterator.for(range)),
		right = Even(Iterator.for(range)),
		i = 0, 
		max = range.distance();

	while(left.valid() || right.valid())
	{
		if(left.valid())
		{
			console.info(' '.repeat(i)+left.current());
			left.next();
		}
		if(right.valid())
		{
			console.info(' '.repeat(max-i)+right.current());
			right.next();
		}
		i+=2;
	}
