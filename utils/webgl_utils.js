
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

function getShader(gl, id) {
	if (shaderCache[id]){	//in testing, saves ~8% of load shader time. (TODO does retaining shader cache cost much memory?)
		window.gotShaderLog+="------ " + id + "\n";
		return shaderCache[id];
	}
	
	var startTime =performance.now();
	
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = shaderScript.text;

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
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
*/
	//^^ appears to force waiting for completion of compile etc - if don't call this, much faster (measured time, presumably continues to compile asynchronously)
	// todo defer calling get compile status.

	var thisCompileTime=performance.now()-startTime;
	window.gotShaderLog+= thisCompileTime.toFixed(2) + "ms " + id + "\n";
	
	shaderCache[id]=shader;
	return shader;
}

var shadersToGetLocationsFor = [];

function loadShader(vs_id,fs_id, obj) {
	var startTime =performance.now();
	
	var fragmentShader = getShader(gl, vs_id);
	var vertexShader = getShader(gl, fs_id);

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	obj.prog = shaderProgram;
	shadersToGetLocationsFor.push(obj);
	
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
	var shaderProgram;
	for (var obj of shadersToGetLocationsFor){
		shaderProgram = obj.prog;
		
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}
		
		shaderProgram.uniforms={};
		shaderProgram.attributes={};
		
		obj.attributes.forEach(function(item, index){
			shaderProgram.attributes[item] = gl.getAttribLocation(shaderProgram, item);
			//gl.enableVertexAttribArray(progAttributes[item]);	//now unnecessary since enabling and disabling when prepping buffers
		});														//avoiding issue of not drawing if enabled but nothing bound. alternative workaround maybe 
																//to bind a dummy thing to it.
		obj.uniforms.forEach(function(item, index){
			//console.log("getting uniform location for " + item);
			shaderProgram.uniforms[item] = gl.getUniformLocation(shaderProgram, item);
		});
	}
	
	var thisTime=performance.now()-startTime;
	window.gotShaderLog+= thisTime.toFixed(2) + " ms ATTRIBUTE GET\n";
}