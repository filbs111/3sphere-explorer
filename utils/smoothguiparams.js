
var smoothGuiParams = (function(){

	var lastTimeUpdate = Date.now();
	var store = {};

	return {
		add: function(key, obj, objKey){
			store[key] = {
				obj,
				objKey,
				val:obj[objKey]
			}
		},
		get: function(key){
			return store[key].val;
		},
		update: function(){
			var currentTime = Date.now();
			var elapsedTime = currentTime - lastTimeUpdate;

			lastTimeUpdate = currentTime;
			var multiplier = Math.exp(-0.01*elapsedTime);

            Object.keys(store).forEach(key => {
                var storedItem = store[key];    //TODO in less verbose/crap way. ES8 Object.values?
                storedItem.val = storedItem.val*multiplier + (1.0-multiplier)*storedItem.obj[storedItem.objKey];
            });
		}
	}
})();