var getShaderFilePromise = (function(){
	var timestamp = Date.now();	//ensure getting up to date shaders. TODO use revision number instead,
	var fetchFilePromises = {};		//duplicate fetch requests expect should hit browser cache, but to be sure, just cache promises
	return function(id){
		//check for an existing promise
		fetchFilePromises[id] = fetchFilePromises[id] || 
			fetch("shaders/" + id+".glsl?cache-bust=" + timestamp).then(r=>r.text());
		return fetchFilePromises[id];
	}
})();

var getShaderUsingPromises = (function(){
	//just single file, but with defines
	var compileShaderPromises = {};

	return function(gl, id, shaderType, defines = []){	//TODO infer shaderType from -fs / -vs
		var idstring = id + ":" + defines.join(';');
		compileShaderPromises[idstring] = compileShaderPromises[idstring] || 
			getShaderFilePromise(id).then(shaderText=>{
				var str = defines.map(elem => "#define " + elem + "\n").join('') + shaderText;
				//console.log("got shader using promises!");
				//console.log(str);
				var shader = gl.createShader(shaderType);
				//console.log({shader});
				gl.shaderSource(shader, str);
				gl.compileShader(shader);

				/*
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					alert(id + ":" + gl.getShaderInfoLog(shader));
					return null;
				}
				*/
				//appears to force waiting for completion of compile etc.
				//if don't call this, much faster (measured time, presumably continues to compile asynchronously)
				//TODO defer calling get compile status.

				return shader;
			});
		return compileShaderPromises[idstring];
	}
})();

//example usage: getShaderUsingPromises(gl,"fullscreen-fs", gl.FRAGMENT_SHADER, ["CUSTOM_DEPTH"]);

var shadersToGetLocationsForPromises = [];

function loadShader(vs_id,fs_id, vs_defines, fs_defines) {
	var shaderProgram = gl.createProgram();
	var vertShader = getShaderUsingPromises(gl,vs_id,gl.VERTEX_SHADER,vs_defines);
	var fragShader = getShaderUsingPromises(gl,fs_id,gl.FRAGMENT_SHADER,fs_defines);
	shadersToGetLocationsForPromises.push( Promise.all([vertShader,fragShader]).then(values=>{
		console.log("promise all returning");
		//console.log(values);
		var vertexShader = values[0];	//TODO deconstructing assignment
		var fragmentShader = values[1];
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
		return shaderProgram; 
	}));
	return shaderProgram;
}

function getLocationsForShadersUsingPromises(cb){
	//to be called some time after loadShader, when hope (!!) that attach, link etc have completed, because if they haven't this will block for whatever amount of time.
	//TODO is there some property to query for shader to say whether compilation, linking complete?
	// (webgl shaders don't have proper async - why would they? it's not like that's the way everything is done on the web.)
	// https://stackoverflow.com/questions/51710067/webgl-async-operations
	//TODO some more bodging to call one at a time and check that it didn't take too long, so will only block waiting for 1 shader.

	//for (var shaderProgramPromise of shadersToGetLocationsForPromises){
	Promise.all(shadersToGetLocationsForPromises.map(shaderProgramPromise=>{
		return shaderProgramPromise.then(shaderProgram=>{
			if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
				alert("Could not initialise shaders");
			}
			
			shaderProgram.uniforms={};
			shaderProgram.attributes={};
			
			var numActiveAttribs = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
			if (numActiveAttribs>0){
				for (var aa=0;aa<numActiveAttribs;aa++){
					var aName = gl.getActiveAttrib(shaderProgram,aa).name;
					shaderProgram.attributes[aName] = gl.getAttribLocation(shaderProgram, aName);
				}
			}
			shaderProgram.numActiveAttribs = numActiveAttribs;
			
			var numActiveUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
			if (numActiveUniforms>0){
				for (var uu=0;uu<numActiveUniforms;uu++){
					var uName = gl.getActiveUniform(shaderProgram,uu).name;
					shaderProgram.uniforms[uName] = gl.getUniformLocation(shaderProgram, uName);
				}
			}
		});
	})).then(()=>{cb()});
}