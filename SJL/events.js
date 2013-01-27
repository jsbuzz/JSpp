

var EventHost = Class(function(object){
	// let's check if we are just called as a function
	if(typeof(this.instanceOf)!='function')
	{
		return instanceOf(object,EventHost) ? object : new EventHost(object);
	}

	// constructor part
	this._events = {
		handlers : {},
		managers : {}
	};

}).extend({
	catch : function(event,handler){
			this._events.handlers[event] || (this._events.handlers[event] = {});
			return new EventHost.EventCatch(this,event,handler);
		}
});

EventHost.EventCatch = function(target,event,handler,id,manager){
	id = (id===undefined ? ++EventHost.EventCatch.id : id);
	target._events.handlers[id] = handler;
	if(manager)
	{
		var oID = Object.id(manager);
		target._events.managers[oID] || (target._events.managers[oID] = {});
		target._events.managers[oID][event] || (target._events.managers[oID][event] = {});
		target._events.managers[oID][event][id] = handler;
	}
};
EventHost.EventCatch.id = Date.now();


var EventManager = Class(function(){});
