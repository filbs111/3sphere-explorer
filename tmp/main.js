var shaderProgramColored,
	shaderProgramColoredPerVertex,
	shaderProgramColoredPerPixel,
	shaderProgramColoredPerPixelDiscard,
	shaderProgramColoredPerPixelTransparentDiscard,
	shaderProgramTexmap,
	shaderProgramTexmapPerVertex,
	shaderProgramTexmapPerPixel,
	shaderProgramTexmapPerPixelDiscard,
	shaderProgramTexmap4Vec,
	shaderProgramCubemap,
	shaderProgramVertprojCubemap,
	shaderProgramDecal;
function initShaders(){				
	shaderProgramColoredPerVertex = loadShader( "shader-simple-vs", "shader-simple-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uColor","uEmitColor","uFogColor", "uModelScale"]
					});
					/*
	shaderProgramColoredPerPixel = loadShader( "shader-perpixel-vs", "shader-perpixel-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uColor","uEmitColor","uFogColor", "uModelScale"]
					});
					*/	//unused shader
	shaderProgramColoredPerPixelDiscard = loadShader( "shader-perpixel-discard-vs", "shader-perpixel-discard-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uDropLightPos2","uColor","uEmitColor","uFogColor", "uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});

	shaderProgramColoredPerPixelTransparentDiscard = loadShader( "shader-perpixel-transparent-discard-vs", "shader-perpixel-transparent-discard-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uEmitColor", "uModelScale","uReflectorPos","uReflectorCos"]
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
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uDropLightPos2","uSampler","uColor","uFogColor","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
					
	shaderProgramTexmap4Vec = loadShader( "shader-texmap-vs-4vec", "shader-texmap-fs",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uDropLightPos2","uSampler","uColor","uFogColor","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
					
	shaderProgramCubemap = loadShader( "shader-cubemap-vs", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor","uFogColor","uModelScale", "uPosShiftMat","uPolarity"]
					});
					
	shaderProgramVertprojCubemap = loadShader( "shader-cubemap-vertproj-vs", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor","uFogColor","uModelScale", "uPosShiftMat","uCentrePosScaled","uPolarity"]
					});
					
	shaderProgramDecal = loadShader( "shader-decal-vs", "shader-decal-fs",{
					attributes:["aVertexPosition","aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor", "uModelScale"]
					});
}

var duocylinderObjects={
	grid:{divs:4,step:Math.PI/2},
	terrain:{divs:2,step:Math.PI}
	};

var sphereBuffers={};
var quadBuffers={};
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
	loadDuocylinderBufferData(duocylinderObjects.grid, tballGridData);
	loadDuocylinderBufferData(duocylinderObjects.terrain, terrainData);
	
	function loadDuocylinderBufferData(bufferObj, sourceData){
		bufferObj.vertexPositionBuffer = gl.createBuffer();
		bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, 4);
		bufferObj.normalBuffer = gl.createBuffer();
		bufferArrayData(bufferObj.normalBuffer, sourceData.normals, 4);
		bufferObj.vertexTextureCoordBuffer= gl.createBuffer();
		bufferArrayData(bufferObj.vertexTextureCoordBuffer, sourceData.uvcoords || sourceData.texturecoords[0], 2);	//handle inconsistent formats
		bufferObj.vertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
		sourceData.indices = [].concat.apply([],sourceData.faces);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
		bufferObj.vertexIndexBuffer.itemSize = 3;
		bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;
	}
	
	//load blender object
	//TODO use XMLHTTPRequest or something
	//for now have put "var myBlenderObjOrWhatever = " in front of contents of untitled.obj.json, and are referencing this directly as a script (similar to how are doing with shaders)
	//this part will eventually want to make part of build process (so can load object just containing what need)
	var cubeFrameBlenderObject = loadBlenderExport(cubeFrameData.meshes[0]);
	//var cubeFrameSubdivObject = loadBlenderExport(cubeFrameSubdivData);
	var cubeFrameSubdivObject = loadBlenderExportNoOutwardFaces(cubeFrameSubdivData);
	var octoFrameBlenderObject = loadBlenderExport(octoFrameData.meshes[0]);
	//var octoFrameSubdivObject = loadBlenderExport(octoFrameSubdivData);
	var octoFrameSubdivObject = loadBlenderExportNoOutwardFaces(octoFrameSubdivData);
	
	var tetraFrameBlenderObject = loadBlenderExportNoOutwardFaces(tetraFrameData.meshes[0]);
	//var tetraFrameBlenderObject = loadBlenderExport(tetraFrameData.meshes[0]);
	var tetraFrameSubdivObject = loadBlenderExport(tetraFrameSubdivData);	//TODO nooutward faces for this too
	var dodecaFrameBlenderObject = loadBlenderExportNoOutwardFaces(dodecaFrameData.meshes[0]);
	//var dodecaFrameBlenderObject = loadBlenderExport(dodecaFrameData.meshes[0]);
	var teapotObject = loadBlenderExport(teapotData);	//isn't actually a blender export - just a obj json
	var sshipObject = loadBlenderExport(sshipdata.meshes[0]);		//""
	var gunObject = loadBlenderExport(guncyldata.meshes[0]);
	var icoballObj = loadBlenderExport(icoballdata);

	loadBufferData(sphereBuffers, makeSphereData(99,200,1)); //todo use normalized box or icosohedron
	loadBufferData(quadBuffers, quadData);
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
	function loadBlenderExportNoOutwardFaces(meshToLoad){
		var vertices = meshToLoad.vertices;
		var normals = meshToLoad.normals;
		var alteredMesh = {
			vertices: vertices,
			normals: normals,
			texturecoords: meshToLoad.texturecoords
		}
		var newFaces=[];
		var faces = meshToLoad.faces;	//assumes array[3] for each index
		var numInputFaces = faces.length;
		for (var ii=0;ii<numInputFaces;ii++){
			var theseIndices = faces[ii];
		//	var totalVertex = vertices[theseIndices[0]]+ vertices[theseIndices[1]] + vertices[theseIndices[2]];	//(average*3)
				//bug!!!! - this should be making an array by adding 3 3-vectors. eg theseIndices[0]*3 +0,+1,+2...
				//			var totalNormal = normals[theseIndices[0]]+ normals[theseIndices[1]] + normals[theseIndices[2]];	//(average*3)

			var totalVertex = [];
			var totalNormal = [];
			for (var cc=0;cc<3;cc++){
				totalVertex[cc] = vertices[theseIndices[0]*3 + cc]+ vertices[theseIndices[1]*3 + cc] + vertices[theseIndices[2]*3+cc];
				totalNormal[cc] = normals[theseIndices[0]*3 + cc]+ normals[theseIndices[1]*3 + cc] + normals[theseIndices[2]*3+cc];
			}
			
			//normalise total normal
			var vertexLengthsq = totalVertex[0]*totalVertex[0] + totalVertex[1]*totalVertex[1] + totalVertex[2]*totalVertex[2];
			var normalLengthsq = totalNormal[0]*totalNormal[0] + totalNormal[1]*totalNormal[1] + totalNormal[2]*totalNormal[2];
				//above maybe unnecessary if set threshold right
			var dotProd = totalVertex[0]*totalNormal[0] + totalVertex[1]*totalNormal[1] + totalVertex[2]*totalNormal[2];
			//if (dotProd*dotProd > 1.1*normalLengthsq*vertexLengthsq){
			if (dotProd < 0.5*Math.sqrt(normalLengthsq*vertexLengthsq)){
				//this works. afaik need number as low as this because faces are triangles etc. maybe will want some number close to zero - just chceking sign maybe sufficient (though "between" faces are near zero dot product)..
				newFaces.push(theseIndices);
			}			
				//todo make buffers have inner then outer face index. IIRC some gl func to draw sub-range of faces (therefore can do either with or without outer faces using same buffer)
		}
		alteredMesh.faces = newFaces;
		return loadBlenderExport(alteredMesh);
	}
}

var reflectorInfo={
	centreTanAngleVectorScaled:[0,0,0],
	otherThing:[0,0,0],
	rad:1
};

function calcReflectionInfo(toReflect,resultsObj){
	//use player position directly. expect to behave like transparent
	var cubeViewShift = [toReflect[12],toReflect[13],toReflect[14]];	
	var magsq = 1- toReflect[15]*toReflect[15];
		//note can just fo 1-w*w, or just use w!
	
	//console.log("w: " + playerCamera[15]);
	var angle = Math.acos(toReflect[15]);	//from centre of portal to player
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
	resultsObj.centreTanAngleVectorScaled = cubeViewShift.map(function(val){return -val*correctionFactorB});
	
	var reflectShaderMatrix = mat4.create();
	mat4.identity(reflectShaderMatrix);
	xyzmove4mat(reflectShaderMatrix, cubeViewShiftAdjustedMinus);	
	resultsObj.shaderMatrix=reflectShaderMatrix;
	
	resultsObj.cubeViewShiftAdjusted = cubeViewShiftAdjusted;
	
	//only used for droplightpos2, and only different from shaderMatrix if reflector (rather than portal) (inefficient!)
	var reflectShaderMatrix2 = mat4.create();
	mat4.identity(reflectShaderMatrix2);
	xyzmove4mat(reflectShaderMatrix2, cubeViewShiftAdjusted);	
	resultsObj.shaderMatrix2=reflectShaderMatrix2;
}

var moveAwayVec;
var gunHeat = 0;

var offsetCam = (function(){
	var offsetVec;
	var targetForType = {
		"near 3rd person":[0,-0.0075,-0.005],
		"far 3rd person":[0,-0.02,-0.03],
		"cockpit":offsetVec = [0,0,0.001]
	}
	offsetVecTarget = targetForType["far 3rd person"];
	offsetVec = offsetVecTarget;	

	var mult1=0.95;
	var mult2=1-mult1;
	
	return {
		getVec: function (){
			return offsetVec;
		},
		setType: function(type){
			offsetVecTarget = targetForType[type];
		},
		iterate: function(){
			offsetVec = offsetVec.map(function(val,ii){return val*mult1+offsetVecTarget[ii]*mult2;})
		}
	}
})();


function drawScene(frameTime){
	resizecanvas();

	iterateMechanics();	//TODO make movement speed independent of framerate
	
	requestAnimationFrame(drawScene);
	stats.end();
	stats.begin();
	
	
	reflectorInfo.rad = guiParams.reflector.scale;
	
	
	var saveWorld = currentWorld;
	
	mat4.set(playerCameraInterp, offsetPlayerCamera);	
	//mat4.set(playerCamera, offsetPlayerCamera);	
	
	offsetCam.setType(guiParams.cameraType);

	var offsetSteps = 100;
	var offsetVecStep = offsetCam.getVec().map(function(item){return item/offsetSteps;});
	portalTest(offsetPlayerCamera,0);
	for (var ii=0;ii<100;ii++){	//TODO more efficient. if insufficient subdivision, transition stepped.
		xyzmove4mat(offsetPlayerCamera,offsetVecStep);	
		portalTest(offsetPlayerCamera,0);
	}
	
	//move camera away from portal (todo ensure player model movement references offsetPlayerCamera BEFORE this move!
	moveAwayVec = [ offsetPlayerCamera[3]* guiParams.reflector.moveAway,
						offsetPlayerCamera[7]* guiParams.reflector.moveAway,
						offsetPlayerCamera[11]* guiParams.reflector.moveAway];
	xyzmove4mat(offsetPlayerCamera, moveAwayVec);
	
	
	mat4.set(offsetPlayerCamera, worldCamera);
	
	calcReflectionInfo(worldCamera,reflectorInfo);
	
	//draw cubemap views
	mat4.identity(worldCamera);	//TODO use correct matrices
	
	//TODO move pMatrix etc to only recalc on screen resize
	//make a pmatrix for hemiphere perspective projection method.
	
	frustrumCull = squareFrustrumCull;
	if (guiParams.reflector.update){		
		mat4.set(cmapPMatrix, pMatrix);
		for (var ii=0;ii<6;ii++){
			var framebuffer = cubemapFramebuffer[ii];
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.viewport(0, 0, framebuffer.width, framebuffer.height);
			
			mat4.identity(worldCamera);
			
			xyzmove4mat(worldCamera, reflectorInfo.cubeViewShiftAdjusted);	
			
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
	
	mainCamFov = guiParams.cameraFov;
	
	setProjectionMatrix(pMatrix, mainCamFov, gl.viewportHeight/gl.viewportWidth);	//note mouse code assumes 90 deg fov used. TODO fix.
	frustrumCull = generateCullFunc(pMatrix);
		
	mat4.set(offsetPlayerCamera, worldCamera);	//set worldCamera to playerCamera
	//xyzmove4mat(worldCamera,[0,-0.01,-0.015]);	//3rd person camera
	//xyzmove4mat(worldCamera,[0,0,0.005]);	//forward camera
	
	
	drawWorldScene(frameTime, false);
	
	//draw target box ?
	//var activeShaderProgram = shaderProgramColored;
	var activeShaderProgram = shaderProgramDecal;
	gl.useProgram(activeShaderProgram);
	
	gl.disable(gl.DEPTH_TEST);	
	
	prepBuffersForDrawing(quadBuffers, activeShaderProgram);
	
	gl.activeTexture(gl.TEXTURE0);		//TODO put inside other function (prepbuffers) to avoid assigning then reassigning texture. should
										//retain texture info with other object info. also can avoid setting when unchanged.
	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);	

	//direction of flight
	if (playerVelVec[2] > 0.1){	//??
		gl.bindTexture(gl.TEXTURE_2D, hudTexturePlus);		//todo texture atlas for all hud 
		drawTargetDecal(0.001, [0.0, 0.5, 1.0, 0.5], playerVelVec);
	}
	gl.bindTexture(gl.TEXTURE_2D, hudTexture);	
	
	//drawTargetDecal(0.004, [1.0, 1.0, 0.0, 0.5], [0,0,0.01]);	//camera near plane. todo render with transparency
	if (guiParams["targeting"]!="off"){
		var shiftAmount = 1/muzzleVel;	//shift according to player velocity. 0.1 could be 1, but 
		drawTargetDecal(0.0037/(1+shiftAmount*playerVelVec[2]), [1.0, 1.0, 0.0, 0.5], [shiftAmount*playerVelVec[0],shiftAmount*playerVelVec[1],1+shiftAmount*playerVelVec[2]]);	//TODO vector add!
		
		if (guiParams.target.type!="none" && targetWorldFrame[2]<0){	//if in front of player){
			gl.bindTexture(gl.TEXTURE_2D, hudTextureBox);				
			drawTargetDecal(0.001, [1, 0.1, 0, 0.5], targetWorldFrame);	//direction to target (shows where target is on screen)
								//TODO put where is on screen, not direction from spaceship (obvious difference in 3rd person)
			gl.bindTexture(gl.TEXTURE_2D, hudTextureSmallCircles);	
			//drawTargetDecal(0.0008, [1, 0.1, 1, 0.5], selectedTargeting);	//where should shoot in order to hit target (accounting for player velocity)
				//not required if using shifted gun direction circle
		
			//drawTargetDecal(0.0006, [1, 1, 1, 1], targetingResultOne);
			//drawTargetDecal(0.0006, [0, 0, 0, 1], targetingResultTwo);
		}
	}
	
	//show where guns will shoot
	if (fireDirectionVec[2] > 0.1){	//??
		gl.bindTexture(gl.TEXTURE_2D, hudTextureX);
		drawTargetDecal(0.001, [1.0, 1.0, 0.0, 0.5], fireDirectionVec);
	}
	
	function drawTargetDecal(scale, color, pos){
			//scale*= 0.01/pos[2];
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [scale,scale,scale]);
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, color);
			mat4.identity(mvMatrix);
			xyzmove4mat(mvMatrix,[0.01*pos[0]/pos[2],0.01*pos[1]/pos[2],0.01]);
			drawObjectFromPreppedBuffers(quadBuffers, activeShaderProgram);
	}
	
	
	gl.disable(gl.BLEND);
	gl.enable(gl.DEPTH_TEST);
	
	currentWorld = saveWorld;
}

var mainCamFov = 105;	//degrees.
function setProjectionMatrix(pMatrix, vFov, ratio, polarity){
	mat4.identity(pMatrix);
	
	var fy = Math.tan((Math.PI/180.0)*vFov/2);
	
	pMatrix[0] = ratio/fy ;
	pMatrix[5] = 1.0/fy;
	pMatrix[11]	= -1;	//rotate w into z.
	pMatrix[14] = -0.0001;	//smaller = more z range. 1/50 gets ~same near clipping result as stereographic/perspective 0.01 near
	pMatrix[10]	= 0;
	pMatrix[15] = 0;
}

var usePrecalcCells=true;	//TODO REMOVE ??
var currentWorld=0;

function drawWorldScene(frameTime, isCubemapView) {
		
	var colorsSwitch = ((isCubemapView && guiParams.reflector.isPortal)?1:0)^currentWorld;
	
	var localVecFogColor = worldColors[colorsSwitch];
	var localVecReflectorColor = guiParams.reflector.isPortal? worldColors[1-colorsSwitch]: worldColors[colorsSwitch];
	var localVecReflectorDiffColor = [ localVecReflectorColor[0]-localVecFogColor[0],
										localVecReflectorColor[1]-localVecFogColor[1],
										localVecReflectorColor[2]-localVecFogColor[2]];	//todo use a vector class!
	
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
	var dropLightPos2;	//reflected light
	if (!guiParams["drop spaceship"]){
		dropSpaceship();	//note this is a bit poorly named and inefficient - when spaceship attached to camera,
	}						//in drawspaceship, are just doing invertedWorldCamera*worldCamera = identity
	//get light pos in frame of camera. light is at spaceship
	var lightMat = mat4.create();	//TODO mat*mat is unnecessary - only need to do dropLightPos = sshipMatrix*lightPosInWorld 
	mat4.set(invertedWorldCamera, lightMat);
	
	var sshipMatrixShifted = mat4.create();	//TODO permanent/reuse (code duplicated from elsewhere.
	mat4.set(sshipMatrix, sshipMatrixShifted)
	xyzmove4mat(sshipMatrixShifted, moveAwayVec);
	
	mat4.multiply(lightMat, sshipMatrixShifted);
	dropLightPos = [lightMat[12], lightMat[13], lightMat[14], lightMat[15]];
	
	mat4.set(invertedWorldCamera, lightMat);
	
	var dropLightReflectionInfo={};
	calcReflectionInfo(sshipMatrixShifted,dropLightReflectionInfo);
	mat4.multiply(lightMat, dropLightReflectionInfo.shaderMatrix2);
	dropLightPos2 = [lightMat[12], lightMat[13], lightMat[14], lightMat[15]];
	
	//var activeShaderProgram = shaderProgramColored;	//draw spheres
	var activeShaderProgram = shaderProgramTexmap;	//draw cubes
	//gl.enableVertexAttribArray(1);	//do need tex coords

	gl.useProgram(activeShaderProgram);
		
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
	gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	
	var boxSize = 0.1;
	var boxRad = boxSize*Math.sqrt(3);
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [boxSize,boxSize,boxSize]);
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	if (activeShaderProgram.uniforms.uDropLightPos2){
		gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos2, dropLightPos2);
	}
	
	var numBallsInRing = 16;
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
		prepBuffersForDrawing(cubeBuffers, shaderProgramTexmap);
		xmove4mat(mvMatrix, startAng);
		for (var ii=0;ii<numBallsInRing;ii++){
			xmove4mat(mvMatrix, angleStep);
			if (frustrumCull(mvMatrix,boxRad)){
				drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
			}
		}
	}
	
	var numRandomBoxes = guiParams['random boxes'].number;
	
	if (numRandomBoxes>0){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.9, 0.9, 1.0, 0.9]);
		
		boxSize = guiParams['random boxes'].size;
		boxRad = boxSize*Math.sqrt(3);
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [boxSize,boxSize,boxSize]);
		
		var criticalWPos = Math.cos(Math.atan(guiParams.reflector.scale) + Math.atan(boxRad));
		
		numRandomBoxes = Math.min(randomMats.length, numRandomBoxes);	//TODO check this doesn't happen/ make obvious error!
		
		prepBuffersForDrawing(cubeBuffers, shaderProgramTexmap);
		for (var ii=0;ii<numRandomBoxes;ii++){
			var thisMat = randomMats[ii];
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, thisMat);
			if (thisMat[15]>criticalWPos){continue;}	//don't draw boxes too close to portal
			if (frustrumCull(mvMatrix,boxRad)){
				drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
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
			//cellMatDataSortable.d8,
			(guiParams["culling"] ? Math.sqrt(3): false),
			drawCubeFrame
		);	
	}
	
	
	if (guiParams["draw 16-cell"]){
		var cellScale = 4/Math.sqrt(6);		//in the model, vertices are 0.75*sqrt(2) from the centre, and want to scale to tan(PI/3)=sqrt(3)
		
		cellScale*=guiParams["16-cell scale"];
		
		//var moveAmount = Math.PI/3;	
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [cellScale,cellScale,cellScale]);
		
		drawArrayOfModels(
			//[cellMatData.d16[0]],
			cellMatData.d16,
			(guiParams["culling"] ? 1.73: false),
			drawTetraFrame
		);
	}
	
	
	if (guiParams["draw 24-cell"]){
		modelScale = 1.0;
		modelScale*=guiParams["24-cell scale"];
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
	
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
		prepBuffersForDrawing(dodecaFrameBuffers, shaderProgramTexmap);
		var cullVal =  dodecaScale*(0.4/0.515);
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [dodecaScale,dodecaScale,dodecaScale]);
		drawArrayOfModels(
			cellMatData.d120,
			//cellMatDataSortable.d120,
			(guiParams["culling"] ? cullVal: false),
			function(){
				drawObjectFromPreppedBuffers(dodecaFrameBuffers, shaderProgramTexmap);
			}
		);
	}
	
	//sort 600-cell or not??
	//first, check can get distance from camera, use this to set colour of cell.
	
	
	if (guiParams["draw 600-cell"]){		
		prepBuffersForDrawing(tetraFrameBuffers, shaderProgramTexmap);
		var myscale=0.3855;	//todo use correct scale
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
			var numCells = cellMats.length;
			for (cc in cellMats){
				var thisCell = cellMats[cc];
				
				/*
				var distance = 0;	//simplest if sum of squares. better might be dot product with camera "position".
					var camPos = [mvMatrix[12],mvMatrix[13],mvMatrix[14],mvMatrix[15]];
					var cellPos = [mvMatrix[12],mvMatrix[13],mvMatrix[14],mvMatrix[15]];
					for (cc=0;cc<4;cc++){
						distance +=someDirection[cc]*cellMats
					}
				*/	

				
				mat4.set(invertedWorldCamera, mvMatrix);	//TODO don't need to set this if culled.
				mat4.multiply(mvMatrix,thisCell);
		
				//actually might get the "distance" for free here in mvMatrix...
		//	var sortOfDistance = mvMatrix[15] * 0.5 + 0.5;	//guess index
			var sortOfDistance =cc/numCells;			//set colour proportional to place in array
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, [sortOfDistance, 1.0-sortOfDistance, sortOfDistance, 1.0]);
					//TODO use this to sort draw calls 
		
				
		
				drawFunc2();
			}
		}
		
		//console.log("num drawn: " + numDrawn);
	}
	
	activeShaderProgram = shaderProgramTexmap4Vec;
	gl.useProgram(activeShaderProgram);
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
	gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos2, dropLightPos2);
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 1.0, 1.0]);
	var duocylinderObj = duocylinderObjects[guiParams.duocylinderModel];
	if (guiParams.drawShapes['x*x+y*y=z*z+w*w']){
		mat4.set(invertedWorldCamera, mvMatrix);
		drawTennisBall(duocylinderObj);
	}
	if (guiParams.drawShapes['x*x+w*w=y*y+z*z']){
		mat4.set(invertedWorldCamera, mvMatrix);
		rotate4mat(mvMatrix, 0, 2, Math.PI*0.5);
		drawTennisBall(duocylinderObj);
	}
	if (guiParams.drawShapes['x*x+z*z=y*y+w*w']){
		mat4.set(invertedWorldCamera, mvMatrix);
		rotate4mat(mvMatrix, 0, 3, Math.PI*0.5);
		drawTennisBall(duocylinderObj);
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
	
	
	//draw objects without textures
	
	activeShaderProgram = shaderProgramColored;
	gl.useProgram(activeShaderProgram);
	
	gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0,0]);	//no emmision
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	if (activeShaderProgram.uniforms.uDropLightPos2){
		gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos2, dropLightPos2);
	}
	//gl.disableVertexAttribArray(1);	//don't need texcoords
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.4, 0.4, 0.8, 1.0]);	//BLUE
	gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0.1,0.3]);	//some emission
	modelScale = guiParams["teapot scale"];
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);

	
	//TODO this only 
	//if (activeShaderProgram.uniforms.uReflectorPos){
		gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
		gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	//}
	
	/*
	if (guiParams["draw teapot"]){
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,teapotMatrix);		
		drawObjectFromBuffers(teapotBuffers, shaderProgramColored);
	}
	*/
	
	if (guiParams["draw teapot"]){		
		prepBuffersForDrawing(teapotBuffers, shaderProgramColored);
		var myscale=0.2;	//todo use correct scale
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [myscale,myscale,myscale]);
		
		drawArrayOfModels(
			mvMatrix[15]>0 ? cellMatData.d600 : cellMatData.d600reverse,	//choose better ordering. (camera direction maybe also helpful, but this better than just using distance from portal in all cases. TODO 8 (x+,x-, y+, ... -  4 (x,y,z,y) with reverses) or 16 (++++, +++-, ++-+ etc - 8 with reverses) lists. pick whichever closest to current position.
			//actually - for cells we can get very good ordering for free! - just determine which cell player object is in, then order bunch of cells about that as origin! (even better to orient for which face of cell closest too, but unimportant 
			(guiParams["culling"] ? 0.2: false),
			function(){
				drawObjectFromPreppedBuffers(teapotBuffers, shaderProgramColored);
			}
		);
	}
	
	
	
	var drawFunc = guiParams["draw spaceship"]? drawSpaceship : drawBall;
	
	//TODO permanent
	var sshipMatrixShifted = mat4.create();
	mat4.set(sshipMatrix, sshipMatrixShifted)
	
	//MOVE MODEL AWAY FROM PORTAL.
	//in order to jump camera across portal to avoid too close rendering issues (z-buffer)
	//should do this for everything! (maybe nicer to use special (inv)cameraMatrix ?)
	//likely sufficient to just do for camera and spaceship initially.
	//what to do about lights, bullets etc consider later.
	//basically idea is to move everything in the same direction - along line of portal to camera.
	//conceivably current code will only work for objects near camera. TODO test.
	
	xyzmove4mat(sshipMatrixShifted, moveAwayVec);
	
	drawFunc(sshipMatrixShifted);
	
	if (checkWithinReflectorRange(sshipMatrixShifted, Math.tan(Math.atan(reflectorInfo.rad) +0.1))){
		var portaledMatrix = mat4.create();
		mat4.set(sshipMatrixShifted, portaledMatrix);
		moveMatrixThruPortal(portaledMatrix, reflectorInfo.rad, 1);
	
		drawFunc(portaledMatrix, sshipMatrixShifted);
	}	
	
	function drawSpaceship(matrix, matrixForTargeting){
		modelScale=0.0002;
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.2, 0.2, 0.2, 1.0]);	//DARK
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0,0]);
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		
		mat4.multiply(mvMatrix,matrix);		
		drawObjectFromBuffers(sshipBuffers, shaderProgramColored);
		
		//draw guns
		var gunScale = 50*modelScale;
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [gunScale,gunScale,gunScale]);
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.3, 0.3, 0.3, 1.0]);	//GREY
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [gunHeat/15,gunHeat/30,gunHeat/45]);
														
		var gunHoriz = 20*modelScale;
		var gunVert = 10*modelScale;
		var gunFront = 5*modelScale;

		var mousP=mouseInfo.currentPointingDir;
		
		var gunAngRangeRad = 0.35;
		
		//default (no targeting) - guns unrotated, point straight ahead.
		rotvec = [0,0,0];
		
		matrixForTargeting = matrixForTargeting || matrix;
		
		if (guiParams.target.type!="none" && guiParams["targeting"]!="off"){
			//rotvec = getRotBetweenMats(matrixForTargeting, targetMatrix);	//target in frame of spaceship.
			var targetingSolution = getTargetingSolution(matrixForTargeting, targetMatrix);
			rotvec = targetingSolution.rotvec;
			targetingResultOne = targetingSolution.results[0];
			targetingResultTwo = targetingSolution.results[1];
			selectedTargeting = targetingSolution.selected;
			targetWorldFrame = targetingSolution.targetWorldFrame;
		}
		
		gunMatrices=[];
		drawRelativeToSpacehip([gunHoriz,gunVert,gunFront]); //left, down, forwards
		drawRelativeToSpacehip([-gunHoriz,gunVert,gunFront]);
		drawRelativeToSpacehip([-gunHoriz,-gunVert,gunFront]);
		drawRelativeToSpacehip([gunHoriz,-gunVert,gunFront]);
		
		
		
		
		function drawRelativeToSpacehip(vec){
			var gunMatrixCosmetic = mat4.create();
			mat4.set(matrix, gunMatrixCosmetic);
			xyzmove4mat(gunMatrixCosmetic,vec);
			
			var gunMatrix = mat4.create();
			mat4.set(matrixForTargeting, gunMatrix);
			xyzmove4mat(gunMatrix,vec);
			
			
			if (guiParams.target.type!="none" && guiParams["targeting"]=="individual"){
				rotvec = getTargetingSolution(gunMatrix, targetMatrix).rotvec;
			}
			
			//rotate guns to follow mouse
			xyzrotate4mat(gunMatrixCosmetic, rotvec);		
				
			xyzmove4mat(gunMatrixCosmetic,[0,0,25*modelScale]);	//move forwards
			gunMatrices.push(gunMatrixCosmetic);
		
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,gunMatrixCosmetic);
			
			drawObjectFromBuffers(gunBuffers, shaderProgramColored);
		}
		
		function capGunPointing(pointingDir){
			//scale such that z=1 - then can cap angle, ensures guns point forward. (TODO handle case that z=0)
			pointingDir={x:-pointingDir.x/pointingDir.z, 
					y:-pointingDir.y/pointingDir.z, z:1
				}
			
			var sqDist = pointingDir.x*pointingDir.x + pointingDir.y*pointingDir.y;
			if (sqDist>gunAngRangeRad*gunAngRangeRad){
				pointingDir.z = Math.sqrt(sqDist)/gunAngRangeRad;
			}
			
			//shouldn't need, but seems like z value unused / assumed to be 1
			//TODO neater
			pointingDir={x:pointingDir.x/pointingDir.z, 
					y:pointingDir.y/pointingDir.z, z:1
				};
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
		
		
		function getTargetingSolution(matrixForTargeting, targetMatrix, logStuff){

			//TODO not use globals for these. need to hook up with rendering code
			var targetWorldFrame=[];
			var targetingResultOne=[];
			var targetingResultTwo=[];
			var selectedTargeting="none";

			var rotvec=[0,0,0];

			//solve accounting for launch velocity
			//get position of target in frame of player. can then plot this on screen.
			//unit vector of this is "targetWorldFrame"
			//then the gun velocity (in frame of player) should be (see paper calculations, 2018-07-25)
			// t = targetWorldFrame
			// v= playervel
			// m= muzzle speed
			// g= muzzle velocity
			
			// g = t (t.v (+/-) sqrt(v.v - (t.v)^2 + m*m )) - v
			//should confirm that |g| = m
			//depending if part in sqrt is +ve or -ve, have 2 or 0 solutions (for the +/- bit in the sqrt).
				//+ve has greater velocity, so gets there quicker
			//should pick 1st if guns can rotate to that direction, else 2nd if guns can get there, else no solution.
			
			//first get target direction in frame of screen.
			var targetPos = [targetMatrix[12],targetMatrix[13],targetMatrix[14],targetMatrix[15]];
			for (var ii=0;ii<4;ii++){
				var total=0;
				for (var jj=0;jj<4;jj++){
					total+=matrixForTargeting[ii*4+jj]*targetPos[jj];
				}
				targetWorldFrame[ii]=total;
			}
			//normalise x,y,z parts of to target vector.
			var length = Math.sqrt(1-targetWorldFrame[3]*targetWorldFrame[3]);	//TODO ensure not 0. can combo with range check.
			
			targetWorldFrame = targetWorldFrame.map(function(val){return val/length;});	//FWIW last value unneeded
			
			//confirm tWF length 1? 
			var lensqtwf=0;
			for (var ii=0;ii<3;ii++){
				lensqtwf += targetWorldFrame[ii]*targetWorldFrame[ii];
			}
			
			var playerVelVecMagsq = playerVelVec.reduce(function(total, val){return total+ val*val;}, 0);	//v.v
						//todo reuse code or result (copied from elsewhere)
			var tDotV = playerVelVec.reduce(function(total, val, ii){return total+ val*targetWorldFrame[ii];}, 0);
			var inSqrtBracket =  tDotV*tDotV + muzzleVel*muzzleVel -playerVelVecMagsq;
			
			//console.log(inSqrtBracket);
			
			var sqrtResult = inSqrtBracket>0 ? Math.sqrt(inSqrtBracket): 0;	//TODO something else for 0 (no solution)
			//console.log(sqrtResult);
			
			for (var ii=0;ii<3;ii++){
				targetingResultOne[ii] = targetWorldFrame[ii]*(tDotV + sqrtResult) - playerVelVec[ii];
				targetingResultTwo[ii] = targetWorldFrame[ii]*(tDotV - sqrtResult) - playerVelVec[ii];
			}
			//check lengths of these = muzzle vel sq
			var targetingResultOneLengthSq = targetingResultOne.reduce(function(total, val){return total+ val*val;}, 0);
			var targetingResultTwoLengthSq = targetingResultTwo.reduce(function(total, val){return total+ val*val;}, 0);

			//select a result.
			//appears to in practice pick solution 2, which seems to be correct result
			//todo find if can just dump solution 1. 
			var selectedTargetingString;
			if (targetingResultOne[2]>0){
				selectedTargeting = targetingResultOne;
				selectedTargetingString = "ONE";
			}else if(targetingResultTwo[2]>0){
				selectedTargeting = targetingResultTwo;
				selectedTargetingString = "TWO";
			}else{
				selectedTargeting = "none";
				selectedTargetingString = "NONE";
			}
			//TODO check that angle isn't too extreme.
			
			//if (targetWorldFrame[2] > 0){	//behind player
			if (targetWorldFrame[2] > -0.85 ||	//appears to check that within a cone in front of player. works because this vector is was normalised 
												//is direction towards target)
				targetWorldFrame[3] < -0.5){	//exclude beyond some distance (w=1 close, w=-1 opposite side of 3-sphere)								
					selectedTargeting = "none";
					selectedTargetingString = "NONE";
			}
			
			if (logStuff){
				//console.log(targetingResultOneLengthSq);
				document.getElementById("info2").innerHTML = "lensqtwf: " + lensqtwf + "<br/>" +
												"targetWorldFrame[3]: " + targetWorldFrame[3] + "<br/>" +
												"sqrtResult: " + sqrtResult + "<br/>" +
												"targetingResultOneLengthSq: " + targetingResultOneLengthSq + "<br/>" +
												"targetingResultTwoLengthSq: " + targetingResultTwoLengthSq + "<br/>" +
												"selectedTargeting: " + selectedTargetingString;
			}
			
			//override original gun rotation code (todo delete previous/ option to disable/enable this correction)
			if (selectedTargeting!="none"){
				if (guiParams.target.type!="none" && guiParams["targeting"]!="off"){
					//rotvec = getRotBetweenMats(matrixForTargeting, targetMatrix);	//target in frame of spaceship.
					var pointingDir={x:selectedTargeting[0],y:selectedTargeting[1],z:selectedTargeting[2]};
					pointingDir = capGunPointing(pointingDir);					
					rotvec=getRotFromPointing(pointingDir);
					
					//override fireDirectionVec for hud purposes
					fireDirectionVec = [-pointingDir.x,-pointingDir.y,pointingDir.z].map(function(val){return val*muzzleVel;}); 
						//todo pointingdir simple vector!( not .x, .y, ,z)
					
						//redo adding player velocity (todo maybe combine with where do this elsewhere..)
						//ie guntargetingvec
						//todo solve targeting in mechanics loop - currently doing when drawing !!!!!!!!!!!!!!!!!!! stupid!
					fireDirectionVec = fireDirectionVec.map(function(val,ii){return val+playerVelVec[ii];});
						
				}
			}
			
			return {
				results:[targetingResultOne, targetingResultTwo],
				selected: selectedTargeting,
				rotvec:rotvec,
				targetWorldFrame:targetWorldFrame
			};
		}
		
	}
		
	function drawBall(matrix){
		//draw "light" object
		var sphereRad = 0.04;
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [sphereRad,sphereRad,sphereRad]);
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 1.0, 1.0]);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,	matrix);
		if (frustrumCull(mvMatrix,sphereRad)){
			drawObjectFromBuffers(sphereBuffers, shaderProgramColored);
		}
	}
	
	var targetRad=guiParams.target.scale;
	
	//var targetRad=0.02;
	//change radii to test that have right bounding spheres for various cells.
	//targetRad=Math.sqrt(3);		//8-cell
	//targetRad=100;
	//targetRad=0.4;	//empirically found for 120-cell
	//targetRad=0.41;	//for 600-cell
	//targetRad=1;		//24-cell
	//targetRad=1.73;			//16-cell
	//TODO find exact values and process to calculate ( either largest distance points from origin in model, or calculate)
	
	//draw object to be targeted by guns
	if (guiParams.target.type!="none"){
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,targetMatrix);
		switch (guiParams.target.type){
			case "sphere":
				if (frustrumCull(mvMatrix,targetRad)){	//normally use +ve radius
											//-ve to make disappear when not entirely inside view frustrum (for testing)
					gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [targetRad,targetRad,targetRad]);
					gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1, 0.2, 0.2, 1]);
					var emitColor = Math.sin(frameTime*0.01);
					//emitColor*=emitColor
					gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [emitColor, emitColor, emitColor/2]);	//YELLOW
					//gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0.5, 0.5, 0.5]);
					drawObjectFromBuffers(sphereBuffers, activeShaderProgram);
					//drawObjectFromBuffers(icoballBuffers, activeShaderProgram);
				}
				break;
			case "box":
				var boxRad = targetRad*Math.sqrt(3);
				if (frustrumCull(mvMatrix,boxRad)){
					var savedActiveProg = activeShaderProgram;	//todo push things onto a to draw list, 
																//minimise shader switching
					activeShaderProgram = shaderProgramTexmap;
					gl.useProgram(activeShaderProgram);
					gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [targetRad,targetRad,targetRad]);
					gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1, 1, 1, 1]);
					drawObjectFromBuffers(cubeBuffers, activeShaderProgram);
					activeShaderProgram = savedActiveProg;
					gl.useProgram(activeShaderProgram);
				}
				break;
		}
	}

	//DRAW PORTAL/REFLECTOR
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
		
		//gl.uniform4fv(activeShaderProgram.uniforms.uColor, [0.9, 0.9, 0.9, 1.0]);	//grey
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, [1.0, 1.0, 1.0, 1.0]);
		gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
		if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
		}
		if (activeShaderProgram.uniforms.uPlayerLightColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
		}

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
	
	//draw bullets
	var transpShadProg = shaderProgramColoredPerPixelTransparentDiscard;
	//var transpShadProg = shaderProgramColoredPerPixelDiscard;
	gl.useProgram(transpShadProg);
	
	prepBuffersForDrawing(sphereBuffers, transpShadProg);	
	targetRad=0.0125;
	gl.uniform3fv(transpShadProg.uniforms.uModelScale, [targetRad/25,targetRad/25,targetRad]);	//long streaks
	gl.uniform3fv(transpShadProg.uniforms.uEmitColor, [1.0, 1.0, 0.5]);	//YELLOW
	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA , gl.ONE);	
	gl.depthMask(false);
	
	for (var b in bullets){
		if (bullets[b].active){
			var bulletMatrix=bullets[b].matrix;
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,bulletMatrix);
			if (frustrumCull(mvMatrix,targetRad)){	
				drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			}
		}
	}
	
	for (var ee in explosions){
		var singleExplosion = explosions[ee];
	
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,singleExplosion.matrix);
		//var radius = singleExplosion.life*0.0002;
		var radius = (100-singleExplosion.life)*0.0003;
		//var radius = (100-singleExplosion.life)*0.00005; //small for collision detection testing
		var opac = 0.01*singleExplosion.life;
		if (frustrumCull(mvMatrix,radius)){	
				//TODO check is draw order independent transparency
			gl.uniform3fv(transpShadProg.uniforms.uEmitColor, [opac, opac/2, opac/4]);
			gl.uniform3fv(transpShadProg.uniforms.uModelScale, [radius,radius,radius]);
			drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
		}
		singleExplosion.life-=0.1;
		//singleExplosion.life-=0.01;	//slow for collision detection testing
		if (singleExplosion.life<1){
			delete explosions[ee];
		}
	}
	
	//muzzle flash? 
	for (var gg in gunMatrices){
		//if (gg>0) continue;
		var mfRad = 0.01;
		var flashAmount = muzzleFlashAmounts[gg]
		gl.uniform3fv(transpShadProg.uniforms.uEmitColor, [flashAmount, flashAmount/2, flashAmount/4]);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,gunMatrices[gg]);
		xyzmove4mat(mvMatrix,[0,0,0.015]);

		for (var xx=0;xx<3;xx++){	//nested spheres
			gl.uniform3fv(transpShadProg.uniforms.uModelScale, [mfRad/5,mfRad/5,mfRad]);
			drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			mfRad-=.0005;
		}
	}
	
	gl.depthMask(true);
	gl.disable(gl.BLEND);
	
	//gl.useProgram(shaderProgramColored);
	//gl.uniform3fv(shaderProgramColored.uniforms.uEmitColor, [0, 0, 0]);

}


var explosions ={};		//todo how to contain this? eg should constructor be eg explosions.construct()? what's good practice?
var Explosion=function(){
	var nextExplId = 0;
	return function(matrix){
		this.matrix = matrix;
		this.life=100;
		explosions[nextExplId]=this;
		nextExplId+=1;
	}
}();


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


function drawTennisBall(duocylinderObj){

	//gl.disable(gl.CULL_FACE);
	gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgramTexmap4Vec.attributes.aVertexPosition, duocylinderObj.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.normalBuffer);
    gl.vertexAttribPointer(shaderProgramTexmap4Vec.attributes.aVertexNormal, duocylinderObj.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgramTexmap4Vec.attributes.aTextureCoord, duocylinderObj.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, duocylinderObj.vertexIndexBuffer);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, duocylinderObj.tex);
	gl.uniform1i(shaderProgramTexmap4Vec.uniforms.uSampler, 0);
	
	//for (var side=0;side<2;side++){	//TODO should only draw 1 side - work out which side player is on...
	for (var side=0;side<1;side++){	//TODO should only draw 1 side - work out which side player is on...
		for (var xg=0;xg<duocylinderObj.divs;xg+=1){		//
			for (var yg=0;yg<duocylinderObj.divs;yg+=1){	//TODO precalc cells array better than grids here.
				//chequerboard
				if ((xg+yg) % 2){
				//if (true){
					setMatrixUniforms(shaderProgramTexmap4Vec);
					gl.drawElements(gl.TRIANGLES, duocylinderObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				}
				rotate4mat(mvMatrix, 0, 1, duocylinderObj.step);
			}
			rotate4mat(mvMatrix, 2, 3, duocylinderObj.step);
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
	//gl.enable(gl.CULL_FACE);
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
var moveAwayVec;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var playerCamera = mat4.create();
var playerCameraInterp = mat4.create();
var offsetPlayerCamera = mat4.create();

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

var randomMats = [];	//some random poses. used for "dust motes". really only positions required, but flexible, can use for random boxes/whatever 

function setupScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	for (var ii=0;ii<1000;ii++){
		randomMats.push(convert_quats_to_4matrix(random_quat_pair()));
	}
	
	mat4.identity(playerCamera);	//not sure why have 2 matrices here...
	//bung extra quaternion stuff onto this for quick test
	playerCamera.qPair = [[1,0,0,0],[1,0,0,0]];
	
	//start player off outside of boxes
	xyzmove4mat(playerCamera,[0,0.7,-1.0]);
	
	targetMatrix = cellMatData.d16[0];
}

var texture,hudTexture,hudTextureSmallCircles,hudTexturePlus,hudTextureX,hudTextureBox;

function initTexture(){
	texture = makeTexture("img/0033.jpg");
	hudTexture = makeTexture("img/circles.png");
	hudTextureSmallCircles = makeTexture("img/smallcircles.png");
	hudTexturePlus = makeTexture("img/plus.png");
	hudTextureX = makeTexture("img/x.png");
	hudTextureBox = makeTexture("img/box.png");
	duocylinderObjects.grid.tex = makeTexture("img/grid-omni.png");
	duocylinderObjects.terrain.tex = makeTexture("data/terrain/turbulent-seamless.png");;
	
	//texture = makeTexture("img/ash_uvgrid01-grey.tiny.png");	//numbered grid
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
	lastPointingDir:{},
	currentPointingDir:{x:0,y:0,z:1,w:1}
};
var stats;

var guiParams={
	duocylinderModel:"grid",
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
	'random boxes':{
		number:0,
		size:0.02
	},
	"draw 5-cell":false,
	"subdiv frames":true,
	"draw 8-cell":true,
	"8-cell scale":1.0,		//0.5 to tesselate
	"draw 16-cell":false,
	"16-cell scale":1,		//1 to tesselate
	"draw 24-cell":false,
	"24-cell scale":1,
	"draw 120-cell":false,
	"draw 600-cell":false,	//todo something wierd hapens if initially set to draw teapots only (some gl call not set???)
	"draw teapot":false,
	"teapot scale":0.7,
	"draw spaceship":true,
	"drop spaceship":false,
	target:{
		type:"sphere",
		scale:0.03
	},
	"targeting":"off",
	"culling":true,
	"perPixelLighting":true,
	//fogColor0:'#506050',
	fogColor0:'#ffffff',
	fogColor1:'#ff8888',
	playerLight:'#ffffff',
	onRails:false,
	cameraType:"near 3rd person",
	cameraFov:105,
	reflector:{
		draw:true,
		update:true,
		mappingType:'vertex projection',
		scale:0.5,
		isPortal:true,
		moveAway:0.0008
	}
};
var worldColors=[];
var playerLightUnscaled;
var playerLight;
var muzzleFlashAmounts=[0,0,0,0];
var teapotMatrix=mat4.create();mat4.identity(teapotMatrix);
xyzmove4mat(teapotMatrix,[0,1.85,0]);
var sshipMatrix=mat4.create();mat4.identity(sshipMatrix);
var targetMatrix=mat4.create();mat4.identity(targetMatrix);
var targetWorldFrame=[];
var targetingResultOne=[];
var targetingResultTwo=[];
var selectedTargeting="none";
var bullets=[];
var gunMatrices=[];
var canvas;
function init(){

	stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );

	var gui = new dat.GUI();
	gui.addColor(guiParams, 'fogColor0').onChange(function(color){
		setFog(0,color);
	});
	gui.addColor(guiParams, 'fogColor1').onChange(function(color){
		setFog(1,color);
	});
	gui.addColor(guiParams, 'playerLight').onChange(function(color){
		setPlayerLight(color);
	});
	var drawShapesFolder = gui.addFolder('drawShapes');
	drawShapesFolder.add(guiParams, "duocylinderModel", ["grid","terrain"] );
	for (shape in guiParams.drawShapes){
		console.log(shape);
		drawShapesFolder.add(guiParams.drawShapes, shape );
	}
	var randBoxesFolder = drawShapesFolder.addFolder("random boxes");
	randBoxesFolder.add(guiParams["random boxes"],"number",0,1000,50);
	randBoxesFolder.add(guiParams["random boxes"],"size",0.01,0.05,0.01);
	
	var polytopesFolder = gui.addFolder('polytopes');
	polytopesFolder.add(guiParams,"draw 5-cell");
	polytopesFolder.add(guiParams,"draw 8-cell");
	polytopesFolder.add(guiParams,"8-cell scale",0.05,2.0,0.05);
	polytopesFolder.add(guiParams,"draw 16-cell");
	polytopesFolder.add(guiParams,"16-cell scale",0.05,2.0,0.05);
	polytopesFolder.add(guiParams,"subdiv frames");
	polytopesFolder.add(guiParams,"draw 24-cell");
	polytopesFolder.add(guiParams,"24-cell scale",0.05,2.0,0.05);
	polytopesFolder.add(guiParams,"draw 120-cell");
	polytopesFolder.add(guiParams,"draw 600-cell");
	gui.add(guiParams,"draw teapot");
	gui.add(guiParams,"teapot scale",0.2,2.0,0.05);
	gui.add(guiParams,"draw spaceship",true);
	gui.add(guiParams, "drop spaceship",false);
	
	var targetFolder = gui.addFolder('target');
	targetFolder.add(guiParams.target, "type",["none", "sphere","box"]);
	targetFolder.add(guiParams.target, "scale",0.005,0.1,0.005);
	
	gui.add(guiParams, "targeting", ["off","simple","individual"]);
	gui.add(guiParams, "onRails");
	gui.add(guiParams, "cameraType", ["cockpit", "near 3rd person", "far 3rd person"]);
	gui.add(guiParams, "cameraFov", 60,120,5);
	gui.add(guiParams, "perPixelLighting");
	gui.add(guiParams, "culling");
	var reflectorFolder = gui.addFolder('reflector');
	reflectorFolder.add(guiParams.reflector, "draw");
	reflectorFolder.add(guiParams.reflector, "update");
	reflectorFolder.add(guiParams.reflector, "mappingType", ['projection', 'vertex projection']);
	reflectorFolder.add(guiParams.reflector, "scale", 0.5,2,0.01);
	reflectorFolder.add(guiParams.reflector, "isPortal");
	reflectorFolder.add(guiParams.reflector, "moveAway", 0,0.001,0.0001);	//value required here is dependent on minimum scale. TODO moveawayvector should be in DIRECTION away from portal, but fixed length.

	window.addEventListener("keydown",function(evt){
		//console.log("key pressed : " + evt.keyCode);
		var willPreventDefault=true;
		switch (evt.keyCode){	
			case 84:	//T
				//xyzmove4mat(playerCamera,[0.01,0.0,0.01]);	//diagonally forwards/left
				break;
			case 70:	//F
				goFullscreen(canvas);
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
			var rotateAmt = [crossProd.x / crossProd.w, -crossProd.y / crossProd.w, -crossProd.z / crossProd.w];
			rotatePlayer(rotateAmt);
			
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
	setFog(0,guiParams.fogColor0);
	setFog(1,guiParams.fogColor1);
	setPlayerLight(guiParams.playerLight);
    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	//gl.disable(gl.DEPTH_TEST);
	setupScene();
	requestAnimationFrame(drawScene);
	
	function setFog(world,color){
		var r = parseInt(color.substring(1,3),16) /255;
		var g = parseInt(color.substring(3,5),16) /255;
		var b = parseInt(color.substring(5,7),16) /255;
		worldColors[world]=[r,g,b,1];
	}
	function setPlayerLight(color){
		var r = parseInt(color.substring(1,3),16) /255;
		var g = parseInt(color.substring(3,5),16) /255;
		var b = parseInt(color.substring(5,7),16) /255;
		playerLightUnscaled=[r,g,b];
	}
}

var playerVelVec = [0,0,0];	//TODO use matrix/quaternion for this
							//todo not a global! how to set listeners eg mousemove witin iteratemechanics???
var fireDirectionVec = [0,0,1];	//TODO check if requried to define something here
var muzzleVel = 10;
							
var testInfo="";

//tetrahedron planes for collision check
var tetraPlanesToCheck = [];
tetraPlanesToCheck.push([0,Math.sqrt(3),0]);
tetraPlanesToCheck.push([0,-1/Math.sqrt(3),-2*Math.sqrt(2/3)]);
tetraPlanesToCheck.push([Math.sqrt(2),-1/Math.sqrt(3),Math.sqrt(2/3)]);
tetraPlanesToCheck.push([-Math.sqrt(2),-1/Math.sqrt(3),Math.sqrt(2/3)]);

var tetraInnerPlanesToCheck = [];
var innerPlaneScale = 0.666*Math.sqrt(2);	//found by trial/error

//inner plane directions - tetraPlanes basically defined by points of tetrahedron
//for inner planes for that face, take difference between centre of face (effectively -1/3*point) to other 3 points.

for (var ii=0;ii<4;ii++){
	var oppPoint = tetraPlanesToCheck[ii];
	var centrePoint=[];
	for (var jj=0;jj<3;jj++){
		centrePoint.push(-0.333*oppPoint[jj]);
	}
	var innerPlanes=[];
	for (var kk=1;kk<4;kk++){
		var innerPlane=[];
		var otherIdx = (ii+kk)%4;
		var otherPlane = tetraPlanesToCheck[otherIdx];
		for (var jj=0;jj<3;jj++){
			innerPlane.push( (otherPlane[jj]-centrePoint[jj])*innerPlaneScale );
		}
		innerPlanes.push(innerPlane);
	}
	tetraInnerPlanesToCheck.push(innerPlanes);
}

//move outside since used in collision and drawing (TODO collide/draw methods on dodeca object)
var dodecaScale=0.515;	//guess TODO use right value (0.5 is too small)

var dodecaPlanesToCheck = [];
var dodecaDirs = [];	//a,b - really these are orthoganal directions with dodecaPlanesToCheck vectors. todo combo into matrix.
dodecaPlanesToCheck.push([0,1,0]);
dodecaDirs.push([[1,0,0],[0,0,1]]);
var yValDirection = 1/Math.sqrt(5);
var xzValDirection = 2*yValDirection;
for (var ang=0;ang<5;ang++){
	var angRad = ang*Math.PI/2.5;
	dodecaPlanesToCheck.push([xzValDirection*Math.cos(angRad), yValDirection, xzValDirection*Math.sin(angRad)]);
	dodecaDirs.push([[-yValDirection*Math.cos(angRad),xzValDirection, -yValDirection*Math.sin(angRad)], [Math.sin(angRad),0,-Math.cos(angRad)]]);
}

var iterateMechanics = (function iterateMechanics(){
	var lastTime=(new Date()).getTime();
	var moveSpeed=0.00015;
	var rotateSpeed=-0.0005;
	var bulletSpeed=0.001;
	
	var playerVelVecBodge=[];
	
	var playerAngVelVec = [0,0,0];
	
	var timeTracker =0;
	var timeStep = 10;
	
	var thrust = 0.02;	//TODO make keyboard/gamepad fair! currently thrust, moveSpeed config independent!
	
	//gamepad
	var activeGp, buttons, axes;
	var deadZone = 0.15;	//for thumbsticks
	
	var autoFireCountdown=0;
	//var autoFireCountdownStartVal=6;
	var autoFireCountdownStartVal=1;
	var lastPlayerAngMove = [0,0,0];	//for interpolation
	
	//TODO stick reused functions here???
	
	
	return function(){
		//GAMEPAD
		activeGp=false;
		//basic gamepad support
		
		//oculus touch controllers are recognised as controllers.
		//to work around, abuse fact that these don't have 10th button.
		//find the 1st gamepad with button 10.

		var gpads=navigator.getGamepads();
		if (gpads){
			for (gg in gpads){
				thisgp = gpads[gg];
				if (thisgp && thisgp.buttons && thisgp.buttons[10] && thisgp.axes){
					activeGp = thisgp;
					break;
				}
			}
		}
		//TODO handle choosing one of multiple gamepads and keeping that gamepad selected.
		
		if (activeGp){	
			buttons = activeGp.buttons;
			//buttons 0 to 15, on xbox controller are:
			//A,B,X,Y
			//L1,R1,L2,R2,
			//BACK,START,
			//L3,R3,	(analog values)
			//d-pad u,d,l,r
			//button 16? don't know (there is a central xbox button but does nothing)
			
			axes = activeGp.axes;
			
			//axes for xbox controller:
			//left thumbstick left(-1) to right(+1)
			//left thumbstick up(-1) to down(+1)
			//right thumbstick left(-1) to right(+1)
			//right thumbstick up(-1) to down(+1)
		}
		
		
		var nowTime = (new Date()).getTime();
		var timeElapsed = Math.min(nowTime - lastTime, 50);	//ms. 50ms -> slowdown if drop below 20fps 
		//console.log("time elapsed: " + timeElapsed);
		lastTime=nowTime;
		
		timeTracker+=timeElapsed;
		var numSteps = Math.floor(timeTracker/timeStep);
		timeTracker-=numSteps*timeStep;
		for (var ii=0;ii<numSteps;ii++){
			stepSpeed();
			gunHeat*=0.995;
			offsetCam.iterate();
		}
		
		function stepSpeed(){	//TODO make all movement stuff fixed timestep (eg changing position by speed)
		
			playerVelVec[0]+=thrust*(keyThing.keystate(65)-keyThing.keystate(68)); //lateral
			playerVelVec[1]+=thrust*(keyThing.keystate(32)-keyThing.keystate(220)); //vertical
			playerVelVec[2]+=thrust*(keyThing.keystate(87)-keyThing.keystate(83)); //fwd/back
			
			playerAngVelVec[0]+=keyThing.keystate(40)-keyThing.keystate(38); //pitch
			playerAngVelVec[1]+=keyThing.keystate(39)-keyThing.keystate(37); //turn
			playerAngVelVec[2]+=keyThing.keystate(69)-keyThing.keystate(81); //roll
			
			if (activeGp){
				//TODO move calculation of total input from keys/gamepad outside this loop
				var gpMove=[];
				gpMove[0] = Math.abs(axes[0])>deadZone ? -moveSpeed*axes[0] : 0; //lateral
				gpMove[1] = Math.abs(axes[1])>deadZone ? moveSpeed*axes[1] : 0; //vertical
				gpMove[2] = moveSpeed*(buttons[7].value-buttons[6].value); //fwd/back	//note Firefox at least fails to support analog triggers https://bugzilla.mozilla.org/show_bug.cgi?id=1434408
				
				var magsq = gpMove.reduce(function(total, val){return total+ val*val;}, 0);
				gpMove = scalarvectorprod(10000000000*magsq,gpMove);
				
				//testInfo=[axes,buttons,gpMove,magsq];
				
				//note doing cube bodge to both thrust and to adding velocity to position (see key controls code)
				//maybe better to pick one! (probably should apply cube logic to acc'n for exponential smoothed binary key input, do something "realistic" for drag forces
				
				playerVelVec[0]+=gpMove[0];	//todo either write vector addition func or use glmatrix vectors
				playerVelVec[1]+=gpMove[1];
				playerVelVec[2]+=gpMove[2];
				
				playerAngVelVec[2]+=(buttons[15].value-buttons[14].value); //roll -dpad left/right
				
				//other rotation
				var gpRotate=[];
				var fixedRotateAmount = 10*rotateSpeed;
				gpRotate[0] = Math.abs(axes[3])>deadZone ? fixedRotateAmount*axes[3] : 0; //pitch
				gpRotate[1] = Math.abs(axes[2])>deadZone ? fixedRotateAmount*axes[2] : 0; //turn
				gpRotate[2] = 0;	//moved to code above
					
				magsq = gpRotate.reduce(function(total, val){return total+ val*val;}, 0);
				var magpow = Math.pow(50*magsq,1.5);
				
				lastPlayerAngMove = scalarvectorprod(100000*magpow,gpRotate);
				rotatePlayer(lastPlayerAngMove);	//TODO add rotational momentum - not direct rotate
			}
			
			playerVelVec=scalarvectorprod(0.996,playerVelVec);
			playerAngVelVec=scalarvectorprod(0.8,playerAngVelVec);
			
			if (autoFireCountdown>0){
				autoFireCountdown--;
			}else{
				if (keyThing.keystate(71) ||( activeGp && activeGp.buttons[5].value)){	//G key or R1 button
					fireGun();
					autoFireCountdown=autoFireCountdownStartVal;
				}
			}
		}
		
		var moveAmount = timeElapsed * moveSpeed;
		var rotateAmount = timeElapsed * rotateSpeed;
		//var bulletMove = timeElapsed * bulletSpeed;
		
		
		//make new velvec to make slow movement adjustment better, total amount moved nonlinear with press duration
		//just multiply the "thrust" by its squared length. (ie its magnitude is cubed)
		var playerVelVecMagsq = playerVelVec.reduce(function(total, val){return total+ val*val;}, 0);
		
		rotatePlayer(scalarvectorprod(rotateAmount,playerAngVelVec));
		
		
		//playerVelVecBodge =  playerVelVec.map(function(val){return val*playerVelVecMagsq;});
		//movePlayer(scalarvectorprod(moveAmount,playerVelVecBodge));	//no bodge because using playerVelVec for bullets
		movePlayer(scalarvectorprod(moveAmount,playerVelVec));

		//value used in sphere collision TODO? avoid this if switched to box. eg referencing some general
		//collision func. TODO recalc critvalue only when changes
		//var critValue = 1-guiParams.target.scale*guiParams.target.scale;	//small ang approx
		var critValue = 1/Math.sqrt(1+guiParams.target.scale*guiParams.target.scale);	//some small ang approx here
		var invTargetMat = mat4.create();
		mat4.set(targetMatrix, invTargetMat);
		mat4.transpose(invTargetMat);
		var relativeMat = mat4.create();
		var numRandomBoxes = guiParams['random boxes'].number;
		numRandomBoxes = Math.min(randomMats.length, numRandomBoxes);	//TODO check this doesn't happen/ make obvious error!
		
		var boxSize = guiParams['random boxes'].size;
		var boxRad = boxSize*Math.sqrt(3);
		var criticalWPos = Math.cos(Math.atan(guiParams.reflector.scale) + Math.atan(boxRad));
		
		var critValueRandBox = 1/Math.sqrt(1+boxSize*boxSize);
		
		for (var b in bullets){
			var bullet = bullets[b];
			if (bullet.active){	//TODO just delete/unlink removed objects
						
				var bulletMatrix=bullet.matrix;
				var bulletVel=bullet.vel;
				xyzmove4mat(bulletMatrix,scalarvectorprod(moveAmount,bulletVel));
				
				mat4.set(invTargetMat,relativeMat);
				mat4.multiply(relativeMat, bulletMatrix);
				
				switch (guiParams.target.type){
					case "sphere":
						if (relativeMat[15]>critValue){
							detonateBullet(bullet);
						}
						break;
					case "box":
						if (relativeMat[15]>0 && Math.max(Math.abs(relativeMat[12]),
									Math.abs(relativeMat[13]),
									Math.abs(relativeMat[14]))<guiParams.target.scale){
							detonateBullet(bullet);
						}
						break;
				}
				
				
				//slow collision detection between bullet and array of boxes.
				//todo 1 try simple optimisation by matrix/scalar multiplication instead of matrix-matrix
				//todo 2 another simple optimisation - sphere check by xyzw distance. previous check only if passes
				//todo 3 heirarchical bounding boxes or gridding system!
				
				if (numRandomBoxes>0){
					
					for (var ii=0;ii<numRandomBoxes;ii++){
						if (randomMats[ii][15]>criticalWPos){continue;}	//not drawing boxes too close to portal, so don't collide with them either!
															//TODO move to setup stage
						
						mat4.set(randomMats[ii], relativeMat);
						mat4.transpose(relativeMat);
						mat4.multiply(relativeMat, bulletMatrix);
						
						if (relativeMat[15]<critValueRandBox){continue;}	//early sphere check
						
						if (relativeMat[15]>0 && Math.max(Math.abs(relativeMat[12]),
									Math.abs(relativeMat[13]),
									Math.abs(relativeMat[14]))<boxSize*relativeMat[15]){
							detonateBullet(bullet);
						}
					}
				}
				
				//similar thing for 8-cell frames
				var cellSize = guiParams["8-cell scale"];
				if (guiParams["draw 8-cell"]){
					for (dd in cellMatData.d8){
						var thisMat = cellMatData.d8[dd];
						mat4.set(thisMat, relativeMat);
						mat4.transpose(relativeMat);
						mat4.multiply(relativeMat, bulletMatrix);
												
						if (relativeMat[15]>0){
							var projectedPosAbs = [relativeMat[12],relativeMat[13],relativeMat[14]].map(function(val){return Math.abs(val)/(cellSize*relativeMat[15]);});
							if (Math.max(projectedPosAbs[0],projectedPosAbs[1],projectedPosAbs[2])<1){
								var count=projectedPosAbs.reduce(function (sum,val){return val>0.8?sum+1:sum;},0);
								if (count>1){
									detonateBullet(bullet);
								}
							}
						}
					}
				}
				
				
				
				//tetrahedron. (16-cell and 600-cell)
				if (guiParams["draw 16-cell"]){
					checkTetraCollisionForArray(guiParams["16-cell scale"], cellMatData.d16);
				}
				if (guiParams["draw 600-cell"]){
					checkTetraCollisionForArray(0.385/(4/Math.sqrt(6)), cellMatData.d600);
				}
				
				
				//octohedron collision
				if (guiParams["draw 24-cell"]){
					var cellSize24 = guiParams["24-cell scale"];
					
					for (dd in cellMatData.d24.cells){
						var thisMat = cellMatData.d24.cells[dd];
						mat4.set(thisMat, relativeMat);
						mat4.transpose(relativeMat);
						mat4.multiply(relativeMat, bulletMatrix);
												
						if (relativeMat[15]>0){
							//todo speed up. division for all vec parts not necessary
							//change number inside if rhs comparison
							//also should apply multiplier to 0.8 for inner check.
							var projectedPosAbs = [relativeMat[12],relativeMat[13],relativeMat[14]].map(function(val){return Math.abs(val)/(cellSize24*relativeMat[15]);});
							if (projectedPosAbs[0]+projectedPosAbs[1]+projectedPosAbs[2] < 1){
								//inside octohedron. frame is octohedron minus small octohedron extruded.
								if (projectedPosAbs[0]+projectedPosAbs[1]>2*projectedPosAbs[2]+0.8 ||
								    projectedPosAbs[0]+projectedPosAbs[2]>2*projectedPosAbs[1]+0.8 ||
								    projectedPosAbs[1]+projectedPosAbs[2]>2*projectedPosAbs[0]+0.8){
									detonateBullet(bullet);
								}
							}
						}
					}
				}
				
				if (guiParams["draw 120-cell"]){
					//dodecohedron collision. 
					//initially, sphere check
					// for convenience, make 1 dodeca, make quite big
					// then outer dodeca collision (6 abs checks)
					// then calculate which of abs value along axes is smallest,
					// apply reflection along some axis depending on sign??
					// then apply 5 inner thing checks
					
					var dodecaScaleFudge = dodecaScale * (0.4/0.505);	//TODO where do numbers come from!!
													//possibly this is sqrt(0.63) and 0.63 is (1+2/sqrt(5))/3;
					var critVal = 1/Math.sqrt(1+dodecaScaleFudge*dodecaScaleFudge);

					for (dd in cellMatData.d120){	//single element of array for convenience
						var thisMat = cellMatData.d120[dd];
						mat4.set(thisMat, relativeMat);
						mat4.transpose(relativeMat);
						mat4.multiply(relativeMat, bulletMatrix);
												
						if (relativeMat[15]>0){
								//if outside bounding sphere
							if (relativeMat[15]<critVal){continue;}
							
							var projectedPos = [relativeMat[12],relativeMat[13],relativeMat[14]].map(function(val){return val/(dodecaScale*relativeMat[15]);});
							
							var selection = -1;
							var best = 0;
							for (var ii in dodecaPlanesToCheck){
								var toPlane = planeCheck(dodecaPlanesToCheck[ii],projectedPos);
								if (Math.abs(toPlane) > Math.abs(best)){
									best = toPlane;
									selection = ii;
								}
							}
							
							if (Math.abs(best) > 0.63){
								continue;
							}
							
							//inner plane check
							var isInsidePrism = true;
							var dirsArr = dodecaDirs[selection];
							var dirA=dirsArr[0];
							var dirB=dirsArr[1];
							
							//dot product of directions with 
							var dotA = dirA[0]*projectedPos[0] + dirA[1]*projectedPos[1] + dirA[2]*projectedPos[2];  
							var dotB = dirB[0]*projectedPos[0] + dirB[1]*projectedPos[1] + dirB[2]*projectedPos[2];  
							
							dotA = best>0 ? dotA:-dotA;	//????
							
							for (var ang=0;ang<5;ang++){	//note doing this in other order (eg 0,2,4,1,5) with early exit could be quicker
								var angRad = ang*Math.PI/2.5;
								var myDotP = dotA*Math.cos(angRad) + dotB*Math.sin(angRad);
								if (myDotP>0.31){isInsidePrism=false;}
							}
							if (!isInsidePrism){detonateBullet(bullet);}
							
							
							//todo reuse tetra version / general dot product function!
							function planeCheck(planeVec,pos){
								return pos[0]*planeVec[0] + pos[1]*planeVec[1] +pos[2]*planeVec[2];
							}
						}
					}
				}
						
				
			}
		}
		
		//move functions outside bullets loop for performance
		
		function checkTetraCollisionForArray(cellScale, matsArr){
			var critVal = 1/Math.sqrt(1+cellScale*cellScale*3);
			for (dd in matsArr){
				var thisMat = matsArr[dd];
				mat4.set(thisMat, relativeMat);
				mat4.transpose(relativeMat);
				mat4.multiply(relativeMat, bulletMatrix);
					
				if (relativeMat[15]>0){			
					if (relativeMat[15]<critVal){continue;}	//early sphere check
					
					var projectedPos = [relativeMat[12],relativeMat[13],relativeMat[14]].map(function(val){return val/(cellScale*relativeMat[15]);});
					
					//initially just find a corner
					//seems is triangular pyramid, with "top" in 1-axis direction
					//seems 0 - axis parrallel to one base edge
					//1 - "up"
					//2 - other base axis
					// ie top point = (0,sqrt(3),0)
					// therefore inside has to be above base ( pos[2] > -0.33*root(3) = 1/root(3)
												
					var isInside = true;
					
					var selection = -1;
					var best = 1;
					
					//identify which quarter of tetrahedron are in (therefore which outer plane, set of 3 inner planes to check against.
					for (var ii=0;ii<4;ii++){
						var toPlane = planeCheck(tetraPlanesToCheck[ii],projectedPos);
						if (toPlane < best){
							best = toPlane;
							selection = ii;
						}
					}
					
					if (best < -1){
						isInside = false;
					}
					
					//check is not inside all 3 inner planes for relevant quarter.
					var innerPlanes = tetraInnerPlanesToCheck[selection];
					if (planeCheck(innerPlanes[0],projectedPos) >-1 &&
						planeCheck(innerPlanes[1],projectedPos) >-1 &&
						planeCheck(innerPlanes[2],projectedPos) >-1){
							isInside = false;
					}
					
					if (isInside){
						detonateBullet(bullet);
					}
					
					//todo 4th number for comparison value - means can still work if plane thru origin.
					function planeCheck(planeVec,pos){
						return pos[0]*planeVec[0] + pos[1]*planeVec[1] +pos[2]*planeVec[2];
					}
				}
			}
		}
		
		function detonateBullet(bullet){	//TODO what scope does this have? best practice???
			bullet.vel = [0,0,0];	//if colliding with target, stop bullet.
			bullet.active=false;
			var tmp=new Explosion(bulletMatrix);
			//singleExplosion.life = 100;
			//singleExplosion.matrix = bulletMatrix;
		}
		
		
		fireDirectionVec = playerVelVec.map(function(val,ii){return (ii==2)? val+muzzleVel:val;});
			//TODO velocity in frame of bullet? (different if gun aimed off-centre)
		
		var flashAmount = 0.03;
		for (var gg in muzzleFlashAmounts){
			muzzleFlashAmounts[gg]*=0.9;
			flashAmount+= muzzleFlashAmounts[gg]+0.03;	//some default lighting when no firing	
		}
		playerLight = playerLightUnscaled.map(function(val){return val*flashAmount});
		
		portalTest(playerCamera, 0);
		
		//rotate remainder of time for aesthetic. (TODO ensure doesn't cock up frustum culling, hud etc)
		mat4.set(playerCamera, playerCameraInterp);
		xyzrotate4mat(playerCameraInterp, scalarvectorprod(timeTracker/timeStep -1,lastPlayerAngMove));
	}
})();

//TODO less of a bodge!
function rotateVelVec(velVec,rotateVec){
	var velVecMagsq = velVec.reduce(function(total, val){return total+ val*val;}, 0);
	var len = 1-Math.sqrt(velVecMagsq);
	var velVecQuat=[len,velVec[0],velVec[1],velVec[2]];	//note this is only right for small angles, since quat is cos(t), axis*sin(t)
	var rqpair = makerotatequatpair(scalarvectorprod(-0.5,rotateVec));
	velVecQuat=rotatequat_byquatpair(velVecQuat,rqpair);
			
	//switch back to other format (extract 3vec).
	return [velVecQuat[1],velVecQuat[2],velVecQuat[3]];

	//TODO? just do quaternion rotation of 3vector, which exists in glmatrix lib. 
	//maybe best is keep a vel quat, and multiply by a thrust quat.
}

function portalTest(mat, amount){
	var adjustedRad = reflectorInfo.rad + amount;	//avoid issues with rendering very close to surface
	if (checkWithinReflectorRange(mat, adjustedRad)){	
		moveMatrixThruPortal(mat, adjustedRad, 1.00000001);
		currentWorld=1-currentWorld;
		console.log("currentWorld now = " + currentWorld);
	}
}

function checkWithinReflectorRange(matrix, rad){
	return matrix[15]>1/Math.sqrt(1+rad*rad);
}

function moveMatrixThruPortal(matrix, rad, hackMultiplier){
	var magsq = 1- matrix[15]*matrix[15];	
	var mag = Math.sqrt(magsq);

	var multiplier = Math.PI/mag;
	var rotate = [matrix[3],matrix[7],matrix[11]].map(function(val){return multiplier*val});	
	xyzrotate4mat(matrix, rotate);	//180 degree rotate about direction to reflector

	multiplier = -2*hackMultiplier*Math.atan(rad)/mag;
	var move = [matrix[3],matrix[7],matrix[11]].map(function(val){return multiplier*val});	
	xyzmove4mat(matrix, move);
}

function movePlayer(vec){
	xyzmove4mat(playerCamera, vec);
}

function rotatePlayer(vec){
	if (!guiParams.onRails){
		//turning player makes velocity rotate relative to player.
		playerVelVec = rotateVelVec(playerVelVec,vec);
	};
	
	xyzrotate4mat(playerCamera,vec);
}


function getPointingDirectionFromScreenCoordinate(coords){
	
	var maxyvert = 1.0;	
	var maxxvert = screenAspect;
	
	var xpos = maxxvert*(coords.x*2.0/gl.viewportWidth   -1.0 );
	var ypos = maxyvert*(coords.y*2.0/gl.viewportHeight   -1.0 );
	var radsq = xpos*xpos + ypos*ypos;
	var zpos = 1.0/Math.tan(mainCamFov*Math.PI/360); //TODO precalc

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
			var rotAmount = [crossProd.x / crossProd.w, -crossProd.y / crossProd.w, -crossProd.z / crossProd.w];
			rotatePlayer(rotAmount);
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
	mat4.set(playerCameraInterp,sshipMatrix);	//copy current player 4-rotation matrix to the spaceship object
}
var gunEven=1;
function fireGun(){
	gunEven = 1-gunEven;
	for (var g in gunMatrices){
		if (g%2 == gunEven){
			muzzleFlashAmounts[g]+=0.25
			
			var gunMatrix = gunMatrices[g];
			var newBulletMatrix = mat4.create();
			mat4.set(gunMatrix,newBulletMatrix);
			
			
			//work out what fireDirectionVec should be in frame of gun/bullet (rather than player ship body)
			//this maybe better done alongside targeting code.
			var relativeMatrix = mat4.create();
			mat4.set(sshipMatrix,relativeMatrix);
			mat4.transpose(relativeMatrix);
			mat4.multiply(relativeMatrix, gunMatrix);
			
			var newFireDirectionVec = [];
			for (var ii=0;ii<3;ii++){
				var sum=0;
				for (var jj=0;jj<3;jj++){
					sum+=relativeMatrix[ii*4+jj]*playerVelVec[jj];
				}
				newFireDirectionVec.push(sum);
			}			
			newFireDirectionVec[2]+=muzzleVel;
			bullets.push({matrix:newBulletMatrix,vel:newFireDirectionVec,active:true});
																	
			//limit number of bullets
			if (bullets.length>200){
				bullets.shift();
			}
		}
	}
	myAudioPlayer.playGunSound(0);	//todo use delay param to play at exact time.
	gunHeat+=0.1;
}