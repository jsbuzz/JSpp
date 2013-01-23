require('../jspp.compressed.js');

JSpp.load('SJL/iterators.js');
JSpp.load('SJL/range.js');

String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

Iterator.for([1,2,3]).foreach(function(it,n){
	console.info(' '.repeat(n)+this);
});


foreach(
	Odd( Reverse( Iterator.for( Range.of.Chars('z','a')))),
	function(it,n){
		console.info(' '.repeat(n)+this);
	});
