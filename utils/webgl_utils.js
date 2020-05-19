
var gl;	//context
var screenAspect;
var canvas;

//mostly from view-source:http://learningwebgl.com/lessons/lesson01/index.html
function initGL(){
	try {
		gl = canvas.getContext("webgl",{antialias:false}) || canvas.getContext("experimental-webgl");
		resizecanvas();
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
	}
}
function resizecanvas(){
	var overResolutionFactor=1;	//main reason to cause bad perf to check optimisations. 6 is what it takes for bad framerate on gtx 1080!!
	var screenWidth = overResolutionFactor*window.innerWidth;
	var screenHeight = overResolutionFactor*window.innerHeight;
	if (canvas.width != screenWidth || canvas.height != screenHeight){
		canvas.width = screenWidth;
		canvas.height = screenHeight;
		gl.viewportWidth = screenWidth;
		gl.viewportHeight = screenHeight;	//?? need to set both these things?? 
	}
	screenAspect = gl.viewportWidth/gl.viewportHeight;
	
	canvas.style.width=window.innerWidth+"px";
	canvas.style.height=window.innerHeight+"px";
}

var gotShaderLog = "";
var totalShaderCompileTime = 0;
var shaderCache = {};

function getShader(gl, id, defines = []) {
	var idstring = id + ":" + defines.join(';');
		
	if (shaderCache[idstring]){	//in testing, saves ~8% of load shader time. (TODO does retaining shader cache cost much memory?)
		window.gotShaderLog+="------ " + idstring + "\n";
		return shaderCache[idstring];
	}
	
	var startTime =performance.now();
	
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		console.log("no shader script of id " + id);
		return null;
	}

	var str = defines.map(elem => "#define " + elem + "\n").join('') + shaderScript.text;
		
	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);
/*
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(id + ":" + gl.getShaderInfoLog(shader));
		return null;
	}
*/
	//^^ appears to force waiting for completion of compile etc - if don't call this, much faster (measured time, presumably continues to compile asynchronously)
	// todo defer calling get compile status.

	var thisCompileTime=performance.now()-startTime;
	window.gotShaderLog+= thisCompileTime.toFixed(2) + "ms " + idstring + "\n";
	
	shaderCache[idstring]=shader;
	return shader;
}

var shadersToGetLocationsFor = [];

function loadShader(vs_id,fs_id, vs_defines, fs_defines) {
	var startTime =performance.now();
	
	var fragmentShader = getShader(gl, vs_id, vs_defines);
	var vertexShader = getShader(gl, fs_id, fs_defines);

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	shadersToGetLocationsFor.push(shaderProgram);
	
	var thisCompileTime=performance.now()-startTime;
	window.gotShaderLog+= " => " + thisCompileTime.toFixed(2) + "ms\n";

	totalShaderCompileTime+=thisCompileTime;
	
//	gl.flush();
	
	return shaderProgram;
}

function getLocationsForShaders(){
	var startTime =performance.now();
	//to be called some time after loadShader, when hope (!!) that attach, link etc have completed, because if they haven't this will block for whatever amount of time.
	//TODO is there some property to query for shader to say whether compilation, linking complete?
	// (webgl shaders don't have proper async - why would they? it's not like that's the way everything is done on the web.)
	// https://stackoverflow.com/questions/51710067/webgl-async-operations
	//TODO some more bodging to call one at a time and check that it didn't take too long, so will only block waiting for 1 shader.
	for (var shaderProgram of shadersToGetLocationsFor){
		
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
		
		var numActiveUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
		if (numActiveUniforms>0){
			for (var uu=0;uu<numActiveUniforms;uu++){
				var uName = gl.getActiveUniform(shaderProgram,uu).name;
				shaderProgram.uniforms[uName] = gl.getUniformLocation(shaderProgram, uName);
			}
		}
	}
	
	var thisTime=performance.now()-startTime;
	window.gotShaderLog+= thisTime.toFixed(2) + " ms ATTRIBUTE GET\n";
}