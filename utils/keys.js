
var keyThing = (function myKeysStatesThing(){
	var keyStates=[];
	var keydownCallbackFunctions=[];
	
	document.addEventListener("keydown", function(evt){
		evt.preventDefault();
		var k = evt.keyCode;
		keyStates[k]=true;
		if (keydownCallbackFunctions[k]){keydownCallbackFunctions[k]();}
	});
	document.addEventListener("keyup", function(evt){
		evt.preventDefault();
		keyStates[evt.keyCode]=false;
	});

	//all keys switch off when lose focus - effectively this is releasing keys
	window.onblur = function(){
		console.log("detected lost focus. setting all keystates to false");
		Object.keys(keyStates).forEach(function(ii){
			console.log("setting key off : " + ii);
			keyStates[ii]=false;
		})
	}
	window.oncontextmenu = window.onblur;
	
	return {
		keystate: function(e){ return keyStates[e]?1:0;},
		spaceKey: function(){ return keyStates[32]?1:0;},
		returnKey: function(){ return keyStates[13]?1:0;},
		leftKey: function(){ return keyStates[37]?1:0;},
		rightKey: function(){ return keyStates[39]?1:0;},
		upKey: function(){ return keyStates[38]?1:0;},
		downKey: function(){ return keyStates[40]?1:0;},
		//bombKey: function(){ return this.downKey();}, 
		bombKey: function(){ return keyStates[17]?1:0;}, 	//controlkey
		setKeydownCallback: function(e,f) {keydownCallbackFunctions[e] = f;}
	};
})();

