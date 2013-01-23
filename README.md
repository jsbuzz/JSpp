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