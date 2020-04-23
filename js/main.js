var shaderProgramFullscreenTextured,
	shaderProgramFullscreenBennyBoxLite,
	shaderProgramFullscreenBennyBox;	//https://www.youtube.com/watch?v=Z9bYzpwVINA

var shaderProgramColored,
	shaderProgramColoredPerVertex,
	shaderProgramColoredPerPixel,
	shaderProgramColoredPerPixelDiscard,
	shaderProgramColoredPerPixelDiscardAtmos,
	shaderProgramColoredPerPixelDiscardAtmosV2,
	shaderProgramColoredPerPixelDiscardAtmosV2Explode,
	shaderProgramColoredPerPixelTransparentDiscard,
	shaderProgramTexmap,
	shaderProgramTexmapPerVertex,
	shaderProgramTexmapPerPixel,
	shaderProgramTexmapPerPixelDiscard,
	shaderProgramTexmapPerPixelDiscardAtmos,
	shaderProgramTexmapPerPixelDiscardAtmosGradLight,
	shaderProgramTexmapPerPixelDiscardAtmosExplode,
	shaderProgramTexmapPerPixelDiscardAtmosV2,
	shaderProgramTexmapPerPixelDiscardAtmosV2Explode,
	shaderProgramTexmap4Vec,
	shaderProgramTexmap4VecAtmos,
	shaderProgramTexmap4VecAtmosV2,
	shaderProgramTexmapColor4VecAtmos,
	shaderProgramTexmap4VecMapproject,
	shaderProgramTexmap4VecMapprojectAtmos,
	shaderProgramTexmap4VecMapprojectAtmosV2,
	shaderProgramDuocylinderSea,
	shaderProgramDuocylinderSeaAtmos,
	shaderProgramDuocylinderSeaAtmosV2,
	shaderProgramCubemap,
	shaderProgramVertprojCubemap,
	shaderProgramVertprojCubemapAtmos,
	shaderProgramVertprojCubemapAtmosV2,
	shaderProgramDecal;
function initShaders(){	
	shaderProgramFullscreenTextured = loadShader( "shader-fullscreen-vs", "shader-fullscreen-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uSampler","uInvSize"]
					});
	shaderProgramFullscreenBennyBoxLite = loadShader( "shader-fullscreen-vs", "shader-fullscreen-fs-bennybox-lite",{
					attributes:["aVertexPosition"],
					uniforms:["uSampler","uInvSize"]
					});
	shaderProgramFullscreenBennyBox = loadShader( "shader-fullscreen-vs", "shader-fullscreen-fs-bennybox",{
					attributes:["aVertexPosition"],
					uniforms:["uSampler","uInvSize"]
					});
			
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
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uColor","uEmitColor","uFogColor", "uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramColoredPerPixelDiscardAtmos = loadShader( "shader-perpixel-discard-vs-atmos", "shader-perpixel-discard-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uColor","uEmitColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramColoredPerPixelDiscardAtmosV2 = loadShader( "shader-perpixel-discard-vs-atmos-v2", "shader-perpixel-discard-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uColor","uEmitColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramColoredPerPixelDiscardAtmosV2Explode = loadShader( "shader-perpixel-discard-vs-atmos-v2-explode", "shader-perpixel-discard-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uColor","uEmitColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor","uVertexMove"]
					});

	shaderProgramColoredPerPixelTransparentDiscard = loadShader( "shader-perpixel-transparent-discard-vs", "shader-perpixel-transparent-discard-fs",{
					attributes:["aVertexPosition","aVertexNormal"],
					uniforms:["uPMatrix","uMVMatrix","uEmitColor", "uModelScale","uReflectorPos","uReflectorCos"]
					});
	
	shaderProgramTexmapPerVertex = loadShader( "shader-texmap-vs", "shader-texmap-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uModelScale"]
					});
					/*
	shaderProgramTexmapPerPixel = loadShader( "shader-texmap-perpixel-vs", "shader-texmap-perpixel-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uModelScale"]
					});
					*/
	shaderProgramTexmapPerPixelDiscard = loadShader( "shader-texmap-perpixel-discard-vs", "shader-texmap-perpixel-discard-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramTexmapPerPixelDiscardAtmos = loadShader( "shader-texmap-perpixel-discard-atmos-vs", "shader-texmap-perpixel-discard-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramTexmapPerPixelDiscardAtmosGradLight = loadShader( "shader-texmap-perpixel-discard-atmos-vs", "shader-texmap-perpixel-gradlight-discard-fs",{
						//could do more work in vert shader currently because light calculated per vertex - could just pass channel weights to frag shader...
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor", "uLightPosPlayerFrame"]
					});
	shaderProgramTexmapPerPixelDiscardAtmosExplode = loadShader( "shader-texmap-perpixel-discard-atmos-vertvel-vs", "shader-texmap-perpixel-discard-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord", "aVertexVelocity"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor","uVertexMove"]
					});
	shaderProgramTexmapPerPixelDiscardAtmosV2 = loadShader( "shader-texmap-perpixel-discard-atmos-v2-vs", "shader-texmap-perpixel-discard-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramTexmapPerPixelDiscardAtmosV2Explode = loadShader( "shader-texmap-perpixel-discard-atmos-v2-vertvel-vs", "shader-texmap-perpixel-discard-fs",{
					attributes:["aVertexPosition", "aVertexNormal" , "aTextureCoord", "aVertexVelocity"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor","uVertexMove"]
					});
					
	shaderProgramTexmap4Vec = loadShader( "shader-texmap-vs-4vec", "shader-texmap-fs",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramTexmap4VecAtmos = loadShader( "shader-texmap-vs-4vec-atmos", "shader-texmap-fs",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramTexmap4VecAtmosV2 = loadShader( "shader-texmap-vs-4vec-atmos-v2", "shader-texmap-fs",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
					
	shaderProgramTexmapColor4VecAtmos = loadShader( "shader-texmap-color-triplanar-vs-4vec-atmos", "shader-texmap-triplanar-fs",{
					attributes:["aVertexPosition", "aVertexNormal","aTriCoord","aTriNormal","aVertexColor"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
					
	shaderProgramTexmap4VecMapproject = loadShader( "shader-texmap-vs-4vec-mapproject", "shader-texmap-fs-mapproject",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uDropLightPos","uSampler","uColor","uFogColor","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramTexmap4VecMapprojectAtmos = loadShader( "shader-texmap-vs-4vec-mapproject-atmos", "shader-texmap-fs-mapproject",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramTexmap4VecMapprojectAtmosV2 = loadShader( "shader-texmap-vs-4vec-mapproject-atmos-v2", "shader-texmap-fs-mapproject",{
					attributes:["aVertexPosition", "aVertexNormal", "aTextureCoord"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uDropLightPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
					
	//shaderProgramDuocylinderSea = loadShader( "shader-texmap-vs-duocylinder-sea", "shader-flat-fs",{
	shaderProgramDuocylinderSea = loadShader( "shader-texmap-vs-duocylinder-sea", "shader-texmap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMVMatrix","uTime","uZeroLevel","uDropLightPos","uColor","uFogColor","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramDuocylinderSeaAtmos = loadShader( "shader-texmap-vs-duocylinder-sea-atmos", "shader-texmap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uTime","uZeroLevel","uDropLightPos","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
	shaderProgramDuocylinderSeaAtmosV2 = loadShader( "shader-texmap-vs-duocylinder-sea-atmos-v2", "shader-texmap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uTime","uZeroLevel","uDropLightPos","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uReflectorPos","uReflectorCos","uReflectorDiffColor","uPlayerLightColor"]
					});
					
	shaderProgramCubemap = loadShader( "shader-cubemap-vs", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor","uFogColor","uModelScale", "uPosShiftMat","uPolarity"]
					});
					
	shaderProgramVertprojCubemap = loadShader( "shader-cubemap-vertproj-vs", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor","uFogColor","uModelScale", "uPosShiftMat","uCentrePosScaled","uPolarity"]
					});
	shaderProgramVertprojCubemapAtmos = loadShader( "shader-cubemap-vertproj-vs-atmos", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale", "uPosShiftMat","uCentrePosScaled","uPolarity"]
					});
	shaderProgramVertprojCubemapAtmosV2 = loadShader( "shader-cubemap-vertproj-vs-atmos-v2", "shader-cubemap-fs",{
					attributes:["aVertexPosition"],
					uniforms:["uPMatrix","uMMatrix","uMVMatrix","uCameraWorldPos","uSampler","uColor","uFogColor","uAtmosThickness","uAtmosContrast","uModelScale", "uPosShiftMat","uCentrePosScaled","uPolarity"]
					});
					
	shaderProgramDecal = loadShader( "shader-decal-vs", "shader-decal-fs",{
					attributes:["aVertexPosition","aTextureCoord"],
					uniforms:["uPMatrix","uMVMatrix","uSampler","uColor", "uModelScale"]
					});
}

var duocylinderObjects={
	grid:{divs:4,step:Math.PI/2},
	terrain:{divs:2,step:Math.PI},
	procTerrain:{divs:1,step:2*Math.PI,isStrips:true},
	sea:{divs:1,step:2*Math.PI,isStrips:true},
	voxTerrain:{divs:2,step:Math.PI}
	//voxTerrain:{divs:1,step:2*Math.PI}
	};

var sphereBuffers={};
var quadBuffers={};
var cubeBuffers={};
var smoothCubeBuffers={};
var randBoxBuffers={};
var roadBoxBuffers={};
var stonehengeBoxBuffers={};
var towerBoxBuffers={};
var explodingCubeBuffers={};
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
var hyperboloidBuffers={};

var sshipModelScale=0.0002;
var duocylinderSurfaceBoxScale = 0.025;

var landingLegData=[
								//tricycle
	//	{pos:[0,0.006,0.007],suspHeight:0},	//down, forward
	//	{pos:[0.006,0.006,-0.004],suspHeight:0},	//left, down, back a bit
	//	{pos:[-0.006,0.006,-0.004],suspHeight:0},	//right, down, back a bit
		
								//add collision balls for other parts of body. TODO size/hardness property, visibility?.
								//note that cubeColPen, suspHeight are ~analagous. might be combined, though may affect when one "leg" colliding with both terrain abnd boxes. maybe currentPen should be a vector
		{pos:[0.006,-0.0045,0.003],suspHeight:0,cubeColPen:0},	//top front engine pods
		{pos:[-0.006,-0.0045,0.003],suspHeight:0,cubeColPen:0},
		{pos:[0.006,-0.0045,-0.008],suspHeight:0,cubeColPen:0},	//top back engine pods
		{pos:[-0.006,-0.0045,-0.008],suspHeight:0,cubeColPen:0},
		
		{pos:[0.006,0.0045,0.003],suspHeight:0,cubeColPen:0},	//bottom front engine pods
		{pos:[-0.006,0.0045,0.003],suspHeight:0,cubeColPen:0},
		{pos:[0.006,0.0045,-0.008],suspHeight:0,cubeColPen:0},	//bottom back engine pods
		{pos:[-0.006,0.0045,-0.008],suspHeight:0,cubeColPen:0},
		
	];

playerCentreBallData = {pos:[0,0,0],suspHeight:0,cubeColPen:0};

var maxRandBoxes = 8192;
//var maxRandBoxes = 50;	//tmp smaller to make startup faster?
var randomMats = [];	//some random poses. used for "dust motes". really only positions required, but flexible, can use for random boxes/whatever 		

function generateDataForDataMatricesScale(inputData, matsArray, scaleFact){
	var numInstances = matsArray.length;
	
	//make a big buffer with multiple copies of an object, pre-transformed by matrices.
	//cubes have 36 vertices, so can do 65536/24 = 2730 cubes in 1 draw call.
	//could make smooth cubes with 8 verts -> 8192, or octohedra with 6 verts -> 10922
	var thisMat;
	
	var outputIndexData = [];
	var offset=0;
	
	var inputVertLength = inputData.vertices.length;
	var numVerts = inputVertLength/3;	
	var normLength = numVerts*4;
	
	var sourceVerts = inputData.vertices;
	var transformedVerts = [];
	var sourceNorms = inputData.normals;
	var transformedNorms = [];
	var sourceUvs = inputData.uvcoords;
	var copiedUvs = [];
	var myvec4 = vec4.create();
	
	for (var ii=0;ii<numInstances;ii++,offset+=numVerts){
		thisMat = matsArray[ii]; 
						
		for (var vv=0;vv<inputVertLength;vv+=3){
			//make a copy of vertex, rotate by matrix
			myvec4[0] = sourceVerts[vv];
			myvec4[1] = sourceVerts[vv+1];
			myvec4[2] = sourceVerts[vv+2];
			myvec4[3] = 1/scaleFact;	//?? determines scale of resulting object?? seems if too big, shader messes up. perhaps assuming normalised input
								//scaleFact might be unnecessary - maybe can just adjust w component of 4vector instead. if is necessary, should precvalc rather than scaling for all vertices
			//vec4.normalize(myvec4);		//there isn't a function for this?!! but there is for vec3!! do manually...
			var veclen = vec4.length(myvec4);
			for (var cc=0;cc<4;cc++){myvec4[cc]/=veclen;}
			//would prefer to not normalize vector - would expect to get projection consistent with 3vector shader. however, appears that current 4vec shader requires it
											
			mat4.multiplyVec4(thisMat, myvec4);
			transformedVerts.push([myvec4[0],myvec4[1],myvec4[2],myvec4[3]]);	//TODO is there a standard method to treat a vec4 like an array?
			
			//make a copy of normal, rotate by matrix
			myvec4[0] = sourceNorms[vv];
			myvec4[1] = sourceNorms[vv+1];
			myvec4[2] = sourceNorms[vv+2];
			myvec4[3] = 0;	//??
			mat4.multiplyVec4(thisMat, myvec4);
			transformedNorms.push([myvec4[0],myvec4[1],myvec4[2],myvec4[3]]);	//TODO is there a standard method to treat a vec4 like an array?
			
		}
		copiedUvs.push(sourceUvs);
		
		outputIndexData.push(inputData.indices.map(function(elem){return elem+offset;}));
	}
	return {	//todo check best format to output (would require change to buffer creation from data step that follows)
		vertices:[].concat.apply([],transformedVerts),
		normals:[].concat.apply([],transformedNorms),
		uvcoords:[].concat.apply([],copiedUvs),
		faces:[].concat.apply([],outputIndexData)	//todo use "indices" consistent with 3vec vertex format
	}
}

var fsData = {
	vertices:[
		-1,-1,0,
		-1,1,0,
		1,-1,0,
		1,1,0
	],
	indices:[
		//0,1,2,
		0,2,1,
		//1,3,2
		1,2,3
	]
}

var fsBuffers={};
		
function initBuffers(){
	loadBufferData(fsBuffers, fsData);
	
	loadDuocylinderBufferData(duocylinderObjects.grid, tballGridDataPantheonStyle);
	loadDuocylinderBufferData(duocylinderObjects.terrain, terrainData);
	loadDuocylinderBufferData(duocylinderObjects.procTerrain, proceduralTerrainData);
	loadDuocylinderSeaBufferData(duocylinderObjects.sea, gridData);	//for use in a different shader. no precalculation of mapping to 4-verts
	
	loadGridData(voxTerrainData);	//TODO don't do this... - different shader like sea - either don't precalc 4-vec mapping, or store 3vec co-ords 
	loadDuocylinderBufferData(duocylinderObjects.voxTerrain, voxTerrainData);
	
	function loadDuocylinderBufferData(bufferObj, sourceData){
		bufferObj.vertexPositionBuffer = gl.createBuffer();
		bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, 4);
		bufferObj.normalBuffer = gl.createBuffer();
		bufferArrayData(bufferObj.normalBuffer, sourceData.normals, 4);
		
		if (sourceData.colors){
			//alert("loading with colours. colors length : " + sourceData.colors.length);
			//alert("vertices length : " + sourceData.vertices.length);
			bufferObj.vertexColorBuffer = gl.createBuffer();
			bufferArrayData(bufferObj.vertexColorBuffer, sourceData.colors, 3);
		}
		if (sourceData.uvcoords || sourceData.texturecoords){
			bufferObj.vertexTextureCoordBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexTextureCoordBuffer, sourceData.uvcoords || sourceData.texturecoords[0], 2);	//handle inconsistent formats
		}
		if (sourceData.tricoords){
			bufferObj.vertexTriCoordBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexTriCoordBuffer, sourceData.tricoords, 3);
		}
		if (sourceData.trinormals){
			bufferObj.vertexTriNormalBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexTriNormalBuffer, sourceData.trinormals, 3);
		}
		
		bufferObj.vertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
		if (Array.isArray(sourceData.faces[0])){	//if faces is an array of length 3 arrays
			sourceData.indices = [].concat.apply([],sourceData.faces);
		} else {									//faces is just a set of indices - used for procTerrain indexed strips. TODO maybe don't use "faces"
			sourceData.indices = sourceData.faces;
		}
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
		bufferObj.vertexIndexBuffer.itemSize = 3;
		bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;
	}
	
	function loadDuocylinderSeaBufferData(bufferObj, sourceData){
		bufferObj.vertexPositionBuffer = gl.createBuffer();
		bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, 2);
		bufferObj.vertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
		//sourceData.indices = [].concat.apply([],sourceData.faces);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
		bufferObj.vertexIndexBuffer.itemSize = 3;
		//bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length/3;	//todo why isn't /3 used in loadDuocylinderBufferData ?
		bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;
	}
	
	//load blender object
	//TODO use XMLHTTPRequest or something
	//for now have put "var myBlenderObjOrWhatever = " in front of contents of untitled.obj.json, and are referencing this directly as a script (similar to how are doing with shaders)
	//this part will eventually want to make part of build process (so can load object just containing what need)
	var cubeFrameBlenderObject = loadBlenderExport(cubeFrameData.meshes[0]);	//todo switch to removing outfaces (currently including so can scale smaller)
	var cubeFrameSubdivObject = loadBlenderExport(cubeFrameSubdivData);			//""
	var octoFrameBlenderObject = loadBlenderExportNoOutwardFaces(octoFrameData.meshes[0]);
	var octoFrameSubdivObject = loadBlenderExportNoOutwardFaces(octoFrameSubdivData);
	var tetraFrameBlenderObject = loadBlenderExportNoOutwardFaces(tetraFrameData.meshes[0]);
	var tetraFrameSubdivObject = loadBlenderExportNoOutwardFaces(tetraFrameSubdivData);
	var dodecaFrameBlenderObject = loadBlenderExportNoOutwardFaces(dodecaFrameData.meshes[0]);
	var teapotObject = loadBlenderExport(teapotData);	//isn't actually a blender export - just a obj json
	//var sshipObject = loadBlenderExport(sshipData.meshes[0]);		//""
	var sshipObject = loadBlenderExport(sshipData);		//""
		//remove uv data for now to check works like previous model. 
		//sshipObject.uvcoords = false;
	
	var gunObject = loadBlenderExport(guncyldata.meshes[0]);
	var icoballObj = loadBlenderExport(icoballdata);

	//loadBufferData(sphereBuffers, makeSphereData(99,200,1)); //todo use normalized box/icosohedron,subdivided octohedron etc, triangle strips
	loadBufferData(sphereBuffers, makeSphereData(127,255,1)); //near index limit 65536.
	//loadBufferData(sphereBuffers, makeSphereData(49,100,1));
	loadBufferData(quadBuffers, quadData);
	loadBufferData(cubeBuffers, levelCubeData);
	loadBufferData(smoothCubeBuffers, smoothCubeData);
	loadBufferData(explodingCubeBuffers, explodingCubeData);
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
	loadBufferData(hyperboloidBuffers, hyperboloidData);

	for (var ii=0;ii<maxRandBoxes;ii++){
		thisMat = convert_quats_to_4matrix(random_quat_pair(), mat4.create());
		randomMats.push(thisMat);
	}
	
	var randBoxData = generateDataForDataMatricesScale(smoothCubeData, randomMats, 0.001);	//TODO ensure none inside portal radius. (4vec vertex shader doesn't discard pixels)
	
	//console.log("randBoxData:");
	//console.log(randBoxData);
	loadDuocylinderBufferData(randBoxBuffers, randBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	randBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	randBoxBuffers.step=0;	//unused
	
	var towerBoxData = generateDataForDataMatricesScale(levelCubeData, duocylinderBoxInfo.towerblocks.list.map(function(elem){return elem.matrix;}), duocylinderSurfaceBoxScale);
	loadDuocylinderBufferData(towerBoxBuffers, towerBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	towerBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	towerBoxBuffers.step=0;	//unused
	
	var stonehengeBoxData = generateDataForDataMatricesScale(levelCubeData, duocylinderBoxInfo.stonehenge.list.map(function(elem){return elem.matrix;}), duocylinderSurfaceBoxScale);
	loadDuocylinderBufferData(stonehengeBoxBuffers, stonehengeBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	stonehengeBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	stonehengeBoxBuffers.step=0;	//unused
	
	var roadBoxData = generateDataForDataMatricesScale(levelCubeData, duocylinderBoxInfo.roads.list.map(function(elem){return elem.matrix;}), duocylinderSurfaceBoxScale);
	loadDuocylinderBufferData(roadBoxBuffers, roadBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	roadBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	roadBoxBuffers.step=0;	//unused
	
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
		if (sourceData.velocities){	//for exploding objects
			bufferObj.vertexVelocityBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexVelocityBuffer, sourceData.velocities, 3);
		}
		if (sourceData.normals){
			bufferObj.vertexNormalBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexNormalBuffer, sourceData.normals, 3);
		}
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
			if (dotProd < 0.5*Math.sqrt(normalLengthsq*vertexLengthsq)){
				//this works. afaik need number as low as this because faces are triangles etc. maybe will want some number close to zero - just checking sign maybe sufficient (though "between" faces are near zero dot product)..
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
	var offsetVecReverse;
	var targetForType = {
		"near 3rd person":[0,-0.0075,-0.005],
		//"far 3rd person":[0,-0.02,-0.03],
		"far 3rd person":[0,-0.01,-0.01],
		//"far 3rd person 2":[0,0,-0.02],	//straight behind (not raised)
		"far 3rd person 2":[0,-0.02,-0.025],	
		"cockpit":[0,0,0.0015],
		"side":[0.006,0,0.0025]
	}
	var targetForTypeReverse = {
		"near 3rd person":[0,-0.0075,0.005],
		"far 3rd person":[0,-0.02,0.03],
		"far 3rd person 2":[0,0,0.02],
		"cockpit":[0,0,-0.01],
		"side":[0.006,0,0.0025]
	}
	var offsetVecTarget = targetForType["far 3rd person"];
	var offsetVecTargetReverse = targetForTypeReverse["far 3rd person"];
	offsetVec = offsetVecTarget;
	offsetVecReverse = offsetVecTargetReverse;

	var mult1=0.95;
	var mult2=1-mult1;
	
	return {
		getVec: function (){
			return reverseCamera ? offsetVecReverse : offsetVec;
		},
		setType: function(type){
			offsetVecTarget = targetForType[type];
			offsetVecTargetReverse = targetForTypeReverse[type];
		},
		iterate: function(){
			offsetVec = offsetVec.map(function(val,ii){return val*mult1+offsetVecTarget[ii]*mult2;})
			offsetVecReverse = offsetVecReverse.map(function(val,ii){return val*mult1+offsetVecTargetReverse[ii]*mult2;})
		}
	}
})();

var lastSeaTime=0;
function drawScene(frameTime){
	resizecanvas();

	iterateMechanics();	//TODO make movement speed independent of framerate
	
	requestAnimationFrame(drawScene);
	stats.end();
	stats.begin();
	
	
	reflectorInfo.rad = guiParams.reflector.draw? guiParams.reflector.scale : 0;	//when "draw" off, portal is inactivate- can't pass through, doesn't discard pix
	
	offsetCameraContainer.world = playerContainer.world;
	
	mat4.set(playerCameraInterp, offsetPlayerCamera);	
	//mat4.set(playerCamera, offsetPlayerCamera);	
	
	offsetCam.setType(guiParams.cameraType);

	var offsetSteps = 500;	//todo proper move thru portal taking into account path. or can make more efficient by binary search (~log(n) tests)
	var tmp4mat = mat4.create();
	var wentThrough = false;
	for (var ii=0;ii<offsetSteps;ii++){	//TODO more efficient. if insufficient subdivision, transition stepped.
		mat4.set(offsetPlayerCamera, tmp4mat);	//TODO check order
		xyzmove4mat(tmp4mat,offsetCam.getVec().map(function(item){return item*ii/offsetSteps;}));
		if (checkWithinReflectorRange(tmp4mat, reflectorInfo.rad)){
			//portalTest will pass, so repeat with original matrix
			xyzmove4mat(offsetPlayerCamera,offsetCam.getVec().map(function(item){return item*ii/offsetSteps;}));
			portalTest(offsetCameraContainer,0);
			wentThrough = true;
			//assume wont cross twice, move remainder of way
			xyzmove4mat(offsetPlayerCamera,offsetCam.getVec().map(function(item){return item*(offsetSteps-ii)/offsetSteps;}));
		}
	}
	if (!wentThrough){
		xyzmove4mat(offsetPlayerCamera,offsetCam.getVec());
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
	if (guiParams.reflector.cmFacesUpdated>0){
		gl.cullFace(gl.BACK);	//because might have set to front for mirror reversing/landing camera.
		var numFacesToUpdate = guiParams.reflector.cmFacesUpdated;
		mat4.set(cmapPMatrix, pMatrix);
		for (var ii=0;ii<numFacesToUpdate;ii++){	//only using currently to check perf impact. could use more "properly" and cycle/alternate.
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
														//todo only update pmatrix if input variables have changed
	
	if (reverseCamera){
		gl.cullFace(gl.FRONT);	//todo revert for drawing cubemap faces. or : for PIP camera, render to texture, flip when texture to screen (and if fullscreen reversing camera, use same cullface setting when drawing them (if switching cullface is a slow gl call)
		pMatrix[0]=-pMatrix[0];
	}else{
		gl.cullFace(gl.BACK);
	}
														
	frustrumCull = generateCullFunc(pMatrix);
		
	mat4.set(offsetPlayerCamera, worldCamera);	//set worldCamera to playerCamera
	//xyzmove4mat(worldCamera,[0,-0.01,-0.015]);	//3rd person camera
	//xyzmove4mat(worldCamera,[0,0,0.005]);	//forward camera
	
	if (reverseCamera){
		xyzrotate4mat(worldCamera, (guiParams.flipReverseCamera? [Math.PI,0,0]:[0,Math.PI,0] ));	//flip 180
	}
	
	if (guiParams.renderViaTexture == "no"){
		drawWorldScene(frameTime, false, offsetCameraContainer.world);
	}else{
		//draw the scene to offscreen framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		setRttSize(gl.viewportWidth, gl.viewportHeight);
		
		drawWorldScene(frameTime, false, offsetCameraContainer.world);
		
		//draw quad to screen using drawn texture
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);	//draw to screen.
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);	//TODO check whether necessary to keep setting this
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	//TODO check whether need this - should be redrawing everything so could just disable z check
		
		gl.activeTexture(gl.TEXTURE0);
		bind2dTextureIfRequired(rttTexture);	
		//gl.bindTexture(gl.TEXTURE_2D, rttTexture);	//set just drawn texture as active for drawing to screen
		
		//draw the simple quad object to the screen
		var activeProg = (guiParams.renderViaTexture == "basic") ? shaderProgramFullscreenTextured:(guiParams.renderViaTexture == "bennyBox" ? shaderProgramFullscreenBennyBox:shaderProgramFullscreenBennyBoxLite);
		gl.useProgram(activeProg);
		enableDisableAttributes(activeProg);

		gl.cullFace(gl.BACK);
		
		//gl.activeTexture(gl.TEXTURE0);

		gl.uniform1i(activeProg.uniforms.uSampler, 0);		
		gl.uniform2fv(activeProg.uniforms.uInvSize, [1/gl.viewportWidth , 1/gl.viewportHeight]);		
		drawObjectFromBuffers(fsBuffers, activeProg);
	}
	
	if (!guiParams["drop spaceship"] && guiParams.showHud){	//only draw hud if haven't dropped spaceship
		
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
			bind2dTextureIfRequired(hudTexturePlus);		//todo texture atlas for all hud 
			drawTargetDecal(0.001, colorArrs.hudFlightDir, playerVelVec);
		}
		bind2dTextureIfRequired(hudTexture);	
		
		//drawTargetDecal(0.004, [1.0, 1.0, 0.0, 0.5], [0,0,0.01]);	//camera near plane. todo render with transparency
		if (guiParams["targeting"]!="off"){
			var shiftAmount = 1/muzzleVel;	//shift according to player velocity. 0.1 could be 1, but 
			drawTargetDecal(0.0037/(1+shiftAmount*playerVelVec[2]), colorArrs.hudYellow, [shiftAmount*playerVelVec[0],shiftAmount*playerVelVec[1],1+shiftAmount*playerVelVec[2]]);	//TODO vector add!
			
			if (guiParams.target.type!="none" && targetWorldFrame[2]<0){	//if in front of player){
				bind2dTextureIfRequired(hudTextureBox);				
				drawTargetDecal(0.001, colorArrs.hudBox, targetWorldFrame);	//direction to target (shows where target is on screen)
									//TODO put where is on screen, not direction from spaceship (obvious difference in 3rd person)
				//bind2dTextureIfRequired(hudTextureSmallCircles);	
				//drawTargetDecal(0.0008, [1, 0.1, 1, 0.5], selectedTargeting);	//where should shoot in order to hit target (accounting for player velocity)
					//not required if using shifted gun direction circle
			
				//drawTargetDecal(0.0006, [1, 1, 1, 1], targetingResultOne);
				//drawTargetDecal(0.0006, [0, 0, 0, 1], targetingResultTwo);
			}
		}
		
		//show where guns will shoot
		if (fireDirectionVec[2] > 0.1){	//??
			bind2dTextureIfRequired(hudTextureX);
			drawTargetDecal(0.001, colorArrs.hudYellow, fireDirectionVec);	//todo check whether this colour already set
		}
		
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
	}
	
	function drawTargetDecal(scale, color, pos){
			//scale*= 0.01/pos[2];
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [scale,scale,scale]);
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, color);
			mat4.identity(mvMatrix);
			xyzmove4mat(mvMatrix,[0.01*pos[0]/pos[2],0.01*pos[1]/pos[2],0.01]);
			drawObjectFromPreppedBuffers(quadBuffers, activeShaderProgram);
	}
	
}

var mainCamFov = 105;	//degrees.
function setProjectionMatrix(pMatrix, vFov, ratio, polarity){
	mat4.identity(pMatrix);
	
	var fy = Math.tan((Math.PI/180.0)*vFov/2);
	
	pMatrix[0] = ratio/fy ;
	pMatrix[5] = 1.0/fy;
	pMatrix[11]	= -1;	//rotate w into z.
	pMatrix[14] = -0.00003;	//smaller = more z range. 1/50 gets ~same near clipping result as stereographic/perspective 0.01 near
	pMatrix[10]	= 0;
	pMatrix[15] = 0;
}

var sshipWorld=0;	//used for player light

var colorArrs = {
	white:[1.0, 1.0, 1.0, 1.0],
	gray:[0.6,0.6,0.6,1.0],
	darkGray:[0.4, 0.4, 0.4, 1.0],
	veryDarkGray:[0.2, 0.2, 0.2, 1.0],
	superDarkGray:[0.05, 0.05, 0.05, 1.0],
	black:[0, 0, 0, 1.0],
	red:[1.0, 0.4, 0.4, 1.0],
	green:[0.4, 1.0, 0.4, 1.0],
	blue:[0.4, 0.4, 1.0, 1.0],
	yellow:[1.0, 1.0, 0.4, 1.0],
	magenta:[1.0, 0.4, 1.0, 1.0],
	cyan:[0.4, 1.0, 1.0, 1.0],
	randBoxes:[0.9, 0.9, 1.0, 0.9],
	teapot:[0.4, 0.4, 0.8, 1.0],
	hudFlightDir:[0.0, 0.5, 1.0, 0.5],
	hudBox:[1, 0.1, 0, 0.5],
	hudYellow:[1.0, 1.0, 0.0, 0.5],
	guns:[0.3, 0.3, 0.3, 1.0],
	target:[1, 0.2, 0.2, 1],
	
}
Object.keys(colorArrs).map(function(key){colorArrs[key]=new Float32Array(colorArrs[key]);});	//maybe more efficient?


function updateGunTargeting(matrix){
	var modelScale = sshipModelScale;
	var matrixForTargeting = matrix;
	
	var gunHoriz = 20*sshipModelScale;
	var gunVert = 10*sshipModelScale;
	var gunFront = 5*sshipModelScale;
	
	var gunAngRangeRad = 0.35;
	
	//default (no targeting) - guns unrotated, point straight ahead.
	rotvec = [0,0,0];
			
	if (guiParams.target.type!="none" && guiParams["targeting"]!="off"){
		//rotvec = getRotBetweenMats(matrixForTargeting, targetMatrix);	//target in frame of spaceship.
		var targetingSolution = getTargetingSolution(matrixForTargeting, targetMatrix);
		rotvec = targetingSolution.rotvec;
		targetingResultOne = targetingSolution.results[0];
		targetingResultTwo = targetingSolution.results[1];
		selectedTargeting = targetingSolution.selected;
		targetWorldFrame = targetingSolution.targetWorldFrame;
	}
	
	gunMatrices=[];	//todo reuse instead of clear and push
	
	pushGunMatrixRelativeToSpacehip([gunHoriz,gunVert,gunFront]); //left, down, forwards
	pushGunMatrixRelativeToSpacehip([-gunHoriz,gunVert,gunFront]);
	pushGunMatrixRelativeToSpacehip([-gunHoriz,-gunVert,gunFront]);
	pushGunMatrixRelativeToSpacehip([gunHoriz,-gunVert,gunFront]);
	
	function pushGunMatrixRelativeToSpacehip(vec){	//todo reuse matrices for gunMatrixCosmetic (fixed array) - not simple to use pool since pushing onto gunMatrices //todo precalc gunmatrices relative to spaceship?
		var gunMatrixCosmetic = mat4.create();
		mat4.set(matrix, gunMatrixCosmetic);
		xyzmove4mat(gunMatrixCosmetic,vec);
		
		var gunMatrix = matPool.create();
		mat4.set(matrixForTargeting, gunMatrix);
		xyzmove4mat(gunMatrix,vec);
		
		if (guiParams.target.type!="none" && guiParams["targeting"]=="individual"){
			rotvec = getTargetingSolution(gunMatrix, targetMatrix).rotvec;
		}
		matPool.destroy(gunMatrix);
		
		//rotate guns to follow mouse
		xyzrotate4mat(gunMatrixCosmetic, rotvec);		
			
		xyzmove4mat(gunMatrixCosmetic,[0,0,25*modelScale]);	//move forwards
		gunMatrices.push(gunMatrixCosmetic);
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
	
	function getRotBetweenMats(sourceMat, destMat){	//this func not used now. use of matrix pool untested
		//actually gets rotation to point sourceMat at destMat
		var tmpMat = matPool.create();
		mat4.set(sourceMat, tmpMat);
		mat4.transpose(tmpMat);			
			
		mat4.multiply(tmpMat, destMat);	//object described by destMat in frame of object described by sourceMat.
			
		//[mat[12],mat[13],mat[14],mat[15] is 4vec co-ords
		pointingDir={x:tmpMat[12], y:tmpMat[13], z:tmpMat[14]};
		
		pointingDir = capGunPointing(pointingDir);
		
		matPool.destroy(tmpMat);
		
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

var lgMat;

function drawWorldScene(frameTime, isCubemapView) {
		
	var colorsSwitch = ((isCubemapView && guiParams.reflector.isPortal)?1:0)^offsetCameraContainer.world;
	
	var localVecFogColor = worldColors[colorsSwitch];
	var localVecReflectorColor = guiParams.reflector.isPortal? worldColors[1-colorsSwitch]: worldColors[colorsSwitch];
	var localVecReflectorDiffColor = [ localVecReflectorColor[0]-localVecFogColor[0],
										localVecReflectorColor[1]-localVecFogColor[1],
										localVecReflectorColor[2]-localVecFogColor[2]];	//todo use a vector class!
	
	var localVecFogColorGamma = localVecFogColor.map(function(elem){return Math.pow(elem,0.455);});
	
	gl.clearColor.apply(gl,localVecFogColorGamma);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
	mat4.set(worldCamera, invertedWorldCamera);
	mat4.transpose(invertedWorldCamera);
	
	//equivalent for frame of duocylinder, to reduce complexity of drawing, collision checks etc
	mat4.set(invertedWorldCamera, invertedWorldCameraDuocylinderFrame);
	rotate4mat(invertedWorldCameraDuocylinderFrame, 0, 1, duocylinderSpin);
	
	//calculate stuff for discard shaders
	//position of reflector in frame of camera (after MVMatrix transformation)
	var reflectorPosTransformed = [worldCamera[3],worldCamera[7],worldCamera[11],worldCamera[15]];
	var cosReflector = 1.0/Math.sqrt(1+reflectorInfo.rad*reflectorInfo.rad);
	
	var relevantColorShader = guiParams["atmosShader"]?(guiParams["altAtmosShader"]?shaderProgramColoredPerPixelDiscardAtmosV2Explode:shaderProgramColoredPerPixelDiscardAtmos):shaderProgramColoredPerPixelDiscard;
	//var relevantTexmapShader = guiParams["atmosShader"]?shaderProgramTexmapPerPixelDiscardAtmos:shaderProgramTexmapPerPixelDiscard;
	
	var relevantTexmapShader = guiParams["atmosShader"]?(guiParams["altAtmosShader"]?shaderProgramTexmapPerPixelDiscardAtmosV2:shaderProgramTexmapPerPixelDiscardAtmos):shaderProgramTexmapPerPixelDiscard;
	
	shaderProgramColored = guiParams["perPixelLighting"]?relevantColorShader:shaderProgramColoredPerVertex;
	shaderProgramTexmap = guiParams["perPixelLighting"]?relevantTexmapShader:shaderProgramTexmapPerVertex;	
	
	var dropLightPos;
	if (!guiParams["drop spaceship"]){
		mat4.set(playerCameraInterp,sshipMatrix);	//copy current player 4-rotation matrix to the spaceship object
	}
	
	//get light pos in frame of camera. light is at spaceship
	var lightMat = mat4.create();	//TODO mat*mat is unnecessary - only need to do dropLightPos = sshipMatrix*lightPosInWorld 
	mat4.set(invertedWorldCamera, lightMat);
	
	var sshipMatrixShifted = mat4.create();	//TODO permanent/reuse (code duplicated from elsewhere.
	mat4.set(sshipMatrix, sshipMatrixShifted)
	xyzmove4mat(sshipMatrixShifted, moveAwayVec);
	
	mat4.multiply(lightMat, sshipMatrixShifted);
	dropLightPos = [lightMat[12], lightMat[13], lightMat[14], lightMat[15]];
	
	mat4.set(invertedWorldCamera, lightMat);
	
	//only use 1 drop light. should be standard pos'n if drawing same world as light, and reflected pos'n if different
	//if dropLight in the space that are currently drawing, move it through portal.
	//TODO /note that 2nd light is relevant if sphere is reflector instead of portal.
	if (colorsSwitch^sshipWorld){
		var dropLightReflectionInfo={};
		calcReflectionInfo(sshipMatrixShifted,dropLightReflectionInfo);
		mat4.multiply(lightMat, dropLightReflectionInfo.shaderMatrix2);
		dropLightPos = [lightMat[12], lightMat[13], lightMat[14], lightMat[15]];	//todo make light dimmer/directional when "coming out of" portal
	}
	
	var boxSize;
	var boxRad;
	
	//draw exploding box using modified shader (note this always uses atmos v2 at the mo (analytic integral of series approximation)
	if (guiParams.drawShapes.explodingBox){
		boxSize = 0.02;
		boxRad = boxSize*Math.sqrt(3);
		
		var activeShaderProgram = guiParams["altAtmosShader"]?shaderProgramTexmapPerPixelDiscardAtmosV2Explode:shaderProgramTexmapPerPixelDiscardAtmosExplode;
			//setup code largely shared with setting regular texmap code. todo generalise setup
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
		
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [boxSize,boxSize,boxSize]);
		gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);

		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);

		//new for this version of shader
		//gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, guiParams.normalMove + boxSize);
		gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, 0.01*Math.abs(Math.cos((Math.PI/1000)*(frameTime % 2000 ))) + boxSize);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,teapotMatrix);
		mat4.set(teapotMatrix, mMatrix);
		
		gl.activeTexture(gl.TEXTURE0);
		bind2dTextureIfRequired(texture);
		
		drawObjectFromBuffers(explodingCubeBuffers, activeShaderProgram);	
	}
	
	boxSize = 0.1;
	boxRad = boxSize*Math.sqrt(3);
	
	//var activeShaderProgram = shaderProgramColored;	//draw spheres
	activeShaderProgram = shaderProgramTexmap;	//draw cubes
	//gl.enableVertexAttribArray(1);	//do need tex coords
	
	gl.useProgram(activeShaderProgram);
	
	gl.activeTexture(gl.TEXTURE0);
	bind2dTextureIfRequired(texture);
		
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
	gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [boxSize,boxSize,boxSize]);
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	
	var guiBoxes = guiParams.drawShapes.boxes;
	if (guiBoxes['y=z=0']){drawBoxRing(ringCells[0],colorArrs.red);}
	if (guiBoxes['x=z=0']){drawBoxRing(ringCells[1],colorArrs.green);}
	if (guiBoxes['x=y=0']){drawBoxRing(ringCells[2],colorArrs.blue);}
	if (guiBoxes['z=w=0']){drawBoxRing(ringCells[3],colorArrs.yellow);}
	if (guiBoxes['y=w=0']){drawBoxRing(ringCells[4],colorArrs.magenta);}
	if (guiBoxes['x=w=0']){drawBoxRing(ringCells[5],colorArrs.cyan);}
	
	function drawBoxRing(ringCellMatData,color){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, color);
		drawArrayOfModels(
			ringCellMatData,
			(guiParams["culling"] ? boxRad: false),
			cubeBuffers
		);
	}
	
	
	var numRandomBoxes = guiParams['random boxes'].number;
	
	if (numRandomBoxes>0){
		if (!guiParams['random boxes'].singleBuffer){
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.randBoxes);
			
			boxSize = guiParams['random boxes'].size;
			boxRad = boxSize*Math.sqrt(3);
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [boxSize,boxSize,boxSize]);
			
		//	var criticalWPos = Math.cos(Math.atan(guiParams.reflector.scale) + Math.atan(boxRad));
			
			numRandomBoxes = Math.min(randomMats.length, numRandomBoxes);	//TODO check this doesn't happen/ make obvious error!
			
			prepBuffersForDrawing(cubeBuffers, shaderProgramTexmap);
			for (var ii=0;ii<numRandomBoxes;ii++){
				var thisMat = randomMats[ii];
				mat4.set(invertedWorldCamera, mvMatrix);
				mat4.multiply(mvMatrix, thisMat);
				
			//	if (thisMat[15]>criticalWPos){continue;}	//don't draw boxes too close to portal
				if (frustrumCull(mvMatrix,boxRad)){
					mat4.set(thisMat, mMatrix);
					drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
				}
			}
		}else{
			//draw all boxes from single buffer. no culling.
		}
	}
	
	
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale]);
	prepBuffersForDrawing(cubeBuffers, shaderProgramTexmap);
	
	//draw boxes on duocylinder surface. 
	if (guiParams.drawShapes.towers){	//note currently toggles drawing for all boxes using duocylinder positioning method, including demo axis objects
		for (var bb of duocylinderBoxInfo.towerblocks.list){
			drawPreppedBufferOnDuocylinderForBoxData(bb, activeShaderProgram, cubeBuffers, invertedWorldCameraDuocylinderFrame);
		}
	}
	
	if (guiParams.drawShapes.stonehenge){	
		for (var bb of duocylinderBoxInfo.stonehenge.list){
			drawPreppedBufferOnDuocylinderForBoxData(bb, activeShaderProgram, cubeBuffers, invertedWorldCameraDuocylinderFrame);
		}
	}
	
	if (guiParams.drawShapes.roads){	
		for (var bb of duocylinderBoxInfo.roads.list){
			drawPreppedBufferOnDuocylinderForBoxData(bb, activeShaderProgram, cubeBuffers, invertedWorldCameraDuocylinderFrame);
		}
	}
	
	var worldInfo = (colorsSwitch==0) ? guiParams.world0 : guiParams.world1;	//todo use array
	
	var playerPos = [playerCamera[12],playerCamera[13],playerCamera[14],playerCamera[15]];			//copied from elsewhere
		
	if (worldInfo.duocylinderModel == 'procTerrain'){
		terrainCollisionTestBoxPos = terrainGetHeightFor4VecPos(playerPos);		//TODO in position update (not rendering)
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.001,0.001,0.001]);
		drawPreppedBufferOnDuocylinder(terrainCollisionTestBoxPos.b,terrainCollisionTestBoxPos.a,terrainCollisionTestBoxPos.h, [1.0, 0.4, 1.0, 1.0], cubeBuffers);
	}
	
	if (guiParams.debug.closestPoint){
		if (worldInfo.duocylinderModel == 'voxTerrain'){
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, closestPointTestMat);
			mat4.set(closestPointTestMat, mMatrix);
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.magenta);
			drawTriAxisCross(0.02);
			
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, voxCollisionDebugMat);
			mat4.set(voxCollisionDebugMat, mMatrix);
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.blue);
			drawTriAxisCross(0.01);
		}
	}
	
	
	var seaTime = 0.00005*(frameTime % 20000 ); //20s loop
	lastSeaTime=seaTime;	//for use in mechanics. TODO switch to using mechanics time for rendering instead
	if (worldInfo.seaActive){
		seaHeight.setZeroLevel(guiParams.seaLevel);
		
		//var seaHeight = getSeaHeight([0,0], [0.00005*(frameTime % 20000 )]);	//actually this is a position not a height . todo time conversion in one place 
		var currentSeaHeight = getSeaHeight([0,0], seaTime);	//actually this is a position not a height . todo time conversion in one place 
		var tau = Math.PI*2;
		var shiftX = -Math.PI/2;
		
		shiftX+=duocylinderSpin;
		
		if (guiParams.debug.buoys){
			//buoy to track surface
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.4,0.01,0.01]);
			drawPreppedBufferOnDuocylinder(shiftX-currentSeaHeight[0]*tau,-currentSeaHeight[1]*tau,currentSeaHeight[2]*tau, [1.0, 0.4, 1.0, 1.0], cubeBuffers);
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.01,0.1,0.1]);
			drawPreppedBufferOnDuocylinder(shiftX-currentSeaHeight[0]*tau,-currentSeaHeight[1]*tau,currentSeaHeight[2]*tau, [1.0, 0.4, 1.0, 1.0], cubeBuffers);
			
			//reference static buoy
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.4,0.01,0.01]);
			drawPreppedBufferOnDuocylinder(shiftX,0,0, [0.0, 0.4, 1.0, 1.0], cubeBuffers);
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.01,0.1,0.1]);
			drawPreppedBufferOnDuocylinder(shiftX,0,0, [0.0, 0.4, 1.0, 1.0], cubeBuffers);
		}
		if (guiParams.debug.closestPoint){
			//red box on sea under player
			var testBuoyPos = seaHeightFor4VecPos(playerPos, seaTime);
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.001,0.01,0.01]);
			drawPreppedBufferOnDuocylinder(testBuoyPos.b,testBuoyPos.a,testBuoyPos.h, [1, 0, 0, 1], cubeBuffers);
		}
	}
	
	if (guiParams.debug.closestPoint){	//draw collision test object
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, collisionTestObjMat);
		mat4.set(collisionTestObjMat, mMatrix);
		var testObjScale=0.001;
		drawTriAxisCross(testObjScale*20);
		
		//draw object centred on object colliding with to see if anything happening!
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, collisionTestObj2Mat);
		mat4.set(collisionTestObj2Mat, mMatrix);
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [2*testObjScale,2*testObjScale,2*testObjScale]);
		drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
		//draw object shifted by normal
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.green);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, collisionTestObj3Mat);
		mat4.set(collisionTestObj3Mat, mMatrix);
		drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);

		//try to get something drawing at colliding object, relative to
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.blue);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, collisionTestObj4Mat);
		mat4.set(collisionTestObj4Mat, mMatrix);
		drawTriAxisCross(0.02);
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.red);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, collisionTestObj5Mat);
		mat4.set(collisionTestObj5Mat, mMatrix);
		drawTriAxisCross(0.02);
	}
	
	function drawPreppedBufferOnDuocylinderForBoxData(bb, activeShaderProgram, buffers, invertedCamera){
		var invertedCamera = invertedCamera || invertedWorldCamera;
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, bb.color);
		mat4.set(invertedCamera, mvMatrix);
		mat4.multiply(mvMatrix, bb.matrix);
		
		mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);		//TODO just prep a duocylinder matrix and set mMatrix to it
		mat4.multiply(mMatrix, bb.matrix);
		
		drawObjectFromPreppedBuffers(buffers, activeShaderProgram);
	}
	
	function drawPreppedBufferOnDuocylinder(aa, bb, hh, cc, buff){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, cc);
		moveToDuocylinderAB(aa,bb,hh);
		drawObjectFromPreppedBuffers(buff, shaderProgramTexmap);
	}
	function moveToDuocylinderAB(aa,bb,hh){	//surf of duocylinder hh=0. aa, bb wrap 2 PI. for side portal is in, aa is around, bb is along.
											//TODO maybe put multiplications by PI in here so wraps to +/-1 ?
											//TODO don't use this at runtime.
											//TODO maybe function to map object onto duocylinder including saddle distortion?
		mat4.identity(mMatrix);
		xyzrotate4mat(mMatrix, [0,0,aa]);
		zmove4mat(mMatrix, bb);
		xmove4mat(mMatrix, Math.PI/4 - hh);	//or ymove - should check what way up want models to be. PI/4 is onto surface of duocylinder
		
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,mMatrix);
	}
	
	
	//draw blender object - a csg cube minus sphere. draw 8 cells for tesseract.
	var modelScale = guiParams["8-cell scale"];
	gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);

	if (guiParams["draw 8-cell"]){
		drawArrayOfModels(
			cellMatData.d8,
			(guiParams["culling"] ? Math.sqrt(3): false),
			(guiParams["subdiv frames"] ? cubeFrameSubdivBuffers: cubeFrameBuffers)
		);	
	}
	
	
	if (guiParams["draw 16-cell"]){
		var cellScale = 4/Math.sqrt(6);		//in the model, vertices are 0.75*sqrt(2) from the centre, and want to scale to tan(PI/3)=sqrt(3)		
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [cellScale,cellScale,cellScale]);
		
		drawArrayOfModels(
			cellMatData.d16,
			(guiParams["culling"] ? 1.73: false),
			(guiParams["subdiv frames"]? tetraFrameSubdivBuffers: tetraFrameBuffers)
		);
	}
	
	
	if (guiParams["draw 24-cell"]){
		modelScale = 1.0;
		modelScale*=guiParams["24-cell scale"];
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
	
		drawArrayOfModels(
			cellMatData.d24.cells,
			(guiParams["culling"] ? 1: false),
			(guiParams["subdiv frames"] ? octoFrameSubdivBuffers : octoFrameBuffers)
		);	
	}
	
	if (guiParams["draw 5-cell"]){
		var moveDist = Math.acos(-0.25);
		modelScale = 2*moveDist;		
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
		
		drawArrayOfModels(
			cellMatData.d5,
			false,
			(guiParams["subdiv frames"] ? tetraFrameSubdivBuffers : tetraFrameBuffers)
		);
	}
	
	mat4.set(invertedWorldCamera, mvMatrix);
	
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.darkGray);	//DARK

	var sortId = sortIdForMatrix(mvMatrix);	//lookup sort order for cells
	
	//new draw dodeca stuff...
	if (guiParams["draw 120-cell"]){
		var cullVal =  dodecaScale*(0.4/0.515);
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [dodecaScale,dodecaScale,dodecaScale]);
		drawArrayOfModels(
			cellMatData.d120[sortId],
			(guiParams["culling"] ? cullVal: false),
			dodecaFrameBuffers
		);
	}
	
	if (guiParams["draw 600-cell"]){		
		var myscale=0.386;	//todo use correct scale
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [myscale,myscale,myscale]);
		
		drawArrayOfModels(
			cellMatData.d600[sortId],
			(guiParams["culling"] ? 0.355: false),
			(guiParams["subdiv frames"]? tetraFrameSubdivBuffers: tetraFrameBuffers)
		);
	}
	
	//todo this should take buffers, shaders and call prepBuffersForDrawing, drawObjectFromPreppedBuffers
	function drawArrayOfModels(cellMats, cullRad, buffers){
		prepBuffersForDrawing(buffers, shaderProgramTexmap);
		numDrawn = 0;
		if (!cullRad){
			drawArrayForFunc(function(){
				drawObjectFromPreppedBuffers(buffers, shaderProgramTexmap);
				numDrawn++;
				});
		}else{
			drawArrayForFunc(function(){
				if (frustrumCull(mvMatrix,cullRad)){
					drawObjectFromPreppedBuffers(buffers, shaderProgramTexmap);
					numDrawn++;
				}
			});
		}
	
		function drawArrayForFunc(drawFunc2){
			for (cc in cellMats){
				var thisCell = cellMats[cc];
				mat4.set(invertedWorldCamera, mvMatrix);
				mat4.multiply(mvMatrix,thisCell);
				mat4.set(thisCell, mMatrix);	//not needed in all shaders
				drawFunc2();
			}
		}
		
		//console.log("num drawn: " + numDrawn);
	}

	//general stuff used for all 4vec vertex format objects (currently)
	mat4.set(invertedWorldCamera, mvMatrix);
	rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
	mat4.identity(mMatrix);							//better to set M, V matrices and leave MV for shader?
	rotate4mat(mMatrix, 0, 1, duocylinderSpin);
	activeShaderProgram = shaderProgramTexmap4VecAtmos;
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram);
	
	if (guiParams["random boxes"].singleBuffer){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.randBoxes);
		drawTennisBall(randBoxBuffers, activeShaderProgram);	//todo draw subset of buffer according to ui controlled number
	}
	if (guiParams.drawShapes.singleBufferTowers){		//note does not yet support coloured vertices
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.darkGray);
		drawTennisBall(towerBoxBuffers, activeShaderProgram);
	}
	if (guiParams.drawShapes.singleBufferStonehenge){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.gray);
		drawTennisBall(stonehengeBoxBuffers, activeShaderProgram);
	}
	if (guiParams.drawShapes.singleBufferRoads){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.darkGray);
		drawTennisBall(roadBoxBuffers, activeShaderProgram);
	}
	
	if (worldInfo.duocylinderModel!='none'){
		drawDuocylinderObject(duocylinderObjects[worldInfo.duocylinderModel]);
	}
	if (worldInfo.seaActive){
		drawDuocylinderObject(duocylinderObjects['sea'], guiParams.seaLevel);
	}
	
	function drawDuocylinderObject(duocylinderObj, zeroLevel){		
		//use a different shader program for solid objects (with 4-vector vertices, premapped onto duocylinder), and for sea (2-vector verts. map onto duocylinder in shader)
		if (!duocylinderObj.isSea){
			if (duocylinderObj.hasVertColors){
				activeShaderProgram = shaderProgramTexmapColor4VecAtmos;	//not variants implemented
			}else{
				activeShaderProgram = duocylinderObj.useMapproject? (guiParams["atmosShader"]?(guiParams["altAtmosShader"]?shaderProgramTexmap4VecMapprojectAtmosV2:shaderProgramTexmap4VecMapprojectAtmos):shaderProgramTexmap4VecMapproject) : (guiParams["atmosShader"]?(guiParams["altAtmosShader"]?shaderProgramTexmap4VecAtmosV2:shaderProgramTexmap4VecAtmos):shaderProgramTexmap4Vec);
			}
			gl.useProgram(activeShaderProgram);
		}else{
			activeShaderProgram = guiParams["atmosShader"]? (guiParams["altAtmosShader"]?shaderProgramDuocylinderSeaAtmosV2:shaderProgramDuocylinderSeaAtmos):shaderProgramDuocylinderSea;
			gl.useProgram(activeShaderProgram);
			gl.uniform1f(activeShaderProgram.uniforms.uTime, seaTime);			
			gl.uniform1f(activeShaderProgram.uniforms.uZeroLevel, zeroLevel);
		}
		if (activeShaderProgram.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader
			gl.uniform4fv(activeShaderProgram.uniforms.uCameraWorldPos, [worldCamera[12],worldCamera[13],worldCamera[14],worldCamera[15]]);
		}
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);
		performCommon4vecShaderSetup(activeShaderProgram);
		
		drawTennisBall(duocylinderObj, activeShaderProgram);
	}
	
	function performCommon4vecShaderSetup(activeShaderProgram){	//todo move to top level? are inner functions inefficient?
		if (activeShaderProgram.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader
			gl.uniform4fv(activeShaderProgram.uniforms.uCameraWorldPos, [worldCamera[12],worldCamera[13],worldCamera[14],worldCamera[15]]);
		}
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
	}
	
	//draw objects without textures
	activeShaderProgram = shaderProgramColored;
	gl.useProgram(activeShaderProgram);
	
	if (activeShaderProgram.uniforms.uVertexMove){
		gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, guiParams.normalMove);
	}
	
	gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0,0]);	//no emmision
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);

	//gl.disableVertexAttribArray(1);	//don't need texcoords

	//TODO this only 
	//if (activeShaderProgram.uniforms.uReflectorPos){
		gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
		gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	//}
	
	if (guiParams.drawShapes.teapot){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.teapot);	//BLUE
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0.1,0.3]);	//some emission

		modelScale = guiParams.drawShapes["teapot scale"];
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,teapotMatrix);		
		drawObjectFromBuffers(teapotBuffers, shaderProgramColored);
	}
	
	if (guiParams.drawShapes.hyperboloid){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.gray);
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0,0]);	//no emission
		modelScale = 1.0;
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
		/*
		//draw a single tower
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,teapotMatrix);		
		xyzmove4mat(mvMatrix,[0,0.695,0]);	
		xyzrotate4mat(mvMatrix,[-Math.PI/2,0,0]);	
		drawObjectFromBuffers(hyperboloidBuffers, shaderProgramColored);
		*/
		
		//reuse logic for drawing towers
		prepBuffersForDrawing(hyperboloidBuffers, activeShaderProgram);
		
		for (var bb of duocylinderBoxInfo.hyperboloids.list){
			drawPreppedBufferOnDuocylinderForBoxData(bb, activeShaderProgram, hyperboloidBuffers, invertedWorldCameraDuocylinderFrame);
		}
	}
	
	
	var drawFunc = guiParams["draw spaceship"]? drawSpaceship : drawBall;
	
	//TODO permanent
	var sshipMatrixShifted = mat4.create();
	mat4.set(sshipMatrix, sshipMatrixShifted);
	
	//MOVE MODEL AWAY FROM PORTAL.
	//in order to jump camera across portal to avoid too close rendering issues (z-buffer)
	//should do this for everything! (maybe nicer to use special (inv)cameraMatrix ?)
	//likely sufficient to just do for camera and spaceship initially.
	//what to do about lights, bullets etc consider later.
	//basically idea is to move everything in the same direction - along line of portal to camera.
	//conceivably current code will only work for objects near camera. TODO test.
	
	xyzmove4mat(sshipMatrixShifted, moveAwayVec);
	
	if (sshipWorld == colorsSwitch){ //only draw spaceship if it's in the world that currently drawing. (TODO this for other objects eg shots)
		drawFunc(sshipMatrixShifted);
	}else{
		if (checkWithinReflectorRange(sshipMatrixShifted, Math.tan(Math.atan(reflectorInfo.rad) +0.1))){
			var portaledMatrix = mat4.create();
			mat4.set(sshipMatrixShifted, portaledMatrix);
			moveMatrixThruPortal(portaledMatrix, reflectorInfo.rad, 1);
			
			drawFunc(portaledMatrix);
		}	
	}
	
	
	function drawSpaceship(matrix){
		
		//temp switch back to texmap shader (assume have already set general uniforms for this)	-	TODO put uniforms in!!
		//activeShaderProgram = shaderProgramTexmap;
		activeShaderProgram = shaderProgramTexmapPerPixelDiscardAtmosGradLight;
		gl.useProgram(activeShaderProgram);
		
		gl.activeTexture(gl.TEXTURE0);
		bind2dTextureIfRequired(sshipTexture);	
		
		//set uniforms - todo generalise this code (using for many shaders)
		gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
		if (activeShaderProgram.uniforms.uReflectorDiffColor){
				gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
		}
		if (activeShaderProgram.uniforms.uPlayerLightColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
		}
		gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
		gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
		
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [boxSize,boxSize,boxSize]);
		gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
			
		
		
		var rotatedMatrix = mat4.create(matrix);	//because using rotated model data for sship model
		xyzrotate4mat(rotatedMatrix, [-Math.PI/2,0,0]); 
		
		modelScale=25*sshipModelScale;	//TODO use object that doesn't require scaling
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.gray);
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0,0]);
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [modelScale,modelScale,modelScale]);
		
		//special uniform for this shader
		gl.uniform3fv(activeShaderProgram.uniforms.uLightPosPlayerFrame, [-rotatedMatrix[3],-rotatedMatrix[7],-rotatedMatrix[11]]);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		
		mat4.multiply(mvMatrix,rotatedMatrix);
		mat4.set(rotatedMatrix, mMatrix);
		drawObjectFromBuffers(sshipBuffers, shaderProgramTexmapPerPixelDiscardAtmosGradLight);
		
		//switch back to coloured shader
		activeShaderProgram = shaderProgramColored;
		gl.useProgram(activeShaderProgram);
		
		//draw guns
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,matrix);
		mat4.set(matrix, mMatrix);
		
		var gunScale = 50*sshipModelScale;
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [gunScale,gunScale,gunScale]);
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.guns);	//GREY
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [gunHeat/15,gunHeat/30,gunHeat/45]);
														
		prepBuffersForDrawing(gunBuffers, shaderProgramColored);
		
		var inverseSshipMat = mat4.create(sshipMatrixNoInterp); //todo persist this matrix/ store inverseSshipMat*gunMatrix
		mat4.transpose(inverseSshipMat);
					
		for (var mm of gunMatrices){
			drawGun(mm);
		}
		
		function drawGun(gunMatrix){
			//taking the gun matrix rotation relative to the spaceship matrix, then applying this to the cosmetic spaceship matrix (therefore including rendering hack position shift, and version reflected in portal)
			mat4.identity(mvMatrix);
			mat4.multiply(mvMatrix, invertedWorldCamera);
			mat4.multiply(mvMatrix, matrix);
			mat4.multiply(mvMatrix, inverseSshipMat);
			mat4.multiply(mvMatrix, gunMatrix);
			
			//mat4.set(invertedWorldCamera, mvMatrix);
			//mat4.multiply(mvMatrix,gunMatrixCosmetic);
			
			//mat4.set(gunMatrix, mMatrix);	//this is wrong!
			mat4.set(matrix, mMatrix);	//todo make this more efficient by combining with above
			mat4.multiply(mMatrix, inverseSshipMat);
			mat4.multiply(mMatrix, gunMatrix);
			
			drawObjectFromPreppedBuffers(gunBuffers, shaderProgramColored);
		}
		
		//landing gear - just 3 balls.
		prepBuffersForDrawing(sphereBuffers, shaderProgramColored);
		//prepBuffersForDrawing(gunBuffers, shaderProgramColored);
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [0.001,0.001,0.001]);
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.superDarkGray);	//DARK
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0,0]);
		
		for (gear of landingLegData){
		//	drawLandingBall(gear.pos);
		}
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.blue);
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0.01,0.01,0.6]);
		//draw "thrusters". TODO make look better, transparent so should render last, brightness according to analog input, "playerlight" to match (direction+magnitude)
		if (currentThrustInput[2]>0){					//rearward thrusters
			drawLandingBall([0.006,0.0035,-0.0085]);	//	left ,down	,fwd
			drawLandingBall([0.006,-0.0035,-0.0085]);
			drawLandingBall([-0.006,0.0035,-0.0085]);
			drawLandingBall([-0.006,-0.0035,-0.0085]);
		}
		if (currentThrustInput[2]<0){				//forward thrusters
			drawLandingBall([0.006,0.0035,0.004]);
			drawLandingBall([0.006,-0.0035,0.004]);		
			drawLandingBall([-0.006,0.0035,0.004]);		
			drawLandingBall([-0.006,-0.0035,0.004]);
		}
		if (currentThrustInput[0]<0){				//left
			drawLandingBall([0.007,0.0035,0.003]);
			drawLandingBall([0.007,-0.0035,0.003]);
			drawLandingBall([0.007,0.0035,-0.0075]);
			drawLandingBall([0.007,-0.0035,-0.0075]);
		}
		if (currentThrustInput[0]>0){				//right
			drawLandingBall([-0.007,0.0035,0.003]);
			drawLandingBall([-0.007,-0.0035,0.003]);
			drawLandingBall([-0.007,0.0035,-0.0075]);
			drawLandingBall([-0.007,-0.0035,-0.0075]);
		}
		if (currentThrustInput[1]>0){				//top
			drawLandingBall([0.006,-0.0045,0.003]);
			drawLandingBall([-0.006,-0.0045,0.003]);
			drawLandingBall([0.006,-0.0045,-0.0075]);
			drawLandingBall([-0.006,-0.0045,-0.0075]);
		}
		if (currentThrustInput[1]<0){				//bottom
			drawLandingBall([0.006,0.0045,0.003]);
			drawLandingBall([-0.006,0.0045,0.003]);
			drawLandingBall([0.006,0.0045,-0.0075]);
			drawLandingBall([-0.006,0.0045,-0.0075]);
		}
	
		function drawLandingBall(posn){			 
			lgMat = mat4.create(sshipMatrix);
			xyzmove4mat(lgMat, posn);
			
			//mat4.set(invertedWorldCamera, mvMatrix);	//no shift version
			//mat4.multiply(mvMatrix, lgMat);
			
			//apply the shift hack as with guns.
			mat4.set(matrix, mMatrix);
			mat4.multiply(mMatrix, inverseSshipMat);
			mat4.multiply(mMatrix, lgMat);
			
			
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, mMatrix);

			drawObjectFromPreppedBuffers(sphereBuffers, shaderProgramColored);
		}
		
	}
		
	function drawBall(matrix){
		//draw "light" object
		var sphereRad = settings.playerBallRad;
		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [sphereRad,sphereRad,sphereRad]);
		var voxColliding = (voxCollisionCentralLevel>0) || (distBetween4mats(playerCamera, closestPointTestMat) < sphereRad); 
						//sphere centre inside voxel volume OR sphere intersects with voxel zero surface.
			//note could just have a simple signed distance, of vox field value divided by magnitide of gradient. however, current gradient is in abc space. TODO make work with this clunky version, then try abc-> player space gradient conversion, check results are consistent.
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, voxColliding ? colorArrs.red: colorArrs.white);
		gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0,0,0]);
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
					gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.target);
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
					gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);
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
			activeShaderProgram = guiParams["atmosShader"]?(guiParams["altAtmosShader"]?shaderProgramVertprojCubemapAtmosV2:shaderProgramVertprojCubemapAtmos):shaderProgramVertprojCubemap;
			break;
		}
		gl.useProgram(activeShaderProgram);
		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uPosShiftMat, false, reflectorInfo.shaderMatrix);
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);
		gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
		if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
		}
		if (activeShaderProgram.uniforms.uPlayerLightColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
		}
		if (activeShaderProgram.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader
			gl.uniform4fv(activeShaderProgram.uniforms.uCameraWorldPos, [worldCamera[12],worldCamera[13],worldCamera[14],worldCamera[15]]);
		}

		gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, [reflectorInfo.rad,reflectorInfo.rad, reflectorInfo.rad]);
	
		gl.uniform1f(activeShaderProgram.uniforms.uPolarity, reflectorInfo.polarity);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.identity(mMatrix);
		
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
		if (bullets[b].active && bullets[b].world == colorsSwitch){
			var bulletMatrix=bullets[b].matrix;
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,bulletMatrix);
			if (frustrumCull(mvMatrix,targetRad)){	
				drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			}
		}
	}
	
	var maxShockRadAng = 1;
	
	for (var ee in explosions){
		var singleExplosion = explosions[ee];
		if (singleExplosion.world == colorsSwitch){
			if (singleExplosion.rotateWithDuocylinder){
				mat4.set(invertedWorldCameraDuocylinderFrame, mvMatrix);
			}else{
				mat4.set(invertedWorldCamera, mvMatrix);
			}
			mat4.multiply(mvMatrix,singleExplosion.matrix);
			
			//var radius = singleExplosion.life*0.0002;
			var radius = (100-singleExplosion.life)*singleExplosion.size;
			//var radius = 0.01;
			var opac = 0.01*singleExplosion.life;
			
			if (frustrumCull(mvMatrix,radius)){	
					//TODO check is draw order independent transparency
				gl.uniform3fv(transpShadProg.uniforms.uEmitColor, singleExplosion.color.map(function(val){return val*opac;}));
				gl.uniform3fv(transpShadProg.uniforms.uModelScale, [radius,radius,radius]);
				drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			}
			
			//larger shockwave, should match sound
			var largeRadiusAng = radius * (100-singleExplosion.life)*5;	//note that speed of sound delay approximation currently used 4vec distance, not curve, so this will only match up for small distances. 5 is a guess that seems about right. TODO work out properly!
			if (largeRadiusAng<maxShockRadAng){
				var largeRadius = Math.tan(largeRadiusAng);
				if (frustrumCull(mvMatrix,largeRadius)){	//todo larger max shock rad for larger singleExplosion.size
					var largeOpac = 0.1*(1-(largeRadiusAng/maxShockRadAng));	//linearly drop opacity as sphere expands (simple)
					gl.uniform3fv(transpShadProg.uniforms.uEmitColor, singleExplosion.color.map(function(val){return val*largeOpac;}));	//TODO neutral colour
					gl.uniform3fv(transpShadProg.uniforms.uModelScale, [largeRadius,largeRadius,largeRadius]);
					drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
				}
			}
			
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
	return function(objcontainer, size, color, rotateWithDuocylinder, hasSound){
		this.matrix = objcontainer.matrix;
		this.world= objcontainer.world;
		this.size = size;
		this.color = color;
		this.life=100;
		explosions[nextExplId]=this;
		nextExplId+=1;
		this.rotateWithDuocylinder=rotateWithDuocylinder;
		
		if (hasSound){
			this.sound = myAudioPlayer.playBombSound(0,0);
		}
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


function enableDisableAttributes(shaderProg){
	//avoid issue where if object with a lot of attributes has a shader loaded and enableVertexAttribArray was called,
	//and nothing is bound to it, won't draw anything. 
	//just disable lots (TODO keep track of which are enabled and enable/disable as required
	for (var ii=0;ii<8;ii++){
		gl.disableVertexAttribArray(ii);
	}
	Object.keys(shaderProg.attributes).forEach(function(item, index){
		gl.enableVertexAttribArray(gl.getAttribLocation(shaderProg, item));
	});
}

function drawTennisBall(duocylinderObj, shader){
	enableDisableAttributes(shader);

	gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexPositionBuffer);
    gl.vertexAttribPointer(shader.attributes.aVertexPosition, duocylinderObj.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	if (duocylinderObj.normalBuffer){	//not used in duocylinder-sea
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.normalBuffer);
		gl.vertexAttribPointer(shader.attributes.aVertexNormal, duocylinderObj.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (duocylinderObj.vertexColorBuffer){
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexColorBuffer);
		gl.vertexAttribPointer(shader.attributes.aVertexColor, duocylinderObj.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (duocylinderObj.vertexTextureCoordBuffer){	//not used in duocylinder-sea
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexTextureCoordBuffer);
		gl.vertexAttribPointer(shader.attributes.aTextureCoord, duocylinderObj.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (duocylinderObj.vertexTriCoordBuffer){
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexTriCoordBuffer);
		gl.vertexAttribPointer(shader.attributes.aTriCoord, duocylinderObj.vertexTriCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (duocylinderObj.vertexTriNormalBuffer){	//note could combo if with vertexTriCoordBuffer
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexTriNormalBuffer);
		gl.vertexAttribPointer(shader.attributes.aTriNormal, duocylinderObj.vertexTriNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, duocylinderObj.vertexIndexBuffer);
	
	gl.activeTexture(gl.TEXTURE0);
	bind2dTextureIfRequired(duocylinderObj.tex);
	gl.uniform1i(shader.uniforms.uSampler, 0);
	
	//for (var side=0;side<2;side++){	//draw 2 sides
		for (var xg=0;xg<duocylinderObj.divs;xg+=1){		//
			for (var yg=0;yg<duocylinderObj.divs;yg+=1){	//TODO precalc cells array better than grids here.
				setMatrixUniforms(shader);
				gl.drawElements(duocylinderObj.isStrips? gl.TRIANGLE_STRIP : gl.TRIANGLES, duocylinderObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				//gl.drawElements(duocylinderObj.isStrips? gl.LINES : gl.TRIANGLES, duocylinderObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				rotate4mat(mvMatrix, 0, 1, duocylinderObj.step);
				rotate4mat(mMatrix, 0, 1, duocylinderObj.step);
			}
			rotate4mat(mvMatrix, 2, 3, duocylinderObj.step);
			rotate4mat(mMatrix, 2, 3, duocylinderObj.step);
		}
	//	xmove4mat(mvMatrix, 0.5*Math.PI);			//switch to 
	//	rotate4mat(mvMatrix, 1, 2, Math.PI*0.5);	//other side..
	//}
	
}

function drawObjectFromBuffers(bufferObj, shaderProg, usesCubeMap){
	prepBuffersForDrawing(bufferObj, shaderProg, usesCubeMap);
	drawObjectFromPreppedBuffers(bufferObj, shaderProg);
}
function prepBuffersForDrawing(bufferObj, shaderProg, usesCubeMap){
	enableDisableAttributes(shaderProg);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, bufferObj.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	if (bufferObj.vertexNormalBuffer && shaderProg.attributes.aVertexNormal){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexNormalBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexNormal, bufferObj.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (bufferObj.vertexVelocityBuffer && shaderProg.attributes.aVertexVelocity){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexVelocityBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexVelocity, bufferObj.vertexVelocityBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (bufferObj.vertexTextureCoordBuffer){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aTextureCoord, bufferObj.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		//gl.activeTexture(gl.TEXTURE0);
		//bind2dTextureIfRequired(texture);
		gl.uniform1i(shaderProg.uniforms.uSampler, 0);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);

	
	if (usesCubeMap){
		gl.uniform1i(shaderProg.uniforms.uSampler, 1);	//put cubemap in tex 1 always, avoiding bind calls.
	}
	
	if (shaderProg.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader. TODO do less ofteen (move camera less often than switch buffers)
		gl.uniform4fv(shaderProg.uniforms.uCameraWorldPos, [worldCamera[12],worldCamera[13],worldCamera[14],worldCamera[15]]);
	}
	if (shaderProg.uniforms.uAtmosContrast){	//todo do less often (at least query ui less often)
		gl.uniform1f(shaderProg.uniforms.uAtmosContrast, guiParams.atmosContrast);
	}
	if (shaderProg.uniforms.uAtmosThickness){	//todo do less often (at least query ui less often)
		gl.uniform1f(shaderProg.uniforms.uAtmosThickness, guiParams.atmosThickness);
	}
	
	gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
}
function drawObjectFromPreppedBuffers(bufferObj, shaderProg){
	gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);
	if (shaderProg.uniforms.uMMatrix){gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);}
	gl.drawElements(gl.TRIANGLES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//gl.drawElements(gl.LINES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

var bind2dTextureIfRequired = (function createBind2dTextureIfRequiredFunction(){
	var currentlyBoundTexture=null;
	return function(texToBind){	//todo specify texture index. maybe combine with setting texture index so can automatically keep textures loaded
								//curently just assuming using tex 0, already set as active texture (is set active texture a fast gl call?)
		if (texToBind != currentlyBoundTexture){
			gl.bindTexture(gl.TEXTURE_2D, texToBind);
			currentlyBoundTexture = texToBind;
		}
	}
})();


//need all of these???
var moveAwayVec;
var mMatrix = mat4.create();
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var playerCamera = mat4.create();
var playerCameraInterp = mat4.create();
var offsetPlayerCamera = mat4.create();
var playerContainer = {matrix:playerCamera, world:0}
var offsetCameraContainer = {matrix:offsetPlayerCamera, world:0}

var worldCamera = mat4.create();

var cmapPMatrix = mat4.create();
setProjectionMatrix(cmapPMatrix, -90.0, 1.0);	//-90 gets reflection to look right. (different for portal?)
var squareFrustrumCull = generateCullFunc(cmapPMatrix);

var invertedWorldCamera = mat4.create();
var invertedWorldCameraDuocylinderFrame = mat4.create();
var invertedPlayerCamera = mat4.create();

var tmpRelativeMat = mat4.create();
var identMat = mat4.identity();

var closestPointTestMat = mat4.create();	//TODO maybe more efficient to just use a point here. (matrix is used to draw debug something, but could convert to matrix only when debug drawing...
var voxCollisionCentralLevel =0;
var voxCollisionDebugMat = mat4.create();	//in player frame, showing where the collison/reaction
var lastVoxPenetration = 0;

var closestBoxDist=100;	//initialise to arbitrarily large. TODO store point so pan sound	

function setMatrixUniforms(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.uniforms.uPMatrix, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.uniforms.uMVMatrix, false, mvMatrix);
	if (shaderProgram.uniforms.uMMatrix){gl.uniformMatrix4fv(shaderProgram.uniforms.uMMatrix, false, mMatrix);}
	if (shaderProgram.uniforms.uAtmosContrast){	//todo do less often (at least query ui less often)
		gl.uniform1f(shaderProgram.uniforms.uAtmosContrast, guiParams.atmosContrast);
	}
	if (shaderProgram.uniforms.uAtmosThickness){	//todo do less often (at least query ui less often)
		gl.uniform1f(shaderProgram.uniforms.uAtmosThickness, guiParams.atmosThickness);
	}
}

var cubemapFramebuffer;
var cubemapTexture;
var cubemapSize = 1024;
//cube map code from http://www.humus.name/cubemapviewer.js (slightly modified)
var cubemapFacelist;

function initCubemapFramebuffer(){
	cubemapFramebuffer = [];
	
	cubemapTexture = gl.createTexture();
	
	gl.activeTexture(gl.TEXTURE1);	//use texture 1 always for cubemap
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
		
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		//gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texImage2D(face, 0, gl.RGBA, cubemapSize, cubemapSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, cubemapSize, cubemapSize);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, cubemapTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	}
	//gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);	//this gets rid of errors being logged to console. 
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
}

function setupScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	mat4.identity(playerCamera);	//not sure why have 2 matrices here...
	//bung extra quaternion stuff onto this for quick test
	playerCamera.qPair = [[1,0,0,0],[1,0,0,0]];
	
	//start player off outside of boxes
	xyzmove4mat(playerCamera,[0,1,-1]);	//left, down, 
	
	targetMatrix = cellMatData.d16[0];
}

var texture,hudTexture,hudTextureSmallCircles,hudTexturePlus,hudTextureX,hudTextureBox,sshipTexture;

function initTexture(){
	texture = makeTexture("img/0033.jpg");
	hudTexture = makeTexture("img/circles.png");
	hudTextureSmallCircles = makeTexture("img/smallcircles.png");
	hudTexturePlus = makeTexture("img/plus.png");
	hudTextureX = makeTexture("img/x.png");
	hudTextureBox = makeTexture("img/box.png");
	duocylinderObjects.grid.tex = makeTexture("img/grid-omni.png");
	duocylinderObjects.terrain.tex = makeTexture("data/terrain/turbulent-seamless.png");
	//duocylinderObjects.procTerrain.tex = texture;
	duocylinderObjects.procTerrain.tex = makeTexture("img/14131-diffuse.jpg");  //sand

	duocylinderObjects.procTerrain.useMapproject = true;
	
	//duocylinderObjects.sea.tex = null;
	duocylinderObjects.sea.tex = makeTexture("img/4141.jpg");
	//duocylinderObjects.sea.tex = makeTexture("img/ash_uvgrid01.jpg");
	duocylinderObjects.sea.isSea=true;
	
	sshipTexture = makeTexture("data/dirLight/SshipTexCombouv5FR40pc.png");
	
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/ash_uvgrid01.jpg");
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/cretish0958.png");
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/13787.jpg");
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/2100-v1.jpg");
	duocylinderObjects.voxTerrain.tex = makeTexture("img/4483-v7.jpg");	//rust

	duocylinderObjects.voxTerrain.hasVertColors=true;
	duocylinderObjects.voxTerrain.usesTriplanarMapping=true;	//note that hasVertColors, usesTriplanarMapping currently equivalent (has both or neither)
	
	randBoxBuffers.tex=texture;
	towerBoxBuffers.tex=texture;
	stonehengeBoxBuffers.tex=texture;
	roadBoxBuffers.tex=texture;
	
	//texture = makeTexture("img/ash_uvgrid01-grey.tiny.png");	//numbered grid
}

function makeTexture(src) {	//to do OO
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function(){
		bind2dTextureIfRequired(texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);	//linear colorspace grad light texture (TODO handle other texture differently?)
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		bind2dTextureIfRequired(null);
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

var pointerLocked=false;
var guiParams={
	world0:{duocylinderModel:"voxTerrain",seaActive:true},
	world1:{duocylinderModel:"voxTerrain",seaActive:false},
	duocylinderRotateSpeed:0,
	seaLevel:-0.012,
	drawShapes:{
		boxes:{
		'y=z=0':false,	//x*x+w*w=1
		'x=z=0':false,	//y*y+w*w=1
		'x=y=0':false,	//z*z+w*w=1
		'x=w=0':false,
		'y=w=0':false,
		'z=w=0':false
		},
		teapot:false,
		"teapot scale":0.7,
		towers:false,
		singleBufferTowers:true,
		explodingBox:true,
		hyperboloid:false,
		stonehenge:false,
		singleBufferStonehenge:true,
		roads:false,
		singleBufferRoads:true
	},
	'random boxes':{
		number:maxRandBoxes,	//note ui controlled value does not affect singleBuffer
		size:0.01,
		collision:false,
		singleBuffer:true
	},
	"draw 5-cell":false,
	"subdiv frames":true,
	"draw 8-cell":false,
	"8-cell scale":0.3,		//0.5 to tesselate
	"draw 16-cell":false,
	"draw 24-cell":false,
	"24-cell scale":1,
	"draw 120-cell":false,
	"draw 600-cell":false,
	"draw spaceship":false,
	"drop spaceship":false,
	target:{
		type:"none",
		scale:0.03
	},
	"targeting":"off",
	"culling":true,
	"perPixelLighting":true,
	"atmosShader":true,
	"altAtmosShader":false,
	"atmosThickness":0.2,
	"atmosContrast":2.0,
	//fogColor0:'#b2dede',
	//fogColor0:'#b451c5',
	fogColor0:'#aaaaaa',
	fogColor1:'#000000',
	playerLight:'#ffffff',
	onRails:false,
	handbrake:false,
	spinCorrection:true,
	cameraType:"far 3rd person 2",
	cameraFov:115,
	flipReverseCamera:false,	//flipped camera makes direction pointing behavour match forwards, but side thrust directions switched, seems less intuitive
	showHud:false,
	renderViaTexture:'bennyBox',
	reflector:{
		draw:true,
		cmFacesUpdated:6,
		mappingType:'vertex projection',
		scale:0.3,
		isPortal:true,
		moveAway:0.0005
	},
	debug:{
		closestPoint:false,
		buoys:false
	},
	normalMove:0
};
var settings = {
	playerBallRad:0.01,
}

var worldColors=[];
var playerLightUnscaled;
var playerLight;
var muzzleFlashAmounts=[0,0,0,0];
var teapotMatrix=mat4.create();mat4.identity(teapotMatrix);
//xyzmove4mat(teapotMatrix,[0,1.85,0]);
xyzmove4mat(teapotMatrix,[0,0,-0.5]);
var sshipMatrix=mat4.create();mat4.identity(sshipMatrix);
var sshipMatrixNoInterp=mat4.create();mat4.identity(sshipMatrixNoInterp);
var targetMatrix=mat4.create();mat4.identity(targetMatrix);
var targetWorldFrame=[];
var targetingResultOne=[];
var targetingResultTwo=[];
var selectedTargeting="none";
var bullets=[];
var gunMatrices=[];
var canvas;

var collisionTestObjMat = mat4.identity();
var collisionTestObj2Mat = mat4.identity();
var collisionTestObj3Mat = mat4.identity();
var collisionTestObj4Mat = mat4.identity();
var collisionTestObj5Mat = mat4.identity();

function init(){

	stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );

	guiParams.lockPointer = function(){
		canvas.requestPointerLock();
		gui.close();
	}
	
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
	var world0Folder = drawShapesFolder.addFolder('world0');
	world0Folder.add(guiParams.world0, "duocylinderModel", ["grid","terrain","procTerrain",'voxTerrain','none'] );
	world0Folder.add(guiParams.world0, "seaActive" );
	var world1Folder = drawShapesFolder.addFolder('world1');
	world1Folder.add(guiParams.world1, "duocylinderModel", ["grid","terrain","procTerrain",'voxTerrain','none'] );
	world1Folder.add(guiParams.world1, "seaActive" );
	drawShapesFolder.add(guiParams, "seaLevel", -0.05,0.05,0.005);
	drawShapesFolder.add(guiParams, "duocylinderRotateSpeed", -2.5,2.5,0.25);
	var boxesFolder = drawShapesFolder.addFolder('boxes');
	for (shape in guiParams.drawShapes.boxes){
		console.log(shape);
		boxesFolder.add(guiParams.drawShapes.boxes, shape );
	}
	var randBoxesFolder = drawShapesFolder.addFolder("random boxes");
	randBoxesFolder.add(guiParams["random boxes"],"number",0,maxRandBoxes,20);
	randBoxesFolder.add(guiParams["random boxes"],"size",0.001,0.01,0.001);
	randBoxesFolder.add(guiParams["random boxes"],"collision");
	randBoxesFolder.add(guiParams["random boxes"],"singleBuffer");
	drawShapesFolder.add(guiParams.drawShapes,"teapot");
	drawShapesFolder.add(guiParams.drawShapes,"teapot scale",0.2,2.0,0.05);
	drawShapesFolder.add(guiParams.drawShapes,"towers");
	drawShapesFolder.add(guiParams.drawShapes,"singleBufferTowers");
	drawShapesFolder.add(guiParams.drawShapes,"explodingBox");
	drawShapesFolder.add(guiParams.drawShapes,"hyperboloid");
	drawShapesFolder.add(guiParams.drawShapes,"stonehenge");
	drawShapesFolder.add(guiParams.drawShapes,"singleBufferStonehenge");
	drawShapesFolder.add(guiParams.drawShapes,"roads");
	drawShapesFolder.add(guiParams.drawShapes,"singleBufferRoads");
	
	var polytopesFolder = gui.addFolder('polytopes');
	polytopesFolder.add(guiParams,"draw 5-cell");
	polytopesFolder.add(guiParams,"draw 8-cell");
	polytopesFolder.add(guiParams,"8-cell scale",0.05,2.0,0.05);
	polytopesFolder.add(guiParams,"draw 16-cell");
	polytopesFolder.add(guiParams,"subdiv frames");
	polytopesFolder.add(guiParams,"draw 24-cell");
	polytopesFolder.add(guiParams,"24-cell scale",0.05,2.0,0.05);
	polytopesFolder.add(guiParams,"draw 120-cell");
	polytopesFolder.add(guiParams,"draw 600-cell");
	gui.add(guiParams,"draw spaceship",true);
	gui.add(guiParams, "drop spaceship",false);
	
	var targetFolder = gui.addFolder('target');
	targetFolder.add(guiParams.target, "type",["none", "sphere","box"]);
	targetFolder.add(guiParams.target, "scale",0.005,0.1,0.005);
	targetFolder.add(guiParams, "targeting", ["off","simple","individual"]);
	
	var controlFolder = gui.addFolder('control');	//control and movement
	controlFolder.add(guiParams, "onRails");
	controlFolder.add(guiParams, "handbrake");
	controlFolder.add(guiParams, "spinCorrection");
	controlFolder.add(guiParams, 'lockPointer');
	
	var displayFolder = gui.addFolder('display');	//control and movement
	displayFolder.add(guiParams, "cameraType", ["cockpit", "near 3rd person", "far 3rd person", "far 3rd person 2", "side"]);
	displayFolder.add(guiParams, "cameraFov", 60,120,5);
	displayFolder.add(guiParams, "flipReverseCamera");
	displayFolder.add(guiParams, "showHud");
	displayFolder.add(guiParams, "renderViaTexture", ['no','basic','bennyBoxLite','bennyBox']);
	displayFolder.add(guiParams, "perPixelLighting");
	displayFolder.add(guiParams, "atmosShader");
	displayFolder.add(guiParams, "altAtmosShader");
	displayFolder.add(guiParams, "atmosThickness", 0,0.5,0.05);
	displayFolder.add(guiParams, "atmosContrast", -10,10,0.5);
	displayFolder.add(guiParams, "culling");
	displayFolder.add(guiParams, "normalMove", 0,0.02,0.001);
	
	var debugFolder = gui.addFolder('debug');
	debugFolder.add(guiParams.debug, "closestPoint");
	debugFolder.add(guiParams.debug, "buoys");
	
	var reflectorFolder = gui.addFolder('reflector');
	reflectorFolder.add(guiParams.reflector, "draw");
	reflectorFolder.add(guiParams.reflector, "cmFacesUpdated", 0,6,1);
	reflectorFolder.add(guiParams.reflector, "mappingType", ['projection', 'vertex projection']);
	reflectorFolder.add(guiParams.reflector, "scale", 0.2,2,0.01);
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
	});

	canvas = document.getElementById("mycanvas");
	
	document.addEventListener('pointerlockchange', function lockChangeCb() {
	  if (document.pointerLockElement === canvas ) {
			console.log('The pointer lock status is now locked');
			pointerLocked=true;
		} else {
			console.log('The pointer lock status is now unlocked');  
			pointerLocked=false;
	  }
	}, false);
	
	canvas.addEventListener("mousedown", function(evt){
		mouseInfo.x = evt.offsetX;
		mouseInfo.y = evt.offsetY;
		mouseInfo.dragging = evt.buttons & 1;
		mouseInfo.lastPointingDir = getPointingDirectionFromScreenCoordinate({x:mouseInfo.x, y: mouseInfo.y});
		mouseInfo.buttons = evt.buttons;
		evt.preventDefault();
	});
	canvas.addEventListener("mouseup", function(evt){
		mouseInfo.dragging = evt.buttons & 1;
		mouseInfo.buttons = evt.buttons;
	});
	canvas.addEventListener("mouseout", function(evt){
		mouseInfo.dragging = false;
		mouseInfo.buttons = 0;
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
		if (pointerLocked){
			rotatePlayer([ -0.001* evt.movementY, -0.001* evt.movementX, 0]);	//TODO screen resolution dependent sensitivity.
		}
	});
	
	canvas.addEventListener("touchstart", handleTouchStart, false);
	canvas.addEventListener("touchend", handleTouchEnd, false);
	canvas.addEventListener("touchmove", handleTouchMove, false);
	
	initGL();
	initTextureFramebuffer();
	initShaders();
	initTexture();
	initCubemapFramebuffer();
	initBuffers();
	setFog(0,guiParams.fogColor0);
	setFog(1,guiParams.fogColor1);
	setPlayerLight(guiParams.playerLight);
    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	setupScene();
	requestAnimationFrame(drawScene);
	
	function setFog(world,color){
		var r = parseInt(color.substring(1,3),16) /255;
		var g = parseInt(color.substring(3,5),16) /255;
		var b = parseInt(color.substring(5,7),16) /255;
		worldColors[world]=[r,g,b,1].map(function(elem){return Math.pow(elem,2.2)});	//apply gamma
	}
	function setPlayerLight(color){
		var r = parseInt(color.substring(1,3),16) /255;
		var g = parseInt(color.substring(3,5),16) /255;
		var b = parseInt(color.substring(5,7),16) /255;
		playerLightUnscaled=[r,g,b].map(function(elem){return Math.pow(elem,2.2)});	//apply gamma
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

var duocylinderSpin = 0;
var reverseCamera=false;
var currentThrustInput = [0,0,0];
var iterateMechanics = (function iterateMechanics(){
	var lastTime=Date.now();
	var moveSpeed=0.000075;
	var rotateSpeed=-0.0005;
	var bulletSpeed=0.001;
	
	var playerVelVecBodge=[];
	
	var playerAngVelVec = [0,0,0];
	
	var timeTracker =0;
	var timeStep = 10;
	
	var thrust = 0.01;	//TODO make keyboard/gamepad fair! currently thrust, moveSpeed config independent!
	
	//gamepad
	var activeGp, buttons, axes;
	
	var autoFireCountdown=0;
	//var autoFireCountdownStartVal=6;
	var autoFireCountdownStartVal=1;
	var lastPlayerAngMove = [0,0,0];	//for interpolation
	var duoCylinderAngVelConst=0;
	
	var currentPen=0;	//for bodgy box collision (todo use collision points array)
	
	var playerCameraDuocylinderFrame = mat4.create(playerCamera);		//todo resuse from pool
	
	return function(){
		
		reverseCamera=keyThing.keystate(82) || (mouseInfo.buttons & 4); 	//R or middle mouse click
		
		//GAMEPAD
		activeGp=false;
		//basic gamepad support
		
		//oculus touch controllers are recognised as controllers.
		//to work around, abuse fact that these don't have 10th button.
		//find the 1st gamepad with button 10.

		var gpads=navigator.getGamepads();
		if (gpads){
			for (gpad of gpads){
				if (gpad && gpad.buttons && gpad.buttons[10] && gpad.axes){
					activeGp = gpad;
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
			
			if (buttons[10].pressed){	//L3
				reverseCamera=true;
			}
		}
		
		
		var nowTime = Date.now();
		var timeElapsed = Math.min(nowTime - lastTime, 50);	//ms. 50ms -> slowdown if drop below 20fps 
		//console.log("time elapsed: " + timeElapsed);
		lastTime=nowTime;
		
		duoCylinderAngVelConst = guiParams.duocylinderRotateSpeed;
		
		timeTracker+=timeElapsed;
		var numSteps = Math.floor(timeTracker/timeStep);
		timeTracker-=numSteps*timeStep;
		for (var ii=0;ii<numSteps;ii++){
			stepSpeed();
			gunHeat*=0.995;
			offsetCam.iterate();
		}
		
		//TODO check whether this calculation is redundant (done elsewhere)
		mat4.set(playerCamera, worldCamera);	//TODO check whether playerCamera is main camera or spaceship, decide where microphone should be
		mat4.set(worldCamera, invertedWorldCamera);
		mat4.transpose(invertedWorldCamera);
	
		//equivalent for frame of duocylinder, to reduce complexity of drawing, collision checks etc
		mat4.set(invertedWorldCamera, invertedWorldCameraDuocylinderFrame);
		rotate4mat(invertedWorldCameraDuocylinderFrame, 0, 1, duocylinderSpin);
		
		//mat4.set(playerCamera, playerCameraDuocylinderFrame);
		//rotate4mat(playerCameraDuocylinderFrame, 0, 1, duocylinderSpin);
		
		var soundspd = 2;	//TODO change delaynode creation param (faster sound means less possible delay)
		
		for (var ee in explosions){
			var singleExplosion = explosions[ee];
			singleExplosion.life-=0.6*numSteps;
			if (singleExplosion.life<1){
				delete explosions[ee];
			}
			if (singleExplosion.sound){
				mat4.set(singleExplosion.rotateWithDuocylinder ? invertedWorldCameraDuocylinderFrame:invertedWorldCamera,tmpRelativeMat);
				mat4.multiply(tmpRelativeMat, singleExplosion.matrix);
				
				var distance = distBetween4mats(tmpRelativeMat, identMat);
				//var distance = Math.hypot(tmpRelativeMat[12],tmpRelativeMat[13],tmpRelativeMat[14],tmpRelativeMat[15]-1);	//equivalent to above TODO check perf
				
				var soundSize = 0.03;	//closest distance can get to sound, where volume is 1
				var vol = soundSize/Math.hypot(distance, soundSize);
				var pan = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
				
				singleExplosion.sound.setAll({delay:distance/soundspd, gain:vol, pan:pan});
			}
		}
		
		//TODO general func to set everything or at least calculate settings object. (so don't repeat so much code here and above for explosions)
		//teapot/exploding box visually represents ticking sound (coincidence that exploding box has same tempo! TODO properly synchronise)
		mat4.set(invertedPlayerCamera,tmpRelativeMat);
		mat4.multiply(tmpRelativeMat, teapotMatrix);				
		var distance = distBetween4mats(tmpRelativeMat, identMat);		
		var soundSize = 0.02;	//closest distance can get to sound, where volume is 1
		var vol = soundSize/Math.hypot(distance, soundSize);
		var pan = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards) )
		//console.log("pan: " + pan);
		myAudioPlayer.setClockSound({delay:distance/soundspd, gain:vol, pan:pan});
		
		
		var duocylinderRotate = duoCylinderAngVelConst * timeElapsed*moveSpeed;
		
		if (guiParams["drop spaceship"]){guiParams.duocylinderRotateSpeed=0;}	//bodge to let take pics outside spaceship
							//note doesn't play well with dat.gui - ui doesn't update
							// (TODO have spaceship mechanics apply independent of player when outside)
		
		duocylinderSpin+=duocylinderRotate; 	//TODO match spin speed with sea wave speed
		
		
		if (guiParams.spinCorrection){
			//rotate player in this frame (maybe better to drag towards this angular velocity, with drag prop to atmos density)
			//what is direction along duocylinder in frame of player?
			
			//take a leaf out of other code calculating spinVelWorldCoords, spinVelPlayerCoords
			//todo combine these
			//todo account for rotation while moving wrt duocylinder ? 
			
			var playerPos = [playerCamera[12],playerCamera[13],playerCamera[14],playerCamera[15]];			//guess what this is	
			var axisDirWorldCoords = [ 0,0,playerCamera[15],-playerCamera[14]];						
			var axisDirPlayerCoords = [
				axisDirWorldCoords[2]*playerCamera[2] + axisDirWorldCoords[3]*playerCamera[3],
				axisDirWorldCoords[2]*playerCamera[6] + axisDirWorldCoords[3]*playerCamera[7],
				axisDirWorldCoords[2]*playerCamera[10] + axisDirWorldCoords[3]*playerCamera[11]];
			rotatePlayer(scalarvectorprod(duocylinderRotate,axisDirPlayerCoords));	
		}
		
		function stepSpeed(){	//TODO make all movement stuff fixed timestep (eg changing position by speed)
			
			currentThrustInput[0]=keyThing.keystate(65)-keyThing.keystate(68);	//lateral
			currentThrustInput[1]=keyThing.keystate(32)-keyThing.keystate(220);	//vertical
			currentThrustInput[2]=keyThing.keystate(87)-keyThing.keystate(83);	//fwd/back
			
			currentThrustInput=currentThrustInput.map(function(elem){return elem*thrust;});
			
			playerAngVelVec[0]+=keyThing.keystate(40)-keyThing.keystate(38); //pitch
			playerAngVelVec[1]+=keyThing.keystate(39)-keyThing.keystate(37); //turn
			playerAngVelVec[2]+=keyThing.keystate(69)-keyThing.keystate(81); //roll
			
			if (activeGp){
				//TODO move calculation of total input from keys/gamepad outside this loop
				if (gpSettings.moveEnabled){
					var gpMove=[];
					
					gpMove[0] = Math.abs(axes[0])>gpSettings.deadZone ? -moveSpeed*axes[0] : 0; //lateral
					gpMove[1] = Math.abs(axes[1])>gpSettings.deadZone ? moveSpeed*axes[1] : 0; //vertical
					gpMove[2] = moveSpeed*(buttons[7].value-buttons[6].value); //fwd/back	//note Firefox at least fails to support analog triggers https://bugzilla.mozilla.org/show_bug.cgi?id=1434408
					
					var magsq = gpMove.reduce(function(total, val){return total+ val*val;}, 0);
					gpMove = scalarvectorprod(10000000000*magsq,gpMove);
					
					currentThrustInput = currentThrustInput.map(function(elem,idx){return elem+gpMove[idx];});
					
					//testInfo=[axes,buttons,gpMove,magsq];
					
					//note doing cube bodge to both thrust and to adding velocity to position (see key controls code)
					//maybe better to pick one! (probably should apply cube logic to acc'n for exponential smoothed binary key input, do something "realistic" for drag forces
				}
				
				playerAngVelVec[2]+=gpSettings.roll(activeGp); //roll
				
				//other rotation
				var gpRotate=[];
				var fixedRotateAmount = 10*rotateSpeed;
				gpRotate[0] = Math.abs(axes[gpSettings.pitchAxis])>gpSettings.deadZone ? fixedRotateAmount*gpSettings.pitchMultiplier*axes[gpSettings.pitchAxis] : 0; //pitch
				gpRotate[1] = Math.abs(axes[gpSettings.turnAxis])>gpSettings.deadZone ? fixedRotateAmount*gpSettings.turnMultiplier*axes[gpSettings.turnAxis] : 0; //turn
				gpRotate[2] = 0;	//moved to code above
					
				magsq = gpRotate.reduce(function(total, val){return total+ val*val;}, 0);
				var magpow = Math.pow(50*magsq,1.5);	//TODO handle fact that max values separately maxed out, so currently turns faster in diagonal direction.
				
				lastPlayerAngMove = scalarvectorprod(100000*magpow,gpRotate);
				rotatePlayer(lastPlayerAngMove);	//TODO add rotational momentum - not direct rotate
			}
			
			playerVelVec[0]+=currentThrustInput[0];	//todo either write vector addition func or use glmatrix vectors
			playerVelVec[1]+=currentThrustInput[1];
			playerVelVec[2]+=currentThrustInput[2];
			
			
			//print speed
			var infoToShow ="";
			var speed = Math.hypot.apply(null, playerVelVec);
			infoToShow += "spd:" + speed.toFixed(2);
			
			playerAngVelVec=scalarvectorprod(0.85,playerAngVelVec);
			
			//blend velocity with velocity of rotating duosphere. (todo angular vel to use this too)
			//matrix entries 12-15 describe position. (remain same when rotate player and don't move)
			//playerVel is in frame of player though - so apply matrix rotation to this.
			
			var playerPos = playerCamera.slice(12);			//guess what this is
			
			var spinVelWorldCoords = [ duoCylinderAngVelConst*playerPos[1],-duoCylinderAngVelConst*playerPos[0],0,0];	
							
			var spinVelPlayerCoords = [
				spinVelWorldCoords[0]*playerCamera[0] + spinVelWorldCoords[1]*playerCamera[1],
				spinVelWorldCoords[0]*playerCamera[4] + spinVelWorldCoords[1]*playerCamera[5],
				spinVelWorldCoords[0]*playerCamera[8] + spinVelWorldCoords[1]*playerCamera[9]];
			
			//this is in frame of duocylinder. playerVelVec is in frame of player though... ?!! possible to do without matrix mult? by choosing right parts of playerCamera mat?
			
			//do the same thing for "up" vector. 
			//var radialWorldCoords = [ playerPos[0], playerPos[1],0,0];	AFAIK the following is not const length, but hope will give correct direction on duocylinder surf
			var radialWorldCoords = playerPos;	//this maybe correct
			var radialPlayerCoords = [
				radialWorldCoords[0]*playerCamera[0] + radialWorldCoords[1]*playerCamera[1],
				radialWorldCoords[0]*playerCamera[4] + radialWorldCoords[1]*playerCamera[5],
				radialWorldCoords[0]*playerCamera[8] + radialWorldCoords[1]*playerCamera[9]];
			
			
			//square drag //want something like spd = spd - const*spd*spd = spd (1 - const*|spd|)

			var airSpdVec = playerVelVec.map(function(val, idx){return val-spinVelPlayerCoords[idx];});
			//var spd = Math.sqrt(airSpdVec.map(function(val){return val*val;}).reduce(function(val, sum){return val+sum;}));
			var spd = Math.hypot.apply(null, airSpdVec);
			
			infoToShow+=", airspd:" + spd.toFixed(2);
			document.querySelector("#info2").innerHTML = infoToShow;
			
			//want to be able to steer in the air. todo properly - guess maybe wants "lift" from wings, but easiest implementation guess is to increase drag for lateral velocity.
			//would like for both left/right, up/down velocity, but to test, try getting just one - like a aeroplane.
			//TODO better aerodynamic model - would like decent "steerability" without too much slowdown when completely sideways.
			airSpdVec[0]*=0.996;	//left/right
			airSpdVec[1]*=0.996;	//up/down
			
			if (guiParams.handbrake){
				for (var cc=0;cc<3;cc++){
					airSpdVec[cc]*=0.9;	//TODO time dependence, but this is just to aid debugging (switch thru display options while view static)
				}
			}
			
			//playerVelVec=scalarvectorprod(1.0-0.001*spd,playerVelVec);

			//if (Math.random()<0.05){console.log("speed : " + spd);}	//show the speed. todo proper ui

			//get the current atmospheric density.
			var atmosThick = 0.001*guiParams.atmosThickness;	//1st constant just pulled out of the air. 
			atmosThick*=Math.pow(2.71, guiParams.atmosContrast*(playerPos[0]*playerPos[0] + playerPos[1]*playerPos[1])); //as atmosScale increases, scale height decreases

			playerVelVec=scalarvectorprod(1.0-atmosThick*spd,airSpdVec).map(function(val,idx){return val+spinVelPlayerCoords[idx];});
			
			if (autoFireCountdown>0){
				autoFireCountdown--;
			}else{
				if (keyThing.keystate(71) ||( activeGp && activeGp.buttons[gpSettings.fireButton].value) || (pointerLocked && mouseInfo.buttons&1)){	//G key or joypad button or LMB (pointer locked)
					fireGun();
					autoFireCountdown=autoFireCountdownStartVal;
				}
			}
			
			//IIRC playerCamera is the spaceship (or virtual spaceship if "dropped spaceship"), and worldCamera is the actual camera (screen)
			//mat4.set(worldCamera, invertedWorldCamera);		//ensure up to date...
			//mat4.transpose(invertedWorldCamera);
			mat4.set(playerCamera, invertedPlayerCamera);		//using spaceship as sound listener. 
			mat4.transpose(invertedPlayerCamera);
			
			var distanceForTerrainNoise = 100;	//something arbitrarily large
			var panForTerrainNoise = 0;
						
			//some logic shared with drawing code
			var worldInfo = (playerContainer.world==0) ? guiParams.world0 : guiParams.world1;	//todo use array

			if (worldInfo.duocylinderModel == 'procTerrain'){
				
				distanceForTerrainNoise = getHeightAboveTerrainFor4VecPos(playerPos);	//TODO actual distance using surface normal (IIRC this is simple vertical height above terrain)

				for (var legnum=0;legnum<landingLegData.length;legnum++){
					var landingLeg = landingLegData[legnum]
					var legPosPlayerFrame=landingLeg.pos;
					var suspensionHeight=landingLeg.suspHeight;
								
					var landingLegMat = mat4.create(playerCamera);
					xyzmove4mat(landingLegMat, legPosPlayerFrame);
					var legPos = [landingLegMat[12],landingLegMat[13],landingLegMat[14],landingLegMat[15]];	
	
					//copied from elsewhere
					var ballSize = 0.001;	//0.005 reasonable for centre of player model. smaller for landing legs
					
					//simple spring force terrain collision - 
					//lookup height above terrain, subtract some value (height above terrain where restoring force goes to zero - basically maximum extension of landing legs. apply sprint force upward to player proportional to this amount.
					var suspensionHeightNow = getHeightAboveTerrainFor4VecPos(legPos);
					suspensionHeightNow = Math.max(Math.min(-suspensionHeightNow,0) + ballSize, 0);	//capped
					var suspensionVel = suspensionHeightNow-suspensionHeight;
					var suspensionForce = 20*suspensionHeightNow+ 150*suspensionVel;	
																			//TODO rotational speed impact on velocity									
					suspensionForce=Math.max(suspensionForce,0);
					landingLeg.suspHeight = suspensionHeightNow;
														
					//apply force to player, "up" wrt duocylinder
					for (var cc=0;cc<3;cc++){
						playerVelVec[cc]+=suspensionForce*radialPlayerCoords[cc];	//radialPlayerCoords will be a bit different for landing legs but assume same since small displacement
					}
					
					//fake force is directly up (assumes upward terrain normal). should still cause tripod to conform to surface by appling torque from this upward force. 
					//to find torque for a leg, want to do cross product of leg position with duocylinder up direction (in frame of player). 
						//ie legPosPlayerFrame x radialPlayerCoords
					var forcePlayerFrame = radialPlayerCoords.map(function(elem){return elem*suspensionForce;});
					var torquePlayerFrame = [
									legPosPlayerFrame[1]*forcePlayerFrame[2] - legPosPlayerFrame[2]*forcePlayerFrame[1],
									legPosPlayerFrame[2]*forcePlayerFrame[0] - legPosPlayerFrame[0]*forcePlayerFrame[2],
									legPosPlayerFrame[0]*forcePlayerFrame[1] - legPosPlayerFrame[1]*forcePlayerFrame[0]
									];
					for (cc=0;cc<3;cc++){
						playerAngVelVec[cc]-=10000*torquePlayerFrame[cc];	//assumes moment of intertia of sphere/cube/similar
					}
					
					//TODO apply force along ground normal, friction force
				}
			}
			if (worldInfo.seaActive){
				distanceForTerrainNoise = getHeightAboveSeaFor4VecPos(playerPos, lastSeaTime);	//height. todo use distance (unimportant because sea gradient low
			}
			if (worldInfo.duocylinderModel == 'voxTerrain'){
				test2VoxABC();	//updates closestPointTestMat
				
				distanceForTerrainNoise = distBetween4mats(playerCamera, closestPointTestMat);
				
				//get terrain noise pan. TODO reuse other pan code (explosions etc)
				
				mat4.set(invertedPlayerCamera,tmpRelativeMat);
				mat4.multiply(tmpRelativeMat, closestPointTestMat);
				//distanceForTerrainNoise = distBetween4mats(tmpRelativeMat, identMat);	//should be same as previous result
				
				var soundSize = 0.002;	//reduced this below noiseRad so get more pan
				panForTerrainNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
				
				//console.log(panForTerrainNoise);
				
				//distanceForTerrainNoise = 0.02*voxCollisionFunction(playerPos);	//TODO get distance. shouldn't be necessary with SDF. maybe problem is with other terrain funcs. to estimate distance, guess want to divide this by its downhill slope (which for proper SDF should be 1). for now guess some constant that will work ~consistently with other terrain. 
				
				
				//voxel collision. 
				//simple version, just push away from closest point. this will be in "wrong direction" if inside voxel volume, so will fall down if tunnel inside. TODO this better! see notes for function drawBall. TODO damping, friction etc
				var penetration = settings.playerBallRad - distanceForTerrainNoise;
				var penetrationChange = penetration - lastVoxPenetration;	//todo cap this.
				lastVoxPenetration = penetration;
				//if (penetration>0){
				var pointDisplacement = tmpRelativeMat.slice(12, 15);	//for small distances, length of this is ~ distanceForTerrainNoise
				mat4.set(playerCamera, voxCollisionDebugMat);
				xyzmove4mat(voxCollisionDebugMat, pointDisplacement.map(function(elem){return elem*-1;}));
				
				if (penetration>0){
					var springConstant = 100;	//simple spring. rebounding force proportional to penetration. //high number = less likely tunneling at high speed.
					var multiplier = penetration*springConstant
					var dampConstant = 200;
					multiplier+=penetrationChange*dampConstant;
					
					multiplier/=distanceForTerrainNoise;	//normalise. playerBallRad would give near same result assuming penetrations remain small
					
					var forcePlayerFrame = pointDisplacement.map(function(elem){return elem*multiplier;});	//TODO use vector class?
					for (var cc=0;cc<3;cc++){
						playerVelVec[cc]+=forcePlayerFrame[cc];
						//playerVelVec[cc]*=0.96;	////simple bodge for some friction that does not work because doesnt account for duocylinder spin. 
							//TODO modify velocity in rotating frame
					}
				}
			}
			
			
			//whoosh sound. simple educated guess model for sound of passing by objects. maybe with a some component of pure wind noise
			//volume increase with speed - either generally, or component perpendicular to nearest surface normal
			//volume increases with proximity to obstacles. (can just use 1/r consistent with other sounds)
			//todo use the projected nearest surface point to inform stereo pan
			//todo use atmos thickness
			//todo use correct speed of sound (consistent with elsewhere)
			var terrainNoiseRad = 0.01;
			var adjustedDist = Math.hypot(distanceForTerrainNoise,terrainNoiseRad)
			var vol = terrainNoiseRad/adjustedDist;
			var noisySpeed = 20;	//around/above this speed, spdFactor tends to 1. below this, ~linear
			var spdFactor = spd/Math.hypot(spd,noisySpeed);
			adjustedDist = Math.min(adjustedDist,2);	//clamp. (TODO set value to max delay). prevents log spam
			myAudioPlayer.setWhooshSound({delay:adjustedDist, gain:vol*spdFactor, pan:panForTerrainNoise});
			
			//whoosh for boxes, closest point calculation done inside collision function
			adjustedDist = Math.hypot(closestBoxDist,terrainNoiseRad);
			vol = terrainNoiseRad/adjustedDist;
			adjustedDist = Math.min(adjustedDist,2);	//clamp. (TODO set value to max delay). prevents log spam
			myAudioPlayer.setWhooshSoundBox({delay:adjustedDist, gain:vol*spdFactor, pan:0});	//todo pan
			
			
			
			//apply same forces for other items. 
			//start with just player centre. 
			var gridSqs = getGridSqFor4Pos(playerPos);
			//get transposed playerpos in frame of duocylinder. this is generally useful, maybe should have some func to convert? code copied from bullet collision stuff...
			var playerMatrixTransposed = mat4.create();	//instead of transposing matrices describing possible colliding objects orientation.
			mat4.set(playerCamera,playerMatrixTransposed);	//alternatively might store transposed other objects orientation permanently
			mat4.transpose(playerMatrixTransposed);
			var playerMatrixTransposedDCRefFrame=mat4.create(playerMatrixTransposed);	//in frame of duocylinder
			rotate4mat(playerMatrixTransposedDCRefFrame, 0, 1, duocylinderSpin);
			
			currentPen = Math.max(currentPen,0);	//TODO better place for this? box penetration should not be -ve

			closestBoxDist =100; //used for thwop noise. initialise to arbitrarily large. TODO store point so pan sound
			
			if (guiParams.drawShapes.stonehenge || guiParams.drawShapes.singleBufferStonehenge){
				processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.stonehenge);
			}
			if (guiParams.drawShapes.towers || guiParams.drawShapes.singleBufferTowers){
				processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.towerblocks);
			}
			if (guiParams.drawShapes.roads || guiParams.drawShapes.singleBufferRoads){
				processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.roads);
			}
			
			function processBoxCollisionsForBoxInfoAllPoints(boxInfo){
				processBoxCollisionsForBoxInfo(boxInfo, playerCentreBallData, settings.playerBallRad, true, true);
						
				for (var legnum=0;legnum<landingLegData.length;legnum++){
				//	processBoxCollisionsForBoxInfo(boxInfo, landingLegData[legnum], 0.001, false);	//disable to debug easier using only playerCentreBallData collision
				}
			}
			
			function processBoxCollisionsForBoxInfo(boxInfo, landingLeg, collisionBallSize, drawDebugStuff, useForThwop){
				var pointOffset = landingLeg.pos.map(function(elem){return -elem;});	//why reversed? probably optimisable. TODO untangle signs!
				
				var closestBoxDistThisBox = closestBoxDist;
				
				var relativeMat = mat4.identity();
				var boxArrs = boxInfo.gridContents;
				for (var gs of gridSqs){	//TODO get gridSqs
					var bArray = boxArrs[gs];
					for (var bb of bArray){
						
						mat4.identity(relativeMat);
						xyzmove4mat(relativeMat, pointOffset);	//TODO precalc this matrix and set copy
						
						//get player position in frame of bb.matrix
						
						//code copied from bullet collision stuff - //boxCollideCheck(bb.matrix,duocylinderSurfaceBoxScale,critValueDCBox, bulletMatrixTransposedDCRefFrame, true); ...				
						
						//mat4.set(playerMatrixTransposedDCRefFrame, relativeMat);
						mat4.multiply(relativeMat, playerMatrixTransposedDCRefFrame);
						mat4.multiply(relativeMat, bb.matrix);
					
						//try applying landing leg offset relative to player.
						//where should the matrix multiplication go? if got the rotation between player and box, should be able to apply leg rotation to that somehow (without need for multiplying player, box matrices independently for each collision point/landing leg
						//xyzmove4mat(relativeMat, [0,0,0.01]);	//sadly this doesn't work
					
						//if (relativeMat[15]<boxCritValue){return;}	//early sphere check. TODO get crit value, enable
					
					/*
						if (Math.max(Math.abs(relativeMat[3]),
									Math.abs(relativeMat[7]),
									Math.abs(relativeMat[11]))<duocylinderSurfaceBoxScale*relativeMat[15]){
							//detonateBullet(bullet, bulletMatrix, moveWithDuocylinder);
							console.log("COLLIDING");
						}
						*/
						//TODO rounded corner collision, show object placed relative to player to indicate direction of collision(treat player as sphere) - this is similar to SDF stuff
						//from relativeMat stuff can determine both position, and direction of reaction force in frame of object collising with. can then draw something in frame of that object to indicate this. 
						//then find how to transform into frame of player.
						//what doing might only work for small boxes. TODO check big (relative to 3sphere)
						
						//proposed method (this maybe inefficient/inaccurate but should do ok)
						//get direction of reaction normal in frame of box
						//add this to the position of the spaceship in the frame of the box
						//(project back onto 3sphere - normalise)
						//get this position in the frame of the player
						//once working, consider how to make efficient/correct etc
						
						var relativePos = [relativeMat[3], relativeMat[7], relativeMat[11], relativeMat[15]];	//need last one?
						var projectedBoxSize = duocylinderSurfaceBoxScale*relativePos[3];
						
						//??possibly want to do projectedPos = relativePos[0-2]/relativePos[3] , cmp with duocylinderSurfaceBoxScale
						
						//rounded box. TODO 1st check within bounding box of the rounded box.
						var vectorFromBox = relativePos.map(function(elem){return elem>0 ? Math.max(elem - projectedBoxSize,0) : Math.min(elem + projectedBoxSize,0);});
						var distSqFromBox = vectorFromBox[0]*vectorFromBox[0]+vectorFromBox[1]*vectorFromBox[1]+vectorFromBox[2]*vectorFromBox[2];
						var distFromBox = Math.sqrt(distSqFromBox);		//todo handle distSqFromBox =0 (centre of collision ball is inside box) - can happen if moving fast, cover collisionBallSize in 1 step. currently results in passing thru box)
						
						closestBoxDistThisBox = Math.min(closestBoxDistThisBox, distFromBox);
						
						//if (Math.max(Math.abs(relativePos[0]),
						//			Math.abs(relativePos[1]),
						//			Math.abs(relativePos[2]))<projectedBoxSize){
						if (distFromBox<collisionBallSize && distFromBox>0){
							
							//find "penetration"
							currentPen = collisionBallSize-distFromBox;		//todo handle simultaneous box collisions
							var penChange = currentPen - landingLeg.cubeColPen;
							landingLeg.cubeColPen = currentPen;
							
							var reactionNormal=vectorFromBox.map(function(elem){return elem/distFromBox;});
							
							//reaction force proportional to currentPen -> spring force, penChange -> damper
						//	var reactionForce = Math.max(20*currentPen+150*penChange, 0);	//soft like landing leg. for body collision, increase constants
							
							var reactionForce = Math.max(50*currentPen+1000*penChange, 0);	//for body collision, increased constants to prevent tunneling. 
																							//(TODO redo this system - timesteps should get smaller as get closer, can jump using SDF, maybe should only react to colliding with closest box, etc.
														
							
							//position of collisionTestObj3Mat relative to playerMatrixTransposedDCRefFrame
							//mising up playerCamera, playerMatrixTransposedDCRefFrame here... TODO sort out.
							var relativeMatC = mat4.create();
							mat4.set(playerMatrixTransposedDCRefFrame, relativeMatC);
							
							//moved one matrix outside if drawdebugstuff because it's required (collisionTestObj3Mat)
							var tempMat3 = mat4.create();
							mat4.set(bb.matrix, tempMat3);
							xyzmove4mat(tempMat3, [-relativePos[0],-relativePos[1],-relativePos[2]]);
							xyzmove4mat(tempMat3, reactionNormal);
							mat4.multiply(relativeMatC, tempMat3);
						
							var relativePosC = [relativeMatC[12], relativeMatC[13], relativeMatC[14], relativeMatC[15]];
							
							if (drawDebugStuff){
								//TODO sort out what's what here. chopped around so comments a mess
								//TODO transparent boxes mode so can see debug stuff more clearly
								
								//draw object relative to box to check is at player position (relativePos)
								//draw another relative to box at relativePos+constant*reactionNormal to check in right direction
								//then can calc this point in frame of player
								//todo what is sense of 4vec relativePos, 3vec normal?
								
								mat4.set(bb.matrix, collisionTestObjMat);
								mat4.set(bb.matrix, collisionTestObj2Mat);
								xyzmove4mat(collisionTestObjMat, [-relativePos[0],-relativePos[1],-relativePos[2]]);
								
								//mat4.set(bb.matrix, collisionTestObj3Mat);
								//xyzmove4mat(collisionTestObj3Mat, [-relativePos[0],-relativePos[1],-relativePos[2]]);
								//xyzmove4mat(collisionTestObj3Mat, reactionNormal);
								mat4.set(tempMat3, collisionTestObj3Mat);		//just set because using outside if (drawDebugStuff)
								
								
								//this might show that should have /relativePos[3] here.
								
								//get the position of collisionTestObj3Mat in the frame of the player.
								//draw something at this position (similar to how draw landing legs)
								//....
								
								//already have relativeMat. position of box relative to player maybe already available
								var relativePosB = [relativeMat[12], relativeMat[13], relativeMat[14], relativeMat[15]];
								mat4.set(playerCamera, collisionTestObj4Mat);
								xyzmove4mat(collisionTestObj4Mat, [-relativePosB[0],-relativePosB[1],-relativePosB[2]]);
								//TODO account for duocylinder rotation (currently assuming unrotated)
								
								mat4.set(playerCamera, collisionTestObj5Mat);
								xyzmove4mat(collisionTestObj5Mat, [-relativePosC[0],-relativePosC[1],-relativePosC[2]]);
							}
							
							//apply force in this direction
							var forcePlayerFrame = relativePosC.map(function(elem){return elem*reactionForce;});
							for (var cc=0;cc<3;cc++){
								playerVelVec[cc]+=forcePlayerFrame[cc];
							}
							
							//apply torque
							var legPosPlayerFrame = landingLeg.pos;
							var torquePlayerFrame = [
									legPosPlayerFrame[1]*forcePlayerFrame[2] - legPosPlayerFrame[2]*forcePlayerFrame[1],
									legPosPlayerFrame[2]*forcePlayerFrame[0] - legPosPlayerFrame[0]*forcePlayerFrame[2],
									legPosPlayerFrame[0]*forcePlayerFrame[1] - legPosPlayerFrame[1]*forcePlayerFrame[0]
									];
							for (cc=0;cc<3;cc++){
								playerAngVelVec[cc]-=10000*torquePlayerFrame[cc];	//assumes moment of intertia of sphere/cube/similar
							}
							
							
						}
						
					}
				
				}
				
				if (useForThwop){
					closestBoxDist = closestBoxDistThisBox;
				}
			}
			
			
			
		}
		
		var moveAmount = timeElapsed * moveSpeed;
		var rotateAmount = timeElapsed * rotateSpeed;
		//var bulletMove = timeElapsed * bulletSpeed;
		
		
		//make new velvec to make slow movement adjustment better, total amount moved nonlinear with press duration
		//just multiply the "thrust" by its squared length. (ie its magnitude is cubed)
		//var playerVelVecMagsq = playerVelVec.reduce(function(total, val){return total+ val*val;}, 0);
		
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
		var ringBoxSize = 0.1;
		var boxRad = boxSize*Math.sqrt(3);
		//var criticalWPos = Math.cos(Math.atan(guiParams.reflector.scale) + Math.atan(boxRad));
		
		var critValueRandBox = 1/Math.sqrt(1+3*boxSize*boxSize);
		var critValueDCBox = 1/Math.sqrt(1+3*duocylinderSurfaceBoxScale*duocylinderSurfaceBoxScale);
		var critValueRingBox = 1/Math.sqrt(1+3*ringBoxSize*ringBoxSize);
		
		//slightly less ridiculous place for this - not declaring functions inside for loop!
		function checkBulletCollision(bullet, bulletMoveAmount){
			var bulletMatrix=bullet.matrix;
			
			var bulletMatrixTransposed = mat4.create();	//instead of transposing matrices describing possible colliding objects orientation.
			mat4.set(bulletMatrix,bulletMatrixTransposed);	//alternatively might store transposed other objects orientation permanently
			mat4.transpose(bulletMatrixTransposed);
			
			var bulletMatrixTransposedDCRefFrame=mat4.create(bulletMatrixTransposed);	//in frame of duocylinder
			rotate4mat(bulletMatrixTransposedDCRefFrame, 0, 1, duocylinderSpin);
			
			var bulletVel=bullet.vel;
			xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount,bulletVel));
			
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
			
			var worldInfo = (bullet.world==0) ? guiParams.world0 : guiParams.world1;
					//todo keep bullets in 2 lists/arrays so can check this once per world
			
			var bulletPos = [bulletMatrix[12],bulletMatrix[13],bulletMatrix[14],bulletMatrix[15]];	//todo use this elsewhere?
			if (worldInfo.duocylinderModel == "procTerrain"){
				//collision with duocylinder procedural terrain	
				if (getHeightAboveTerrainFor4VecPos(bulletPos)<0){detonateBullet(bullet, true);}
			}
			if (worldInfo.duocylinderModel == "voxTerrain"){	//TODO generalise collision by specifying a function for terrain. (voxTerrain, procTerrain)
				if (voxCollisionFunction(bulletPos)>0){detonateBullet(bullet, true);}
			}
			if (worldInfo.seaActive){
				if (getHeightAboveSeaFor4VecPos(bulletPos, lastSeaTime)<0){detonateBullet(bullet, true);}
				//if (getHeightAboveSeaFor4VecPos(bulletPos, 0)<0){detonateBullet(bullet, true);}
			}
			
			//slow collision detection between bullet and array of boxes.
			//todo 1 try simple optimisation by matrix/scalar multiplication instead of matrix-matrix
			//todo 2 another simple optimisation - sphere check by xyzw distance. previous check only if passes
			//todo 3 heirarchical bounding boxes or gridding system!
			
			//box rings
			var guiBoxes= guiParams.drawShapes.boxes;
			if (guiBoxes['y=z=0']){checkCollisionForBoxRing(ringCells[0]);}
			if (guiBoxes['x=z=0']){checkCollisionForBoxRing(ringCells[1]);}
			if (guiBoxes['x=y=0']){checkCollisionForBoxRing(ringCells[2]);}
			if (guiBoxes['z=w=0']){checkCollisionForBoxRing(ringCells[3]);}
			if (guiBoxes['y=w=0']){checkCollisionForBoxRing(ringCells[4]);}
			if (guiBoxes['x=w=0']){checkCollisionForBoxRing(ringCells[5]);}
			
			function checkCollisionForBoxRing(ringCellMats){	//todo combine with below (random boxes)
				for (var ii=0;ii<ringCellMats.length;ii++){
					boxCollideCheck(ringCellMats[ii],ringBoxSize,critValueRingBox);
				}
			}
			
			
			if (numRandomBoxes>0 && guiParams["random boxes"].collision){
				for (var ii=0;ii<numRandomBoxes;ii++){
					boxCollideCheck(randomMats[ii],boxSize,critValueRandBox);
				}
			}
			
			//var bulletPosAdjusted = [ bulletMatrixTransposedDCRefFrame[3],bulletMatrixTransposedDCRefFrame[7], bulletMatrixTransposedDCRefFrame[11], bulletMatrixTransposedDCRefFrame[15]];
			var gridSqs = getGridSqFor4Pos(bulletPos);
			
			if (guiParams.drawShapes.towers || guiParams.drawShapes.singleBufferTowers){	
				boxCollideBulletForBoxArray(duocylinderBoxInfo.towerblocks.gridContents);
			}
			if (guiParams.drawShapes.stonehenge || guiParams.drawShapes.singleBufferStonehenge){
				boxCollideBulletForBoxArray(duocylinderBoxInfo.stonehenge.gridContents);
			}
			if (guiParams.drawShapes.roads || guiParams.drawShapes.singleBufferRoads){
				boxCollideBulletForBoxArray(duocylinderBoxInfo.roads.gridContents);
			}
			function boxCollideBulletForBoxArray(boxArr){
				for (var gs of gridSqs){
					boxCollideArray(boxArr[gs]);
				}
			}
			function boxCollideArray(bArray){
				for (var bb of bArray){
					boxCollideCheck(bb.matrix,duocylinderSurfaceBoxScale,critValueDCBox, bulletMatrixTransposedDCRefFrame, true);
				}
			}
				
			
			function boxCollideCheck(cellMat,thisBoxSize,boxCritValue, bulletMatrixTransposedForRefFrame, moveWithDuocylinder){
					var bulletMatrixTransposedForRefFrame = bulletMatrixTransposedForRefFrame || bulletMatrixTransposed;
				//if (cellMat[15]>criticalWPos){return;}	//not drawing boxes too close to portal, so don't collide with them either!
														//also breaks ring box collision now (when box near portal)
														//TODO move to setup stage 
					
					mat4.set(bulletMatrixTransposedForRefFrame, relativeMat);
					mat4.multiply(relativeMat, cellMat);
					
					if (relativeMat[15]<boxCritValue){return;}	//early sphere check
					
					if (Math.max(Math.abs(relativeMat[3]),
								Math.abs(relativeMat[7]),
								Math.abs(relativeMat[11]))<thisBoxSize*relativeMat[15]){
						detonateBullet(bullet, moveWithDuocylinder);
				}
			}
			
			//hyperbolas
			hyperboloidData
			if (guiParams.drawShapes.hyperboloid){
				for (var mm of duocylinderBoxInfo.hyperboloids.list){
					mat4.set(bulletMatrixTransposedDCRefFrame, relativeMat);
					mat4.multiply(relativeMat, mm.matrix);
					
					if (relativeMat[15]<0.5){continue;}	//early sphere check	TODO correct value (closer to 1 for smaller objects.
					
					if (hyperboloidData.colCheck([relativeMat[3],relativeMat[7],relativeMat[11]].map(function(val){return val/(relativeMat[15]);}))){
						detonateBullet(bullet, true);
					}
				}
			}
			
			//similar thing for 8-cell frames
			var cellSize = guiParams["8-cell scale"];
			if (guiParams["draw 8-cell"]){
				for (dd in cellMatData.d8){
					mat4.set(bulletMatrixTransposed, relativeMat);
					mat4.multiply(relativeMat, cellMatData.d8[dd]);											
					if (relativeMat[15]>0){
						var projectedPosAbs = [relativeMat[3],relativeMat[7],relativeMat[11]].map(function(val){return Math.abs(val)/(cellSize*relativeMat[15]);});
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
				checkTetraCollisionForArray(1, cellMatData.d16);
			}
			if (guiParams["draw 600-cell"]){
				checkTetraCollisionForArray(0.386/(4/Math.sqrt(6)), cellMatData.d600[0]);
			}
			
			function checkTetraCollisionForArray(cellScale, matsArr){
				var critVal = 1/Math.sqrt(1+cellScale*cellScale*3);
				for (dd in matsArr){
					mat4.set(bulletMatrixTransposed, relativeMat);
					mat4.multiply(relativeMat, matsArr[dd]);
						
					if (relativeMat[15]>0){			
						if (relativeMat[15]<critVal){continue;}	//early sphere check
						
						var projectedPos = [relativeMat[3],relativeMat[7],relativeMat[11]].map(function(val){return val/(cellScale*relativeMat[15]);});
						
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
			
			//octohedron collision
			if (guiParams["draw 24-cell"]){
				var cellSize24 = guiParams["24-cell scale"];
				
				for (dd in cellMatData.d24.cells){
					mat4.set(bulletMatrixTransposed, relativeMat);
					mat4.multiply(relativeMat, cellMatData.d24.cells[dd]);
											
					if (relativeMat[15]>0){
						//todo speed up. division for all vec parts not necessary
						//change number inside if rhs comparison
						//also should apply multiplier to 0.8 for inner check.
						var projectedPosAbs = [relativeMat[3],relativeMat[7],relativeMat[11]].map(function(val){return Math.abs(val)/(cellSize24*relativeMat[15]);});
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
				
				var cellMats=cellMatData.d120[0];	//some sort index
				
				for (dd in cellMats){	//single element of array for convenience
					mat4.set(bulletMatrixTransposed, relativeMat);
					mat4.multiply(relativeMat, cellMats[dd]);
											
					if (relativeMat[15]>0){
							//if outside bounding sphere
						if (relativeMat[15]<critVal){continue;}
						
						var projectedPos = [relativeMat[3],relativeMat[7],relativeMat[11]].map(function(val){return val/(dodecaScale*relativeMat[15]);});
						
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
		function detonateBullet(bullet, moveWithDuocylinder){	//TODO what scope does this have? best practice???
			bullet.vel = [0,0,0];	//if colliding with target, stop bullet.
			bullet.active=false;
			
			if (!moveWithDuocylinder){
				new Explosion(bullet, 0.0003, [1,0.5,0.25], false, true);
			}else{
				var tmpMat = mat4.create(bullet.matrix);
				mat4.transpose(tmpMat);	//inefficient! TODO precalc matrix to do this transpose-rotate-transpose!
				rotate4mat(tmpMat, 0, 1, duocylinderSpin);	//get bullet matrix in frame of duocylinder. might be duplicating work from elsewhere.
				mat4.transpose(tmpMat);	//inefficient
				new Explosion({matrix:tmpMat, world:bullet.world}, 0.0003, [0.2,0.4,0.6],true, true);	//different colour for debugging
			}
			
			//singleExplosion.life = 100;
			//singleExplosion.matrix = bulletMatrix;
		}
		
		var singleStepMove = timeStep*moveSpeed;
		if (numSteps>0){
			for (var ii=0;ii<numSteps;ii++){	//TODO make more performant
				for (var b in bullets){
					var bullet = bullets[b];
					if (bullet.active){	//TODO just delete/unlink removed objects
						checkBulletCollision(bullet, singleStepMove);
						portalTest(bullet, 0);
					}
				}
			}
		}
		
		fireDirectionVec = playerVelVec.map(function(val,ii){return (ii==2)? val+muzzleVel:val;});
			//TODO velocity in frame of bullet? (different if gun aimed off-centre)
		
		var flashAmount = 0.1;	//default "player light" when not firing
		for (var gg in muzzleFlashAmounts){
			muzzleFlashAmounts[gg]*=Math.pow(0.8, numSteps);
			flashAmount+= muzzleFlashAmounts[gg];	
		}
		playerLight = playerLightUnscaled.map(function(val){return val*flashAmount});
		
		portalTest(playerContainer, 0);	//TODO switch off portal in reflector mode. requires camera changes too.
		
		//bounce off portal if reflector
		if (!guiParams.reflector.isPortal){
			var effectiveRange = Math.tan(Math.atan(reflectorInfo.rad)+Math.atan(0.011)); //TODO reformulate more efficiently
			if (checkWithinReflectorRange(playerCamera, effectiveRange)){					
				var towardsPortal = [playerCamera[3],playerCamera[7],playerCamera[11],playerCamera[15]]; //in player frame
				var normalisingFactor=1/Math.sqrt(1-towardsPortal[3]*towardsPortal[3])
				towardsPortal = towardsPortal.map(function(elem){return elem*normalisingFactor;});
				//vel toward portal 
				var velTowardsPortal = ( towardsPortal[0]*playerVelVec[0] + towardsPortal[1]*playerVelVec[1] + towardsPortal[2]*playerVelVec[2]);
				velTowardsPortal*=1.2;					//multiply by 1+coefficient of restitution
				if (velTowardsPortal<0){
					//playerVelVec = playerVelVec.map(function(elem){return -elem;}); //simple reverse velocity
					for (var cc=0;cc<3;cc++){
						playerVelVec[cc] -= velTowardsPortal*towardsPortal[cc];
					}
				}
				//currently can closer to sphere if push continuously. TODO move back out to effectiveRange
			}
		}
		
		if (!guiParams["drop spaceship"]){
			mat4.set(playerCamera,sshipMatrixNoInterp);	//todo store gun matrices in player frame instead
			sshipWorld = playerContainer.world;
		}
		updateGunTargeting(sshipMatrixNoInterp);

		//rotate remainder of time for aesthetic. (TODO ensure doesn't cock up frustum culling, hud etc)
		mat4.set(playerCamera, playerCameraInterp);
		xyzrotate4mat(playerCameraInterp, scalarvectorprod(timeTracker/timeStep -1,lastPlayerAngMove));
	}
})();

//TODO less of a bodge!
function rotateVelVec(velVec,rotateVec){
	//var velVecMagsq = velVec.reduce(function(total, val){return total+ val*val;}, 0);
	//var len = 1-Math.sqrt(velVecMagsq);
	var velVecMag = Math.hypot.apply(null, velVec);
	var len = 1-velVecMag;
	var velVecQuat=[len,velVec[0],velVec[1],velVec[2]];	//note this is only right for small angles, since quat is cos(t), axis*sin(t)
	var rqpair = makerotatequatpair(scalarvectorprod(-0.5,rotateVec));
	velVecQuat=rotatequat_byquatpair(velVecQuat,rqpair);
			
	//switch back to other format (extract 3vec).
	return [velVecQuat[1],velVecQuat[2],velVecQuat[3]];

	//TODO? just do quaternion rotation of 3vector, which exists in glmatrix lib. 
	//maybe best is keep a vel quat, and multiply by a thrust quat.
}

function portalTest(obj, amount){
	var mat = obj.matrix;
	var world = obj.world;
	var adjustedRad = reflectorInfo.rad + amount;	//avoid issues with rendering very close to surface
	if (checkWithinReflectorRange(mat, adjustedRad)){	
		moveMatrixThruPortal(mat, adjustedRad, 1.00000001);
		obj.world=1-obj.world;
		console.log("currentWorld now = " + obj.world);
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

var gunEven=1;
function fireGun(){
	gunEven = 1-gunEven;
	for (var g in gunMatrices){
		if (g%2 == gunEven){
			muzzleFlashAmounts[g]+=0.25
			
			var gunMatrix = gunMatrices[g];
			
			xyzrotate4mat(gunMatrix,[0.02*(Math.random()-0.5),0.02*(Math.random()-0.5),0]);	//random spread TODO gaussian
			
			var newBulletMatrix = mat4.create();	//TODO pooling - bullet pool instead of use matrix pool? 
			mat4.set(gunMatrix,newBulletMatrix);
			
			//work out what fireDirectionVec should be in frame of gun/bullet (rather than player ship body)
			//this maybe better done alongside targeting code.
			var relativeMatrix = matPool.create();
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
			bullets.push({matrix:newBulletMatrix,vel:newFireDirectionVec,world:sshipWorld,active:true});
			
			new Explosion({matrix:gunMatrix,world:sshipWorld}, 0.00005, [0.06,0.06,0.06]);	//smoke/steam fx.
															//TODO emit from hot gun (continue after firing), lighting for smoke (don't see in dark) ...
															//TODO get correct world (which side of portal end of gun is in)
			matPool.destroy(relativeMatrix);
			
			//limit number of bullets
			if (bullets.length>200){
				bullets.shift();
			}
		}
	}
	myAudioPlayer.playGunSound(0);	//todo use delay param to play at exact time.
	gunHeat+=0.1;
	
//	var gunJerkAmount = 0.004;
//	rotatePlayer([(Math.random()-0.5)*gunJerkAmount, (Math.random()-0.5)*gunJerkAmount,0]);
}



//rtt code from webgl-wideanglecamera project via webglPostprocess project

//from http://learningwebgl.com/blog/?p=1786
var rttFramebuffer;
var rttTexture;
var rttView={};

function setRttSize(width, height){	
	if (rttView.sizeX == width && rttView.sizeY == height){return;}	// avoid setting again if same numbers ( has speed impact)
																	//todo check for memory leak
	rttView.sizeX = width;
	rttView.sizeY = height;
		
	rttFramebuffer.width = width;
	rttFramebuffer.height = height;	
	
	gl.bindTexture(gl.TEXTURE_2D, rttTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

//	gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
//	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function initTextureFramebuffer() {
	rttFramebuffer = gl.createFramebuffer();

	rttTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, rttTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	//gl.generateMipmap(gl.TEXTURE_2D);

	gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
	setRttSize(2048, 1024);	//overwritten right away, so little point having here.
	
	/*
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	*/
}

function drawTriAxisCross(scale){
	var smallScale = scale/20;
	gl.uniform3fv(shaderProgramTexmap.uniforms.uModelScale, [smallScale,smallScale,scale]);
	drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
	gl.uniform3fv(shaderProgramTexmap.uniforms.uModelScale, [smallScale,scale,smallScale]);
	drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
	gl.uniform3fv(shaderProgramTexmap.uniforms.uModelScale, [scale,smallScale,smallScale]);
	drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
};
