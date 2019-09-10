
var gl;	//context
var screenAspect;
var canvas;

//mostly from view-source:http://learningwebgl.com/lessons/lesson01/index.html
function initGL(){
	try {
		gl = canvas.getContext("webgl",{antialias:true}) || canvas.getContext("experimental-webgl");
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

function getShader(gl, id) {
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

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function loadShader(vs_id,fs_id, obj) {
	var fragmentShader = getShader(gl, vs_id);		//TODO check whether shader already got
	var vertexShader = getShader(gl, fs_id);

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}

	shaderProgram.uniforms={};
	shaderProgram.attributes={};
	progUniforms = shaderProgram.uniforms;
	progAttributes = shaderProgram.attributes;
	
	obj.attributes.forEach(function(item, index){
		progAttributes[item] = gl.getAttribLocation(shaderProgram, item);
		//gl.enableVertexAttribArray(progAttributes[item]);	//now unnecessary since enabling and disabling when prepping buffers
	});														//avoiding issue of not drawing if enabled but nothing bound. alternative workaround maybe 
															//to bind a dummy thing to it.
	obj.uniforms.forEach(function(item, index){
		console.log("getting uniform location for " + item);
		progUniforms[item] = gl.getUniformLocation(shaderProgram, item);
	});

	return shaderProgram;
}