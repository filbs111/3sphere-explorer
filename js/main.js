var shaderProgramColored,
	shaderProgramColoredPerVertex,
	shaderProgramColoredPerPixel,
	shaderProgramColoredPerPixelDiscard,
	shaderProgramTexmap,
	shaderProgramTexmapPerVertex,
	shaderProgramTexmapPerPixel,
	shaderProgramTexmapPerPixelDiscard,
	shaderProgramTexmap4Vec,
	shaderProgramCubemap,
	shaderProgramVertprojCubemap;
function initShaders(){				
	shaderProgramColoredPerVertex = loadShader( "shader-simple-vs", "shader-simple-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uColor","uFogColor", "uModelScale"]
					});
	shaderProgramColoredPerPixel = loadShader( "shader-perpixel-vs", "shader-perpixel-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uColor","uFogColor", "uModelScale"]
					});
	shaderProgramColoredPerPixelDiscard = loadShader( "shader-perpixel-discard-vs", "shader-perpixel-discard-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uColor","uFogColor", "uModelScale","uReflectorPos","uReflectorCos"]
					});				
	
	shaderProgramTexmapPerVertex = loadShader( "shader-texmap-vs", "shader-texmap-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uModelScale"]
					});
	shaderProgramTexmapPerPixel = loadShader( "shader-texmap-perpixel-vs", "shader-texmap-perpixel-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uModelScale"]
					});
	shaderProgramTexmapPerPixelDiscard = loadShader( "shader-texmap-perpixel-discard-vs", "shader-texmap-perpixel-discard-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uModelScale","uReflectorPos","uReflectorCos"]
					});
					
	shaderProgramTexmap4Vec = loadShader( "shader-texmap-vs-4vec", "shader-texmap-fs",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor"]
					});
					
	shaderProgramCubemap = loadShader( "shader-cubemap-vs", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor","uFogColor","uModelScale", "uPosShiftMat","uPolarity"]
					});
					
	shaderProgramVertprojCubemap = loadShader( "shader-cubemap-vertproj-vs", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor","uFogColor","uModelScale", "uPosShiftMat","uCentrePosScaled","uPolarity"]
					});
}

var tennisBallVertexPositionBuffer,
	tennisBallNormalBuffer,
    tennisBallVertexTextureCoordBuffer,
	tennisBallVertexIndexBuffer;

var sphereBuffers={};
var cubeBuffers={};
var cubeFrameBuffers={};
var cubeFrameSubdivBuffers={};
var octoFrameBuffers={};
var octoFrameSubdivBuffers={};		
var tetraFrameBuffers={};
var tetraFrameSubdivBuffers={};		
var dodecaFrameBuffers={};	
var teapotBuffers={};	
var sshipBuffers={};
var gunBuffers={};
var icoballBuffers={};

function initBuffers(){
	
	/*
	//"tennis ball". data in data/tennisBall.js
	tennisBallVertexPositionBuffer = gl.createBuffer();
	bufferArrayData(tennisBallVertexPositionBuffer, tennisBallData.vertices, 4);
	tennisBallNormalBuffer = gl.createBuffer();
	bufferArrayData(tennisBallNormalBuffer, tennisBallData.normals, 4);
	tennisBallVertexTextureCoordBuffer= gl.createBuffer();
	bufferArrayData(tennisBallVertexTextureCoordBuffer, tennisBallData.uvcoords, 2);
	tennisBallVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tennisBallVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tennisBallData.indices), gl.STATIC_DRAW);
	tennisBallVertexIndexBuffer.itemSize = 3;
	tennisBallVertexIndexBuffer.numItems = tennisBallData.indices.length;
	*/
	
	tennisBallVertexPositionBuffer = gl.createBuffer();
	bufferArrayData(tennisBallVertexPositionBuffer, tballGridData.vertices, 4);
	tennisBallNormalBuffer = gl.createBuffer();
	bufferArrayData(tennisBallNormalBuffer, tballGridData.normals, 4);
	tennisBallVertexTextureCoordBuffer= gl.createBuffer();
	bufferArrayData(tennisBallVertexTextureCoordBuffer, tballGridData.texturecoords[0], 2);
	tennisBallVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tennisBallVertexIndexBuffer);
	tballGridData.indices = [].concat.apply([],tballGridData.faces);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tballGridData.indices), gl.STATIC_DRAW);
	tennisBallVertexIndexBuffer.itemSize = 3;
	tennisBallVertexIndexBuffer.numItems = tballGridData.indices.length;
	
	
	//load blender object
	//TODO use XMLHTTPRequest or something
	//for now have put "var myBlenderObjOrWhatever = " in front of contents of untitled.obj.json, and are referencing this directly as a script (similar to how are doing with shaders)
	//this part will eventually want to make part of build process (so can load object just containing what need)
	var cubeFrameBlenderObject = loadBlenderExport(cubeFrameData.meshes[0]);
	var cubeFrameSubdivObject = loadBlenderExport(cubeFrameSubdivData);
	var octoFrameBlenderObject = loadBlenderExport(octoFrameData.meshes[0]);
	var octoFrameSubdivObject = loadBlenderExport(octoFrameSubdivData);
	var tetraFrameBlenderObject = loadBlenderExport(tetraFrameData.meshes[0]);
	var tetraFrameSubdivObject = loadBlenderExport(tetraFrameSubdivData);
	var dodecaFrameBlenderObject = loadBlenderExport(dodecaFrameData.meshes[0]);
	var teapotObject = loadBlenderExport(teapotData);	//isn't actually a blender export - just a obj json
	var sshipObject = loadBlenderExport(sshipdata.meshes[0]);		//""
	var gunObject = loadBlenderExport(guncyldata.meshes[0]);
	var icoballObj = loadBlenderExport(icoballdata);

	loadBufferData(sphereBuffers, makeSphereData(61,32,1));
	loadBufferData(cubeBuffers, levelCubeData);
	loadBufferData(cubeFrameBuffers, cubeFrameBlenderObject);
	loadBufferData(cubeFrameSubdivBuffers, cubeFrameSubdivObject);
	loadBufferData(octoFrameBuffers, octoFrameBlenderObject);
	loadBufferData(octoFrameSubdivBuffers, octoFrameSubdivObject);
	loadBufferData(tetraFrameBuffers, tetraFrameBlenderObject);
	loadBufferData(tetraFrameSubdivBuffers, tetraFrameSubdivObject);
	loadBufferData(dodecaFrameBuffers, dodecaFrameBlenderObject);
	loadBufferData(teapotBuffers, teapotObject);
	console.log("will load spaceship...");
	loadBufferData(sshipBuffers, sshipObject);
	loadBufferData(gunBuffers, gunObject);
	loadBufferData(icoballBuffers, icoballObj);

	function bufferArrayData(buffer, arr, size){
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
		buffer.itemSize = size;
		buffer.numItems = arr.length / size;
		console.log("buffered. numitems: " + buffer.numItems);
	}
	
	function loadBufferData(bufferObj, sourceData){
		bufferObj.vertexPositionBuffer = gl.createBuffer();
		bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, 3);
		if (sourceData.uvcoords){
			bufferObj.vertexTextureCoordBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexTextureCoordBuffer, sourceData.uvcoords, 2);
		}
		
		bufferObj.vertexNormalBuffer= gl.createBuffer();
		bufferArrayData(bufferObj.vertexNormalBuffer, sourceData.normals, 3);

		bufferObj.vertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
		bufferObj.vertexIndexBuffer.itemSize = 3;
		bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;
	}
	
	function loadBlenderExport(meshToLoad){
		return {
			vertices: meshToLoad.vertices,
			normals: meshToLoad.normals,
			uvcoords: meshToLoad.texturecoords?meshToLoad.texturecoords[0]:false,
			indices: [].concat.apply([],meshToLoad.faces)	//trick from https://www.youtube.com/watch?v=sM9n73-HiNA t~ 28:30
		}	
	};
}

var reflectorInfo={
	centreTanAngleVectorScaled:[0,0,0],
	otherThing:[0,0,0],
	rad:1
};

function drawScene(frameTime){
	resizecanvas();

	if (guiParams.smoothMovement){iterateMechanics();}	//TODO make movement speed independent of framerate

	requestAnimationFrame(drawScene);
	stats.end();
	stats.begin();
	
	
	reflectorInfo.rad = guiParams.reflector.scale;
	
	//use player position directly. expect to behave like transparent
	var cubeViewShift = [playerCamera[12],playerCamera[13],playerCamera[14]];	
	var magsq = 1- playerCamera[15]*playerCamera[15];
		//note can just fo 1-w*w, or just use w!
	
	//console.log("w: " + playerCamera[15]);
	var angle = Math.acos(playerCamera[15]);	//from centre of portal to player
	var reflectionCentreTanAngle = 	reflectorInfo.rad/ ( 2 - ( reflectorInfo.rad/Math.tan(angle) ) );
		//note could do tan(angle) directly from playerCamera[15] bypassing calculating angle		
	
	var mag = Math.sqrt(magsq);
	//var correctionFactor = -angle/mag;
	
	var polarity = guiParams.reflector.isPortal? -1:1;
	var correctionFactor = -polarity * Math.atan(reflectionCentreTanAngle)/mag;
	var cubeViewShiftAdjusted = cubeViewShift.map(function(val){return val*correctionFactor});
	var cubeViewShiftAdjustedMinus = cubeViewShiftAdjusted.map(function(val){return -polarity*val});
	reflectorInfo.polarity=polarity;	
	
	//position within spherical reflector BEFORE projection
	var correctionFactorB = reflectionCentreTanAngle/mag;
	correctionFactorB/=reflectorInfo.rad;
	reflectorInfo.centreTanAngleVectorScaled = cubeViewShift.map(function(val){return -val*correctionFactorB});
	
	var reflectShaderMatrix = mat4.create();
	mat4.identity(reflectShaderMatrix);
	xyzmove4mat(reflectShaderMatrix, cubeViewShiftAdjustedMinus);	
	reflectorInfo.shaderMatrix=reflectShaderMatrix;
	
	//draw cubemap views
	mat4.identity(worldCamera);	//TODO use correct matrices
	
	//TODO move pMatrix etc to only recalc on screen resize
	//make a pmatrix for hemiphere perspective projection method.
	
	frustrumCull = squareFrustrumCull;
	if (guiParams.reflector.draw){		
		mat4.set(cmapPMatrix, pMatrix);
		for (var ii=0;ii<6;ii++){
			var framebuffer = cubemapFramebuffer[ii];
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.viewport(0, 0, framebuffer.width, framebuffer.height);
			
			mat4.identity(worldCamera);
			
			//shift centre?
			//xyzmove4mat(worldCamera, [0.4,0,0]);	//moves camera to left
			//xyzmove4mat(worldCamera, [0,0.4,0]);	//moves camera downward
			//xyzmove4mat(worldCamera, [0,0,0.4]);	//moves camera forward
													// (from perspective of initial player position)
			xyzmove4mat(worldCamera, cubeViewShiftAdjusted);	
			
			switch(ii){
				case 0:
					xyzrotate4mat(worldCamera, [0,-Math.PI/2,0]);	//right from default view
					break;
				case 1:
					xyzrotate4mat(worldCamera, [0,Math.PI/2,0]);	//left from default view
					break;
				case 2:
					xyzrotate4mat(worldCamera, [Math.PI/2,0,0]);	//top from default
					xyzrotate4mat(worldCamera, [0,0,Math.PI]);
					break;
				case 3:
					xyzrotate4mat(worldCamera, [-Math.PI/2,0,0]);
					xyzrotate4mat(worldCamera, [0,0,Math.PI]);
					break;
				case 4:
					xyzrotate4mat(worldCamera, [0,Math.PI,0]);
					break;
				case 5:
					break;
			}
			
			//xyzrotate4mat(worldCamera, [Math.PI,0,0]);
			
			//xyzmove4mat(worldCamera, [0,0,Math.PI/2]);
			
			drawWorldScene(frameTime, true);	//TODO skip reflector draw
		}
	}
	
	//setup for drawing to screen
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	setProjectionMatrix(pMatrix, 90.0, gl.viewportHeight/gl.viewportWidth);
	frustrumCull = generateCullFunc(pMatrix);
		
	mat4.set(playerCamera, worldCamera);	//set worldCamera to playerCamera

	drawWorldScene(frameTime, false);
}

function setProjectionMatrix(pMatrix, vFov, ratio, polarity){
	mat4.identity(pMatrix);
	
	var fy = Math.tan((Math.PI/180.0)*vFov/2);
	
	pMatrix[0] = ratio/fy ;
	pMatrix[5] = 1.0/fy;
	pMatrix[11]	= -1;	//rotate w into z.
	pMatrix[14] = -0.01;	//smaller = more z range. 1/50 gets ~same near clipping result as stereographic/perspective 0.01 near
	pMatrix[10]	= 0;
	pMatrix[15] = 0;
}

var usePrecalcCells=true;

function drawWorldScene(frameTime, isCubemapView) {
	
	var localVecFogColor = isCubemapView ? [0.2,1.0,0.8,1] : vecFogColor;
	
	gl.clearColor.apply(gl,localVecFogColor);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
	var invertedWorldCamera = mat4.create();
	mat4.set(worldCamera, invertedWorldCamera);
	mat4.transpose(invertedWorldCamera);
	
	
	//calculate stuff for discard shaders
	//position of reflector in frame of camera (after MVMatrix transformation)
	var reflectorPosTransformed = [worldCamera[3],worldCamera[7],worldCamera[11],worldCamera[15]];
	var cosReflector = 1.0/Math.sqrt(1+reflectorInfo.rad*reflectorInfo.rad);
	
	shaderProgramColored = guiParams["perPixelLighting"]?shaderProgramColoredPerPixelDiscard:shaderProgramColoredPerVertex;
	shaderProgramTexmap = guiParams["perPixelLighting"]?shaderProgramTexmapPerPixelDiscard:shaderProgramTexmapPerVertex;
	
	
	var dropLightPos;
	if (!guiParams["drop spaceship"]){
		dropSpaceship();	//note this is a bit poorly named and inefficient - when spaceship attached to camera,
	}						//in drawspaceship, are just doing invertedWorldCamera*worldCamera = identity
	//get light pos in frame of camera. light is at spaceship
	var lightMat = mat4.create();	//TODO mat*mat is unnecessary - only need to do dropLightPos = sshipMatrix*lightPosInWorld 
	mat4.set(invertedWorldCamera, lightMat);
	mat4.multiply(lightMat, sshipMatrix);
	dropLightPos = [lightMat[12], lightMat[13], lightMat[14], lightMat[15]];
	
	//var activeShaderProgram = shaderProgramColored;	//draw spheres
	var activeShaderProgram = shaderProgramTexmap;	//draw cubes
	//gl.enableVertexAttribArray(1);	//do need tex coords

	gl.useProgram(activeShaderProgram);
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	
	gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
	gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	
	var boxSize = 0.1;
	var boxRad = boxSize*Math.sqrt(3);
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [boxSize,boxSize,boxSize]);
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	
	var numBallsInRing = 20;
	var startAng = Math.PI / numBallsInRing;
	var angleStep = startAng * 2.0;
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 0.4, 0.4, 1.0]);	//RED
	mat4.set(invertedWorldCamera, mvMatrix);
	//try moving in z first so can see...
	//zmove4matCols(mvMatrix, -0.5);
	
	if (guiParams.drawShapes['boxes y=z=0']){drawRing();}
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.4, 1.0, 0.4, 1.0]);	//GREEN
	mat4.set(invertedWorldCamera, mvMatrix);
	//try moving in z first so can see...
	//zmove4matCols(mvMatrix, -0.5);
	
	rotate4mat(mvMatrix, 0, 1, Math.PI*0.5);
	if (guiParams.drawShapes['boxes x=z=0']){drawRing();}
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.4, 0.4, 1.0, 1.0]);	//BLUE
	mat4.set(invertedWorldCamera, mvMatrix);
	rotate4mat(mvMatrix, 0, 2, Math.PI*0.5);
	if (guiParams.drawShapes['boxes x=y=0']){drawRing();}
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 0.4, 1.0]);	//YELLOW
	mat4.set(invertedWorldCamera, mvMatrix);
	xmove4mat(mvMatrix, Math.PI*0.5);
	rotate4mat(mvMatrix, 0, 1, Math.PI*0.5);
	if (guiParams.drawShapes['boxes z=w=0']){drawRing();}
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 0.4, 1.0, 1.0]);	//MAGENTA
	mat4.set(invertedWorldCamera, mvMatrix);
	xmove4mat(mvMatrix, Math.PI*0.5);
	rotate4mat(mvMatrix, 0, 2, Math.PI*0.5);
	if (guiParams.drawShapes['boxes y=w=0']){drawRing();}
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.4, 1.0, 1.0, 1.0]);	//CYAN
	mat4.set(invertedWorldCamera, mvMatrix);
	ymove4mat(mvMatrix, Math.PI*0.5);
	rotate4mat(mvMatrix, 0, 2, Math.PI*0.5);
	if (guiParams.drawShapes['boxes x=w=0']){drawRing();}
	
	
	function drawRing(){
		xmove4mat(mvMatrix, startAng);
		for (var ii=0;ii<numBallsInRing;ii++){
			xmove4mat(mvMatrix, angleStep);
			if (frustrumCull(mvMatrix,boxRad)){
				drawItem();
			}
		}
	}
	
	//draw blender object - a csg cube minus sphere. draw 8 cells for tesseract.
	var modelScale = guiParams["8-cell scale"];
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 1.0, 1.0]);

	if (guiParams["draw 8-cell"]){
		drawArrayOfModels(
			cellMatData.d8,
			(guiParams["culling"] ? Math.sqrt(3): false),
			drawCubeFrame
		);	
	}
	
	
	if (guiParams["draw 16-cell"]){
		var cellScale = 4/Math.sqrt(6);		//in the model, vertices are 0.75*sqrt(2) from the centre, and want to scale to tan(PI/3)=sqrt(3)
		//var moveAmount = Math.PI/3;	
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [cellScale,cellScale,cellScale]);
		
		drawArrayOfModels(
			//[cellMatData.d16[0]],
			cellMatData.d16,
			(guiParams["culling"] ? 1.73: false),
			drawTetraFrame
		);	
		
	}
	
	modelScale = 1.0;
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
	
	if (guiParams["draw 24-cell"]){
		drawArrayOfModels(
			cellMatData.d24.cells,
			(guiParams["culling"] ? 1: false),
			drawOctoFrame
		);	
	}
	
	if (guiParams["draw 5-cell"]){
		var cellMats = cellMatData.d5;
		var moveDist = Math.acos(-0.25);
		modelScale = 2*moveDist;

		var cellColors = [
			[1.0, 1.0, 1.0, 1.0],	//WHITE
			[1.0, 0.4, 1.0, 1.0],	//MAGENTA
			[1.0, 1.0, 0.4, 1.0],	//YELLOW
			[0.4, 1.0, 0.4, 1.0],	//GREEN
			[1.0, 0.4, 0.4, 1.0]	//RED
		];
						
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
		for (cc in cellMats){
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, cellColors[cc]);
			var thisCell = cellMats[cc];
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,thisCell);
			drawTetraFrame();
		}
	}
	
	mat4.set(invertedWorldCamera, mvMatrix);
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.4, 0.4, 0.4, 1.0]);	//DARK

	//new draw dodeca stuff...
	if (guiParams["draw 120-cell"]){
		var dodecaScale=0.515;	//guess TODO use right value (0.5 is too small)
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [dodecaScale,dodecaScale,dodecaScale]);
		drawArrayOfModels(
			cellMatData.d120,
			(guiParams["culling"] ? 0.4: false),
			drawDodecaFrame
		);
	}
	
	if (guiParams["draw 600-cell"]){		
		prepBuffersForDrawing(tetraFrameBuffers, shaderProgramTexmap);
		var myscale=0.385;	//todo use correct scale
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [myscale,myscale,myscale]);
		
		drawArrayOfModels(
			cellMatData.d600,
			(guiParams["culling"] ? 0.355: false),
			function(){
				drawObjectFromPreppedBuffers(tetraFrameBuffers, shaderProgramTexmap);
			}
		);
	}
	
	function drawArrayOfModels(cellMats, cullRad, drawFunc){
		numDrawn = 0;
		if (!cullRad){
			drawArrayForFunc(function(){
				drawFunc();
				numDrawn++;
				});
		}else{
			drawArrayForFunc(function(){
				if (frustrumCull(mvMatrix,cullRad)){
					drawFunc();
					numDrawn++;
				}
			});
		}
	
		function drawArrayForFunc(drawFunc2){
			for (cc in cellMats){
				var thisCell = cellMats[cc];
				mat4.set(invertedWorldCamera, mvMatrix);
				mat4.multiply(mvMatrix,thisCell);
				drawFunc2();
			}
		}
		
		//console.log("num drawn: " + numDrawn);
	}
	
	activeShaderProgram = shaderProgramTexmap4Vec;
	gl.useProgram(activeShaderProgram);
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 1.0, 1.0]);
	if (guiParams.drawShapes['x*x+y*y=z*z+w*w']){
		mat4.set(invertedWorldCamera, mvMatrix);
		drawTennisBall();
	}
	if (guiParams.drawShapes['x*x+w*w=y*y+z*z']){
		mat4.set(invertedWorldCamera, mvMatrix);
		rotate4mat(mvMatrix, 0, 2, Math.PI*0.5);
		drawTennisBall();
	}
	if (guiParams.drawShapes['x*x+z*z=y*y+w*w']){
		mat4.set(invertedWorldCamera, mvMatrix);
		rotate4mat(mvMatrix, 0, 3, Math.PI*0.5);
		drawTennisBall();
	}
	
	function drawCubeFrame(){
		if (guiParams["subdiv frames"]){
			drawObjectFromBuffers(cubeFrameSubdivBuffers, shaderProgramTexmap);
		}else{
			drawObjectFromBuffers(cubeFrameBuffers, shaderProgramTexmap);
		}
	}
	function drawOctoFrame(){
		if (guiParams["subdiv frames"]){
			drawObjectFromBuffers(octoFrameSubdivBuffers, shaderProgramTexmap);
		}else{
			drawObjectFromBuffers(octoFrameBuffers, shaderProgramTexmap);
		}
	}
	function drawTetraFrame(){
		if (guiParams["subdiv frames"]){
			drawObjectFromBuffers(tetraFrameSubdivBuffers, shaderProgramTexmap);
		}else{
			drawObjectFromBuffers(tetraFrameBuffers, shaderProgramTexmap);
		}
	}
	function drawDodecaFrame(){
		drawObjectFromBuffers(dodecaFrameBuffers, shaderProgramTexmap);
	}
	
	
	//draw objects without textures
	
	activeShaderProgram = shaderProgramColored;
	gl.useProgram(activeShaderProgram);
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	//gl.disableVertexAttribArray(1);	//don't need texcoords
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.4, 0.4, 0.8, 1.0]);	//BLUE
	modelScale = guiParams["teapot scale"];
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);

	
	//TODO this only 
	//if (activeShaderProgram.uniforms.uReflectorPos){
		gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
		gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	//}
	
	if (guiParams["draw teapot"]){
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,teapotMatrix);		
		drawObjectFromBuffers(teapotBuffers, shaderProgramColored);
	}
	
	modelScale=0.002;
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.1, 0.1, 0.1, 1.0]);	//DARK
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
	
	if (guiParams["draw spaceship"]){
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,sshipMatrix);		
		drawObjectFromBuffers(sshipBuffers, shaderProgramColored);
		
		//draw guns
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.1,0.1,0.1]);
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.3, 0.3, 0.3, 1.0]);	//GREY

		var gunHoriz = 0.04;
		var gunVert = 0.02;
		var gunFront = 0.01;

		var mousP=mouseInfo.currentPointingDir;
		var gunAngRangeVert = 0.16;	//quite small else individual gun targeting can make guns clash TODO avoid this.
		var gunAngRangeHoriz = 0.25;
		//get angle to rotate to this point (similar to mouse drag rotation system)
		var pointingDir = {x:-mousP.x, y:mousP.y, z:mousP.z};
		pointingDir = capGunPointing(pointingDir);
		
		var rotvec = getRotFromPointing(pointingDir);
		
		if (guiParams["draw target"]){
			rotvec = getRotBetweenMats(sshipMatrix, cellMatData.d16[0]);	//target in frame of spaceship.
		}
		
		gunMatrices=[];
		drawRelativeToSpacehip([gunHoriz,gunVert,gunFront]); //left, down, forwards
		drawRelativeToSpacehip([-gunHoriz,gunVert,gunFront]);
		drawRelativeToSpacehip([gunHoriz,-gunVert,gunFront]);
		drawRelativeToSpacehip([-gunHoriz,-gunVert,gunFront]);
		
		function drawRelativeToSpacehip(vec){
			var gunMatrix = mat4.create();
			mat4.set(sshipMatrix, gunMatrix);
			xyzmove4mat(gunMatrix,vec);
			
			
			if (guiParams["draw target"] && guiParams["indiv targeting"]){
				rotvec = getRotBetweenMats(gunMatrix, cellMatData.d16[0]);
			}
			
			//rotate guns to follow mouse
			xyzrotate4mat(gunMatrix, rotvec);		
				
			xyzmove4mat(gunMatrix,[0,0,0.05]);	//move forwards
			gunMatrices.push(gunMatrix);
		
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,gunMatrix);
			
			drawObjectFromBuffers(gunBuffers, shaderProgramColored);
		}
		
		function capGunPointing(pointingDir){
			//scale such that z=1 - then can cap angle, ensures guns point forward. (TODO handle case that z=0)
			pointingDir={x:-pointingDir.x/pointingDir.z, 
					y:-pointingDir.y/pointingDir.z, z:1
				}
			pointingDir.x=Math.max(Math.min(pointingDir.x,gunAngRangeHoriz),-gunAngRangeHoriz);
			pointingDir.y=Math.max(Math.min(pointingDir.y,gunAngRangeVert),-gunAngRangeVert);
			return pointingDir;
		}
		
		function getRotBetweenMats(sourceMat, destMat){
			//actually gets rotation to point sourceMat at destMat
			var tmpMat = mat4.create();
			mat4.set(sourceMat, tmpMat);
			mat4.transpose(tmpMat);			
				
			mat4.multiply(tmpMat, destMat);	//object described by destMat in frame of object described by sourceMat.
				
			//[mat[12],mat[13],mat[14],mat[15] is 4vec co-ords
			pointingDir={x:tmpMat[12], y:tmpMat[13], z:tmpMat[14]};
			
			pointingDir = capGunPointing(pointingDir);
									
			return getRotFromPointing(pointingDir);
		}
		
		function getRotFromPointing(pointingDir){
			//get rotation to go from pointing straight ahead, to pointingDir
			
			pointingDir.w=Math.sqrt(pointingDir.x*pointingDir.x+		//assumes that input pointingdir z=1
									pointingDir.y*pointingDir.y +1);
			
			var crossProd = crossProductHomgenous({x:0,y:0,z:1,w:1}, pointingDir);
				//note the 4vec passed in here has w*w = x*x+y*y+z*z ie different to point on 4vec.	
			
			var rotvec = [-crossProd.x / crossProd.w, -crossProd.y / crossProd.w, -crossProd.z / crossProd.w];	
				
			//note that rotation code likely generates sin(ang) anyway, so this likely inefficient!
			var rotMag = Math.sqrt(rotvec[0]*rotvec[0] + rotvec[1]*rotvec[1] + rotvec[2]*rotvec[2]);
			if (rotMag>0){
				var rotHack = Math.asin(rotMag)/rotMag;
				rotvec[0]*=rotHack;
				rotvec[1]*=rotHack;
				rotvec[2]*=rotHack;
			}
			return rotvec;
		}
	}else{
		//draw "light" object
		var sphereRad = 0.04;
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [sphereRad,sphereRad,sphereRad]);
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [2.0, 2.0, 2.0, 2.0]);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,	sshipMatrix);
		if (frustrumCull(mvMatrix,sphereRad)){
			drawObjectFromBuffers(sphereBuffers, shaderProgramColored);
		}
	}
	
	var targetRad=guiParams["target scale"];
	
	//var targetRad=0.02;
	//change radii to test that have right bounding spheres for various cells.
	//targetRad=Math.sqrt(3);		//8-cell
	//targetRad=100;
	//targetRad=0.4;	//empirically found for 120-cell
	//targetRad=0.41;	//for 600-cell
	//targetRad=1;		//24-cell
	//targetRad=1.73;			//16-cell
	//TODO find exact values and process to calculate ( either largest distance points from origin in model, or calculate)
	
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [targetRad,targetRad,targetRad]);
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 0.3, 0.3, 1.0]);	//RED
	//draw sphere. to be targeted by guns
	if (guiParams["draw target"]){
		mat4.set(invertedWorldCamera, mvMatrix);
		//mat4.multiply(mvMatrix,targetMatrix);
		mat4.multiply(mvMatrix,	cellMatData.d16[0]);
		if (frustrumCull(mvMatrix,targetRad)){	//normally use +ve radius
									//-ve to make disappear when not entirely inside view frustrum (for testing)
			drawObjectFromBuffers(sphereBuffers, shaderProgramColored);
			//drawObjectFromBuffers(icoballBuffers, shaderProgramColored);
		}
	}
	
	if (guiParams.reflector.draw && !isCubemapView){
		var savedActiveProg = activeShaderProgram;
		
		//TODO have some variable for activeReflectorShader, avoid switch.
		switch(guiParams.reflector.mappingType){
			case 'projection':
			activeShaderProgram = shaderProgramCubemap;
			break;
			case 'vertex projection':
			activeShaderProgram = shaderProgramVertprojCubemap;
			break;
		}
		gl.useProgram(activeShaderProgram);
		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uPosShiftMat, false, reflectorInfo.shaderMatrix);
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.9, 0.9, 0.9, 1.0]);	//grey
		//gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 1.0, 1.0]);
		gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);

		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [reflectorInfo.rad,reflectorInfo.rad, reflectorInfo.rad]);
	
		gl.uniform1f(activeShaderProgram.uniforms.uPolarity, reflectorInfo.polarity);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		if (frustrumCull(mvMatrix,reflectorInfo.rad)){
			if(guiParams.reflector.mappingType == 'vertex projection'){
				gl.uniform3fv(activeShaderProgram.uniforms.uCentrePosScaled, reflectorInfo.centreTanAngleVectorScaled	);
			}
			drawObjectFromBuffers(sphereBuffers, activeShaderProgram, true);
		}
		
		activeShaderProgram = savedActiveProg;
		gl.useProgram(activeShaderProgram);
	}
	
	for (var b in bullets){
		var bulletMatrix=bullets[b];
		//move bullet (todo decouple mechanics from drawing, or at least use deltaT)
		xyzmove4mat(bulletMatrix,[0,0,0.025]);
		//draw bullet
		targetRad=0.0025;
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [targetRad,targetRad,20*targetRad]);	//long streaks
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 0.3, 1.0]);	//YELLOW
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,bulletMatrix);
		if (frustrumCull(mvMatrix,targetRad)){	
			drawObjectFromBuffers(sphereBuffers, shaderProgramColored);
		}
	}
	
}

//TODO button to toggle culling (so can check that doesn't impact what's drawn)
var frustrumCull;
function generateCullFunc(pMat){
	var const1 = pMat[5];
	var const2 = pMat[0];
	var const3 = Math.sqrt(1+pMat[5]*pMat[5]);
	var const4 = Math.sqrt(1+pMat[0]*pMat[0]); 
	return function(mat, rad){	//return whether an sphere of radius rad, at a position determined by mat (ie with position [mat[12],mat[13],mat[14],mat[15]]) overlaps the view frustrum.
		var adjustedRad=rad/Math.sqrt(1+rad*rad);
		var const5=const3*adjustedRad;	//TODO only do this once when drawing a sequence of same objects.
		var const6=const4*adjustedRad;
		if (mat[14]>adjustedRad){return false;}
		if (mat[14]-const1*mat[13]>const5){return false;}	//vertical culling
		if (mat[14]+const1*mat[13]>const5){return false;}	
		if (mat[14]-const2*mat[12]>const6){return false;}	//horiz culling
		if (mat[14]+const2*mat[12]>const6){return false;}
		return true;
	}
}


function drawItem(){
	drawObjectFromBuffers(cubeBuffers, shaderProgramTexmap);
}

function drawTennisBall(){
	gl.disable(gl.CULL_FACE);
	gl.bindBuffer(gl.ARRAY_BUFFER, tennisBallVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgramTexmap4Vec.attributes.aVertexPosition, tennisBallVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, tennisBallNormalBuffer);
    gl.vertexAttribPointer(shaderProgramTexmap4Vec.attributes.aVertexNormal, tennisBallNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, tennisBallVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgramTexmap4Vec.attributes.aTextureCoord, tennisBallVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tennisBallVertexIndexBuffer);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
	gl.uniform1i(shaderProgramTexmap4Vec.uniforms.uSampler, 0);
	
	
	for (var side=0;side<2;side++){	//TODO should only draw 1 side - work out which side player is on...
		for (var xg=0;xg<4;xg+=2){		//
			for (var yg=0;yg<4;yg+=2){	//TODO precalc cells array better than grids here.
				setMatrixUniforms(shaderProgramTexmap4Vec);
				gl.drawElements(gl.TRIANGLES, tennisBallVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				rotate4mat(mvMatrix, 0, 1, Math.PI*1.0);
			}
			rotate4mat(mvMatrix, 2, 3, Math.PI*1.0);
		}
		xmove4mat(mvMatrix, 0.5*Math.PI);			//switch to 
		rotate4mat(mvMatrix, 1, 2, Math.PI*0.5);	//other side..
	}
	
}

function drawObjectFromBuffers(bufferObj, shaderProg, usesCubeMap){
	prepBuffersForDrawing(bufferObj, shaderProg, usesCubeMap);
	drawObjectFromPreppedBuffers(bufferObj, shaderProg);
}
function prepBuffersForDrawing(bufferObj, shaderProg, usesCubeMap){
	gl.enable(gl.CULL_FACE);
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, bufferObj.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	if (bufferObj.vertexNormalBuffer && shaderProg.attributes.aVertexNormal){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexNormalBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexNormal, bufferObj.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
	
	if (bufferObj.vertexTextureCoordBuffer){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aTextureCoord, bufferObj.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(shaderProg.uniforms.uSampler, 0);
	}
	
	if (usesCubeMap){
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
		gl.uniform1i(shaderProg.uniforms.uSampler, 0);
	}
	
	gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
}
function drawObjectFromPreppedBuffers(bufferObj, shaderProg){
	gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);
	gl.drawElements(gl.TRIANGLES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

//need all of these???
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var playerMatrix = mat4.create();
var playerCamera = mat4.create();
var worldCamera = mat4.create();

var cmapPMatrix = mat4.create();
setProjectionMatrix(cmapPMatrix, -90.0, 1.0);	//-90 gets reflection to look right. (different for portal?)
var squareFrustrumCull = generateCullFunc(cmapPMatrix);


function setMatrixUniforms(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.uniforms.uPMatrix, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.uniforms.uMVMatrix, false, mvMatrix);
}

var cubemapFramebuffer;
var cubemapTexture;
var cubemapSize = 512;
//cube map code from http://www.humus.name/cubemapviewer.js (slightly modified)
var cubemapFacelist;

function initCubemapFramebuffer(){
	cubemapFramebuffer = [];
	
	cubemapTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	var faces = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
				 gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
				 gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
				 gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
				 gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
				 gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
	cubemapFacelist = faces;
	
	for (var i = 0; i < faces.length; i++)
	{
		var face = faces[i];
		
		var framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		framebuffer.width = cubemapSize;
		framebuffer.height = cubemapSize;
		cubemapFramebuffer[i]=framebuffer;
		
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);	//already bound so can lose probably
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		//gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texImage2D(face, 0, gl.RGBA, cubemapSize, cubemapSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		
		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, cubemapSize, cubemapSize);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, cubemapTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	}
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);	//this gets rid of errors being logged to console. 
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function setupScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	mat4.identity(playerMatrix);
	mat4.identity(playerCamera);	//not sure why have 2 matrices here...
	
	//start player off outside of boxes
	xyzmove4mat(playerCamera,[0,0.7,-1.0]);
}

var texture;
var terrainTexture;

function initTexture(){
	texture = makeTexture("img/0033.jpg");
	//texture = makeTexture("img/grid-omni.png");
	//texture = makeTexture("img/ash_uvgrid01-grey.tiny.png");	//numbered grid
	terrainTexture = makeTexture("data/terrain/turbulent-seamless.png");
}

function makeTexture(src) {	//to do OO
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function(){
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};	
	texture.image.src = src;
	return texture;
}

var mouseInfo = {
	x:0,
	y:0,
	dragging: false,
	lastPointingDir:{}
};
var stats;

var guiParams={
	drawShapes:{
		'x*x+y*y=z*z+w*w':false,
		'x*x+z*z=y*y+w*w':false,
		'x*x+w*w=y*y+z*z':false,
		'boxes y=z=0':false,	//x*x+w*w=1
		'boxes x=z=0':false,	//y*y+w*w=1
		'boxes x=y=0':false,	//z*z+w*w=1
		'boxes x=w=0':false,
		'boxes y=w=0':false,
		'boxes z=w=0':false
	},
	"draw 5-cell":false,
	"8-cell scale":1.0,
	"subdiv frames":true,
	"draw 8-cell":true,
	"draw 16-cell":false,
	"draw 24-cell":false,
	"draw 120-cell":false,
	"draw 600-cell":false,
	"draw teapot":true,
	"teapot scale":0.7,
	"draw spaceship":false,
	"drop spaceship":false,
	"draw target":true,
	"target scale":0.25,
	"indiv targeting":true,
	smoothMovement: true,
	"culling":true,
	"perPixelLighting":true,
	fogColor:'#222222',
	reflector:{
		draw:true,
		mappingType:'vertex projection',
		scale:1.0,
		isPortal:false
	}
};
var vecFogColor = [1.0,0.0,0.0,1.0];
var teapotMatrix=mat4.create();mat4.identity(teapotMatrix);
xyzmove4mat(teapotMatrix,[0,1.5,0]);
var sshipMatrix=mat4.create();mat4.identity(sshipMatrix);
var targetMatrix=mat4.create();mat4.identity(targetMatrix);
var bullets=[];
var gunMatrices=[];
var canvas;
function init(){

	stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );

	var gui = new dat.GUI();
	gui.addColor(guiParams, 'fogColor').onChange(function(color){
		setFog(color);
	});
	var drawShapesFolder = gui.addFolder('drawShapes');
	for (shape in guiParams.drawShapes){
		console.log(shape);
		drawShapesFolder.add(guiParams.drawShapes, shape );
	}
	gui.add(guiParams,"draw 5-cell");
	gui.add(guiParams,"draw 8-cell",false);
	gui.add(guiParams,"draw 16-cell");
	gui.add(guiParams,"8-cell scale",0.2,2.0,0.05);
	gui.add(guiParams,"subdiv frames");
	gui.add(guiParams,"draw 24-cell",false);
	gui.add(guiParams,"draw 120-cell",true);
	gui.add(guiParams,"draw 600-cell",true);
	gui.add(guiParams,"draw teapot");
	gui.add(guiParams,"teapot scale",0.2,2.0,0.05);
	gui.add(guiParams,"draw spaceship",true);
	gui.add(guiParams, "drop spaceship",false);
	gui.add(guiParams, "draw target",false);
	gui.add(guiParams,"target scale",0.02,20.0,0.05);
	gui.add(guiParams, "indiv targeting");
	gui.add(guiParams, "perPixelLighting");
	gui.add(guiParams, "smoothMovement");
	gui.add(guiParams, "culling");
	var reflectorFolder = gui.addFolder('reflector');
	reflectorFolder.add(guiParams.reflector, "draw");
	reflectorFolder.add(guiParams.reflector, "mappingType", ['projection', 'vertex projection']);
	reflectorFolder.add(guiParams.reflector, "scale", 0.2,4,0.2);
	reflectorFolder.add(guiParams.reflector, "isPortal");
	
	window.addEventListener("keydown",function(evt){
		//console.log("key pressed : " + evt.keyCode);
		var willPreventDefault=true;
		var controlSpeed = guiParams.smoothMovement ? 0:0.02;
		switch (evt.keyCode){
			case 87:				//W
				movePlayerFwd(controlSpeed);
				break;
			case 83:				//S
				movePlayerFwd(-controlSpeed);
				break;
			case 65:				//A
				movePlayerLeft(controlSpeed);
				break;
			case 68:				//D
				movePlayerLeft(-controlSpeed);
				break;
			case 39:
				turnPlayer(controlSpeed);
				break;
			case 37:
				turnPlayer(-controlSpeed);
				break;
			case 81:				//Q
				rollPlayer(-controlSpeed);	
				break;
			case 69:				//E
				rollPlayer(controlSpeed);	
				break;
				
			case 84:	//T
				xyzmove4mat(playerCamera,[0.01,0.0,0.01]);	//diagonally forwards/left
				break;
				
			case 32:				//spacebar
				movePlayerUp(-controlSpeed);
				break;
			case 17:				//ctrl
				movePlayerUp(controlSpeed);
				break;
			case 38:
				pitchPlayer(-controlSpeed);		//up arrow
				break;
			case 40:
				pitchPlayer(controlSpeed);
				break;
			case 71:	//G
				fireGun();
				break;
			default:
				willPreventDefault=false;
				break;
		}
		if (willPreventDefault){evt.preventDefault()};
	})

	canvas = document.getElementById("mycanvas");
	canvas.addEventListener("mousedown", function(evt){
		mouseInfo.x = evt.offsetX;
		mouseInfo.y = evt.offsetY;
		mouseInfo.dragging = true;
		mouseInfo.lastPointingDir = getPointingDirectionFromScreenCoordinate({x:mouseInfo.x, y: mouseInfo.y});
	});
	canvas.addEventListener("mouseup", function(evt){
		mouseInfo.dragging = false;
	});
	canvas.addEventListener("mouseout", function(evt){
		mouseInfo.dragging = false;
	});
	canvas.addEventListener("mousemove", function(evt){
		mouseInfo.currentPointingDir = getPointingDirectionFromScreenCoordinate({x:evt.offsetX, y: evt.offsetY});
		if (mouseInfo.dragging){
			var pointingDir = mouseInfo.currentPointingDir;
			//console.log("pointingDir = " + pointingDir);
			
			//get the direction of current and previous mouse position.
			//do a cross product to work out the angle rotated
			//and rotate the player by this amount
			
			var crossProd = crossProductHomgenous(pointingDir, mouseInfo.lastPointingDir);
			mouseInfo.lastPointingDir = pointingDir;
			
			//rotate player 
			//guess have signs here because of unplanned handedness of screen, 3d co-ord systems
			xyzrotate4mat(playerCamera, [crossProd.x / crossProd.w, -crossProd.y / crossProd.w, -crossProd.z / crossProd.w]);
			
		}
	});
	
	canvas.addEventListener("touchstart", handleTouchStart, false);
	canvas.addEventListener("touchend", handleTouchEnd, false);
	canvas.addEventListener("touchmove", handleTouchMove, false);
	
	initGL();
	initShaders();
	initTexture();
	initCubemapFramebuffer();
	initBuffers();
	setFog(guiParams.fogColor);
    gl.enable(gl.DEPTH_TEST);
	//gl.disable(gl.DEPTH_TEST);
	setupScene();
	requestAnimationFrame(drawScene);
	
	function setFog(color){
			var r = parseInt(color.substring(1,3),16) /255;
			var g = parseInt(color.substring(3,5),16) /255;
			var b = parseInt(color.substring(5,7),16) /255;
			vecFogColor = [r,g,b,1];
			gl.clearColor(r,g,b,1);
	}

}

var iterateMechanics = (function iterateMechanics(){
	var lastTime=(new Date()).getTime();
	var moveSpeed=0.01;
	var rotateSpeed=-0.01;

	return function(){
		var nowTime = (new Date()).getTime();
		var timeElapsed = Math.min(nowTime - lastTime, 50);	//ms. 50ms -> slowdown if drop below 20fps 
		//console.log("time elapsed: " + timeElapsed);
		lastTime=nowTime;
		
		movePlayer([
			moveSpeed*(keyThing.keystate(65)-keyThing.keystate(68)),	//lateral
			moveSpeed*(keyThing.keystate(17)-keyThing.keystate(32)),	//vertical
			moveSpeed*(keyThing.keystate(87)-keyThing.keystate(83)),	//fwd/back
		]);

		rotatePlayer([
			rotateSpeed*(keyThing.keystate(40)-keyThing.keystate(38)), //pitch
			rotateSpeed*(keyThing.keystate(39)-keyThing.keystate(37)), //turn
			rotateSpeed*(keyThing.keystate(69)-keyThing.keystate(81)), //roll
		]);
	
		/*
		for (var bb in bullets){
			bullets[bb].iterate();
		}
		*/
	}
})();

function movePlayer(vec){
	xyzmove4mat(playerCamera, vec);
}

function movePlayerFwd(amount){
	zmove4mat(playerCamera, amount);
}
function movePlayerLeft(amount){
	xmove4mat(playerCamera, amount);
}
function movePlayerUp(amount){
	ymove4mat(playerCamera, amount);
}

function rotatePlayer(vec){
	xyzrotate4mat(playerCamera,vec);
}

function rollPlayer(amount){
	rotate4mat(playerCamera, 0, 1, -amount);
}
function turnPlayer(amount){
	rotate4mat(playerCamera, 0, 2, amount);
}
function pitchPlayer(amount){
	rotate4mat(playerCamera, 1, 2, -amount);
}


function getPointingDirectionFromScreenCoordinate(coords){
	
	var maxyvert = 1.0;	
	var maxxvert = screenAspect;
	
	var xpos = maxxvert*(coords.x*2.0/gl.viewportWidth   -1.0 );
	var ypos = maxyvert*(coords.y*2.0/gl.viewportHeight   -1.0 );
	var radsq = xpos*xpos + ypos*ypos;
	var zpos = 1.0;	//FOV 90 deg
	
	//normalise - use sending back homogenous co-ords because maybe a tiny amount more efficient since cross producting anyway
	var mag= Math.sqrt(radsq + zpos*zpos);
	
	return {
		x: xpos,
		y: ypos,
		z: zpos,
		w: mag
	}
}

function crossProductHomgenous(dir1, dir2){
	var output ={};
	output.x = dir1.y * dir2.z - dir1.z * dir2.y; 
	output.y = dir1.z * dir2.x - dir1.x * dir2.z; 
	output.z = dir1.x * dir2.y - dir1.y * dir2.x;
	output.w = dir1.w * dir2.w;
	return output;
}


var ongoingTouches = {};

function handleTouchStart(evt){
	evt.preventDefault();
	var touches = evt.changedTouches;
	log( touches.length + " touches starting");
		
	for (var i = 0; i < touches.length; i++) {
		var thisTouch = copyTouch(touches[i]);
		var touchIdx = touches[i].identifier;
		ongoingTouches[touchIdx] = thisTouch;
		logtouchevent(touches[i],i);
	}
}

function handleTouchMove(evt){
	evt.preventDefault();
	var touches = evt.changedTouches;
	log( touches.length + " touches moving");
	
	for (var i = 0; i < touches.length; i++) {
		
		var thisTouch = copyTouch(touches[i]);
		var touchIdx = touches[i].identifier;
		
		//copy previous position to new touch
		toTouch = ongoingTouches[touchIdx];
		thisTouch.oldx = toTouch.x;
		thisTouch.oldy = toTouch.y;
		ongoingTouches[touchIdx] = thisTouch;
		
		//do do the equivalent of mouse move
		if (i==0){
			//what behaviour will be if there are >1 touches?
			
			var oldPointingDir = getPointingDirectionFromScreenCoordinate({x:thisTouch.oldx, y: thisTouch.oldy});
			var pointingDir = getPointingDirectionFromScreenCoordinate({x:thisTouch.x, y: thisTouch.y});
			
			var crossProd = crossProductHomgenous(pointingDir, oldPointingDir);
			mouseInfo.lastPointingDir = pointingDir;
			
			//rotate player 
			//guess have signs here because of unplanned handedness of screen, 3d co-ord systems
			xyzrotate4mat(playerCamera, [crossProd.x / crossProd.w, -crossProd.y / crossProd.w, -crossProd.z / crossProd.w]);
		}
		
		logtouchevent(touches[i],i);
	}
}

function handleTouchEnd(evt){
	evt.preventDefault();
	var touches = evt.changedTouches;
	log( touches.length + " touches ending");
	for (var i = 0; i < touches.length; i++) {
		logtouchevent(touches[i],i);
		delete ongoingTouches[touches.identifier];
	}
}

function logtouchevent(t,i){
	//log("i = " + i + " , idx = " + t.identifier + ". radiusX : " + t.radiusX + " , radiusY : " + t.radiusY);
	log("i = " + i + " , idx = " + t.identifier + ". x : " + t.pageX + " , y : " + t.pageY);
}

//https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
//says this is useful since the touch object might change.
function copyTouch(touch) {
  return { x: touch.pageX, y: touch.pageY, force:touch.force };
}

function log(info){		//can to enable/disable logging globally
	//console.log(info);
}
function dropSpaceship(){
	mat4.set(playerCamera,sshipMatrix);	//copy current player 4-rotation matrix to the spaceship object
}
function fireGun(){
	for (var g in gunMatrices){
		var gunMatrix = gunMatrices[g];
		var newBullet = mat4.create();
		mat4.set(gunMatrix,newBullet);
		bullets.push(newBullet);
		//limit number of bullets
		if (bullets.length>10){
			bullets.shift();
		}
	}
}