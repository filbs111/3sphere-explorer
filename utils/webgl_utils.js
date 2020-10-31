
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