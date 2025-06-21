var shouldDumpDebug = false;
var quadplane={	//temp...
	fx:5,
	fy:0.9,
	xadjust:0.6,
	yadjust:0.35	//maybe initial settings unused
};
var shaderPrograms={};
var debugPortalInfo = {};
var havePrerenderedCentredCubemaps=false;
var shaderProgramColored,	//these are variables that are set to different shaders during running, but could just as well go inside shaderPrograms.
	shaderProgramColoredBendy,
	shaderProgramTexmap;	//but keeping separate for now so know that all shaderPrograms.something are unchanging

var myDebugStr = "TEST INFO TO GO HERE";

var duocylinderObjects={
	grid:{divs:4,step:Math.PI/2},
	terrain:{divs:2,step:Math.PI},
	procTerrain:{divs:1,step:2*Math.PI,isStrips:true},
	sea:{divs:1,step:2*Math.PI,isStrips:true},
	voxTerrain:{divs:2,step:Math.PI},
	voxTerrain2:{divs:2,step:Math.PI},
	voxTerrain3:{divs:2,step:Math.PI}
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
var cubeFrameBvh={}
var cubeFrameSubdivBuffers={};
var octoFrameBuffers={};
var octoFrameSubdivBuffers={};		
var tetraFrameBuffers={};
var tetraFrameSubdivBuffers={};		
var dodecaFrameBuffers={};
var dodecaFrameBuffers2={};	//without outer faces cut off
var dodecaFrameBvh2={};
var teapotBuffers={};
var teapotBvh={};
var pillarBuffers={};
var pillarBvh={}
var sshipBuffers={};
var gunBuffers={};
var gunBvh={};
var su57Buffers={};
var frigateBuffers={};
var icoballBuffers={};
var hyperboloidBuffers={};
var meshSphereBuffers={};
var buildingBuffers={};
var lucyBuffers={};
var lucyBvh={};
var mushroomBuffers={};
var mushroomBvh={};
var octoFractalBuffers={};
var bridgeBuffers={};
var bridgeBvh={}
var thrusterBuffers={};

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

//var maxRandBoxes = 8192;
var maxRandBoxes = 128;	//tmp smaller to make startup faster?
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
	
	Object.keys(voxTerrainData).forEach(x=>{
		loadGridData(voxTerrainData[x]);	//TODO don't do this... - different shader like sea - either don't precalc 4-vec mapping, or store 3vec co-ords 
		loadDuocylinderBufferData(duocylinderObjects[x], voxTerrainData[x]);
	});
	
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
	var dodecaFrameBlenderObject2 = loadBlenderExport(dodecaFrameData.meshes[0]);	

	var teapotObject = loadBlenderExport(teapotData);	//isn't actually a blender export - just a obj json
	var icoballObj = loadBlenderExport(icoballdata);

	//loadBufferData(sphereBuffers, makeSphereData(16,32,1));
	loadBufferData(sphereBuffers, makeOctoSphereData(4));

	//loadBufferData(sphereBuffersHiRes, makeSphereData(127,255,1)); //near index limit 65536.
	loadBufferData(sphereBuffersHiRes, makeOctoSphereData(64));

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
	loadBufferData(dodecaFrameBuffers2, dodecaFrameBlenderObject2);
	loadBufferData(teapotBuffers, teapotObject);

	//generate bounding volume heirarchy for teapot triangles.
	createBvhFrom3dObjectData(teapotObject, teapotBvh);
	createBvhFrom3dObjectData(cubeFrameBlenderObject, cubeFrameBvh);
	createBvhFrom3dObjectData(dodecaFrameBlenderObject2, dodecaFrameBvh2);
	
	loadBufferData(icoballBuffers, icoballObj);
	loadBufferData(hyperboloidBuffers, hyperboloidData);
	
	loadBuffersFromObj2Or3File(pillarBuffers, "./data/pillar/pillar.obj2", (bufferObj, sourceData) =>{
		loadBufferData(bufferObj, sourceData);
		createBvhFrom3dObjectData(sourceData, pillarBvh);
	});
	loadBuffersFromObj2Or3File(sshipBuffers, "./data/spaceship/sship-pointyc-tidy1-uv3-2020b-cockpit1b-yz-2020-10-04.obj2", loadBufferData);

	loadBuffersFromObj2Or3File(gunBuffers, "./data/cannon/cannon-pointz-yz.obj2", (bufferObj, sourceData) => {
		loadBufferData(bufferObj, sourceData);
		createBvhFrom3dObjectData(sourceData, gunBvh);
		someObjectMatrices.forEach(someMat => {
			var scale = 0.1;
			bvhObjsForWorld[3].push({
				mat: someMat.mat, 
				transposedMat: someMat.transposedMat, 
				bvh: gunBvh,
				aabb4d: aabb4DForSphere(someMat.mat.slice(12), scale*gunBvh.boundingSphereRadius),
				scale
			});
		});
	});

	loadBuffersFromObj2Or3File(su57Buffers, "./data/miscobjs/t50/su57yz-4a.obj2", loadBufferData);
	loadBuffersFromObj2Or3File(frigateBuffers, "./data/frigate/frigate.obj2", loadBufferData);

	loadBuffersFromObjFile(meshSphereBuffers, "./data/miscobjs/mesh-sphere.obj", loadBufferData);
	loadBuffersFromObj5File(buildingBuffers, "./data/miscobjs/menger-texmap2.obj5", loadBufferData, 6);
	loadBuffersFromObj5File(lucyBuffers, "./data/miscobjs/lucy-withvertcolor.obj5", (bufferObj, sourceData) => {
		loadBufferData(bufferObj, sourceData);
		createBvhFrom3dObjectData(sourceData, lucyBvh, 6);
		someObjectMatrices.slice(0,3).forEach(someMat => {
			var scale = 0.0016;
			bvhObjsForWorld[1].push({
				mat: someMat.mat, 
				transposedMat: someMat.transposedMat, 
				//bvh:cubeFrameBvh,
				//scale:0.4
				bvh: lucyBvh,
				aabb4d: aabb4DForSphere(someMat.mat.slice(12), scale*lucyBvh.boundingSphereRadius),
				scale
			});
		});
	}, 6);

	loadBuffersFromObj5File(mushroomBuffers, "./data/miscobjs/Pleurotus_eryngii-2-in-a-new-blend-file.obj5", (bufferObj, sourceData) => {
			loadBufferData(bufferObj, sourceData);
			createBvhFrom3dObjectData(sourceData, mushroomBvh, 6);
			someObjectMatrices.slice(4).forEach(someMat => {
				var scale = 0.025;
				bvhObjsForWorld[1].push({
					mat: someMat.mat, 
					transposedMat: someMat.transposedMat, 
					bvh: mushroomBvh,
					aabb4d: aabb4DForSphere(someMat.mat.slice(12), scale*mushroomBvh.boundingSphereRadius),
					scale
				});
			});
		}, 6);


	loadBuffersFromObj2Or3File(octoFractalBuffers, "./data/miscobjs/fractal-octahedron4.obj3", loadBufferData, 6);

	loadBuffersFromObj2Or3File(bridgeBuffers, "./data/miscobjs/bridgexmy2.obj3", (bufferObj, sourceData) => {
		loadBufferData(bufferObj, sourceData);
		createBvhFrom3dObjectData(sourceData, bridgeBvh, 6);
	}, 6);

	loadBuffersFromObj2Or3File(thrusterBuffers, "./data/miscobjs/thrusters-with-normals-and-vcolor.obj3", loadBufferData, 6);


	//now bvhs ready, create the following which references them.
	bvhObjsForWorld[0]=someObjectMatrices.map(someMat => {
		var scale = 0.4;
		return {
			mat: someMat.mat, 
			transposedMat: someMat.transposedMat, 
			bvh: teapotBvh,
			aabb4d: aabb4DForSphere(someMat.mat.slice(12), scale*teapotBvh.boundingSphereRadius),
			scale
		};
	});

	bvhObjsForWorld[2]=someObjectMatrices.map(someMat => {
		var scale = 0.2;
		return {
			mat: someMat.mat, 
			transposedMat: someMat.transposedMat, 
			bvh:dodecaFrameBvh2,
			aabb4d: aabb4DForSphere(someMat.mat.slice(12), scale*dodecaFrameBvh2.boundingSphereRadius),
			scale
		};
	});

	//TODO array for each object type? include direct reference to rendering info (instead of matching bvh later)





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
	
	randBoxBuffers.randMatrixBuffers = glBufferMatrixUniformDataForInstancedDrawing(randomMats);

	randBoxBuffers.forTerrain={};
	randBoxBuffers.forTerrain['procTerrain']=glBufferMatrixUniformDataForInstancedDrawing(procTerrainSurfaceParticleMats);
	Object.keys(voxTerrainData).forEach(x=>{
		randBoxBuffers.forTerrain[x] = glBufferMatrixUniformDataForInstancedDrawing(voxTerrainData[x].surfaceParticleMats);
	});

	//not done inside method to create box info since gl doesn't exist yet.
	createBuffersForInstancedDrawingFromList(duocylinderBoxInfo.viaducts);
	createBuffersForInstancedDrawingFromList(duocylinderBoxInfo.viaducts2);
	
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
	
	for (var ww=0;ww<guiParams.worlds.length;ww++){
		explosionParticleArrs[ww].init();
	}
}

var reflectorInfoArr=[];
for (var ii=0;ii<4;ii++){	//TODO how to cope with variable portal numbers? just assign max? (fixed number supported by shader)
	reflectorInfoArr.push({
		centreTanAngleVectorScaled:[0,0,0],
		rad:0.5
	});
}

function calcReflectionInfo(toReflect,resultsObj, reflectorRad){
	//use player position directly. expect to behave like transparent
	var cubeViewShift = [toReflect[12],toReflect[13],toReflect[14]];	
	var magsq = 1- toReflect[15]*toReflect[15];
		//note can just fo 1-w*w, or just use w!
	
	//console.log("w: " + playerCamera[15]);
	var angle = Math.acos(toReflect[15]);	//from centre of portal to player
	var reflectionCentreTanAngle = 	reflectorRad/ ( 2 - ( reflectorRad/Math.tan(angle) ) );
		//note could do tan(angle) directly from playerCamera[15] bypassing calculating angle		

	var mag = Math.sqrt(magsq);
	//var correctionFactor = -angle/mag;
	
	var polarity = guiParams.reflector.isPortal? -1:1;
	var correctionFactor = -polarity * Math.atan(reflectionCentreTanAngle)/mag;
	var cubeViewShiftAdjusted = cubeViewShift.map(function(val){return val*correctionFactor});
	var cubeViewShiftAdjustedMinus = cubeViewShiftAdjusted.map(val => -polarity*val);
	//reflectorInfo.polarity=polarity;	
	resultsObj.polarity=polarity;	//??
	
	//position within spherical reflector BEFORE projection
	var correctionFactorB = reflectionCentreTanAngle/mag;
	correctionFactorB/=reflectorRad;
	resultsObj.centreTanAngleVectorScaled = cubeViewShift.map(val => -val*correctionFactorB);

	var reflectShaderMatrix = mat4.identity();
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
		"far 3rd person":[0,-60,-85],
		"really far 3rd person":[0,-75,-125],
		"cockpit":[0,0,15],
		"side":[30,0,12.5],
		"none":[0,0,0]
	}
	var targetForTypeReverse = {
		"near 3rd person":[0,-37.5,25],
		"mid 3rd person":[0,-37.5,37.5],
		"far 3rd person":[0,-100,150],
		"really far 3rd person":[0,-75,125],
		"cockpit":[0,0,-50],
		"side":[30,0,12.5],
		"none":[0,0,0]
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

	cubemapViewCache.clearCache();	//NOTE putting here breaks stereo 3d through portals (will reuse 1st eye)

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
	uniform4fvSetter.storeAndResetStats();
	stats.end();
	stats.begin();
	
	smoothGuiParams.update();

	//TODO button press to show/hide map
	//TODO pause gameplay when show map?
	if (guiParams.map.show){
		drawMapScene(frameTime);
	}else{
		drawRegularScene(frameTime);
	}
}

var logMapStuff=false;
var drawMapScene = (function(){
	
	//create a camera view for viewing map from.
	var mapCameraView = mat4.create();

	var spunMapCamera = mat4.create();

	var mapCameraPMatrix = mat4.create();

	var playerI, playerJ, playerMapAngle, playerIWithDuocylinderSpin;

	return function(frameTime){
		//draw a map
		//initially just the current world 3-sphere unwrapped into a fat tetrahedron, so duocylinder terrains appear flat.
		//NOTE descent-alikes have a map view like paused god-mode with wireframe shader etc, otherwise like rest of game.
		//perhaps that's preferable to current unwrapped world idea. Perhaps can have smooth transition between mappings.
		//TODO option to scroll map such that player in middle
		//TODO ability to rotate map
		//TODO ortho option
		//TODO square stack option, perhaps scaling with current height (TODO show what's above/below neatly
		//TODO render terrain
		//TODO render actual meshes on map (not just point)

		mat4.identity(mapCameraView);
			//since this map view in regular 3d space, can use standard matrix methods instead of custom
		mat4.translate(mapCameraView, [0,0,-guiParams.map.viewDistance]);
		mat4.rotateX(mapCameraView, -Math.PI/4);	//elevate camera 45 deg

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);	//draw to screen (null)
		gl.viewport(0, 0, gl.viewportWidth,gl.viewportHeight);

		var worldToDrawMapFor = playerContainer.world;

		updatePlayerIJ(
			playerContainer.matrix.slice(12),
			playerContainer.matrix.slice(8,12),
			guiSettingsForWorld[worldToDrawMapFor].spin
		);
		gl.clearColor.apply(gl,worldColorsPlain[worldToDrawMapFor]);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mapCameraPMatrix = mat4.perspective(100, gl.viewportWidth/gl.viewportHeight, 0.01, 10);	//TODO only set this on viewport change.
		mat4.set(mapCameraPMatrix, pMatrix);

		
		mat4.set(mapCameraView, spunMapCamera);
		//var mapZRotation = (frameTime/5000) % (2*Math.PI);	//TODO rotate view with player.
		mat4.rotateZ(spunMapCamera, playerMapAngle);


		if (logMapStuff){console.log({"mssg":"pMatrix for map", pMatrix})}

		gl.cullFace(gl.BACK);
		gl.depthFunc(gl.LESS);

		var activeProg = shaderPrograms.threeSpaceColored;
		gl.useProgram(activeProg);
		enableDisableAttributes(activeProg);

		//draw some things mapped onto this space. initially just display coloured spheres for points. then do distortion in shader.
		
		ringCells.forEach(ring => 
			ring.mats.forEach(mat => 
				drawMapPointForFourVec(mat.slice(12), ring.color, 0.015)
		));

		//grid in middle
		var root2 = Math.sqrt(2);
		for (var ang1=0;ang1<360;ang1+=15){
			var angRadians = Math.PI*ang1/180;
			for (var ang2=0;ang2<360;ang2+=15){
				var ang2Radians = Math.PI*ang2/180;
				var fourPos = [Math.cos(angRadians),Math.sin(angRadians),Math.cos(ang2Radians),Math.sin(ang2Radians)].map(xx=>xx/root2);
				drawMapPointForFourVec(fourPos, colorArrs.darkGray, 0.015);
			}
		}

		
		//drawMapPointForFourVec(playerCamera.slice(12), colorArrs.white, 0.02);
		//drawMapPointForFourVec(buildingMatrix.slice(12), colorArrs.red, 0.04);
		
		//activeProg = shaderPrograms.mapShaderOne;
		activeProg = guiParams.map.shader == "two" ? shaderPrograms.mapShaderTwo : shaderPrograms.mapShaderOne;
		gl.useProgram(activeProg);
		enableDisableAttributes(activeProg);

		var mapDrawShader = guiParams.map.shader == "two" ? drawMapObject2 : drawMapObject1;

		// ringCells.forEach(ring => 
		// 	ring.mats.forEach(mat => 
		// 		drawMapObject2(mat, ring.color, cubeBuffers, 0.1, false)
		// ));

		//TODO maybe shop be sship matrix (not camera, and map should be centred on player not camera.)
		mapDrawShader(playerCamera, colorArrs.white, sphereBuffers, 0.1, false);
		mapDrawShader(buildingMatrix, colorArrs.red, buildingBuffers, 0.01*guiParams.drawShapes.buildingScale, true);
		mapDrawShader(octoFractalMatrix, colorArrs.gray, octoFractalBuffers, 0.01*guiParams.drawShapes.octoFractalScale, true);

		bvhObjsForWorld[worldToDrawMapFor].forEach(bvhObj => {
			//drawMapPointForFourVec(bvhObj.mat.slice(12), colorArrs.gray, 0.03);
			mapDrawShader(bvhObj.mat, colorArrs.gray, cubeBuffers, 0.03, false);
				//NOTE can't just use bvhObj.scale because depends on mesh data.
				//if bounding sphere rad were a property (or bvh mesh which contains bounding sphere) could use that.
		});

		portalsForWorld[worldToDrawMapFor].forEach(portal => {
			var pColor = worldColors[portal.otherps.world];
			//var pPos = portal.matrix.slice(12);
			var pRad = portal.shared.radius;	//NOTE not necessarily to scale when rendered in map
			//drawMapPointForFourVec(pPos, pColor, pRad);
			mapDrawShader(portal.matrix, pColor, sphereBuffers, pRad, false);
		});

		logMapStuff=false;

		function drawMapPointForFourVec(fourVec, color, rad){
			drawMapPointAtPosition(pos4ToMapPos3(fourVec), color, rad);
		}

		//TODO instanced, or don't prep all uniforms when drawing many points of same colour etc.
		function drawMapPointAtPosition(threePos, color, rad){

			//set mvMatrix given the 3pos. would be simpler to just take 3pos into the shader?
			mat4.set(spunMapCamera, mvMatrix);

			mat4.translate(mvMatrix, threePos);


			//mat4.rotate(mvMatrix, 0,0,1, 10);//??	appears to not work. TODO find how to read the docs for whatever
									// version of glmatrix is being used!!!!
			//mat4.rotateZ(mvMatrix, 0.1);	//having here rotates to object itself, not the view.

			if (logMapStuff){console.log({"mssg":"map draw ", threePos, mvMatrix})}

			gl.uniform3fv(activeProg.uniforms.uModelScale, [rad,rad,rad]);
			uniform4fvSetter.setIfDifferent(activeProg, "uColor", color);
			drawObjectFromBuffers(cubeBuffers, activeProg)
		}

		//drawing object on map "properly"
		//1) simple but likely broken version - put player and object mats as input,
		//transform each point independently. expect to break on edge of map when verts on opposite sides.

		function drawMapObject1(objMatrix, color, objBuffers, objScale, attachedToDuocylinder){
			//things that should only need to set once per frame. optimise if use this shader
			mat4.set(spunMapCamera, mvMatrix); //this is matrix of the map in camera viewing the map
			gl.uniform1f(activeProg.uniforms.uBendFactor, guiParams.map.bendFactor);
			gl.uniform2f(activeProg.uniforms.uMapCentreAngleCoords, attachedToDuocylinder?playerIWithDuocylinderSpin:playerI , playerJ);

			gl.uniform3fv(activeProg.uniforms.uModelScale, [objScale,objScale,objScale]);
			uniform4fvSetter.setIfDifferent(activeProg, "uColor", color);
			mat4.set(objMatrix, mMatrix);	//this is matrix describing object pose in world. drawObjectFromBuffers will send it to v shader
			drawObjectFromBuffers(objBuffers, activeProg);
		}

		//2) draw points relative to fixed object centre point on map. still a problem that whole object will jump 
		// across map when centre of object does. for small objects this is OK.

		function drawMapObject2(objMatrix, color, objBuffers, objScale, attachedToDuocylinder){
			var objCentreMapAngleCoords = mapAngleCoordsForFourVec(objMatrix.slice(12));
			var cameraMapAngleCoords = [attachedToDuocylinder?playerIWithDuocylinderSpin:playerI , playerJ];

			var relativeMapAngleCoords = [
				objCentreMapAngleCoords[0] - cameraMapAngleCoords[0],
				objCentreMapAngleCoords[1] - cameraMapAngleCoords[1]
			].map(xx=> minusPiToPiWrap(xx));
			//^^ could do this in vert shader.

			mat4.set(spunMapCamera, mvMatrix); //this is matrix of the map in camera viewing the map
			gl.uniform1f(activeProg.uniforms.uBendFactor, guiParams.map.bendFactor);
			gl.uniform2fv(activeProg.uniforms.uObjCentreAngleCoords, objCentreMapAngleCoords);
			gl.uniform2fv(activeProg.uniforms.uObjCentreRelativeToCameraAngleCoords, relativeMapAngleCoords);

			gl.uniform3fv(activeProg.uniforms.uModelScale, [objScale,objScale,objScale]);
			uniform4fvSetter.setIfDifferent(activeProg, "uColor", color);
			mat4.set(objMatrix, mMatrix);	//this is matrix describing object pose in world. drawObjectFromBuffers will send it to v shader
			drawObjectFromBuffers(objBuffers, activeProg);
		}

		//3) draw 4 copies of object if necessary (close to map edge).
		
		//4) discard pixels outside the map shape.
		
		//5) draw 4 objects routinely, find position of object relative to player, 
		// modulo 2*PI (from 0 to 2*PI). draw shifted by (0 or -2*PI) each axis.
		// this way can draw a lot of same type of item using 4 instanced draw calls.

		//do for:
		//standard objects, various terrains.
		// possibly want to have lower detail versions of objects, though expect not a big problem (game draw cubemaps, quad view,
		// so drawing lots of verts anyway)

	}

/*
(x,y,z,w) world coords

middle of duocylinder at the top. x=y=0

plane in middle. x^2+y^2 = 0.5, z^2+w^2 = 0

middle of underworld duocylinder at bottom. z=w=0

Z - something like atan2( len(x,y), len(z,w))
X - something like atan2(x,y)*len(x,y)
Y - something like atan2(z,w)*len(z,w)

=>
at top, 	x=y=0, len(x,y)=0, len(z,w)=1 => X=0, Y from -PI to PI
in middle. len(x,y)=root(0.5), len(z,w)=root(0.5) => Z,Y from -PI/root2 to PI/root2
at bottom, 	z=w=0, len(x,y)=1, len(z,w)=0 => X from -PI to PI, Y=0

basically set of stack of rectangles forming bloated tetrahedron that looks like a circle viewed from above. 
can fit these inside a stubby cylinder with height equal to length. the corners of the rectangles form a helix.

mapping objects onto this shape is tricky, especially on the points along the duocylinder axes, unless store as a special object designed to unwrap like this, with points, edges along the duocylinder centreline, or just accept that objects will be displayed as surfaces rather than solid in this case.
for points horizontally wrapping on landscape, might acheive good display by having up to 4 copies of object/ landscape where crosses edges, and discarding pixels outside the cylinder.
small mobile objects like the player might be just displayed as simple points.
ideally should present texture mapping, lighting etc, but simple greybox/ position=colour shading should show example.
possible want to display as semitransparent. Perhaps good use of Order Independent Transparency.
NOTE that landscapes that actually wrap around without stitching would be a problem for map, but IIRC avoided this anyway because of how automatic ddx, ddy texture mapping works ( hope didn't solve this with custom sampling!!)
for initial version, don't scroll map, so only need 1 copy of landscape.
initial version with just landscape and player point, coloured portals sensible.
in order to draw stuff like boxes, guess scene object list/graph is sensible.
*/
	function minusPiToPiWrap(inputNumber){	//because javascript doesn't do mod! https://stackoverflow.com/a/4467559
		var tau = 2*Math.PI;
		return ((((inputNumber+Math.PI) % tau) + tau) % tau) - Math.PI;
	}

	function updatePlayerIJ(playerPos, playerForward, duocylinderSpin){
		var squaredPos = playerPos.map(xx=>xx*xx);
		playerI = Math.atan2(playerPos[0],playerPos[1]);
		playerJ = Math.atan2(playerPos[2],playerPos[3]);

		//modify by duocylinderSpin. (TODO apply only to objects that move with duocylinder)
		playerIWithDuocylinderSpin=minusPiToPiWrap(playerI+duocylinderSpin);

		//calculation of player heading?
		//obvious way is to take player position, take player direction (halfway around world), add small amount of that to
		//player pos, put that on the map, and look at angle between
		
		// however may be a neat way to do this
		// according to https://www.wolframalpha.com/input?i=derivative+of+atan2%28y%2Cx%29,
		// there's a neater formulation though - want something like
		// d/dx(tan^(-1)(x, y)) = -y/(x^2 + y^2)
		// d/dy(tan^(-1)(x, y)) = x/(x^2 + y^2)

		var lenxy = Math.sqrt( squaredPos[0]+squaredPos[1]);
		var lenzw = Math.sqrt( squaredPos[2]+squaredPos[3]);

		//for playerI (X on map, but "I" to reduce confusion)
		// rate of change of playerI with respect to playerPos[0] is -playerPos[1]/(lenxy)
		// rate of change of playerI with respect to playerPos[1] is playerPos[0]/(lenxy)

		var playerIRateOfChange = (playerForward[1]*playerPos[0] - playerForward[0]*playerPos[1])/lenxy;
		var playerJRateOfChange = (playerForward[3]*playerPos[2] - playerForward[2]*playerPos[3])/lenzw;
			//this is rate of change of I,J, but suspect should scale by aspect of unwrapped duocylinder terrain at player's height
			//however, seems to work pretty well as is, even when not at height 0. perhaps correct!

		playerMapAngle = Math.atan2(playerIRateOfChange, playerJRateOfChange);
	}

	function pos4ToMapPos3(fourVec){
		var squaredPos = fourVec.map(xx=>xx*xx);
		var lenxy = Math.sqrt( squaredPos[0]+squaredPos[1]);
		var lenzw = Math.sqrt( squaredPos[2]+squaredPos[3]);
		var xOut = minusPiToPiWrap(Math.atan2(fourVec[0],fourVec[1])-playerI)* lenxy;
		var yOut = minusPiToPiWrap(Math.atan2(fourVec[2],fourVec[3])-playerJ)* lenzw;
		var zOut = Math.atan2( lenzw, lenxy);

		//retain some pringle curvature to reduce map distortion, make more readable.
		// perhaps circular curvature is better, but to first order, parabolic/cubic should be equivalent
		// perhaps can do better by different curvatures for different z. 

		var bendFactor = guiParams.map.bendFactor;
		var multiplier1 = bendFactor*bendFactor/2;
		var multiplier2 = bendFactor*multiplier1/3;	//could be about right amount would like terrain dots evenly spaced on map. would like corners to be 90deg
			//guess cos ~ 1 - (1/2)*(bx)^2. sin ~ x + (1/6)(bx)^3 
		var bend = multiplier1*(xOut*xOut - yOut*yOut);
		zOut += bend;
		xOut -= multiplier2*xOut*bend;
		yOut += multiplier2*yOut*bend;

		return [xOut, yOut, zOut];
	}

	function mapAngleCoordsForFourVec(fourVec){
		return [Math.atan2(fourVec[0],fourVec[1]), Math.atan2(fourVec[2],fourVec[3])].map(xx=>minusPiToPiWrap(xx));
	}
})();


function drawRegularScene(frameTime){

	//TODO split out screen rendering into function. if stereo3d is enabled, call twice.
	//initially can just check breaking out releant code to function works.
	//then can draw same thing twice
	//then can get camera matrices shifted sideways.
	//also should, for fisheye view, reduce size of intermediate buffer (rectilinear projection)
	
	offsetCameraContainer.world = playerContainer.world;
	
	if (guiParams.display.cameraAttachedTo == "player vehicle"){
		setMat4FromToWithQuats(playerCameraInterp, offsetPlayerCamera);	
		//mat4.set(playerCamera, offsetPlayerCamera);	
		
		offsetCam.setType(guiParams.display.cameraType);
		moveMatHandlingPortal(offsetCameraContainer, offsetCam.getVec())
	}


	//TODO put this elsewhere - assumes some stuff is in scope though!
	//TODO defer to later (if large number of worlds/portals to make rendering, storing all impractical)
	//TODO render portal view for viewing from another portal - eg if looking through portal A then B, render view from portal B far side, for camera position in portal B
	// correct for viewing from centre of portal A. (only useful if portal A is within portal B's accurate draw range)
	if (!havePrerenderedCentredCubemaps){
		for (var iter=0;iter<2;iter++){
			for (var worldIdx =0; worldIdx< portalsForWorld.length;worldIdx++){
				var portalsInfo = portalsForWorld[worldIdx];
				for (var portalIdx = 0; portalIdx < portalsInfo.length ; portalIdx++ ){
					var portal = portalsInfo[portalIdx];
					drawCentredCubemap(portal, true);
				}
			}
		}
		havePrerenderedCentredCubemaps=true;
	}



	var portalsForThisWorldX = portalsForWorld[offsetCameraContainer.world];
	for (var ii=0;ii<portalsForThisWorldX.length;ii++){
		reflectorInfoArr[ii].rad = guiParams.reflector.draw!="none" ? portalsForThisWorldX[ii].shared.radius : 0;	//when "draw" off, portal is inactivate- can't pass through, doesn't discard pix
	}

	switch(guiParams.display.stereo3d ) {
		case 'anaglyph':
		case 'anaglyph-green/magenta':
			//note this draws to an intermediate buffer that is twice screen size (containing left, right eyes.)
			//and then draws from both of these to the screen.
			//this could be done in fewer steps, and combined with other steps (eg fisheye mapping), with additive
			//rendering to draw straight to screen with weights for left, right eyes (eg left = mostly red, some negative
			//green to offset red-> green cross-talk etc.
			// for now just do simple/inefficient way, then decide if worth improving.
			setRttSize(rttAnaglyphIntermediateView, gl.viewportWidth*2,gl.viewportHeight);	//TODO is squarer better?
			drawStereoPair(
				{left:0,top:0,width:gl.viewportWidth,height:gl.viewportHeight},
				{left:gl.viewportWidth,top:0,width:gl.viewportWidth,height:gl.viewportHeight},

				//{left:0,top:0,width:gl.viewportWidth/2,height:gl.viewportHeight/2},
				//{left:gl.viewportWidth/2,top:gl.viewportHeight/2,width:gl.viewportWidth/2,height:gl.viewportHeight/2},

				rttAnaglyphIntermediateView.framebuffer 
			);
			// map to final screen.
			//this copypasted from end of startStageRender()

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);	//draw to screen (null)
			gl.viewport(0, 0, gl.viewportWidth,gl.viewportHeight);
			bind2dTextureIfRequired(rttAnaglyphIntermediateView.texture);

			activeProg = guiParams.display.stereo3d == 'anaglyph'?
				shaderPrograms.fullscreenTexturedAnaglyph:
				shaderPrograms.fullscreenTexturedAnaglyphGm;
			gl.useProgram(activeProg);
			enableDisableAttributes(activeProg);
			gl.cullFace(gl.BACK);
			gl.uniform1i(activeProg.uniforms.uSampler, 0);		
			gl.depthFunc(gl.ALWAYS);		
			drawObjectFromBuffers(fsBuffers, activeProg);
			gl.depthFunc(gl.LESS);

			break;
		case 'top-bottom':
			//basic left/right shifted cameras
			//no centre of perspective shift (rotate cameras inward by eyeTurnIn is not ideal)
			//TODO shift x-hairs when using turn in or persp shift (eye x-hairs appear to be at screen depth)
			drawStereoPair(
				{left:0,top:gl.viewportHeight/2,width:gl.viewportWidth,height:gl.viewportHeight/2}, //TOP
				{left:0,top:0,width:gl.viewportWidth,height:gl.viewportHeight/2},
				null
			);
			break;
		case 'sbs':
			drawStereoPair(
				{left:0,top:0,width:gl.viewportWidth/2,height:gl.viewportHeight},					//LEFT
				{left:gl.viewportWidth/2,top:0,width:gl.viewportWidth/2,height:gl.viewportHeight},
				null
			);
			break;
		case 'sbs-cross':
			drawStereoPair(
				{left:gl.viewportWidth/2,top:0,width:gl.viewportWidth/2,height:gl.viewportHeight},
				{left:0,top:0,width:gl.viewportWidth/2,height:gl.viewportHeight},
				null
			);
			break;
		case 'off':
		default:
			//TODO ensure quad view also works for stereo mode
			//TODO ensure resolution of rectilinear image is appropriate for small quadrant
			//TODO prepare this elsewhere (array of func args?)
			drawSingleOrQuadViews({left:0,top:0,width:gl.viewportWidth,height:gl.viewportHeight}, null);
	}

	function drawStereoPair(viewportL, viewportR, outputFb){
		var savedCam = newIdMatWithQuats();
		setMat4FromToWithQuats(offsetPlayerCamera, savedCam);

		var savedWorld = offsetCameraContainer.world;
		moveMatHandlingPortal(offsetCameraContainer, [guiParams.display.eyeSepWorld,0,0]);
		xyzrotate4mat(offsetPlayerCamera, [0,-guiParams.display.eyeTurnIn,0]);
		drawSingleOrQuadViews(viewportL, outputFb);

		setMat4FromToWithQuats(savedCam, offsetPlayerCamera);
		offsetCameraContainer.world = savedWorld;
		moveMatHandlingPortal(offsetCameraContainer, [-guiParams.display.eyeSepWorld,0,0]);
		xyzrotate4mat(offsetPlayerCamera, [0,guiParams.display.eyeTurnIn,0]);

		cubemapViewCache.clearCache();	//TODO only clear for nearest portals?

		drawSingleOrQuadViews(viewportR, outputFb);
		//note inefficient currently, since does full screen full render for each eye view.
		// for top/down split, intermediate render targets could be half screen size
		// some rendering could be shared between eyes - eg portal cubemaps.
	}

	function drawSingleOrQuadViews(viewrect, outputFb){

		mat4.set(offsetPlayerCamera, worldCamera);

		mainCamZoom = guiParams.display.cameraZoom;
		var aspectRatio = gl.viewportWidth/gl.viewportHeight;

		//TODO update only when required
		setProjectionMatrix(nonCmapPMatrix, mainCamZoom, 1/aspectRatio, guiParams.display.uVarOne);	//note mouse code assumes 90 deg fov used. TODO fix.
		setQuadViewProjMatrices(quadViewMatrices, mainCamZoom, 1/aspectRatio);	//only necessary if quad view selected

		updateFovVals();

		if (reverseCamera){
			nonCmapPMatrix[0]=-nonCmapPMatrix[0];
			quadViewMatrices.forEach(mm=>{
				mm[0]=-mm[0];
				mm[1]=-mm[1];
				mm[2]=-mm[2];
				mm[3]=-mm[3];
			});
			xyzrotate4mat(worldCamera, (guiParams.display.flipReverseCamera? [Math.PI,0,0]:[0,Math.PI,0] ));	//flip 180  - note repeated later. TODO do once and store copy of camera
			//TODO check this works once have quad view camera working (perhaps other signs should be flipped...)
		}


		if (guiParams.display.quadView){
			drawQuadViewsToScreen(offsetPlayerCamera, viewrect, outputFb);	//?? camera should be reversed??
			mat4.set(nonCmapPMatrix, pMatrix);
			drawHud();
		}else{
			setRttSize( rttStageOneView, viewrect.width, viewrect.height );
			setRttSize( rttView, viewrect.width, viewrect.height );

			var initialViewRect = {left:0, top:0, width:viewrect.width, height:viewrect.height}

			startStageRender(nonCmapPMatrix, offsetPlayerCamera, rttStageOneView, initialViewRect);
			var penultimateRenderer = penultimateStageRenderFunc(rttStageOneView, rttView);

			penultimateRenderer.renderFunc(initialViewRect);
			lastStageRender(viewrect, penultimateRenderer.outBuffer, outputFb);
			drawHud();
		}
	}

	function drawQuadViewsToScreen(camera, viewrect, outputFb){
		var initialViewRect = {left:0, top:0, width:viewrect.width, height:viewrect.height};

		var quadrantsize = [viewrect.width/2, viewrect.height/2];
		var quadrants = 
		[{left:0,top:0,width:quadrantsize[0],height:quadrantsize[1]},							//bottom left
		{left:quadrantsize[0],top:0,width:quadrantsize[0],height:quadrantsize[1]},				//bottom right
		{left:0,top:quadrantsize[1],width:quadrantsize[0],height:quadrantsize[1]},				//top left
		{left:quadrantsize[0],top:quadrantsize[1],width:quadrantsize[0],height:quadrantsize[1]}	//top right
		];
		
		var penultimateRenderer = penultimateStageRenderFunc(rttStageOneView, rttView);

		setRttSize( rttStageOneView, viewrect.width, viewrect.height );
		setRttSize( rttView, viewrect.width, viewrect.height );

		quadrants.forEach((bounds, ii) => {
			gl.depthFunc(gl.LESS);	//guess gfx fix. TODO put in proper place

			//calculate cull funcs on the fly. TODO recalc if changed.
			quadviewFrustumCull = generateCullFuncGeneral(quadViewMatrices[ii]);

			startStageRender(quadViewMatrices[ii], camera, rttStageOneView, bounds, quadViewData[ii]);
		});

		gl.depthFunc(gl.ALWAYS);
		penultimateRenderer.renderFunc(initialViewRect);
		lastStageRender(viewrect, penultimateRenderer.outBuffer, outputFb);
	}

	function startStageRender(projMatrix, cameraForScene, destinationBuf, destinationView, qvData){
		mat4.set(cameraForScene, worldCamera);	//setting world camera to itself?
/*
	mainCamZoom = guiParams.display.cameraZoom;
	var aspectRatio = gl.viewportWidth/gl.viewportHeight;

	//TODO update only when required
	setProjectionMatrix(nonCmapPMatrix, mainCamZoom, 1/aspectRatio, guiParams.display.uVarOne);	//note mouse code assumes 90 deg fov used. TODO fix.
	setQuadViewProjMatrices(quadViewMatrices, mainCamZoom, 1/aspectRatio);	//only necessary if quad view selected

	updateFovVals();

	if (reverseCamera){
		nonCmapPMatrix[0]=-nonCmapPMatrix[0];
		quadViewMatrices.forEach(mm=>{
			mm[0]=-mm[0];
			mm[1]=-mm[1];
			mm[2]=-mm[2];
			mm[3]=-mm[3];
		});
		xyzrotate4mat(worldCamera, (guiParams.display.flipReverseCamera? [Math.PI,0,0]:[0,Math.PI,0] ));	//flip 180  - note repeated later. TODO do once and store copy of camera
		//TODO check this works once have quad view camera working (perhaps other signs should be flipped...)
	}
	*/
	
	mat4.set(worldCamera, invertedWorldCamera);
	mat4.transpose(invertedWorldCamera);
	nonCmapCullFunc = generateCullFunc(projMatrix);										//todo only update pmatrix, nonCmapCullFunc if input variables have changed
		

	var portalInCameraCopies = [portalInCameraCopy, portalInCameraCopy2, portalInCameraCopy3];
	portalsForWorld[offsetCameraContainer.world].forEach((portal, ii)=>{
		var portalInCamera = portalInCameraCopies[ii];
		mat4.set(invertedWorldCamera, portalInCamera);
		//portalInCamera is calculated in different scope (in drawWorldScene)
		//TODO reorganise/tidy code, reduce duplication
		mat4.multiply(portalInCamera, portal.matrix); //TODO is offsetCameraContainer.world updated yet?
																				//if not may see 1 frame glitch on crossing
		mat4.transpose(portalInCamera);	//TODO lose this, use indices 3,7,11 instead of 12,13,14 in calcReflectionInfo?
		calcReflectionInfo(portalInCamera,reflectorInfoArr[ii], portal.shared.radius);
	});

	//setup for drawing to screen
	//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//gl.viewport(viewP.left, viewP.top, viewP.width, viewP.height);
	mat4.set(projMatrix, pMatrix);
														
	frustumCull = guiParams.display.quadView? 
		quadviewFrustumCull:
		nonCmapCullFunc;	//TODO proper culling func for quad view. for now just draw everything

	//mat4.set(cameraForScene, worldCamera);	//set worldCamera to playerCamera

	if (reverseCamera){
		gl.cullFace(gl.FRONT);	//todo revert for drawing cubemap faces. or : for PIP camera, render to texture, flip when texture to screen (and if fullscreen reversing camera, use same cullface setting when drawing them (if switching cullface is a slow gl call)
		xyzrotate4mat(worldCamera, (guiParams.display.flipReverseCamera? [Math.PI,0,0]:[0,Math.PI,0] ));	//flip 180
	}else{
		gl.cullFace(gl.BACK);
	}

		if (!guiParams.display.fisheyeEnabled){
			return initialRectilinearRender( gl.viewportWidth, gl.viewportHeight, rttStageOneView, rttFisheyeView2);
		}

			//var fy = Math.tan(guiParams.display.cameraFov*Math.PI/360);	//todo pull from camera matrix?
			//var fx = fy*gl.viewportWidth/gl.viewportHeight;		//could just pass in one of these, since know uInvSize
			
			var uVarOne = guiParams.display.uVarOne;

			var var2 = 10.0/guiParams.display.cameraZoom;
			var ratio = 1/(gl.viewportWidth/gl.viewportHeight);	
			var maxyvert = var2;
			var maxxvert = var2/ratio;
			var fx = maxxvert /(2.0 + uVarOne*maxyvert*maxyvert);
			var fy = fx*ratio;

			var uF = [fx, fy];
			
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
			//if (oversize > 4){console.log("capping oversize");}
			oversize = Math.min(oversize,4.0);

			if (guiParams.display.quadView){
				//temp - TODO find an appropriate scale given amount of fisheye distortion
				//so final result is not blocky. too large is inefficient. Also results in "swimming" textures,
				//though that should be solved by sampling better mipmap level - ideally dependent on screen position,
				//but uniform offset might be better than nothing
				// (multiplier here should be *0.5 for zero distortion)
				//this doesn't work great with FXAA. possibly FXAA, blur should be applied using rectilinear input.
				oversize = 0.64;
			}

			var oversizedViewport = [gl.viewportWidth, gl.viewportHeight].map(xx => 2*Math.floor(oversize*xx/2));

			window.fsq = sumInvSqs;	 //so can access elsewhere. TODO organise fisheye stuff

			//FOV presented is different for quad view and regularFisheye2! (TODO make same)
			//educated guess, seems about right...
			if (guiParams.display.quadView || guiParams.display.regularFisheye2){
				window.fsq = uF[1]*uF[1];
			}


			var fisheyeParams={
				uInvF : uF.map(elem=>1/elem),
				uVarOne : uVarOne,
				uOversize : oversize
			}
						
			var initialRenderOutput = initialRectilinearRender(oversizedViewport[0], oversizedViewport[1], rttFisheyeRectRenderOutput, rttFisheyeRectRenderOutput2);
				
			gl.bindFramebuffer(gl.FRAMEBUFFER, destinationBuf.framebuffer);
			gl.viewport( destinationView.left, destinationView.top, destinationView.width, destinationView.height );

			bind2dTextureIfRequired(initialRenderOutput.texture);	//old output view.
			bind2dTextureIfRequired(initialRenderOutput.depthTexture,gl.TEXTURE2);
				//^^ not needed if using alpha for blur

			if (!guiParams.display.quadView){
				if (guiParams.display.regularFisheye2){
					activeProg = shaderPrograms.fullscreenTexturedFisheye2;
					gl.useProgram(activeProg);
					
					gl.uniform2fv(activeProg.uniforms.xMultShift, [1.0, 0]);
					gl.uniform2fv(activeProg.uniforms.yMultShift, [1.0, 0]);
					gl.uniform1f(activeProg.uniforms.uVarTwo, 10.0/guiParams.display.cameraZoom);
					gl.uniform1f(activeProg.uniforms.uAspect, gl.viewportWidth/gl.viewportHeight);
				}else{				
					activeProg = shaderPrograms.fullscreenTexturedFisheye;
					gl.useProgram(activeProg);
				}
			}else{
				activeProg = shaderPrograms.fullscreenTexturedFisheyeQuadView;
				gl.useProgram(activeProg);

				//here require knowing which quadrant is being drawn...
				gl.uniform2fv(activeProg.uniforms.uInvFadjusted, [1.0/quadplane.fx + quadplane.xadjust, 1.0/quadplane.fy + quadplane.yadjust]);		//bottom left
				gl.uniform2fv(activeProg.uniforms.xMultShift, [0.5, 0.5*qvData.rightness]);
				gl.uniform2fv(activeProg.uniforms.yMultShift, [0.5, 0.5*qvData.topness]);
				//gl.uniform2fv(activeProg.uniforms.xMultShift, [1, 1]);	//different because in WAC project IIRC drawing 4 rectinilear renders to same surf then mapping each separately?
				//gl.uniform2fv(activeProg.uniforms.yMultShift, [1, 1]);

				gl.uniform2fv(activeProg.uniforms.adjust, [-quadplane.xadjust*qvData.rightness, -quadplane.yadjust*qvData.topness ]);

				gl.uniform1f(activeProg.uniforms.uVarTwo, 10.0/guiParams.display.cameraZoom);
				gl.uniform1f(activeProg.uniforms.uAspect, gl.viewportWidth/gl.viewportHeight);
				//gl.uniform1f(activeProg.uniforms.uAspect, quadplane.aspect);
			}

			enableDisableAttributes(activeProg);

			gl.uniform2fv(activeProg.uniforms.uInvF, fisheyeParams.uInvF);
			//gl.uniform2fv(activeProg.uniforms.uInvFadjusted, fisheyeParams.uInvF);	//??

			gl.uniform1f(activeProg.uniforms.uVarOne, fisheyeParams.uVarOne);
			gl.uniform1f(activeProg.uniforms.uOversize, fisheyeParams.uOversize);

			gl.uniform1i(activeProg.uniforms.uSampler, 0);	
			gl.uniform1i(activeProg.uniforms.uSamplerDepthmap, 2);	
			//gl.uniform2f(activeProg.uniforms.uInvSize, 2/gl.viewportWidth , 2/gl.viewportHeight);

			gl.cullFace(gl.BACK);
			gl.depthFunc(gl.ALWAYS);
			drawObjectFromBuffers(fsBuffers, activeProg);

			return;
		
		/**
		 * 
		 * @param {*} width 
		 * @param {*} height 
		 * @param {*} traspOutView to set sceneDrawingOutputView if drawing transparent stuff
		 */
		function initialRectilinearRender(width, height, initialOutView, traspOutView){
			gl.bindFramebuffer(gl.FRAMEBUFFER, initialOutView.framebuffer);
			
			gl.viewport( 0,0, width, height );
			setRttSize( initialOutView, width, height );	//todo stop setting this repeatedly

			var viewSettings = {buf: initialOutView.framebuffer, width, height};
			var savedCamera = mat4.create(worldCamera);	//TODO don't instantiate!

			mat4.set(playerCameraInterp,sshipMatrix);	//copy current player 4-rotation matrix to the spaceship object

			var wSettings = getWorldSceneSettings.forNonPortalView(offsetCameraContainer.world);
			drawWorldScene(frameTime, false, viewSettings, wSettings);
			mat4.set(savedCamera, worldCamera);	//set worldCamera back to savedCamera (might have been changed due to rendering portal cubemaps within drawWorldScene)

			if (!guiParams.display.drawTransparentStuff){
				return initialOutView;
			}

			drawTransparentStuff(initialOutView, traspOutView, width, height, wSettings);
			return traspOutView;
		}

		function drawTransparentStuff(fromView, toView, sizeX, sizeY, wSettings){
			//switch to another view of same size, asign textures for existing rgb(a) and depth map, and draw these to new rgb(a), depth map (fullscreen quad)
			// note that drawing depthmap maybe redundant because will be looking up depth map from texture to determine colours anyway, but might help with discarding pixels etc.
			gl.bindFramebuffer(gl.FRAMEBUFFER, toView.framebuffer);
			gl.viewport( 0,0, sizeX, sizeY);
			setRttSize( toView, sizeX, sizeY);	//todo stop setting this repeatedly
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
	}

	function penultimateStageRenderFunc(screenBufOne, screenBufTwo){		
		if (["blur",  "blur-b", "blur-b-use-alpha", "blur-big"].includes( guiParams.display.renderViaTexture )){
			var activeProg = guiParams.display.renderViaTexture == "blur" ? shaderPrograms.fullscreenBlur:
					guiParams.display.renderViaTexture == "blur-b" ? shaderPrograms.fullscreenBlurB :
					guiParams.display.renderViaTexture == "blur-b-use-alpha" ? shaderPrograms.fullscreenBlurBUseAlpha
																			:shaderPrograms.fullscreenBlurBig;
			return {
				outBuffer : screenBufTwo,
				renderFunc : function(viewP){
					gl.useProgram(activeProg);
					enableDisableAttributes(activeProg);

					var blurScale = guiParams.display.renderViaTexture == "blur-big"? 1 : 2.5;
					drawBlur(activeProg, screenBufOne, screenBufTwo, viewP, [blurScale/gl.viewportWidth , blurScale/gl.viewportHeight]);
					//TODO blur constant angle - currently blurs constant pixels, so behaviour depends on display resolution.
				}
			};
		}

		//second pass blur iff appropriate
		if (guiParams.display.renderViaTexture == "2-pass-blur"){
			var activeProg = shaderPrograms.fullscreenBlur1d;
			return {
				outBuffer: screenBufOne,
				renderFunc: function(viewP){
					//possibly TODO rotating screen, so always sampling vertical or horizontal for both passes
					//but that would want intermediate buffer to have dimensions transposed.
					activeProg = shaderPrograms.fullscreenBlur1d;
					gl.useProgram(activeProg);
					enableDisableAttributes(activeProg);

					//drawBlur(activeProg, screenBufOne, screenBufTwo, [1/gl.viewportWidth , 1/gl.viewportHeight]);

					//2-pass blur abusing big blur (many samples redundant, but should have same effect)
					drawBlur(activeProg, screenBufOne, screenBufTwo, viewP, [1/gl.viewportWidth , 0]);
					drawBlur(activeProg, screenBufTwo, screenBufOne, viewP, [0 , 1/gl.viewportHeight]);
					//note hacky use of uInvSizeVec to convey the step vector for samples.
				}
			}
		}

		if (guiParams.display.renderViaTexture == "1d-blur"){
			//temporary!
			var activeProg = shaderPrograms.fullscreenBlur1dDdx;
			return {
				outBuffer: screenBufTwo,
				renderFunc: function(viewP){
					gl.useProgram(activeProg);
					enableDisableAttributes(activeProg);
					drawBlur(activeProg, screenBufOne, screenBufTwo, viewP, [1/gl.viewportWidth , 0]);
				}
			}
		}

		return {
			outBuffer: screenBufOne,
			renderFunc : function(){}
		};	//TODO for quadrant view, do a copy from quadrant view to quadrant of intermediate buffer

		function drawBlur(shaderProg, fromView, destinationView, viewP, uInvSizeVec){
			//TODO depth aware blur. for now, simple
			//draw scene to penultimate screen (before FXAA)
			gl.bindFramebuffer(gl.FRAMEBUFFER, destinationView.framebuffer);
			//gl.viewport( 0,0, gl.viewportWidth, gl.viewportHeight );

			gl.viewport(viewP.left, viewP.top, viewP.width, viewP.height);

			//setRttSize( destinationView, gl.viewportWidth, gl.viewportHeight );

			bind2dTextureIfRequired(fromView.texture);	
			bind2dTextureIfRequired(fromView.depthTexture,gl.TEXTURE2);	//note many blurs don't actually use this.
			
			gl.cullFace(gl.BACK);
			
			gl.uniform2fv(shaderProg.uniforms.uInvSize, uInvSizeVec);
				
			gl.uniform1i(shaderProg.uniforms.uSampler, 0);
			gl.uniform1i(shaderProg.uniforms.uSamplerDepthmap, 2);

			gl.depthFunc(gl.ALWAYS);
			drawObjectFromBuffers(fsBuffers, shaderProg);
			//gl.depthFunc(gl.LESS);
		}
	}

	function lastStageRender(viewP, sourceFramebuf, sceneFinalOutputFramebuf){
		//draw quad to screen using drawn texture
		gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFinalOutputFramebuf);	//draw to screen (null), or intermediate view in case of anaglyph
		gl.viewport(viewP.left, viewP.top, viewP.width, viewP.height);	//TODO check whether necessary to keep setting this
		
		bind2dTextureIfRequired(sourceFramebuf.texture);
		
		//draw the simple quad object to the screen
		switch (guiParams.display.renderLastStage){
			case "simpleCopy":
				activeProg = shaderPrograms.fullscreenTextured;break;
			case "showAlpha":
				activeProg = shaderPrograms.fullscreenTexturedShowAlphaChan;break;
			case "fxaa":
				activeProg = shaderPrograms.fullscreenBennyBox;break;
			case "fxaaSimple":
				activeProg = shaderPrograms.fullscreenBennyBoxLite;break;
			case "dither":
				activeProg = shaderPrograms.fullscreenDither;break;
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

	function drawHud(){
		if (!guiParams.display.showHud){return;}
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

		var standardDecalScale = [0.001,0.001,0];
		//direction of flight
		if (playerVelVec[2] > 0.1){	//??
			bind2dTextureIfRequired(hudTexturePlus);		//todo texture atlas for all hud 
			drawTargetDecal(standardDecalScale, colorArrs.hudFlightDir, adjustedDirectionForFisheye(playerVelVec));
		}
		bind2dTextureIfRequired(hudTexture);	
		
		//drawTargetDecal(0.004, [1.0, 1.0, 0.0, 0.5], [0,0,0.01]);	//camera near plane. todo render with transparency
		if (guiParams["targeting"]!="off"){
			var shiftAmount = 1/muzzleVel;	//shift according to player velocity. 0.1 could be 1, but 
			var scalescalar = 0.0037/(1+shiftAmount*playerVelVec[2]);
			//TODO correct this for fisheye
			// (size of outer ring actually means something. draw centre and outer ring separately?)
			drawTargetDecal([scalescalar,scalescalar,0], colorArrs.hudYellow, adjustedDirectionForFisheye(
				[shiftAmount*playerVelVec[0],shiftAmount*playerVelVec[1],1+shiftAmount*playerVelVec[2]]));	//TODO vector add!
			
			if (guiParams.target.type!="none" && targetWorldFrame[2]<0){	//if in front of player){
				bind2dTextureIfRequired(hudTextureBox);				
				drawTargetDecal(standardDecalScale, colorArrs.hudBox, adjustedDirectionForFisheye(targetWorldFrame));	//direction to target (shows where target is on screen)
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

			var reversed = fireDirectionVec.map(x=>-x);	//needs to do this for fisheye correction to work consistent with other hud icons
			drawTargetDecal(standardDecalScale, colorArrs.hudYellow, adjustedDirectionForFisheye(reversed), 0.1);	//todo check whether this colour already set
			drawTargetDecal(standardDecalScale, colorArrs.hudYellow, adjustedDirectionForFisheye(reversed), -0.1);
		}
		
		function adjustedDirectionForFisheye(inPos){

			if (!guiParams.display.fisheyeEnabled){
				return inPos;
			}

			//note this calculation likely simplifyable!
			//also could be wrong - expect at least wont handle when FOV>180

			//normalise pos.
			var posLength = Math.sqrt(inPos[0]*inPos[0] + inPos[1]*inPos[1] + inPos[2]*inPos[2]);
			var outPos = inPos.map(elem=>elem/posLength);
			//return outPos;


			var sphereShift = 8*guiParams.display.uVarOne;
			//how far back in sphere of radius 1 viewing the scene
			// (scene effectiovely projected onto sphere, viewpoint shifted - shift 0 for rectilinear
			// standard projection, 1 for stereographic)
			
			outPos[2] = outPos[2] + sphereShift;
			
			//scale such that pos[2] retains the same value for screen corner point at fx,fy
			
			//root(fsq) is opp, 1 is adj. hyp is root(fsq+1)
			//stretch such that hyp is 1. 
			//adj = 1/root(fsq+1)

			//then multiply pos by adj/(-shift+adj)
			var adj = 1/Math.sqrt(1+window.fsq);
			outPos[2] = outPos[2]*adj/(adj-sphereShift); 

			return outPos;
		}


		//draw something to show each portal.
		var portalTexts = [];
			//note using offsetCameraContainer for this, but use playerContainer to display current world.
		for (var portal of portalsForWorld[offsetCameraContainer.world]){
			//get position relative to camera. 
			var mat = portal.matrix;
			var relativeMat = mat4.create(invertedWorldCamera);
			mat4.multiply(relativeMat, mat);
			var pos = relativeMat.slice(12,15);	//12,13,14

			pos = adjustedDirectionForFisheye(pos);

			if (pos[2]<0){	//note unintuitive sign
				drawTargetDecal(standardDecalScale, colorArrs.white, pos, -0.35);
				drawTargetDecal(standardDecalScale, colorArrs.white, pos, 0.35);
				var text = "world " + portal.otherps.world; 
				portalTexts.push({pos,text});
			}
		}

		if (guiParams.debug.textWorldNum){
			//drawing of text
			//TODO efficient - currently many draw calls. could instance render, or create a mesh of multiple quads
			var activeShaderProgram = shaderPrograms.decalSdf;
			gl.useProgram(activeShaderProgram);
			prepBuffersForDrawing(quadBuffers, activeShaderProgram);
			gl.activeTexture(gl.TEXTURE0);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE);	

			bind2dTextureIfRequired(fontTexture);

			//drawText("World " + playerContainer.world, 0.6, 0.15, 1); //(below) centre of screen, suitable if flash up on cross portal
			drawText("World " + playerContainer.world, 3, 1.5, 1,1); //bottom left. note scales with FOV!

			portalTexts.forEach(pp=>{
				drawText(pp.text, pp.pos[0], pp.pos[1], pp.pos[2], 0.3);
			});

			function drawText(textToDraw, xpos, ypos, zpos, size){
				if (!text_util.isLoaded){return;}

				xpos/=size*zpos;
				ypos/=size*zpos;
				zpos=1/size;

				textToDraw.toUpperCase().split('').forEach(ch => {
					var cInfo = text_util.charInfo[ch.charCodeAt(0)];
					
					drawTargetDecalCharacter(
						[0.01*size*cInfo.width/512, 0.01*size*cInfo.height/512, 0], colorArrs.teapot,
						[xpos - 2*cInfo.xoffset/512 - (cInfo.width/512),
						ypos + 2*cInfo.yoffset/512 + (cInfo.height/512), //note awkward passing in size since currently quads are drawn -1 to +1
						zpos],
						cInfo);
					xpos-=2* cInfo.xadvance/512;
				});
			}
		}

		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);

		function drawTargetDecal(scale, color, pos, rotation=0, uvPosAndSize = [0,0,1,1]){
			//scale*= 0.01/pos[2];
			gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, scale);
			uniform4fvSetter.setIfDifferent(activeShaderProgram, "uUvCoords", uvPosAndSize);
			uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", color);
			mat4.identity(mvMatrix);
			xyzmove4mat(mvMatrix,[0.01*pos[0]/pos[2],0.01*pos[1]/pos[2],0.01]);
			xyzrotate4mat(mvMatrix, [0,0,rotation]);
			drawObjectFromPreppedBuffers(quadBuffers, activeShaderProgram);
		}

		function drawTargetDecalCharacter(scale, color, pos, charInfo){
			drawTargetDecal(scale, color, pos, 0, uvPosAndSize = [
				charInfo.x/512,(1-charInfo.y/512) - charInfo.height/512,
				charInfo.width/512, charInfo.height/512]);
				//note could flip quad y to make above simpler (but will use different method anyway)
		}
	}


	heapPerfMon.sample();
	heapPerfMon.delaySample(0);
}


function updateFovVals(){
	var var1=guiParams.display.uVarOne;
	var var2 = 10.0/guiParams.display.cameraZoom;

	var ratio = gl.viewportHeight/gl.viewportWidth; //??

	var maxyvert = var2;	//??
	var maxxvert = var2/ratio;	//screenAspect;	

	//update something in UI to show what fov SHOULD be (might not match currently!!!)
	var vfov = (360/Math.PI)*Math.atan2(maxyvert , 2.0 + var1*maxyvert*maxyvert);
	var hfov = (360/Math.PI)*Math.atan2(maxxvert , 2.0 + var1*maxxvert*maxxvert);

	//console.log({vfov,hfov});

	guiParams.display.vFOV = vfov.toFixed(1);
	guiParams.display.hFOV = hfov.toFixed(1);
}


var printPMatCreation=false;

var mainCamFov = 105;	//degrees.
function setProjectionMatrix(pMatrix, cameraZoom, ratio, varOne, quadViewTest){
	mat4.identity(pMatrix);
	
	var var2 = 10.0/cameraZoom;

	var maxyverta = var2;	//??
	var maxxverta = var2/ratio;	//screenAspect;

	var fx = (maxxverta /(2.0 + varOne*maxyverta*maxyverta));

	// 0 1 2 3
	// 4 5 6 7
	// 8 9 10 11
	// 12 13 14 15

	pMatrix[0] = 1.0/fx ;
	pMatrix[5] = 1.0/(fx*ratio);
	pMatrix[11]	= -1;	//rotate w into z.
	//pMatrix[14] = -0.00003;	//smaller = more z range. 1/50 gets ~same near clipping result as stereographic/perspective 0.01 near
	pMatrix[14] = 0;	//with custom depth extension, still discards based on gl_Position w,z, so "disable" that here (setting this to 0 should cause all depths to be 0)
						//TODO consider what else might pass through. might take advantage of discard - what happens for stuff on "opposite side of world"? might be able to discard stuff "behind" the player  
	
	pMatrix[10]	= 0;
	pMatrix[15] = 0;
	
	if (printPMatCreation){
		console.log({"pMatrix standard": pMatrix.slice()});
	}

	if (quadViewTest){	//TODO don't do this for cubemap stuff

		//initial version just bodged from webgl-wideanglecamera project
		//TODO sort problem of not rendering behind camera when >180 FOV, seems because of discard in custom depth
		// calc in frag shader - the depth used should in direction of the "skewed" quarter camera. the current
		// matrix components affecting depth might be right or wrong - won't render with current discard criteria...
		//TODO ensure configuration variables are appropriate for confiugured fov, zoom
		// (this proj does not now have zoom param)
		// currently is ~2x too big (when uVar1=0, see that centre of perspective shifted, but all, not a quarter of regular view)
		//TODO draw all 4 quadrants on screen
		// try rendering all objects/ shaders for each quad vs all quads for each obj/shader
		// (maybe fewer gl calls, depends if setting pMatrix, viewport is fast)
		//TODO apply correct fisheye mapping so get result matching existing fisheye (but faster/wider/better quality)
		//TODO fix portal drawing in quad view mode.

		//mat4.perspective(2*(180/Math.PI)*Math.atan(quadplane.fy), 

		var var1 = guiParams.display.uVarOne;	// * 0.125;	//TODO what multiplier right here? 
		

		// if (guiParams.indentViews){
		// 	var2*= 0.9;	//some variable that will modify by UI, to allow showing the curved limits (for real use, should set this to 1.0/remove from code)
		// }
	
		var maxyvert = var2;	//??
		var maxxvert = var2/ratio;	//screenAspect;


		pMatrix[0] = 1/(maxxvert /(2.0 + var1*maxyvert*maxyvert));
		pMatrix[5] = pMatrix[0]/ratio;

		// var zalpha = 2.0 + var1*(maxxvert*maxxvert + maxyvert*maxyvert);	//basically "mag"
		// var zc = 2.0 + var1*(maxyvert*maxyvert);	//at the top/bottom of screen
		// var zk = 2.0 + var1*(maxxvert*maxxvert);	//left/right.
			//the above could be optimised...
		
		//var xadjust = (zalpha -zc)/maxxvert;		//?? appears this is just var1*maxxvert
		//var yadjust = (zalpha -zk)/maxyvert;		// and this is just var1*maxyvert
		var xadjust = var1*maxxvert;
		var yadjust = var1*maxyvert;

		//var qpfx= 1.0/( ( 2.0*zk/maxxvert ) - xadjust );
			//so this is 1/ ( 2*2/maxxvert + 2*var1*maxxvert - var1*maxxvert))
			// = 1/ ( 2*2/maxxvert + var1*var1*maxyvert) = maxxvert/(4+var1*maxxvert*maxxvert)
		var qpfx = maxxvert/(4+var1*maxxvert*maxxvert);

		//var qpfy= 1.0/( ( 2.0*zc/maxyvert ) - yadjust );
		var qpfy = maxyvert/(4+var1*maxyvert*maxyvert);

		pMatrix[0] = 1/qpfx;	//???
		pMatrix[5] = 1/qpfy;

		//var camParams = {near:1, far:0};	//does this matter?
		//var tempPMatrix = mat4.identity();
		// mat4.perspective(2*(180/Math.PI)*Math.atan(qpfy), qpfx/qpfy, camParams.near, camParams.far, tempPMatrix);
		// if (printPMatCreation){
		// 	console.log({"tempPMatrix": tempPMatrix.slice()});
		// }
		//pMatrix[0] = tempPMatrix[0];	//??? mat4.perspective switches signs??
		//pMatrix[5] = tempPMatrix[5];

		//fudge? missed a sign somewhere?
		//xadjust/=-1;
		//yadjust/=-1;


		//like {topness:1, rightness:-1} for top left quadrant etc
		//TODO are both z,w columns required if using custom depth?
		var {topness,rightness}=quadViewTest;
		pMatrix[1] = xadjust*topness*rightness;
		//pMatrix[2] = -xadjust*rightness;	//doesn't do much?
		pMatrix[3] = -xadjust*rightness;

		pMatrix[4] = yadjust*topness*rightness;
		//pMatrix[6] = -yadjust*topness;	//doesn't do much?
		pMatrix[7] = -yadjust*topness;

		pMatrix[8] = rightness;
		pMatrix[9] = topness;
		//pMatrix[12] = rightness;
		//pMatrix[13] = topness;
		if (printPMatCreation){
			console.log({"pMatrix quadplane": pMatrix.slice()})
		}


		//populate global obj (bodge) to use in quadplane fisheye...
		quadplane.xadjust = xadjust;
		quadplane.yadjust = yadjust;
		quadplane.fx= qpfx;
		quadplane.fy= qpfy;
		//fudge? missed a sign somewhere?
		quadplane.xadjust/=-1;
		quadplane.yadjust/=-1;
		//quadplane.aspect = qpfx/qpfy;
	}

	printPMatCreation=false;
}

var quadViewData = [
	{topness:-1,rightness:-1},	//bottom left
	{topness:-1,rightness:1},	//bottom right
	{topness:1,rightness:-1},	//top left
	{topness:1,rightness:1}		//top right
];

function setQuadViewProjMatrices(quadViewMatrices, vFov, ratio){
	for(var ii=0;ii<4;ii++){
		setProjectionMatrix(quadViewMatrices[ii], vFov, ratio, guiParams.display.uVarOne, quadViewData[ii]);
	}
}

var sshipWorld=0;	//used for player light

function updateGunTargeting(matrix){
	var modelScale = sshipModelScale;
	var matrixForTargeting = matrix;
	
	var gunHoriz = 18*sshipModelScale;
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
		
		targetWorldFrame = targetWorldFrame.map(val => val/length);	//FWIW last value unneeded
		
		//confirm tWF length 1? 
		var lensqtwf=0;
		for (var ii=0;ii<3;ii++){
			lensqtwf += targetWorldFrame[ii]*targetWorldFrame[ii];
		}
		
		var playerVelVecMagsq = playerVelVec.reduce((total, val) => total+ val*val, 0);	//v.v
					//todo reuse code or result (copied from elsewhere)
		var tDotV = playerVelVec.reduce((total, val, ii) => total+ val*targetWorldFrame[ii], 0);
		var inSqrtBracket =  tDotV*tDotV + muzzleVel*muzzleVel -playerVelVecMagsq;
		
		//console.log(inSqrtBracket);
		
		var sqrtResult = inSqrtBracket>0 ? Math.sqrt(inSqrtBracket): 0;	//TODO something else for 0 (no solution)
		//console.log(sqrtResult);
		
		for (var ii=0;ii<3;ii++){
			targetingResultOne[ii] = targetWorldFrame[ii]*(tDotV + sqrtResult) - playerVelVec[ii];
			targetingResultTwo[ii] = targetWorldFrame[ii]*(tDotV - sqrtResult) - playerVelVec[ii];
		}
		//check lengths of these = muzzle vel sq
		var targetingResultOneLengthSq = targetingResultOne.reduce((total, val) => total+ val*val, 0);
		var targetingResultTwoLengthSq = targetingResultTwo.reduce((total, val) => total+ val*val, 0);

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
				fireDirectionVec = [-pointingDir.x,-pointingDir.y,pointingDir.z].map(val=> val*muzzleVel); 
					//todo pointingdir simple vector!( not .x, .y, ,z)
				
					//redo adding player velocity (todo maybe combine with where do this elsewhere..)
					//ie guntargetingvec
					//todo solve targeting in mechanics loop - currently doing when drawing !!!!!!!!!!!!!!!!!!! stupid!
				fireDirectionVec = fireDirectionVec.map((val,ii) => val+playerVelVec[ii]);
					
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
		worldA:0,
		worldInfo:0,
		localVecFogColor:0,
		infoForPortals:[
			{
			},{
			}
		],
		sshipDrawMatrices:[],
	}
	var worldA;

	function getWorldSettingsForNonPortalView(currentWorld){
		//used when drawing final camera view, and when drawing reflections (not portal view)
		var psides=[];
		var otherWorlds=[];
		var portalsForOffsetCamWorld = portalsForWorld[currentWorld];
		for (var ii=0;ii<portalsForOffsetCamWorld.length;ii++){
			var relevantPs = portalsForOffsetCamWorld[ii];
			otherWorlds.push(relevantPs.otherps.world);
			psides.push(relevantPs);
		}
		return generalGetWorldSceneSettings(currentWorld, psides, otherWorlds);
	}

	function getWorldSettingsForThroughPortalView(portal){
		var psides=[];
		var otherWorlds=[];

		var relevantPs = portal;
		var oldWorldPs = portal.otherps;

		worldA = relevantPs.world;
	
		var portalsForWorldA = portalsForWorld[worldA];

		var otherWorldPsArr=[];

		for (var ii=0;ii<portalsForWorldA.length;ii++){
			otherWorldPsArr.push(portalsForWorldA[ii].otherps);
			psides.push(portalsForWorldA[ii]);
		}

		//make sure the 0th is what was worldB (until pass both into shaders, necessary to ensure correct discarding
			//or spaceship pix when crossing portal)

		var oldWorldPsIdx = -1;	//should not happen!!
		for (var ii=0;ii<portalsForWorldA.length;ii++){
			if (otherWorldPsArr[ii] == oldWorldPs){
				oldWorldPsIdx = ii;
			}
		}
		if (oldWorldPsIdx==-1){
			console.log("ERROR!!!!! oldWorldPsIdx==-1");
		} else {
			//swap so oldWorldIdx is in slot 0. note redundant if oldWorldIdx=0
			var tmp = otherWorldPsArr[0];
			otherWorldPsArr[0] = otherWorldPsArr[oldWorldPsIdx];
			otherWorldPsArr[oldWorldPsIdx] = tmp;
			tmp = psides[0];
			psides[0] = psides[oldWorldPsIdx];
			psides[oldWorldPsIdx] = tmp;
		}
		otherWorlds = otherWorldPsArr.map(ps => ps.world);

		return generalGetWorldSceneSettings(worldA, psides, otherWorlds);
	}

	function generalGetWorldSceneSettings(worldA, psides, otherWorlds){
		returnObj.worldA = worldA;

		var pmats = psides.map(x=>x.matrix);
		var pmatrads = psides.map(x=>x.shared.radius);


		returnObj.worldInfo = guiSettingsForWorld[worldA];

		//returnObj.localVecFogColor = localVecFogColor = worldColors[worldA];
		returnObj.localVecFogColor = worldColors[worldA];

		returnObj.infoForPortals=[];	//don't resuse, or shallow copy later will be mutated before reusing wSetting result
						//for drawing transparency in drawScene2()
						//TODO acheive correct rendering with less garbage!

		var portalsForThisWorld = portalsForWorld[worldA];

		for (var pp=0;pp<portalsForThisWorld.length;pp++){

			var infoForPortal={};

			var localVecReflectorColor = guiParams.reflector.isPortal? worldColors[otherWorlds[pp]]: worldColors[worldA];

			//undo reuse of vectors. (caused bug when moved portal cubemap to just before drawing portal, within main world drawing)
			//TODO instantiate a separate wSettings objects and reuse for different parts of rendering... (otherwise creates garbage)
			infoForPortal.localVecReflectorDiffColor=new Float32Array(3);
			infoForPortal.localVecReflectorColor=localVecReflectorColor;

			for (var cc=0;cc<3;cc++){
				infoForPortal.localVecReflectorDiffColor[cc] = localVecReflectorColor[cc]-returnObj.localVecFogColor[cc];
				//infoForPortal.localVecReflectorDiffColor[cc] = 1;	//override, see if this is cause of problem	
					//this alone does not fix problem - rendering is different dependent on whether portals are culled.
			}
			//calculate stuff for discard shaders

			//moved portal - likely duplicated from elsewhere
			var portalRelativeMat = mat4.create(worldCamera);
			mat4.transpose(portalRelativeMat);
			mat4.multiply(portalRelativeMat, pmats[pp]);
			mat4.transpose(portalRelativeMat);

			infoForPortal.mat = pmats[pp];

			infoForPortal.reflectorPosTransformed=new Array(4);	//work around bug (see comments near return statement)
			for (var cc=0;cc<4;cc++){
				infoForPortal.reflectorPosTransformed[cc] = portalRelativeMat[4*cc+3];	//position of reflector in frame of camera (after MVMatrix transformation)
			}

			var rad = pmatrads[pp];
			infoForPortal.rad = rad;	//just copy this around everywhere!
			infoForPortal.cosReflector = 1.0/Math.sqrt(1+rad*rad);

			returnObj.infoForPortals.push(infoForPortal);
		}

		returnObj.sshipDrawMatrices =[];
		if (sshipWorld == worldA){ //draw spaceship if it's in the world that currently drawing. (TODO this for other objects eg shots)
			returnObj.sshipDrawMatrices.push(sshipMatrix);
		}
		//do next part regardless of whether in world that are drawing, because possible for portals to have both ends in same world.
		var portals = portalsForWorld[worldA];
		for (var pp=0;pp<portals.length;pp++){
			var thisPortalSide = portals[pp];
			if (thisPortalSide.otherps.world == sshipWorld){
				var relevantPortalSide = thisPortalSide.otherps;
				var portalRad = relevantPortalSide.shared.radius;
				if (checkWithinRangeOfGivenPortal(sshipMatrix, Math.tan(portalRad +0.1), relevantPortalSide)){	//TODO correct this
					mat4.set(sshipMatrix, portaledMatrix);
					moveMatrixThruPortal(portaledMatrix, portalRad, 1, relevantPortalSide);
					returnObj.sshipDrawMatrices.push(portaledMatrix);
				}
			}
		}
		
		//return returnObj;		//causes bug currently because other properties are added to this object after it is returned and assigned to 
								//wSettings, which are particular to the (cubemap) view, eg light position in camera frame.
								//TODO handle those specific variables separately, to avoid allocation of new objects.

		return {...returnObj}	//shallow clone
	}

	return {
		forPortalView: getWorldSettingsForThroughPortalView,
		forNonPortalView: getWorldSettingsForNonPortalView
	};
})();


function drawWorldScene(frameTime, isCubemapView, viewSettings, wSettings) {

	({worldA,worldInfo, localVecFogColor, infoForPortals, sshipDrawMatrices} = wSettings);
		
	if (!isCubemapView && worldInfo.duocylinderModel == "l3dt-blockstrips"){
		updateTerrain2QuadtreeForCampos(worldCamera.slice(12), worldInfo.spin);
	}
	
	gl.clearColor.apply(gl,worldColorsPlain[worldA]);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.set(worldCamera, invertedWorldCamera);
	mat4.transpose(invertedWorldCamera);
	
	//equivalent for frame of duocylinder, to reduce complexity of drawing, collision checks etc
	mat4.set(invertedWorldCamera, invertedWorldCameraDuocylinderFrame);

	var duocylinderSpin = worldInfo.spin;

	rotate4mat(invertedWorldCameraDuocylinderFrame, 0, 1, duocylinderSpin);
	
		
	var relevantColorShader = shaderPrograms.coloredPerPixelDiscard[ guiParams.display.atmosShader ];
	//var relevantTexmapShader = shaderPrograms.texmapPerPixelDiscard[ guiParams.display.atmosShader ];
	var relevantTexmapShader = guiParams.display.useSpecular? shaderPrograms.texmapPerPixelDiscardPhong[ guiParams.display.atmosShader ] : shaderPrograms.texmapPerPixelDiscard[ guiParams.display.atmosShader ];
	
	shaderProgramColored = guiParams.display.perPixelLighting?relevantColorShader:shaderPrograms.coloredPerVertex;
	shaderProgramColoredBendy = shaderPrograms.coloredPerPixelDiscardBendy[ guiParams.display.atmosShader ];	//NOTE no non-perpixel option here
	shaderProgramTexmap = guiParams.display.perPixelLighting?relevantTexmapShader:shaderPrograms.texmapPerVertex;	
	
	var dropLightPos;
	
	
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
	if (worldA!=sshipWorld){
		var dropLightReflectionInfo={};
		calcReflectionInfo(sshipMatrixShifted,dropLightReflectionInfo, 0.123);	//????? pass in what radius??
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
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uFogColor", localVecFogColor);

		setPortalInfoForShader(activeShaderProgram, infoForPortals);

		if (activeShaderProgram.uniforms.uPlayerLightColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
		}
		
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
		
		//new for this version of shader
		//gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, guiParams.normalMove + boxSize);
		gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, 0.01*Math.abs(Math.cos((Math.PI/1000)*(frameTime % 2000 ))) + boxSize);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,explodingBoxMatrix);
		mat4.set(explodingBoxMatrix, mMatrix);
		
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
	if (guiBoxes['y=z=0']){drawBoxRing(0);}
	if (guiBoxes['x=z=0']){drawBoxRing(1);}
	if (guiBoxes['x=y=0']){drawBoxRing(2);}
	if (guiBoxes['z=w=0']){drawBoxRing(3);}
	if (guiBoxes['y=w=0']){drawBoxRing(4);}
	if (guiBoxes['x=w=0']){drawBoxRing(5);}
	
	function drawBoxRing(ringIdx){
		var ring = ringCells[ringIdx];
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", ring.color);
		drawArrayOfModels(
			ringCells[ringIdx].mats,
			(guiParams.display.culling ? boxRad: false),
			cubeBuffers,
			activeShaderProgram
		);
	}
	

	
	numRandomBoxes = Math.min(randomMats.length, guiParams['random boxes'].number);	//TODO check this doesn't happen/ make obvious error!
	
	if (numRandomBoxes>0){
		if (guiParams['random boxes'].drawType == 'indiv'){
			uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.randBoxes);

			boxSize = guiParams['random boxes'].size;
			boxRad = boxSize*Math.sqrt(3);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
									
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
			
			uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.randBoxes);
			
			boxSize = guiParams['random boxes'].size;
			boxRad = boxSize*Math.sqrt(3);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
						
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
		
		if (['instancedArrays','instancedArraysMenger'].includes(guiParams["random boxes"].drawType)){
			var objBufferForInstances;
			if (guiParams["random boxes"].drawType == 'instancedArraysMenger'){
				shaderSetup(shaderPrograms.coloredPerPixelDiscardVertexColoredInstanced[ guiParams.display.atmosShader ]);
				objBufferForInstances = buildingBuffers;
				uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
			}else{
				shaderSetup(shaderPrograms.texmapPerPixelDiscardNormalmapPhongInstanced[ guiParams.display.atmosShader ]);
				objBufferForInstances = cubeBuffers;
				uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.red);
			}
			
			
			boxSize = guiParams['random boxes'].size;
			boxRad = boxSize*Math.sqrt(3);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
			
			//numRandomBoxes = Math.min(randomMats.length, numRandomBoxes);	//todo figure out how to draw part of array of boxes. also for "singleBuffer" version
			
			prepBuffersForDrawing(objBufferForInstances, activeShaderProgram);

			var matrixBuffers = randBoxBuffers.randMatrixBuffers;	//todo neater selection code (array of terrain types?) TODO select mats array for other drawing types (eg indivVsMatmult)
			if (['procTerrain','voxTerrain','voxTerrain2','voxTerrain3'].includes(worldInfo.duocylinderModel)) {
				matrixBuffers = randBoxBuffers.forTerrain[worldInfo.duocylinderModel];
			}
			
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
			gl.vertexAttribDivisor(attrIdx, 1);
			gl.vertexAttribDivisor(attrIdx+1, 1);
			gl.vertexAttribDivisor(attrIdx+2, 1);
			gl.vertexAttribDivisor(attrIdx+3, 1);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.a);
			gl.vertexAttribPointer(attrIdx, 4, gl.FLOAT, false, 0, 0);	//https://community.khronos.org/t/how-to-specify-a-matrix-vertex-attribute/54102/3
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.b);
			gl.vertexAttribPointer(attrIdx+1, 4, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.c);
			gl.vertexAttribPointer(attrIdx+2, 4, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.d);
			gl.vertexAttribPointer(attrIdx+3, 4, gl.FLOAT, false, 0, 0);
			*/

			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixA, 1);
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixB, 1);
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixC, 1);
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixD, 1);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixA, 4, gl.FLOAT, false, 64, 0);	//https://community.khronos.org/t/how-to-specify-a-matrix-vertex-attribute/54102/3
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixB, 4, gl.FLOAT, false, 64, 16);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixC, 4, gl.FLOAT, false, 64, 32);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixD, 4, gl.FLOAT, false, 64, 48);
			
			gl.drawElementsInstanced(gl.TRIANGLES, objBufferForInstances.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, numRandomBoxes);
										//DO NOT SET THIS HIGH ON CHROME! works great on firefox, think tanks chrome because due to whatever bug using the right matrices, huge overdraw
			
			//gl.drawElementsInstancedANGLE(gl.TRIANGLES, cubeBuffers.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, 100);	//very low count - to avoid tanking framerate in chrome (bug in extension?)
					//TODO is consecutive attribute pointers for a matrix not guaranteed? TODO with bodging a matrix together from vectors in vshader.
			
			//switch off again??
			/*
			gl.vertexAttribDivisor(attrIdx, 0);
			gl.vertexAttribDivisor(attrIdx+1, 0);
			gl.vertexAttribDivisor(attrIdx+2, 0);
			gl.vertexAttribDivisor(attrIdx+3, 0);
			*/
			
			//this appears to be unnecessary - maybe only relevant when drawing using angle ext.
			/*
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixA, 0);
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixB, 0);
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixC, 0);
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixD, 0);
			*/
			
			zeroAttributeDivisors(activeShaderProgram);
		}
	}
	
	if (guiParams['random boxes'].drawType == 'instanced speckles'){	// (not really boxes)
		//draw instanced billboard quads using instanced rendering
		//shader setup is simple and different to normal, so forgo shaderSetup fun, just do here. no lights, fog at this time. (light bit compicated - for simulated diffuse spheres, perceived brightness depends on both viewing angle and light...
		activeShaderProgram = shaderPrograms.billboardQuads;
		gl.useProgram(activeShaderProgram);
		
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
		if (activeShaderProgram.uniforms.uDropLightPos){
			uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);
		}
		
		//cut down version of prepBuffersForDrawing
		enableDisableAttributes(activeShaderProgram);
		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffers2D.vertexPositionBuffer);
		gl.vertexAttribPointer(activeShaderProgram.attributes.aVertexPosition, quadBuffers2D.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadBuffers2D.vertexIndexBuffer);
		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uPMatrix, false, pMatrix);
		
		mat4.set(invertedWorldCamera, mvMatrix);
		//normally in drawObjectFromPreppedBuffers
		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uMVMatrix, false, mvMatrix);
		
		var explosionParticles = explosionParticleArrs[worldA];
		var expParticleBuffers = explosionParticles.getBuffers();
		explosionParticles.getRangesToDraw(frameTime).forEach(elem=>{
			//	console.log(elem);
			var offs = elem.start * 16;
			gl.vertexAttribDivisor(activeShaderProgram.attributes.aVertexCentrePosition, 1);
			gl.bindBuffer(gl.ARRAY_BUFFER, expParticleBuffers.posns);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aVertexCentrePosition, 4, gl.SHORT, true, 16, offs);
			if (activeShaderProgram.attributes.aVertexCentreDirection){
				gl.vertexAttribDivisor(activeShaderProgram.attributes.aVertexCentreDirection, 1);
				gl.vertexAttribPointer(activeShaderProgram.attributes.aVertexCentreDirection, 4, gl.SHORT, true, 16, offs+8);
			}
			if (activeShaderProgram.attributes.aColor){
				gl.vertexAttribDivisor(activeShaderProgram.attributes.aColor, 1);
				gl.bindBuffer(gl.ARRAY_BUFFER, expParticleBuffers.colrs);
				gl.vertexAttribPointer(activeShaderProgram.attributes.aColor, 4, gl.UNSIGNED_BYTE, true, 4, offs/4);
			}
			if (activeShaderProgram.uniforms.uTime){		
				gl.uniform1f(activeShaderProgram.uniforms.uTime, frameTime);			
			}
			gl.drawElementsInstanced(gl.TRIANGLES, quadBuffers2D.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, elem.number);
		});
		
		//seems like maybe has effect outside of drawElementsInstancedANGLE calls. to be safe,
		zeroAttributeDivisors(activeShaderProgram);
	}
	
	function zeroAttributeDivisors(shaderProg){
		//seems like these carry over between invokations of drawElementsInstancedANGLE, loading different shaders.
		//for now, set all to zero before setting those wanted to 1
		//TODO store last value, only call angle_ext.vertexAttribDivisorANGLE when different (do values carry over when change shader?)

		for (var ii=0;ii<shaderProg.numActiveAttribs;ii++){
			gl.vertexAttribDivisor(ii,0);
		}
		
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
		
	if (guiParams.debug.closestPoint){

		//not really closest point - just the point below player on terrain
		if (worldInfo.duocylinderModel == 'procTerrain'){
			terrainCollisionTestBoxPos = terrainGetHeightFor4VecPos(playerPos, worldInfo.spin);		//TODO in position update (not rendering)
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.001,0.001,0.001);
			drawPreppedBufferOnDuocylinder(terrainCollisionTestBoxPos.b,terrainCollisionTestBoxPos.a,terrainCollisionTestBoxPos.h *Math.sqrt(2), [1.0, 0.4, 1.0, 1.0], cubeBuffers);
		}
	
		if (Object.keys(voxTerrainData).includes(worldInfo.duocylinderModel)){
			debugDraw.drawTriAxisCrossForMatrixColorAndScale(closestPointTestMat, colorArrs.magenta, 0.02);
			debugDraw.drawTriAxisCrossForMatrixColorAndScale(voxCollisionDebugMat, colorArrs.blue, 0.01);
		}
	}
	
	
	var seaTime = 0.00005*(frameTime % 20000 ); //20s loop
	lastSeaTime=seaTime;	//for use in mechanics. TODO switch to using mechanics time for rendering instead
	if (worldInfo.seaActive){
		seaHeight.setZeroLevel(worldInfo.seaLevel);
		seaHeight.setPeakiness(worldInfo.seaPeakiness);	//TODO only call on ui change

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
			var testBuoyPos = seaHeightFor4VecPos(playerPos, seaTime, duocylinderSpin);
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.001,0.01,0.01);
			drawPreppedBufferOnDuocylinder(testBuoyPos.b,testBuoyPos.a,testBuoyPos.h, [1, 0, 0, 1], cubeBuffers);
		}
	}
	
	if (guiParams.debug.closestPoint){	//draw collision test objects		
		debugDraw.drawDebugStuff();
	}
	
	function drawPreppedBufferOnDuocylinderForBoxData(bb, activeShaderProgram, buffers, invertedCamera){
		var invertedCamera = invertedCamera || invertedWorldCamera;
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", bb.color);
		mat4.set(invertedCamera, mvMatrix);
		mat4.multiply(mvMatrix, bb.matrix);
		
		mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);		//TODO just prep a duocylinder matrix and set mMatrix to it
		mat4.multiply(mMatrix, bb.matrix);
		
		drawObjectFromPreppedBuffers(buffers, activeShaderProgram);
	}
	
	function drawPreppedBufferOnDuocylinder(aa, bb, hh, cc, buff){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", cc);
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
	var modelScale = smoothGuiParams.get("8-cell scale");

	var sortId = sortIdForMatrix(worldCamera);	//look up sort order for cells

	if (guiParams["draw 8-cell net"]){
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		draw8cellnet(activeShaderProgram, modelScale);
	}
	
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.darkGray);

	var polytopes = {
		"draw 8-cell": {
			mats:cellMatData.d8, 
			cullRad:guiParams.display.culling ? Math.sqrt(3): false, 
			scale:modelScale, 
			buffers: guiParams["subdiv frames"] ? cubeFrameSubdivBuffers: cubeFrameBuffers 
		},
		"draw 16-cell": {
			mats:cellMatData.d16, 
			cullRad:guiParams.display.culling ? 1.73: false, 
			scale: 4/Math.sqrt(6),	//in the model, vertices are 0.75*sqrt(2) from the centre, and want to scale to tan(PI/3)=sqrt(3)		
			buffers: guiParams["subdiv frames"]? tetraFrameSubdivBuffers: tetraFrameBuffers
		},
		"draw 24-cell": {
			mats: cellMatData.d24.cells,
			cullRad: guiParams.display.culling ? 1: false,
			scale: guiParams["24-cell scale"],
			buffers: guiParams["subdiv frames"] ? octoFrameSubdivBuffers : octoFrameBuffers
		},
		"draw 5-cell": {
			mats: cellMatData.d5,
			cullRad: false,
			scale: 2*Math.acos(-0.25),
			buffers: guiParams["subdiv frames"] ? tetraFrameSubdivBuffers : tetraFrameBuffers
		},
		"draw 120-cell": {
			mats: cellMatData.d120[sortId],
			cullRad: (guiParams.display.culling ?  dodecaScale*(0.4/0.515): false),
			scale: dodecaScale,
			buffers: dodecaFrameBuffers
		},
		"draw 600-cell": {
			mats: cellMatData.d600[sortId],
			cullRad: guiParams.display.culling ? 0.355: false,
			scale: 0.386, //todo use correct scale
			buffers: guiParams["subdiv frames"]? tetraFrameSubdivBuffers: tetraFrameBuffers
		}
	};

	Object.entries(polytopes).forEach(entry => {
		const [key, value] = entry;
		if (guiParams[key]){
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, value.scale,value.scale,value.scale);
			drawArrayOfModels(
				value.mats,
				value.cullRad,
				value.buffers
			);	
		}
	});

	var cubeFrames = bvhObjsForWorld[worldA].filter(objInfo=> objInfo.bvh == cubeFrameBvh)	//TODO prefilter
	if (cubeFrames.length>0){
		drawArrayOfModels2(cubeFrames, cubeFrameBuffers, activeShaderProgram);
	}
	var dodecaFrames = bvhObjsForWorld[worldA].filter(objInfo=> objInfo.bvh == dodecaFrameBvh2)	//TODO prefilter
	if (dodecaFrames.length>0){
		drawArrayOfModels2(dodecaFrames, dodecaFrameBuffers2, activeShaderProgram);
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

	//drawArrayOfModels + setting scale, without option to cull by bounding sphere, used for new bvh objects
	function drawArrayOfModels2(objDataArr, buffers, shaderProg){
		shaderProg = shaderProg || shaderProgramTexmap;
		prepBuffersForDrawing(buffers, shaderProg);
		drawArrayForFunc(function(){
			drawObjectFromPreppedBuffers(buffers, shaderProg);
			});
		
		function drawArrayForFunc(drawFunc2){
			for (dd in objDataArr){
				var thisObj = objDataArr[dd];
				var myscale = thisObj.scale;
				gl.uniform3f(activeShaderProgram.uniforms.uModelScale, myscale,myscale,myscale);
				mat4.set(invertedWorldCamera, mvMatrix);
				mat4.multiply(mvMatrix,thisObj.mat);
				mat4.set(thisObj.mat, mMatrix);	//not needed in all shaders
				drawFunc2();
			}
		}
	}
	
	if (guiParams.drawShapes.frigate && frigateBuffers.isLoaded){
		activeShaderProgram = shaderProgramTexmap;
		shaderSetup(activeShaderProgram, frigateTexture);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);

		modelScale = 0.001*guiParams.drawShapes.frigateScale;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		mat4.set(invertedWorldCamera, mvMatrix);
		rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
		mat4.multiply(mvMatrix,frigateMatrix);

		mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);
		mat4.multiply(mMatrix, frigateMatrix);
		drawObjectFromBuffers(frigateBuffers, activeShaderProgram);
	}



	//use a cube for turret base plate
	//TODO generalise this code for rotation to draw etc.

	//just constant rotation rate
	//var turretSpin = (frameTime/1000 )%(2*Math.PI);

	//rotate to point towards player. TODO check matrix is player, not the camera!
	// NOTE this just serves to get the player position in the frame of the turret. Full 4x4 matrix rotation is not necessary,
	// only need the player position to be multiplied by the (inverse of the) turret matrix
	var playerInTurretBaseFrame = mat4.create(playerCamera);
	mat4.transpose(playerInTurretBaseFrame);
	mat4.multiply(playerInTurretBaseFrame, turretBaseMatrix);

	//var turretSpin = Math.atan2(playerInTurretBaseFrame[12],playerInTurretBaseFrame[13]);
	var turretSpin = Math.atan2(playerInTurretBaseFrame[3],playerInTurretBaseFrame[11]);
	var sidewaysLength = Math.sqrt(playerInTurretBaseFrame[3]*playerInTurretBaseFrame[3] + playerInTurretBaseFrame[11]*playerInTurretBaseFrame[11]);
	var turretElev = Math.atan2(playerInTurretBaseFrame[7], sidewaysLength);

	activeShaderProgram = shaderProgramTexmap;
	shaderSetup(activeShaderProgram, diffuseTexture);	//TODO different texture.
	modelScale = 0.005*guiParams.drawShapes.frigateScale;	//TODO different
	mat4.set(invertedWorldCamera, mvMatrix);
	rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
	mat4.multiply(mvMatrix,turretBaseMatrix);

	mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);
	mat4.multiply(mMatrix, turretBaseMatrix);

	gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale/4,modelScale);	//base plate
	drawObjectFromBuffers(cubeBuffers, activeShaderProgram);

	rotate4mat(mvMatrix, 2, 0, turretSpin);
	rotate4mat(mMatrix, 2, 0, turretSpin);

	gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/2,modelScale,modelScale/2);
	drawObjectFromBuffers(cubeBuffers, activeShaderProgram);

	rotate4mat(mvMatrix, 1, 2, -turretElev);
	rotate4mat(mMatrix, 1, 2, -turretElev);
	
	gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/8,modelScale/8,modelScale*2);	//gun
	drawObjectFromBuffers(cubeBuffers, activeShaderProgram);

	if (guiParams.display.cameraAttachedTo == "turret"){
		setMat4FromToWithQuats(turretBaseMatrix, offsetPlayerCamera);		
		xyzrotate4mat(offsetPlayerCamera, [0,turretSpin + Math.PI,0]);
		xyzrotate4mat(offsetPlayerCamera, [turretElev,0,0]);

		offsetCam.setType(guiParams.display.cameraType);
		moveMatHandlingPortal(offsetCameraContainer, offsetCam.getVec());
	}


	if (guiParams.drawShapes.building && buildingBuffers.isLoaded){
		activeShaderProgram = shaderPrograms.coloredPerPixelDiscardVertexColoredTexmap[ guiParams.display.atmosShader ];
		shaderSetup(activeShaderProgram);

		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);

		modelScale = 0.01*guiParams.drawShapes.buildingScale;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		mat4.set(invertedWorldCamera, mvMatrix);
		rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
		mat4.multiply(mvMatrix,buildingMatrix);

		mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);
		mat4.multiply(mMatrix, buildingMatrix);

		bind2dTextureIfRequired(bricktex);	//??
		drawObjectFromBuffers(buildingBuffers, activeShaderProgram);
	}

	if (guiParams.drawShapes.octoFractal && octoFractalBuffers.isLoaded){
		//using same shader as above. avoid re-setting stuff. TODO avoid more.
		var desiredProgram = shaderPrograms.coloredPerPixelDiscardVertexColored[ guiParams.display.atmosShader ];
		if (activeShaderProgram != desiredProgram){
			activeShaderProgram = desiredProgram;
			shaderSetup(activeShaderProgram);
		}

		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);

		modelScale = 0.01*guiParams.drawShapes.octoFractalScale;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		mat4.set(invertedWorldCamera, mvMatrix);
		rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
		mat4.multiply(mvMatrix,octoFractalMatrix);

		mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);
		mat4.multiply(mMatrix, octoFractalMatrix);
		drawObjectFromBuffers(octoFractalBuffers, activeShaderProgram);
	}


	[{buffersToDraw:lucyBuffers, bvh:lucyBvh}, {buffersToDraw:mushroomBuffers, bvh: mushroomBvh}].forEach(info => {
		var objs = bvhObjsForWorld[worldA].filter(objInfo=> objInfo.bvh == info.bvh);	//TODO prefilter
		if (objs.length >0){
		var desiredProgram = shaderPrograms.coloredPerPixelDiscardVertexColored[ guiParams.display.atmosShader ];
		if (activeShaderProgram != desiredProgram){
			activeShaderProgram = desiredProgram;
			shaderSetup(activeShaderProgram);
		}
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
		drawArrayOfModels2(
			objs,
			info.buffersToDraw,
			activeShaderProgram);
		}
	});

	if (guiParams.drawShapes.viaduct == 'individual' && bridgeBuffers.isLoaded){
		var desiredProgram = shaderPrograms.coloredPerPixelDiscardVertexColoredTexmapBendy[ guiParams.display.atmosShader ];

		if (activeShaderProgram != desiredProgram){
			activeShaderProgram = desiredProgram;
			shaderSetup(activeShaderProgram);
		}
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
		modelScale = 0.042;	//TODO calculate correct value
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);

		bind2dTextureIfRequired(bricktex);
		prepBuffersForDrawing(bridgeBuffers, activeShaderProgram);

		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uVMatrix, false, invertedWorldCameraDuocylinderFrame);

		drawBendyObjectsRing(duocylinderBoxInfo.viaducts.list);
		drawBendyObjectsRing(duocylinderBoxInfo.viaducts2.list);

		function drawBendyObjectsRing(list){
			for (var ii=0;ii<list.length;++ii){
				mat4.identity(mMatrixA);rotate4mat(mMatrixA, 0, 1, duocylinderSpin);
				mat4.multiply(mMatrixA, list[ii].matrix);
				mat4.identity(mMatrixB);rotate4mat(mMatrixB, 0, 1, duocylinderSpin);
				mat4.multiply(mMatrixB, list[(ii+1)%list.length].matrix);
				drawObjectFromPreppedBuffers(bridgeBuffers, activeShaderProgram);
			}
		}
	}

	if (guiParams.drawShapes.viaduct == 'instanced' && bridgeBuffers.isLoaded){
		var desiredProgram = shaderPrograms.coloredPerPixelDiscardVertexColoredTexmapBendyInstanced[ guiParams.display.atmosShader ];

		if (activeShaderProgram != desiredProgram){
			activeShaderProgram = desiredProgram;
			shaderSetup(activeShaderProgram);
		}
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
		modelScale = 0.042;	//TODO calculate correct value
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);

		bind2dTextureIfRequired(bricktex);
		prepBuffersForDrawing(bridgeBuffers, activeShaderProgram);

		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uVMatrix, false, invertedWorldCameraDuocylinderFrame);

		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixA_A, 1);
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixA_B, 1);
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixA_C, 1);
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixA_D, 1);
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixB_A, 1);
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixB_B, 1);
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixB_C, 1);
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aMMatrixB_D, 1);

		drawBendyObjectsRingInstanced(bridgeBuffers, duocylinderBoxInfo.viaducts);
		drawBendyObjectsRingInstanced(bridgeBuffers, duocylinderBoxInfo.viaducts2);

		zeroAttributeDivisors(activeShaderProgram);	//clean up

		function drawBendyObjectsRingInstanced(objBufferForInstances, container){
			gl.bindBuffer(gl.ARRAY_BUFFER, container.buffersForInstancedDrawing);
				//TODO don't bind each time when drawing multiple - bind whole lot, draw ranges?

			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixA_A, 4, gl.FLOAT, false, 64, 0);	//https://community.khronos.org/t/how-to-specify-a-matrix-vertex-attribute/54102/3
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixA_B, 4, gl.FLOAT, false, 64, 16);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixA_C, 4, gl.FLOAT, false, 64, 32);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixA_D, 4, gl.FLOAT, false, 64, 48);
			
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixB_A, 4, gl.FLOAT, false, 64, 64);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixB_B, 4, gl.FLOAT, false, 64, 64+16);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixB_C, 4, gl.FLOAT, false, 64, 64+32);
			gl.vertexAttribPointer(activeShaderProgram.attributes.aMMatrixB_D, 4, gl.FLOAT, false, 64, 64+48);

			gl.drawElementsInstanced(gl.TRIANGLES, objBufferForInstances.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, container.list.length);
		}
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
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.randBoxes);
		drawTennisBall(randBoxBuffers, activeShaderProgram);	//todo draw subset of buffer according to ui controlled number
	}
	
	if (guiParams.drawShapes.singleBufferStonehenge){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.gray);
		drawTennisBall(stonehengeBoxBuffers, activeShaderProgram);
	}
	
	activeShaderProgram = guiParams.display.useSpecular ? shaderPrograms.texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscardNormalmapVcolorAndDiffuse[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "normal map");
	
	if (guiParams.drawShapes.singleBufferTowers){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);	//uColor is redundant here since have vertex colors. TODO lose it?
		drawTennisBall(towerBoxBuffers, activeShaderProgram);
	}
	
	activeShaderProgram = guiParams.display.useSpecular ? shaderPrograms.texmap4VecPerPixelDiscardNormalmapPhongAndDiffuse[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscardNormalmapAndDiffuse[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "normal map");
	
	if (guiParams.drawShapes.singleBufferRoads){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.darkGray);
		drawTennisBall(roadBoxBuffers, activeShaderProgram);
	}
	/*
	activeShaderProgram = shaderPrograms.texmap4Vec[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "log3");
	*/
	if (worldInfo.duocylinderModel!='none' && worldInfo.duocylinderModel!='l3dt-brute' && worldInfo.duocylinderModel!='l3dt-blockstrips'){
		drawDuocylinderObject(wSettings, duocylinderObjects[worldInfo.duocylinderModel]);
	}

	// special case for drawing terrain2. TODO fit into standard draw (above)
	if (worldInfo.duocylinderModel=='l3dt-brute'){
		if (terrain2Buffer.isInitialised){
			drawTerrain2(wSettings);
		}else{
			console.log("terrain2 not yet initialised");
		}
	}
	if (worldInfo.duocylinderModel=='l3dt-blockstrips'){
		if(terrain2Buffer.isInitialised){
			drawTerrain2BlockStrips(wSettings);
		}else{
			console.log("terrain2 not yet initialised");
		}
	}
			
	//if (worldInfo.seaActive && isCubemapView){	//draw this in drawWorldScene2 for standard view (using depth image from drawWorldScene) TODO move there for cubemap view also.
	//	drawDuocylinderObject(wSettings, duocylinderObjects['sea'], guiParams.seaLevel, seaTime);
	//}

	if (guiParams.debug.textTextBox){
		//draw a test cube to test text rendering.
		var textTestMatrix = mat4.identity();	//TODO don't keep recreating
		xyzmove4mat(textTestMatrix, [0,0,0.5]);
		
		shaderSetup(shaderPrograms.texmapPerPixelDiscardForText[ guiParams.display.atmosShader ], fontTexture); //TODO proper shader with variable contrasting

		var textTextCubeScale = duocylinderSurfaceBoxScale*1;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, textTextCubeScale,textTextCubeScale,textTextCubeScale);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
		gl.uniform1f(activeShaderProgram.uniforms.uSharpScale, 0.5);	//? what should this be?

		mat4.set(textTestMatrix, mMatrix);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,mMatrix);

		drawObjectFromBuffers(cubeBuffers, activeShaderProgram);
	}
	
	//draw objects without textures
	activeShaderProgram = shaderProgramColored;
	gl.useProgram(activeShaderProgram);
	
	if (activeShaderProgram.uniforms.uVertexMove){
		gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, guiParams.normalMove);
	}
	
	gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emmision
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uFogColor", localVecFogColor);

	setPortalInfoForShader(activeShaderProgram, infoForPortals);

	if (activeShaderProgram.uniforms.uPlayerLightColor){
		gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
	}
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);


	var teapots = bvhObjsForWorld[worldA].filter(objInfo=> objInfo.bvh == teapotBvh);	//TODO prefilter
	if (teapots.length >0){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.gray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0.1,0.3);	//some emission
		drawArrayOfModels2(
			teapots,
			teapotBuffers,
			activeShaderProgram);
	}

	
	
	bvhObjsForWorld[worldA]
		.filter(objInfo=> objInfo.bvh == pillarBvh)	//TODO prefilter
		.forEach(objInfo => {
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, objInfo.scale,objInfo.scale,objInfo.scale);
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,objInfo.mat);
			mat4.set(objInfo.mat, mMatrix);	
			drawObjectFromBuffers(pillarBuffers, activeShaderProgram);
		});
	bvhObjsForWorld[worldA]
		.filter(objInfo=> objInfo.bvh == gunBvh)	//TODO prefilter
			//TODO vert colours or texture bake (already use baked texture for guns on player object)
		.forEach(objInfo => {
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, objInfo.scale,objInfo.scale,objInfo.scale);
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,objInfo.mat);
			mat4.set(objInfo.mat, mMatrix);	
			drawObjectFromBuffers(gunBuffers, activeShaderProgram);
		});

	//NOTE this is inefficient but is just debug drawing (could make fast by instancing.)
	if (guiParams.debug.bvhBoundingSpheres){
		prepBuffersForDrawing(sphereBuffersHiRes, activeShaderProgram);
		bvhObjsForWorld[worldA].forEach(bvhObj => {
			var modelScale = bvhObj.scale * bvhObj.bvh.boundingSphereRadius;
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, bvhObj.mat);
			mat4.set(bvhObj.mat, mMatrix);
			drawObjectFromPreppedBuffers(sphereBuffersHiRes, activeShaderProgram);
		});
	}
	
	if (guiParams.drawShapes.hyperboloid){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.gray);
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
	
	if (guiParams.drawShapes.pillars && pillarBuffers.isLoaded){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.darkGray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emission
		modelScale=0.1;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/4,modelScale/4,modelScale);

		prepBuffersForDrawing(pillarBuffers, activeShaderProgram);
		for (var ii=0;ii<pillarMatrices.length;ii++){
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,pillarMatrices[ii]);
			mat4.set(pillarMatrices[ii], mMatrix);
			drawObjectFromBuffers(pillarBuffers, activeShaderProgram);
		}
	}
	if (guiParams.drawShapes.bendyPillars && pillarBuffers.isLoaded){
		//use special shader that takes 2 mv matrices, blends between the two, weighting by vertex coordinate.
		// TODO fix coloured object shader (seems broken when halfway around world. fog? )

		activeShaderProgram = shaderProgramColoredBendy;

		//copy setup for coloured object shader. TODO deduplicate

		gl.useProgram(activeShaderProgram);
		
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uFogColor", localVecFogColor);

		setPortalInfoForShader(activeShaderProgram, infoForPortals);

		if (activeShaderProgram.uniforms.uPlayerLightColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
		}
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.veryDarkGray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emission
		modelScale=0.1;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/4,modelScale/4,modelScale);

		prepBuffersForDrawing(pillarBuffers, activeShaderProgram);

		for (var ii=0;ii<pillarMatrices.length -1;ii++){
			mat4.set(invertedWorldCamera, mvMatrixA);
			mat4.multiply(mvMatrixA,pillarMatrices[ii]);
			mat4.set(pillarMatrices[ii],mMatrixA);

			mat4.set(invertedWorldCamera, mvMatrixB);
			mat4.multiply(mvMatrixB,pillarMatrices[ii+1]);	
			mat4.set(pillarMatrices[ii+1], mMatrixB);

			drawObjectFromPreppedBuffers(pillarBuffers, activeShaderProgram);
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
					uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.target);
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
					uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
					drawObjectFromBuffers(cubeBuffers, activeShaderProgram);
					activeShaderProgram = savedActiveProg;
					gl.useProgram(activeShaderProgram);
				}
				break;
		}
	}


	
	var drawFunc = {
		"spaceship" : drawSpaceship,
		"plane": drawPlane,
		"ball": drawBall
	}[guiParams["player model"]];
	
	for (var mat of sshipDrawMatrices){
		drawFunc(mat);
	}
	
	function drawSpaceship(matrix){
		if (sshipBuffers.isLoaded){
			drawPlayerGradlightObject(matrix, sshipBuffers, sshipTexture, sshipTexture2, sshipModelScale, 1,true);
			//TODO use object that doesn't require scaling
		}
	}

	function drawPlane(matrix){
		drawPlayerGradlightObject(matrix, su57Buffers, su57texture, su57texture2, 0.006, -1,false);
	}

	function drawPlayerGradlightObject(matrix, buffers, tex, tex2, modelScale, lightBodge, includeGuns){

		var rotatedMatrix = drawSsshipRotatedMat;	//avoid repeatedly looking up global scope variables
		var inverseSshipMat = drawSsshipInverseSshipMat; //""

		//temp switch back to texmap shader (assume have already set general uniforms for this)	-	TODO put uniforms in!!
		//activeShaderProgram = shaderProgramTexmap;
		activeShaderProgram = shaderPrograms.texmapPerPixelDiscardAtmosGradLight[guiParams.display.atmosShader];
		gl.useProgram(activeShaderProgram);
		
		bind2dTextureIfRequired(tex);	
		bind2dTextureIfRequired(tex2, gl.TEXTURE2);
		
		//set uniforms - todo generalise this code (using for many shaders)
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uFogColor", localVecFogColor);

		setPortalInfoForShader(activeShaderProgram, infoForPortals);

		if (activeShaderProgram.uniforms.uPlayerLightColor){
			gl.uniform3fv(activeShaderProgram.uniforms.uPlayerLightColor, playerLight);
		}
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);
		
		if (activeShaderProgram.uniforms.uOtherLightAmounts){
			gl.uniform4f(activeShaderProgram.uniforms.uOtherLightAmounts, 0, 100*(muzzleFlashAmounts[0]+muzzleFlashAmounts[1]), 20*(currentThrustInput[2]>0 ? 1:0) , 0);
		}				//note muzzleFlashAmounts should be summed over all guns, just doing 2 because symmetric
		
		mat4.set(matrix, rotatedMatrix);	//because using rotated model data for sship model
		xyzrotate4mat(rotatedMatrix, [-Math.PI/2,0,0]); 
		
		//uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.gray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
		
		//set special uniform for this shader (currently 1st portal only)
		//TODO make below more efficient (do with fewer matrix mults, less garbage - committing because it works!
		// also can likely use rotatedMatrix
		var ssmCopy = mat4.create();	
		var tmpPortalMat = mat4.create();

		mat4.set(matrix, ssmCopy);  //likely matrix = sshipDrawMatrix
		xyzrotate4mat(ssmCopy, [-Math.PI/2,0,0]); 
		mat4.transpose(ssmCopy);
		mat4.set(infoForPortals[0].mat, tmpPortalMat);	//set 2nd matrix equal to 1st.
		xyzrotate4mat(tmpPortalMat, [-Math.PI/2,0,0]); 
		mat4.multiply(ssmCopy, tmpPortalMat);
		mat4.transpose(ssmCopy);
		gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame, lightBodge*ssmCopy[3],lightBodge*ssmCopy[7],lightBodge*ssmCopy[11]);

		if (infoForPortals.length > 1){
			mat4.set(matrix, ssmCopy);
			xyzrotate4mat(ssmCopy, [-Math.PI/2,0,0]); 
			mat4.transpose(ssmCopy);
			mat4.set(infoForPortals[1].mat, tmpPortalMat);	//set 2nd matrix equal to 1st.
			xyzrotate4mat(tmpPortalMat, [-Math.PI/2,0,0]); 
			mat4.multiply(ssmCopy, tmpPortalMat);
			mat4.transpose(ssmCopy);
			gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame2, lightBodge*ssmCopy[3],lightBodge*ssmCopy[7],lightBodge*ssmCopy[11]);
		}else{
			gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame2, 0.5,0.5,0.5);
			//zero?
		}

		if (infoForPortals.length > 2){
			mat4.set(matrix, ssmCopy);
			xyzrotate4mat(ssmCopy, [-Math.PI/2,0,0]); 
			mat4.transpose(ssmCopy);
			mat4.set(infoForPortals[2].mat, tmpPortalMat);	//set 2nd matrix equal to 1st.
			xyzrotate4mat(tmpPortalMat, [-Math.PI/2,0,0]); 
			mat4.multiply(ssmCopy, tmpPortalMat);
			mat4.transpose(ssmCopy);
			gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame3, lightBodge*ssmCopy[3],lightBodge*ssmCopy[7],lightBodge*ssmCopy[11]);
		}else{
			gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame3, 0.5,0.5,0.5);
			//zero?
		}
		
		mat4.set(invertedWorldCamera, mvMatrix);
		
		mat4.multiply(mvMatrix,rotatedMatrix);
		mat4.set(rotatedMatrix, mMatrix);

		if (buffers.isLoaded){
			drawObjectFromBuffers(buffers, activeShaderProgram);
		}
		
		//draw guns
		if (includeGuns && gunBuffers.isLoaded){
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
		}
		
		function drawGun(gunMatrix){
			
			mat4.set(matrix, mMatrix);	//todo make this more efficient by combining with above
			mat4.multiply(mMatrix, inverseSshipMat);
			mat4.multiply(mMatrix, gunMatrix);
			//xyzrotate4mat(mMatrix, [0,-Math.PI/2,0]);	//bodge to account for saving gun in wrong orientation (pointing -x in blender)
		//	xyzrotate4mat(mMatrix, [-Math.PI/2,0,0]);	//facing +y in blender. still not what want!

			xyzrotate4mat(mMatrix, [Math.PI,0,0]);

			//taking the gun matrix rotation relative to the spaceship matrix, then applying this to the cosmetic spaceship matrix (therefore including rendering hack position shift, and version reflected in portal)
			mat4.identity(mvMatrix);
			mat4.multiply(mvMatrix, invertedWorldCamera);
			mat4.multiply(mvMatrix, mMatrix);


			//TODO make more efficient (expect can cancel out terms), create less garbage.
			var ssmCopy = mat4.create();	
			var tmpPortalMat = mat4.create();

			mat4.set(mMatrix, ssmCopy);
			mat4.transpose(ssmCopy);
			mat4.set(infoForPortals[0].mat, tmpPortalMat);	//set 2nd matrix equal to 1st.
			xyzrotate4mat(tmpPortalMat, [Math.PI,0,0]); 
			mat4.multiply(ssmCopy, tmpPortalMat);
			mat4.transpose(ssmCopy);
			gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame, ssmCopy[3],ssmCopy[7],ssmCopy[11]);

			if (infoForPortals.length > 1){
				mat4.set(mMatrix, ssmCopy);
				mat4.transpose(ssmCopy);
				mat4.set(infoForPortals[1].mat, tmpPortalMat);	//set 2nd matrix equal to 1st.
				xyzrotate4mat(tmpPortalMat, [Math.PI,0,0]); 
				mat4.multiply(ssmCopy, tmpPortalMat);
				mat4.transpose(ssmCopy);
				gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame2, ssmCopy[3],ssmCopy[7],ssmCopy[11]);
			}else{
				gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame2, 0.5,0.5,0.5);
				//zero?
			}

			if (infoForPortals.length > 2){
				mat4.set(matrix, ssmCopy);
				mat4.transpose(ssmCopy);
				mat4.set(infoForPortals[2].mat, tmpPortalMat);	//set 2nd matrix equal to 1st.
				xyzrotate4mat(tmpPortalMat, [Math.PI,0,0]); 
				mat4.multiply(ssmCopy, tmpPortalMat);
				mat4.transpose(ssmCopy);
				gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame3, ssmCopy[3],ssmCopy[7],ssmCopy[11]);
			}else{
				gl.uniform3f(activeShaderProgram.uniforms.uLightPosPlayerFrame3, 0.5,0.5,0.5);
				//zero?
			}


			gl.uniform4f(activeShaderProgram.uniforms.uOtherLightAmounts, 0,0,0,0);	//no thruster/gun light used here currently

			drawObjectFromPreppedBuffers(gunBuffers, activeShaderProgram);
		}		
	}
	
	//draw "light" object
	function drawBall(matrix){
		drawSimplePlayerObject(matrix, sphereBuffers, 1);
	}

	function drawSimplePlayerObject(matrix, objectBuffers, scaleFactor){
		var sphereRad = settings.playerBallRad;
		var objScale= sphereRad* scaleFactor;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, objScale,objScale,objScale);
		var voxColliding = (voxCollisionCentralLevel>0) || (distBetween4mats(playerCamera, closestPointTestMat) < sphereRad); 
						//sphere centre inside voxel volume OR sphere intersects with voxel zero surface.
			//note could just have a simple signed distance, of vox field value divided by magnitide of gradient. however, current gradient is in abc space. TODO make work with this clunky version, then try abc-> player space gradient conversion, check results are consistent.
		
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", voxColliding ? colorArrs.red: colorArrs.white);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,	matrix);
		if (frustumCull(mvMatrix,sphereRad)){
			drawObjectFromBuffers(objectBuffers, shaderProgramColored);
		}
	}
	

	var portals = portalsForWorld[worldA];

	var portalMatArr = portals.map(p => p.matrix);
	
	var portalInCameraArr = portals.map(p => {
		var portalInCamera = mat4.create(invertedWorldCamera);	//TODO reuse matrix from pool
		mat4.multiply(portalInCamera, p.matrix);
		return portalInCamera;
	});

	//draw frame around portal/reflector
	if (guiParams.reflector.drawFrame){
		//draw all frames for the current world (2 portal entrances per world)
		
		activeShaderProgram = shaderProgramTexmap;
		shaderSetup(activeShaderProgram, texture);

		for (var ii=0;ii<portals.length;ii++){
			drawPortalFrame(portals[ii].shared, activeShaderProgram, portalMatArr[ii], portalInCameraArr[ii]);
		}
	}

	function drawPortalFrame(sharedInfo, shaderProg, portalMat, portalInCamera){

		var frameScale = sharedInfo.radius;
		gl.uniform3f(shaderProg.uniforms.uModelScale, frameScale,frameScale,frameScale);

		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", sharedInfo.color);

		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		drawObjectFromBuffers(cubeFrameSubdivBuffers, shaderProg);

		//draw coloured axis objects
		var smallScale = frameScale*0.1;
		gl.uniform3f(shaderProg.uniforms.uModelScale, smallScale,smallScale,smallScale);
		var moveAmount = Math.atan(frameScale) + smallScale;	//to portal surface then by small frame size

		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", colorArrs.red);
		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		xyzmove4mat(mvMatrix, [moveAmount,0,0]);	//TODO correct mMatrix, but IIRC only impacts lighting 
		drawObjectFromBuffers(cubeBuffers, shaderProg);
		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", colorArrs.green);
		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		xyzmove4mat(mvMatrix, [0,moveAmount,0]);	//TODO correct mMatrix, but IIRC only impacts lighting 
		drawObjectFromBuffers(cubeBuffers, shaderProg);
		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", colorArrs.blue);
		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		xyzmove4mat(mvMatrix, [0,0,moveAmount]);	//TODO correct mMatrix, but IIRC only impacts lighting 
		drawObjectFromBuffers(cubeBuffers, shaderProg);
	}

	if (guiParams.reflector.draw !="none"){
		drawPortalsForMultipleCameraViews(isCubemapView, wSettings, portals, portalMatArr, 
			portalInCameraArr, worldColors, frameTime, viewSettings, localVecFogColor);
	}
}

function getReflectorShaderAndMesh(){
	var activeReflectorShader;
	switch(guiParams.reflector.mappingType){
		case 'projection':
			activeReflectorShader = shaderPrograms.cubemap[ guiParams.display.atmosShader ];
			break;
		case 'vertex projection':
			activeReflectorShader = shaderPrograms.vertprojCubemap[ guiParams.display.atmosShader ];
			break;
		case 'screen space':
			activeReflectorShader = shaderPrograms.specialCubemap[ guiParams.display.atmosShader ];
			break;
		case 'screen space 2':
			activeReflectorShader = shaderPrograms.specialCubemap2[ guiParams.display.atmosShader ];
			break;
		case 'vertproj mix':
			activeReflectorShader = shaderPrograms.vertprojMix[ guiParams.display.atmosShader ];
			break;
		case 'depth to alpha copy':	//test
			activeReflectorShader = shaderPrograms.vertprojCubemapTestDepthAlpha[ guiParams.display.atmosShader ];
			break;
	}

	var meshToDraw = sphereBuffers;
	switch (guiParams.reflector.draw){
		case "high":
			meshToDraw = sphereBuffersHiRes;
			break;
		case "mesh":
			meshToDraw = meshSphereBuffers;
			break;
		default:
			break;
	}

	return {
		activeReflectorShader,
		meshToDraw
	}
}


function drawPortalsForMultipleCameraViews(isCubemapView, wSettings, portals, portalMatArr, 
	portalInCameraArr, worldColors, frameTime, viewSettings, localVecFogColor){
	//currently just testing can move to a function and only using for 1 cam view at a time.
	//TODO pass in multiple camera views and loop through for each portal

	//DRAW PORTALS/REFLECTORS
	var {activeReflectorShader, meshToDraw} = getReflectorShaderAndMesh();
	

	//work around drawing portal cubemaps messing up subsequent drawing of portals.
	//this is a problem likely introduced when moving the portal cubemap drawing code from before main scene, to here at the
	//end, before using those cubemaps to draw portals. 
	//without this, fog/atmos on portal (not drawn to the cube maps, but drawn when rendering the portal sphere to the main view
	//is wrong. unclear whether this is the full story - fogging still appears too thick when very close to portal (should go to nothing
	//as approach surface, transition thru portal when portal deep in atmos seems wrong too.
	//TODO fix more properly - 
	var savedWorldCamera = mat4.create(worldCamera);
	var savedFogColor = localVecFogColor;

	if (isCubemapView){
		//draw simple fog coloured spheres, so pop-in less jarring.
		//TODO draw properly, maybe can make more efficient since view of one portal through another doesn't change much

		// TODO don't draw the portal that are looking through.
		for (var ii=0;ii<portals.length;ii++){

			var portalRad = 1.02*portals[ii].shared.radius;

			//TODO remove this - perhaps just remove calls to it (don't draw portal at all),
			// and prerender several iterations of each portal (ie portal in portal in portal ... is invisible,
			// but practically doesn't matter since < pixel size)
			function drawPlaceholderPortal(){
				activeShaderProgram = shaderProgramColored;
				gl.useProgram(activeShaderProgram);
				performShaderSetup(activeShaderProgram, wSettings);	//?? appears to not help
	
				var placeholderPortalMesh = sphereBuffersHiRes;
				
				var pColor = worldColors[portals[ii].otherps.world];
				
				gl.uniform3f(activeShaderProgram.uniforms.uModelScale, portalRad,portalRad,portalRad);		
				uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.black);
				gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, pColor[0], pColor[1], pColor[2]);
				mat4.set(portalInCameraArr[ii], mvMatrix);mat4.set(portalMatArr[ii], mMatrix);
				drawObjectFromBuffers(placeholderPortalMesh, activeShaderProgram);
			}

			if (frustumCull(portalInCameraArr[ii], portals[ii].shared.radius)){
				//if don't scale up a bit, invisible because within discard radius!
				//TODO a shader without discard - should also be emmissive, not lit by world...

				
				var otherPortalSide = guiParams.reflector.isPortal ? portals[ii].otherps : 
					portals[ii];

				if (!otherPortalSide.prerenderedView.haveDrawn){
					drawPlaceholderPortal();
				}else{

				var currentTex = getCurrentTex();
				drawCentredCubemap(otherPortalSide);

				//TODO don't calculate these here, since for portal in portal, done for every cubemap face portal in portal is seen in.
				//there is already reflectorInfoArr, but not currently suitable due to jumbling of portalInCameraArr, portalMatArr relative to this (in order to 
				// put the portal that want to discard pixels for first - if fix that, can avoid calculation here, just use reflectorInfoArr[ii]
				var returnObj = {};
				var transposed = mat4.create(portalInCameraArr[ii]);
				mat4.transpose(transposed);
				calcReflectionInfo(transposed, returnObj, portalRad);

				debugPortalInfo = {returnObj, ii, portals, reflectorInfoArr, infoForPortals};

				returnObj.rad = guiParams.reflector.draw!="none" ? portals[ii].shared.radius : 0;	//when "draw" off, portal is inactivate- can't pass through, doesn't discard pix

				drawPortal(activeReflectorShader, portalMatArr[ii], meshToDraw, returnObj, portalInCameraArr[ii],false);
									
//					setCubemapTex(currentTex);	//maybe unnecessary

				}
			}
		}
		
	}else{
		
		var savedPMatrix = mat4.create(pMatrix);	//nonCmapPMatrix for non-quadview, will be different for quadrant views
		var savedFrustumCull = frustumCull;

		for (var ii=0;ii<portals.length;ii++){
			if (frustumCull(portalInCameraArr[ii],reflectorInfoArr[ii].rad)){
				drawPortalCubemapAtRuntime(pMatrix, portalInCameraArr[ii], frameTime, reflectorInfoArr[ii],ii);

				if (reverseCamera){
					gl.cullFace(gl.FRONT);
				}

				//set things back - TODO don't use globals for stuff so don't have to do this! unsure exactly what need to put back...
				gl.bindFramebuffer(gl.FRAMEBUFFER, viewSettings.buf);
				gl.viewport( 0,0, viewSettings.width, viewSettings.height );	//TODO different for quad views

				mat4.set(savedPMatrix, pMatrix);
				frustumCull = savedFrustumCull;	

				mat4.set(savedWorldCamera, worldCamera);
				localVecFogColor=savedFogColor;
				drawPortal(activeReflectorShader, portalMatArr[ii], meshToDraw, reflectorInfoArr[ii], portalInCameraArr[ii],true);
			}
		}
		
	}


	gl.useProgram(activeShaderProgram);

	function drawPortal(shaderProgram, portalMat, meshToDraw, reflInfo, portalInCamera, isInMainCameraView){
		//TODO move elsewhere, pass in everything needed.
		//TODO do cubemap rendering here, so can use reuse cubemap texture when drawing multiple portals.
		//TODO later, draw cubemap for portal 1, then render both eyes when in stereo mode using depth buffer ray tracing - means switching between drawing each eye view.

		gl.useProgram(shaderProgram);
		gl.uniformMatrix4fv(shaderProgram.uniforms.uPosShiftMat, false, reflInfo.shaderMatrix);
		
		uniform4fvSetter.setIfDifferent(shaderProgram, "uColor", colorArrs.white);
		uniform4fvSetter.setIfDifferent(shaderProgram, "uFogColor", localVecFogColor);

		if (shaderProgram.uniforms.uPlayerLightColor){
			gl.uniform3fv(shaderProgram.uniforms.uPlayerLightColor, playerLight);
		}
		
		//TODO check that mvmatrix stacks up with worldCamera OK...
		if (shaderProgram.uniforms.uPortalCameraPos){
			uniform4fvSetter.setIfDifferent(shaderProgram, "uPortalCameraPos", portalInCamera.slice(12));
		}

		if (shaderProgram.uniforms.uPolarityFSCopy){
			//TODO unbodge this
			//include this in something else passed in eg flip input coords? 
			//don't use polarity in VS???
			gl.uniform1f(shaderProgram.uniforms.uPolarityFSCopy, guiParams.reflector.isPortal? 1:-1);
		}
		
		mat4.set(portalInCamera, mvMatrix);
		mat4.set(portalMat,mMatrix);
		

		if (shaderProgram.uniforms.uFNumber){
			var fx=-1,fy=-1;
			if (isInMainCameraView){
				//todo keep this around. also used in fisheye shader.
				//fy = Math.tan(guiParams.display.cameraFov*Math.PI/360);	//todo pull from camera matrix?
				//fx = fy*gl.viewportWidth/gl.viewportHeight;		//could just pass in one of these, since know uInvSize
				
				//TODO don't recalulate/read these so much
				var var1 = guiParams.display.uVarOne;
				var var2 = 10.0/guiParams.display.cameraZoom;
				var ratio = 1/(gl.viewportWidth/gl.viewportHeight);
				var maxyvert = var2;
				var maxxvert = var2/ratio;
				var fx = maxxvert /(2.0 + var1*maxyvert*maxyvert);
				var fy = fx*ratio;
			}
			gl.uniform2f(shaderProgram.uniforms.uFNumber, fx, fy);
		}
		if (shaderProgram.uniforms.uCentrePosScaledFSCopy){
			gl.uniform3fv(shaderProgram.uniforms.uCentrePosScaledFSCopy, reflInfo.centreTanAngleVectorScaled	);
			
			if (shaderProgram.uniforms.uPortalRad){	//specific stuff to special
				gl.uniformMatrix4fv(shaderProgram.uniforms.uMVMatrixFSCopy, false, mvMatrix);
				gl.uniform1f(shaderProgram.uniforms.uPortalRad, reflInfo.rad);
			}
			
			//move matrix through portal for close rendering. 
			var matrixToPortal = mat4.create(mvMatrix);	//should be inverted matrix or regular?

			//does adding a qpair help??
			//matrixToPortal.qPair = mvMatrix.qPair.map(x=>x.map(y=>y));
				//TODO make a general function to copy mats!

				//TODO is this wanted?
			moveMatrixThruPortal(matrixToPortal, reflInfo.rad, 1, portalsForWorld[worldA][0], true);
				//skips start/end rotations. appears to fix rendering. TODO check for side effects
				//^^  bug? doesn't account for 2nd portal

		if (guiParams.reflector.test1){	//appears to do ~nothing
			var matToCopyFrom = reflInfo.shaderMatrix;
			matrixToPortal[3] = matToCopyFrom[12];
			matrixToPortal[7] = matToCopyFrom[13];
			matrixToPortal[11] = matToCopyFrom[14];
			matrixToPortal[15] = matToCopyFrom[15];
		}

			//think this transformation should be something like the transformation between the portaled matrix (cubemap camera matrix?) and where camera would be if portaled through matrix.
			mat4.multiply(matrixToPortal, reflInfo.shaderMatrix);
				//result is still a bit glitchy. suspect because calculation of matrixToPortal isn't quite right - moves by 2*portal radius , which is fine if close to portal, but really should move by a little less than this (see calculation of portal cubemap camera position.)
		
			
			gl.uniformMatrix4fv(shaderProgram.uniforms.uPortaledMatrix, false, matrixToPortal);
		}

		gl.uniform3f(shaderProgram.uniforms.uModelScale, reflInfo.rad,reflInfo.rad, reflInfo.rad);
	
		gl.uniform1f(shaderProgram.uniforms.uPolarity, reflInfo.polarity);
		
			
		if(['vertex projection','screen space','screen space 2','depth to alpha copy','vertproj mix'].includes(guiParams.reflector.mappingType) ){
			gl.uniform3fv(shaderProgram.uniforms.uCentrePosScaled, reflInfo.centreTanAngleVectorScaled);
		}

		drawObjectFromBuffers(meshToDraw, shaderProgram, true, false);
	}
}

function drawWorldScene2(frameTime, wSettings, depthMap){	//TODO drawing using rgba, depth buffer images from previous rendering
	//({worldA,worldInfo, localVecFogColor, localVecReflectorDiffColor, reflectorPosTransformed, dropLightPos} = wSettings);
	
	({worldInfo, sshipDrawMatrices, worldA} = wSettings);
	
	var duocylinderSpin = worldInfo.spin;

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
	

	if (worldInfo.duocylinderModel!='none' && worldInfo.duocylinderModel!='l3dt-brute' && worldInfo.duocylinderModel!='l3dt-blockstrips' && guiParams.display.zPrepass){
		//TODO stop special case handling for l3dt-brute

		gl.depthFunc(gl.ALWAYS);	//TODO try no z check - since discarding with using depth texture, this check is redundant
		gl.depthMask(false);
		drawDuocylinderObject(wSettings, duocylinderObjects[worldInfo.duocylinderModel], 0,0,0, depthMap);
		gl.depthFunc(gl.LESS);
		gl.depthMask(true);
	}

	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	var seaTime = 0.00005*(frameTime % 20000 ); //20s loop	//note this is duplicated from drawWorldScene
	if (worldInfo.seaActive){
		drawDuocylinderObject(wSettings, duocylinderObjects['sea'], worldInfo.seaLevel, worldInfo.seaPeakiness, seaTime, depthMap);
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
	gl.uniform1f(transpShadProg.uniforms.uOpacity, 1.0);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA , gl.ONE);	
	gl.depthMask(false);
	
	
	for (var b of bullets){
		if (b.active && b.world == worldA){
			var bulletMatrix=b.matrix;
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,bulletMatrix);
			if (frustumCull(mvMatrix,targetRad)){	
				drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			}
		}
	}
	
	
	
	var maxShockRadAng = 0.5;
	
	for (var ee in explosions){
		var singleExplosion = explosions[ee];
		if (singleExplosion.world == worldA){
			if (singleExplosion.rotateWithDuocylinder){
				mat4.set(invertedWorldCameraDuocylinderFrame, mvMatrix);
			}else{
				mat4.set(invertedWorldCamera, mvMatrix);
			}
			mat4.multiply(mvMatrix,singleExplosion.matrix);
			
			//var radius = singleExplosion.life*0.0002;
			var radius = (200-singleExplosion.life)*singleExplosion.size;	// increased from 100 so has initial size
			//var radius = 0.01;
			var opac = 0.01*singleExplosion.life;
			
			if (frustumCull(mvMatrix,radius)){	
					//TODO check is draw order independent transparency
				gl.uniform1f(transpShadProg.uniforms.uOpacity, opac);
				gl.uniform3fv(transpShadProg.uniforms.uEmitColor, singleExplosion.color);	//TODO neutral colour
				gl.uniform3f(transpShadProg.uniforms.uModelScale, radius,radius,radius);
				drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			}
			
			
			//larger shockwave, should match sound
			var largeRadiusAng = radius * (100-singleExplosion.life)*2;	//note that speed of sound delay approximation currently used 4vec distance, not curve, so this will only match up for small distances. 5 is a guess that seems about right. TODO work out properly!
			if (largeRadiusAng<maxShockRadAng){
				var largeRadius = Math.tan(largeRadiusAng);
				if (frustumCull(mvMatrix,largeRadius)){	//todo larger max shock rad for larger singleExplosion.size
					var largeOpac = 2.0*(1-(largeRadiusAng/maxShockRadAng));	//linearly drop opacity as sphere expands (simple)
					largeOpac*=2000.0*singleExplosion.size;	//fudge to make bigger explosions more opaque
						//note results in small muzzle flash shockwaves near invisible therefore maybe a waste.
					gl.uniform1f(transpShadProg.uniforms.uOpacity, largeOpac);
					gl.uniform3f(transpShadProg.uniforms.uEmitColor, 0.05,0.05,0.05);
					gl.uniform3f(transpShadProg.uniforms.uModelScale, largeRadius,largeRadius,largeRadius);
					drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
				}
			}
		}
	}
	
	
	//muzzle flash? 
	gl.uniform3f(transpShadProg.uniforms.uEmitColor, 1, 0.5, 0.25);
	for (var gg in gunMatrices){
		//if (gg>0) continue;
		var mfRad = 0.005;
		var flashAmount = muzzleFlashAmounts[gg];
		gl.uniform1f(transpShadProg.uniforms.uOpacity, flashAmount);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,gunMatrices[gg]);
		xyzmove4mat(mvMatrix,[0,0,0.0075]);

		for (var xx=0;xx<3;xx++){	//nested spheres
			gl.uniform3f(transpShadProg.uniforms.uModelScale, mfRad/5,mfRad/5,mfRad);
			drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			mfRad-=.0005;
		}
	}

	//thrusters
	//TODO pass amount of thrust to shader for strength of effect.
	if (guiParams["player model"] == "spaceship" && thrusterBuffers.isLoaded && currentThrustInput[2]>0){
		
		//NOTE this shader is inefficient since does world/portal lighting calculation, but has zero effect.
		var activeShaderProgram = shaderPrograms.coloredPerPixelDiscardVertexColoredEmit[ guiParams.display.atmosShader ];
		shaderSetup(activeShaderProgram);
		
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", new Float32Array([0.2,1,1.5,1]));
		modelScale = sshipModelScale;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
				
		//elsewhere using drawSsshipRotatedMat, but to avoid possible side effects, just make another mat.
		var rotatedMatrix2 = mat4.create();

		for (var drawMat of sshipDrawMatrices){
			//copy matrix stuff for when drawing main spaceship body
			mat4.set(invertedWorldCamera, mvMatrix);
			
			mat4.set(drawMat,rotatedMatrix2);
			xyzrotate4mat(rotatedMatrix2, [-Math.PI/2,0,0]); 

			mat4.multiply(mvMatrix,rotatedMatrix2);
			mat4.set(rotatedMatrix2, mMatrix);

			drawObjectFromBuffers(thrusterBuffers, activeShaderProgram);
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
var quadviewFrustumCull;
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

function generateCullFuncGeneral(pMat){
	//side of frustum is where resulting x = z.
	// x = pMat[0]*mat[12] + pMat[4]*mat[13] + pMat[8]*mat[14]
	// z = pMat[3]*mat[12] + pMat[7]*mat[13] + pMat[11]*mat[14]

	//set these == 
	// pMat[0]*mat[12] + pMat[4]*mat[13] + pMat[8]*mat[14]  =  pMat[3]*mat[12] + pMat[7]*mat[13] + pMat[11]*mat[14]
	// mat[12] ( pMat[0] - pMat[3] ) +  mat[13] (pMat[4] - pMat[7]) +   mat[14] (pMat[8] - pMat[11])  = 0
	//this is plane dot point. magnitude of plane vector determines the adjustedRad corrective factor (effectively should normalise it.)

	var planes = [
		[pMat[3], pMat[7], pMat[11]],	//behind the camera. dot with forward direction.
		[pMat[3] - pMat[0], pMat[7] - pMat[4], pMat[11] - pMat[8]],	//right
		[pMat[3] + pMat[0], pMat[7] + pMat[4], pMat[11] + pMat[8]],	//left
		[pMat[3] - pMat[1], pMat[7] - pMat[5], pMat[11] - pMat[9]],	//top
		[pMat[3] + pMat[1], pMat[7] + pMat[5], pMat[11] + pMat[9]]	//bottom
	];

	//normalise planes
	planes = planes.map(plane => {
		var len = Math.sqrt(plane[0]*plane[0] + plane[1]*plane[1] + plane[2]*plane[2]);
		return plane.map(xx=>xx/len);
	});

	return function(mat, rad){	//return whether an sphere of radius rad, at a position determined by mat (ie with position [mat[12],mat[13],mat[14],mat[15]]) overlaps the view frustum.
		var adjustedRad=rad/Math.sqrt(1+rad*rad);	//IIRC radius of sphere is before projection onto curved surface

		for (var ii=0;ii<planes.length;ii++){
			var plane = planes[ii];
			var dotProd = plane[0]*mat[12] + plane[1]*mat[13] + plane[2]*mat[14];
			if (dotProd<-adjustedRad){return false;}
		}
		return true;
	}
}
 
function noCullCullFunc(mat, rad){
	return true;
}

var enableDisableAttributes = (function generateEnableDisableAttributesFunc(){
	
	var maxNum = 16;
	var isEnabled = new Array(16);
	var shouldBeEnabled = new Array(16);

	for (var ii=0;ii<maxNum;ii++){
		isEnabled[ii] = false;
	}

	var swapArr;

	return function(shaderProg){
		//in webgl2, seems attributes don't necessarily take numbers from 0 to shaderProg.numActiveAttribs - 1
		
		for (var ii=0;ii<maxNum;ii++){
			shouldBeEnabled[ii] = false;
		}
		for (var attr of Object.values(shaderProg.attributes)){
			shouldBeEnabled[attr] = true;
		}

		for (var ii=0;ii<maxNum;ii++){
			if (shouldBeEnabled[ii]){
				if (!isEnabled[ii]){
					gl.enableVertexAttribArray(ii);
				}
			}else{
				if (isEnabled[ii]){
					gl.disableVertexAttribArray(ii);
				}
			}
		}

		swapArr = isEnabled;
		isEnabled = shouldBeEnabled;
		shouldBeEnabled = swapArr;	//now contains junk, but avoids memory churn
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
	if (duocylinderObj.vertexTriCoordBuffer && shader.attributes.aTriCoord){
		gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexTriCoordBuffer);
		gl.vertexAttribPointer(shader.attributes.aTriCoord, duocylinderObj.vertexTriCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (duocylinderObj.vertexTriNormalBuffer && shader.attributes.aTriNormal){	//note could combo if with vertexTriCoordBuffer
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
		bind2dTextureIfRequired(duocylinderObj.texB, gl.TEXTURE3);
		gl.uniform1i(shader.uniforms.uSamplerB, 3);
	}
	if (shader.uniforms.uSampler2){ 
		bind2dTextureIfRequired(duocylinderObj.tex2, gl.TEXTURE4);
		gl.uniform1i(shader.uniforms.uSampler2, 4);
	}
	if (shader.uniforms.uSampler2B){
		bind2dTextureIfRequired(duocylinderObj.tex2B, gl.TEXTURE5);
		gl.uniform1i(shader.uniforms.uSampler2B, 5);
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

	if (shaderProg.attributes.aVertexColor){
		//assume vertex coloured object has 3 pos, 3 colour (expect vertexPositionBuffer.itemSize = 6)
		//TODO use byte for colour instead of float?
		var iSize = bufferObj.vertexPositionBuffer.itemSize;
		var numColors = iSize - 3;
		gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, 3, gl.FLOAT, false, 4*iSize, 0);
		gl.vertexAttribPointer(shaderProg.attributes.aVertexColor, numColors, gl.FLOAT, false, 4*iSize, 4*3);
	}else{
		//assume want to skip over colour if present.
		var iSize = bufferObj.vertexPositionBuffer.itemSize;
		gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, 3, gl.FLOAT, false, 4*iSize, 0);
	}
	
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
	if (shaderProg.uniforms.uSampler2){
		gl.uniform1i(shaderProg.uniforms.uSampler2, 2);
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);

	if (usesCubeMap){
		gl.uniform1i(shaderProg.uniforms.uSampler, 1);	//put cubemap in tex 1 always, avoiding bind calls.
	}
	
	if (shaderProg.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader. TODO do less ofteen (move camera less often than switch buffers)
		uniform4fvSetter.setIfDifferent(shaderProg, "uCameraWorldPos", worldCamera.slice(12));
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

	if (shaderProg.uniforms.uMVMatrix){
		gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);
		//if (shaderProg.uniforms.uMMatrix  && (!skipM)){gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);}
	}
	if (shaderProg.uniforms.uMMatrix){gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);}

	if (shaderProg.uniforms.uMVMatrixA){	//bendy stuff with interpolated matrices
		gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrixA, false, mvMatrixA);
		gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrixB, false, mvMatrixB);
	}

	if (shaderProg.uniforms.uMMatrixA){	//bendy stuff with interpolated matrices
		gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrixA, false, mMatrixA);
		gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrixB, false, mMatrixB);
	}
	
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

var mMatrixA = mat4.create();
var mvMatrixA = mat4.create();
var mMatrixB = mat4.create();
var mvMatrixB = mat4.create();

var pMatrix = mat4.create();
var nonCmapPMatrix = mat4.create();
var quadViewMatrices = [...new Array(4)].map(xx=> mat4.identity());
var playerCamera = newIdMatWithQuats();
	

//pull portal mats from new thing
var firstPortalSide = portalsForWorld[0][0];
console.log({firstPortalSide, otherPortalSide: firstPortalSide.otherps});
var portalMats = [firstPortalSide.matrix, firstPortalSide.otherps.matrix];	//does not yet use other portals


var playerCameraInterp = newIdMatWithQuats();
var offsetPlayerCamera = newIdMatWithQuats();
var playerContainer = {matrix:playerCamera, world:1}

xyzmove4mat(playerCamera,[0,-0.4,0.1]);	//move start point towards problem area where collision distance testing many objs = slowdown

var offsetCameraContainer = {matrix:offsetPlayerCamera, world:0}

var worldCamera = mat4.create();
var portalInCameraCopy = mat4.create();
var portalInCameraCopy2 = mat4.create();
var portalInCameraCopy3 = mat4.create();

var cmapPMatrix = mat4.create();
setProjectionMatrix(cmapPMatrix, -5, 1.0, 0);	//-5 gets reflection to look right. (different for portal?)

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

var cubemapViews;
//cube map code from http://www.humus.name/cubemapviewer.js (slightly modified)


function initCubemapFramebuffers(){
	//only initialising prerendered here. for realtime cubemap rendering now moved to cubemapviewcache.js.
	//maybe should add to pool here though, if see hitches when initialising framebuffers on the fly.

	for (var world=0;world<portalsForWorld.length; world++){
		var portalsForThisWorld = portalsForWorld[world];
		for (var pp = 0; pp<portalsForThisWorld.length;pp++){
			portalsForThisWorld[pp].prerenderedView = initCubemapFramebuffer(256, true);
		}
	}

	return cubemapViews;
}

var setCubemapTexForPortalAndLevel = function(portalIdx, level){
	var viewFromCache = cubemapViewCache.getCubemap(portalIdx);
	if (viewFromCache){
		//console.log({mssg:"returning existing view", viewFromCache});
		setCubemapTex(viewFromCache.item.cubemapTexture);
		return false;	//don't need to redraw since got from cache.
	}
	viewFromCache = cubemapViewCache.getNewCubemap(portalIdx, level);
	//console.log({mssg:"returning new view", viewFromCache});	//new from pool OR newly created.

	setCubemapTex(viewFromCache.item.cubemapTexture);
	return true;
}

var setCubemapTex, getCurrentTex;
({setCubemapTex, getCurrentTex} = (function generateGetCubemapTexFunc(){
	var currentTex;
	return {
		setCubemapTex: function(newTex){
			if (newTex!=currentTex){
				gl.activeTexture(gl.TEXTURE1);	//use texture 1 always for cubemap
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, newTex);
				currentTex=newTex;
			}
		},
		getCurrentTex: function(){return currentTex;}
	}
})());

function initCubemapFramebuffer(cubemapSize, withMips){
	var view = {};

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
	
	setCubemapTex(view.cubemapTexture); //use texture 1 always for cubemap
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, view.cubemapTexture);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, withMips? gl.LINEAR_MIPMAP_LINEAR: gl.LINEAR);
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

		texImage2DWithLogs("initialising cubemap", 
			face, 0, gl.RGBA, cubemapSize, cubemapSize, 0, 
			gl.RGBA, gl.UNSIGNED_BYTE, null);
	
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
		texImage2DWithLogs("setting up intermediate textures",
			gl.TEXTURE_2D, 0, gl.RGBA, cubemapSize, cubemapSize, 0,
			gl.RGBA, gl.UNSIGNED_BYTE, null);

		intermediateTextures.push(textureRgb);

		var depthTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		texImage2DWithLogs("setting up intermediate textures 2",
			gl.TEXTURE_2D, 0, 
			gl.DEPTH_COMPONENT24, cubemapSize, cubemapSize, 0, 
			gl.DEPTH_COMPONENT, gl.UNSIGNED_INT , null);
		intermediateDepthTextures.push(depthTexture);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureRgb, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
	}
	
	//gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);	//this gets rid of errors being logged to console. 
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return view;
}

function setupScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	//start player off outside of boxes
	xyzmove4mat(playerCamera,[0,0.4,-0.3]);	//left, down, fwd
	
	targetMatrix = cellMatData.d16[0];
}

var texture,bricktex,diffuseTexture,
	hudTexture,hudTextureSmallCircles,hudTexturePlus,hudTextureX,hudTextureBox,
	fontTexture,
	sshipTexture,sshipTexture2,cannonTexture,nmapTexture,
	terrain2Texture, terrain2TextureB, terrain2TextureNormals;

function loadTmpFFTexture(id,directory){
	directory = directory || 'img/';
	diffuseTexture = makeTextureCompressed(directory+id+"/"+id+"-diffuse.jpg");
	nmapTexture = makeTextureCompressed(directory+id+"/"+id+"-normal.jpg");
		//NOTE DXT1 not great for normal maps!
}

function initTexture(){
	texture = makeTextureCompressed("img/0033.jpg");
	bricktex = makeTexture("img/brick-tex.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5); 
	//nmapTexture = makeTexture("img/images.squarespace-cdn.com.png");	//button cushion
	//diffuseTexture = makeTexture("img/no-git/6133-diffuse.jpg",false);nmapTexture = makeTexture("img/no-git/6133-normal.jpg",false);	//metal crate
	//diffuseTexture = makeTexture("img/no-git/4483-diffuse.jpg",false);nmapTexture = makeTexture("img/no-git/4483-normal.jpg",false);	//rust
	//loadTmpFFTexture(11581);
	//loadTmpFFTexture(14196,'img/no-git/');
	//loadTmpFFTexture(9701,'img/no-git/');	//craters. good for out-of-atmosphere part?
	//loadTmpFFTexture(4241,'img/no-git/');
	loadTmpFFTexture(14131);	//sand dunes
	//loadTmpFFTexture(1893,'img/no-git/');	//dry lakebed
	
	hudTexture = makeTexture("img/circles.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTextureSmallCircles = makeTexture("img/smallcircles.png",gl.RGB,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTexturePlus = makeTexture("img/plus.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTextureX = makeTexture("img/x.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);
	hudTextureBox = makeTexture("img/box.png",gl.RGBA,gl.UNSIGNED_SHORT_4_4_4_4);

	fontTexture = makeTexture("img/fonts/player1up-alpha.png",gl.RED,gl.UNSIGNED_BYTE, true, false);

		//TODO grayscale image? TODO confirm linear

	duocylinderObjects.grid.tex = makeTextureCompressed("img/grid-omni.webp");
	duocylinderObjects.terrain.tex = makeTexture("data/terrain/turbulent-seamless.webp",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
	//duocylinderObjects.procTerrain.tex = texture;
	//duocylinderObjects.procTerrain.tex = makeTexture("img/14131-diffuse.jpg");  //sand
	duocylinderObjects.procTerrain.tex = nmapTexture;
	duocylinderObjects.procTerrain.texB = diffuseTexture;

	duocylinderObjects.procTerrain.useMapproject = true;	//only affects things when terrainMapProject:true

	//load 2 more textures. already set textures still reference what was loaded already
	//loadTmpFFTexture(4999,'img/no-git/');	//chequerboard
	loadTmpFFTexture(5876);
	//loadTmpFFTexture(4431);	//concrete blocks
	duocylinderObjects.procTerrain.tex2 = nmapTexture;
	duocylinderObjects.procTerrain.tex2B = diffuseTexture;
	
	
	//duocylinderObjects.sea.tex = null;
	duocylinderObjects.sea.tex = makeTextureCompressed("img/4141.jpg");
	//duocylinderObjects.sea.tex = makeTexture("img/ash_uvgrid01.jpg");
	duocylinderObjects.sea.isSea=true;
	
	sshipTexture = makeTexture("data/spaceship/spaceship-2020-10-04a-combo.png");	//note this texture is not normalised for maxalbedo
	sshipTexture2 = makeTexture("data/spaceship/spaceship-otherlights-2020-10-04a.png");	//""
	cannonTexture = makeTexture("data/cannon/cannon-pointz-combo.png");
	
	su57texture = makeTexture("data/miscobjs/t50/TexCombo4.png");
	su57texture2 = makeTexture("data/miscobjs/t50/black.png");	//TODO add thruster texture

	frigateTexture = makeTexture("data/frigate/frigate-tex.webp");

	randBoxBuffers.tex=texture;
	towerBoxBuffers.tex=nmapTexture;towerBoxBuffers.texB=diffuseTexture;
	stonehengeBoxBuffers.tex=texture;stonehengeBoxBuffers.texB=diffuseTexture;
	roadBoxBuffers.tex=nmapTexture;roadBoxBuffers.texB=diffuseTexture;
	
	loadTmpFFTexture(11581);	//note voxTerrain normal mapping currently reversed/inverted vs procTerrain, boxes.
	duocylinderObjects.voxTerrain.texB = diffuseTexture;
	duocylinderObjects.voxTerrain.tex = nmapTexture;
	duocylinderObjects.voxTerrain.usesTriplanarMapping=true;

	duocylinderObjects.voxTerrain2.texB = diffuseTexture;
	duocylinderObjects.voxTerrain2.tex = nmapTexture;
	duocylinderObjects.voxTerrain2.usesTriplanarMapping=true;

	duocylinderObjects.voxTerrain3.texB = diffuseTexture;
	duocylinderObjects.voxTerrain3.tex = nmapTexture;
	duocylinderObjects.voxTerrain3.usesTriplanarMapping=true;

	//texture = makeTexture("img/ash_uvgrid01-grey.tiny.png");	//numbered grid

	//for l3dt/cdlod terrain
	terrain2Texture = makeTexture("img/14206/14206-diffuse.jpg",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
	terrain2TextureB = makeTexture("img/3.png",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);
	terrain2TextureNormals = makeTexture("img/normals1024.webp",gl.RGB,gl.UNSIGNED_SHORT_5_6_5);	//TODO format better suited for normal maps
		//TODO auto generate normal map from heightmap data
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
	worlds:[
		{fogColor:'#2f9a16',duocylinderModel:"procTerrain",spinRate:0,spin:0,seaActive:true,seaLevel:0,seaPeakiness:0.0},
		{fogColor:'#7496a0',duocylinderModel:"procTerrain",spinRate:0,spin:0,seaActive:false,seaLevel:0,seaPeakiness:0.0},
		{fogColor:'#bbbbbb',duocylinderModel:"procTerrain",spinRate:0,spin:0,seaActive:false,seaLevel:0,seaPeakiness:0.0},
		{fogColor:'#111111',duocylinderModel:"procTerrain",spinRate:0,spin:0,seaActive:false,seaLevel:0,seaPeakiness:0.0}
	],
	drawShapes:{
		boxes:{
		'y=z=0':false,	//x*x+w*w=1
		'x=z=0':false,	//y*y+w*w=1
		'x=y=0':false,	//z*z+w*w=1
		'x=w=0':false,
		'y=w=0':false,
		'z=w=0':false
		},
		pillars:false,
		bendyPillars:false,
		towers:false,
		singleBufferTowers:false,
		explodingBox:false,
		hyperboloid:false,
		stonehenge:false,
		singleBufferStonehenge:false,
		roads:false,
		singleBufferRoads:false,
		frigate:true,
		frigateScale:5,
		building:true,
		buildingScale:10,
		octoFractal:true,
		octoFractalScale:20,
		viaduct: 'none'
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
	"draw 8-cell net":false,
	"8-cell scale":0.3,		//0.5 to tesselate
	"draw 16-cell":false,
	"draw 24-cell":false,
	"24-cell scale":1,
	"draw 120-cell":false,
	"draw 600-cell":false,
	"player model":"spaceship",
	target:{
		type:"none",
		scale:0.03
	},
	"targeting":"off",
	playerLight:'#808080',
	control:{
		onRails:false,
		handbrake:false,
		spinCorrection:true,
		sriMechStr:0,
		smoothMouse:200
	},
	display:{
		cameraType:"far 3rd person",
		cameraAttachedTo:"player vehicle",
		cameraZoom:2.9,
		uVarOne:-0.0375,
		vFOV:"",
		hFOV:"",
		flipReverseCamera:false,	//flipped camera makes direction pointing behavour match forwards, but side thrust directions switched, seems less intuitive
		stereo3d:"off",
		eyeSepWorld:0.0001,	//half distance between eyes in game world
		eyeTurnIn:0.003,
		showHud:true,
		fisheyeEnabled:true,
		renderViaTexture:'blur-b-use-alpha',
		renderLastStage:'fxaa',
		drawTransparentStuff:true,
		voxNmapTest:false,	//just show normal map. more efficient pix shader than standard. for performance check
		terrainMapProject:false,
		texBias:0.0,
		zPrepass:false,	//currently applies only to 4vec objects (eg terrain), and only affect overdraw for that object. 
		perPixelLighting:true,
		atmosShader:"atmos",
		atmosThickness:0.2,
		atmosThicknessMultiplier:'#88aaff',
		atmosContrast:20.0,
		culling:true,
		useSpecular:true,
		specularStrength:0.5,
		specularPower:20.0,
		quadView:true,
		quadViewCulling:true,
		regularFisheye2:false
	},
	map:{
		show:false,
		viewDistance:4,
		bendFactor:0.35,
		shader:"two"
	},
	reflector:{
		draw:'high',
		cmFacesUpdated:6,
		cubemapDownsize:'auto',
		mappingType:'screen space 2',
		isPortal:true,
		drawFrame:false,
		forceApproximation:false,
		test1:false
	},
	debug:{
		closestPoint:false,
		buoys:false,
		nmapUseShader2:true,
		showSpeedOverlay:false,
		showGCInfo:false,
		emitFire:false,
		fireworks:false,
		textTextBox:false,
		textWorldNum:true,
		bvhBoundingSpheres:false,
		worldBvhCollisionTest:true,
		worldBvhCollisionTestPlayer:true
	},
	audio:{
		volume:0.2,
	},
	normalMove:0
};

var guiSettingsForWorld = guiParams.worlds;

smoothGuiParams.add("8-cell scale", guiParams, "8-cell scale");

var settings = {
	playerBallRad:0.003,
}

var worldColors=[];
var worldColorsPlain=[];
var playerLightUnscaled;
var playerLight;
var muzzleFlashAmounts=[0,0,0,0];

var someObjectMatrices = (() => {
	var mats = [...new Array(4)].map(x => mat4.identity());
	
	xyzmove4mat(mats[0],[0,0,-1]);

	xyzmove4mat(mats[1],[0,0,-1]);
	xyzmove4mat(mats[1],[0,0.8,0]);

	xyzmove4mat(mats[2],[0,0,0.5]);
	xyzmove4mat(mats[2],[0,0.4,0]);

	xyzmove4mat(mats[3],[0,0,0.5]);
	xyzmove4mat(mats[3],[0,0.65,0]);

	for (var xx=0;xx<3;xx++){
		for (var yy=0;yy<3;yy++){
			var thisMat = mat4.identity();
			xyzmove4mat(thisMat,[0,0,-0.5-0.7*xx]);
			xyzrotate4mat(thisMat, [0,0,Math.PI+ 1*yy]);
			xyzmove4mat(thisMat,[0,0.8,0]);
			xyzrotate4mat(thisMat, [0,Math.PI/4,0]);
			mats.push(thisMat);
		}
	}

	return mats.map(mat=>{
		var copy = mat4.create(mat);
		mat4.transpose(copy);
		return {
			mat,
			transposedMat:copy
		}
	})
})();

var bvhObjsForWorld=guiParams.worlds.map(xx=>[]);	//will create once bvhs created

var explodingBoxMatrix = someObjectMatrices[0].mat;


var frigateMatrix=mat4.identity();
xyzmove4mat(frigateMatrix,[0,.7854,0]);
var buildingMatrix=mat4.identity();
xyzmove4mat(buildingMatrix,[0,.7,0]);
var transposedBuildingMatrix = mat4.create(buildingMatrix);
mat4.transpose(transposedBuildingMatrix);

var octoFractalMatrix=mat4.identity();
xyzrotate4mat(octoFractalMatrix,[0,0,Math.PI/2]);
xyzmove4mat(octoFractalMatrix,[0,.76,0]);
var transposedOctoFractalMatrix = mat4.create(octoFractalMatrix);
mat4.transpose(transposedOctoFractalMatrix);

var turretBaseMatrix=newIdMatWithQuats();
xyzrotate4mat(turretBaseMatrix,[0,0,0.5]);	//TODO put in xy map position.
xyzmove4mat(turretBaseMatrix,[0,.78,0]);





var pillarMatrices=[];
/*
for (var ii=0,ang=0,angstep=2*Math.PI/30;ii<30;ii++,ang+=angstep){	//number of reps obtained by trial and error. TODO calculate
	var thisPillarMat = mat4.identity();
	xyzmove4mat(thisPillarMat,[0,0,ang]);
	xyzmove4mat(thisPillarMat,[0.4,0,0]);
	pillarMatrices.push(thisPillarMat);
}
*/
for (var ii=0,ang=0,angstep=2*Math.PI/25;ii<25;ii++,ang+=angstep){	//number of reps obtained by trial and error. TODO calculate
	var thisPillarMat = mat4.identity();
	xyzmove4mat(thisPillarMat,[0,0,ang]);
	xyzmove4mat(thisPillarMat,[0.7,0,0]);
	pillarMatrices.push(thisPillarMat);
}


var sshipMatrix=mat4.create();mat4.identity(sshipMatrix);
var sshipMatrixNoInterp=mat4.create();mat4.identity(sshipMatrixNoInterp);
var targetMatrix=mat4.create();mat4.identity(targetMatrix);
var targetWorldFrame=[];
var targetingResultOne=[];
var targetingResultTwo=[];
var selectedTargeting="none";
var bullets=new Set();
var gunMatrices=[mat4.create(),mat4.create(),mat4.create(),mat4.create()];	//? what happens if draw before set these to something sensible?
var canvas;

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

	//escape escapes pointer lock and exit fullscreen
	// - browsers seem to have this already, but electron apparently doesn't!
	//todo also cancel the logic that does a 1s delayed pointer lock on pressing F to fullscreen!
	document.addEventListener('keydown', function(event) {
	  if (event.key === 'Escape' || event.code === 'Escape') {
		console.log('Escape key was pressed!!');
		document.exitPointerLock();
		if (window.electronAPI){
			console.log("exiting fullscreen");
			window.electronAPI.exitFullscreen();
		}
	  }
	});
	
	var gui = new dat.GUI();
	gui.addColor(guiParams, 'playerLight').onChange(function(color){
		setPlayerLight(color);
	});
	var drawShapesFolder = gui.addFolder('drawShapes');

	guiParams.worlds.forEach((world,nn)=>{
		var worldName = 'world'+nn;
		var worldFolder = drawShapesFolder.addFolder(worldName);
		worldFolder.addColor(world, 'fogColor').onChange(function(color){
			setFog(nn,color);
		});
		worldFolder.add(world, "duocylinderModel", [
			"grid","terrain","procTerrain",'voxTerrain','voxTerrain2','voxTerrain3','l3dt-brute','l3dt-blockstrips','none'] );
		worldFolder.add(world, "spinRate", -2.5,2.5,0.25);
		worldFolder.add(world, "seaActive" );
		worldFolder.add(world, "seaLevel", -0.02,0.02,0.001);
		worldFolder.add(world, "seaPeakiness", 0.0,0.5,0.01);
	});

	var boxesFolder = drawShapesFolder.addFolder('boxes');
	for (shape in guiParams.drawShapes.boxes){
		console.log(shape);
		boxesFolder.add(guiParams.drawShapes.boxes, shape );
	}
	var randBoxesFolder = drawShapesFolder.addFolder("random boxes");
	randBoxesFolder.add(guiParams["random boxes"],"number",0,maxRandBoxes,8);
	randBoxesFolder.add(guiParams["random boxes"],"size",0.001,0.1,0.001);
	randBoxesFolder.add(guiParams["random boxes"],"collision");
	randBoxesFolder.add(guiParams["random boxes"],"drawType", [
		"singleBuffer",
		"indiv",
		"indivVsMatmult",
		"instancedArrays",
		"instancedArraysMenger",
		"instanced speckles"
	]);
	randBoxesFolder.add(guiParams["random boxes"],"numToMove", 0,maxRandBoxes,8);
	drawShapesFolder.add(guiParams.drawShapes,"pillars");
	drawShapesFolder.add(guiParams.drawShapes,"bendyPillars");
	drawShapesFolder.add(guiParams.drawShapes,"towers");
	drawShapesFolder.add(guiParams.drawShapes,"singleBufferTowers");
	drawShapesFolder.add(guiParams.drawShapes,"explodingBox");
	drawShapesFolder.add(guiParams.drawShapes,"hyperboloid");
	drawShapesFolder.add(guiParams.drawShapes,"stonehenge");
	drawShapesFolder.add(guiParams.drawShapes,"singleBufferStonehenge");
	drawShapesFolder.add(guiParams.drawShapes,"roads");
	drawShapesFolder.add(guiParams.drawShapes,"singleBufferRoads");
	drawShapesFolder.add(guiParams.drawShapes,"frigate");
	drawShapesFolder.add(guiParams.drawShapes,"frigateScale",0.1,20.0,0.1);
	drawShapesFolder.add(guiParams.drawShapes,"building");
	drawShapesFolder.add(guiParams.drawShapes,"buildingScale",0.1,20.0,0.1);
	drawShapesFolder.add(guiParams.drawShapes,"octoFractal");
	drawShapesFolder.add(guiParams.drawShapes,"octoFractalScale",0.1,20.0,0.1);
	drawShapesFolder.add(guiParams.drawShapes,"viaduct", ['none','individual','instanced']);

	var polytopesFolder = gui.addFolder('polytopes');
	polytopesFolder.add(guiParams,"draw 5-cell");
	polytopesFolder.add(guiParams,"draw 8-cell");
	polytopesFolder.add(guiParams,"draw 8-cell net");
	polytopesFolder.add(guiParams,"8-cell scale",0.05,1.0,0.05);
	polytopesFolder.add(guiParams,"draw 16-cell");
	polytopesFolder.add(guiParams,"subdiv frames");
	polytopesFolder.add(guiParams,"draw 24-cell");
	polytopesFolder.add(guiParams,"24-cell scale",0.05,2.0,0.05);
	polytopesFolder.add(guiParams,"draw 120-cell");
	polytopesFolder.add(guiParams,"draw 600-cell");
	gui.add(guiParams,"player model", ["spaceship","plane","ball"]);
	
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
	displayFolder.add(guiParams.display, "cameraType", ["cockpit", "near 3rd person", "mid 3rd person", "far 3rd person", "really far 3rd person", "side","none"]);
	displayFolder.add(guiParams.display, "cameraAttachedTo", ["player vehicle", "turret","none"]);	//"none" acts like drop camera
	displayFolder.add(guiParams.display, "cameraZoom", 1,10,0.1);
	displayFolder.add(guiParams.display, "uVarOne", -0.125,0,0.0125);
	displayFolder.add(guiParams.display, "vFOV").listen();
	displayFolder.add(guiParams.display, "hFOV").listen();
	displayFolder.add(guiParams.display, "flipReverseCamera");
	displayFolder.add(guiParams.display, "stereo3d", ["off","sbs","sbs-cross","top-bottom","anaglyph","anaglyph-green/magenta"]);
	displayFolder.add(guiParams.display, "eyeSepWorld", -0.001,0.001,0.0001);
	displayFolder.add(guiParams.display, "eyeTurnIn", -0.01,0.01,0.0005);
	displayFolder.add(guiParams.display, "showHud");
	displayFolder.add(guiParams.display, "fisheyeEnabled");
	displayFolder.add(guiParams.display, "renderViaTexture", ['basic','blur','blur-b','blur-b-use-alpha','blur-big','2-pass-blur','1d-blur']);
	displayFolder.add(guiParams.display, "renderLastStage", ['simpleCopy','fxaa','fxaaSimple','showAlpha','dither']);
	displayFolder.add(guiParams.display, "drawTransparentStuff");
	displayFolder.add(guiParams.display, "voxNmapTest");
	displayFolder.add(guiParams.display, "terrainMapProject");
	displayFolder.add(guiParams.display, "texBias",-4.0,4.0,0.25);
	displayFolder.add(guiParams.display, "zPrepass");
	displayFolder.add(guiParams.display, "perPixelLighting");
	//displayFolder.add(guiParams.display, "atmosShader", ['constant','atmos','atmos_v2']);	//basic is constant (contrast=0) 
	displayFolder.add(guiParams.display, "atmosThickness", 0,0.5,0.05);
displayFolder.addColor(guiParams.display, "atmosThicknessMultiplier").onChange(setAtmosThicknessMultiplier);
	displayFolder.add(guiParams.display, "atmosContrast", -20,20,0.5);
	displayFolder.add(guiParams.display, "culling");
	displayFolder.add(guiParams.display, "useSpecular");
	displayFolder.add(guiParams.display, "specularStrength", 0,1,0.05);	//currently diffuse colour and distance attenuation applies to both specular and diffuse, keeping nonnegative by having diffuse multiplier 1-specularStrength. therefore range 0-1. TODO different specular, diffuse colours, (instead of float strength), specular maybe shouldn't have distance attenuation same way - possibly correct for point source but want solution for sphere light...
	displayFolder.add(guiParams.display, "specularPower", 1,20,0.5);
	displayFolder.add(guiParams.display, "quadView");
	displayFolder.add(guiParams.display, "quadViewCulling");
	displayFolder.add(guiParams.display, "regularFisheye2");
	displayFolder.add(guiParams, "normalMove", 0,0.02,0.001);

	var mapFolder = gui.addFolder('map');
	mapFolder.add(guiParams.map, "show");
	mapFolder.add(guiParams.map, "viewDistance", 2,8,0.1);
	mapFolder.add(guiParams.map, "bendFactor", 0,1,0.05);
	mapFolder.add(guiParams.map, "shader", ["one","two"]);

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
	debugFolder.add(guiParams.debug, "textTextBox");
	debugFolder.add(guiParams.debug, "textWorldNum");
	debugFolder.add(guiParams.debug, "bvhBoundingSpheres");
	debugFolder.add(guiParams.debug, "worldBvhCollisionTest");
	debugFolder.add(guiParams.debug, "worldBvhCollisionTestPlayer");

	var audioFolder = gui.addFolder('audio');
	audioFolder.add(guiParams.audio, "volume", 0,1,0.1).onChange(MySound.setGlobalVolume);
	MySound.setGlobalVolume(guiParams.audio.volume);	//if set above 1, fallback html media element will throw exception!!!
	
	var reflectorFolder = gui.addFolder('reflector');
	reflectorFolder.add(guiParams.reflector, "draw",["none","low","high","mesh"]);
	reflectorFolder.add(guiParams.reflector, "cmFacesUpdated", 0,6,1);
	reflectorFolder.add(guiParams.reflector, "cubemapDownsize", [0,1,2,3,'auto']);
	reflectorFolder.add(guiParams.reflector, "mappingType", ['projection', 'vertex projection','screen space','screen space 2','vertproj mix','depth to alpha copy']);
	reflectorFolder.add(guiParams.reflector, "isPortal");
	reflectorFolder.add(guiParams.reflector, "drawFrame");
	reflectorFolder.add(guiParams.reflector, "test1");
	reflectorFolder.add(guiParams.reflector, "forceApproximation");

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

	initTextureFramebuffer(rttFisheyeRectRenderOutput, true);
	initTextureFramebuffer(rttFisheyeRectRenderOutput2, true);

	initTextureFramebuffer(rttView);
	initTextureFramebuffer(rttStageOneView, true);
	initTextureFramebuffer(rttFisheyeView2);
	initTextureFramebuffer(rttAnaglyphIntermediateView);

	initShaders(shaderPrograms);initShaders=null;
	initTexture();
	cubemapViews = initCubemapFramebuffers();
	initBuffers();
	getLocationsForShadersUsingPromises(
		()=>{
			requestAnimationFrame(drawScene);	//in callback because need to wait until shaders loaded
		}
	);
	loadHeightmapTerrain(terrainSize, doUponTerrainInitialised);

	for (var ii=0;ii<guiParams.worlds.length;ii++){
		setFog(ii,guiSettingsForWorld[ii].fogColor);
	}
	setAtmosThicknessMultiplier(guiParams.display.atmosThicknessMultiplier);
	setPlayerLight(guiParams.playerLight);
    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	setupScene();
	
	function setFog(world,color){
		var vec4Color = new Float32Array(4);
		vec4Color.set(colorArrFromUiString(color),0);
		vec4Color[3]=1;
		worldColorsPlain[world] = vec4Color;
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
		playerLightUnscaled=new Float32Array([r,g,b]).map(function(elem){return Math.pow(elem,2.2)});	//apply gamma
	}
}
function colorArrFromUiString(color){
	var r = parseInt(color.substring(1,3),16) /255;
	var g = parseInt(color.substring(3,5),16) /255;
	var b = parseInt(color.substring(5,7),16) /255;
	return new Float32Array([r,g,b]);
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
	var timeStep = 5;	//5ms => 200 steps/s! this is small to prevent tunelling. TODO better collision system that does not require this!
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
	
	var currentPen=0;	//for bodgy box collision (todo use collision points array)
	var currentTriangleObjectPlayerPen=0;

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
		
		if (['instancedArrays','instancedArraysMenger'].includes(guiParams["random boxes"].drawType)){
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
		
		
		
		var duoCylinderAngVelConst = guiSettingsForWorld[playerContainer.world].spinRate;
		
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
		//here, seems just used for audio, take this to be current player world spin (or player camera? ), but this 
		// isn't really correct - sounds should travel through portals. 
		mat4.set(invertedWorldCamera, invertedWorldCameraDuocylinderFrame);
		rotate4mat(invertedWorldCameraDuocylinderFrame, 0, 1, guiSettingsForWorld[playerContainer.world].spin);
		
		var soundspd = 2;	//TODO change delaynode creation param (faster sound means less possible delay)
		
		for (var ee in explosions){
			var singleExplosion = explosions[ee];
			singleExplosion.life-=0.2*numSteps;
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
		mat4.multiply(tmpRelativeMat, explodingBoxMatrix);
		var distance = distBetween4mats(tmpRelativeMat, identMat);		
		var soundSize = 0.02;	//closest distance can get to sound, where volume is 1
		var vol = soundSize/Math.hypot(distance, soundSize);
		var pan = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards) )
		//console.log("pan: " + pan);
		myAudioPlayer.setClockSound({delay:distance/soundspd, gain:vol, pan:pan});
		
		
//		var duocylinderRotate = duoCylinderAngVelConst * timeElapsed*moveSpeed;
		var duocylinderRotate = duoCylinderAngVelConst* (numSteps*timeStep)*moveSpeed;
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

			applyPortalMovement();

			for (ww=0;ww<guiSettingsForWorld.length;ww++){
				guiSettingsForWorld[ww].spin += guiSettingsForWorld[ww].spinRate*timeStep*moveSpeed;
			}
		
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
			
			currentThrustInput=currentThrustInput.map(elem => elem*thrust);
			
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
					
					var magsq = gpMove.reduce((total, val) => total+ val*val, 0);
					
					for (var cc=0;cc<3;cc++){
						currentThrustInput[cc]+=gpMove[cc]*5000000000*magsq;
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
					
				magsq = gpRotate.reduce((total, val) => total+ val*val, 0);
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

			var airSpdVec = playerVelVec.map((val, idx) => val-spinVelPlayerCoords[idx]);
			//var spd = Math.sqrt(airSpdVec.map(val => val*val).reduce((val, sum) => val+sum));
			var spd = Math.hypot.apply(null, airSpdVec);
			
			//print speed
			if (guiParams.debug.showSpeedOverlay){		
				var infoToShow ="";
				var speed = Math.hypot.apply(null, playerVelVec);
				infoToShow += "spd:" + speed.toFixed(2);

				infoToShow+=", airspd: " + spd.toFixed(2);
			//	infoToShow+=", sshipMat:" + Array.from(sshipMatrix).map(elem=>elem.toFixed(3)).join(",");	//toFixed doesn't work right on float32 array so use Array.from first
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



			
			if (guiParams["player model"] == "plane"){
				//TODO resolve issues
				// take into account air velocity due to duocylinder spin
				// Too much lift?
				// odd behaviour when travelling backward

				//lift
				//function of alpha/ pitch angle of attack and airflow.
				//is relevant speed total, or in direction of flight?
				var forwardSpeed = airSpdVec[2];	//sign? what if flying backwards? should take abs?
				var upspeed = airSpdVec[1];	//sign?
				var alpha = Math.atan2(upspeed,forwardSpeed);
				var mappedAlpha = alpha / (1 + 2*alpha*alpha);	//something that's linear around 0, goes to 0 for large values.
				var lift = forwardSpeed * atmosThick * mappedAlpha;

				if (Math.random()*100 < 1){
					//console.log({alpha, mappedAlpha});
				}

				airSpdVec[1] -= 200*lift;
				
				//stabilisation
				//plane tends to point towards direction of flight.
				playerAngVelVec[0] += 1000*lift;

				//function of beta/ turn angle of attack, airflow
				var sidespeed = airSpdVec[0];
				var beta = Math.atan2(sidespeed,forwardSpeed);
				var mappedBeta = beta / (1 + 2*beta*beta);	//?
				var sideLift = forwardSpeed * atmosThick * mappedBeta;	//TODO does this make sense?
				
				airSpdVec[0] -= 50*sideLift;	
				playerAngVelVec[1] -= 2000*sideLift;

				//tendency to roll right when turning right (outer wing is faster).
				//this will affect AOA for each wing (and so will reduce outside central linear part of lift curve)
				//but for now, just add some simple force
				var turnSpeed = playerAngVelVec[1];
				playerAngVelVec[2] -= 0.1*atmosThick*turnSpeed;
			}


			//want to be able to steer in the air. todo properly - guess maybe wants "lift" from wings, but easiest implementation guess is to increase drag for lateral velocity.
			//would like for both left/right, up/down velocity, but to test, try getting just one - like a aeroplane.
			//TODO better aerodynamic model - would like decent "steerability" without too much slowdown when completely sideways.
			//some tweak for non-isotropic drag. relates to drag coefficients in different directions
			var airSpdScale = [0.1,0.1,1];	//left/right, up/down, forwards/back
			var scaledAirSpdVec = airSpdVec.map((elem,ii)=>elem/airSpdScale[ii]);
			var spdScaled = Math.hypot.apply(null, scaledAirSpdVec);
			
			playerVelVec=scalarvectorprod(1.0-atmosThick*spdScaled,scaledAirSpdVec).map((val,idx) => val*airSpdScale[idx]+spinVelPlayerCoords[idx]);
			
			
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
				//smokeGuns();	//TODO independently random smoking guns? blue noise not white noise, smoke from end of gun, ...
			}
			
			//particle stream
			if (guiParams.debug.emitFire){
				if (Math.random()<0.5){
					//making a new matrix is inefficient - expect better if reused a temp matrix, copied it into buffer
					var newm4 = mat4.create(sshipMatrix);
					xyzmove4mat(newm4, [1,1,1].map(elem => sshipModelScale*60*elem*(Math.random()-0.5)));	//square uniform distibution
					new Explosion({matrix:newm4,world:sshipWorld}, sshipModelScale*0.5, [0.2,0.06,0.06]);
				}
			}
			if (guiParams.debug.fireworks){
				if (Math.random()<0.05){
					explosionParticleArrs[0].makeExplosion(random_quaternion(), frameTime, [Math.random(),Math.random(),Math.random(),1],1);	//TODO guarantee bright colour
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
			var worldInfo = guiSettingsForWorld[playerContainer.world];
			var dcSpin = worldInfo.spin;

			if (worldInfo.duocylinderModel == 'procTerrain'){
				
				//distanceForTerrainNoise = getHeightAboveTerrainFor4VecPos(playerPos);	//TODO actual distance using surface normal (IIRC this is simple vertical height above terrain)

				processTerrainCollisionForBall(playerCentreBallData, settings.playerBallRad, true);
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
					var suspensionHeightNow = getHeightAboveTerrainFor4VecPos(legPos, dcSpin);
					
					//get nearest point on terrain. could do this in terrain space, but to be reliable, testable, find nearest 4vec position, find this position in player frame.
					//note this matrix "jiggles" when duocylinder rotating due to interpolation (other test mats that don't jiggle probably are in duocylinder rotating frame space)
					var nearestTerrainPosInfo = getNearestTerrainPosMatFor4VecPos(legPos, dcSpin);
					var nearestPosMat = nearestTerrainPosInfo.mat;
					var nearestPos = nearestPosMat.slice(12);
					
					//find length from this to position in player space.
					var lengthToNearest = Math.hypot.apply(null, nearestPos.map((elem,ii) => elem-legPos[ii]));

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
						mat4.set(nearestPosMat, debugDraw.mats[5]);	//for visual debugging (TODO display object for each contact)
					
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
				distanceForTerrainNoise = getHeightAboveSeaFor4VecPos(playerPos, lastSeaTime, dcSpin);	//height. todo use distance (unimportant because sea gradient low
			}
			if (Object.keys(voxTerrainData).includes(worldInfo.duocylinderModel)){
				voxTerrainData[worldInfo.duocylinderModel].test2VoxABC(dcSpin);	//updates closestPointTestMat
				
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
				
				var penetration = settings.playerBallRad - signedDistanceForVox;
				var penetrationChange = penetration - lastVoxPenetration;	//todo cap this.
				lastVoxPenetration = penetration;
				//if (penetration>0){
				var pointDisplacement = tmpRelativeMat.slice(12, 15);	//for small distances, length of this is ~ distanceForVox
				mat4.set(playerCamera, voxCollisionDebugMat);
				xyzmove4mat(voxCollisionDebugMat, pointDisplacement.map(elem => -elem));
				
				if (penetration>0){
					var springConstant = 100;	//simple spring. rebounding force proportional to penetration. //high number = less likely tunneling at high speed.
					var multiplier = penetration*springConstant
					var dampConstant = 200;
					multiplier+=penetrationChange*dampConstant;
					
					multiplier/=signedDistanceForVox;	//normalise. playerBallRad would give near same result assuming penetrations remain small
					
					var forcePlayerFrame = pointDisplacement.map(elem => elem*multiplier);	//TODO use vector class?
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
			setSoundHelper(myAudioPlayer.setWhooshSound, distanceForTerrainNoise, panForTerrainNoise, spd);
			

			//apply same forces for other items. 
			//start with just player centre. 
			var gridSqs = getGridSqFor4Pos(playerPos, dcSpin);
			//get transposed playerpos in frame of duocylinder. this is generally useful, maybe should have some func to convert? code copied from bullet collision stuff...
			var playerMatrixTransposed = mat4.create(playerCamera);	//instead of transposing matrices describing possible colliding objects orientation.
																//alternatively might store transposed other objects orientation permanently
			mat4.transpose(playerMatrixTransposed);
			var playerMatrixTransposedDCRefFrame=mat4.create(playerMatrixTransposed);	//in frame of duocylinder
					//not using create, because playerMatrixTransposed is not subsequently used
			rotate4mat(playerMatrixTransposedDCRefFrame, 0, 1, dcSpin);
			
			
			
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
			processMengerSpongeCollision();	//after boxes to reuse whoosh noise (assume not close to both at same time)
			processOctoFractalCollision();
			processTriangleObjectCollision();

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
			setSoundHelper(myAudioPlayer.setWhooshSoundBox, distanceForBoxNoise, panForBoxNoise, spd);
			
			
			function processBoxCollisionsForBoxInfoAllPoints(boxInfo){
				processBoxCollisionsForBoxInfo(boxInfo, playerCentreBallData, settings.playerBallRad, true, true);
						
				for (var legnum=0;legnum<landingLegData.length;legnum++){
				//	processBoxCollisionsForBoxInfo(boxInfo, landingLegData[legnum], 0.001, false);	//disable to debug easier using only playerCentreBallData collision
				}
			}
			
			function processBoxCollisionsForBoxInfo(boxInfo, landingLeg, collisionBallSize, drawDebugStuff, useForThwop){
				var pointOffset = landingLeg.pos.map( elem => -elem);	//why reversed? probably optimisable. TODO untangle signs!
								
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
						var vectorFromBox = relativePos.map(elem => elem>0 ? Math.max(elem - projectedBoxSize,0) : Math.min(elem + projectedBoxSize,0));
						var surfacePoint = vectorFromBox.map((elem,ii)=> elem-relativePos[ii]);
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
							
							var reactionNormal=vectorFromBox.map(elem => elem/distFromBox);
							
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
								
								mat4.set(bb.matrix, debugDraw.mats[0]);
								mat4.set(bb.matrix, debugDraw.mats[1]);
								xyzmove4mat(debugDraw.mats[0], [-relativePos[0],-relativePos[1],-relativePos[2]]);
								
								//mat4.set(bb.matrix, debugDraw.mats[2]);
								//xyzmove4mat(debugDraw.mats[2], [-relativePos[0],-relativePos[1],-relativePos[2]]);
								//xyzmove4mat(debugDraw.mats[2], reactionNormal);
								mat4.set(tempMat3, debugDraw.mats[2]);		//just set because using outside if (drawDebugStuff)
								
								
								//this might show that should have /relativePos[3] here.
								
								//get the position of debugDraw.mats[2] in the frame of the player.
								//draw something at this position (similar to how draw landing legs)
								//....
								
								//already have relativeMat. position of box relative to player maybe already available
								var relativePosB = relativeMat.slice(12);
								mat4.set(playerCamera, debugDraw.mats[3]);
								xyzmove4mat(debugDraw.mats[3], [-relativePosB[0],-relativePosB[1],-relativePosB[2]]);
								//TODO account for duocylinder rotation (currently assuming unrotated)
								
								mat4.set(bb.matrix, debugDraw.mats[4]);
								xyzmove4mat(debugDraw.mats[5], surfacePoint);
							}
							
							//apply force in this direction
							var forcePlayerFrame = relativePosC.map(elem => elem*reactionForce);
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
			
			function processMengerSpongeCollision(){
				collidePlayerWithObjectByClosestPointFunc(
					0.01*guiParams.drawShapes.buildingScale,
					buildingMatrix,
					debugDraw.mats[6],
					point => mengerUtils.getClosestPoint(point, 2),
					mengerUtils.getLastPen,
					myAudioPlayer.setWhooshSoundMenger
				);
			}

			function processOctoFractalCollision(){
				collidePlayerWithObjectByClosestPointFunc(
					0.01*guiParams.drawShapes.octoFractalScale,
					octoFractalMatrix,
					debugDraw.mats[7],
					point => octoFractalUtils.getClosestPoint(point,3), 
					octoFractalUtils.getLastPen,
					myAudioPlayer.setWhooshSoundOctoFractal
				);
			}

			function collidePlayerWithObjectByClosestPointFunc(objectScale, objectMatrix, debugPointMat, closestPointFunc, getLastPenFunc, setSoundFunc){
				var relativeMat = mat4.create();	//TODO reuse
	
				//get player position in frame of objectMatrix
				//note full matrix rotation is maybe not needed here. only vector output is wanted.		
				mat4.set(playerMatrixTransposedDCRefFrame, relativeMat);
				mat4.multiply(relativeMat, objectMatrix);
				
				var relativePos = [relativeMat[3], relativeMat[7], relativeMat[11], relativeMat[15]];	//need last one?
	
				if (relativePos[3]<0){
					return;	//don't bother if in other half of the world. TODO tighter early discard (compare with number other than 0.)
				}

				var bSize = objectScale;
				var pSize = settings.playerBallRad;

				var playerInObjectFrame = relativePos.slice(0,3);
				var pointScaledInObjectFrame = playerInObjectFrame.map(x => x/bSize);	//*relativePos[3]));

				var closestPointInObjectFrame = closestPointFunc(pointScaledInObjectFrame);
				var closestPointScaledBack = closestPointInObjectFrame.map(x=>-x*bSize);

				mat4.set(objectMatrix, debugPointMat);
								
				xyzmove4mat(debugPointMat, closestPointScaledBack);

				//take difference between position, closest point 
				//calculate by taking difference between input, output points in 3d, or 4D from matrices. result approx same for small distances,
				//and 4d version would not be exact as is, because the closest point used is not accurate (is calculated for 3d flat space)
				var displacement = pointScaledInObjectFrame.map((xx,ii)=>xx - closestPointInObjectFrame[ii] );
				var displacementSq = displacement.reduce((accum, xx) => accum+xx*xx, 0);
				var displacementLength = Math.sqrt(displacementSq);
				var scaledDisplacementLen = bSize*displacementLength;
				currentPen = pSize - scaledDisplacementLen; //note will fall over if player centre inside sponge!

				var penChange = currentPen - getLastPenFunc(currentPen);
				var reactionForce = Math.max(50*currentPen + 1000*penChange, 0);

				mat4.set(playerMatrixTransposedDCRefFrame, tmpRelativeMat);
				mat4.multiply(tmpRelativeMat, debugPointMat);
				distanceForNoise = distBetween4mats(tmpRelativeMat, identMat);
					//TODO can this result be reused in the if statement below?
				var soundSize = 0.002;
				panForNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));
				setSoundHelper(setSoundFunc, distanceForNoise, panForNoise, spd);

				if (currentPen > 0 && reactionForce> 0){	//penetration

					//var reactionNormal=displacement.map(elem => elem/scaledDisplacementLen);

					
					var relativeMatC = mat4.create(playerMatrixTransposedDCRefFrame);

					//commented out version more similar to box collision, which seems overcomplicated -
					//var tempMat = mat4.create();
					//mat4.set(objectMatrix, tempMat);
					//xyzmove4mat(tempMat, [-relativePos[0],-relativePos[1],-relativePos[2]]);	//player's position in sponge frame
					//xyzmove4mat(tempMat, reactionNormal);	//shifted by the reaction normal!
					//mat4.multiply(relativeMatC, tempMat);
					//mat4.set(debugPointMat, tempMat);	//TODO alternative version something like this. should scale by distance

					mat4.multiply(relativeMatC, debugPointMat);

					var relativePosC = relativeMatC.slice(12);
					//normalise. note could just assume that length is player radius, or matches existing calculation for penetration etc, to simplify.
					var relativePosCLength = Math.sqrt(1-relativePosC[3]*relativePosC[3]);	//assume matrix SO4
					var relativePosCNormalised = relativePosC.map(x=>x/relativePosCLength);
					var forcePlayerFrame = relativePosCNormalised.map(elem => elem*reactionForce);
					for (var cc=0;cc<3;cc++){
						playerVelVec[cc]+=forcePlayerFrame[cc];
					}
				}
			}

			
			function processTriangleObjectCollision(){
				var closestRoughSqDistanceFound = Number.POSITIVE_INFINITY;
				var distanceResults=[];

				var possibleObjects = bvhObjsForWorld[playerContainer.world];
				if (guiParams.debug.worldBvhCollisionTestPlayer){
					//find set of candiate objects by their bounding spheres - 
					//provided each object has something solid within its bounding sphere
					//any each object has a maximum and minimum possible distance from a given point
					//the find the minimum maximum distance for all objects.
					//any object with a minimum distance above this is NOT the closest so can skip testing for.
					//which in practice is likely to be the bulk of objects. 
					var objsWithMinMaxDistances = bvhObjsForWorld[playerContainer.world].map(objInfo => {return {
						objInfo,
						minMaxDist: minMaxDistanceFromPointToBoundingSphere(playerPos, objInfo.mat.slice(12), objInfo.scale*objInfo.bvh.boundingSphereRadius)
					}});
					var maxPossibleDistance = objsWithMinMaxDistances.map(xx=>xx.minMaxDist[1]).reduce((a,b)=>Math.min(a,b), 0.1);
					possibleObjects = objsWithMinMaxDistances
						.filter(xx=>xx.minMaxDist[0]<=maxPossibleDistance)
						.map(xx=>xx.objInfo);
				}

				possibleObjects.forEach(objInfo =>
				{
					var transposedObjMat = objInfo.transposedMat;
					var objMat = objInfo.mat;
					var objBvh = objInfo.bvh;
					var objScale = objInfo.scale;

					var playerPosVec = vec4.create(playerPos);
					mat4.multiplyVec4(transposedObjMat, playerPosVec, playerPosVec);
					
					if (playerPosVec[3]<=0.5){	//TODO tighter bounding sphere.
						return;
					}						

					var projectedPosInObjFrame = playerPosVec.slice(0,3).map(val => val/(objScale*playerPosVec[3]));

					//var closestPointResult = closestPointBvhBruteForce(projectedPosInObjFrame, objBvh);
					var closestPointResult = closestPointBvhEfficient(projectedPosInObjFrame, objBvh);

					var closestPointInObjectFrame = closestPointResult.closestPoint;
					
					//get distance from player.
					//TODO return from above, or combine with closestPointBvh / use world level bvh?

					var vectorToPlayerInObjectSpace = vectorDifference(projectedPosInObjFrame, closestPointInObjectFrame);
					var roughDistanceSqFromPlayer = dotProduct(vectorToPlayerInObjectSpace,vectorToPlayerInObjectSpace)
										*objScale*objScale;	//multiplying by scale with view to using multiple scales

					distanceResults.push(roughDistanceSqFromPlayer);

					//TODO only do this once found closest point, object (otherwise doing unnecessary matrix calcs unless
					//first object has closest point.)
					if (roughDistanceSqFromPlayer<closestRoughSqDistanceFound){
						triObjClosestPointType = closestPointResult.closestPointType;

						closestRoughSqDistanceFound = roughDistanceSqFromPlayer;

						var positionInProjectedSpace = closestPointInObjectFrame.map(val => val*objScale);					
						//var veclen = Math.hypot.apply(null, positionInProjectedSpace);
						var veclen = Math.sqrt(positionInProjectedSpace.reduce((accum, xx)=>accum+xx*xx, 0));
						var scalarAngleDifference = Math.atan(veclen);


						var correction = -scalarAngleDifference/veclen;
						var angleToMove = positionInProjectedSpace.map(val => val*correction);

						//draw object - position at object centre, then move by vec to point in object space.
						mat4.set(objMat, debugDraw.mats[8]);
						xyzmove4mat(debugDraw.mats[8], angleToMove);	//draw x on closest vertex
					}
				});

				//TODO handle possibility that returned early and debugDraw.mats[8] is not set.


				//sound. 
				//TODO efficient distance calculation without matrix mult
				mat4.set(playerMatrixTransposed, tmpRelativeMat);
				mat4.multiply(tmpRelativeMat, debugDraw.mats[8]);
				distanceForNoise = distBetween4mats(tmpRelativeMat, identMat);
				var soundSize = 0.002;
				panForNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));
				
				//note spd (speed) in is in duocylinder frame, but object currently does not rotate with it.
				setSoundHelper(myAudioPlayer.setWhooshSoundTriangleMesh, distanceForNoise, panForNoise, spd);


				//player collision - apply reaction force due to penetration, with some smoothing (like spring/damper)
				//cribbed from collidePlayerWithObjectByClosestPointFunc
				var lastTriangleObjPen = currentTriangleObjectPlayerPen;
				currentTriangleObjectPlayerPen = settings.playerBallRad - distanceForNoise;
				var penChange = currentTriangleObjectPlayerPen - lastTriangleObjPen;
				var reactionForce = Math.max(50*currentTriangleObjectPlayerPen + 1000*penChange, 0);
				
				if (currentTriangleObjectPlayerPen > 0 && reactionForce> 0){
						//different to collidePlayerWithObjectByClosestPointFunc, which takes places in duocylinder spun space.
					var relativePosC = tmpRelativeMat.slice(12);
					//normalise. note could just assume that length is player radius, or matches existing calculation for penetration etc, to simplify.
					var relativePosCLength = Math.sqrt(1-relativePosC[3]*relativePosC[3]);	//assume matrix SO4
					var relativePosCNormalised = relativePosC.map(x=>x/relativePosCLength);
					var forcePlayerFrame = relativePosCNormalised.map(elem => elem*reactionForce);
					for (var cc=0;cc<3;cc++){
						playerVelVec[cc]+=forcePlayerFrame[cc];
					}
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

		var tmpVec4 = vec4.create();				//variable referring to this to make quicker to reference?
		var bulletPos = new Array(4); 
		var bulletPos4V = vec4.create();
		var bulletPosDCF4V = vec4.create();
		//slightly less ridiculous place for this - not declaring functions inside for loop!
		function checkBulletCollision(bullet, bulletMoveAmount){
			function boxCollideArray(bArray){
				for (var bb of bArray){
					boxCollideCheck(bb.matrixT,duocylinderSurfaceBoxScale,critValueDCBox, bulletPosDCF4V, true);
				}
			}
			function boxCollideCheck(cellMatT,thisBoxSize,boxCritValue, bulletPos4V, moveWithDuocylinder){
					mat4.multiplyVec4(cellMatT, bulletPos4V, tmpVec4);
					if (tmpVec4[3]<boxCritValue){return;}	//early sphere check
					if (Math.max(Math.abs(tmpVec4[0]),
								Math.abs(tmpVec4[1]),
								Math.abs(tmpVec4[2]))<thisBoxSize*tmpVec4[3]){
						detonateBullet(bullet, moveWithDuocylinder, [1,0.8,0.6,1]);
				}
			}
			function checkCollisionForBoxRing(ringCellMatsT){
				for (var ii=0;ii<ringCellMatsT.length;ii++){
					boxCollideCheck(ringCellMatsT[ii],ringBoxSize,critValueRingBox,bulletPos4V);
				}
			}

			var worldInfo = guiSettingsForWorld[bullet.world];
			var dcSpin = worldInfo.spin;
					//todo keep bullets in lists/arrays per world so can check this once per world

			var bulletMatrix=bullet.matrix;
			tmpVec4[0]=tmpVec4[1]=tmpVec4[2]=tmpVec4[3]=0;
			mat4.set(bulletMatrix,bulletMatrixTransposed);
			mat4.transpose(bulletMatrixTransposed);
			
			mat4.set(bulletMatrixTransposed,bulletMatrixTransposedDCRefFrame);	//in frame of duocylinder
			rotate4mat(bulletMatrixTransposedDCRefFrame, 0, 1, dcSpin);
			
			for (var cc=0;cc<4;cc++){
				bulletPos[cc] = bulletMatrix[12+cc];
				bulletPos4V[cc]= bulletPos[cc];
				bulletPosDCF4V[cc] = bulletMatrixTransposedDCRefFrame[3+4*cc];
			}
			
			var bulletVel=bullet.vel;
			xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount,bulletVel));
			
			var newBulletPos = bulletMatrix.slice(12);	//already copying bulletpos before moved.

			mat4.set(invTargetMat,relativeMat);
			mat4.multiply(relativeMat, bulletMatrix);
			
			if (targetCollisionFunc(relativeMat)){
				detonateBullet(bullet);
			}
			
			if (worldInfo.duocylinderModel == "procTerrain"){
				//collision with duocylinder procedural terrain	
				if (getHeightAboveTerrainFor4VecPos(bulletPos, dcSpin)<0){detonateBullet(bullet, true, [0.3,0.3,0.3,1]);}
			}
			if (worldInfo.duocylinderModel == "l3dt-brute" || worldInfo.duocylinderModel == "l3dt-blockstrips"){
				if (getHeightAboveTerrain2For4VecPos(bulletPos, dcSpin)<0){detonateBullet(bullet, true, [0.3,0.3,0.3,1]);}
			}
			if (Object.keys(voxTerrainData).includes(worldInfo.duocylinderModel)){	//TODO generalise collision by specifying a function for terrain. (voxTerrain, procTerrain)
				if (voxTerrainData[worldInfo.duocylinderModel].collisionFunction(bulletPos, dcSpin)>0){detonateBullet(bullet, true, [0.5,0.5,0.5,1]);}
			}
			if (worldInfo.seaActive){
				if (getHeightAboveSeaFor4VecPos(bulletPos, lastSeaTime, dcSpin)<0){detonateBullet(bullet, true, [0.6,0.75,1,1]);}
				//if (getHeightAboveSeaFor4VecPos(bulletPos, 0)<0){detonateBullet(bullet, true);}
			}
			
			//slow collision detection between bullet and array of boxes.
			//todo 1 try simple optimisation by matrix/scalar multiplication instead of matrix-matrix
			//todo 2 another simple optimisation - sphere check by xyzw distance. previous check only if passes
			//todo 3 heirarchical bounding boxes or gridding system!
			
			//menger sponge. 
			if (guiParams.drawShapes.building){
				//test with box collision
				
				//var bSize = 0.01*guiParams.drawShapes.buildingScale;
				//var critSize = 1/Math.sqrt(1+3*bSize*bSize);
				//boxCollideCheck(transposedBuildingMatrix,bSize,critSize,bulletPosDCF4V, true);

				mat4.multiplyVec4(transposedBuildingMatrix, bulletPosDCF4V, tmpVec4);

				if (tmpVec4[3]>0){
					var homogenous = tmpVec4.slice(0,3).map(xx=>xx/tmpVec4[3]);
					var bSize = 0.01*guiParams.drawShapes.buildingScale;
					var scaledInput = homogenous.map(x=>x/bSize);

					if (mengerUtils.isInside(scaledInput,2)){
						detonateBullet(bullet, true, [0.3,0.3,0.3,1]);
					}
				}
			}

			//octohedron fractal
			if (guiParams.drawShapes.octoFractal){
				mat4.multiplyVec4(transposedOctoFractalMatrix, bulletPosDCF4V, tmpVec4);
				if (tmpVec4[3]>0){
					var homogenous = tmpVec4.slice(0,3).map(xx=>xx/tmpVec4[3]);
					var bSize = 0.01*guiParams.drawShapes.octoFractalScale;
					var scaledInput = homogenous.map(x=>x/bSize);

					if (octoFractalUtils.isInside(scaledInput, 3)){
						detonateBullet(bullet, true, [0.3,0.3,0.3,1]);
					}
				}
			}

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
			var gridSqs = getGridSqFor4Pos(bulletPos, worldInfo.spin);
			
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
					
					if (hyperboloidData.colCheck([relativeMat[3],relativeMat[7],relativeMat[11]].map(val => val/(relativeMat[15])))){
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
						var projectedPosAbs = [relativeMat[3],relativeMat[7],relativeMat[11]].map(val => Math.abs(val)/(cellSize*relativeMat[15]));
						if (Math.max(projectedPosAbs[0],projectedPosAbs[1],projectedPosAbs[2])<1){
							var count=projectedPosAbs.reduce((sum,val) => val>0.8?sum+1:sum,0);
							if (count>1){
								detonateBullet(bullet);
							}
						}
					}
				}
			}

			//collision with bvh objects
			var possiblities = bvhObjsForWorld[bullet.world];
			
			if (guiParams.debug.worldBvhCollisionTest){
				//find possible collisions where 4d aabb of the bounding sphere of the object overlaps
				//the 4d aabb of the line
				var lineAABB = aabb4DForLine(bulletPos, newBulletPos);
				possiblities = bvhObjsForWorld[bullet.world].filter(objInfo => 
					aabbsOverlap4d(lineAABB, objInfo.aabb4d));
			}

			possiblities.forEach(objInfo => {
				//transform bullet into object frame (similar logic to boxes etc), applying scale factor.

				var bulletPosVec = getPosInMatrixFrame(bulletPos, objInfo.transposedMat);
				var bulletPosEndVec = getPosInMatrixFrame(newBulletPos, objInfo.transposedMat);

				//reject if bullet start or end is in other hemisphere to object checking collision with.
				//NOTE this is a stopgap measure - when using world BVH, or long ray collision with world object bounds,
				// won't be necessary to do this.
				if (bulletPosVec[3]<=0 || bulletPosEndVec[3]<=0){
					return;
				}

				var projectedPosInObjFrame = projectTo3dWithScale(bulletPosVec, objInfo.scale);
				var projectedPosEndInObjFrame = projectTo3dWithScale(bulletPosEndVec, objInfo.scale);

				//if (bvhSphereOverlapTest(projectedPosInObjFrame, 0.01, objInfo.bvh)){
				if (bvhRayOverlapTest(projectedPosInObjFrame, projectedPosEndInObjFrame, objInfo.bvh)){
					detonateBullet(bullet, false, [0.3,0.3,0.8]);
				}
			});

			//ray collision with bendy objects. NOTE this isn't quite right
			if (guiParams.drawShapes.viaduct != 'none' && bridgeBuffers.isLoaded){
				var bridgeScale = 0.042;	//copied from elsewhere
				doBendyBvhCollision(duocylinderBoxInfo.viaducts.list, bridgeScale, bridgeBvh);
				doBendyBvhCollision(duocylinderBoxInfo.viaducts2.list, bridgeScale, bridgeBvh);
			}

			function doBendyBvhCollision(bendyObjsInfo, objScale, bvh){
				var lastInfo = bendyObjsInfo[bendyObjsInfo.length-1];
				var projectedLastPosInObjFrame = getProjectedPointInMatrixFrame(bulletPos, lastInfo.matrixT, objScale);
				var projectedLastPosEndInObjFrame = getProjectedPointInMatrixFrame(newBulletPos, lastInfo.matrixT, objScale);
				var lastPointPositive = projectedLastPosInObjFrame.positive && projectedLastPosEndInObjFrame.positive;
				for (var ii=0;ii<bendyObjsInfo.length;ii++){
					var thisInfo = bendyObjsInfo[ii];
					var projectedPosInObjFrame = getProjectedPointInMatrixFrame(bulletPos, thisInfo.matrixT,objScale);
					var projectedPosEndInObjFrame = getProjectedPointInMatrixFrame(newBulletPos, thisInfo.matrixT,objScale);
					var thisPointPositive = projectedPosInObjFrame.positive && projectedPosEndInObjFrame.positive;

					if (thisPointPositive && lastPointPositive){
						//average positions in the two frames
						var weightedAverageStartPosObjFrame = performWeightedAverage(projectedPosInObjFrame.result, projectedLastPosInObjFrame.result);
						var weightedAverageEndPosObjFrame = performWeightedAverage(projectedPosEndInObjFrame.result, projectedLastPosEndInObjFrame.result);

						if (bvhRayOverlapTest(weightedAverageStartPosObjFrame, weightedAverageEndPosObjFrame, bvh)){
							detonateBullet(bullet, false, [0.3,0.3,0.8]);
						}
					}

					function performWeightedAverage(posInFirstFrame, posInSecondFrame){
						//return posInFirstFrame;	//works for drawing individual non-bendy object.
						
						var weightForFirstFrame = -posInSecondFrame[2];
						var weightForSecondFrame = posInFirstFrame[2];
						var totalWeight = weightForFirstFrame+weightForSecondFrame;
						weightForFirstFrame/=totalWeight;
						weightForSecondFrame/=totalWeight;

						posInFirstFrameAdjusted = posInFirstFrame.slice();
						posInSecondFrameAdjusted = posInSecondFrame.slice();
						posInFirstFrameAdjusted[2]-=1;
						posInSecondFrameAdjusted[2]+=1;

						var weightedAverage = [0,0,0];

						for (var cc=0;cc<3;cc++){
							weightedAverage[cc]+=
								weightForFirstFrame*posInFirstFrameAdjusted[cc]+weightForSecondFrame*posInSecondFrameAdjusted[cc];
						}

						return weightedAverage;
					}

					lastPointPositive = thisPointPositive;
					projectedLastPosInObjFrame = projectedPosInObjFrame;
					projectedLastPosEndInObjFrame = projectedPosEndInObjFrame;
						//TODO just store weighted result
				}
			}

			function getProjectedPointInMatrixFrame(inputPos, matrixTransposed, objectScale){
				var posInFrame = getPosInMatrixFrame(inputPos, matrixTransposed);
				if (posInFrame[3]<0){
					return {
						positive:false
					}
				}
				return {
					positive: true,
					result: projectTo3dWithScale(posInFrame,objectScale)
				}
			}
				
			function getPosInMatrixFrame(inputPos, matrixTransposed){
				var posInFrame = vec4.create(inputPos);					//todo reuse vector
				mat4.multiplyVec4(matrixTransposed, posInFrame, posInFrame);
				return posInFrame;
			}

			function projectTo3dWithScale(posInFrame, objectScale){
				var projectedPosInObjFrame = posInFrame.slice(0,3).map(val => val/(objectScale*posInFrame[3]));
				return projectedPosInObjFrame;
			}
			

			var cellIdxForBullet = getGridId.forPoint(bulletPos);
			
			//tetrahedron. (16-cell and 600-cell)
			if (guiParams["draw 16-cell"]){
				checkTetraCollisionForArray(1, cellMatData.d16);
			}
			if (guiParams["draw 600-cell"]){
				var idsToCheck = cellMatData.d600GridArrayArray[cellIdxForBullet];
				checkTetraCollisionForArrayAndArrayIds(0.386/(4/Math.sqrt(6)), cellMatData.d600[0], idsToCheck);
			}
			
			function checkTetraCollisionForMatAndVals(thisMat,critVal,cellScale){
				var dotProd = thisMat[12]*bulletMatrix[12] + thisMat[13]*bulletMatrix[13] +
				thisMat[14]*bulletMatrix[14] + thisMat[15]*bulletMatrix[15];

				if (dotProd>critVal){
					mat4.set(bulletMatrixTransposed, relativeMat);
					mat4.multiply(relativeMat, thisMat);		

					var projectedPos = [relativeMat[3],relativeMat[7],relativeMat[11]].map(val => val/(cellScale*relativeMat[15]));
					
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

			function checkTetraCollisionForArrayAndArrayIds(cellScale, matsArr, arrIds){
				var critVal = 1/Math.sqrt(1+cellScale*cellScale*3);
				for (ii in arrIds){
					var dd=arrIds[ii];
					checkTetraCollisionForMatAndVals(matsArr[dd], critVal, cellScale);
				}
			}

			function checkTetraCollisionForArray(cellScale, matsArr){
				var critVal = 1/Math.sqrt(1+cellScale*cellScale*3);
				for (dd in matsArr){
					checkTetraCollisionForMatAndVals(matsArr[dd], critVal, cellScale);
				}
			}

			//octohedron collision
			if (guiParams["draw 24-cell"]){
				var cellSize24 = guiParams["24-cell scale"];
				var critVal = 1/Math.sqrt(1+cellSize24*cellSize24);

				for (dd in cellMatData.d24.cells){
					var thisMat = cellMatData.d24.cells[dd];
					var dotProd = thisMat[12]*bulletMatrix[12] + thisMat[13]*bulletMatrix[13] +
						thisMat[14]*bulletMatrix[14] + thisMat[15]*bulletMatrix[15];

					if (dotProd>critVal){
						mat4.set(bulletMatrixTransposed, relativeMat);
						mat4.multiply(relativeMat, thisMat);

						//todo speed up. division for all vec parts not necessary
						//change number inside if rhs comparison
						//also should apply multiplier to 0.8 for inner check.
						var projectedPosAbs = [relativeMat[3],relativeMat[7],relativeMat[11]].map(val => Math.abs(val)/(cellSize24*relativeMat[15]));
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

				var idsToCheck = cellMatData.d120GridArrayArray[cellIdxForBullet];
				
				for (ii in idsToCheck){	//single element of array for convenience
					var dd=idsToCheck[ii];

					var thisMat = cellMats[dd];
					var dotProd = thisMat[12]*bulletMatrix[12] + thisMat[13]*bulletMatrix[13] +
							thisMat[14]*bulletMatrix[14] + thisMat[15]*bulletMatrix[15];

					if (dotProd>critVal){
						mat4.set(bulletMatrixTransposed, relativeMat);
						mat4.multiply(relativeMat, cellMats[dd]);
						
						var projectedPos = [relativeMat[3],relativeMat[7],relativeMat[11]].map(val => val/(dodecaScale*relativeMat[15]));
						
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

			var explosionParticles = explosionParticleArrs[bullet.world];

			if (!moveWithDuocylinder){
				new Explosion(bullet, 0.0001, [1,0.5,0.25], false, true);
				explosionParticles.makeExplosion(matrix.slice(12), frameTime, color,0);
			}else{
				explosionParticles.makeExplosion(matrix.slice(12), frameTime, color,0);
					//TODO include velocity for explosion particles due to duocylinder rotation.
					//should see slower particles fall to ground, but won't look good yet because particles disappear quickly, abruptly.

				rotate4matCols(matrix, 0, 1, guiSettingsForWorld[bullet.world].spin);	//get bullet matrix in frame of duocylinder. might be duplicating work from elsewhere.
				new Explosion(bullet, 0.0001, [0.2,0.4,0.6],true, true);	//different colour for debugging
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
						portalTestMultiPortal(b, 0);
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
		playerLight = playerLightUnscaled.map(val => val*flashAmount);
		
		portalTestMultiPortal(playerContainer, 0);	//TODO switch off portal in reflector mode. requires camera changes too.
		
		//bounce off portal if reflector
		if (!guiParams.reflector.isPortal){
			var portals = portalsForWorld[worldA];
			for (var pp=0;pp<portals.length;pp++){
				var thisPortal = portals[pp];
				var effectiveRange = Math.tan(Math.atan(thisPortal.shared.radius)+Math.atan(0.003));	//TODO reformulate more efficiently
				if (checkWithinRangeOfGivenPortal(playerCamera, effectiveRange, thisPortal)){
					
					//calculate in frame of portal
					//logic is repeated from checkWithinReflectorRange
					// TODO simplify - checkWithinReflectorRange was since replaced by checkWithinRangeOfGivenPortal which avoids
					// creating matrices
					var portalRelativeMat = mat4.create(thisPortal.matrix);
					mat4.transpose(portalRelativeMat);
					mat4.multiply(portalRelativeMat,playerCamera);

					var towardsPortal = [portalRelativeMat[3],portalRelativeMat[7],portalRelativeMat[11],portalRelativeMat[15]]; //in player frame
					var normalisingFactor=1/Math.sqrt(1-towardsPortal[3]*towardsPortal[3])
					towardsPortal = towardsPortal.map(elem => elem*normalisingFactor);
					//vel toward portal 
					var velTowardsPortal = ( towardsPortal[0]*playerVelVec[0] + towardsPortal[1]*playerVelVec[1] + towardsPortal[2]*playerVelVec[2]);
					velTowardsPortal*=1.2;					//multiply by 1+coefficient of restitution
					if (velTowardsPortal<0){
						//playerVelVec = playerVelVec.map(elem => -elem); //simple reverse velocity
						for (var cc=0;cc<3;cc++){
							playerVelVec[cc] -= velTowardsPortal*towardsPortal[cc];
						}
					}
					//currently can get closer to sphere if push continuously. TODO move back out to effectiveRange
				}
			}
		}
		
		mat4.set(playerCamera,sshipMatrixNoInterp);	//todo store gun matrices in player frame instead
		sshipWorld = playerContainer.world;
		updateGunTargeting(sshipMatrixNoInterp);

		//rotate remainder of time for aesthetic. (TODO ensure doesn't cock up frustum culling, hud etc)
		setMat4FromToWithQuats(playerCamera, playerCameraInterp);
		xyzrotate4mat(playerCameraInterp, scalarvectorprod(timeTracker/timeStep -1,lastPlayerAngMove));
	}
})();

//TODO less of a bodge!
function rotateVelVec(velVec,rotateVec){
	//var velVecMagsq = velVec.reduce((total, val) => total+ val*val, 0);
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

function portalTestMultiPortal(obj, amount){
	//get obj matrix in frame of portal matrix. 
	//for distance check, only required for moved portal, not rotated.

	//then move through portal, and apply other portal matrix...

	//assume that won't traverse multiple portals in one frame.
	var portalsForThisWorld = portalsForWorld[obj.world];
	for (var ii=0;ii<portalsForThisWorld.length;ii++){

		var portal =  portalsForThisWorld[ii];
		var adjustedRad = portal.shared.radius + amount;	//avoid issues with rendering very close to surface

		var crossed = portalTestForGivenPortal(obj, adjustedRad, portal);
		if (crossed){break;}	//avoid crossing portal twice, when 1st portal smaller radius than 2nd
	}
}
function portalTestForGivenPortal(obj, adjustedRad, portal){
	if (checkWithinRangeOfGivenPortal(obj.matrix, adjustedRad, portal)){
		moveMatrixThruPortal(obj.matrix, adjustedRad, 1.00000001, portal);
		obj.world=portal.otherps.world;
		return true;
	}
	return false;
}
function checkWithinRangeOfGivenPortal(objMat, rad, portal){
	var dotProd = 0;
	for (var ii=12;ii<16;ii++){
		dotProd+= objMat[ii] * portal.matrix[ii]
	}
	return dotProd>1/Math.sqrt(1+rad*rad);
}

function moveMatrixThruPortal(matrix, rad, hackMultiplier, portal, skipStartEndRotations){
	//TODO just work with qpairs (and save on updating matrix)

	if (!skipStartEndRotations){
		//apply entrance portal matrix
		if (matrix.qPair){
			transpose_mat_with_qpair(matrix);
			multiply_mat_with_qpair(matrix, portal.matrix);
			transpose_mat_with_qpair(matrix);
		}else{
			mat4.transpose(matrix);
			mat4.multiply(matrix, portal.matrix);
			mat4.transpose(matrix);
		}
	}
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


	if (skipStartEndRotations){return;}

	//apply exit portal matrix
	if (matrix.qPair){
		transpose_mat_with_qpair(matrix);
		multiply_mat_with_qpair_transp(matrix, portal.otherps.matrix);
		transpose_mat_with_qpair(matrix);

		cleanupMat(matrix);	//unsure if here is best place for this, but cures issue with portal transitions getting wacky after a while.
							//probably only need to normalise quaternions. recalculating matrices now maybe inefficient.

	}else{
		var invOtherPMat = mat4.create(portal.otherps.matrix);
		mat4.transpose(invOtherPMat);

		mat4.transpose(matrix);
		mat4.multiply(matrix, invOtherPMat);
		mat4.transpose(matrix);
	}
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
var rttFisheyeRectRenderOutput={};
var rttFisheyeRectRenderOutput2={};
var rttView={};
var rttStageOneView={};
var rttFisheyeView2={};
var rttAnaglyphIntermediateView={};

function texImage2DWithLogs(mssg, target, level, internalformat, width, height, border, format, type, offsetOrSource){
	console.log({"mssg":"called texImage2D "+mssg, "parameters":{target, level, internalformat, width, height, border, format, type, offsetOrSource}});
	gl.texImage2D(target, level, internalformat, width, height, border, format, type, offsetOrSource);
}

function setRttSize(view, width, height){	
	if (view.sizeX == width && view.sizeY == height){return;}	// avoid setting again if same numbers ( has speed impact)
																	//todo check for memory leak
	view.sizeX = width;
	view.sizeY = height;
		
	view.framebuffer.width = width;
	view.framebuffer.height = height;	
	
	gl.bindTexture(gl.TEXTURE_2D, view.texture);
	texImage2DWithLogs("after binding view texture", 
		gl.TEXTURE_2D, 0,
		gl.RGBA, view.framebuffer.width, view.framebuffer.height, 0, 
		gl.RGBA, gl.UNSIGNED_BYTE, null);
	
	gl.bindTexture(gl.TEXTURE_2D, view.depthTexture);
	texImage2DWithLogs("after binding depth texture",
		 gl.TEXTURE_2D, 0,
		 gl.DEPTH_COMPONENT24, view.framebuffer.width, view.framebuffer.height, 0,
		 gl.DEPTH_COMPONENT, gl.UNSIGNED_INT , null);	//can use gl.UNSIGNED_BYTE , gl.UNSIGNED_SHORT here but get depth fighting (though only on spaceship) gl.UNSIGNED_INT stops z-fighting, could use WEBGL_depth_texture UNSIGNED_INT_24_8_WEBGL .
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
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterType);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterType);
	//gl.generateMipmap(gl.TEXTURE_2D);
	
	view.depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, view.depthTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	

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
function conditionalSetUniform(glfun, uniform, val){
	if (!uniform){return;}
	glfun.bind(gl)(uniform, val);	
}
function conditionalSetUniform4fv(shader, uniformName, val){
	if (shader.uniforms[uniformName]){
		uniform4fvSetter.setIfDifferent(shader, uniformName, val);
	}
}
function setPortalInfoForShader(shader, infoForPortals){
	conditionalSetUniform(gl.uniform3fv, shader.uniforms.uReflectorDiffColor, infoForPortals[0].localVecReflectorDiffColor);
	conditionalSetUniform(gl.uniform3fv, shader.uniforms.uReflectorDiffColor2, 
		infoForPortals.length > 1 ? infoForPortals[1].localVecReflectorDiffColor: [0,0,0]);	
	conditionalSetUniform(gl.uniform3fv, shader.uniforms.uReflectorDiffColor3, 
		infoForPortals.length > 2 ? infoForPortals[2].localVecReflectorDiffColor: [0,0,0]);
	conditionalSetUniform4fv(shader, "uReflectorPos", infoForPortals[0].reflectorPosTransformed);
	conditionalSetUniform4fv(shader, "uReflectorPos2", 
		infoForPortals.length > 1? infoForPortals[1].reflectorPosTransformed: [0,0,0,1]);
	conditionalSetUniform4fv(shader, "uReflectorPos3",
		infoForPortals.length > 2? infoForPortals[2].reflectorPosTransformed: [0,0,0,1]);
	conditionalSetUniform(gl.uniform1f, shader.uniforms.uReflectorCos, infoForPortals[0].cosReflector)
	conditionalSetUniform(gl.uniform1f, shader.uniforms.uReflectorCos2, 
		infoForPortals.length > 1? infoForPortals[1].cosReflector: 1); //guess can be whatever, but 1 consistent with zero size portal
	conditionalSetUniform(gl.uniform1f, shader.uniforms.uReflectorCos3, 
		infoForPortals.length > 2? infoForPortals[2].cosReflector: 1);
	conditionalSetUniform4fv(shader, "uReflectorPosVShaderCopy", infoForPortals[0].reflectorPosTransformed);
	conditionalSetUniform4fv(shader, "uReflectorPosVShaderCopy2", 
		infoForPortals.length > 1? infoForPortals[1].reflectorPosTransformed: [0,0,0,1]);
	conditionalSetUniform4fv(shader, "uReflectorPosVShaderCopy3", 
		infoForPortals.length > 2? infoForPortals[2].reflectorPosTransformed: [0,0,0,1]);
}
function performGeneralShaderSetup(shader){
	conditionalSetUniform(gl.uniform1f, shader.uniforms.uSpecularStrength, guiParams.display.specularStrength);
	conditionalSetUniform(gl.uniform1f, shader.uniforms.uSpecularPower, guiParams.display.specularPower);
	conditionalSetUniform(gl.uniform1f, shader.uniforms.uTexBias, guiParams.display.texBias);
}
function performShaderSetup(shader, wSettings, tex){	//TODO use this more widely, possibly by pulling out to higher level. similar to performCommon4vecShaderSetup
	({localVecFogColor, infoForPortals, dropLightPos} = wSettings);

	gl.useProgram(shader);	//todo use function variable
	
	if (tex){
		bind2dTextureIfRequired(tex);
	}

	if (shader.uniforms.uFogColor){
		uniform4fvSetter.setIfDifferent(shader, "uFogColor", localVecFogColor);
	}

	setPortalInfoForShader(shader, infoForPortals);

	conditionalSetUniform(gl.uniform3fv, shader.uniforms.uPlayerLightColor, playerLight);
	
	performGeneralShaderSetup(shader);
	
	if (shader.uniforms.uDropLightPos){
		uniform4fvSetter.setIfDifferent(shader, "uDropLightPos", dropLightPos);
	}
}
function performCommon4vecShaderSetup(activeShaderProgram, wSettings, logtag){	//todo move to top level? are inner functions inefficient?
	({worldA,worldInfo, localVecFogColor, infoForPortals, dropLightPos} = wSettings);
	
	if (logtag){
		document[logtag] = {about:"performCommon4vecShaderSetup", localVecFogColor, playerLight, dropLightPos};
	}

	if (activeShaderProgram.uniforms.uCameraWorldPos){	//extra info used for atmosphere shader
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uCameraWorldPos", worldCamera.slice(12));
	}
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uFogColor", localVecFogColor);

	setPortalInfoForShader(activeShaderProgram, infoForPortals);

	conditionalSetUniform(gl.uniform3fv, activeShaderProgram.uniforms.uPlayerLightColor, playerLight);

	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);

	performGeneralShaderSetup(activeShaderProgram);
}
function drawDuocylinderObject(wSettings, duocylinderObj, zeroLevel, seaPeakiness, seaTime, depthMap){	
	var activeShaderProgram, selectedShaderSet;

	//draw using z prepass if enabled. objects with substancial overdraw may draw faster, though increases num vertices drawn
	//TODO config options, disable z calculation and drawing in 2nd pass if prepass perf good, move prepasses to as early as pos
	//to avoid overdraw for other objects occluded by this one

	//depthMap flag means use depthmap texture (ie this pass is depth aware). prepass is not depth aware, and draws to depthmap texture.
	//afterwards, depth aware pass made with depthMap=true 

	if (!duocylinderObj.isSea && guiParams.display.zPrepass && !depthMap){
		activeShaderProgram = shaderPrograms.zPrepass4Vec;
		gl.useProgram(activeShaderProgram);
		drawTennisBall(duocylinderObj, activeShaderProgram);
		return;
	}

	//use a different shader program for solid objects (with 4-vector vertices, premapped onto duocylinder), and for sea (2-vector verts. map onto duocylinder in shader)
	if (!duocylinderObj.isSea){
		if (duocylinderObj.usesTriplanarMapping){	//means is voxTerrain.
			if (!depthMap){
				selectedShaderSet = guiParams.display.perPixelLighting? (guiParams.display.voxNmapTest? 'triplanarPerPixel' : 'triplanarPerPixelTwoAndDiffuse' ) : 'triplanarColor4Vec';
			}else{
				selectedShaderSet = 'triplanarPerPixelTwoAndDiffuseDepthAware';
			}
		}else{
			if (!depthMap){
				selectedShaderSet = duocylinderObj.useMapproject? 
				( guiParams.display.terrainMapProject?
				( guiParams.display.useSpecular? 
					'texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2Tex':'texmap4VecMapprojectDiscardNormalmapVcolorAndDiffuse' ):
						'texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse2Tex'
						):
				( guiParams.display.useSpecular? 'texmap4VecPerPixelDiscardPhong':'texmap4VecPerPixelDiscard' );
			}else{
				selectedShaderSet = duocylinderObj.useMapproject?
				( guiParams.display.terrainMapProject?
				'texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2TexDepthAware':
				 'texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse2TexDepthAware'
				):
				 'texmap4VecPerPixelDiscardPhongDepthAware';
			}
		}
		activeShaderProgram = shaderPrograms[selectedShaderSet][guiParams.display.atmosShader];
		gl.useProgram(activeShaderProgram);
	}else{
		//activeShaderProgram = guiParams.display.perPixelLighting? ( guiParams.display.useSpecular? shaderPrograms.duocylinderSeaPerPixelDiscardPhong[ guiParams.display.atmosShader ] :shaderPrograms.duocylinderSeaPerPixelDiscard[ guiParams.display.atmosShader ]) : shaderPrograms.duocylinderSea[ guiParams.display.atmosShader ];
		activeShaderProgram = shaderPrograms.duocylinderSeaPerPixelDiscardPhongDepthAware[ guiParams.display.atmosShader ];
		gl.useProgram(activeShaderProgram);
		gl.uniform1f(activeShaderProgram.uniforms.uTime, seaTime);			
		gl.uniform1f(activeShaderProgram.uniforms.uZeroLevel, zeroLevel);
		gl.uniform1f(activeShaderProgram.uniforms.uPeakiness, seaPeakiness);
	}
	
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings);
	
	drawTennisBall(duocylinderObj, activeShaderProgram, depthMap);
}

var randomNormalised3vec = (function generate3vecRandomiser(){

	var numArrs = 1024;	//ensure power of 2. if too small will see perferred directions when multiple explosions in same spot, unless
						// add a random rotation to whole explosion (not doing this currently)
	var bitwiseOr = numArrs-1;

	var vecArrs = new Array(numArrs);
	for (var ii=0;ii<numArrs;ii++){
		vecArrs[ii]=new Array(3);
	}
	var nextArrId = 0;

	//precalculate. store normalised vector and length (before normalisation)
	//then can efficiently calculate randomised 3vec with some blend of normalised/not.

	var precalcVecArrs = new Array(numArrs);
	for (var ii=0;ii<numArrs;ii++){
		precalcVecArrs[ii]=new Array(4);
		var precalcVec=precalcVecArrs[ii];
		var lensq=0.000001;	//bodge to cover case that length might be 0 (guess a small number)
		for (var cc=0;cc<3;cc++){
			var thisElem = Math.random()+Math.random()-1;	//add lots of these for better gaussian approx
			precalcVec[cc] = thisElem;
			lensq+=thisElem*thisElem;
		}
		var len = Math.sqrt(lensq);
		for (var cc=0;cc<3;cc++){
			precalcVec[cc]/=len;
		}
		precalcVec[3]=len;
	}

	return function randomNormalised3vec(normalness=1){
		var vec = vecArrs[nextArrId];
		var precalcVec = precalcVecArrs[nextArrId];
		nextArrId = (nextArrId+1) & bitwiseOr;
		var lengthMultiplier = normalness + (1-normalness)*precalcVec[3];
		for (var cc=0;cc<3;cc++){
			vec[cc] = lengthMultiplier*precalcVec[cc];
		}
		return vec;
	}
})();


//TODO pass in relevant args (or move to inside of some IIFE with relevant globals...)

function drawPortalCubemapAtRuntime(pMatrix, portalInCamera, frameTime, reflInfo, portalNum){

	var otherPortalSide = guiParams.reflector.isPortal ? portalsForWorld[offsetCameraContainer.world][portalNum].otherps : 
	portalsForWorld[offsetCameraContainer.world][portalNum];

	//determine if portal is sufficiently far away.
	//set criteria to size of portal on screen. seems half sensible.
	//uses z distance, which determines size for rectilinear camera view, so can swith approximation on/off
	// as rotate view (for same distance from camera, z-distance is smaller, so appears larger, away from centre.
	// fisheye view reduces this effect, but is not accounted for here. TODO if using fisheye, take into account here.
	var invSizeInScreen = -portalInCamera[14]/otherPortalSide.shared.radius;
		//approx, works for distant objects. note using inverse since portalInCamera[14] could be 0
		// TODO work out size of cubemap pixels
		// something more like (distance of reflected camera (inside portal) to portal surface)
		//							----------------------------------------
		//							(distance from camera to portal surface)

	var isFarEnoughAwayInZ = invSizeInScreen > 4;	//inverted so if behind camera counts as close (TODO proper calculation of pix density on portal surface)
	var isOnOtherSideOfWorld = portalInCamera[15] <0;
		//IIRC portalInCamera[15] = w = 1 when close to it, portalInCamera[14] = z is -ve in front, +ve behind camera.
	var isFarEnoughAwayForApproximation = isFarEnoughAwayInZ || isOnOtherSideOfWorld;

	if (isFarEnoughAwayForApproximation || guiParams.reflector.forceApproximation){	
		drawCentredCubemap(otherPortalSide);
		return;
	}

	if (guiParams.reflector.cmFacesUpdated>0){
		var cubemapLevel = guiParams.reflector.cubemapDownsize == "auto" ? 
		(invSizeInScreen< 0.625 ? 0:( invSizeInScreen< 1.25 ? 1:2))	:
				//todo calculate angular resolution of cubemap in final camera,  
				//dependent on distance, FOV, blur, screen resolution etc, and choose appropriate detail level
		guiParams.reflector.cubemapDownsize ;

		var shouldDrawCubemap = setCubemapTexForPortalAndLevel(portalNum, cubemapLevel);	//set texture#1. 

		if (shouldDrawCubemap){
			gl.cullFace(gl.BACK);	//because might have set to front for mirror reversing/landing camera.
			mat4.set(cmapPMatrix, pMatrix);
			//note though pMatrix is actually global. (TODO don't do that, pass in )

			//make a copy and shift matrix
			var cameraContainer = {
				world: otherPortalSide.world,
				matrix: mat4.create(otherPortalSide.matrix)
			}
			var centreShift = reflInfo.cubeViewShiftAdjusted;
			//for testing whether drawing from centre is acceptable approximation for distant portals.
			//if is, can use static cubemap, (+mips)
			xyzmove4mat(cameraContainer.matrix, centreShift);

			drawPortalCubemap(
				cubemapViewCache.getCubemap(portalNum).item, 
				frameTime,
				cameraContainer,
				otherPortalSide,
				guiParams.reflector.cmFacesUpdated,
				guiParams.display.drawTransparentStuff
				);
		}
	}
}

/*
* params: world that portal camera is in, portal number for the portalsides in that world.
* avoidRendering is so don't mess things up when drawing a portal in a portal 
* (should reset various things if wish to support that.)
*/
function drawCentredCubemap(portal, forceRendering){
	//for drawing at load time (or when worlds updated/portals moved).

	var viewToDraw = portal.prerenderedView;
	setCubemapTex(viewToDraw.cubemapTexture);

	if (viewToDraw.haveDrawn && (!forceRendering) ){
		return;
	}
	viewToDraw.haveDrawn=true;

	gl.cullFace(gl.BACK);
	mat4.set(cmapPMatrix, pMatrix);

	drawPortalCubemap(
		viewToDraw, 
		0,		//time
		portal,
		portal,
		6,
		false
		);

	//setCubemapTex(viewToDraw.cubemapTexture);	//likely already set, but at some point will render portals within portals.
	//above doesn't work, possibly because texture1 is used elsewhere (terrain_utils)
	gl.activeTexture(gl.TEXTURE1);	//use texture 1 always for cubemap
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, viewToDraw.cubemapTexture);
	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
}

function drawPortalCubemap(
	cubemapView, frameTime, cameraContainer, 
	portal, 
	numFacesToUpdate, shouldDrawTransparentStuff){
	//TODO move pMatrix etc to only recalc on screen resize
	//make a pmatrix for hemiphere perspective projection method.

	var worldInPortalInfo = guiSettingsForWorld[cameraContainer.world];

	frustumCull = squareFrustumCull;
	
	var wSettingsArr = new Array(numFacesToUpdate);
	//create wSettings array up front - perhaps less efficient than during drawWorldScene calls, but separates things,
	// should consider how to make more efficient - result is mostly independent of rotation (bar reflectorPosTransformed)
	for (var ii=0;ii<numFacesToUpdate;ii++){
		mat4.set(cameraContainer.matrix, worldCamera);
		rotateCameraForFace(ii);
		wSettingsArr[ii] = getWorldSceneSettings.forPortalView(portal);
	}

	if (worldInPortalInfo.duocylinderModel == 'l3dt-blockstrips'){
		updateTerrain2QuadtreeForCampos(cameraContainer.matrix.slice(12), worldInPortalInfo.spin);
	}
	
	var cmapFaceBuffers = shouldDrawTransparentStuff ? cubemapView.intermediateFramebuffers : cubemapView.framebuffers;

	for (var ii=0;ii<numFacesToUpdate;ii++){	//only using currently to check perf impact. could use more "properly" and cycle/alternate.
		var framebuffer = cmapFaceBuffers[ii];
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.viewport(0, 0, framebuffer.width, framebuffer.height);
		mat4.set(cameraContainer.matrix, worldCamera);
		rotateCameraForFace(ii);
		drawWorldScene(frameTime, true, null, wSettingsArr[ii]);

		setCubemapTex(cubemapView.cubemapTexture);	//reset. only requried if draw portals within portals. TODO avoid?
				//TODO - is this messing up drawing of portals in portals???
	}
	
	if (!shouldDrawTransparentStuff){
		return;
	}
	
	for (var ii=0;ii<numFacesToUpdate;ii++){
		var framebuffer = cubemapView.framebuffers[ii];
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.viewport(0, 0, framebuffer.width, framebuffer.height);
		mat4.set(cameraContainer.matrix, worldCamera);
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


//TODO instead put last known value alongside idx in shader. eg  shader.uniforms.whatever = {idx, lastValue}
//TODO put to file with other gl methods
var uniform4fvSetter = (function(){
	//NOTE caching itself seems expensive, perhaps manaually avoiding calling set is better

	var numTimesSet = 0;
	var numTimesAvoidedSet = 0;
	var stats = {};

	var setIfDifferent = function(shader, uniformName, valueToSet){

		//force to float32 array (seems many are this, others are regular array)
		//seems big perf improvement!
		//TODO change value passed in? (TODO avoid conversion here)
		if (Array.isArray(valueToSet)){
			valueToSet = new Float32Array(valueToSet);
		}

		var last = shader.uniformCache[uniformName];

		if (isSame(valueToSet, last)){
			numTimesAvoidedSet++;
			return;
		}
		last.set(valueToSet);

		numTimesSet++;
		gl.uniform4fv(shader.uniforms[uniformName], valueToSet);
	}

	var isSame = function(vecNow, vecLast){
		var componentsMatched = 0;
		for (var ii=0;ii<4;ii++){
			if (vecNow[ii]==vecLast[ii]){
				componentsMatched+=1;
			}
		}
		return (componentsMatched == 4);
	}

	var storeAndResetStats = () => {
		stats = {numTimesSet, numTimesAvoidedSet, percentAvoided: 100*numTimesAvoidedSet/(numTimesSet+numTimesAvoidedSet)};
		numTimesSet = 0;
		numTimesAvoidedSet = 0;
	}

	var getStats = () => stats;

	return {
		setIfDifferent,
		getStats,
		storeAndResetStats
	};
})();



/*
* to replace moveCamInSteps without steps. might also use for eg bullets.
*/
function moveMatHandlingPortal(matContainer, offsetVec){
	//NOTE fails if input vec = 0. TODO make more robust!
	if (offsetVec[0]==0 && offsetVec[1]==0 && offsetVec[2]==0){return;}

	var inputMatrix = matContainer.matrix;
	var inputWorld = matContainer.world;

	//inputMatrix = offsetPlayerCamera , inputWorld = sshipWorld
	// for initial use case (which is initially just at player spaceship position)
	//offsetVec is in frame of inputMatrix.
	
	//for each portal, find whether line from position contained in inputMatrix, to position contained in 
	//inputMatrix once moved by offsetVec, crosses the portal.
	//this can be done by 1st checking that both start, end point are on same half of world as portal in question.
	//this is not strictly required, but is is assumed that offsetVec is short, and making this assumption makes 
	//thinking about problem easier, avoids edge cases.
	//then consider straight line in projective flat space - if the projected straight line crosses the projected
	//portal sphere, calculate how far along, move that distance, move through portal, move rest of distance.
	
	//calculate the start and end position
	var startPos = inputMatrix.slice(12);

	var tmp4mat = newIdMatWithQuats();
	setMat4FromToWithQuats(inputMatrix, tmp4mat);
	xyzmove4mat(tmp4mat,offsetVec);

	var endPos = tmp4mat.slice(12);

	var portalsForThisWorld = portalsForWorld[inputWorld];

	for (var pp=0;pp<portalsForThisWorld.length;pp++){
		var portal = portalsForThisWorld[pp];
		var portalMat = portal.matrix;

		//???
		var portalMatT = mat4.create(portalMat);
		mat4.transpose(portalMatT);

		var startPosInPortalSpace = vec4.create();
		mat4.multiplyVec4(portalMatT, startPos, startPosInPortalSpace);
		var endPosInPortalSpace = vec4.create();
		mat4.multiplyVec4(portalMatT, endPos, endPosInPortalSpace);
			//TODO do without transpose/ new matrix creation.

		if (startPosInPortalSpace[3]<0.5 || endPosInPortalSpace[3]<0.5){
			//TODO consider cutoff value
			continue;
		}

		//only used if pass tests, uses all 4 components
		//TODO move later (after projection) - initially here because easier to reason about.
		var startDotEnd = 0;
		for (var ii=0;ii<4;ii++){
			startDotEnd += startPosInPortalSpace[ii]*endPosInPortalSpace[ii];
		}

		//project
		var difference = new Array(3);
		var differenceSq = 0;
		var differenceDotStart = 0;
		var differenceDotEnd = 0;

		var startPosInPortalSpaceProj = vec4.create();
		var endPosInPortalSpaceProj = vec4.create();

		for (var ii=0;ii<3;ii++){
			startPosInPortalSpaceProj[ii] = startPosInPortalSpace[ii]/startPosInPortalSpace[3];
			endPosInPortalSpaceProj[ii]=endPosInPortalSpace[ii]/endPosInPortalSpace[3];
			difference[ii] = endPosInPortalSpaceProj[ii] - startPosInPortalSpaceProj[ii];
			differenceSq+= difference[ii]*difference[ii];

			//difference = d
			//movement unit vector is d / sqrt(d.d) = d/sqrt(dsq)
			//start component in movement direction
			// is start.d / sqrt(d.d)
			// and remaining part is then start - start.d/sqrt(dsq)

			differenceDotStart += difference[ii]*startPosInPortalSpaceProj[ii];
			differenceDotEnd += difference[ii]*endPosInPortalSpaceProj[ii];
		}

		if (differenceSq<=0){
			alert("differenceSq<=0 . should not be possible!");
			continue;	//if camera not moved. AFAIK impossible
		}
		
		//collide this line with sphere.
		//basically a 2d problem crossing circle.

		var closestApproachVec = new Array(3);
		var closestApproachSq = 0;
		var startComponentInMovementDirection = new Array(3);
		var endComponentInMovementDirection = new Array(3);
		//var differenceMag = Math.sqrt(differenceSq);
		//var normalisedDifference = difference.map(x=>x/differenceMag);

		var scimdDotMd = 0;
		var ecimdDotMd = 0;

		var scimdSq = 0;

		for (var ii=0;ii<3;ii++){
			startComponentInMovementDirection[ii] = differenceDotStart*difference[ii]/differenceSq;
			endComponentInMovementDirection[ii] = differenceDotEnd*difference[ii]/differenceSq;

			closestApproachVec[ii] = startPosInPortalSpaceProj[ii]-startComponentInMovementDirection[ii];
			closestApproachSq+= closestApproachVec[ii]*closestApproachVec[ii];

			scimdDotMd += startComponentInMovementDirection[ii]*difference[ii];
			ecimdDotMd += endComponentInMovementDirection[ii]*difference[ii];

			scimdSq += startComponentInMovementDirection[ii]*startComponentInMovementDirection[ii];
		}
		var rad = portal.shared.radius;

		var otherTriangleSideSq = rad*rad-closestApproachSq;

		if (otherTriangleSideSq<0){
		//	console.log("impossible!! rad = " + rad + ", closestApproachSq = " + closestApproachSq);
			continue; //collision impossible
		}

		if (scimdDotMd>0){
			continue;	//not moving towards portal.
		}

		var thresh = otherTriangleSideSq*differenceSq;

		if ((scimdDotMd*scimdDotMd) < thresh ){
			alert("(scimdDotMd*scimdDotMd)/differenceSq < otherTriangleSideSq  ! unexpected - seems already within portal!");
				//TODO does this break anything? make obvious when happens without alert (freezes game)
				//TODO ability to slow mo/step physics
			continue;
		}
		if (ecimdDotMd < 0 && (ecimdDotMd*ecimdDotMd) > thresh){
			//not moved across boundary
			continue;
		}

		var otherTriangleSide = Math.sqrt(otherTriangleSideSq);

		//can calculate point on projected sphere that will hit.
		//likely this can be simplified!
		var collisionPoint = [];
		var collisionPointSq=1;	//this can be simplified since comes from portal radius.
		var factor = otherTriangleSide/Math.sqrt(scimdSq);
		for (var ii=0;ii<3;ii++){
			collisionPoint[ii] = closestApproachVec[ii] + factor * startComponentInMovementDirection[ii];
			collisionPointSq+=collisionPoint[ii]*collisionPoint[ii];
		}
		collisionPoint[3]=1;
		//then find the angle between start point and this.
		//and the angle between start and finish points
		//then move by appropriate fraction
		
		var halfAngleStartToEnd = halfAngleBetween4Vecs(startPosInPortalSpace, endPosInPortalSpace);
			//note don't have to be in portal space. could use startPos, endPos, not create extra Proj vectors, but want either for next calc...
		
		//unproject/normalise the collision point
		var collisionPointLen = Math.sqrt(collisionPointSq);
		for (var ii=0;ii<4;ii++){
			collisionPoint[ii]/=collisionPointLen;
		}

		var halfAngleToCollisionPoint = halfAngleBetween4Vecs(startPosInPortalSpace, collisionPoint)

		//here can't know will pass portal test, so for quick hack, just move a bit more
		// this might not work for grazing collision, and is noticeable (especially for cockpit camera)
		//TODO explicitly move through portal?
		halfAngleToCollisionPoint+=0.0002;

		var fractionToCollision =halfAngleToCollisionPoint/halfAngleStartToEnd;

		//console.log({angleToCollisionPoint, angleStartToEnd, fractionToCollision});	//expect 0 to 1

		xyzmove4mat(inputMatrix,offsetVec.map(elem => elem*fractionToCollision));

		var currentWorld = matContainer.world;

		portalTestMultiPortal(matContainer,0);

		var newWorld = matContainer.world;

		if (newWorld == currentWorld){console.log("worlds same, though expected portal transition!");}

		var remainingFraction = 1- fractionToCollision;
		xyzmove4mat(inputMatrix,offsetVec.map(elem => elem*remainingFraction));

		return;
	}
	//console.log("ruled out portal camera traversal");
	xyzmove4mat(inputMatrix, offsetVec);
}