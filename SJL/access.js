
 
var Callback = function(method,object,fixedArgs){
	object = object || this;
	fixedArgs = fixedArgs || [];

	var callback = function(){return method.apply(object,fixedArgs.concat(Array.prototype.slice.call(arguments)))};

	callback.object = object;
	callback.method = method;
	callback.fixedArgs = fixedArgs;
	
	callback.asFunction = function(){return Function.prototype.bind.apply(this.method,[this.object].concat(this.fixedArgs))};
	callback.fire = function(){
		return this.method.apply(this.object,this.fixedArgs.concat(Array.prototype.slice.call(arguments)))
	};

	return callback;
};

 
// -> {object : ->this,method : loadchannel, arguments : [1,2,3]}


	/** *************************************************************************************************************** $AccessModel
	* $AccessModel class
	*/
	var $AccessModel = function(){

		this.$ = function(access,set)
		{
			var me = this;
			if(typeof(me[access])!='undefined')
				return set===undefined ? me[access] : (me[access]=set);
			if(typeof(me.protected[access])!='undefined')
				return set===undefined ? me.protected[access] : (me.protected[access]=set);
			
			throw new Error('$ Access to undefined property: '+access);
		};

		this.$$ = function(query){
			var varName = query,
			    operatorPos = query.length,
					me = this;
			
			for(var i=0;i<query.length;i++)
			{
				if(!query.charAt(i).match(/\w/))
				{
					varName=varName.substr(0,i);
					operatorPos=i;
					break;
				}
			}
			if(typeof(me[varName])!='undefined')
				varName = 'this.'+varName;
			else if(typeof(me.protected[varName])!='undefined')
				varName = 'this.protected.'+varName;
			else
				throw new Error('$$ Access to undefined property: '+varName);

			return eval('('+varName+query.substr(operatorPos)+')');
		};

	};