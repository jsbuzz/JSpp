
		var Smooth = function(action,timeout){
			this.timeout = timeout || 300;
			this.action = action;
			this.start = function(){this.stop();this.timer = window.setTimeout(this.action,this.timeout)};
			this.stop  = function(){window.clearTimeout(this.timer)};
		}


//-------------------
$$('.wordTyper').install(WordTyper,{events:true,typeTimeout:400});

$('#searchBox').events
	.listen("WordTyper.wordFinished")
	.handler = function(e){
		console.info(e.word);
	};
//-------------------

var WordTyper = function(){

	this.uninstall = function(element) {
		delete this.$(element).cache; // Component
		this.detachEvents(element); // inherited from EventHandler
	};
}.inherits({
	Component    : {class : DOM.Component, params : '()=>Component("WordTyper")'},
	EventHandler : {class : DOM.EventHandler, params : '()=>EventHandler(WordTyper.Events)'}
}).ready([ // new instance ready event
	EventHandler.ready
]);

WordTyper.Events = ["!WordTyper.wordFinished","!WordTyper.wordStarted","WordTyper.wordChanged"];


var Component = function(name){

	this.protected({
		name : name
	});

	this.abstract(
		'install',
		'uninstall',
		'init',
		'enable',
		'disable'
	);

	this.$ = function(element){ // element specific data
		return element.data[this.protected.name] || (element.data[this.protected.name]={});
	};
};



var EventHandler = function(){

	this.protected({
		events : Array.prototype.slice.call(arguments),
		autoEvents : {}
	});

	this.EventHandler_ready = function(){ // well-well, I am not so sure about this.
		for(var e in this.protected.events)
		{
			if(e.charAt(0)=='!') // autoTrigger
			{
				this.protected.autoEvents[e.substr(1)] = Callback((this)[e.substr(1)]);
				delete this.protected.events[e];
			}
		}
	}
}.ready(function(){this.EventHandler_ready()});
