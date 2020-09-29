var shaderPrograms={};

var shaderProgramColored,	//these are variables that are set to different shaders during running, but could just as well go inside shaderPrograms.
	shaderProgramTexmap;	//but keeping separate for now so know that all shaderPrograms.something are unchanging

var angle_ext;
var fragDepth_ext;	//maybe pointless to store this, allegedly just need to call gl.getExtension('EXT_frag_depth')	https://developer.mozilla.org/en-US/docs/Web/API/EXT_frag_depth
var depthTex_ext;

var myDebugStr = "TEST INFO TO GO HERE";
var myfisheyedebug;
var mytestMat111;
var testPortalDraw;

function bufferArrayData(buffer, arr, size){
	 bufferArrayDataGeneral(buffer, new Float32Array(arr), size);
}
function bufferArrayDataGeneral(buffer, arr, size){
	//console.log("size:" + size);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
	buffer.itemSize = size;
	buffer.numItems = arr.length / size;
}

function bufferArraySubDataGeneral(buffer, offs, arr){
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, offs, arr);
}

//var atmosVariants = ['CONSTANT','ONE','TWO'];
var atmosVariants = ['ONE'];	//disable variants to speed up loading
var genShaderVariants = function(vs_id, fs_id, vs_defines=[], fs_defines=[], usesVecAtmosThickness){
	var shaders = {};
	if (usesVecAtmosThickness){
		vs_defines.push('VEC_ATMOS_THICK');
		fs_defines.push('VEC_ATMOS_THICK');
	//	vs_defines.push('CUSTOM_DEPTH');
	//	fs_defines.push('CUSTOM_DEPTH');
	}
	vs_defines.push('CONST_ITERS 4.0');	//TODO compare. suspect that by shifting samples by 0.5 (0.5->n-0.5 instead of 0->n-1) might get decent approximation with few samples
								//effect with very few samples (even 2) looks OK, but might have edge cases. 
	
	//try deleting CUSTOM_DEPTH - use this to test if can get decent z-buffer performance (increase range without introducing z-fighting), without recourse to custom depth, by increasing depth buffer precision,
	/*
	var index = vs_defines.indexOf('CUSTOM_DEPTH');
	if (index > -1) {
	  vs_defines.splice(index, 1);
	}
	index = fs_defines.indexOf('CUSTOM_DEPTH');
	if (index > -1) {
	  fs_defines.splice(index, 1);
	}
	*/
	
	for (var variant of atmosVariants){
		var variantString = "ATMOS_"+variant;
		shaders[variant]=loadShader(vs_id, fs_id, vs_defines.concat(variantString), fs_defines.concat(variantString));
		shaders[variant].usesVecAtmosThickness = usesVecAtmosThickness;
	}
	//temp:
	//shaders.constant = shaders.CONSTANT;
	shaders.atmos = shaders.ONE;
	//shaders.atmos_v2 = shaders.TWO;
	
	return shaders;
};

function initShaders(){	
	var initShaderTimeStart = performance.now();
	
	shaderPrograms.fullscreenTextured = loadShader( "shader-fullscreen-vs", "shader-fullscreen-fs"); 
	shaderPrograms.fullscreenTexturedWithDepthmap = loadShader( "shader-fullscreen-vs", "shader-fullscreen-with-depthmap-fs"); 
	shaderPrograms.fullscreenTexturedFisheye = loadShader( "shader-fullscreen-vs", "shader-fullscreen-fs-fisheye");
	shaderPrograms.fullscreenBennyBoxLite = loadShader( "shader-fullscreen-vs", "shader-fullscreen-fs-bennybox-lite");
	shaderPrograms.fullscreenBennyBox = loadShader( "shader-fullscreen-vs", "shader-fullscreen-fs-bennybox");	//https://www.youtube.com/watch?v=Z9bYzpwVINA
		
	shaderPrograms.coloredPerVertex = loadShader( "shader-simple-vs", "shader-simple-fs");
	//shaderPrograms.coloredPerPixel = loadShader( "shader-perpixel-vs", "shader-perpixel-fs");		//unused
	shaderPrograms.coloredPerPixelDiscard = genShaderVariants( "shader-perpixel-discard-vs", "shader-perpixel-discard-fs", ['CUSTOM_DEPTH'],['CUSTOM_DEPTH'],true);

	shaderPrograms.coloredPerPixelTransparentDiscard = loadShader("shader-perpixel-transparent-discard-vs", "shader-perpixel-transparent-discard-fs",['CUSTOM_DEPTH'],['CUSTOM_DEPTH']);	//TODO fog variants, vector fog
	
	shaderPrograms.texmapPerVertex = loadShader( "shader-texmap-vs", "shader-texmap-fs");
					
	//shaderPrograms.texmapPerPixel = loadShader( "shader-texmap-perpixel-vs", "shader-texmap-perpixel-fs");
	shaderPrograms.texmapPerPixelDiscard = genShaderVariants("shader-texmap-perpixel-discard-vs", "shader-texmap-perpixel-discard-fs", [],[],true);
	shaderPrograms.texmapPerPixelDiscardPhong = genShaderVariants("shader-texmap-perpixel-discard-vs", "shader-texmap-perpixel-discard-fs", ['CUSTOM_DEPTH'],['SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);
	shaderPrograms.texmapPerPixelDiscardNormalmapV1 = genShaderVariants("shader-texmap-perpixel-discard-normalmap-vs", "shader-texmap-perpixel-discard-normalmap-fs", [],[],true);
	shaderPrograms.texmapPerPixelDiscardNormalmap = genShaderVariants("shader-texmap-perpixel-discard-normalmap-efficient-vs", "shader-texmap-perpixel-discard-normalmap-efficient-fs", [],[],true);	
	shaderPrograms.texmapPerPixelDiscardNormalmapPhong = genShaderVariants("shader-texmap-perpixel-discard-normalmap-efficient-vs", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['SPECULAR_ACTIVE','CUSTOM_DEPTH'], ['SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);
	shaderPrograms.texmapPerPixelDiscardNormalmapPhongVsMatmult = genShaderVariants("shader-texmap-perpixel-discard-normalmap-efficient-vs", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['VS_MATMULT','SPECULAR_ACTIVE'], ['SPECULAR_ACTIVE'],true);
	shaderPrograms.texmapPerPixelDiscardNormalmapPhongInstanced = genShaderVariants("shader-texmap-perpixel-discard-normalmap-efficient-vs", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['INSTANCED','VS_MATMULT','SPECULAR_ACTIVE','CUSTOM_DEPTH'], ['SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);
	
	shaderPrograms.texmapPerPixelDiscardAtmosGradLight = genShaderVariants("shader-texmap-perpixel-discard-vs", "shader-texmap-perpixel-gradlight-discard-fs", ['CUSTOM_DEPTH'],['CUSTOM_DEPTH'],true); 	//could do more work in vert shader currently because light calculated per vertex - could just pass channel weights to frag shader...
	
	shaderPrograms.texmapPerPixelDiscardExplode = genShaderVariants("shader-texmap-perpixel-discard-vs", "shader-texmap-perpixel-discard-fs", ['VERTVEL_ACTIVE'],[],true);			
	shaderPrograms.texmap4Vec = genShaderVariants("shader-texmap-vs-4vec", "shader-texmap-fs", []);
	shaderPrograms.texmap4VecPerPixelDiscard = genShaderVariants("shader-texmap-perpixel-vs-4vec", "shader-texmap-perpixel-discard-fs", [],[],true);

	shaderPrograms.texmap4VecPerPixelDiscardVcolor = genShaderVariants("shader-texmap-perpixel-vs-4vec", "shader-texmap-perpixel-discard-fs", ['VCOLOR'],['VCOLOR'],true);
	shaderPrograms.texmap4VecPerPixelDiscardPhong = genShaderVariants("shader-texmap-perpixel-vs-4vec", "shader-texmap-perpixel-discard-fs", ['CUSTOM_DEPTH'], ['SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);
	shaderPrograms.texmap4VecPerPixelDiscardPhongVcolor = genShaderVariants("shader-texmap-perpixel-vs-4vec", "shader-texmap-perpixel-discard-fs", ['VCOLOR','CUSTOM_DEPTH'], ['VCOLOR','SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);
	shaderPrograms.texmap4VecPerPixelDiscardNormalmapAndDiffuse = genShaderVariants("shader-texmap-perpixel-normalmap-vs-4vec", "shader-texmap-perpixel-discard-normalmap-efficient-fs", [],['DIFFUSE_TEX_ACTIVE'],true);
	shaderPrograms.texmap4VecPerPixelDiscardNormalmapPhongAndDiffuse = genShaderVariants("shader-texmap-perpixel-normalmap-vs-4vec", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['SPECULAR_ACTIVE','CUSTOM_DEPTH'], ['DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);
	shaderPrograms.texmap4VecPerPixelDiscardNormalmapVcolorAndDiffuse = genShaderVariants("shader-texmap-perpixel-normalmap-vs-4vec", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR'], ['DIFFUSE_TEX_ACTIVE','VCOLOR'],true),
	shaderPrograms.texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse = genShaderVariants("shader-texmap-perpixel-normalmap-vs-4vec", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','CUSTOM_DEPTH'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);
	
	//voxTerrain shaders
	shaderPrograms.triplanarColor4Vec = genShaderVariants("shader-texmap-color-triplanar-vs-4vec", "shader-texmap-triplanar-fs",['CUSTOM_DEPTH'],['CUSTOM_DEPTH']);
	//shaderPrograms.triplanarPerPixel = genShaderVariants("shader-texmap-perpixel-color-triplanar-vs-4vec", "shader-texmap-perpixel-triplanar-fs", ['VCOLOR','SPECULAR_ACTIVE'],['VCOLOR','SPECULAR_ACTIVE']);
	shaderPrograms.triplanarPerPixel = genShaderVariants("shader-texmap-perpixel-color-triplanar-vs-4vec", "shader-texmap-perpixel-triplanar-fs", ['SPECULAR_ACTIVE','CUSTOM_DEPTH'],['SPECULAR_ACTIVE','CUSTOM_DEPTH']);	//like texmap4VecPerPixelDiscard - vertex position, normal are varyings, light positions are uniform
	//shaderPrograms.triplanarPerPixelTwo = genShaderVariants("shader-texmap-perpixel-normalmap-color-triplanar-vs-4vec", "shader-texmap-perpixel-normalmap-triplanar-fs-BASIC", ['VCOLOR','SPECULAR_ACTIVE'],['VCOLOR','SPECULAR_ACTIVE']);
	shaderPrograms.triplanarPerPixelTwoAndDiffuse = genShaderVariants("shader-texmap-perpixel-normalmap-color-triplanar-vs-4vec", "shader-texmap-perpixel-normalmap-triplanar-fs", ['SPECULAR_ACTIVE','CUSTOM_DEPTH'],['DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE','CUSTOM_DEPTH'],true);	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)
	
	//procTerrain shaders
	shaderPrograms.texmap4VecMapproject = genShaderVariants("shader-texmap-vs-4vec", "shader-texmap-fs", ['MAPPROJECT_ACTIVE'], ['MAPPROJECT_ACTIVE']);	//per vertex lighting
	shaderPrograms.texmap4VecMapprojectDiscardNormalmapVcolorAndDiffuse = genShaderVariants("shader-texmap-perpixel-normalmap-vs-4vec", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','MAPPROJECT_ACTIVE'],true);	//per pixel tangent space lighting
	shaderPrograms.texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse = genShaderVariants("shader-texmap-perpixel-normalmap-vs-4vec", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'],true);
	shaderPrograms.texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2Tex = genShaderVariants("shader-texmap-perpixel-normalmap-vs-4vec", "shader-texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','CUSTOM_DEPTH'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','DOUBLE_TEXTURES','CUSTOM_DEPTH'],true);
	
	//sea shaders
	//shaderPrograms.duocylinderSea = genShaderVariants("shader-texmap-vs-duocylinder-sea", "shader-texmap-fs", []);
	//shaderPrograms.duocylinderSeaPerPixelDiscard = genShaderVariants("shader-texmap-perpixel-vs-duocylinder-sea", "shader-texmap-perpixel-discard-fs", [],[],true);
	shaderPrograms.duocylinderSeaPerPixelDiscardPhong = genShaderVariants("shader-texmap-perpixel-vs-duocylinder-sea", "shader-texmap-perpixel-discard-fs", ['CUSTOM_DEPTH'], ['SPECULAR_ACTIVE','CUSTOM_DEPTH'],true),
	shaderPrograms.duocylinderSeaPerPixelDiscardPhongDepthAware = genShaderVariants("shader-texmap-perpixel-vs-duocylinder-sea", "shader-texmap-perpixel-discard-fs", ['CUSTOM_DEPTH','DEPTH_AWARE'], ['SPECULAR_ACTIVE','CUSTOM_DEPTH','DEPTH_AWARE'],true),
	
	shaderPrograms.cubemap = genShaderVariants( "shader-cubemap-vs", "shader-cubemap-fs",[],[],true);
	shaderPrograms.vertprojCubemap = genShaderVariants("shader-cubemap-vs", "shader-cubemap-fs", ['VERTPROJ','CUSTOM_DEPTH'],['CUSTOM_DEPTH'],true);
	shaderPrograms.specialCubemap = genShaderVariants("shader-cubemap-vs", "shader-cubemap-fs", ['VERTPROJ','SPECIAL'],['SPECIAL'],true);		//try calculating using screen space coordinates, to work around buggy wobbly rendering close to portal. initially use inefficient frag shader code to get screen coord, and solve problem of getting from screen coord to correct pix value. if works, might move to using scaled homogeneous coords that linearly interpolate	on screen. 	
	shaderPrograms.vertprojMix = genShaderVariants("shader-cubemap-vs", "shader-cubemap-fs", ['VERTPROJ','SPECIAL','CUSTOM_DEPTH'],['VPROJ_MIX','CUSTOM_DEPTH'],true);		
	
				
	shaderPrograms.decal = loadShader("shader-decal-vs", "shader-decal-fs");
					
	shaderPrograms.billboardQuads = loadShader("shader-simple-moving-billboard-vs", "shader-very-simple-fs",['CUSTOM_DEPTH','INSTANCE_COLOR'],['CUSTOM_DEPTH','INSTANCE_COLOR']);				
	
	//get locations later by calling completeShaders (when expect compiles/links to have completed)
	console.log("time to init shaders: " + ( performance.now() - initShaderTimeStart ) + "ms");
}
function completeShaders(){
	getLocationsForShaders();
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
var sphereBuffersHiRes={};
var quadBuffers={};
var quadBuffers2D={};
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

//var sshipModelScale=0.0001;
var sshipModelScale=0.00005;
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
var randomMatsT = [];

function generateDataForDataMatricesScale(inputData, infoArray, scaleFact){
	var numInstances = infoArray.length;
	
	var matsArray = infoArray.map(elem=>elem.matrix);	//inefficient but easy to read
	var colorsArray = infoArray.map(elem=>elem.color||[1.0,1.0,1.0,1.0]);	//wasteful if no colours provided
	var outputColorData = [];
	//make a big buffer with multiple copies of an object, pre-transformed by matrices.
	//cubes have 36 vertices, so can do 65536/24 = 2730 cubes in 1 draw call.
	//could make smooth cubes with 8 verts -> 8192, or octohedra with 6 verts -> 10922
	var thisMat, thisColor;
	
	var outputIndexData = [];
	var offset=0;
	
	var inputVertLength = inputData.vertices.length;
	var numVerts = inputVertLength/3;	
	
	var sourceVerts;
	
	var inVerts = inputData.vertices;
	var inNorms = inputData.normals;
	var inBins = inputData.binormals;
	var inTans = inputData.tangents;
	
	var sourceVerts = [];
	var sourceNorms = [];
	var sourceBins = [];
	var sourceTans = [];
	
	var thisVert;
	var thisNorm;
	var thisBin;
	var thisTan;
	var dotp;
	
	//generate 4vector position, normal (,tangent, binormal) data for a single instance
	for (var vv=0;vv<inputVertLength;vv+=3){
		thisVert = inVerts.slice(vv, vv+3).map( elem => elem*scaleFact );
		thisNorm = inNorms.slice(vv, vv+3);
		
		//something like normalise( magnitude 1 xyz normal vector, -dotp )
		//norm vector is already normalised (input is). TODO adjust it if using non-uniform scaling (but with cube/cuboid this doesn't matter anyway)
		dotp = thisNorm[0]*thisVert[0] + thisNorm[1]*thisVert[1] + thisNorm[2]*thisVert[2];
		thisNorm.push(-dotp);
		sourceNorms.push( normaliseArr(thisNorm) );
		
		thisVert.push(1);
		thisVert = normaliseArr(thisVert);
		sourceVerts.push( thisVert );
	}
	//TODO lose map, scale by scaleFact on 4th value before normalise
	
	console.log({sourceVerts:sourceVerts, sourceNorms:sourceNorms});
	
	/*
	console.log("calculated normals data.");
	console.log({scaleFact:scaleFact, sourceVerts:sourceVerts, inNorms:inNorms, sourceNorms:sourceNorms});
	
	//check that distance from vertex to normal is as expected (expect length sqrt(2))
	for (var ii=0;ii<sourceVerts.length;ii++){
		thisVert = sourceVerts[ii];
		thisNorm = sourceNorms[ii];
		var sumsq=0;
		for (var jj=0;jj<thisV.length;jj++){
			sumsq+= Math.pow( thisVert[jj]-thisNorm[jj] , 2);
		}
		console.log(sumsq);	//should be 2
	}
	*/
	if (inBins){	//only do this if has requisite data
		for (var vv=0;vv<inputVertLength;vv+=3){
			thisVert = inVerts.slice(vv, vv+3).map( elem => elem*scaleFact );
			thisBin = inBins.slice(vv, vv+3);
			thisTan = inTans.slice(vv, vv+3);
			dotp = thisBin[0]*thisVert[0] + thisBin[1]*thisVert[1] + thisBin[2]*thisVert[2];
			thisBin.push(-dotp);
			sourceBins.push( normaliseArr(thisBin) );
			dotp = thisTan[0]*thisVert[0] + thisTan[1]*thisVert[1] + thisTan[2]*thisVert[2];
			thisTan.push(-dotp);
			sourceTans.push( normaliseArr(thisTan) );
		}
	}
	function normaliseArr(inputArr){
		var len = Math.hypot.apply(null, inputArr);
	//	console.log({input:inputArr, length:len});
		return inputArr.map(elem => elem/len);
	}
	
	var sourceUvs = inputData.uvcoords;	//TODO proper projection, but if just using cubes, all verts equidistant from projection middle point, so doesn't matter
	
	var numVals = numInstances*numVerts*4;
	var transformedVerts = new Float32Array(numVals);
	var transformedNorms = new Float32Array(numVals);
	var transformedBins = new Float32Array(numVals);
	var transformedTans = new Float32Array(numVals);
	var copiedUvs = [];
	var myvec4 = vec4.create();
	
	for (var ii=0;ii<numInstances;ii++,offset+=numVerts){
		thisMat = matsArray[ii];
		thisColor = colorsArray[ii];
		for (var vv=0,idx=offset*4;vv<numVerts;vv++,idx+=4){
			//make a copy of vertex, rotate by matrix
			myvec4.set(sourceVerts[vv]);
			mat4.multiplyVec4(thisMat, myvec4);
			transformedVerts.set(myvec4, idx);	
			
			//make a copy of normal, rotate by matrix
			myvec4.set(sourceNorms[vv]);
			mat4.multiplyVec4(thisMat, myvec4);
			transformedNorms.set(myvec4, idx);	
		}
		if (inBins){
			for (var vv=0,idx=offset*4;vv<numVerts;vv++,idx+=4){
				//TODO reuse code for verts, norms, bins, tans (doing the same thing for all)
				myvec4.set(sourceBins[vv]);					
				mat4.multiplyVec4(thisMat, myvec4);
				transformedBins.set(myvec4, idx);
				
				myvec4.set(sourceTans[vv]);		
				mat4.multiplyVec4(thisMat, myvec4);
				transformedTans.set(myvec4, idx);
			}
		}
	
		copiedUvs.push(sourceUvs);
		
		outputIndexData.push(inputData.indices.map(function(elem){return elem+offset;}));
		
		for (var vv=0;vv<numVerts;vv++){
			outputColorData.push(thisColor);
		}
	}
	
	var toReturn = {	//todo check best format to output (would require change to buffer creation from data step that follows)
		vertices:transformedVerts,
		normals:transformedNorms,
		uvcoords:[].concat.apply([],copiedUvs),
		faces:[].concat.apply([],outputIndexData),	//todo use "indices" consistent with 3vec vertex format
		colors:[].concat.apply([],outputColorData)
	}
	
	if (inBins){
		toReturn.binormals=transformedBins;
		toReturn.tangents=transformedTans;
	}
	
	return toReturn;
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
			bufferArrayData(bufferObj.vertexColorBuffer, sourceData.colors, 4);
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
		
		if (sourceData.tangents){
			bufferObj.vertexTangentBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexTangentBuffer, sourceData.tangents, 4);
		}
		if (sourceData.binormals){
			bufferObj.vertexBinormalBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexBinormalBuffer, sourceData.binormals, 4);
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
	
	var gunObject = loadBlenderExport(cannonData);	

	var icoballObj = loadBlenderExport(icoballdata);

	//loadBufferData(sphereBuffers, makeSphereData(99,200,1)); //todo use normalized box/icosohedron,subdivided octohedron etc, triangle strips
	loadBufferData(sphereBuffers, makeSphereData(16,32,1));
	loadBufferData(sphereBuffersHiRes, makeSphereData(127,255,1)); //near index limit 65536.
	loadBufferData(quadBuffers, quadData);
	loadBufferData(quadBuffers2D, quadData2D);
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

	var thisMatT;
	for (var ii=0;ii<maxRandBoxes;ii++){
		//thisMat = convert_quats_to_4matrix(random_quat_pair(), mat4.create());
	
		//using qpair fixes bug where boxes that are moved a lot render black when close to the camera, expect because 4matrix gets bent out of shape
		//this has performance overhead. TODO speed up. faster qpair code? use qpairs in shader? periodically fix matrix? just keep a static unmoved matrix, move this by increasing amount every frame (applicable to special case of these straight line moving boxes)?
	
		var thisQpair = random_quat_pair();
		thisMat = convert_quats_to_4matrix(thisQpair, mat4.create());
		thisMat.qPair = thisQpair;
	
		randomMats.push(thisMat);

		thisMatT = mat4.create(thisMat);	//todo only use transposed matrix?
		mat4.transpose(thisMatT);
		randomMatsT.push(thisMatT);
	}
	

	var randBoxData = generateDataForDataMatricesScale(smoothCubeData, randomMats.map(elem => {return {matrix:elem};}), 0.001);	//TODO ensure none inside portal radius. (4vec vertex shader doesn't discard pixels)
	
	//console.log("randBoxData:");
	//console.log(randBoxData);
	loadDuocylinderBufferData(randBoxBuffers, randBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	randBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	randBoxBuffers.step=0;	//unused
	
	var towerBoxData = generateDataForDataMatricesScale(levelCubeData, duocylinderBoxInfo.towerblocks.list, duocylinderSurfaceBoxScale);
	loadDuocylinderBufferData(towerBoxBuffers, towerBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	towerBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	towerBoxBuffers.step=0;	//unused
	
	var stonehengeBoxData = generateDataForDataMatricesScale(levelCubeData, duocylinderBoxInfo.stonehenge.list, duocylinderSurfaceBoxScale);
	loadDuocylinderBufferData(stonehengeBoxBuffers, stonehengeBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	stonehengeBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	stonehengeBoxBuffers.step=0;	//unused
	
	var roadBoxData = generateDataForDataMatricesScale(levelCubeData, duocylinderBoxInfo.roads.list, duocylinderSurfaceBoxScale);
	loadDuocylinderBufferData(roadBoxBuffers, roadBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	roadBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	roadBoxBuffers.step=0;	//unused
	
	function loadBufferData(bufferObj, sourceData){
		bufferObj.vertexPositionBuffer = gl.createBuffer();
		bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, sourceData.vertices_len || 3);
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
		if (sourceData.tangents){
			bufferObj.vertexTangentBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexTangentBuffer, sourceData.tangents, 3);
		}
		if (sourceData.binormals){
			bufferObj.vertexBinormalBuffer= gl.createBuffer();
			bufferArrayData(bufferObj.vertexBinormalBuffer, sourceData.binormals, 3);
		}
		bufferObj.vertexIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
		bufferObj.vertexIndexBuffer.itemSize = 3;
		bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;
	}
	
	
	randBoxBuffers.randMatrixBuffers = glBufferMatrixUniformDataForInstancedDrawing(randomMats);
	randBoxBuffers.procTerrainMatrixBuffers = glBufferMatrixUniformDataForInstancedDrawing(procTerrainSurfaceParticleMats);
	randBoxBuffers.voxTerrainMatrixBuffers = glBufferMatrixUniformDataForInstancedDrawing(voxSurfaceParticleMats);
	
	function glBufferMatrixUniformDataForInstancedDrawing(sourceMatArr){
		//make a matrix buffer for instanced drawing of random boxes
		var numMats = sourceMatArr.length;
		//var matrixF32Arr = new Float32Array(numMats*16);
		console.log("buffering matrix in bits!!!!!!!!");
		var matrixF32ArrA = new Float32Array(numMats*4);
		var matrixF32ArrB = new Float32Array(numMats*4);
		var matrixF32ArrC = new Float32Array(numMats*4);
		var matrixF32ArrD = new Float32Array(numMats*4);
		
		var thisMat;
		for (var ii=0,pp=0;ii<numMats;ii++,pp+=4){
			thisMat=sourceMatArr[ii];
			matrixF32ArrA.set(thisMat.slice(0,4),pp);
			matrixF32ArrB.set(thisMat.slice(4,8),pp);
			matrixF32ArrC.set(thisMat.slice(8,12),pp);
			matrixF32ArrD.set(thisMat.slice(12,16),pp);
		}
		/*
		console.log("made f32 arrs");
		console.log(matrixF32ArrA);
		console.log(matrixF32ArrB);
		console.log(matrixF32ArrC);
		console.log(matrixF32ArrD);
		*/
		//randBoxBuffers.mats = gl.createBuffer();
		//bufferArrayData(randBoxBuffers.mats, matrixF32Arr, 16);	//note that piggybacking on buffer object that's used in a different drawing mode - "singleBuffer", wheras mats are used for instanced drawing mode
		//above seems like doesn't work. should pass matrices by 4 vectors. perhaps buffers should be like that too...
		//TODO this properly with stride etc? at least do neatly
		var matA = gl.createBuffer();
		var matB = gl.createBuffer();
		var matC = gl.createBuffer();
		var matD = gl.createBuffer();
		bufferArrayDataGeneral(matA, matrixF32ArrA, 4);
		bufferArrayDataGeneral(matB, matrixF32ArrB, 4);
		bufferArrayDataGeneral(matC, matrixF32ArrC, 4);
		bufferArrayDataGeneral(matD, matrixF32ArrD, 4);
		
		return {a:matA, b:matB, c:matC, d:matD};
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
	
	explosionParticles.init();
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
	resultsObj.cubeViewShiftAdjustedMinus = cubeViewShiftAdjustedMinus;	//for debugging
	
	//only used for droplightpos2, and only different from shaderMatrix if reflector (rather than portal) (inefficient!)
	var reflectShaderMatrix2 = mat4.create();
	mat4.identity(reflectShaderMatrix2);
	xyzmove4mat(reflectShaderMatrix2, cubeViewShiftAdjusted);	
	resultsObj.shaderMatrix2=reflectShaderMatrix2;
}

var gunHeat = 0;

var offsetCam = (function(){
	var offsetVec;
	var offsetVecReverse;
	var targetForType = {
		"near 3rd person":[0,-37.5,-25],	//TODO reduce code duplication. do scalar vector product targetForType time?
		"mid 3rd person":[0,-50,-75],
		//"far 3rd person":[0,-100,-125],	
		"far 3rd person":[0,-75,-100],	
		"cockpit":[0,0,11.5],
		"side":[30,0,12.5]
	}
	var targetForTypeReverse = {
		"near 3rd person":[0,-37.5,25],
		"mid 3rd person":[0,-37.5,37.5],
		"far 3rd person":[0,-100,150],
		//"far 3rd person":[0,0,100],
		"cockpit":[0,0,-50],
		"side":[30,0,12.5]
	}
	var offsetVecTarget = targetForType["far 3rd person"].map(x=>sshipModelScale*x);
	var offsetVecTargetReverse = targetForTypeReverse["far 3rd person"].map(x=>sshipModelScale*x);
	offsetVec = offsetVecTarget;
	offsetVecReverse = offsetVecTargetReverse;

	var mult1=0.985;
	var mult2=1-mult1;
	
	return {
		getVec: function (){
			return reverseCamera ? offsetVecReverse : offsetVec;
		},
		setType: function(type){
			offsetVecTarget = targetForType[type].map(x=>sshipModelScale*x);
			offsetVecTargetReverse = targetForTypeReverse[type].map(x=>sshipModelScale*x);
		},
		iterate: function(){
			for (var cc=0;cc<3;cc++){
				offsetVec[cc] = offsetVec[cc]*mult1+offsetVecTarget[cc]*mult2;
				offsetVecReverse[cc] = offsetVecReverse[cc]*mult1+offsetVecTargetReverse[cc]*mult2;
			}
		}
	}
})();

var lastSeaTime=0;
function drawScene(frameTime){
	resizecanvas();
	heapPerfMon.sample();	//suspect not right place for this, better at end

	var heapPerfData = heapPerfMon.read();
	if (heapPerfData){
		document.getElementById("info3").innerHTML ="GC avg amount:" + (heapPerfData.avgAmount / 1000000).toFixed(1) + "MB, "+ 
													"period:" + heapPerfData.avgPeriod.toFixed(0) + "ms, "+
													"rate:" + (heapPerfData.collectionRate/1000).toFixed(1) + "MB/s"
													"ratio:" + (heapPerfData.ratio/100).toFixed(1) + "%";
	}

	iterateMechanics(frameTime);	//TODO make movement speed independent of framerate
	
	requestAnimationFrame(drawScene);
	stats.end();
	stats.begin();
	
	
	reflectorInfo.rad = guiParams.reflector.draw? guiParams.reflector.scale : 0;	//when "draw" off, portal is inactivate- can't pass through, doesn't discard pix
	
	offsetCameraContainer.world = playerContainer.world;
	
	mat4.set(playerCameraInterp, offsetPlayerCamera);	
	//mat4.set(playerCamera, offsetPlayerCamera);	
	
	offsetCam.setType(guiParams.display.cameraType);

	var offsetSteps = 500;	//todo proper move thru portal taking into account path. or can make more efficient by binary search (~log(n) tests)
	var tmp4mat = mat4.create();
	var offsetVec = offsetCam.getVec();
	var tmpOffsetArr = new Array(3);
	var wentThrough = false;

	for (var ii=0;ii<offsetSteps;ii++){	//TODO more efficient. if insufficient subdivision, transition stepped.
		mat4.set(offsetPlayerCamera, tmp4mat);	//TODO check order
		for (var cc=0;cc<3;cc++){
			tmpOffsetArr[cc] = offsetVec[cc]*ii/offsetSteps;
		}
		xyzmove4mat(tmp4mat,tmpOffsetArr);
		if (checkWithinReflectorRange(tmp4mat, reflectorInfo.rad)){
			//portalTest will pass, so repeat with original matrix
			xyzmove4mat(offsetPlayerCamera,tmpOffsetArr);
			portalTest(offsetCameraContainer,0);
			wentThrough = true;
			//assume wont cross twice, move remainder of way
			for (var cc=0;cc<3;cc++){
				tmpOffsetArr[cc] = offsetVec[cc]-tmpOffsetArr[cc];
			}
			xyzmove4mat(offsetPlayerCamera,tmpOffsetArr);
		}
	}
	if (!wentThrough){
		xyzmove4mat(offsetPlayerCamera,offsetVec);
	}
	
	
	mat4.set(offsetPlayerCamera, worldCamera);

	mainCamFov = guiParams.display.cameraFov;
	setProjectionMatrix(nonCmapPMatrix, mainCamFov, gl.viewportHeight/gl.viewportWidth);	//note mouse code assumes 90 deg fov used. TODO fix.
	if (reverseCamera){
		nonCmapPMatrix[0]=-nonCmapPMatrix[0];
		xyzrotate4mat(worldCamera, (guiParams.display.flipReverseCamera? [Math.PI,0,0]:[0,Math.PI,0] ));	//flip 180  - note repeated later. TODO do once and store copy of camera
	}
	
	mat4.set(worldCamera, invertedWorldCamera);
	mat4.transpose(invertedWorldCamera);
	nonCmapCullFunc = generateCullFunc(nonCmapPMatrix);										//todo only update pmatrix, nonCmapCullFunc if input variables have changed
	
	testPortalDraw=false;
	if (nonCmapCullFunc(invertedWorldCamera,reflectorInfo.rad)){
		testPortalDraw=true;
		
		mat4.set(offsetPlayerCamera, worldCamera);
		calcReflectionInfo(worldCamera,reflectorInfo);
		
		//draw cubemap views
		mat4.identity(worldCamera);	//TODO use correct matrices
		
		//TODO move pMatrix etc to only recalc on screen resize
		//make a pmatrix for hemiphere perspective projection method.
		
		frustumCull = squareFrustumCull;
		if (guiParams.reflector.cmFacesUpdated>0){
			
			var wSettingsArr = [];	//TODO is this always same?
			
			gl.cullFace(gl.BACK);	//because might have set to front for mirror reversing/landing camera.
			var numFacesToUpdate = guiParams.reflector.cmFacesUpdated;
			mat4.set(cmapPMatrix, pMatrix);
			for (var ii=0;ii<numFacesToUpdate;ii++){	//only using currently to check perf impact. could use more "properly" and cycle/alternate.
				var framebuffer = guiParams.display.drawTransparentStuff ? cubemapView.intermediateFramebuffers[ii] : cubemapView.framebuffers[ii];
				//var framebuffer = cubemapView.framebuffers[ii];
				gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
				gl.viewport(0, 0, framebuffer.width, framebuffer.height);
				mat4.identity(worldCamera);
				xyzmove4mat(worldCamera, reflectorInfo.cubeViewShiftAdjusted);	
				rotateCameraForFace(ii);
				
				wSettingsArr.push( drawWorldScene(frameTime, true) );
			}
			
			if (guiParams.display.drawTransparentStuff){
				for (var ii=0;ii<numFacesToUpdate;ii++){
					var framebuffer = cubemapView.framebuffers[ii];
					gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
					gl.viewport(0, 0, framebuffer.width, framebuffer.height);
					mat4.identity(worldCamera);
					xyzmove4mat(worldCamera, reflectorInfo.cubeViewShiftAdjusted);	
					rotateCameraForFace(ii);
					
					var activeProg = shaderPrograms.fullscreenTexturedWithDepthmap;
					gl.useProgram(activeProg);
					enableDisableAttributes(activeProg);

					bind2dTextureIfRequired(cubemapView.intermediateTextures[ii]);
					bind2dTextureIfRequired(cubemapView.intermediateDepthTextures[ii],gl.TEXTURE2);
					
					gl.uniform1i(activeProg.uniforms.uSampler, 0);
					gl.uniform1i(activeProg.uniforms.uSamplerDepthmap, 2);	
					
					gl.depthFunc(gl.ALWAYS);
					drawObjectFromBuffers(fsBuffers, activeProg);
					gl.depthFunc(gl.LESS);
					gl.cullFace(gl.BACK);
					drawWorldScene2(frameTime, wSettingsArr[ii], cubemapView.intermediateDepthTextures[ii]);	//depth aware drawing stuff like sea
						//note currently depth is not correct, probably responsible for inconsistent rendering across cubemap edges.
					
				}
			}
			
			function rotateCameraForFace(ii){
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
			}
			
		}
	}
	
	//setup for drawing to screen
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	mat4.set(nonCmapPMatrix, pMatrix);
														
	frustumCull = nonCmapCullFunc;
	
	mat4.set(offsetPlayerCamera, worldCamera);	//set worldCamera to playerCamera
	//xyzmove4mat(worldCamera,[0,-0.01,-0.015]);	//3rd person camera
	//xyzmove4mat(worldCamera,[0,0,0.005]);	//forward camera

	if (reverseCamera){
		gl.cullFace(gl.FRONT);	//todo revert for drawing cubemap faces. or : for PIP camera, render to texture, flip when texture to screen (and if fullscreen reversing camera, use same cullface setting when drawing them (if switching cullface is a slow gl call)
		xyzrotate4mat(worldCamera, (guiParams.display.flipReverseCamera? [Math.PI,0,0]:[0,Math.PI,0] ));	//flip 180
	}else{
		gl.cullFace(gl.BACK);
	}
	
	if (guiParams.display.renderViaTexture == "no"){
		drawWorldScene(frameTime, false);
	}else{
		
		var fisheyeParams={};
		
		var sceneDrawingOutputView = rttStageOneView;

		if (guiParams.display.renderViaTexture == "fisheye"){
			//draw scene to a offscreen
			gl.bindFramebuffer(gl.FRAMEBUFFER, rttStageOneView.framebuffer);
			
			var fy = Math.tan(guiParams.display.cameraFov*Math.PI/360);	//todo pull from camera matrix?
			var fx = fy*gl.viewportWidth/gl.viewportHeight;		//could just pass in one of these, since know uInvSize
			
			var uF = [fx, fy];
			var uVarOne = guiParams.display.uVarOne;
			
			//see shader file for derivation of oversize calculation
			var sumInvSqs = uF[0]*uF[0] + uF[1]*uF[1];
			var oversizeRHS = 0.25 - uVarOne*2*sumInvSqs;
			var oversize;
			if (oversizeRHS<=0){
				oversize = 4.0;	//cap it. TODO ensure this can't happen? (control diag fov by UI?) does this happen?
				console.log("OVERSIZE RHS NEGATIVE OR ZERO!");
			}else{
				oversize = Math.sqrt(oversizeRHS) + 0.5;
			}
			//cap oversize so doesn't kill computer!!
			//note this is good for a proof of concept/ testing fisheye cam for gameplay, but 4x oversize (basically rendering 8k for 2k result) makes computer quite noisy! should use 2/4 panel/cubemap method if want a large FOV.
			oversize = Math.min(oversize,4.0);
			
			fisheyeParams.uInvF = uF.map(elem=>1/elem);
			fisheyeParams.uVarOne = uVarOne;
			fisheyeParams.uOversize = oversize;
			
			myfisheyedebug = fisheyeParams;	//TODO remove
			
			var oversizedViewport = [ 2*Math.floor(oversize*gl.viewportWidth/2),  2*Math.floor(oversize*gl.viewportHeight/2)];
			gl.viewport( 0,0, oversizedViewport[0], oversizedViewport[1] );
			setRttSize( rttStageOneView, oversizedViewport[0], oversizedViewport[1] );	//todo stop setting this repeatedly
			
			var wSettings = drawWorldScene(frameTime, false);
			
			if (guiParams.display.drawTransparentStuff){
				drawTransparentStuff(rttStageOneView, rttFisheyeView2, oversizedViewport[0], oversizedViewport[1], wSettings);
				sceneDrawingOutputView = rttFisheyeView2;
			}
		}
		
		function drawTransparentStuff(fromView, toView, sizeX, sizeY, wSettings){
			//switch to another view of same size, asign textures for existing rgb(a) and depth map, and draw these to new rgb(a), depth map (fullscreen quad)
			// note that drawing depthmap maybe redundant because will be looking up depth map from texture to determine colours anyway, but might help with discarding pixels etc.
			gl.bindFramebuffer(gl.FRAMEBUFFER, toView.framebuffer);
			gl.viewport( 0,0, sizeX, sizeY);
			setRttSize( toView, sizeX, sizeY );	//todo stop setting this repeatedly
			activeProg = shaderPrograms.fullscreenTexturedWithDepthmap;
			gl.useProgram(activeProg);
			enableDisableAttributes(activeProg);

			bind2dTextureIfRequired(fromView.texture);
			bind2dTextureIfRequired(fromView.depthTexture,gl.TEXTURE2);
			
			gl.uniform1i(activeProg.uniforms.uSampler, 0);
			gl.uniform1i(activeProg.uniforms.uSamplerDepthmap, 2);
			gl.cullFace(gl.BACK);	//TODO use a revered fsBuffers
			gl.depthFunc(gl.ALWAYS);
			drawObjectFromBuffers(fsBuffers, activeProg);
			gl.depthFunc(gl.LESS);
			if (reverseCamera){
				gl.cullFace(gl.FRONT);
			}
			
			drawWorldScene2(frameTime, wSettings, fromView.depthTexture);	//depth aware drawing stuff like sea
		}

		
		var activeProg;
		
		if (guiParams.display.renderViaTexture != "fisheye"){
			gl.bindFramebuffer(gl.FRAMEBUFFER, rttStageOneView.framebuffer);
			gl.viewport( 0,0, gl.viewportWidth, gl.viewportHeight );
			setRttSize( rttStageOneView, gl.viewportWidth, gl.viewportHeight );
			var wSettings = drawWorldScene(frameTime, false);

			if (guiParams.display.drawTransparentStuff){
				drawTransparentStuff(rttStageOneView, rttView, gl.viewportWidth, gl.viewportHeight, wSettings);
				sceneDrawingOutputView = rttView;
			}
		}else{

			//draw scene to penultimate screen (before FXAA)
			gl.bindFramebuffer(gl.FRAMEBUFFER, rttView.framebuffer);
			gl.viewport( 0,0, gl.viewportWidth, gl.viewportHeight );
			setRttSize( rttView, gl.viewportWidth, gl.viewportHeight );

			bind2dTextureIfRequired(sceneDrawingOutputView.texture);	
			activeProg = shaderPrograms.fullscreenTexturedFisheye;
			gl.useProgram(activeProg);
			enableDisableAttributes(activeProg);
			gl.cullFace(gl.BACK);
			
			//if (activeProg.uniforms.uInvF){	//used for fisheye TODO lose IF?
			gl.uniform2fv(activeProg.uniforms.uInvF, fisheyeParams.uInvF);
			//}
			gl.uniform1f(activeProg.uniforms.uVarOne, fisheyeParams.uVarOne);
			gl.uniform1f(activeProg.uniforms.uOversize, fisheyeParams.uOversize);
			
			gl.uniform1i(activeProg.uniforms.uSampler, 0);		
			gl.uniform2f(activeProg.uniforms.uInvSize, 1/gl.viewportWidth , 1/gl.viewportHeight);		
			gl.depthFunc(gl.ALWAYS);
			drawObjectFromBuffers(fsBuffers, activeProg);
			//gl.depthFunc(gl.LESS);

			sceneDrawingOutputView = rttView;
		}
		
		//draw quad to screen using drawn texture
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);	//draw to screen.
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);	//TODO check whether necessary to keep setting this
		bind2dTextureIfRequired(sceneDrawingOutputView.texture);	
		
		//draw the simple quad object to the screen
		switch (guiParams.display.renderViaTexture){
			case "basic": 
				activeProg = shaderPrograms.fullscreenTextured;break;
			case "bennyBox":
			case "fisheye":
				activeProg = shaderPrograms.fullscreenBennyBox;break;
			case "bennyBoxLite":
				activeProg = shaderPrograms.fullscreenBennyBoxLite;break;
		}
		gl.useProgram(activeProg);
		enableDisableAttributes(activeProg);
		gl.cullFace(gl.BACK);
		
		//gl.activeTexture(gl.TEXTURE0);

		gl.uniform1i(activeProg.uniforms.uSampler, 0);		
		gl.uniform2f(activeProg.uniforms.uInvSize, 1/gl.viewportWidth , 1/gl.viewportHeight);
		gl.depthFunc(gl.ALWAYS);		
		drawObjectFromBuffers(fsBuffers, activeProg);
		gl.depthFunc(gl.LESS);
	}
	
	if (!guiParams["drop spaceship"] && guiParams.display.showHud){	//only draw hud if haven't dropped spaceship
		
		//draw target box ?
		//var activeShaderProgram = shaderPrograms.colored;
		var activeShaderProgram = shaderPrograms.decal;
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
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, scale,scale,scale);
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, color);
			mat4.identity(mvMatrix);
			xyzmove4mat(mvMatrix,[0.01*pos[0]/pos[2],0.01*pos[1]/pos[2],0.01]);
			drawObjectFromPreppedBuffers(quadBuffers, activeShaderProgram);
	}
	

	heapPerfMon.sample();
	heapPerfMon.delaySample(0);
}

var mainCamFov = 105;	//degrees.
function setProjectionMatrix(pMatrix, vFov, ratio, polarity){
	mat4.identity(pMatrix);
	
	var fy = Math.tan((Math.PI/180.0)*vFov/2);
	
	pMatrix[0] = ratio/fy ;
	pMatrix[5] = 1.0/fy;
	pMatrix[11]	= -1;	//rotate w into z.
	//pMatrix[14] = -0.00003;	//smaller = more z range. 1/50 gets ~same near clipping result as stereographic/perspective 0.01 near
	pMatrix[14] = 0;	//with custom depth extension, still discards based on gl_Position w,z, so "disable" that here (setting this to 0 should cause all depths to be 0)
						//TODO consider what else might pass through. might take advantage of discard - what happens for stuff on "opposite side of world"? might be able to discard stuff "behind" the player  
	
	pMatrix[10]	= 0;
	pMatrix[15] = 0;
}

var sshipWorld=0;	//used for player light

var colorArrs = (function () {
	var typedArrColors = [];
	var arrColors = {
		white:[1.0, 1.0, 1.0, 1.0],
		gray:[0.6,0.6,0.6,1.0],
		darkGray:[0.4, 0.4, 0.4, 1.0],
		veryDarkGray:[0.2, 0.2, 0.2, 1.0],
		superDarkGray:[0.05, 0.05, 0.05, 1.0],
		black:[0, 0, 0, 1.0],
		red:[1.0, 0.1, 0.1, 1.0],
		green:[0.1, 1.0, 0.1, 1.0],
		blue:[0.1, 0.1, 1.0, 1.0],
		yellow:[1.0, 1.0, 0.1, 1.0],
		magenta:[1.0, 0.1, 1.0, 1.0],
		cyan:[0.1, 1.0, 1.0, 1.0],
		randBoxes:[0.9, 0.9, 1.0, 0.9],
		teapot:[0.4, 0.4, 0.8, 1.0],
		hudFlightDir:[0.0, 0.5, 1.0, 0.5],
		hudBox:[1, 0.1, 0, 0.5],
		hudYellow:[1.0, 1.0, 0.0, 0.5],
		guns:[0.3, 0.3, 0.3, 1.0],
		target:[1, 0.2, 0.2, 1],
	}
	for (key of Object.keys(arrColors) ){
		typedArrColors[key]=new Float32Array(arrColors[key]);
	}
	return typedArrColors;
})();


function updateGunTargeting(matrix){
	var modelScale = sshipModelScale;
	var matrixForTargeting = matrix;
	
	var gunHoriz = 16*sshipModelScale;
	var gunVert = 8*sshipModelScale;
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
		
	setGunMatrixRelativeToSpacehip(0, [gunHoriz,gunVert,gunFront]); //left, down, forwards
	setGunMatrixRelativeToSpacehip(1, [-gunHoriz,gunVert,gunFront]);
	setGunMatrixRelativeToSpacehip(2, [-gunHoriz,-gunVert,gunFront]);
	setGunMatrixRelativeToSpacehip(3, [gunHoriz,-gunVert,gunFront]);
	
	function setGunMatrixRelativeToSpacehip(gunnum, vec){	//todo reuse matrices for gunMatrixCosmetic (fixed array) - not simple to use pool since pushing onto gunMatrices //todo precalc gunmatrices relative to spaceship?
		var gunMatrixCosmetic = gunMatrices[gunnum];
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
		var targetPos = targetMatrix.slice(12);
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

var lgMat = mat4.create();

var getWorldSceneSettings = (function generateGetWorldSettings(){
	var portaledMatrix = mat4.create();
	var returnObj = {
		colorsSwitch:0,
		worldInfo:0,
		localVecFogColor:0,
		localVecReflectorDiffColor:new Array(3),
		reflectorPosTransformed:new Array(4),
		cosReflector:0,
		sshipDrawMatrix:0,
	}
	var colorsSwitch;

	return function getWorldSceneSettings(isCubemapView){
		returnObj.reflectorPosTransformed=new Array(4);	//workaround bug (see comments near return statement)

		returnObj.colorsSwitch = colorsSwitch = ((isCubemapView && guiParams.reflector.isPortal)?1:0)^offsetCameraContainer.world;
		returnObj.worldInfo = (colorsSwitch==0) ? guiParams.world0 : guiParams.world1;	//todo use array
		returnObj.localVecFogColor = localVecFogColor = worldColors[colorsSwitch];
		returnObj.localVecReflectorColor = guiParams.reflector.isPortal? worldColors[1-colorsSwitch]: worldColors[colorsSwitch];

		for (var cc=0;cc<3;cc++){
			returnObj.localVecReflectorDiffColor[cc] = returnObj.localVecReflectorColor[cc]-returnObj.localVecFogColor[cc];
		}
		//calculate stuff for discard shaders
		for (var cc=0;cc<4;cc++){
			returnObj.reflectorPosTransformed[cc] = worldCamera[4*cc+3];	//position of reflector in frame of camera (after MVMatrix transformation)
		}
		returnObj.cosReflector = 1.0/Math.sqrt(1+reflectorInfo.rad*reflectorInfo.rad);
		
		if (sshipWorld == returnObj.colorsSwitch){ //only draw spaceship if it's in the world that currently drawing. (TODO this for other objects eg shots)
			returnObj.sshipDrawMatrix = sshipMatrix;
		}else{
			if (checkWithinReflectorRange(sshipMatrix, Math.tan(Math.atan(reflectorInfo.rad) +0.1))){
				mat4.set(sshipMatrix, portaledMatrix);
				moveMatrixThruPortal(portaledMatrix, reflectorInfo.rad, 1);
				returnObj.sshipDrawMatrix = portaledMatrix;
			}	
		}
		
		//return returnObj;		//causes bug currently because other properties are added to this object after it is returned and assigned to 
								//wSettings, which are particular to the (cubemap) view, eg light position in camera frame.
								//TODO handle those specific variables separately, to avoid allocation of new objects.

		return {...returnObj}	//shallow clone
	}
})();



function drawWorldScene(frameTime, isCubemapView) {
	var wSettings = getWorldSceneSettings(isCubemapView);
	({colorsSwitch,worldInfo, localVecFogColor, localVecReflectorColor, localVecReflectorDiffColor, reflectorPosTransformed, cosReflector, sshipDrawMatrix} = wSettings);
		//above could just paste getWorldSceneSettings function stuff here instead.
	
	gl.clearColor.apply(gl,worldColorsPlain[colorsSwitch]);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
	mat4.set(worldCamera, invertedWorldCamera);
	mat4.transpose(invertedWorldCamera);
	
	//equivalent for frame of duocylinder, to reduce complexity of drawing, collision checks etc
	mat4.set(invertedWorldCamera, invertedWorldCameraDuocylinderFrame);
	rotate4mat(invertedWorldCameraDuocylinderFrame, 0, 1, duocylinderSpin);
	
		
	var relevantColorShader = shaderPrograms.coloredPerPixelDiscard[ guiParams.display.atmosShader ];
	//var relevantTexmapShader = shaderPrograms.texmapPerPixelDiscard[ guiParams.display.atmosShader ];
	var relevantTexmapShader = guiParams.display.useSpecular? shaderPrograms.texmapPerPixelDiscardPhong[ guiParams.display.atmosShader ] : shaderPrograms.texmapPerPixelDiscard[ guiParams.display.atmosShader ];
	
	shaderProgramColored = guiParams.display.perPixelLighting?relevantColorShader:shaderPrograms.coloredPerVertex;
	shaderProgramTexmap = guiParams.display.perPixelLighting?relevantTexmapShader:shaderPrograms.texmapPerVertex;	
	
	var dropLightPos;
	if (!guiParams["drop spaceship"]){
		mat4.set(playerCameraInterp,sshipMatrix);	//copy current player 4-rotation matrix to the spaceship object
	}else{
		mat4.set(sshipMatrixNoInterp, sshipMatrix);		
	}
	
	//get light pos in frame of camera. light is at spaceship
	var lightMat = mat4.create();	//TODO mat*mat is unnecessary - only need to do dropLightPos = sshipMatrix*lightPosInWorld 
	mat4.set(invertedWorldCamera, lightMat);
	
	var sshipMatrixShifted = mat4.create();	//TODO permanent/reuse (code duplicated from elsewhere.
	mat4.set(sshipMatrix, sshipMatrixShifted)
	
	mat4.multiply(lightMat, sshipMatrixShifted);
	dropLightPos = lightMat.slice(12);
	
	wSettings.dropLightPos = dropLightPos;
	
	//for debug 
	window.lmat = lightMat;
	
	mat4.set(invertedWorldCamera, lightMat);
	
	//only use 1 drop light. should be standard pos'n if drawing same world as light, and reflected pos'n if different
	//if dropLight in the space that are currently drawing, move it through portal.
	//TODO /note that 2nd light is relevant if sphere is reflector instead of portal.
	if (colorsSwitch^sshipWorld){
		var dropLightReflectionInfo={};
		calcReflectionInfo(sshipMatrixShifted,dropLightReflectionInfo);
		mat4.multiply(lightMat, dropLightReflectionInfo.shaderMatrix2);
		dropLightPos = lightMat.slice(12);	//todo make light dimmer/directional when "coming out of" portal
	}
	
	var boxSize;
	var boxRad;
	
	//draw exploding box using modified shader (note this always uses atmos v2 at the mo (analytic integral of series approximation)
	if (guiParams.drawShapes.explodingBox){
		boxSize = 0.02;
		boxRad = boxSize*Math.sqrt(3);
		
		var activeShaderProgram = shaderPrograms.texmapPerPixelDiscardExplode[ guiParams.display.atmosShader ];
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
		
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
		gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);

		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);

		//new for this version of shader
		//gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, guiParams.normalMove + boxSize);
		gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, 0.01*Math.abs(Math.cos((Math.PI/1000)*(frameTime % 2000 ))) + boxSize);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,teapotMatrix);
		mat4.set(teapotMatrix, mMatrix);
		
		//gl.activeTexture(gl.TEXTURE0);
		bind2dTextureIfRequired(texture);
		
		drawObjectFromBuffers(explodingCubeBuffers, activeShaderProgram);	
	}
	
	boxSize = 0.1;
	boxRad = boxSize*Math.sqrt(3);
	
	//gl.enableVertexAttribArray(1);	//do need tex coords

	shaderSetup(guiParams.debug.nmapUseShader2 ? (guiParams.display.useSpecular ? shaderPrograms.texmapPerPixelDiscardNormalmapPhong[ guiParams.display.atmosShader ] : shaderPrograms.texmapPerPixelDiscardNormalmap[ guiParams.display.atmosShader ]) : shaderPrograms.texmapPerPixelDiscardNormalmapV1[ guiParams.display.atmosShader ], nmapTexture);
	
	function shaderSetup(shader, tex){
		activeShaderProgram = shader;
		performShaderSetup(shader, wSettings, tex, boxSize);
		gl.uniform3f(shader.uniforms.uModelScale, boxSize,boxSize,boxSize);
	}	
	
	
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
			(guiParams.display.culling ? boxRad: false),
			cubeBuffers,
			activeShaderProgram
		);
	}
	

	
	numRandomBoxes = Math.min(randomMats.length, guiParams['random boxes'].number);	//TODO check this doesn't happen/ make obvious error!
	
	if (numRandomBoxes>0){
		if (guiParams['random boxes'].drawType == 'indiv'){
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.randBoxes);
			
			boxSize = guiParams['random boxes'].size;
			boxRad = boxSize*Math.sqrt(3);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
			
		//	var criticalWPos = Math.cos(Math.atan(guiParams.reflector.scale) + Math.atan(boxRad));
						
			prepBuffersForDrawing(cubeBuffers, activeShaderProgram);
			
			for (var ii=0;ii<numRandomBoxes;ii++){
				var thisMat = randomMats[ii];
				mat4.set(invertedWorldCameraDuocylinderFrame, mvMatrix);
				mat4.multiply(mvMatrix, thisMat);
				
			//	if (thisMat[15]>criticalWPos){continue;}	//don't draw boxes too close to portal
				if (frustumCull(mvMatrix,boxRad)){
					mat4.set(thisMat, mMatrix);
					drawObjectFromPreppedBuffers(cubeBuffers, activeShaderProgram);
				}
			}
		}
		
		//don't calculate mvMatrix and pass it in, do it in the shader instead (pass in world camera or inverted world camera)
		if (guiParams['random boxes'].drawType == 'indivVsMatmult'){
			
			shaderSetup(shaderPrograms.texmapPerPixelDiscardNormalmapPhongVsMatmult[ guiParams.display.atmosShader ]);
			
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.randBoxes);
			
			boxSize = guiParams['random boxes'].size;
			boxRad = boxSize*Math.sqrt(3);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
			
		//	var criticalWPos = Math.cos(Math.atan(guiParams.reflector.scale) + Math.atan(boxRad));
			
			prepBuffersForDrawing(cubeBuffers, activeShaderProgram);
			
			gl.uniformMatrix4fv(activeShaderProgram.uniforms.uVMatrix, false, invertedWorldCameraDuocylinderFrame);	//TODO what to pass in??
			//gl.uniformMatrix4fv(activeShaderProgram.uniforms.uVMatrix, false, worldCamera);	//TODO what to pass in??
			
			for (var ii=0;ii<numRandomBoxes;ii++){
				var thisMat = randomMats[ii];
				mat4.set(invertedWorldCameraDuocylinderFrame, mvMatrix);	//only using mvMatrix for f-cull. can render without this, but with indiv draw culls, frust cull is beneficial
				mat4.multiply(mvMatrix, thisMat);
				
			//	if (thisMat[15]>criticalWPos){continue;}	//don't draw boxes too close to portal
				if (frustumCull(mvMatrix,boxRad)){
					mat4.set(thisMat, mMatrix);
					drawObjectFromPreppedBuffersVsMatmult(cubeBuffers, activeShaderProgram);
				}
			}
		}
		
		if (guiParams['random boxes'].drawType == 'instancedArrays'){
			shaderSetup(shaderPrograms.texmapPerPixelDiscardNormalmapPhongInstanced[ guiParams.display.atmosShader ]);
			
			//gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.randBoxes);
			gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.red);
			boxSize = guiParams['random boxes'].size;
			boxRad = boxSize*Math.sqrt(3);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
			
			//numRandomBoxes = Math.min(randomMats.length, numRandomBoxes);	//todo figure out how to draw part of array of boxes. also for "singleBuffer" version
			
			prepBuffersForDrawing(cubeBuffers, activeShaderProgram);
			
			var matrixBuffers = randBoxBuffers.randMatrixBuffers;	//todo neater selection code (array of terrain types?) TODO select mats array for other drawing types (eg indivVsMatmult)
			if (worldInfo.duocylinderModel == 'procTerrain') {matrixBuffers = randBoxBuffers.procTerrainMatrixBuffers;}
			if (worldInfo.duocylinderModel == 'voxTerrain') {matrixBuffers = randBoxBuffers.voxTerrainMatrixBuffers;}
			
			/*
			var attrIdx = activeShaderProgram.attributes.uMMatrix;
			
			window.attrIdx = attrIdx;
			
			gl.enableVertexAttribArray(attrIdx);	//duplicates some work currently in prepBuffersForDrawing
			gl.enableVertexAttribArray(attrIdx+1);
			gl.enableVertexAttribArray(attrIdx+2);
			gl.enableVertexAttribArray(attrIdx+3);
			*/
			gl.uniformMatrix4fv(activeShaderProgram.uniforms.uVMatrix, false, invertedWorldCameraDuocylinderFrame);
			
			//gl.bindBuffer(gl.ARRAY_BUFFER, randBoxBuffers.mats);
			//gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix, randBoxBuffers.mats.itemSize, gl.FLOAT, false, 0, 0);	//can't send a matrix all at once
		//	gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix, 4, gl.FLOAT, false, 12*4, 0);	//https://community.khronos.org/t/how-to-specify-a-matrix-vertex-attribute/54102/3
		//	gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix+1, 4, gl.FLOAT, false, 12*4, 4*4);	
		//	gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix+2, 4, gl.FLOAT, false, 12*4, 8*4);
		//	gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix+3, 4, gl.FLOAT, false, 12*4, 12*4);
			/*
			gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix, 4, gl.FLOAT, false, 12, 0);	//https://community.khronos.org/t/how-to-specify-a-matrix-vertex-attribute/54102/3
			gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix+1, 4, gl.FLOAT, false, 12, 4);	
			gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix+2, 4, gl.FLOAT, false, 12, 8);
			gl.vertexAttribPointer(activeShaderProgram.attributes.uMMatrix+3, 4, gl.FLOAT, false, 12, 12);
			*/
			/*
			angle_ext.vertexAttribDivisorANGLE(attrIdx, 1);
			angle_ext.vertexAttribDivisorANGLE(attrIdx+1, 1);
			angle_ext.vertexAttribDivisorANGLE(attrIdx+2, 1);
			angle_ext.vertexAttribDivisorANGLE(attrIdx+3, 1);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.a);
			gl.vertexAttribPointer(attrIdx, 4, gl.FLOAT, false, 0, 0);	//https://community.khronos.org/t/how-to-specify-a-matrix-vertex-attribute/54102/3
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.b);
			gl.vertexAttribPointer(attrIdx+1, 4, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.c);
			gl.vertexAttribPointer(attrIdx+2, 4, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.d);
			gl.vertexAttribPointer(attrIdx+3, 4, gl.FLOAT, false, 0, 0);
			*/

			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixA, 1);
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixB, 1);
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixC, 1);
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixD, 1)
			
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.a);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixA, 4, gl.FLOAT, false, 0, 0);	//https://community.khronos.org/t/how-to-specify-a-matrix-vertex-attribute/54102/3
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.b);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixB, 4, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.c);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixC, 4, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.d);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixD, 4, gl.FLOAT, false, 0, 0);
			
			angle_ext.drawElementsInstancedANGLE(gl.TRIANGLES, cubeBuffers.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, numRandomBoxes);
										//DO NOT SET THIS HIGH ON CHROME! works great on firefox, think tanks chrome because due to whatever bug using the right matrices, huge overdraw
			
			//angle_ext.drawElementsInstancedANGLE(gl.TRIANGLES, cubeBuffers.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, 100);	//very low count - to avoid tanking framerate in chrome (bug in extension?)
					//TODO is consecutive attribute pointers for a matrix not guaranteed? TODO with bodging a matrix together from vectors in vshader.
			
			//switch off again??
			/*
			angle_ext.vertexAttribDivisorANGLE(attrIdx, 0);
			angle_ext.vertexAttribDivisorANGLE(attrIdx+1, 0);
			angle_ext.vertexAttribDivisorANGLE(attrIdx+2, 0);
			angle_ext.vertexAttribDivisorANGLE(attrIdx+3, 0);
			*/
			
			//this appears to be unnecessary - maybe only relevant when drawing using angle ext.
			/*
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixA, 0);
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixB, 0);
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixC, 0);
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aMMatrixD, 0);
			*/
			
			zeroAttributeDivisors(activeShaderProgram);
		}
	}
	
	if (guiParams['random boxes'].drawType == 'instanced speckles'){	// (not really boxes)
		//draw instanced billboard quads using instanced rendering
		//shader setup is simple and different to normal, so forgo shaderSetup fun, just do here. no lights, fog at this time. (light bit compicated - for simulated diffuse spheres, perceived brightness depends on both viewing angle and light...
		activeShaderProgram = shaderPrograms.billboardQuads;
		gl.useProgram(activeShaderProgram);
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);
		if (activeShaderProgram.uniforms.uDropLightPos){
			gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
		}
		
		//cut down version of prepBuffersForDrawing
		enableDisableAttributes(activeShaderProgram);
		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffers2D.vertexPositionBuffer);
		gl.vertexAttribPointer(activeShaderProgram.attributes.aVertexPosition, quadBuffers2D.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadBuffers2D.vertexIndexBuffer);
		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uPMatrix, false, pMatrix);
		
		mat4.set(invertedWorldCameraDuocylinderFrame, mvMatrix);
		//normally in drawObjectFromPreppedBuffers
		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uMVMatrix, false, mvMatrix);
		
		var expParticleBuffers = explosionParticles.getBuffers();
		explosionParticles.getRangesToDraw(frameTime).forEach(elem=>{
			//	console.log(elem);
			var offs = elem.start * 16;
			angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aVertexCentrePosition, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, expParticleBuffers.posns);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aVertexCentrePosition, 4, gl.SHORT, true, 16, offs);
			if (activeShaderProgram.attributes.aVertexCentreDirection){
				angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aVertexCentreDirection, 1);
				gl.vertexAttribPointer(activeShaderProgram.attributes.aVertexCentreDirection, 4, gl.SHORT, true, 16, offs+8);
			}
			if (activeShaderProgram.attributes.aColor){
				angle_ext.vertexAttribDivisorANGLE(activeShaderProgram.attributes.aColor, 1);
				gl.bindBuffer(gl.ARRAY_BUFFER, expParticleBuffers.colrs);
				gl.vertexAttribPointer(activeShaderProgram.attributes.aColor, 4, gl.UNSIGNED_BYTE, true, 4, offs/4);
			}
			if (activeShaderProgram.uniforms.uTime){		
				gl.uniform1f(activeShaderProgram.uniforms.uTime, frameTime);			
			}
			angle_ext.drawElementsInstancedANGLE(gl.TRIANGLES, quadBuffers2D.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, elem.number);
		});
		
		//seems like maybe has effect outside of drawElementsInstancedANGLE calls. to be safe,
		zeroAttributeDivisors(activeShaderProgram);
	}
	
	function zeroAttributeDivisors(shaderProg){
			//seems like these carry over between invokations of drawElementsInstancedANGLE, loading different shaders. TODO proper method to only change when required, but for now, set all to zero before setting those wanted to 1
		Object.keys(shaderProg.attributes).forEach(function(item, index){
			angle_ext.vertexAttribDivisorANGLE(gl.getAttribLocation(shaderProg, item),0);
		});
		
	}
	
	//switch back to previous shader (may already be using this depending on which drawType used for 'random boxes'
	shaderSetup(guiParams.debug.nmapUseShader2 ? (guiParams.display.useSpecular ? shaderPrograms.texmapPerPixelDiscardNormalmapPhong[ guiParams.display.atmosShader ] : shaderPrograms.texmapPerPixelDiscardNormalmap[ guiParams.display.atmosShader ]) : shaderPrograms.texmapPerPixelDiscardNormalmapV1[ guiParams.display.atmosShader ], nmapTexture);
	
	
	gl.uniform3f(activeShaderProgram.uniforms.uModelScale, duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale);
	prepBuffersForDrawing(cubeBuffers, activeShaderProgram);
	
	//draw boxes on duocylinder surface. 
	if (guiParams.drawShapes.towers){	//note currently toggles drawing for all boxes using duocylinder positioning method, including demo axis objects
		for (var bb of duocylinderBoxInfo.towerblocks.list){
			drawPreppedBufferOnDuocylinderForBoxData(bb, activeShaderProgram, cubeBuffers, invertedWorldCameraDuocylinderFrame);
		}
	}
	
	//switch to non-normal map version to draw some objects.
	activeShaderProgram=shaderProgramTexmap;
	shaderSetup(activeShaderProgram, texture);
	gl.uniform3f(activeShaderProgram.uniforms.uModelScale, duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale);
	prepBuffersForDrawing(cubeBuffers, activeShaderProgram);
	
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
	
	//switch to non-normalmap shader
//	shaderSetup(shaderProgramTexmap, texture);
	
	var playerPos = playerCamera.slice(12);			//copied from elsewhere
		
	if (worldInfo.duocylinderModel == 'procTerrain'){
		terrainCollisionTestBoxPos = terrainGetHeightFor4VecPos(playerPos);		//TODO in position update (not rendering)
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.001,0.001,0.001);
		drawPreppedBufferOnDuocylinder(terrainCollisionTestBoxPos.b,terrainCollisionTestBoxPos.a,terrainCollisionTestBoxPos.h *Math.sqrt(2), [1.0, 0.4, 1.0, 1.0], cubeBuffers);
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
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.4,0.01,0.01);
			drawPreppedBufferOnDuocylinder(shiftX-currentSeaHeight[0]*tau,-currentSeaHeight[1]*tau,currentSeaHeight[2]*tau, [1.0, 0.4, 1.0, 1.0], cubeBuffers);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.01,0.1,0.1);
			drawPreppedBufferOnDuocylinder(shiftX-currentSeaHeight[0]*tau,-currentSeaHeight[1]*tau,currentSeaHeight[2]*tau, [1.0, 0.4, 1.0, 1.0], cubeBuffers);
			
			//reference static buoy
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.4,0.01,0.01);
			drawPreppedBufferOnDuocylinder(shiftX,0,0, [0.0, 0.4, 1.0, 1.0], cubeBuffers);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.01,0.1,0.1);
			drawPreppedBufferOnDuocylinder(shiftX,0,0, [0.0, 0.4, 1.0, 1.0], cubeBuffers);
		}
		if (guiParams.debug.closestPoint){
			//red box on sea under player
			var testBuoyPos = seaHeightFor4VecPos(playerPos, seaTime);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.001,0.01,0.01);
			drawPreppedBufferOnDuocylinder(testBuoyPos.b,testBuoyPos.a,testBuoyPos.h, [1, 0, 0, 1], cubeBuffers);
		}
	}
	
	if (guiParams.debug.closestPoint){	//draw collision test object
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, collisionTestObjMat);
		mat4.set(collisionTestObjMat, mMatrix);
		var testObjScale=0.001;
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.cyan);
		drawTriAxisCross(testObjScale*20);
		
		//draw object centred on object colliding with to see if anything happening!
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, collisionTestObj2Mat);
		mat4.set(collisionTestObj2Mat, mMatrix);
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.magenta);
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 2*testObjScale,2*testObjScale,2*testObjScale);
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
		
		//procTerrain
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix, procTerrainNearestPointTestMat);
		mat4.set(procTerrainNearestPointTestMat, mMatrix);
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
	gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);

	if (guiParams["draw 8-cell"]){
		drawArrayOfModels(
			cellMatData.d8,
			(guiParams.display.culling ? Math.sqrt(3): false),
			(guiParams["subdiv frames"] ? cubeFrameSubdivBuffers: cubeFrameBuffers)
		);	
	}
	
	
	if (guiParams["draw 16-cell"]){
		var cellScale = 4/Math.sqrt(6);		//in the model, vertices are 0.75*sqrt(2) from the centre, and want to scale to tan(PI/3)=sqrt(3)		
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, cellScale,cellScale,cellScale);
		
		drawArrayOfModels(
			cellMatData.d16,
			(guiParams.display.culling ? 1.73: false),
			(guiParams["subdiv frames"]? tetraFrameSubdivBuffers: tetraFrameBuffers)
		);
	}
	
	
	if (guiParams["draw 24-cell"]){
		modelScale = 1.0;
		modelScale*=guiParams["24-cell scale"];
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
	
		drawArrayOfModels(
			cellMatData.d24.cells,
			(guiParams.display.culling ? 1: false),
			(guiParams["subdiv frames"] ? octoFrameSubdivBuffers : octoFrameBuffers)
		);	
	}
	
	if (guiParams["draw 5-cell"]){
		var moveDist = Math.acos(-0.25);
		modelScale = 2*moveDist;		
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		
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
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, dodecaScale,dodecaScale,dodecaScale);
		drawArrayOfModels(
			cellMatData.d120[sortId],
			(guiParams.display.culling ? cullVal: false),
			dodecaFrameBuffers
		);
	}
	
	if (guiParams["draw 600-cell"]){		
		var myscale=0.386;	//todo use correct scale
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, myscale,myscale,myscale);
		
		drawArrayOfModels(
			cellMatData.d600[sortId],
			(guiParams.display.culling ? 0.355: false),
			(guiParams["subdiv frames"]? tetraFrameSubdivBuffers: tetraFrameBuffers)
		);
	}
	
	//todo this should take buffers, shaders and call prepBuffersForDrawing, drawObjectFromPreppedBuffers
	function drawArrayOfModels(cellMats, cullRad, buffers, shaderProg){
		shaderProg = shaderProg || shaderProgramTexmap;
		prepBuffersForDrawing(buffers, shaderProg);
		numDrawn = 0;
		if (!cullRad){
			drawArrayForFunc(function(){
				drawObjectFromPreppedBuffers(buffers, shaderProg);
				numDrawn++;
				});
		}else{
			drawArrayForFunc(function(){
				if (frustumCull(mvMatrix,cullRad)){
					drawObjectFromPreppedBuffers(buffers, shaderProg);
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
	
	activeShaderProgram = guiParams.display.perPixelLighting? (guiParams.display.useSpecular ? shaderPrograms.texmap4VecPerPixelDiscardPhongVcolor[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscardVcolor[ guiParams.display.atmosShader ]): shaderPrograms.texmap4Vec[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "not normal map");

	if (guiParams["random boxes"].drawType == 'singleBuffer'){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.randBoxes);
		drawTennisBall(randBoxBuffers, activeShaderProgram);	//todo draw subset of buffer according to ui controlled number
	}
	
	if (guiParams.drawShapes.singleBufferStonehenge){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.gray);
		drawTennisBall(stonehengeBoxBuffers, activeShaderProgram);
	}
	
	activeShaderProgram = guiParams.display.useSpecular ? shaderPrograms.texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscardNormalmapVcolorAndDiffuse[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "normal map");
	
	if (guiParams.drawShapes.singleBufferTowers){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);	//uColor is redundant here since have vertex colors. TODO lose it?
		drawTennisBall(towerBoxBuffers, activeShaderProgram);
	}
	
	activeShaderProgram = guiParams.display.useSpecular ? shaderPrograms.texmap4VecPerPixelDiscardNormalmapPhongAndDiffuse[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscardNormalmapAndDiffuse[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "normal map");
	
	if (guiParams.drawShapes.singleBufferRoads){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.darkGray);
		drawTennisBall(roadBoxBuffers, activeShaderProgram);
	}
	/*
	activeShaderProgram = shaderPrograms.texmap4Vec[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "log3");
	*/
	if (worldInfo.duocylinderModel!='none'){
		drawDuocylinderObject(wSettings, duocylinderObjects[worldInfo.duocylinderModel]);
	}
			
	//if (worldInfo.seaActive && isCubemapView){	//draw this in drawWorldScene2 for standard view (using depth image from drawWorldScene) TODO move there for cubemap view also.
	//	drawDuocylinderObject(wSettings, duocylinderObjects['sea'], guiParams.seaLevel, seaTime);
	//}
	
	//draw objects without textures
	activeShaderProgram = shaderProgramColored;
	gl.useProgram(activeShaderProgram);
	
	if (activeShaderProgram.uniforms.uVertexMove){
		gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, guiParams.normalMove);
	}
	
	gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emmision
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	if (activeShaderProgram.uniforms.uReflectorDiffColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);

	//TODO this only 
	//if (activeShaderProgram.uniforms.uReflectorPos){
		gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
		if (activeShaderProgram.uniforms.uReflectorPosVShaderCopy){gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPosVShaderCopy, reflectorPosTransformed);}
		gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	//}
	
	if (guiParams.drawShapes.teapot){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.teapot);	//BLUE
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0.1,0.3);	//some emission

		modelScale = guiParams.drawShapes["teapot scale"];
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,teapotMatrix);		
		drawObjectFromBuffers(teapotBuffers, shaderProgramColored);
	}
	
	if (guiParams.drawShapes.hyperboloid){
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.gray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emission
		modelScale = 1.0;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
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
	
	if (sshipDrawMatrix){
		drawFunc(sshipDrawMatrix);
	}
	
	function drawSpaceship(matrix){
		var rotatedMatrix = drawSsshipRotatedMat;	//avoid repeatedly looking up global scope variables
		var inverseSshipMat = drawSsshipInverseSshipMat; //""

		//temp switch back to texmap shader (assume have already set general uniforms for this)	-	TODO put uniforms in!!
		//activeShaderProgram = shaderProgramTexmap;
		activeShaderProgram = shaderPrograms.texmapPerPixelDiscardAtmosGradLight[guiParams.display.atmosShader];
		gl.useProgram(activeShaderProgram);
		
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
		if (activeShaderProgram.uniforms.uReflectorPosVShaderCopy){gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPosVShaderCopy, reflectorPosTransformed);}
		gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
		
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
		gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
		
		if (activeShaderProgram.uniforms.thrustAmount){
			gl.uniform1f(activeShaderProgram.uniforms.thrustAmount, currentThrustInput[2]>0 ? 1:0);
		}
		
		mat4.set(matrix, rotatedMatrix);	//because using rotated model data for sship model
		xyzrotate4mat(rotatedMatrix, [-Math.PI/2,0,0]); 
		
		modelScale=25*sshipModelScale;	//TODO use object that doesn't require scaling
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.gray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		
		//special uniform for this shader
		gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame, -rotatedMatrix[3],-rotatedMatrix[7],-rotatedMatrix[11]);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		
		mat4.multiply(mvMatrix,rotatedMatrix);
		mat4.set(rotatedMatrix, mMatrix);
		drawObjectFromBuffers(sshipBuffers, activeShaderProgram);
		
		
		//draw guns
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,matrix);
		mat4.set(matrix, mMatrix);
		
		var gunScale = 2.3*sshipModelScale;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, gunScale,gunScale,gunScale);

		bind2dTextureIfRequired(cannonTexture);	
		prepBuffersForDrawing(gunBuffers, activeShaderProgram);
		
		mat4.set(sshipMatrixNoInterp,inverseSshipMat);	//todo store inverseSshipMat*gunMatrix ? 
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
			
			
			xyzrotate4mat(mvMatrix, [0,-Math.PI/2,0]);	//bodge to account for saving gun in wrong orientation (pointing -x in blender)
														//TODO just save in correct orientation!

			mat4.set(matrix, mMatrix);	//todo make this more efficient by combining with above
			mat4.multiply(mMatrix, inverseSshipMat);
			mat4.multiply(mMatrix, gunMatrix);
			xyzrotate4mat(mMatrix, [0,-Math.PI/2,0]);	////bodge to account for saving gun in wrong orientation (pointing -x in blender)
			
			gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame, -mMatrix[3],-mMatrix[7],-mMatrix[11]);
			gl.uniform1f(activeShaderProgram.uniforms.thrustAmount, 0);	//no thruster light used here currently

			drawObjectFromPreppedBuffers(gunBuffers, activeShaderProgram);
		}
		
	}
	
	
	function drawBall(matrix){
		//draw "light" object
		var sphereRad = settings.playerBallRad;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, sphereRad,sphereRad,sphereRad);
		var voxColliding = (voxCollisionCentralLevel>0) || (distBetween4mats(playerCamera, closestPointTestMat) < sphereRad); 
						//sphere centre inside voxel volume OR sphere intersects with voxel zero surface.
			//note could just have a simple signed distance, of vox field value divided by magnitide of gradient. however, current gradient is in abc space. TODO make work with this clunky version, then try abc-> player space gradient conversion, check results are consistent.
		
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, voxColliding ? colorArrs.red: colorArrs.white);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,	matrix);
		if (frustumCull(mvMatrix,sphereRad)){
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
				if (frustumCull(mvMatrix,targetRad)){	//normally use +ve radius
											//-ve to make disappear when not entirely inside view frustum (for testing)
					gl.uniform3f(activeShaderProgram.uniforms.uModelScale, targetRad,targetRad,targetRad);
					gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.target);
					var emitColor = Math.sin(frameTime*0.01);
					//emitColor*=emitColor
					gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, emitColor, emitColor, emitColor/2);	//YELLOW
					//gl.uniform3fv(activeShaderProgram.uniforms.uEmitColor, [0.5, 0.5, 0.5]);
					drawObjectFromBuffers(sphereBuffers, activeShaderProgram);
					//drawObjectFromBuffers(icoballBuffers, activeShaderProgram);
				}
				break;
			case "box":
				var boxRad = targetRad*Math.sqrt(3);
				if (frustumCull(mvMatrix,boxRad)){
					var savedActiveProg = activeShaderProgram;	//todo push things onto a to draw list, 
																//minimise shader switching
					activeShaderProgram = shaderProgramTexmap;
					gl.useProgram(activeShaderProgram);
					gl.uniform3f(activeShaderProgram.uniforms.uModelScale, targetRad,targetRad,targetRad);
					gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);
					drawObjectFromBuffers(cubeBuffers, activeShaderProgram);
					activeShaderProgram = savedActiveProg;
					gl.useProgram(activeShaderProgram);
				}
				break;
		}
	}

	//DRAW PORTAL/REFLECTOR
	if (guiParams.reflector.draw && !isCubemapView && frustumCull(invertedWorldCamera,reflectorInfo.rad)){
		var savedActiveProg = activeShaderProgram;
		
		//TODO have some variable for activeReflectorShader, avoid switch.
		switch(guiParams.reflector.mappingType){
			case 'projection':
			activeShaderProgram = shaderPrograms.cubemap[ guiParams.display.atmosShader ];
			break;
			case 'vertex projection':
			activeShaderProgram = shaderPrograms.vertprojCubemap[ guiParams.display.atmosShader ];
			break;
			case 'screen space':
			activeShaderProgram = shaderPrograms.specialCubemap[ guiParams.display.atmosShader ];
			break;
			case 'vertproj mix':
			activeShaderProgram = shaderPrograms.vertprojMix[ guiParams.display.atmosShader ];
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
			gl.uniform4fv(activeShaderProgram.uniforms.uCameraWorldPos, worldCamera.slice(12));
		}
		if (activeShaderProgram.uniforms.uPortalCameraPos){
			gl.uniform4f(activeShaderProgram.uniforms.uPortalCameraPos, worldCamera[3],worldCamera[7],worldCamera[11],worldCamera[15]);
		}
		
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.identity(mMatrix);
		
		if (activeShaderProgram.uniforms.uFNumber){
			//todo keep this around. also used in fisheye shader.
			var fy = Math.tan(guiParams.display.cameraFov*Math.PI/360);	//todo pull from camera matrix?
			var fx = fy*gl.viewportWidth/gl.viewportHeight;		//could just pass in one of these, since know uInvSize
			gl.uniform2f(activeShaderProgram.uniforms.uFNumber, fx, fy);
			gl.uniform3fv(activeShaderProgram.uniforms.uCentrePosScaledFSCopy, reflectorInfo.centreTanAngleVectorScaled	);
			
			if (activeShaderProgram.uniforms.uPortalRad){	//specific stuff to special
				gl.uniformMatrix4fv(activeShaderProgram.uniforms.uMVMatrixFSCopy, false, mvMatrix);
				gl.uniform1f(activeShaderProgram.uniforms.uPortalRad, reflectorInfo.rad);
			}
			
			//move matrix through portal for close rendering. 
			var matrixToPortal = mat4.create(mvMatrix);	//should be inverted matrix or regular?
			moveMatrixThruPortal(matrixToPortal, reflectorInfo.rad, 1);
			//moveMatrixThruPortal probably doesn't work that great unless almost at portal. do calculate more proper "reflection" in calcReflectionInfo , where calculate position to put cubemap camera. should do something like that here. as approx bodge, make the position component of this matrix match position of cubemap camera. this will likely make matrix non orthogonal

		if (guiParams.reflector.test1){	//appears to do ~nothing
			var matToCopyFrom = reflectorInfo.shaderMatrix;
			matrixToPortal[3] = matToCopyFrom[12];
			matrixToPortal[7] = matToCopyFrom[13];
			matrixToPortal[11] = matToCopyFrom[14];
			matrixToPortal[15] = matToCopyFrom[15];
		}

			//think this transformation should be something like the transformation between the portaled matrix (cubemap camera matrix?) and where camera would be if portaled through matrix.
			mat4.multiply(matrixToPortal, reflectorInfo.shaderMatrix);
				//result is still a bit glitchy. suspect because calculation of matrixToPortal isn't quite right - moves by 2*portal radius , which is fine if close to portal, but really should move by a little less than this (see calculation of portal cubemap camera position.)
		
		//for debugging
			mytestMat111 = matrixToPortal;
			
			gl.uniformMatrix4fv(activeShaderProgram.uniforms.uPortaledMatrix, false, matrixToPortal);
		}

		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, reflectorInfo.rad,reflectorInfo.rad, reflectorInfo.rad);
	
		gl.uniform1f(activeShaderProgram.uniforms.uPolarity, reflectorInfo.polarity);
		
			
		if(['vertex projection','screen space'].includes(guiParams.reflector.mappingType) ){
			gl.uniform3fv(activeShaderProgram.uniforms.uCentrePosScaled, reflectorInfo.centreTanAngleVectorScaled);
		}
		drawObjectFromBuffers(sphereBuffersHiRes, activeShaderProgram, true);
		
		activeShaderProgram = savedActiveProg;
		gl.useProgram(activeShaderProgram);
	}
	
	
//	testRayBallCollision();
	function testRayBallCollision(){
		//will use code like this to find where camera ray intersects portal for "screen space shader" drawing.
		//may also be useful for fast collisions etc 
		//if have 2 4vectors, starting position "A" = [ax,ay,az,aw], and pointing direction (quarter way around world) "B" [bx,by,bz,dw], think that:
		// for portal at position w=1, closest approach will occur at:
		// ( 1/sqrt(aw*aw + bw*bw) )*(aw*A + bw*B)
		// and a (normal) vector perpendicular to this is 
		// ( 1/sqrt(aw*aw + bw*bw) )*(aw*B - bw*A)
		//hope that latter is in a consistent direction, and can backtrack from closest approach 
		
		activeShaderProgram=shaderProgramTexmap;
		shaderSetup(activeShaderProgram, texture);
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale);
		prepBuffersForDrawing(cubeBuffers, activeShaderProgram);
		
		//draw something at player position
		gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.magenta);
		var posA = sshipMatrix.slice(12);
		//drawTriAxisCrossForMatrix(sshipMatrix);
	//	drawTriAxisCrossForPosition(posA);

		//move some test object to quarter way around the world from player
		var mytmpmat = mat4.create(sshipMatrix);
		xyzmove4mat(mytmpmat, [0,0,Math.PI/2]);
		var posB = mytmpmat.slice(12);
		//drawTriAxisCrossForPosition(posB);

		//calculate closest approach vector and represent by an object
		var closeApproach = [];
		var equatorVec = [];
		var intermediateVec = [];
		var movedFwdAng = -0.1;
		
		var maxwsq = posA[3]*posA[3] + posB[3]*posB[3];
		
		var maxw = Math.sqrt(maxwsq);	//TODO handle 0 (or avoid if maxwsq< crit value)
		for (var cc=0;cc<4;cc++){
			closeApproach[cc]=(1/maxw)*(posA[cc]*posA[3]+posB[cc]*posB[3]);
			equatorVec[cc]=(1/maxw)*(posB[cc]*posA[3]-posA[cc]*posB[3]);
			intermediateVec[cc]=closeApproach[cc]*Math.cos(movedFwdAng) + equatorVec[cc]*Math.sin(movedFwdAng);
		}
		//drawTriAxisCrossForPosition(closeApproach);
		//drawTriAxisCrossForPosition(intermediateVec);
		//drawTriAxisCrossForPosition(equatorVec);

		
		//determine whether this constitutes a collision
		var critwsq = 1.0/(1.0+reflectorInfo.rad*reflectorInfo.rad);
		var critw = Math.sqrt(critwsq);
		if (maxwsq>critwsq){
			//project onto w=1
			//correction is length should move along this projection.
			var projectedradiussq = (1-maxwsq)/maxwsq;
			var correction = Math.sqrt( reflectorInfo.rad*reflectorInfo.rad - projectedradiussq );
			
			//console.log("colliding");
			var collisionPoint = [];
			for (var cc=0;cc<4;cc++){
				collisionPoint[cc] = closeApproach[cc]*(1/maxw) - equatorVec[cc]*correction;
					//^^ that's the collision point in projected space. since this is now a projected point from surface of sphere, can project back by multiplying by critw
				collisionPoint[cc]*=critw;	//(this part should not be necessary in shader version)
			}
			
			drawTriAxisCrossForPosition(collisionPoint);
		}
		
	}
	

	return wSettings;
}

function drawWorldScene2(frameTime, wSettings, depthMap){	//TODO drawing using rgba, depth buffer images from previous rendering
	//({colorsSwitch,worldInfo, localVecFogColor, localVecReflectorColor, localVecReflectorDiffColor, reflectorPosTransformed, cosReflector, dropLightPos} = wSettings);
	
	({worldInfo, sshipDrawMatrix} = wSettings);
	

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
	mat4.set(worldCamera, invertedWorldCamera);
	mat4.transpose(invertedWorldCamera);
	//equivalent for frame of duocylinder, to reduce complexity of drawing, collision checks etc
	mat4.set(invertedWorldCamera, invertedWorldCameraDuocylinderFrame);
	rotate4mat(invertedWorldCameraDuocylinderFrame, 0, 1, duocylinderSpin);
	
	//general stuff used for all 4vec vertex format objects (currently)	//note this is duplicated from drawWorldScene
	mat4.set(invertedWorldCamera, mvMatrix);
	rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
	mat4.identity(mMatrix);							//better to set M, V matrices and leave MV for shader?
	rotate4mat(mMatrix, 0, 1, duocylinderSpin);
	
	var seaTime = 0.00005*(frameTime % 20000 ); //20s loop	//note this is duplicated from drawWorldScene
	if (worldInfo.seaActive){
		drawDuocylinderObject(wSettings, duocylinderObjects['sea'], guiParams.seaLevel, seaTime, depthMap);
	}


	//draw bullets
	var transpShadProg = shaderPrograms.coloredPerPixelTransparentDiscard;
	//var transpShadProg = shaderPrograms.coloredPerPixelDiscard;
	shaderSetup(transpShadProg);
	function shaderSetup(shader, tex){
		performShaderSetup(shader, wSettings, tex);
	}
	
	prepBuffersForDrawing(sphereBuffers, transpShadProg);
	targetRad=sshipModelScale*150;
	gl.uniform3f(transpShadProg.uniforms.uModelScale, targetRad/50,targetRad/50,targetRad);	//long streaks
	gl.uniform3f(transpShadProg.uniforms.uEmitColor, 1.0, 1.0, 0.5);	//YELLOW
	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA , gl.ONE);	
	gl.depthMask(false);
	
	
	for (var b of bullets){
		if (b.active && b.world == colorsSwitch){
			var bulletMatrix=b.matrix;
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,bulletMatrix);
			if (frustumCull(mvMatrix,targetRad)){	
				drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			}
		}
	}
	
	
	
	if (sshipDrawMatrix){
		drawThrusters(sshipDrawMatrix);
	}
	
	function drawThrusters(matrix){
			//this is duplicated from elsewhere. TODO generalise/reuse
		var inverseSshipMat = mat4.create(sshipMatrix);
		mat4.transpose(inverseSshipMat);
		
		var thrustrad = 4;
		var thrustlong = 2;

		var posnOffset = new Array(3);
		
		//gl.uniform4fv(transpShadProg.uniforms.uColor, colorArrs.blue);
			//draw "thrusters". TODO make look better, brightness according to analog input, "playerlight" to match (direction+magnitude)
			//should be a custom 3d model or shader. engine nozzles can be solid, non transparent, with colour that changes with thrust. combine with transparent exhaust effect
			//current implementation is inefficient with lots of overdraw, gl calls.
		var separation=1;	//distance between thrust discs (squashed spheres)
		var opacStep=0.08;
		//var thrustTaper= -0.00003;
		var thrustTaper= 0.1;
		var scalex=scaley=scalez=0;
		if (currentThrustInput[2]>0){					//rearward thrusters
			scalez=thrustlong*sshipModelScale;
			for (var oo=-38.5, opac=1, rr=thrustrad;opac>0;opac-=opacStep,oo-=separation,rr-=thrustTaper){
				scalex=scaley=rr*sshipModelScale;
				gl.uniform3f(transpShadProg.uniforms.uModelScale, scalex,scaley,scalez);
				gl.uniform3f(transpShadProg.uniforms.uEmitColor, 0.05*opac,0.15*opac,0.4*opac);
				drawLandingBall(28.5,18,oo);	//	left ,down	,fwd
				drawLandingBall(28.5,-18,oo);
				drawLandingBall(-28.5,18,oo);
				drawLandingBall(-28.5,-18,oo);
			}
		}
		if (currentThrustInput[2]<0){				//forward thrusters
			scalez=thrustlong*sshipModelScale;
			for (var oo=18, opac=1, rr=thrustrad;opac>0;opac-=opacStep,oo+=separation,rr-=thrustTaper){
				scalex=scaley=rr*sshipModelScale;
				gl.uniform3f(transpShadProg.uniforms.uModelScale, scalex,scaley,scalez);
				gl.uniform3f(transpShadProg.uniforms.uEmitColor, 0.05*opac,0.15*opac,0.4*opac);
				drawLandingBall(28.5,18,oo);
				drawLandingBall(28.5,-18,oo);		
				drawLandingBall(-28.5,18,oo);		
				drawLandingBall(-28.5,-18,oo);
			}
		}
		if (currentThrustInput[0]<0){				//left
			scalex=thrustlong*sshipModelScale;
			for (var oo=35, opac=1, rr=thrustrad;opac>0;opac-=opacStep,oo+=separation,rr-=thrustTaper){
				scaley=scalez=rr*sshipModelScale;
				gl.uniform3f(transpShadProg.uniforms.uModelScale, scalex,scaley,scalez);
				gl.uniform3f(transpShadProg.uniforms.uEmitColor, 0.05*opac,0.15*opac,0.4*opac);
				drawLandingBall(oo,17.5,12.5);
				drawLandingBall(oo,-17.5,12.5);
				drawLandingBall(oo,17.5,-32.5);
				drawLandingBall(oo,-17.5,-32.5);
			}
		}
		if (currentThrustInput[0]>0){				//right
			scalex=thrustlong*sshipModelScale;
			for (var oo=-35, opac=1, rr=thrustrad;opac>0;opac-=opacStep,oo-=separation,rr-=thrustTaper){
				scaley=scalez=rr*sshipModelScale;
				gl.uniform3f(transpShadProg.uniforms.uModelScale, scalex,scaley,scalez);
				gl.uniform3f(transpShadProg.uniforms.uEmitColor, 0.05*opac,0.15*opac,0.4*opac);
				drawLandingBall(oo,17.5,12.5);
				drawLandingBall(oo,-17.5,12.5);
				drawLandingBall(oo,17.5,-32.5);
				drawLandingBall(oo,-17.5,-32.5);
			}
		}
		if (currentThrustInput[1]>0){				//top
			scaley=thrustlong*sshipModelScale;
			for (var oo=-22.5, opac=1, rr=thrustrad;opac>0;opac-=opacStep,oo-=separation,rr-=thrustTaper){
				scalex=scalez=rr*sshipModelScale;
				gl.uniform3f(transpShadProg.uniforms.uModelScale, scalex,scaley,scalez);
				gl.uniform3f(transpShadProg.uniforms.uEmitColor, 0.05*opac,0.15*opac,0.4*opac);
				drawLandingBall(30,oo,12.5);
				drawLandingBall(-30,oo,12.5);
				drawLandingBall(30,oo,-32.5);
				drawLandingBall(-30,oo,-32.5);
			}
		}
		if (currentThrustInput[1]<0){				//bottom
			scaley=thrustlong*sshipModelScale;
			for (var oo=22.5, opac=1, rr=thrustrad;opac>0;opac-=opacStep,oo+=separation,rr-=thrustTaper){
				scalex=scalez=rr*sshipModelScale;
				gl.uniform3f(transpShadProg.uniforms.uModelScale, scalex,scaley,scalez);
				gl.uniform3f(transpShadProg.uniforms.uEmitColor, 0.05*opac,0.15*opac,0.4*opac);
				drawLandingBall(30,oo,12.5);
				drawLandingBall(-30,oo,12.5);
				drawLandingBall(30,oo,-32.5);
				drawLandingBall(-30,oo,-32.5);
			}
		}
		
		function drawLandingBall(posx,posy,posz){	//this is duplicated from elsewhere, but should be changed
			mat4.set(sshipMatrix, lgMat);

			posnOffset[0]=sshipModelScale*posx;
			posnOffset[1]=sshipModelScale*posy;
			posnOffset[2]=sshipModelScale*posz;
			
			xyzmove4mat(lgMat, posnOffset);
			
			//mat4.set(invertedWorldCamera, mvMatrix);	//no shift version
			//mat4.multiply(mvMatrix, lgMat);
			
			//apply the shift hack as with guns.
			mat4.set(matrix, mMatrix);
			mat4.multiply(mMatrix, inverseSshipMat);
			mat4.multiply(mMatrix, lgMat);
			
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, mMatrix);

			drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
		}
	}
	
	
	
	
	
	
	
	
	
	var maxShockRadAng = 0.5;
	
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
			var radius = (120-singleExplosion.life)*singleExplosion.size;	// increased from 100 so has initial size
			//var radius = 0.01;
			var opac = 0.01*singleExplosion.life;
			
			if (frustumCull(mvMatrix,radius)){	
					//TODO check is draw order independent transparency
				gl.uniform3fv(transpShadProg.uniforms.uEmitColor, singleExplosion.color.map(function(val){return val*opac;}));
				gl.uniform3f(transpShadProg.uniforms.uModelScale, radius,radius,radius);
				drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			}
			
			
			//larger shockwave, should match sound
			var largeRadiusAng = radius * (100-singleExplosion.life)*2;	//note that speed of sound delay approximation currently used 4vec distance, not curve, so this will only match up for small distances. 5 is a guess that seems about right. TODO work out properly!
			if (largeRadiusAng<maxShockRadAng){
				var largeRadius = Math.tan(largeRadiusAng);
				if (frustumCull(mvMatrix,largeRadius)){	//todo larger max shock rad for larger singleExplosion.size
					var largeOpac = 0.1*(1-(largeRadiusAng/maxShockRadAng));	//linearly drop opacity as sphere expands (simple)
					gl.uniform3fv(transpShadProg.uniforms.uEmitColor, singleExplosion.color.map(function(val){return val*largeOpac;}));	//TODO neutral colour
					gl.uniform3f(transpShadProg.uniforms.uModelScale, largeRadius,largeRadius,largeRadius);
					drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
				}
			}
		}
	}
	
	
	//muzzle flash? 
	for (var gg in gunMatrices){
		//if (gg>0) continue;
		var mfRad = 0.005;
		var flashAmount = muzzleFlashAmounts[gg]
		gl.uniform3f(transpShadProg.uniforms.uEmitColor, flashAmount, flashAmount/2, flashAmount/4);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,gunMatrices[gg]);
		xyzmove4mat(mvMatrix,[0,0,0.0075]);

		for (var xx=0;xx<3;xx++){	//nested spheres
			gl.uniform3f(transpShadProg.uniforms.uModelScale, mfRad/5,mfRad/5,mfRad);
			drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			mfRad-=.0005;
		}
	}

	
	
	
	
	
	gl.depthMask(true);



	gl.disable(gl.BLEND);

}

var explosions ={};		//todo how to contain this? eg should constructor be eg explosions.construct()? what's good practice?
var Explosion=function(){
	var nextExplId = 0;
	return function(objcontainer, size, color, rotateWithDuocylinder, hasSound){
		this.matrix = matPool.create();
		mat4.set(objcontainer.matrix, this.matrix);
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
var frustumCull;
function generateCullFunc(pMat){
	var const1 = pMat[5];
	var const2 = pMat[0];
	var const3 = Math.sqrt(1+pMat[5]*pMat[5]);
	var const4 = Math.sqrt(1+pMat[0]*pMat[0]); 
	return function(mat, rad){	//return whether an sphere of radius rad, at a position determined by mat (ie with position [mat[12],mat[13],mat[14],mat[15]]) overlaps the view frustum.
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

var enableDisableAttributes = (function generateEnableDisableAttributesFunc(){
	var numEnabled = 0;
	
	return function(shaderProg){
		
		var numToBeEnabled = shaderProg.numActiveAttribs;
		if (numToBeEnabled>numEnabled){
			for (var ii=numEnabled;ii<numToBeEnabled;ii++){
				gl.enableVertexAttribArray(ii);
			}
		}
		if (numToBeEnabled<numEnabled){
			for (var ii=numToBeEnabled;ii<numEnabled;ii++){
				gl.disableVertexAttribArray(ii);
			}
		}
		numEnabled = numToBeEnabled;
	};
})();


function drawTennisBall(duocylinderObj, shader, depthMap){
	enableDisableAttributes(shader);

	gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexPositionBuffer);
    gl.vertexAttribPointer(shader.attributes.aVertexPosition, duocylinderObj.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	if (duocylinderObj.normalBuffer && shader.attributes.aVertexNormal){	//not used in duocylinder-sea
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.normalBuffer);
		gl.vertexAttribPointer(shader.attributes.aVertexNormal, duocylinderObj.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (duocylinderObj.vertexColorBuffer && shader.attributes.aVertexColor){
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexColorBuffer);
		gl.vertexAttribPointer(shader.attributes.aVertexColor, duocylinderObj.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		//return;	// test
	}
	if (duocylinderObj.vertexTextureCoordBuffer && shader.attributes.aTextureCoord){	//not used in duocylinder-sea
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
	
	if (duocylinderObj.vertexBinormalBuffer && shader.attributes.aVertexBinormal){
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexBinormalBuffer);
		gl.vertexAttribPointer(shader.attributes.aVertexBinormal, duocylinderObj.vertexBinormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (duocylinderObj.vertexTangentBuffer && shader.attributes.aVertexTangent){
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexTangentBuffer);
		gl.vertexAttribPointer(shader.attributes.aVertexTangent, duocylinderObj.vertexTangentBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, duocylinderObj.vertexIndexBuffer);
	
	bind2dTextureIfRequired(duocylinderObj.tex);
	gl.uniform1i(shader.uniforms.uSampler, 0);
	
	if (shader.uniforms.uSamplerDepthmap){
		bind2dTextureIfRequired(depthMap,gl.TEXTURE2);	//for depth aware duocylinder sea
		gl.uniform1i(shader.uniforms.uSamplerDepthmap, 2);
	}
	
	if (shader.uniforms.uSamplerB){
		bind2dTextureIfRequired(duocylinderObj.texB, gl.TEXTURE2);
		gl.uniform1i(shader.uniforms.uSamplerB, 2);
	}
	if (shader.uniforms.uSampler2){ 
		bind2dTextureIfRequired(duocylinderObj.tex2, gl.TEXTURE3);
		gl.uniform1i(shader.uniforms.uSampler2, 3);
	}
	if (shader.uniforms.uSampler2B){
		bind2dTextureIfRequired(duocylinderObj.tex2B, gl.TEXTURE4);
		gl.uniform1i(shader.uniforms.uSampler2B, 4);
	}
	
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
	enableDisableAttributes(shaderProg);	//TODO more this to shadersetup!!
	
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, bufferObj.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	if (bufferObj.vertexNormalBuffer && shaderProg.attributes.aVertexNormal){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexNormalBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexNormal, bufferObj.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (bufferObj.vertexTangentBuffer && shaderProg.attributes.aVertexTangent){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexTangentBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexTangent, bufferObj.vertexTangentBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (bufferObj.vertexBinormalBuffer && shaderProg.attributes.aVertexBinormal){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexBinormalBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexBinormal, bufferObj.vertexBinormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (bufferObj.vertexVelocityBuffer && shaderProg.attributes.aVertexVelocity){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexVelocityBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexVelocity, bufferObj.vertexVelocityBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (bufferObj.vertexTextureCoordBuffer && shaderProg.attributes.aTextureCoord){
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexTextureCoordBuffer);
		gl.vertexAttribPointer(shaderProg.attributes.aTextureCoord, bufferObj.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		//bind2dTextureIfRequired(texture);
		gl.uniform1i(shaderProg.uniforms.uSampler, 0);
	}
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);

	if (usesCubeMap){
		gl.uniform1i(shaderProg.uniforms.uSampler, 1);	//put cubemap in tex 1 always, avoiding bind calls.
	}
	
	if (shaderProg.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader. TODO do less ofteen (move camera less often than switch buffers)
		gl.uniform4fv(shaderProg.uniforms.uCameraWorldPos, worldCamera.slice(12));
	}
	
	setupShaderAtmos(shaderProg);
	
	//if (shaderProg.uniforms.uPMatrix){
		gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
	//}
}
function setupShaderAtmos(shaderProg){	//TODO generalise more shader stuff
	if (shaderProg.uniforms.uAtmosContrast){	//todo do less often (at least query ui less often)
		gl.uniform1f(shaderProg.uniforms.uAtmosContrast, guiParams.display.atmosContrast);
	}
	if (shaderProg.uniforms.uAtmosThickness){	//todo do less often (at least query ui less often)
		//make atmos thickness constant at "zero" duocylinder height. thickness here is uAtmosContrast*uAtmosThickness,
		var thicknessValForShader = guiParams.display.atmosThickness*Math.pow(2.71,-0.5*guiParams.display.atmosContrast);
	
		if (shaderProg.usesVecAtmosThickness){
			gl.uniform3fv(shaderProg.uniforms.uAtmosThickness, atmosThicknessMultiplier.map(elem=>elem*thicknessValForShader));
		}else{
			gl.uniform1f(shaderProg.uniforms.uAtmosThickness, thicknessValForShader);
		}
	}
}

function drawObjectFromPreppedBuffers(bufferObj, shaderProg, skipM){
	//skipM = skipM | false;
	//skipM = false;
	gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);
	//if (shaderProg.uniforms.uMMatrix  && (!skipM)){gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);}
	if (shaderProg.uniforms.uMMatrix  ){gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);}
	gl.drawElements(gl.TRIANGLES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//gl.drawElements(gl.LINES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawObjectFromPreppedBuffersVsMatmult(bufferObj, shaderProg){
	gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);
	gl.drawElements(gl.TRIANGLES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}


var bind2dTextureIfRequired = (function createBind2dTextureIfRequiredFunction(){
	var currentlyBoundTextures=[];
	var currentBoundTex;
	return function(texToBind, texId = gl.TEXTURE0){	//TODO use different texture indices to keep textures loaded?
								//curently just assuming using tex 0, already set as active texture (is set active texture a fast gl call?)
		currentBoundTex = currentlyBoundTextures[texId];	//note that ids typically high numbers. gl.TEXTURE0 and so on. seem to be consecutive numbers but don't know if guaranteed.
		if (texToBind != currentBoundTex){
			gl.activeTexture(texId);
			gl.bindTexture(gl.TEXTURE_2D, texToBind);
			currentlyBoundTextures[texId] = texToBind;
		}
	}
})();


//need all of these???
var mMatrix = mat4.create();
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var nonCmapPMatrix = mat4.create();
var playerCamera = mat4.create();
var playerCameraInterp = mat4.create();
var offsetPlayerCamera = mat4.create();
var playerContainer = {matrix:playerCamera, world:0}
var offsetCameraContainer = {matrix:offsetPlayerCamera, world:0}

var worldCamera = mat4.create();

var cmapPMatrix = mat4.create();
setProjectionMatrix(cmapPMatrix, -90.0, 1.0);	//-90 gets reflection to look right. (different for portal?)
var squareFrustumCull = generateCullFunc(cmapPMatrix);

var invertedWorldCamera = mat4.create();
var invertedWorldCameraDuocylinderFrame = mat4.create();
var invertedPlayerCamera = mat4.create();

var tmpRelativeMat = mat4.create();
var identMat = mat4.identity();

var drawSsshipRotatedMat = mat4.create();		//TODO IIFE with drawspaceship?
var drawSsshipInverseSshipMat = mat4.create();	//""

var closestPointTestMat = mat4.create();	//TODO maybe more efficient to just use a point here. (matrix is used to draw debug something, but could convert to matrix only when debug drawing...
var voxCollisionCentralLevel =0;
var voxCollisionDebugMat = mat4.create();	//in player frame, showing where the collison/reaction
var lastVoxPenetration = 0;

var closestBoxDist=100;	//initialise to arbitrarily large. TODO store point so pan sound	
var closestBoxInfo;

function setMatrixUniforms(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.uniforms.uPMatrix, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.uniforms.uMVMatrix, false, mvMatrix);
	if (shaderProgram.uniforms.uMMatrix){gl.uniformMatrix4fv(shaderProgram.uniforms.uMMatrix, false, mMatrix);}
	setupShaderAtmos(shaderProgram);
}

var cubemapView={};
//cube map code from http://www.humus.name/cubemapviewer.js (slightly modified)

function power_of_2(n) {
	if (typeof n !== 'number') 
		return false;
   
	return (n >= 1) && (n & (n - 1)) === 0;
}

function initCubemapFramebuffer(view){
	const urlParams = new URLSearchParams(window.location.search);
	var manualCubemapSize = Number(urlParams.get('cms'));
	var cubemapSize = ( power_of_2(manualCubemapSize) &&  manualCubemapSize<8192) ? manualCubemapSize : 512;	//disallow really big, because causes awful perf.
																												//512 decent for 1080p end result. 1024 bit better. my machine handles 4096, but no point
	console.log({manualCubemapSize, cubemapSize});

	//for rendering to separate 2d textures, prior to cubemap
	var intermediateFramebuffers = [];
	var intermediateTextures = [];
	var intermediateDepthTextures = [];
	view.intermediateFramebuffers = intermediateFramebuffers;
	view.intermediateTextures = intermediateTextures;
	view.intermediateDepthTextures = intermediateDepthTextures;
	
	//for rendering to cubemap
	var framebuffers = [];
	view.framebuffers = framebuffers;
	
	view.cubemapTexture = gl.createTexture();
	
	gl.activeTexture(gl.TEXTURE1);	//use texture 1 always for cubemap
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, view.cubemapTexture);
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
	
	for (var i = 0; i < faces.length; i++)
	{
		var face = faces[i];
			
		var framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		framebuffer.width = cubemapSize;
		framebuffer.height = cubemapSize;
		framebuffers[i]=framebuffer;
		
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(face, 0, gl.RGBA, cubemapSize, cubemapSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, cubemapSize, cubemapSize);
				
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, view.cubemapTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	}
	
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	
	//setup rendering to intermediate textures.
	for (var i = 0; i < faces.length; i++)
	{
		var framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		framebuffer.width = cubemapSize;
		framebuffer.height = cubemapSize;
		intermediateFramebuffers[i]=framebuffer;
		
		var textureRgb = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, textureRgb);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cubemapSize, cubemapSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		intermediateTextures.push(textureRgb);

		var depthTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, cubemapSize, cubemapSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT , null);
		intermediateDepthTextures.push(depthTexture);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureRgb, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
	}
	
	//gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);	//this gets rid of errors being logged to console. 
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function setupScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	mat4.identity(playerCamera);	//not sure why have 2 matrices here...
	//bung extra quaternion stuff onto this for quick test
	playerCamera.qPair = [[1,0,0,0],[1,0,0,0]];
			
	//start player off outside of boxes
	xyzmove4mat(playerCamera,[0,0.4,-0.3]);	//left, down, fwd
	
	targetMatrix = cellMatData.d16[0];
}

var texture,diffuseTexture,hudTexture,hudTextureSmallCircles,hudTexturePlus,hudTextureX,hudTextureBox,sshipTexture,cannonTexture,nmapTexture;

function loadTmpFFTexture(id,directory){
	directory = directory || 'img/';
	diffuseTexture = makeTexture(directory+id+"/"+id+"-diffuse.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5,false);
	nmapTexture = makeTexture(directory+id+"/"+id+"-normal.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5,false);
}

function initTexture(){
	texture = makeTexture("img/0033.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
	
	//nmapTexture = makeTexture("img/images.squarespace-cdn.com.png");	//button cushion
//	diffuseTexture = makeTexture("img/4431-diffuse.jpg",false);nmapTexture = makeTexture("img/4431-normal.jpg",false);	//concrete blocks
	//diffuseTexture = makeTexture("img/no-git/6133-diffuse.jpg",false);nmapTexture = makeTexture("img/no-git/6133-normal.jpg",false);	//metal crate
	//diffuseTexture = makeTexture("img/no-git/4483-diffuse.jpg",false);nmapTexture = makeTexture("img/no-git/4483-normal.jpg",false);	//rust
	//loadTmpFFTexture(11581);
	//loadTmpFFTexture(14196,'img/no-git/');
	//loadTmpFFTexture(9701,'img/no-git/');	//craters. good for out-of-atmosphere part?
	//loadTmpFFTexture(4241,'img/no-git/');
	loadTmpFFTexture(6481);
	//loadTmpFFTexture(14206,'img/no-git/');	//https://www.filterforge.com/filters/14206.html	"Sedimentary Boulders Rock Face"
	//loadTmpFFTexture(1893,'img/no-git/');	//dry lakebed
	
	hudTexture = makeTexture("img/circles.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTextureSmallCircles = makeTexture("img/smallcircles.png",gl.RGB,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTexturePlus = makeTexture("img/plus.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTextureX = makeTexture("img/x.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTextureBox = makeTexture("img/box.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);
	duocylinderObjects.grid.tex = makeTexture("img/grid-omni.png",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
	duocylinderObjects.terrain.tex = makeTexture("data/terrain/turbulent-seamless.png",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
	//duocylinderObjects.procTerrain.tex = texture;
	//duocylinderObjects.procTerrain.tex = makeTexture("img/14131-diffuse.jpg");  //sand
	duocylinderObjects.procTerrain.tex = nmapTexture;
	duocylinderObjects.procTerrain.texB = diffuseTexture;

	duocylinderObjects.procTerrain.useMapproject = true;

	//load 2 more textures. already set textures still reference what was loaded already
	//loadTmpFFTexture(4999,'img/no-git/');	//chequerboard
	loadTmpFFTexture(14206);	//https://www.filterforge.com/filters/14206.html	"Sedimentary Boulders Rock Face"

	duocylinderObjects.procTerrain.tex2 = nmapTexture;
	duocylinderObjects.procTerrain.tex2B = diffuseTexture;
	
	//duocylinderObjects.sea.tex = null;
	duocylinderObjects.sea.tex = makeTexture("img/4141.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
	//duocylinderObjects.sea.tex = makeTexture("img/ash_uvgrid01.jpg");
	duocylinderObjects.sea.isSea=true;
	
	sshipTexture = makeTexture("data/dirLight/SshipTexCombouv5FR40pc.png");
	cannonTexture = makeTexture("data/cannon/cannon-combo.png");
	
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/ash_uvgrid01.jpg");
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/cretish0958.png");
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/13787.jpg");
//	duocylinderObjects.voxTerrain.tex = makeTexture("img/2100-v1.jpg");
	
	duocylinderObjects.voxTerrain.texB = diffuseTexture;
	duocylinderObjects.voxTerrain.tex = nmapTexture;
	
	//duocylinderObjects.voxTerrain.tex = makeTexture("img/4483-v7.jpg");	//rust

	duocylinderObjects.voxTerrain.usesTriplanarMapping=true;
	
	randBoxBuffers.tex=texture;
	towerBoxBuffers.tex=nmapTexture;towerBoxBuffers.texB=diffuseTexture;
	stonehengeBoxBuffers.tex=texture;stonehengeBoxBuffers.texB=diffuseTexture;
	roadBoxBuffers.tex=nmapTexture;roadBoxBuffers.texB=diffuseTexture;
	
	//texture = makeTexture("img/ash_uvgrid01-grey.tiny.png");	//numbered grid
}

function makeTexture(src, imgformat=gl.RGBA, imgtype=gl.UNSIGNED_BYTE, yFlip = true) {	//to do OO
	var texture = gl.createTexture();
		
	bind2dTextureIfRequired(texture);
	//dummy 1 pixel image to avoid error logs. https://stackoverflow.com/questions/21954036/dartweb-gl-render-warning-texture-bound-to-texture-unit-0-is-not-renderable
		//(TODO better to wait for load, or use single shared 1pix texture (bind2dTextureIfRequired to check that texture loaded, by flag on texture? if not loaded, bind the shared summy image?
		//TODO progressive detail load?
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 0, 255, 255])); // magenta. should be obvious when tex not loaded.
	
	texture.image = new Image();
	texture.image.onload = function(){
		bind2dTextureIfRequired(texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, yFlip);

		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);	//linear colorspace grad light texture (TODO handle other texture differently?)
		gl.texImage2D(gl.TEXTURE_2D, 0, imgformat, imgformat, imgtype, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		bind2dTextureIfRequired(null);	//AFAIK this is just good practice to unwanted side effect bugs
	};	
	texture.image.src = src;
	return texture;
}

var mouseInfo = {
	x:0,
	y:0,
	dragging: false,
	lastPointingDir:{},
	pendingMovement:[0,0],
	currentPointingDir:{x:0,y:0,z:1,w:1}
};
var stats;

var pointerLocked=false;
var guiParams={
	world0:{duocylinderModel:"voxTerrain",seaActive:true},
	world1:{duocylinderModel:"none",seaActive:false},
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
		explodingBox:false,
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
		drawType:'instanced speckles',
		numToMove:0
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
	"draw spaceship":true,
	"drop spaceship":false,
	target:{
		type:"none",
		scale:0.03
	},
	"targeting":"off",
	//fogColor0:'#b2dede',
	//fogColor0:'#b451c5',
	fogColor0:'#222222',
	fogColor1:'#aaaaaa',
	playerLight:'#000088',
	control:{
		onRails:false,
		handbrake:false,
		spinCorrection:true,
		sriMechStr:0,
		smoothMouse:200
	},
	display:{
		cameraType:"far 3rd person",
		cameraFov:125,
		uVarOne:-0.01,
		flipReverseCamera:false,	//flipped camera makes direction pointing behavour match forwards, but side thrust directions switched, seems less intuitive
		showHud:false,
		renderViaTexture:'bennyBox',
		drawTransparentStuff:true,
		voxNmapTest:false,	//just show normal map. more efficient pix shader than standard. for performance check
		perPixelLighting:true,
		atmosShader:"atmos",
		atmosThickness:0.2,
		atmosThicknessMultiplier:'#88aaff',
		atmosContrast:20.0,
		culling:true,
		useSpecular:true,
		specularStrength:0.5,
		specularPower:20.0
	},
	reflector:{
		draw:true,
		cmFacesUpdated:6,
		mappingType:'vertex projection',
		scale:0.3,
		isPortal:true,
		test1:false
	},
	debug:{
		closestPoint:false,
		buoys:false,
		nmapUseShader2:true,
		showSpeedOverlay:false,
		showGCInfo:false,
		emitFire:false,
		fireworks:false
	},
	audio:{
		volume:0.2,
	},
	normalMove:0
};
var settings = {
	playerBallRad:0.003,
	characterBallRad:0.001
}
reflectorInfo.rad = guiParams.reflector.scale;		//need to initialise currently because portalTest 1st occurs before calcReflectionInfo

var worldColors=[];
var worldColorsPlain=[];
var playerLightUnscaled;
var playerLight;
var muzzleFlashAmounts=[0,0,0,0];
var teapotMatrix=mat4.create();mat4.identity(teapotMatrix);
//xyzmove4mat(teapotMatrix,[0,1.85,0]);
xyzmove4mat(teapotMatrix,[0,0,-0.5]);
var sshipMatrix=mat4.create();mat4.identity(sshipMatrix);
var sshipMatrixNoInterp=mat4.create();mat4.identity(sshipMatrixNoInterp);
var sshipMatDCFrame=mat4.create();
var targetMatrix=mat4.create();mat4.identity(targetMatrix);
var targetWorldFrame=[];
var targetingResultOne=[];
var targetingResultTwo=[];
var selectedTargeting="none";
var bullets=new Set();
var gunMatrices=[mat4.create(),mat4.create(),mat4.create(),mat4.create()];	//? what happens if draw before set these to something sensible?
var canvas;

var collisionTestObjMat = mat4.identity();
var collisionTestObj2Mat = mat4.identity();
var collisionTestObj3Mat = mat4.identity();
var collisionTestObj4Mat = mat4.identity();
var collisionTestObj5Mat = mat4.identity();

var procTerrainNearestPointTestMat = mat4.identity();

var atmosThicknessMultiplier;	//TODO different settings for different worlds

function setupStats(dummyStats){
	if(dummyStats){
		return {
			begin:()=>{},
			end:()=>{}
		}
	}
	var stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );
	return stats;
}

function init(){

	stats = setupStats();	//setupStats(true) for disabled stats.

	guiParams.control.lockPointer = function(){
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
	randBoxesFolder.add(guiParams["random boxes"],"number",0,maxRandBoxes,64);
	randBoxesFolder.add(guiParams["random boxes"],"size",0.001,0.01,0.001);
	randBoxesFolder.add(guiParams["random boxes"],"collision");
	randBoxesFolder.add(guiParams["random boxes"],"drawType", ["singleBuffer","indiv","indivVsMatmult","instancedArrays","instanced speckles"]);
	randBoxesFolder.add(guiParams["random boxes"],"numToMove", 0,maxRandBoxes,64);
	drawShapesFolder.add(guiParams.drawShapes,"teapot");
	drawShapesFolder.add(guiParams.drawShapes,"teapot scale",0.05,2.0,0.05);
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
	controlFolder.add(guiParams.control, "onRails");
	controlFolder.add(guiParams.control, "handbrake");
	controlFolder.add(guiParams.control, "spinCorrection");
	controlFolder.add(guiParams.control, "sriMechStr",0,5,0.5);
	controlFolder.add(guiParams.control, 'lockPointer');
	controlFolder.add(guiParams.control, 'smoothMouse', 0, 1000,50);
	
	var displayFolder = gui.addFolder('display');	//control and movement
	displayFolder.add(guiParams.display, "cameraType", ["cockpit", "near 3rd person", "mid 3rd person", "far 3rd person", "side"]);
	displayFolder.add(guiParams.display, "cameraFov", 60,165,5);
	displayFolder.add(guiParams.display, "uVarOne", -0.125,0,0.005);
	displayFolder.add(guiParams.display, "flipReverseCamera");
	displayFolder.add(guiParams.display, "showHud");
	displayFolder.add(guiParams.display, "renderViaTexture", ['no','basic','bennyBoxLite','bennyBox','fisheye']);
	displayFolder.add(guiParams.display, "drawTransparentStuff");
	displayFolder.add(guiParams.display, "voxNmapTest");
	displayFolder.add(guiParams.display, "perPixelLighting");
	//displayFolder.add(guiParams.display, "atmosShader", ['constant','atmos','atmos_v2']);	//basic is constant (contrast=0) 
	displayFolder.add(guiParams.display, "atmosThickness", 0,0.5,0.05);
displayFolder.addColor(guiParams.display, "atmosThicknessMultiplier").onChange(setAtmosThicknessMultiplier);
	displayFolder.add(guiParams.display, "atmosContrast", -20,20,0.5);
	displayFolder.add(guiParams.display, "culling");
	displayFolder.add(guiParams.display, "useSpecular");
	displayFolder.add(guiParams.display, "specularStrength", 0,1,0.05);	//currently diffuse colour and distance attenuation applies to both specular and diffuse, keeping nonnegative by having diffuse multiplier 1-specularStrength. therefore range 0-1. TODO different specular, diffuse colours, (instead of float strength), specular maybe shouldn't have distance attenuation same way - possibly correct for point source but want solution for sphere light...
	displayFolder.add(guiParams.display, "specularPower", 1,20,0.5);
	displayFolder.add(guiParams, "normalMove", 0,0.02,0.001);
	
	var debugFolder = gui.addFolder('debug');
	debugFolder.add(guiParams.debug, "closestPoint");
	debugFolder.add(guiParams.debug, "buoys");
	debugFolder.add(guiParams.debug, "nmapUseShader2");
	debugFolder.add(guiParams.debug, "showSpeedOverlay").onChange(() => {
		var ols = document.querySelector('#info2').style;
		console.log(ols);
		ols.display = (ols.display == 'block')? 'none':'block';
		});
	debugFolder.add(guiParams.debug, "showGCInfo").onChange(() => {
		var ols = document.querySelector('#info3').style;
		ols.display = (ols.display == 'block')? 'none':'block';
		});
	debugFolder.add(guiParams.debug, "emitFire");
	debugFolder.add(guiParams.debug, "fireworks");
	
	var audioFolder = gui.addFolder('audio');
	audioFolder.add(guiParams.audio, "volume", 0,1,0.1).onChange(MySound.setGlobalVolume);
	MySound.setGlobalVolume(guiParams.audio.volume);	//if set above 1, fallback html media element will throw exception!!!
	
	var reflectorFolder = gui.addFolder('reflector');
	reflectorFolder.add(guiParams.reflector, "draw");
	reflectorFolder.add(guiParams.reflector, "cmFacesUpdated", 0,6,1);
	reflectorFolder.add(guiParams.reflector, "mappingType", ['projection', 'vertex projection','screen space','vertproj mix']);
	reflectorFolder.add(guiParams.reflector, "scale", 0.05,2,0.01);
	reflectorFolder.add(guiParams.reflector, "isPortal");
	reflectorFolder.add(guiParams.reflector, "test1");

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
		mouseInfo.lastPointingDir = getPointingDirectionFromScreenCoordinate(mouseInfo.x, mouseInfo.y);
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
		mouseInfo.currentPointingDir = getPointingDirectionFromScreenCoordinate(evt.offsetX, evt.offsetY);
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
			mouseInfo.pendingMovement[0]+=-0.001* evt.movementX;	//TODO screen resolution dependent sensitivity.
			mouseInfo.pendingMovement[1]+=-0.001* evt.movementY;				
		}
	});
	
	canvas.addEventListener("touchstart", handleTouchStart, false);
	canvas.addEventListener("touchend", handleTouchEnd, false);
	canvas.addEventListener("touchmove", handleTouchMove, false);
	
	initGL();
	angle_ext = gl.getExtension("ANGLE_instanced_arrays");							
	fragDepth_ext = gl.getExtension('EXT_frag_depth');
	depthTex_ext = gl.getExtension('WEBGL_depth_texture');
	
	initTextureFramebuffer(rttView);
	initTextureFramebuffer(rttStageOneView, true);
	initTextureFramebuffer(rttFisheyeView2);
	initShaders();
	initTexture();
	initCubemapFramebuffer(cubemapView);
	initBuffers();
	completeShaders();
	setFog(0,guiParams.fogColor0);
	setFog(1,guiParams.fogColor1);
	setAtmosThicknessMultiplier(guiParams.display.atmosThicknessMultiplier);
	setPlayerLight(guiParams.playerLight);
    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	setupScene();
	requestAnimationFrame(drawScene);
	
	function setFog(world,color){
		worldColorsPlain[world]=colorArrFromUiString(color).concat(1);
		worldColors[world]=worldColorsPlain[world].map(function(elem){
			var withGamma =Math.pow(elem,2.2);
			return withGamma/(1.01-withGamma);	//undo tone mapping
		});
	}
	function setAtmosThicknessMultiplier(color){
		atmosThicknessMultiplier = colorArrFromUiString(color);
	}
	function setPlayerLight(color){
		var r = parseInt(color.substring(1,3),16) /255;
		var g = parseInt(color.substring(3,5),16) /255;
		var b = parseInt(color.substring(5,7),16) /255;
		playerLightUnscaled=[r,g,b].map(function(elem){return Math.pow(elem,2.2)});	//apply gamma
	}
}
function colorArrFromUiString(color){
	var r = parseInt(color.substring(1,3),16) /255;
	var g = parseInt(color.substring(3,5),16) /255;
	var b = parseInt(color.substring(5,7),16) /255;
	return [r,g,b];
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

var debugRoll=0

var reverseCamera=false;
var currentThrustInput = [0,0,0];
var iterateMechanics = (function iterateMechanics(){
	var lastTime=Date.now();
	var moveSpeed=0.000075;
	var rotateSpeed=-0.0005;
		
	var playerAngVelVec = [0,0,0];
	
	var timeTracker =0;
	var timeStep = 2;	//2ms => 500 steps/s! this is small to prevent tunelling. TODO better collision system that does not require this!
	var timeStepMultiplier = timeStep/10;	//because stepSpeed initially tuned for timeStep=10;
	var angVelDampMultiplier=Math.pow(0.85, timeStep/10);
	var gunHeatMultiplier = Math.pow(0.995, timeStep/10);
	
	var thrust = 0.001*timeStep;	//TODO make keyboard/gamepad fair! currently thrust, moveSpeed config independent!
	
	//gamepad
	var activeGp, buttons, axes;
	var gpMove=new Array(3);

	var autoFireCountdown=0;
	//var autoFireCountdownStartVal=6;
	var autoFireCountdownStartVal=Math.ceil(5 / (timeStep/10));	//note due to rounding, fire rate somewhat dependent on timestep 
	var lastPlayerAngMove = [0,0,0];	//for interpolation
	var duoCylinderAngVelConst=0;
	
	var currentPen=0;	//for bodgy box collision (todo use collision points array)
		
	var bulletMatrixTransposed = mat4.create();	//TODO? instead of transposing matrices describing possible colliding objects orientation.
	var bulletMatrixTransposedDCRefFrame=mat4.create();		//alternatively might store transposed other objects orientation permanently		

	return function(frameTime){
		
		reverseCamera=keyThing.keystate(82) || (mouseInfo.buttons & 4); 	//R or middle mouse click
		
		activeGp=getGamepad();
				
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
		
		
		//move random boxes about
		//note singleBuffer version not implemented, though this could be done by updating vertex data etc (expect relatively inefficient)
		//this just proves concept of updating buffers in realtime
		//to be more efficient to achieve this demo effect, could just put velocity as instance attribute, move in shader. could extend by only updating buffer to set velocity/start position matrix on change of velocity.
		var matsToMove = guiParams['random boxes'].numToMove;	//TO ui control. note only affects drawing when these boxes are displayed.
		var moveVec = [0,0,timeElapsed*0.0002];
		//try modifiying a random box, see if live updating webgl buffers works for instanced rendering
		for (var ii=0;ii<matsToMove;ii++){
			xyzmove4mat(randomMats[ii],moveVec);	//this maybe slow part
		}
		
		if (guiParams["random boxes"].drawType=='instancedArrays'){
			//this copypasted from elsewhere. todo cleaner
			var matrixF32ArrA = new Float32Array(matsToMove*4);	// TODO reuse Float32Array!
			var matrixF32ArrB = new Float32Array(matsToMove*4);
			var matrixF32ArrC = new Float32Array(matsToMove*4);
			var matrixF32ArrD = new Float32Array(matsToMove*4);
			
			var thisMat;
			for (var ii=0,pp=0;ii<matsToMove;ii++,pp+=4){
				//matrixF32Arr.set(randomMats[ii],pp);
				thisMat=randomMats[ii];
				matrixF32ArrA.set(thisMat.slice(0,4),pp);
				matrixF32ArrB.set(thisMat.slice(4,8),pp);
				matrixF32ArrC.set(thisMat.slice(8,12),pp);
				matrixF32ArrD.set(thisMat.slice(12,16),pp);
			}
			
			bufferArraySubDataGeneral(randBoxBuffers.randMatrixBuffers.a, 0, matrixF32ArrA);
			bufferArraySubDataGeneral(randBoxBuffers.randMatrixBuffers.b, 0, matrixF32ArrB);
			bufferArraySubDataGeneral(randBoxBuffers.randMatrixBuffers.c, 0, matrixF32ArrC);
			bufferArraySubDataGeneral(randBoxBuffers.randMatrixBuffers.d, 0, matrixF32ArrD);
		}
		
		
		
		
		duoCylinderAngVelConst = guiParams.duocylinderRotateSpeed;
		
		timeTracker+=timeElapsed;
		var numSteps = Math.floor(timeTracker/timeStep);
		timeTracker-=numSteps*timeStep;
		for (var ii=0;ii<numSteps;ii++){
			stepSpeed();
			gunHeat*=gunHeatMultiplier;
			offsetCam.iterate();
		}
		
		//TODO check whether this calculation is redundant (done elsewhere)
		mat4.set(playerCamera, worldCamera);	//TODO check whether playerCamera is main camera or spaceship, decide where microphone should be
		mat4.set(worldCamera, invertedWorldCamera);
		mat4.transpose(invertedWorldCamera);
	
		//equivalent for frame of duocylinder, to reduce complexity of drawing, collision checks etc
		mat4.set(invertedWorldCamera, invertedWorldCameraDuocylinderFrame);
		rotate4mat(invertedWorldCameraDuocylinderFrame, 0, 1, duocylinderSpin);
		
		var soundspd = 2;	//TODO change delaynode creation param (faster sound means less possible delay)
		
		for (var ee in explosions){
			var singleExplosion = explosions[ee];
			singleExplosion.life-=0.4*numSteps;
			if (singleExplosion.life<1){
				matPool.destroy(singleExplosion.matrix);
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
		
		
//		var duocylinderRotate = duoCylinderAngVelConst * timeElapsed*moveSpeed;
		var duocylinderRotate = duoCylinderAngVelConst * (numSteps*timeStep)*moveSpeed;
//		duocylinderSpin+=duocylinderRotate; 	//TODO match spin speed with sea wave speed
		
		if (guiParams.control.spinCorrection){
			//rotate player in this frame (maybe better to drag towards this angular velocity, with drag prop to atmos density)
			//what is direction along duocylinder in frame of player?
			
			//take a leaf out of other code calculating spinVelWorldCoords, spinVelPlayerCoords
			//todo combine these
			//todo account for rotation while moving wrt duocylinder ? 
			
			var axisDirWorldCoords = [ 0,0,playerCamera[15],-playerCamera[14]];						
			var axisDirPlayerCoords = [
				axisDirWorldCoords[2]*playerCamera[2] + axisDirWorldCoords[3]*playerCamera[3],
				axisDirWorldCoords[2]*playerCamera[6] + axisDirWorldCoords[3]*playerCamera[7],
				axisDirWorldCoords[2]*playerCamera[10] + axisDirWorldCoords[3]*playerCamera[11]];
			rotatePlayer(scalarvectorprod(duocylinderRotate,axisDirPlayerCoords));	
		}
		
		function stepSpeed(){	//TODO make all movement stuff fixed timestep (eg changing position by speed)
			duocylinderSpin+=duoCylinderAngVelConst*timeStep*moveSpeed;
		
			//auto-roll upright. with view to using for character controller
			//could put this outside stepspeed if didn't decay towards 0 roll (could do immediately like do with spinCorrection
			if (true){
				//get position of point "above" player by zeroing x,y components of player position. get this in player frame/ dot with player side vector...
				//var pointAbovePlayer = [ 
				
				debugRoll = playerCamera[14]*playerCamera[2] + playerCamera[15]*playerCamera[3];
					//this works because playerCamera 0 thru 3 represents the player's "side" position in the world - ie move quarter way around world from player in sideways direction
					//and playerCamera 12 thru 15 represents player's position in the world.
					//not ideal - will be nothing when y=z=0.
				//debugRoll-= playerCamera[12]*playerCamera[0] + playerCamera[13]*playerCamera[1];	//similar to above but this part -> when x=y=0
				debugRoll-= playerCamera[12]*playerCamera[0] + playerCamera[13]*playerCamera[1];	//similar to above but this part -> when x=y=0

				//multiply by factor that describes how far from top/bottom "poles" (x=y=0, w=z=0) are.
				//something like 1 -(x*x + y*y - z*z - w*w)^2
				//since x*x + y*y + z*z + w*w = 1, get 
				//	1 - ( 2*(x*x + y*y) - 1)^2  = 4(x*x+y*y)^2 - 4(x*x+y*y)
				var xxplusyy = playerCamera[12]*playerCamera[12] + playerCamera[13]*playerCamera[13];
				var multFactor = 4*xxplusyy*(1-xxplusyy);
				
				playerAngVelVec[2]+=debugRoll*guiParams.control.sriMechStr*multFactor*timeStepMultiplier;
			}
		
		
			var fractionToMove = 1;
			if (guiParams.control.smoothMouse == 0 ){
				fractionToKeep=0;
			}else{
				fractionToKeep = Math.exp(-timeStep/guiParams.control.smoothMouse);	//smoothMouse ~ smoothing time (ms)
			}
			
			var amountToMove = new Array(2);
			for (var cc=0;cc<2;cc++){
				amountToMove[cc]=mouseInfo.pendingMovement[cc]*(1-fractionToKeep);
				mouseInfo.pendingMovement[cc]*=fractionToKeep;
			}
			
			rotatePlayer([ amountToMove[1], amountToMove[0], 0]);	
			
			currentThrustInput[0]=keyThing.keystate(65)-keyThing.keystate(68);	//lateral
			currentThrustInput[1]=keyThing.keystate(32)-keyThing.keystate(220);	//vertical
			currentThrustInput[2]=keyThing.keystate(87)-keyThing.keystate(83);	//fwd/back
			
			currentThrustInput=currentThrustInput.map(function(elem){return elem*thrust;});
			
			var currentRotateInput=[];
			
			currentRotateInput[0]=keyThing.keystate(40)-keyThing.keystate(38); //pitch
			currentRotateInput[1]=keyThing.keystate(39)-keyThing.keystate(37); //turn
			currentRotateInput[2]=keyThing.keystate(69)-keyThing.keystate(81); //roll
			
			if (activeGp){
				//TODO move calculation of total input from keys/gamepad outside this loop
				if (gpSettings.moveEnabled){
					gpMove[0] = Math.abs(axes[0])>gpSettings.deadZone ? -moveSpeed*axes[0] : 0; //lateral
					gpMove[1] = Math.abs(axes[1])>gpSettings.deadZone ? moveSpeed*axes[1] : 0; //vertical
					gpMove[2] = moveSpeed*(buttons[7].value-buttons[6].value); //fwd/back	//note Firefox at least fails to support analog triggers https://bugzilla.mozilla.org/show_bug.cgi?id=1434408
					
					var magsq = gpMove.reduce(function(total, val){return total+ val*val;}, 0);
					
					for (var cc=0;cc<3;cc++){
						currentThrustInput[cc]*=gpMove[cc]*10000000000*magsq;
					}
					
					//testInfo=[axes,buttons,gpMove,magsq];
					
					//note doing cube bodge to both thrust and to adding velocity to position (see key controls code)
					//maybe better to pick one! (probably should apply cube logic to acc'n for exponential smoothed binary key input, do something "realistic" for drag forces
				}
				
				currentRotateInput[2]+=gpSettings.roll(activeGp); //roll
				
				//other rotation
				var gpRotate=[];
				var fixedRotateAmount = 10*rotateSpeed;
				gpRotate[0] = Math.abs(axes[gpSettings.pitchAxis])>gpSettings.deadZone ? fixedRotateAmount*gpSettings.pitchMultiplier*axes[gpSettings.pitchAxis] : 0; //pitch
				gpRotate[1] = Math.abs(axes[gpSettings.turnAxis])>gpSettings.deadZone ? fixedRotateAmount*gpSettings.turnMultiplier*axes[gpSettings.turnAxis] : 0; //turn
				gpRotate[2] = 0;	//moved to code above
					
				magsq = gpRotate.reduce(function(total, val){return total+ val*val;}, 0);
				var magpow = Math.pow(50*magsq,1.5);	//TODO handle fact that max values separately maxed out, so currently turns faster in diagonal direction.
				
				lastPlayerAngMove = scalarvectorprod(100000*magpow*timeStepMultiplier,gpRotate);
				rotatePlayer(lastPlayerAngMove);	//TODO add rotational momentum - not direct rotate
			}
			
			for (var cc=0;cc<3;cc++){
				playerAngVelVec[cc]+= timeStepMultiplier*currentRotateInput[cc];
				playerAngVelVec[cc]*=angVelDampMultiplier;
				playerVelVec[cc]+=currentThrustInput[cc];	//todo either write vector addition func or use glmatrix vectors
			}
									
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
			
			//print speed
			if (guiParams.debug.showSpeedOverlay){		
				var infoToShow ="";
				var speed = Math.hypot.apply(null, playerVelVec);
				infoToShow += "spd:" + speed.toFixed(2);

				infoToShow+=", airspd: " + spd.toFixed(2);
			//	infoToShow+=", sshipMat:" + Array.from(sshipMatrix).map(elem=>elem.toFixed(3)).join(",");	//toFixed doesn't work right on float32 array so use Array.from first
				infoToShow+=", portalDraw: "+testPortalDraw;
				infoToShow+=", debugRoll: " + debugRoll;

				document.querySelector("#info2").innerHTML = infoToShow;
				//document.querySelector("#info2").innerHTML = myDebugStr;
			}
			
			if (guiParams.control.handbrake){
				for (var cc=0;cc<3;cc++){
					airSpdVec[cc]*=0.9;	//TODO time dependence, but this is just to aid debugging (switch thru display options while view static)
				}
			}
			
			//get the current atmospheric density.
			var atmosThick = 0.001*guiParams.display.atmosThickness;	//1st constant just pulled out of the air. 
			atmosThick*=Math.pow(2.71, guiParams.display.atmosContrast*(playerPos[0]*playerPos[0] + playerPos[1]*playerPos[1] -0.5)); //as atmosScale increases, scale height decreases

			//want to be able to steer in the air. todo properly - guess maybe wants "lift" from wings, but easiest implementation guess is to increase drag for lateral velocity.
			//would like for both left/right, up/down velocity, but to test, try getting just one - like a aeroplane.
			//TODO better aerodynamic model - would like decent "steerability" without too much slowdown when completely sideways.
			//some tweak for non-isotropic drag. relates to drag coefficients in different directions
			var airSpdScale = [0.1,0.1,1];	//left/right, up/down, forwards/back
			var scaledAirSpdVec = airSpdVec.map((elem,ii)=>elem/airSpdScale[ii]);
			var spdScaled = Math.hypot.apply(null, scaledAirSpdVec);
			
			playerVelVec=scalarvectorprod(1.0-atmosThick*spdScaled,scaledAirSpdVec).map(function(val,idx){return val*airSpdScale[idx]+spinVelPlayerCoords[idx];});
			
			
			if (autoFireCountdown>0){
				autoFireCountdown--;
			}else{
				if (keyThing.keystate(71) ||( activeGp && activeGp.buttons[gpSettings.fireButton].value) || (pointerLocked && mouseInfo.buttons&1)){	//G key or joypad button or LMB (pointer locked)
					fireGun();
					autoFireCountdown=autoFireCountdownStartVal;
				}
			}

			var heatEmit = gunHeat/(gunHeat+1.5);	//reuse logic from drawSpaceship
			if (10*Math.random()<heatEmit){
				smokeGuns();	//TODO independently random smoking guns? blue noise not white noise, smoke from end of gun, ...
			}
			
			//particle stream
			if (guiParams.debug.emitFire){
				if (Math.random()<0.5){
					//making a new matrix is inefficient - expect better if reused a temp matrix, copied it into buffer
					var newm4 = mat4.create(sshipMatrix);
					xyzmove4mat(newm4, [1,1,1].map(elem => {return sshipModelScale*60*elem*(Math.random()-0.5)}));	//square uniform distibution
					new Explosion({matrix:newm4,world:sshipWorld}, sshipModelScale*0.5, [0.2,0.06,0.06]);
				}
			}
			if (guiParams.debug.fireworks){
				if (Math.random()<0.05){
					explosionParticles.makeExplosion(random_quaternion(), frameTime, [Math.random(),Math.random(),Math.random(),1],1);	//TODO guarantee bright colour
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
				
				//distanceForTerrainNoise = getHeightAboveTerrainFor4VecPos(playerPos);	//TODO actual distance using surface normal (IIRC this is simple vertical height above terrain)

				processTerrainCollisionForBall(playerCentreBallData, guiParams["drop spaceship"] ? settings.characterBallRad : settings.playerBallRad, true);
				/*
				for (var legnum=0;legnum<landingLegData.length;legnum++){
					var landingLeg = landingLegData[legnum];
					processTerrainCollisionForBall(landingLeg, 0.001);
				}
				*/
				function processTerrainCollisionForBall(landingLeg, ballSize, useForThwop){	//0.005 reasonable ballSize for centre of player model. smaller for landing legs
					var legPosPlayerFrame=landingLeg.pos;
					var suspensionHeight=landingLeg.suspHeight;
								
					var landingLegMat = mat4.create(playerCamera);
					xyzmove4mat(landingLegMat, legPosPlayerFrame);
					var legPos = landingLegMat.slice(12);	
					
					//simple spring force terrain collision - 
					//lookup height above terrain, subtract some value (height above terrain where restoring force goes to zero - basically maximum extension of landing legs. apply spring force upward to player proportional to this amount.
					var suspensionHeightNow = getHeightAboveTerrainFor4VecPos(legPos);
					
					//get nearest point on terrain. could do this in terrain space, but to be reliable, testable, find nearest 4vec position, find this position in player frame.
					//note this matrix "jiggles" when duocylinder rotating due to interpolation (other test mats that don't jiggle probably are in duocylinder rotating frame space)
					var nearestTerrainPosInfo = getNearestTerrainPosMatFor4VecPos(legPos)
					var nearestPosMat = nearestTerrainPosInfo.mat;
					var nearestPos = nearestPosMat.slice(12);
					
					//find length from this to position in player space.
					var lengthToNearest = Math.hypot.apply(null, nearestPos.map((elem,ii)=>{return elem-legPos[ii];}));

					//bodge to get signed distance. TODO more sensible method without if/ternary
					forceSwitch =  nearestTerrainPosInfo.altitude > 0 ? 1 : -1;
					lengthToNearest*=forceSwitch;
					
					myDebugStr = "suspensionHeightNow: " + suspensionHeightNow.toFixed(4) + ", lengthToNearest: " + lengthToNearest.toFixed(4);
					
					suspensionHeightNow = lengthToNearest;	//override suspension height with new distance. improves collision detection (barring glitches if break assumptions - eg might collide with phantom terrain if have abrupt steep wall...) . reaction force will remain upwards with just this change.
					
					
					suspensionHeightNow = Math.max(Math.min(-suspensionHeightNow,0) + ballSize, 0);	//capped
					var suspensionVel = suspensionHeightNow-suspensionHeight;
					var suspensionForce = 20*suspensionHeightNow+ 150*suspensionVel;	
																			//TODO rotational speed impact on velocity									
					suspensionForce=Math.max(suspensionForce,0) * forceSwitch;
					landingLeg.suspHeight = suspensionHeightNow;
														
					//apply force to player, "up" wrt duocylinder
					/*
					for (var cc=0;cc<3;cc++){
						playerVelVec[cc]+=suspensionForce*radialPlayerCoords[cc];	//radialPlayerCoords will be a bit different for landing legs but assume same since small displacement
					}
					*/
					
					//get the position of the closest point in the player frame. really only need to rotate the position vector by player matrix
					var relevantMat = mat4.create();	//just for testing
					mat4.set(landingLegMat, relevantMat);
					mat4.transpose(relevantMat);
					var nearestPosPlayerFrame = [];
					for (var cc=0;cc<3;cc++){
						nearestPosPlayerFrame[cc]=relevantMat[cc]*nearestPos[0] +  relevantMat[cc+4]*nearestPos[1] +  relevantMat[cc+8]*nearestPos[2] +  relevantMat[cc+12]*nearestPos[3];
					}
					//normalise it 
					var distNearestPointPlayerFrame = Math.hypot.apply(null, nearestPosPlayerFrame);	//this should recalculate existing vec
					myDebugStr += ", distNearestPointPlayerFrame: " + distNearestPointPlayerFrame.toFixed(4);
					
					if (useForThwop){
						mat4.set(nearestPosMat, procTerrainNearestPointTestMat);	//for visual debugging (TODO display object for each contact)
					
						distanceForTerrainNoise = distNearestPointPlayerFrame;	//assumes only 1 thing used for thwop
						var soundSize = 0.002;	//reduced this below noiseRad so get more pan
						panForTerrainNoise = Math.tanh(nearestPosPlayerFrame[0]/Math.hypot(soundSize,nearestPosPlayerFrame[1],nearestPosPlayerFrame[2]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
					}
					nearestPosPlayerFrame = nearestPosPlayerFrame.map(elem=>elem/distNearestPointPlayerFrame);	//normalise
					var forcePlayerFrame = nearestPosPlayerFrame.map(x=>x*suspensionForce);	//TODO combo with above
					
					for (var cc=0;cc<3;cc++){
						playerVelVec[cc]+=forcePlayerFrame[cc];
					}
					
					var torquePlayerFrame = [
									legPosPlayerFrame[1]*forcePlayerFrame[2] - legPosPlayerFrame[2]*forcePlayerFrame[1],
									legPosPlayerFrame[2]*forcePlayerFrame[0] - legPosPlayerFrame[0]*forcePlayerFrame[2],
									legPosPlayerFrame[0]*forcePlayerFrame[1] - legPosPlayerFrame[1]*forcePlayerFrame[0]
									];
					for (cc=0;cc<3;cc++){
						playerAngVelVec[cc]-=20000*torquePlayerFrame[cc];	//assumes moment of intertia of sphere/cube/similar
					}
					
					//TODO apply force along ground normal, friction force
				}
			}
			if (worldInfo.seaActive){
				distanceForTerrainNoise = getHeightAboveSeaFor4VecPos(playerPos, lastSeaTime);	//height. todo use distance (unimportant because sea gradient low
			}
			if (worldInfo.duocylinderModel == 'voxTerrain'){
				test2VoxABC();	//updates closestPointTestMat
				
				distanceForVox = distBetween4mats(playerCamera, closestPointTestMat);

				mat4.set(invertedPlayerCamera,tmpRelativeMat);
				mat4.multiply(tmpRelativeMat, closestPointTestMat);
				//distanceForTerrainNoise = distBetween4mats(tmpRelativeMat, identMat);	//should be same as previous result
				
				if (distanceForVox<distanceForTerrainNoise){
					distanceForTerrainNoise = distanceForVox;
					//get terrain noise pan. TODO reuse other pan code (explosions etc)
					
					var soundSize = 0.002;	//reduced this below noiseRad so get more pan
					panForTerrainNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
				}
				//console.log(panForTerrainNoise);
				
				//distanceForVox = 0.02*voxCollisionFunction(playerPos);	//TODO get distance. shouldn't be necessary with SDF. maybe problem is with other terrain funcs. to estimate distance, guess want to divide this by its downhill slope (which for proper SDF should be 1). for now guess some constant that will work ~consistently with other terrain. 
				
				
				//voxel collision. 
				//simple version, just push away from closest point. this will be in "wrong direction" if inside voxel volume, so will fall down if tunnel inside. TODO this better! see notes for function drawBall. TODO damping, friction etc
				
				var signedDistanceForVox = (voxCollisionCentralLevel<0) ? distanceForVox: -distanceForVox;	//this is a bodge. better to use gradient/value, or direction and signed distance, from modified test2VoxABC().
				
				var penetration = ( guiParams["drop spaceship"] ? settings.characterBallRad : settings.playerBallRad ) - signedDistanceForVox;
				var penetrationChange = penetration - lastVoxPenetration;	//todo cap this.
				lastVoxPenetration = penetration;
				//if (penetration>0){
				var pointDisplacement = tmpRelativeMat.slice(12, 15);	//for small distances, length of this is ~ distanceForVox
				mat4.set(playerCamera, voxCollisionDebugMat);
				xyzmove4mat(voxCollisionDebugMat, pointDisplacement.map(function(elem){return elem*-1;}));
				
				if (penetration>0){
					var springConstant = 100;	//simple spring. rebounding force proportional to penetration. //high number = less likely tunneling at high speed.
					var multiplier = penetration*springConstant
					var dampConstant = 200;
					multiplier+=penetrationChange*dampConstant;
					
					multiplier/=signedDistanceForVox;	//normalise. playerBallRad would give near same result assuming penetrations remain small
					
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
			
			
			
			//apply same forces for other items. 
			//start with just player centre. 
			var gridSqs = getGridSqFor4Pos(playerPos);
			//get transposed playerpos in frame of duocylinder. this is generally useful, maybe should have some func to convert? code copied from bullet collision stuff...
			var playerMatrixTransposed = mat4.create(playerCamera);	//instead of transposing matrices describing possible colliding objects orientation.
																//alternatively might store transposed other objects orientation permanently
			mat4.transpose(playerMatrixTransposed);
			var playerMatrixTransposedDCRefFrame=playerMatrixTransposed;	//in frame of duocylinder
					//not using create, because playerMatrixTransposed is not subsequently used
			rotate4mat(playerMatrixTransposedDCRefFrame, 0, 1, duocylinderSpin);
			
			
			
			
			
			
			
			currentPen = Math.max(currentPen,0);	//TODO better place for this? box penetration should not be -ve

			closestBoxDist =100; //used for thwop noise. initialise to arbitrarily large. TODO store point so pan sound
			closestBoxInfo={box:-1};
			
			if (guiParams.drawShapes.stonehenge || guiParams.drawShapes.singleBufferStonehenge){
				processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.stonehenge);
			}
			if (guiParams.drawShapes.towers || guiParams.drawShapes.singleBufferTowers){
				processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.towerblocks);
			}
			if (guiParams.drawShapes.roads || guiParams.drawShapes.singleBufferRoads){
				processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.roads);
			}
			
			//whoosh for boxes, using result from closest point calculation done inside collision function
			var distanceForBoxNoise = 100;
			var panForBoxNoise = 0;
			if (closestBoxInfo && closestBoxInfo.box!=-1){	//TODO something better - calc pan/dist in place calculate box dist. then can just initialise to something (large dist, 0 pan), not need if statement here.
			
				mat4.set(playerMatrixTransposedDCRefFrame, tmpRelativeMat);
				mat4.multiply(tmpRelativeMat, closestBoxInfo.box.matrix);
				xyzmove4mat(tmpRelativeMat, closestBoxInfo.surfPoint);
				distanceForBoxNoise = distBetween4mats(tmpRelativeMat, identMat);
			
				var soundSize = 0.002;
				panForBoxNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));
			}
			
			adjustedDist = Math.hypot(distanceForBoxNoise,terrainNoiseRad)
			var vol = terrainNoiseRad/adjustedDist;
			
			vol = terrainNoiseRad/adjustedDist;
			adjustedDist = Math.min(adjustedDist,2);	//clamp. (TODO set value to max delay). prevents log spam
			myAudioPlayer.setWhooshSoundBox({delay:adjustedDist, gain:vol*spdFactor, pan:panForBoxNoise});	
			
			
			function processBoxCollisionsForBoxInfoAllPoints(boxInfo){
				processBoxCollisionsForBoxInfo(boxInfo, playerCentreBallData, ( guiParams["drop spaceship"] ? settings.characterBallRad : settings.playerBallRad ), true, true);
						
				for (var legnum=0;legnum<landingLegData.length;legnum++){
				//	processBoxCollisionsForBoxInfo(boxInfo, landingLegData[legnum], 0.001, false);	//disable to debug easier using only playerCentreBallData collision
				}
			}
			
			function processBoxCollisionsForBoxInfo(boxInfo, landingLeg, collisionBallSize, drawDebugStuff, useForThwop){
				var pointOffset = landingLeg.pos.map(function(elem){return -elem;});	//why reversed? probably optimisable. TODO untangle signs!
								
				var relativeMat = mat4.identity();
				var boxArrs = boxInfo.gridContents;
				for (var gs of gridSqs){	//TODO get gridSqs
					var bArray = boxArrs[gs];
					if (bArray){	//occurs if in centre of world. TODO fail earlier in this case (avoid checking inside loop)
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
						var surfacePoint = vectorFromBox.map((elem,ii)=>{return elem-relativePos[ii];});
						var distFromBox = Math.hypot.apply(null, vectorFromBox.slice(0,3));		//todo handle distSqFromBox =0 (centre of collision ball is inside box) - can happen if moving fast, cover collisionBallSize in 1 step. currently results in passing thru box)
						
						if (useForThwop && (distFromBox < closestBoxDist)){
							closestBoxInfo.box=bb;
							closestBoxInfo.surfPoint=surfacePoint;
							closestBoxDist = distFromBox;
						}
						
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
						
							var relativePosC = relativeMatC.slice(12);
							
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
								var relativePosB = relativeMat.slice(12);
								mat4.set(playerCamera, collisionTestObj4Mat);
								xyzmove4mat(collisionTestObj4Mat, [-relativePosB[0],-relativePosB[1],-relativePosB[2]]);
								//TODO account for duocylinder rotation (currently assuming unrotated)
								
								mat4.set(bb.matrix, collisionTestObj5Mat);
								xyzmove4mat(collisionTestObj5Mat, surfacePoint);
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
								playerAngVelVec[cc]-=20000*torquePlayerFrame[cc];	//assumes moment of intertia of sphere/cube/similar
							}
							
							
						}
						
					}
					}	//end if bArray (defined)
				}
			}
			
			rotatePlayer(scalarvectorprod(timeStep * rotateSpeed,playerAngVelVec));
			movePlayer(scalarvectorprod(timeStep * moveSpeed,playerVelVec));
			
			//TODO apply duocylinder spin inside loop here. 
		
			
			var thrustVolume = Math.tanh(40*Math.hypot.apply(null, currentThrustInput));	//todo jet noise. take speed, atmos thickness into account. should be loud when going fast but not thrusting, pitch shift
			myAudioPlayer.setJetSound({delay:0, gain:thrustVolume, pan:0});
		}
		
		
		
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
		
		var targetCollisionFunc = (function(targetType){
			if (targetType == "sphere"){
				return (rMat => rMat[15]>critValue);
			}else if (targetType == "box"){
				return (rMat => rMat[15]>0 && Math.max(Math.abs(rMat[12]),	Math.abs(rMat[13]), Math.abs(rMat[14]))<guiParams.target.scale);
			}else{
				return (x => false);
			}
		})(guiParams.target.type);

		function boxCollideArray(bArray){
			for (var bb of bArray){
				boxCollideCheck(bb.matrixT,duocylinderSurfaceBoxScale,critValueDCBox, bulletPosDCF4V, true);
			}
		}
		var currentBullet;	//hack to pull funcs out of checkBulletCollision. set currentBullet=bullet inside checkBulletCollision
		function boxCollideCheck(cellMatT,thisBoxSize,boxCritValue, bulletPos4V, moveWithDuocylinder){
				mat4.multiplyVec4(cellMatT, bulletPos4V, tmpVec4);
				if (tmpVec4[3]<boxCritValue){return;}	//early sphere check
				if (Math.max(Math.abs(tmpVec4[0]),
							Math.abs(tmpVec4[1]),
							Math.abs(tmpVec4[2]))<thisBoxSize*tmpVec4[3]){
					detonateBullet(currentBullet, moveWithDuocylinder, [1,0.8,0.6,1]);
			}
		}
		function checkCollisionForBoxRing(ringCellMatsT){
			for (var ii=0;ii<ringCellMatsT.length;ii++){
				boxCollideCheck(ringCellMatsT[ii],ringBoxSize,critValueRingBox,bulletPos4V);
			}
		}

		var tmpVec4 = vec4.create();				//variable referring to this to make quicker to reference?
		var bulletPos = new Array(4); 
		var bulletPos4V = vec4.create();
		var bulletPosDCF4V = vec4.create();

		//slightly less ridiculous place for this - not declaring functions inside for loop!
		function checkBulletCollision(bullet, bulletMoveAmount){
			currentBullet=bullet;

			var bulletMatrix=bullet.matrix;
			tmpVec4[0]=tmpVec4[1]=tmpVec4[2]=tmpVec4[3]=0;
			mat4.set(bulletMatrix,bulletMatrixTransposed);
			mat4.transpose(bulletMatrixTransposed);
			
			mat4.set(bulletMatrixTransposed,bulletMatrixTransposedDCRefFrame);	//in frame of duocylinder
			rotate4mat(bulletMatrixTransposedDCRefFrame, 0, 1, duocylinderSpin);
			
			for (var cc=0;cc<4;cc++){
				bulletPos[cc] = bulletMatrix[12+cc];
				bulletPos4V[cc]= bulletPos[cc];
				bulletPosDCF4V[cc] = bulletMatrixTransposedDCRefFrame[3+4*cc];
			}
			
			var bulletVel=bullet.vel;
			xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount,bulletVel));
			
			mat4.set(invTargetMat,relativeMat);
			mat4.multiply(relativeMat, bulletMatrix);
			
			if (targetCollisionFunc(relativeMat)){
				detonateBullet(bullet);
			}
			
			var worldInfo = (bullet.world==0) ? guiParams.world0 : guiParams.world1;
					//todo keep bullets in 2 lists/arrays so can check this once per world
			
			if (worldInfo.duocylinderModel == "procTerrain"){
				//collision with duocylinder procedural terrain	
				if (getHeightAboveTerrainFor4VecPos(bulletPos)<0){detonateBullet(bullet, true, [0.3,0.3,0.3,1]);}
			}
			if (worldInfo.duocylinderModel == "voxTerrain"){	//TODO generalise collision by specifying a function for terrain. (voxTerrain, procTerrain)
				if (voxCollisionFunction(bulletPos)>0){detonateBullet(bullet, true, [0.5,0.5,0.5,1]);}
			}
			if (worldInfo.seaActive){
				if (getHeightAboveSeaFor4VecPos(bulletPos, lastSeaTime)<0){detonateBullet(bullet, true, [0.6,0.75,1,1]);}
				//if (getHeightAboveSeaFor4VecPos(bulletPos, 0)<0){detonateBullet(bullet, true);}
			}
			
			//slow collision detection between bullet and array of boxes.
			//todo 1 try simple optimisation by matrix/scalar multiplication instead of matrix-matrix
			//todo 2 another simple optimisation - sphere check by xyzw distance. previous check only if passes
			//todo 3 heirarchical bounding boxes or gridding system!
			
			//box rings
			var guiBoxes= guiParams.drawShapes.boxes;
			if (guiBoxes['y=z=0']){checkCollisionForBoxRing(ringCellsT[0]);}
			if (guiBoxes['x=z=0']){checkCollisionForBoxRing(ringCellsT[1]);}
			if (guiBoxes['x=y=0']){checkCollisionForBoxRing(ringCellsT[2]);}
			if (guiBoxes['z=w=0']){checkCollisionForBoxRing(ringCellsT[3]);}
			if (guiBoxes['y=w=0']){checkCollisionForBoxRing(ringCellsT[4]);}
			if (guiBoxes['x=w=0']){checkCollisionForBoxRing(ringCellsT[5]);}
			
			if (numRandomBoxes>0 && guiParams["random boxes"].collision){
				for (var ii=0;ii<numRandomBoxes;ii++){
					boxCollideCheck(randomMatsT[ii],boxSize,critValueRandBox,bulletPos4V);
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
			
			
			//hyperbolas
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
		function detonateBullet(bullet, moveWithDuocylinder, color=[1,1,1,1]){	//TODO what scope does this have? best practice???

			if (!bullet.active){console.log("attempting to destroy bullet that is already destroyed.");return;}

			bullet.vel = [0,0,0];	//if colliding with target, stop bullet.
			bullet.active=false;
			
			var matrix = bullet.matrix;

			if (!moveWithDuocylinder){
				new Explosion(bullet, 0.0003, [1,0.5,0.25], false, true);
				explosionParticles.makeExplosion(matrix.slice(12), frameTime, color,0);
			}else{
				rotate4matCols(matrix, 0, 1, duocylinderSpin);	//get bullet matrix in frame of duocylinder. might be duplicating work from elsewhere.
				new Explosion(bullet, 0.0003, [0.2,0.4,0.6],true, true);	//different colour for debugging
				explosionParticles.makeExplosion(matrix.slice(12), frameTime, color,0);
			}

			matPool.destroy(matrix);
			
			//singleExplosion.life = 100;
			//singleExplosion.matrix = bulletMatrix;
		}
		
		var singleStepMove = timeStep*moveSpeed;
		if (numSteps>0){
			for (var ii=0;ii<numSteps;ii++){	//TODO make more performant
				for (var b of bullets){
					if (b.active){	//TODO just delete/unlink removed objects
						checkBulletCollision(b, singleStepMove);
						portalTest(b, 0);
					}
				}
			}
		}
		
		for(var cc=0;cc<3;cc++){
			fireDirectionVec[cc]=playerVelVec[cc];
		}
		fireDirectionVec[2]+=muzzleVel;
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
			
			mat4.set(sshipMatrixNoInterp, sshipMatDCFrame);
			rotate4matCols(sshipMatDCFrame, 0, 1, duocylinderSpin);	//get matrix in frame of duocylinder.
		}else{
			mat4.set(sshipMatDCFrame,sshipMatrixNoInterp);
			rotate4matCols(sshipMatrixNoInterp, 0, 1, -duocylinderSpin);	//get matrix in frame of duocylinder.
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
	var adjustedRad = reflectorInfo.rad + amount;	//avoid issues with rendering very close to surface
	if (checkWithinReflectorRange(mat, adjustedRad)){	
		moveMatrixThruPortal(mat, adjustedRad, 1.00000001);
		obj.world=1-obj.world;
	//	console.log("currentWorld now = " + obj.world);
	}
}

function checkWithinReflectorRange(matrix, rad){
	return matrix[15]>1/Math.sqrt(1+rad*rad);
}

function moveMatrixThruPortal(matrix, rad, hackMultiplier){
	var magsq = 1- matrix[15]*matrix[15];	
	var mag = Math.sqrt(magsq);

	var multiplier = Math.PI/mag;
	var multiplier2 = -2*hackMultiplier*Math.atan(rad)/mag;
	var rotate = new Array(3);
	var move = new Array(3);

	for (var cc=0;cc<3;cc++){
		var matElem = matrix[4*cc+3];
		rotate[cc]=multiplier*matElem;
		move[cc]=multiplier2*matElem;
	}
	xyzrotate4mat(matrix, rotate);	//180 degree rotate about direction to reflector
	xyzmove4mat(matrix, move);
}

function movePlayer(vec){
	xyzmove4mat(playerCamera, vec);
}

function rotatePlayer(vec){
	if (!guiParams.control.onRails){
		//turning player makes velocity rotate relative to player.
		playerVelVec = rotateVelVec(playerVelVec,vec);
	};
	
	xyzrotate4mat(playerCamera,vec);
}


function getPointingDirectionFromScreenCoordinate(coordx, coordy){
	
	var maxyvert = 1.0;	
	var maxxvert = screenAspect;
	
	var xpos = maxxvert*(coordx*2.0/gl.viewportWidth   -1.0 );
	var ypos = maxyvert*(coordy*2.0/gl.viewportHeight   -1.0 );
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
			
			var oldPointingDir = getPointingDirectionFromScreenCoordinate(thisTouch.oldx, thisTouch.oldy);
			var pointingDir = getPointingDirectionFromScreenCoordinate(thisTouch.x, thisTouch.y);
			
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
			
			var newBulletMatrix = matPool.create(); 
			mat4.set(gunMatrix,newBulletMatrix);
			
			//work out what fireDirectionVec should be in frame of gun/bullet (rather than player ship body)
			//this maybe better done alongside targeting code.
			var relativeMatrix = matPool.create();
			mat4.set(sshipMatrix,relativeMatrix);
			mat4.transpose(relativeMatrix);
			mat4.multiply(relativeMatrix, gunMatrix);
			
			var newFireDirectionVec = new Array(3);
			for (var ii=0;ii<3;ii++){
				var sum=0;
				for (var jj=0;jj<3;jj++){
					sum+=relativeMatrix[ii*4+jj]*playerVelVec[jj];
				}
				newFireDirectionVec[ii]=sum;
			}			
			newFireDirectionVec[2]+=muzzleVel;
			bullets.add({matrix:newBulletMatrix,vel:newFireDirectionVec,world:sshipWorld,active:true});
			
			new Explosion({matrix:gunMatrix,world:sshipWorld}, sshipModelScale*0.5, [0.06,0.06,0.06]);	//smoke/steam fx.
															//TODO emit from hot gun (continue after firing), lighting for smoke (don't see in dark) ...
															//TODO get correct world (which side of portal end of gun is in)
			matPool.destroy(relativeMatrix);
			
			//limit number of bullets
			if (bullets.size>200){
				var bulletToDestroy = bullets.keys().next().value;
				//console.log("removing bullet because too many. ",bulletToDestroy.matrix,"pool:",matPool.getMats());
				if (bulletToDestroy.active){
					matPool.destroy(bulletToDestroy.matrix);
				}
				bullets.delete(bulletToDestroy);
			}
		}
	}
	myAudioPlayer.playGunSound(0);	//todo use delay param to play at exact time.
	gunHeat+=0.1;
	
//	var gunJerkAmount = 0.004;
//	rotatePlayer([(Math.random()-0.5)*gunJerkAmount, (Math.random()-0.5)*gunJerkAmount,0]);
}

function smokeGuns(){
	for (var g in gunMatrices){
		if (g%2 == gunEven){
			var gunMatrix = gunMatrices[g];
			new Explosion({matrix:gunMatrix,world:sshipWorld}, sshipModelScale*0.5, [0.06,0.06,0.06]);	//smoke/steam fx.
															//TODO emit from hot gun (continue after firing), lighting for smoke (don't see in dark) ...
															//TODO get correct world (which side of portal end of gun is in)
		}
	}
}


//rtt code from webgl-wideanglecamera project via webglPostprocess project

//from http://learningwebgl.com/blog/?p=1786
var rttView={};
var rttStageOneView={};
var rttFisheyeView2={};

function setRttSize(view, width, height){	
	if (view.sizeX == width && view.sizeY == height){return;}	// avoid setting again if same numbers ( has speed impact)
																	//todo check for memory leak
	view.sizeX = width;
	view.sizeY = height;
		
	view.framebuffer.width = width;
	view.framebuffer.height = height;	
	
	gl.bindTexture(gl.TEXTURE_2D, view.texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, view.framebuffer.width, view.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
	gl.bindTexture(gl.TEXTURE_2D, view.depthTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, view.framebuffer.width, view.framebuffer.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT , null);	//can use gl.UNSIGNED_BYTE , gl.UNSIGNED_SHORT here but get depth fighting (though only on spaceship) gl.UNSIGNED_INT stops z-fighting, could use WEBGL_depth_texture UNSIGNED_INT_24_8_WEBGL .
	//note that possibly gl.UNSIGNED_INT might help z-fighting without needing to do custom depth writing.
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, view.framebuffer.width, view.framebuffer.height); // TODO what is difference gl.DEPTH_COMPONENT, gl.DEPTH_COMPONENT16 ?

//	gl.bindFramebuffer(gl.FRAMEBUFFER, view.framebuffer);
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, view.texture, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, view.depthTexture, 0);
	//gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
	
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
//	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


function initTextureFramebuffer(view, useNearestFiltering) {
	var filterType = useNearestFiltering ? gl.NEAREST : gl.LINEAR;
	view.framebuffer = gl.createFramebuffer();

	view.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, view.texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterType);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterType);
	//gl.generateMipmap(gl.TEXTURE_2D);
	
	view.depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, view.depthTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	

	gl.bindFramebuffer(gl.FRAMEBUFFER, view.framebuffer);
	//setRttSize( view, 2048, 1024);	//overwritten right away, so little point having here.
	setRttSize( view, 512, 512);	//overwritten right away, so little point having here.
	
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
	gl.uniform3f(shaderProgramTexmap.uniforms.uModelScale, smallScale,smallScale,scale);
	drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
	gl.uniform3f(shaderProgramTexmap.uniforms.uModelScale, smallScale,scale,smallScale);
	drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
	gl.uniform3f(shaderProgramTexmap.uniforms.uModelScale, scale,smallScale,smallScale);
	drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
};
function drawTriAxisCrossForMatrix(mat){
	mat4.set(invertedWorldCamera, mvMatrix);
	mat4.multiply(mvMatrix, mat);
	mat4.set(mat, mMatrix);
	drawTriAxisCross(0.05);
}
function drawTriAxisCrossForPosition(posn){
	drawTriAxisCrossForMatrix(matForPos(posn));
}
function matForPos(posn){	//this is wasteful - makes a new matrix each time
	var mat = mat4.identity();
	/*
	mat[12] = posn[0];
	mat[13] = posn[1];
	mat[14] = posn[2];
	mat[15] = posn[3];
	mat[3] = posn[0];
	mat[7] = posn[1];
	mat[11] = posn[2];*/
	
	//TODO a less crap way to do this, but just abuse xyzmove4mat for this
	var xyzlength = Math.sqrt(posn[0]*posn[0] + posn[1]*posn[1] + posn[2]*posn[2]);
	var angleToMove = -Math.atan2(xyzlength, posn[3]);
	var moveVec = posn.slice(0,3).map(elem=>elem*angleToMove/xyzlength);
	xyzmove4mat(mat, moveVec);
	return mat;
}
function performGeneralShaderSetup(shader){
	if (shader.uniforms.uSpecularStrength){
		gl.uniform1f(shader.uniforms.uSpecularStrength, guiParams.display.specularStrength);	
	}
	if (shader.uniforms.uSpecularPower){
		gl.uniform1f(shader.uniforms.uSpecularPower, guiParams.display.specularPower);	
	}
}
function performShaderSetup(shader, wSettings, tex){	//TODO use this more widely, possibly by pulling out to higher level. similar to performCommon4vecShaderSetup
	({localVecFogColor, localVecReflectorDiffColor, reflectorPosTransformed, cosReflector, dropLightPos} = wSettings);

	gl.useProgram(shader);	//todo use function variable
	
	if (tex){
		bind2dTextureIfRequired(tex);
	}
	if (shader.uniforms.uFogColor){
		gl.uniform4fv(shader.uniforms.uFogColor, localVecFogColor);
	}
	if (shader.uniforms.uReflectorDiffColor){
		gl.uniform3fv(shader.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (shader.uniforms.uPlayerLightColor){
		gl.uniform3fv(shader.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(shader.uniforms.uReflectorPos, reflectorPosTransformed);
	if (shader.uniforms.uReflectorPosVShaderCopy){gl.uniform4fv(shader.uniforms.uReflectorPosVShaderCopy, reflectorPosTransformed);}
	gl.uniform1f(shader.uniforms.uReflectorCos, cosReflector);	
	
	performGeneralShaderSetup(shader);
	
	if (shader.uniforms.uDropLightPos){
		gl.uniform4fv(shader.uniforms.uDropLightPos, dropLightPos);
	}
}
function performCommon4vecShaderSetup(activeShaderProgram, wSettings, logtag){	//todo move to top level? are inner functions inefficient?
	({colorsSwitch,worldInfo, localVecFogColor, localVecReflectorColor, localVecReflectorDiffColor, reflectorPosTransformed, cosReflector, dropLightPos} = wSettings);

	if (logtag){
		document[logtag] = {about:"performCommon4vecShaderSetup", localVecFogColor:localVecFogColor, localVecReflectorDiffColor:localVecReflectorDiffColor, playerLight:playerLight, reflectorPosTransformed:reflectorPosTransformed, cosReflector:cosReflector, dropLightPos:dropLightPos};
	}

	if (activeShaderProgram.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader
		gl.uniform4fv(activeShaderProgram.uniforms.uCameraWorldPos, worldCamera.slice(12));
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uFogColor, localVecFogColor);
	if (activeShaderProgram.uniforms.uReflectorDiffColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uReflectorDiffColor, localVecReflectorDiffColor);
	}
	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPos, reflectorPosTransformed);
	if (activeShaderProgram.uniforms.uReflectorPosVShaderCopy){gl.uniform4fv(activeShaderProgram.uniforms.uReflectorPosVShaderCopy, reflectorPosTransformed);}
	gl.uniform1f(activeShaderProgram.uniforms.uReflectorCos, cosReflector);	
	gl.uniform4fv(activeShaderProgram.uniforms.uDropLightPos, dropLightPos);
	performGeneralShaderSetup(activeShaderProgram);
}
function drawDuocylinderObject(wSettings, duocylinderObj, zeroLevel, seaTime, depthMap){	
	var activeShaderProgram;
	//use a different shader program for solid objects (with 4-vector vertices, premapped onto duocylinder), and for sea (2-vector verts. map onto duocylinder in shader)
	if (!duocylinderObj.isSea){
		if (duocylinderObj.usesTriplanarMapping){	//means is voxTerrain.
			var selectedShaderSet = guiParams.display.perPixelLighting? (guiParams.display.voxNmapTest? 'triplanarPerPixel' : 'triplanarPerPixelTwoAndDiffuse' ) : 'triplanarColor4Vec';
			activeShaderProgram = shaderPrograms[selectedShaderSet][guiParams.display.atmosShader];
		}else{
			//activeShaderProgram = duocylinderObj.useMapproject? shaderPrograms.texmap4VecMapproject[ guiParams.display.atmosShader ] : shaderPrograms.texmap4Vec[ guiParams.display.atmosShader ] ;
			activeShaderProgram = duocylinderObj.useMapproject? ( guiParams.display.useSpecular? shaderPrograms.texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2Tex[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecMapprojectDiscardNormalmapVcolorAndDiffuse[ guiParams.display.atmosShader ] ) : ( guiParams.display.useSpecular? shaderPrograms.texmap4VecPerPixelDiscardPhong[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscard[ guiParams.display.atmosShader ]);
		}
		gl.useProgram(activeShaderProgram);
	}else{
		//activeShaderProgram = guiParams.display.perPixelLighting? ( guiParams.display.useSpecular? shaderPrograms.duocylinderSeaPerPixelDiscardPhong[ guiParams.display.atmosShader ] :shaderPrograms.duocylinderSeaPerPixelDiscard[ guiParams.display.atmosShader ]) : shaderPrograms.duocylinderSea[ guiParams.display.atmosShader ];
		activeShaderProgram = shaderPrograms.duocylinderSeaPerPixelDiscardPhongDepthAware[ guiParams.display.atmosShader ];
		gl.useProgram(activeShaderProgram);
		gl.uniform1f(activeShaderProgram.uniforms.uTime, seaTime);			
		gl.uniform1f(activeShaderProgram.uniforms.uZeroLevel, zeroLevel);
	}
		
	if (activeShaderProgram.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader
		gl.uniform4fv(activeShaderProgram.uniforms.uCameraWorldPos, worldCamera.slice(12));
	}
	gl.uniform4fv(activeShaderProgram.uniforms.uColor, colorArrs.white);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings);
	
	drawTennisBall(duocylinderObj, activeShaderProgram, depthMap);
}


var explosionParticles = (function(){
	//something containing set of position and direction of particles that will draw using shader.
	//each particle has 2 orthogonal 4-vectors, position at time t = position*cos(t) + direction*sin(t)
	
	var blockLen = 128;	//number of particles in an explosion.
	var numBlocks = 64;
	var blockStartTimes = new Array(numBlocks);
	var nextBlock = 0;
	var arrayLen = blockLen*numBlocks;	// = 8192
		//initial implementation - start all particles. later should store larger number of particles, update subset for new explosion
		//initially just use random direction/speed. should be able to make a particle explosion with a velocity, direction too though, with speeds that loop.
	
	var posnDirnsI16 = new Int16Array(blockLen*8);
	var colrsUI8 = new Uint8ClampedArray(blockLen*4);
	var posnDirnsGlBuffer;	//TODO can gl be got before get to this IIFE? 
	var colrsGlBuffer;
		//ideally buffers should be position, direction, positon, direction .... to reduce calls to buffer sub data.
	var blockOffs;
	
	var dirn=new Array(4);
	var newPosn=new Array(4);
	var newDirn=new Array(4);
	var dirvec3;

	return {
		makeExplosion: function makeExplosion(posn, time, colr, normalness){
			blockOffs = nextBlock*blockLen;
			blockStartTimes[nextBlock] = time;
			
			nextBlock = (nextBlock+1)%numBlocks;
			
			var mat = matForPos(posn);
			var time_angle = time*0.0005;	//this will change depending on shader cycle time. 
			var ct = Math.cos(time_angle);
			var st = Math.sin(time_angle);
			
			var ui8color = colr.map(elem=>Math.floor(elem*255));

			for (var pp=0;pp<blockLen;pp++){
				dirvec3 = randomNormalised3vec(normalness);	//get direction vector for time = 0
				//do a matrix multiplication. TODO use matrix methods to reduce code length!
				for (var bb=0;bb<4;bb++){
					dirn[bb]=0;
					for (var aa=0;aa<3;aa++){
						dirn[bb]+=dirvec3[aa]*mat[aa*4+bb];
					}
					
					//rotate position and direction such that newposn*cos(time_angle) + newdirn*sin(time_angle) = posn
					// newposn = posn*cos(time_angle) - dirn*sin(time_angle)
					// newdirn = dirn*cos(time_angle) + posn*sin(time_angle)
					newPosn[bb]=posn[bb]*ct - dirn[bb]*st;
					newDirn[bb]=dirn[bb]*ct + posn[bb]*st;
					
					//convert from float to int16. int16 runs from -32768 to 32767. TODO find out exactly how shader "normalisation" maps this back to -1 to 1. for other uses eg static objects this may matter much more. note "Due to OpenGL ES 2.0 / WebGL 1.0 platform differences, some implementations may decode signed normalized integers to floating-point values differently" https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization 
					
					newPosn[bb] = Math.min(32767,Math.max(-32768,Math.floor(newPosn[bb]*32767)));	//alternatively use Math.round. unsure which is more correct. https://www.khronos.org/opengl/wiki/Normalized_Integer "Alternate mapping". unclear whether applies. using uint and 2x-1 in vert shader would resolve uncertainty, or do some experiment to discern whether MIN, -MAX are equivalent etc
					newDirn[bb] = Math.min(32767,Math.max(-32768,Math.floor(newDirn[bb]*32767)));
				}
				posnDirnsI16.set(newPosn, 8*pp);
				posnDirnsI16.set(newDirn, 8*pp+4);
				colrsUI8.set(ui8color, 4*pp);
			}
			bufferArraySubDataGeneral(posnDirnsGlBuffer, blockOffs*16, posnDirnsI16);
			bufferArraySubDataGeneral(colrsGlBuffer, blockOffs*4, colrsUI8);
		},
		getBuffers: function getBuffers(){
			return {posns:posnDirnsGlBuffer, colrs:colrsGlBuffer}
		},
		getRangesToDraw: function getRangesToDraw(time){
			//since particle lifetimes fixed, and created in array, should be 0,1 or 2 contiguous ranges of particles that should draw.]
			//this is simple/easy method.
			// note: alternate method :set expiry time as shader variable, shrink vertices to point if expired. (could also use for hiding when will hit terrain))
			var activeRange = false;
			var ranges = [];
			for (var bb=0;bb<numBlocks;bb++){
				if ( (time - blockStartTimes[bb]) < 1000 ){	//block should be drawn
					if (!activeRange){
						activeRange = {start:bb*blockLen,number:0};
						ranges.push(activeRange);
					}
					activeRange.number+=blockLen;
				}else{
					activeRange=false;
				}
			}
			return ranges;
		},
		init: function init(){
			posnDirnsGlBuffer = gl.createBuffer();
			colrsGlBuffer = gl.createBuffer();
			//some initial data
			
			//seems like have to initialise GL buffer in entirety first. (is this necessary?).
			bufferArrayDataGeneral(posnDirnsGlBuffer, new Int16Array(arrayLen*8), 4);
			bufferArrayDataGeneral(colrsGlBuffer, new Uint8Array(arrayLen*4), 4);
			
			for (var bb=0;bb<numBlocks;bb++){
				this.makeExplosion([1,0,0,0],-10000,[1,1,1,1],0);	//fill arrays with some dummy data (is this necessary?) TODO stop this dummy data from rendering (disable depth write, make transparent? only draw active particles?
			}
		}
	}
})();


var randomNormalised3vec = (function generate3vecRandomiser(){

	var numArrs = 128;	//ensure power of 2
	var bitwiseOr = numArrs-1;

	var vecArrs = new Array(numArrs);
	for (var ii=0;ii<numArrs;ii++){
		vecArrs[ii]=new Array(3);
	}
	var nextArrId = 0;

	return function randomNormalised3vec(normalness=1){	
			//TODO precalculate?, if still want control over normalness, can precalc all but that last step.
		var vec=vecArrs[nextArrId++];
		nextArrId = nextArrId && bitwiseOr;
		var lensq=0;
		for (var cc=0;cc<3;cc++){
			var thisElem = Math.random()+Math.random()-1;	//add lots of these to approach gaussian
			vec[cc] = thisElem;	
			lensq+=thisElem*thisElem;
		}
		var len = Math.sqrt(lensq);
		//len = normalness*len + (1-normalness);	
		len = 1 + normalness*(len-1);
		
		//return vec.map(elem=>elem/len);	//creates a new array
		for (var cc=0;cc<3;cc++){
			vec[cc]/=len;
		}
		return vec;
	}
})();