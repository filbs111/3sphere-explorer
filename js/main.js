var shouldDumpDebug = false;
var shouldDumpDebug2 = false;
var flickerFlag=true;
var shouldShowControls=false;
var cameraTilt=[0,0,0];
var fullCameraTilt=[0,0,0];

var unitWorldRadiusMetres = 10_000;

// TODO adjust for world size - expect loads of changes here...

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

var duocylinderObjects=(function(){
	function initialiseDuocylinderObjectData(duocylinderObj){
		var mat = mat4.identity();
		var objInfoArr = [];

		var numOuterReps= duocylinderObj.addFlippedCopy?2:1;

		for (var outer=0;outer<numOuterReps;outer++){

			for (var xg=0;xg<duocylinderObj.divs;xg+=1){
				for (var yg=0;yg<duocylinderObj.divs;yg+=1){
					objInfoArr.push(matAndTransposedMat(mat, duocylinderObj.data));
					rotate4mat(mat, 0, 1, duocylinderObj.step);
				}
				rotate4mat(mat, 2, 3, duocylinderObj.step);
			}

			//magic spells. not sure why works, likely more efficient formulation is available!
			rotate4mat(mat, 0, 2, Math.PI/2);	//combo of 2 gets inverted piece! (NOTE not in same place as other piece created in inner loop)
			rotate4mat(mat, 1, 3, Math.PI/2);
		}

		duocylinderObj.objInfoArr = objInfoArr;
	}
	function matAndTransposedMat(mat, collisionTriangleData){
		var transposedMat = mat4.create(mat);
		mat4.transpose(transposedMat);
		return {
			mat:mat4.create(mat),
			transposedMat,
			collisionTriangleData
		}
	}

	var inputData = {
		grid: {divs:4,step:Math.PI/2,minXY:[-0.24999275,-0.00000725],data:tballGridDataPantheonStyle.collisionTriangleData},
//from console:
// tballGridDataPantheonStyle.tricoords.filter((_,ii)=>ii%3==0).reduce((a,b)=>Math.min(a,b),Number.MAX_VALUE)
// -0.24999275
// tballGridDataPantheonStyle.tricoords.filter((_,ii)=>ii%3==1).reduce((a,b)=>Math.min(a,b),Number.MAX_VALUE)
// -0.00000725
		terrain:{divs:2,step:Math.PI,minXY:[-0.25,-0.25],data:terrainData.collisionTriangleData},
		greebleTerrain:{divs:2,step:Math.PI,minXY:[0,0],vertexColors:true,addFlippedCopy:false},
		procTerrain:{divs:1,step:2*Math.PI,isStrips:true,minXY:[0,0],data:proceduralTerrainData.collisionTriangleData},
		sea:{divs:1,step:2*Math.PI,isStrips:true},
		voxTerrain:{divs:2,step:Math.PI,minXY:[0, -0.5]},
// voxTerrainData.voxTerrain.tricoords.filter((_,ii)=>ii%3==0).reduce((a,b)=>Math.min(a,b),Number.MAX_VALUE)
// -0.004672801704145968
// voxTerrainData.voxTerrain.tricoords.filter((_,ii)=>ii%3==1).reduce((a,b)=>Math.min(a,b),Number.MAX_VALUE)
// -0.5001171715557575
//NOTE minXY vox terrain exact vert position depends how regular grid modified to match up with implicit surface
//so don't bother with exact min, just use approx vals
	//voxTerrain:{divs:1,step:2*Math.PI}
		voxTerrain2:{divs:2,step:Math.PI,minXY:[0,-0.5]},
		voxTerrain3:{divs:2,step:Math.PI,minXY:[0,-0.5]}
	}

	Object.keys(inputData).forEach( kk => initialiseDuocylinderObjectData(inputData[kk]));
	return inputData;
})();

var sphereBuffers={};
var sphereBuffersHiRes={};
var quadBuffers={};
var quadBuffers2D={};
var cubeBuffers={};
var smoothCubeBuffers={};
var randBoxBuffers={};
var explodingCubeBuffers={};
var cubeFrameBuffers={};
var cubeFrameBvh={}
var cubeFrameSubdivBuffers={};
var octoFrameBuffers={};
var octoFrameSubdivBuffers={};
var octoFrameBvh={};	
var tetraFrameBuffers={};
var tetraFrameSubdivBuffers={};		
var tetraFrameBvh={};
var dodecaFrameBuffers={};
var dodecaFrameBuffers2={};	//without outer faces cut off
var dodecaFrameBvh2={};

var teapotScale = 0.4;
var teapotBuffers={};
var teapotBvh={};

var pillarBuffers={};
var pillarBvh={}
var sshipBuffers={};
var gunBuffers={};
var gunBvh={};
var su57Buffers={};
var chullBuffers={};
var playerConvexHullObjectsForWorldSizes={};
var frigateBuffers={};
var frigateBvh={};
var icoballBuffers={};
var meshSphereBuffers={};
var buildingBuffers={};
var buildingBvh={};
var lucyBuffers={};
var lucyBvh={};
var mushroomBuffers={};
var mushroomBvh={};
var octoFractalBuffers={};
var octoFractalBvh={};
var bridgeBuffers={};
var bridgeBvh={}
var thrusterBuffers={};
var thrusterBuffers2={};

var polytopeBvhObjs={};
var dodecaScale=0.515;	//guess TODO use right value (0.5 is too small)
var eightCellScale=0.9;	//1 for full tesseletion, but adding some gap makes more obvious what cells are
var sixteenCellScale= 4/Math.sqrt(6);	//in the model, vertices are 0.75*sqrt(2) from the centre, and want to scale to tan(PI/3)=sqrt(3)	
var sixhundredCellScale = 0.386;	//todo use correct scale

//var sshipModelScale=0.0001;
var sshipModelScale=0.00002;
var duocylinderSurfaceBoxScale = 0.025;

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
	
	//load duocylinder after loading obj file.
	//TODO make more similar to other object load/cb
	//loadDuocylinderObjAndDoStuff(loadBuffersFromObj5File, "./data/miscobjs/more-greebles-pack-pick1-2d.obj5",
	loadDuocylinderObjAndDoStuff(loadBuffersFromObj5File, "./data/miscobjs/more-greebles-pack-plane13.obj5",
		duocylinderObjects.greebleTerrain);
	function loadDuocylinderObjAndDoStuff(objLoader, objFile, terrainObj){
		objLoader(terrainObj, objFile, (terrainObj, sourceData) => {
			sourceData.faces = arrayToGroups(sourceData.indices, 3);	//augment sourceData with faces object that loadGridData expects
			loadGridData(sourceData, true, -0.18);
			
			loadDuocylinderBufferData(terrainObj, sourceData);
			terrainObj.data = sourceData.collisionTriangleData;

			//update all object info. TODO change to reference a single object that will be updated later.
			terrainObj.objInfoArr.forEach(objInfo=>objInfo.collisionTriangleData = terrainObj.data);
		}, 6);
	}

	Object.keys(voxTerrainData).forEach(x=>{
		loadGridData(voxTerrainData[x]);	//TODO don't do this... - different shader like sea - either don't precalc 4-vec mapping, or store 3vec co-ords 
		loadDuocylinderBufferData(duocylinderObjects[x], voxTerrainData[x]);
	});
	
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
		bufferObj.isLoaded=true;
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
	createBvhFrom3dObjectData(tetraFrameSubdivObject, tetraFrameBvh);
	createBvhFrom3dObjectData(octoFrameSubdivObject, octoFrameBvh);	//suspect subdiv efficient with bvh
	createBvhFrom3dObjectData(dodecaFrameBlenderObject2, dodecaFrameBvh2);
	
	loadBufferData(icoballBuffers, icoballObj);
	
	loadBuffersFromObj2Or3File(pillarBuffers, "./data/pillar/pillar.obj2", (bufferObj, sourceData) =>{
		loadBufferData(bufferObj, sourceData);
		createBvhFrom3dObjectData(sourceData, pillarBvh);
	});
	loadBuffersFromObj2Or3File(sshipBuffers, "./data/spaceship/sship-pointyc-tidy1-uv3-2020b-cockpit1b-yz-2020-10-04.obj2", loadBufferData);

	var gunWorldData = someObjectMatrices.map(xx=> {
		return {mat: xx.mat, transposedMat: xx.transposedMat, world:3}});
	loadObjThenAddBvhToLevels(loadBuffersFromObj2Or3File, "./data/cannon/cannon-pointz-yz.obj2",
		gunBuffers, gunBvh, 0.1, gunWorldData, 3);

	loadBuffersFromObj2Or3File(su57Buffers, "./data/miscobjs/t50/su57yz-4a.obj2", loadBufferData);
	loadBuffersFromObj2Or3File(chullBuffers, "./data/miscobjs/wedge-ship2a-texmapped_2.obj3", loadBufferData);

	loadConvexHullDataFromObjFile(playerConvexHullObjectsForWorldSizes, 0.0005, "./data/miscobjs/wedge-ship2a-simple_2.obj");

	var frigateWorldData = someObjectMatrices.slice(4,8).map(xx=> {
		return {mat: xx.mat, transposedMat: xx.transposedMat, world:2}});
	loadObjThenAddBvhToLevels(loadBuffersFromObj2Or3File, "./data/frigate/frigate.obj2", 
		frigateBuffers, frigateBvh, 0.003, frigateWorldData, 3);

	loadBuffersFromObjFile(meshSphereBuffers, "./data/miscobjs/mesh-sphere.obj", loadBufferData);
	
	loadObjThenAddBvhToLevels(loadBuffersFromObj5File, "./data/miscobjs/menger-texmap2.obj5",
		buildingBuffers, buildingBvh, 0.1, [{mat:buildingMatrix, transposedMat: makeTransposedMat(buildingMatrix), world:2}],6);
	
	var lucyWorldData = someObjectMatrices.slice(0,1).map(xx=> {
		return {mat: xx.mat, transposedMat: xx.transposedMat, world:0}});
	loadObjThenAddBvhToLevels(loadBuffersFromObj5File, "./data/miscobjs/lucy-withvertcolor.obj5",
		lucyBuffers, lucyBvh, 0.0016, lucyWorldData,6);
	
	var mushroomWorldData = someObjectMatrices.slice(4).map(xx=> {
		return {mat: xx.mat, transposedMat: xx.transposedMat, world:0}});
	loadObjThenAddBvhToLevels(loadBuffersFromObj5File, "./data/miscobjs/Pleurotus_eryngii-2-in-a-new-blend-file.obj5",
		mushroomBuffers, mushroomBvh, 0.025, mushroomWorldData,6);

	loadObjThenAddBvhToLevels(loadBuffersFromObj2Or3File, "./data/miscobjs/fractal-octahedron4.obj3",
		octoFractalBuffers, octoFractalBvh, 0.2, [{mat:octoFractalMatrix, transposedMat: makeTransposedMat(octoFractalMatrix), world:2}],6);

	//TODO world size dependence
	function loadObjThenAddBvhToLevels(objLoader, objFile, objBuffers, objBvh, scale, worldAndMatArr, vertAttrs){
		objLoader(objBuffers, objFile, (bufferObj, sourceData) => {
			loadBufferData(bufferObj, sourceData);
			createBvhFrom3dObjectData(sourceData, objBvh, vertAttrs);
			addManyObjectsToWorlds(worldAndMatArr, bufferObj, objBvh, scale);
		}, vertAttrs);
	}

	loadBuffersFromObj2Or3File(bridgeBuffers, "./data/miscobjs/bridgexmy2.obj3", (bufferObj, sourceData) => {
		loadBufferData(bufferObj, sourceData);
		createBvhFrom3dObjectData(sourceData, bridgeBvh, 6);
	}, 6);

	loadBuffersFromObj2Or3File(thrusterBuffers, "./data/miscobjs/thrusters-with-normals-and-vcolor.obj3", loadBufferData, 6);
	loadBuffersFromObj2Or3File(thrusterBuffers2, "./data/miscobjs/thrusters-with-normals-and-vcolor2.obj3", loadBufferData, 6);

	//now bvhs ready, create the following which references them.

	addManyObjectsToWorld2(0, someObjectMatrices.slice(1,4), teapotBuffers, teapotBvh, teapotScale);
	//addManyObjectsToWorld2(2, someObjectMatrices, dodecaFrameBuffers2, dodecaFrameBvh2, 0.2);

	//TODO array for each object type? include direct reference to rendering info (instead of matching bvh later)

	addManyObjectsToWorld(4, cellMatData.d8, cubeBuffers, cubeFrameBvh, eightCellScale);
	addManyObjectsToWorld(5, cellMatData.d16, tetraFrameSubdivBuffers, tetraFrameBvh, sixteenCellScale);
	addManyObjectsToWorld(6, cellMatData.d24.cells, octoFrameSubdivBuffers, octoFrameBvh, 1);
	addManyObjectsToWorld(7, cellMatData.d5, tetraFrameSubdivBuffers, tetraFrameBvh, 2*Math.acos(-0.25));
	addManyObjectsToWorld(8, cellMatData.d120[0], dodecaFrameBuffers, dodecaFrameBvh2, dodecaScale);
	addManyObjectsToWorld(9, cellMatData.d600[0], tetraFrameSubdivBuffers, tetraFrameBvh, sixhundredCellScale);

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
	
	var singleObjectDataArr = [{
		mat:mat4.identity(),
		transposedMat:mat4.identity()
	}];

	//console.log("randBoxData:");
	//console.log(randBoxData);
	loadDuocylinderBufferData(randBoxBuffers, randBoxData);	//TODO rename func so not specific to duocylinder - generally is for 4vec vertex data.
	randBoxBuffers.divs=1;	//because reusing duocylinder drawing function
	randBoxBuffers.step=0;	//unused
	randBoxBuffers.objInfoArr = singleObjectDataArr;
	
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

//THIS BIT RELEVANT TO WORLD SCALE. - TODO document calculation, meaning of these variables. guess this just initialises to legit default, calculate real vals later.
var reflectorInfoArr=[];
for (var ii=0;ii<4;ii++){	//TODO how to cope with variable portal numbers? just assign max? (fixed number supported by shader)
	reflectorInfoArr.push({
		centreTanAngleVectorScaled:[0,0,0],
		rad:0.5
	});
}

function calcReflectionInfoOld(toReflect,resultsObj, reflectorRad){
	// 2026 - forget how this all works, but want to calculate reflection info for variable size worlds.
	// reflectorRad IIRC is portal radius before projection - ie angle from centre of portal to its surface is 
	// atan(reflectorRad). For a portal between worlds of different sizes, the reflectorRad value is different for each portal side.
	// TODO determine how this logic works, how to adapt for portal between different world sizes.

	//things that are output (saved to resultsObj):
	// polarity - easy - no need to change
	// centreTanAngleVectorScaled - ??
	// shaderMatrix - ?? 
	// cubeViewShiftAdjusted - ??
	// cubeViewShiftAdjustedMinus - ??
	// shaderMatrix2 - ??

	//IIRC this is like a flat space (approximate) sphere reflection.
	// for protal at w=1, project point xyzw onto w=1. (xyz/w , 1)
	// great circles are straight lines.
	// can do this for each world and scale for unit projected portal rad.
	// TODO does this make sense? does this existing calculation for world size 1 make sense? 
	// could be assumption about flat space projection not good because isn't angle preserving. could calc below just be a bodge
	// that works about right for small angles only?

	// maybe way to consider this is that angular size of surface of portal relative to point to reflect is equal
	// to angular size from refected point (in the portal).
	 // NO! - point wont even stay in the portal! 
	 // TODO
	 // 1) what is calculation of "reflected point" in flat space?
	 // 2) how was this extended to curved space here? 
	 // 3) does that make sense? 
	 // 4) if not, apply correction, what is qualatative difference (test it)
	 // 5) apply to variable size worlds


	//below,
	//toReflect is position of player in frame where portal is centred at [0,0,0,1]
	// so position of player projected on plane w=1 from origin [0,0,0,0] is [toReflect.xyz/toReflect.z , 1].
	// angle from [0,0,0,1] to toReflect is acos(toReflect.w).
	// distance from [0,0,0,1] to projected point is mag(toReflect.xyz/toReflect.z) = tan(angle)
	// consider this projected space (w=1) like flat space. use
	// y = x/(2x-1) to reflect point in unit sphere (TODO document elsewhere)
	// tan(angle) is projected point. divide by portal rad (projected)
	// = tan(angle) / portalRad)
	// then plug this into equation as x
	// y = tan(angle) / portalRad) 
	//     ------------------------------
	//    2* (tan(angle) / portalRad) ) - 1
	//
	// divide top and bottom by ( tan(angle) / portalRad)
	//
	// y = 1/ ( 2 -  portalRad/tan(angle) )
	// 
	// this is in projected space with unit portal. scale by portal rad to get projected point y*portalRad = 
	//
	// portalRad/ ( 2 -  portalRad/tan(angle) )
	//
	// correctionFactor below takes cubeViewShift, divides by its length (to get a unit vector) and multiplies by magnitude of angle, to get a vector
	// of length angle, in same direction as cubeViewShift. This resulting vector is cubeViewShiftAdjusted.
	// ....
	// how to modify all this to work in 


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


function recalcAllReflectors(camWorld){
	portalsForWorld[camWorld].forEach((portal, ii)=>{
		mat4.set(invertedWorldCamera, portalInCameraCopy);
		//portalInCamera is calculated in different scope (in drawWorldScene)
		//TODO reorganise/tidy code, reduce duplication
		mat4.multiply(portalInCameraCopy, portal.matrix); //TODO is offsetCameraContainer.world updated yet?
																				//if not may see 1 frame glitch on crossing
		mat4.transpose(portalInCameraCopy);	//TODO lose this, use indices 3,7,11 instead of 12,13,14 in calcReflectionInfo?

		calcReflectionInfoNew(portalInCameraCopy,reflectorInfoArr[ii], portal.shared.trueRadius, portal.worldSize, portal.otherps.worldSize);
reflectorInfoArr[ii].portal = portal;

		var portalRelativeRad = portal.radius/portal.worldSize;
		reflectorInfoArr[ii].rad = guiParams.reflector.draw!="none" ? portalRelativeRad : 0;
	});
}


function calcReflectionInfo(toReflect,resultsObj, reflectorRad){

	var worldSizeViewFrom = 1;
	var worldSizeViewTo = 1;

	//if portal angular radius is theta, projected portal radius (reflectorRad) world world size 1 is tan(theta),
	// "true" portal size is sin(theta). can calc this without trig, but do with for clarity (will later just store true portal rad...
 	var trueReflectorRad = Math.sin(Math.atan(reflectorRad));

	calcReflectionInfoNew(toReflect, resultsObj, trueReflectorRad, worldSizeViewFrom, worldSizeViewTo);
}



function calcReflectionInfoNew(toReflect,resultsObj, trueReflectorRad, worldSizeViewFrom, worldSizeViewTo){

	//TODO write this up, simplify calculation. precalculate?

	if (!guiParams.reflector.isPortal){
		worldSizeViewTo = worldSizeViewFrom;
	}

	//use player position directly. expect to behave like transparent
	var cubeViewShift = [toReflect[12],toReflect[13],toReflect[14]];	
	var magsq = 1- toReflect[15]*toReflect[15];
		//note can just fo 1-w*w, or just use w!
	

	var angle = Math.acos(toReflect[15]);	//from centre of portal to player

	var tanAngle = Math.tan(angle);	//of point to be reflected.

	var angleOfFromPortalBoundary = Math.asin(trueReflectorRad/ worldSizeViewFrom);
	var cosineForFromPortalBoundary = Math.cos(angleOfFromPortalBoundary);

	var angleOfToPortalBoundary = Math.asin(trueReflectorRad, worldSizeViewTo);
	var cosineForToPortalBoundary = Math.cos(angleOfToPortalBoundary);


	var posOnIntermediatePlane = tanAngle * worldSizeViewFrom * cosineForFromPortalBoundary;
	var posOnIntermediatePlaneForPortalSizeOne = posOnIntermediatePlane/trueReflectorRad;

	var reflectedPosOnIntermediatePlaneForPortalSizeOne = posOnIntermediatePlaneForPortalSizeOne / (2 * posOnIntermediatePlaneForPortalSizeOne - 1);
	var reflectedPosOnIntermediatePlane = reflectedPosOnIntermediatePlaneForPortalSizeOne*trueReflectorRad;
	var reflectedPosTanAngleForToWorld = reflectedPosOnIntermediatePlane/(worldSizeViewTo*cosineForToPortalBoundary);
	var reflectedPosTanAngleForFromWorld = reflectedPosOnIntermediatePlane/(worldSizeViewFrom*cosineForFromPortalBoundary);


	var mag = Math.sqrt(magsq);	//FWIW guess this is sin angle! 
	
	var polarity = guiParams.reflector.isPortal? -1:1;
	
	var correctionFactor = -polarity * Math.asin(reflectedPosOnIntermediatePlane/worldSizeViewTo)/mag;
	var cubeViewShiftAdjusted = cubeViewShift.map(function(val){return val*correctionFactor});

	//cubeViewShiftAdjustedMinus used for older portal drawing methods eg vertex projection.
	var correctionFactor2 = Math.asin(reflectedPosOnIntermediatePlane/worldSizeViewFrom)/mag;
	var cubeViewShiftAdjustedMinus = cubeViewShift.map(function(val){return val*correctionFactor2});

	resultsObj.polarity=polarity;	//??
	
	//position within spherical reflector BEFORE projection
	//IIRC this relates to "From" portal

	var correctionFactorB = reflectedPosOnIntermediatePlaneForPortalSizeOne/mag;

	//divide by portal size (projected) ? 
	//correctionFactorB/= trueReflectorRad / (worldSizeViewFrom*cosineForFromPortalBoundary);


	resultsObj.centreTanAngleVectorScaled = cubeViewShift.map(val => -val*correctionFactorB);

	var reflectShaderMatrix = mat4.identity();
	xyzmove4mat(reflectShaderMatrix, cubeViewShiftAdjustedMinus);	
	resultsObj.shaderMatrix=reflectShaderMatrix;
	
	resultsObj.cubeViewShiftAdjusted = cubeViewShiftAdjusted;
	//resultsObj.cubeViewShiftAdjustedMinus = cubeViewShiftAdjustedMinus;	//for debugging
	
	//only used for droplightpos2, and only different from shaderMatrix if reflector (rather than portal) (inefficient!)
	var reflectShaderMatrix2 = mat4.create();
	mat4.identity(reflectShaderMatrix2);
	xyzmove4mat(reflectShaderMatrix2, cubeViewShiftAdjusted);
	resultsObj.shaderMatrix2=reflectShaderMatrix2;
}




var gunHeat = 0;

var lastSeaTime=0;
function drawScene(frameTime){
	flickerFlag = !flickerFlag;
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

	if (guiParams.map.show == "only map"){
		drawMapScene(frameTime, gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
	}else if (guiParams.map.show == "overlaid"){
		drawRegularScene(frameTime);
		drawMapScene(frameTime, gl.DEPTH_BUFFER_BIT);
	}else{
		drawRegularScene(frameTime);
	}
	//TODO button press to show/hide map
	//TODO pause gameplay when show map?
}

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
		
		//TODO is camera interpolation combined with matrix movement a problem?
		var cameraToMoveVec = offsetCam.getSmoothedWithCamCollision(offsetCameraContainer);
		moveMatHandlingPortal(offsetCameraContainer, cameraToMoveVec);

		//note this may be small angle approximation/incorrect because expect magenta marker to be in middle of screen after tilt, and it isn't.
		//TODO don't just rotate camera where it is - rotate spring boom camera about starting point (otherwise swinging camera from side to side looks wierd)
		xyzrotate4mat(offsetCameraContainer.matrix, cameraTilt);
	}
	
	if (guiParams.display.cameraAttachedTo == "turret"){
		turret.setCameraToTurret(offsetPlayerCamera);
		offsetCam.setType();
		moveMatHandlingPortal(offsetCameraContainer, offsetCam.getVec());
	}

	if (guiParams.display.cameraAttachedTo == "none"){
		dropCamera.setCameraToDropCamera(offsetCameraContainer);
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

		recalcAllReflectors(offsetCameraContainer.world);

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
	
	//it's not enough to call this outside...
	recalcAllReflectors(offsetCameraContainer.world);

	//setup for drawing to screen
	//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//gl.viewport(viewP.left, viewP.top, viewP.width, viewP.height);
	mat4.set(projMatrix, pMatrix);
														
	frustumCull = guiParams.display.quadView? 
		quadviewFrustumCull:
		nonCmapCullFunc;	//TODO proper culling func for quad view. for now just draw everything

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
			
			window.fsq = Math.pow(guiParams.display.fFudge,2);	//use to manually line up test points. TODO automate

			//FOV presented is different for quad view and regularFisheye2! (TODO make same)
			//educated guess, seems about right...
			if (guiParams.display.quadView || guiParams.display.regularFisheye2){
				window.fsq = uF[1]*uF[1];
				//NOTE This appears not quite right after updating fisheye mapping to work properly with HUD, map circles to ellipses 2025-07-27
				// but is near enough with current default FOV, uVarOne
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
		
		var playerWorldSettings = guiSettingsForWorld[playerContainer.world];
		var playerWorldSize = playerWorldSettings.worldSize
		var playerWorldSizeMetres = unitWorldRadiusMetres*playerWorldSize;
		
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

		var standardDecalScale = [0.002,0.002,0];
		var smallerDecalScale = standardDecalScale.map(x=>x*0.66);

		//direction of flight
		bind2dTextureIfRequired(hudTexturePlus);		//todo texture atlas for all hud
		
		var {airSpdVec, airSpdSq, airSpeedKmh, trueSpeedKmh, measuredAccelerationGees} = playerInfoForDisplay.getInfo();

		//show a mark intermediate between flight dir and forward pointing dir. TODO tilt camera in this direction.
		//want to avoid snapping from side to side when switch from backwards-left to backwards0right travel etc.
		//simpleish solution something like stereographic direction. put a point on circle in flight direction, centre circle 1 unit ahead, make radius 
		// of circle tend to 1 for high speed.
		//TODO remove this code if don't to show mark - it is also used elsewhere =====================================
		var tiltCameraCircleRad = airSpdSq / (0.1+airSpdSq);	//something that goes 1 1 as airSpdSq=>inf. other number is some speed approx below which circle small
		var airSpd = Math.sqrt(airSpdSq);
		var tiltCameraDirection = airSpdVec.map(xx=>tiltCameraCircleRad*xx/airSpd);
		tiltCameraDirection[2]+=1;	//z coord
		//drawTargetDecal(standardDecalScale, colorArrs.magenta, adjustedDirectionForFisheye(tiltCameraDirection.map(x=>-x), cameraTilt));
		//=============================================================================================================

		if (guiParams.hud.flightDirection){
			if (airSpdSq > 0.001){	//only draw above some threshold speed, to avoid rapid movement across screen, jiggling when landed (poor collision system)
				var reversed = airSpdVec.map(x=>-x);
				drawTargetDecal(standardDecalScale, colorArrs.hudFlightDir, adjustedDirectionForFisheye(reversed, cameraTilt));
			}
		}


		bind2dTextureIfRequired(hudTexture);	
		
		//drawTargetDecal(0.004, [1.0, 1.0, 0.0, 0.5], [0,0,0.01]);	//camera near plane. todo render with transparency
		if (guiParams["targeting"]!="off"){
			var shiftAmount = 1/muzzleVel;	//shift according to player velocity. 0.1 could be 1, but 
			var scalescalar = 0.0025/(1+shiftAmount*playerVelVec[2]);
			//TODO correct this for fisheye
			// (size of outer ring actually means something. draw centre and outer ring separately?)
			drawTargetDecal([scalescalar,scalescalar,0], colorArrs.hudYellow, adjustedDirectionForFisheye(
				[shiftAmount*playerVelVec[0],shiftAmount*playerVelVec[1],1+shiftAmount*playerVelVec[2]].map(x=>-x), cameraTilt));	//TODO vector add!
			
			if (guiParams.target.type!="none" && gunTargetWorldFrame && gunTargetWorldFrame[2]<0){	//if in front of player){
				bind2dTextureIfRequired(hudTextureBox);				
				drawTargetDecal(standardDecalScale, colorArrs.magenta, adjustedDirectionForFisheye(gunTargetWorldFrame, cameraTilt));	//direction to target (shows where target is on screen)
									//TODO put where is on screen, not direction from spaceship (obvious difference in 3rd person)
				//bind2dTextureIfRequired(hudTextureSmallCircles);	
				//drawTargetDecal(0.0008, [1, 0.1, 1, 0.5], selectedTargeting);	//where should shoot in order to hit target (accounting for player velocity)
					//not required if using shifted gun direction circle
			
				//drawTargetDecal(0.0006, [1, 1, 1, 1], targetingResultOne);
				//drawTargetDecal(0.0006, [0, 0, 0, 1], targetingResultTwo);
			}
		}
		
		//show where guns will shoot
		bind2dTextureIfRequired(hudTextureX);
		if (guiParams.hud.fireDirection){
			if (gunFireDirectionVec[2] > 0.1){	//??
				var fireDirectionVecAdjusted = gunFireDirectionVec.map((val, idx) => val-scaledSpinVelPlayerCoords[idx]);
				var reversed = fireDirectionVecAdjusted.map(x=>-x);	//needs to do this for fisheye correction to work consistent with other hud icons
				drawTargetDecal(smallerDecalScale, colorArrs.hudYellow, adjustedDirectionForFisheye(reversed, cameraTilt), 0.1);	//todo check whether this colour already set
				drawTargetDecal(smallerDecalScale, colorArrs.hudYellow, adjustedDirectionForFisheye(reversed, cameraTilt), -0.1);
			}
		}

		function adjustedDirectionForFisheye(inPos, cameraTilt){

			cameraTilt = cameraTilt || [0,0,0];

			//apply cameraTilt. rotate about cameraTilt axis
			inPos = rotateVecByAxisAngleVec(inPos, cameraTilt);
			
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
			// this f represents a direction would like to map to corner of screen

			
			//root(fsq) is opp, 1 is adj. hyp is root(fsq+1)
			//stretch such that hyp is 1. 
			//adj = 1/root(fsq+1)
			//normalised to hyp=1 because result (adj,opp) is a unit vector representing the direction normalize(1,f) that want to map to 
			// corner of screen
			// adj/(adj-sphereShift) is AFAIK because want this point (with specified f val) to retain its position on screen.

			//then multiply pos by adj/(-shift+adj)
			var adj = 1/Math.sqrt(1+window.fsq);
			outPos[2] = outPos[2]*adj/(adj-sphereShift);

			return outPos;
		}

		function screenPosForMatrix(mat){
			return screenPosAndDistanceForMatrix(mat).screenPos;	//wasteful but unimportant.
		}

		function screenPosAndDistanceForMatrix(mat){
			var relativeMat = mat4.create(invertedWorldCamera);
			mat4.multiply(relativeMat, mat);
			var pos = relativeMat.slice(12,15);	//12,13,14
			return {
				angularDistance: Math.atan2(Math.hypot.apply(null,pos), relativeMat[15]),
				screenPos: adjustedDirectionForFisheye(pos)
			}
		}

		//draw something to show each portal.
		var portalTexts = [];
			//note using offsetCameraContainer for this, but use playerContainer to display current world.
		for (var portal of portalsForWorld[offsetCameraContainer.world]){
			pos = screenPosForMatrix(portal.matrix);
			if (pos[2]<0){	//note unintuitive sign
				portalTexts.push({pos, text: "world "+portal.otherps.world});
			}
		}

		if (guiParams.hud.portalMarkers){
			portalTexts.forEach(pt=>{
				drawTargetDecal(standardDecalScale, colorArrs.white, pt.pos, -0.35);
				drawTargetDecal(standardDecalScale, colorArrs.white, pt.pos, 0.35);
			});
		}

		if (guiParams.hud.test){
			//draw point to side
			drawTargetDecal(standardDecalScale, colorArrs.red, adjustedDirectionForFisheye([1,0,0]), 0);
			drawTargetDecal(standardDecalScale, colorArrs.red, adjustedDirectionForFisheye([-1,0,0]), 0);
			drawTargetDecal(standardDecalScale, colorArrs.red, adjustedDirectionForFisheye([0,1,0]), 0);
			drawTargetDecal(standardDecalScale, colorArrs.red, adjustedDirectionForFisheye([0,-1,0]), 0);
			//15 deg increments to left
			for (var angl=0;angl<=120;angl+=15){
				var rads = Math.PI*angl/180;
				var cosa = Math.cos(rads);
				var sina = Math.sin(rads);
				drawTargetDecal(standardDecalScale, colorArrs.orange, adjustedDirectionForFisheye([-sina,0,-cosa]), 0);
			}
			//diagonal?
			drawTargetDecal(standardDecalScale, colorArrs.green, adjustedDirectionForFisheye([1,0,-1]), 0);
			drawTargetDecal(standardDecalScale, colorArrs.green, adjustedDirectionForFisheye([-1,0,-1]), 0);
			drawTargetDecal(standardDecalScale, colorArrs.green, adjustedDirectionForFisheye([0,1,-1]), 0);
			drawTargetDecal(standardDecalScale, colorArrs.green, adjustedDirectionForFisheye([0,-1,-1]), 0);
		}

		var bombHudSpin = (frameTime/300) % Math.PI;
		var halfDecalScale = standardDecalScale.map(xx=>xx/2);

		if (guiParams.hud.bombMarkers){
			bullets.forEach(bb=> {
				if (bb.active && bb.isBig && bb.marker && bb.world == playerContainer.world){
				var pos = screenPosForMatrix(bb.matrix);
				if (pos[2]<0){	//note unintuitive sign
					drawTargetDecal(halfDecalScale, colorArrs.magenta, pos, bombHudSpin);
					drawTargetDecal(halfDecalScale, colorArrs.magenta, pos, -bombHudSpin);
				}
			}});
		}

		//drawing of text
		//TODO efficient - currently many draw calls. could instance render, or create a mesh of multiple quads
		var activeShaderProgram = shaderPrograms.decalSdf;
		gl.useProgram(activeShaderProgram);
		prepBuffersForDrawing(quadBuffers, activeShaderProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		bind2dTextureIfRequired(fontTexture);

		drawText("SPECIAL WEAPON: " + specialWeapsData[selectedSpecialWeapId].name, -1, 2, 1, 0.4, colorArrs.red);

		//number targets
		for (var tt=0;tt<targets.length;tt++){
			var target = targets[tt];
			if (target.hitPoints<1){continue;}
			var posAndDistance = screenPosAndDistanceForMatrix(target.matrix);
			var pos = posAndDistance.screenPos;
			var distanceMetres = posAndDistance.angularDistance * playerWorldSizeMetres;
			if (pos[2]<0){
				drawText("T"+tt+" ("+target.hitPoints+")", pos[0], pos[1], pos[2], 0.25);
				drawText(""+distanceMetres.toFixed()+"M", pos[0], pos[1]-0.05, pos[2], 0.15);	//why subtract for lower on screen? is pos[2] -ve???
					//NOTE this is distance from camera, not player model.
			}
		}

		drawText("TRUE SPEED: " + trueSpeedKmh.toFixed(0) + " KPH", 3, 1.6, 1, 0.3);
		drawText("AIRSPEED: " + airSpeedKmh.toFixed(0) + " KPH", 3, 1.7, 1, 0.3);
		drawText("ACCN: " + measuredAccelerationGees.toFixed(1).padStart(5) + " G", 3, 1.8, 1, 0.3);

		if (guiParams.hud.textWorldNum){

			//drawText("World " + playerContainer.world, 0.6, 0.15, 1); //(below) centre of screen, suitable if flash up on cross portal
			drawText("CURRENT WORLD: " + playerContainer.world, 3, 2, 1, 0.4); //bottom left. note scales with FOV!
			drawText("RADIUS: " + playerWorldSizeMetres + " M", 3, 2.1, 1, 0.2); //bottom left. note scales with FOV!

			//calculate expected spin gravity gees. world radius * (angular velocity) squared /2
			var spinRateRadsPerSec =  playerWorldSettings.spinRate * 1000* mechanicsMoveSpeed;
			var spinGravPeriodSeconds = Math.PI * 2 / spinRateRadsPerSec;
			var spinGravityMetresPerSecPerSec = playerWorldSizeMetres* spinRateRadsPerSec*spinRateRadsPerSec / 2;	//TODO write up/justify factor 2 division in notes
			var spinGravityGees = spinGravityMetresPerSecPerSec/9.81;
			var edgeSpeedMetresPerSecond = playerWorldSizeMetres * spinRateRadsPerSec / Math.sqrt(2);	//speed of rotating duocylinder surface (at height where divides world in two)
			var edgeSpeedKmh = edgeSpeedMetresPerSecond * 3.6;

			drawText("PERIOD: " + spinGravPeriodSeconds.toFixed(0).padStart(5) + " S", 3, 2.15, 1, 0.2);
			drawText("SPIN GRAVITY: " + spinGravityGees.toFixed(2).padStart(5) + " G", 3, 2.2, 1, 0.2);
			drawText("EDGE SPEED: " + edgeSpeedKmh.toFixed(0).padStart(5) + " KPH", 3, 2.25, 1, 0.2);

			portalTexts.forEach(pp=>{
				drawText(pp.text, pp.pos[0], pp.pos[1], pp.pos[2], 0.4);
			});
		}

		if (guiParams.hud.bombText){
			bullets.forEach(bb=> {
				if (bb.active && bb.markerText && bb.world == playerContainer.world){
				var pos = screenPosForMatrix(bb.matrix);
				if (pos[2]<0){	//note unintuitive sign
					drawText(bb.markerText, pos[0], pos[1], pos[2], 0.4);
				}
			}});
		}

		if (guiParams.debug.showChullStats && guiParams["player model"] == "convexHullTest"){
			drawText(chullCollisionScreenInfo, 0.6, 0.15, 1, 0.6);
			drawText(chullCollisionScreenInfo2, 0.6, 0.4, 1, 0.6);
		}

		function drawText(text, x, y, z, size, color=colorArrs.white){
			if (!text_util.isLoaded){return;}

			x/=size*z;
			y/=size*z;
			z=1/size;

			text.toUpperCase().split('').forEach(ch => {
				var cInfo = text_util.charInfo[ch.charCodeAt(0)];
				
				drawTargetDecalCharacter(
					[0.01*size*cInfo.width/512, 0.01*size*cInfo.height/512, 0], color,
					[x - 2*cInfo.xoffset/512 - (cInfo.width/512),
					y + 2*cInfo.yoffset/512 + (cInfo.height/512), //note awkward passing in size since currently quads are drawn -1 to +1
					z],
					cInfo);
				x-=2* cInfo.xadvance/512;
			});
		}

		function drawTextObj(textObj){
			var {text, x, y, z, size}=textObj;
			drawText(text, x, y, z, size);
		}
		
		if (shouldShowControls){
			controlsTexts.forEach(ct=>{
				drawTextObj(ct);
			});
		}

		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);

		function drawTargetDecal(scale, color, pos, rotation=0, uvPosAndSize = [0,0,1,1], skipCulling=false){

			//discard if too far from centre of screen because calculation errors significant
			//TODO don't do this per character!
			// or fix HUD mapping
			var possq = pos.map(xx=>xx*xx);
			if (!(skipCulling || guiParams.debug.hudTest) && possq[2]*15 < possq[0]+possq[1]){
			//	return;
			}

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
				charInfo.width/512, charInfo.height/512], skipCulling = true);
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
	var worldSize = guiSettingsForWorld[playerContainer.world].worldSize;
	var modelScale = sshipModelScale / worldSize;
	var matrixForTargeting = matrix;
	
	var gunHoriz = 5*modelScale;
	var gunVert = 5*modelScale;
	var gunFront = 2*modelScale;
	
	//default (no targeting) - guns unrotated, point straight ahead.
	rotvec = [0,0,0];
	
	var selectedTargetResult = {matrix:null, solution:{score:Number.POSITIVE_INFINITY, fireDirectionVec:[0,0,1], rotvec:[0,0,0]}};
	gunTargetWorldFrame = null;

	if (guiParams.target.type!="none" && guiParams["targeting"]!="off"){
		
		for (var target of targets){
			if (target.hitPoints<1){continue;}
			var targetingSolution = getTargetingSolution(matrixForTargeting, target.matrix);

			if (targetingSolution.score < selectedTargetResult.solution.score){
				selectedTargetResult = {matrix:target.matrix, solution:targetingSolution};
			}
		}

		if (selectedTargetResult.matrix){
			rotvec = selectedTargetResult.solution.rotvec;
			selectedTargeting = selectedTargetResult.solution.selected;
			gunTargetWorldFrame = selectedTargetResult.solution.targetWorldFrame;
			gunFireDirectionVec = selectedTargetResult.solution.fireDirectionVec;
		}
	}
	
	var targetMatrix = selectedTargetResult.matrix;
	setGunMatrixRelativeToSpacehip(0, [gunHoriz,gunVert,gunFront], targetMatrix); //left, down, forwards
	setGunMatrixRelativeToSpacehip(1, [-gunHoriz,gunVert,gunFront], targetMatrix);
	setGunMatrixRelativeToSpacehip(2, [-gunHoriz,-gunVert,gunFront], targetMatrix);
	setGunMatrixRelativeToSpacehip(3, [gunHoriz,-gunVert,gunFront], targetMatrix);
	
	function setGunMatrixRelativeToSpacehip(gunnum, vec, targetMatrix){	//todo reuse matrices for gunMatrixCosmetic (fixed array) - not simple to use pool since pushing onto gunMatrices //todo precalc gunmatrices relative to spaceship?
		var gunMatrixCosmetic = gunMatrices[gunnum];
		mat4.set(matrix, gunMatrixCosmetic);
		xyzmove4mat(gunMatrixCosmetic,vec);
		
		var gunMatrix = matPool.create();
		mat4.set(matrixForTargeting, gunMatrix);
		xyzmove4mat(gunMatrix,vec);
		
		if (guiParams.target.type!="none" && guiParams["targeting"]=="individual" && targetMatrix){
			rotvec = getTargetingSolution(gunMatrix, targetMatrix).rotvec;
		}
		matPool.destroy(gunMatrix);
		
		//rotate guns to follow mouse
		xyzrotate4mat(gunMatrixCosmetic, rotvec);		
			
		xyzmove4mat(gunMatrixCosmetic,[0,0,25*modelScale]);	//move forwards
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
		var pmatrads = psides.map(x=>x.radius/x.worldSize);


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
				var portalRad = relevantPortalSide.radius / relevantPortalSide.worldSize;
				if (checkWithinRangeOfGivenPortal(sshipMatrix, Math.tan(portalRad +0.1), relevantPortalSide)){	//TODO correct this
					mat4.set(sshipMatrix, portaledMatrix);
					moveMatrixThruPortal(portaledMatrix, 1, relevantPortalSide);
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
	
	setUboValsFromWorldSettingsFast(wSettings);	//TODO pull out and set less frequently? (eg for all 4 panels in quadview)
	
	function setupAtmosAndPrepBuffersForDrawing(objBuffer, shaderProg){
		setupShaderAtmos(shaderProg, worldA);
		prepBuffersForDrawing(objBuffer, shaderProg);
	}
	function drawObjectFromBuffers2(bufferObj, shaderProg){
		setupShaderAtmos(shaderProg, worldA);
		drawObjectFromBuffers(bufferObj, shaderProg);
	}

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
		
		drawObjectFromBuffers2(explodingCubeBuffers, activeShaderProgram);	
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
			
			setupAtmosAndPrepBuffersForDrawing(cubeBuffers, activeShaderProgram);
			
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
			
			setupAtmosAndPrepBuffersForDrawing(cubeBuffers, activeShaderProgram);
			
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
			
			setupAtmosAndPrepBuffersForDrawing(objBufferForInstances, activeShaderProgram);


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
	

	//draw dust motes in cube
	if (guiParams.debug.drawDustMotes){
		activeShaderProgram = shaderPrograms.wrappedDustMotes;
		gl.useProgram(activeShaderProgram);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);

		var scale = dustMotesInfo.scale;
		scale/= guiSettingsForWorld[worldA].worldSize;

		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, scale,scale,scale);
		var instanceScale = dustMotesInfo.instanceScale;
		gl.uniform3f(activeShaderProgram.uniforms.uInstanceScale, instanceScale,instanceScale,instanceScale);

		gl.uniform3fv(activeShaderProgram.uniforms.uScroll, dustMotesInfo.accumulatedScroll);	//player velocity. Should look right when player not rotating.

		enableDisableAttributes(activeShaderProgram);
		//temporarily instance existing mesh. TODO dedicated mesh with 8-vert cube, cluter of cubes, octohedron or similar
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.vertexPositionBuffer);
		gl.vertexAttribPointer(activeShaderProgram.attributes.aVertexPosition, cubeBuffers.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeBuffers.vertexIndexBuffer);
		gl.uniformMatrix4fv(activeShaderProgram.uniforms.uPMatrix, false, pMatrix);
		
		// set aParticlePosPreOffset using dustMotesInfo.random3VecsBuf
		gl.vertexAttribDivisor(activeShaderProgram.attributes.aParticlePosPreOffset, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, dustMotesInfo.random3VecsBuf);
		gl.vertexAttribPointer(activeShaderProgram.attributes.aParticlePosPreOffset, 3, gl.FLOAT, false, 0,0);

		
		//draw at player position
		var matRelativeToPlayer = mat4.create(dustMotesInfo.transposedMatRelativeToPlayer)
		mat4.transpose(matRelativeToPlayer);
		sshipDrawMatrices.forEach(mm =>{
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, mm);
			mat4.multiply(mvMatrix, matRelativeToPlayer);
			gl.uniformMatrix4fv(activeShaderProgram.uniforms.uMVMatrix, false, mvMatrix);
			gl.drawElementsInstanced(gl.TRIANGLES, cubeBuffers.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0, dustMotesInfo.numInstances);
		});

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
	
	//switch to non-normal map version to draw some objects.
	activeShaderProgram=shaderProgramTexmap;
	shaderSetup(activeShaderProgram, texture);
	gl.uniform3f(activeShaderProgram.uniforms.uModelScale, duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale,duocylinderSurfaceBoxScale);
	setupAtmosAndPrepBuffersForDrawing(cubeBuffers, activeShaderProgram);
	
	//switch to non-normalmap shader
//	shaderSetup(shaderProgramTexmap, texture);
	
	var playerPos = playerCamera.slice(12);			//copied from elsewhere
		
	if (guiParams.debug.closestPoint){
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
	if (guiParams.debug.drawPlayerPosMarkers){
		debugDraw.drawPlayerPosMarkers();
	}
	if (guiParams.debug.drawExtraMarkers){
		debugDraw.drawExtraMarkers();
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
		
	
	//dust motes around player - note separate to previous "dust motes" code here.
	// use instanced drawing to render many small objects with position modded/wrapped to within the cube
	// uniforms that apply to all instances: 3d scroll of objects within the container, the matrices, scale for posing the container in camera.
	// uniforms for each instance - offset position within unscrolled container, particle colour?.
	// attributes for instanced object - vert position. normal? (normal maybe irrelevant - want small particles)
	
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.white);

	var worldSize = guiSettingsForWorld[worldA].worldSize;

	if (guiParams.debug.playerDustMotesFrames){
		//draw dust motes at player position in frame that moves with player but doesn't rotate
		var matRelativeToPlayer = mat4.create(dustMotesInfo.transposedMatRelativeToPlayer)
		mat4.transpose(matRelativeToPlayer);
		
		var scale = 0.0005 / worldSize;

		var dustMotesFramesToDraw = sshipDrawMatrices.map(mm =>{
			var mat = mat4.create(mm);
			mat4.multiply(mat, matRelativeToPlayer);
			return {mat, scale};
		});
		drawArrayOfModels2(dustMotesFramesToDraw, cubeFrameBuffers, activeShaderProgram, false);
	}

	//test objects to show scale
	drawArrayOfModels2(testObjectsData.forWorldSize(worldSize), cubeBuffers, activeShaderProgram, true);


	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.darkGray);
	[
		{bvh:cubeFrameBvh, buffers:cubeFrameBuffers},
		{bvh:dodecaFrameBvh2, buffers:dodecaFrameBuffers2},
		{bvh:tetraFrameBvh, buffers:tetraFrameBuffers},
		{bvh:octoFrameBvh, buffers:octoFrameSubdivBuffers}
	].forEach(objTypeInfo => {
		var objs = bvhObjsForWorld[worldA].objList.filter(objInfo=> objInfo.bvh == objTypeInfo.bvh)	//TODO prefilter
		if (objs.length>0){
			drawArrayOfModels2(objs, objTypeInfo.buffers, activeShaderProgram);
		}
	});
	
	//todo this should take buffers, shaders and call prepBuffersForDrawing, drawObjectFromPreppedBuffers
	function drawArrayOfModels(cellMats, cullRad, buffers, shaderProg){
		shaderProg = shaderProg || shaderProgramTexmap;
		setupAtmosAndPrepBuffersForDrawing(buffers, shaderProg);
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
	function drawArrayOfModels2(objDataArr, buffers, shaderProg, applyDuocylinderSpin=true){
		shaderProg = shaderProg || shaderProgramTexmap;
		setupAtmosAndPrepBuffersForDrawing(buffers, shaderProg);

		var lastScale=[null, null,null];

		drawArrayForFunc(function(){
			drawObjectFromPreppedBuffers(buffers, shaderProg);
			});

		function drawArrayForFunc(drawFunc2){
			for (dd in objDataArr){
				var thisObj = objDataArr[dd];

				var myscale = thisObj.scale;

				if (!Array.isArray(myscale)){
					myscale = [myscale,myscale,myscale];
				}

				if ( (lastScale[0]!=myscale[0]) || (lastScale[1]!=myscale[1]) || (lastScale[2]!=myscale[2])){
					gl.uniform3fv(activeShaderProgram.uniforms.uModelScale, myscale);
					lastScale=myscale;
				}

				mat4.set(invertedWorldCamera, mvMatrix);
				mat4.identity(mMatrix);
				if (applyDuocylinderSpin){
					rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
					rotate4mat(mMatrix, 0, 1, duocylinderSpin);
				}
				mat4.multiply(mvMatrix,thisObj.mat);
				mat4.multiply(mMatrix, thisObj.mat);	//not needed in all shaders
				drawFunc2();
			}
		}
	}
	
	
	turret.draw(duocylinderSpin, shaderSetup, drawObjectFromBuffers2);

	[
		{buffersToDraw:lucyBuffers, bvh:lucyBvh, shader:shaderPrograms.coloredPerPixelDiscardVertexColored[ guiParams.display.atmosShader ]}, 
		{buffersToDraw:mushroomBuffers, bvh:mushroomBvh, shader:shaderPrograms.coloredPerPixelDiscardVertexColored[ guiParams.display.atmosShader ]},
		{buffersToDraw:buildingBuffers, bvh:buildingBvh, shader:shaderPrograms.coloredPerPixelDiscardVertexColoredTexmap[ guiParams.display.atmosShader ], tex:texture},
		{buffersToDraw:octoFractalBuffers, bvh:octoFractalBvh, shader:shaderPrograms.coloredPerPixelDiscardVertexColored[ guiParams.display.atmosShader ]},
		{buffersToDraw:gunBuffers, bvh:gunBvh, shader:shaderProgramColored},
		{buffersToDraw:teapotBuffers, bvh:teapotBvh, shader:shaderProgramColored},
		{buffersToDraw:frigateBuffers, bvh:frigateBvh, shader:shaderProgramTexmap, tex:frigateTexture, color:colorArrs.veryDarkGray }
	].forEach(info => {
		var objs = bvhObjsForWorld[worldA].objList.filter(objInfo=> objInfo.bvh == info.bvh);	//TODO prefilter
		if (objs.length >0){
			var desiredProgram = info.shader;
			if (activeShaderProgram != desiredProgram){
				activeShaderProgram = desiredProgram;
				shaderSetup(activeShaderProgram);
			}
			uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", info.color?? colorArrs.darkGray);

			if (info.tex){
				bind2dTextureIfRequired(info.tex);
			}

			if (activeShaderProgram.uniforms.uEmitColor){
				gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);
			}

			//TODO include duocylinder spin?

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
		setupAtmosAndPrepBuffersForDrawing(bridgeBuffers, activeShaderProgram);

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
		setupAtmosAndPrepBuffersForDrawing(bridgeBuffers, activeShaderProgram);

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
	activeShaderProgram = guiParams.display.perPixelLighting? (guiParams.display.useSpecular ? shaderPrograms.texmap4VecPerPixelDiscardPhongVcolor[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscardVcolor[ guiParams.display.atmosShader ]): shaderPrograms.texmap4Vec[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "not normal map");

	var worldDrawingNow = wSettings.worldA;

	if (guiParams["random boxes"].drawType == 'singleBuffer'){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.randBoxes);
		drawTennisBall(randBoxBuffers, activeShaderProgram, worldDrawingNow, duocylinderSpin);	//todo draw subset of buffer according to ui controlled number
	}
	
	activeShaderProgram = guiParams.display.useSpecular ? shaderPrograms.texmap4VecPerPixelDiscardNormalmapPhongAndDiffuse[ guiParams.display.atmosShader ] : shaderPrograms.texmap4VecPerPixelDiscardNormalmapAndDiffuse[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "normal map");
	
	if (guiParams.drawShapes.singleBufferRoads){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.darkGray);
		drawTennisBall(roadBoxBuffers, activeShaderProgram, worldDrawingNow, duocylinderSpin);
	}
	/*
	activeShaderProgram = shaderPrograms.texmap4Vec[ guiParams.display.atmosShader ];
	gl.useProgram(activeShaderProgram);
	performCommon4vecShaderSetup(activeShaderProgram, wSettings, "log3");
	*/
	if (worldInfo.duocylinderModel!='none' && worldInfo.duocylinderModel!='l3dt-brute' && worldInfo.duocylinderModel!='l3dt-blockstrips'){
		drawDuocylinderObject(wSettings, duocylinderObjects[worldInfo.duocylinderModel], duocylinderSpin);
	}

	// special case for drawing terrain2. TODO fit into standard draw (above)

	mat4.set(invertedWorldCamera, mvMatrix);
	rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
	mat4.identity(mMatrix);							//better to set M, V matrices and leave MV for shader?
	rotate4mat(mMatrix, 0, 1, duocylinderSpin);

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
	//	drawDuocylinderObject(wSettings, duocylinderObjects['sea'], duocylinderSpin, guiParams.seaLevel, seaTime);
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

		drawObjectFromBuffers2(cubeBuffers, activeShaderProgram);
	}
	
	//draw objects without textures
	activeShaderProgram = shaderProgramColored;
	gl.useProgram(activeShaderProgram);
	
	if (activeShaderProgram.uniforms.uVertexMove){
		gl.uniform1f(activeShaderProgram.uniforms.uVertexMove, guiParams.normalMove);
	}
	
	gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emmision
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uFogColor", localVecFogColor);
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);
	
	bvhObjsForWorld[worldA].objList
		.filter(objInfo=> objInfo.bvh == pillarBvh)	//TODO prefilter
		.forEach(objInfo => {
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, objInfo.scale,objInfo.scale,objInfo.scale);
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,objInfo.mat);
			mat4.set(objInfo.mat, mMatrix);	
			drawObjectFromBuffers2(pillarBuffers, activeShaderProgram);
		});

	//NOTE this is inefficient but is just debug drawing (could make fast by instancing.)
	if (guiParams.debug.bvhBoundingSpheres){
		setupAtmosAndPrepBuffersForDrawing(sphereBuffersHiRes, activeShaderProgram);
		bvhObjsForWorld[worldA].objList.forEach(bvhObj => {
			var modelScale = bvhObj.scale * bvhObj.bvh.boundingSphereRadius;
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix, bvhObj.mat);
			mat4.set(bvhObj.mat, mMatrix);
			drawObjectFromPreppedBuffers(sphereBuffersHiRes, activeShaderProgram);
		});
	}
	
	if (guiParams.drawShapes.pillars && pillarBuffers.isLoaded){
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.darkGray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emission
		modelScale=0.1;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/4,modelScale/4,modelScale);

		setupAtmosAndPrepBuffersForDrawing(pillarBuffers, activeShaderProgram);
		for (var ii=0;ii<pillarMatrices.length;ii++){
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,pillarMatrices[ii]);
			mat4.set(pillarMatrices[ii], mMatrix);
			drawObjectFromBuffers2(pillarBuffers, activeShaderProgram);
		}
	}
	if (guiParams.drawShapes.bendyPillars && pillarBuffers.isLoaded){
		//use special shader that takes 2 mv matrices, blends between the two, weighting by vertex coordinate.
		// TODO fix coloured object shader (seems broken when halfway around world. fog? )

		activeShaderProgram = shaderProgramColoredBendy;

		//copy setup for coloured object shader. TODO deduplicate

		gl.useProgram(activeShaderProgram);
		
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uFogColor", localVecFogColor);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.veryDarkGray);
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);	//no emission
		modelScale=0.1;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/4,modelScale/4,modelScale);

		setupAtmosAndPrepBuffersForDrawing(pillarBuffers, activeShaderProgram);

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
		for (var target of targets){
			if (target.hitPoints<1){continue;}
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,target.matrix);
			switch (guiParams.target.type){
				case "sphere":
					if (frustumCull(mvMatrix,targetRad)){	//normally use +ve radius
												//-ve to make disappear when not entirely inside view frustum (for testing)
						gl.uniform3f(activeShaderProgram.uniforms.uModelScale, targetRad,targetRad,targetRad);
						uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.target);
						var emitColor = Math.sin(frameTime*0.01);
						//emitColor*=emitColor
						gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, emitColor, emitColor, emitColor/2);	//YELLOW
						drawObjectFromBuffers2(sphereBuffers, activeShaderProgram);
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
						drawObjectFromBuffers2(cubeBuffers, activeShaderProgram);
						activeShaderProgram = savedActiveProg;
						gl.useProgram(activeShaderProgram);
					}
					break;
			}
		}
	}

	if (guiParams.debug.hudTest){
		//draw a ring of boxes around player to help debug HUD (try to get hud points to match up with things on screen)
		var savedActiveProg = activeShaderProgram;	//todo push things onto a to draw list, minimise shader switching
		activeShaderProgram = shaderProgramTexmap;
		gl.useProgram(activeShaderProgram);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,worldCamera);
		var testSize = 0.0001;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, testSize,testSize,testSize);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colorArrs.darkGray);

		var fifteenDegs = Math.PI*15/180;
		xyzmove4mat(mvMatrix,[0,0,0.01]);
		for (var ii=0;ii<8;ii++){
			drawObjectFromBuffers2(cubeBuffers, activeShaderProgram);
			xyzmove4mat(mvMatrix,[0,0,-0.01]);
			xyzrotate4mat(mvMatrix,[0,fifteenDegs,0]);
			xyzmove4mat(mvMatrix,[0,0,0.01]);
		}
		activeShaderProgram = savedActiveProg;
		gl.useProgram(activeShaderProgram);
	}
	
	//draw bombs
	for (var b of bullets){
		if (b.active && b.isBig && b.world == worldA){
			drawBall(b.matrix, 0.02);	//TODO draw array
		}
	}

	var drawFunc = {
		"spaceship" : drawSpaceship,
		"plane": drawPlane,
		"convexHullTest": drawConvexHull,
		"ball": drawBall
	}[guiParams["player model"]];
	
	var shouldDrawPlayer = guiParams.debug.flickerPlayerDisplay? flickerFlag:true;

	if (shouldDrawPlayer){
		for (var mat of sshipDrawMatrices){
			drawFunc(mat);
		}
	}
	
	function drawSpaceship(matrix){
		if (sshipBuffers.isLoaded){
			drawPlayerGradlightObject(matrix, sshipBuffers, sshipTexture, sshipTexture2, sshipModelScale/wSettings.worldInfo.worldSize, 1,true, true);
			//TODO use object that doesn't require scaling
		}
	}

	function drawPlane(matrix){
		drawPlayerGradlightObject(matrix, su57Buffers, su57texture, su57texture2, 0.002/wSettings.worldInfo.worldSize, -1,false, true);
	}

	function drawConvexHull(matrix){
		//TODO appropriate shader
		drawPlayerGradlightObject(matrix, chullBuffers, wedgeShipTexture, wedgeShipTexture2, 0.0005/wSettings.worldInfo.worldSize, -1);
	}

	function drawPlayerGradlightObject(matrix, buffers, tex, tex2, modelScale, lightBodge, includeGuns, rotateBodge){

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
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, boxSize,boxSize,boxSize);
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);
		
		if (activeShaderProgram.uniforms.uOtherLightAmounts){
			gl.uniform4f(activeShaderProgram.uniforms.uOtherLightAmounts, 0, 100*(muzzleFlashAmounts[0]+muzzleFlashAmounts[1]), 20*(playerMechanics.currentThrustInput[2]>0 ? 1:0) , 0);
		}				//note muzzleFlashAmounts should be summed over all guns, just doing 2 because symmetric
		
		mat4.set(matrix, rotatedMatrix);	//because using rotated model data for sship model

		gl.uniform1f(activeShaderProgram.uniforms.uMaxAlbedo, rotateBodge ? 0.4: 0.7);	//wedge spaceship albedo 0.7 (light gray), others albedo 0.4 (dark gray)

		if (rotateBodge){	//do this for older objects. export new objects so don't need to.
			xyzrotate4mat(rotatedMatrix, [-Math.PI/2,0,0]);
		}
		
		gl.uniform3f(activeShaderProgram.uniforms.uEmitColor, 0,0,0);
		
		if (rotateBodge){
			//gl.uniform3f(activeShaderProgram.uniforms.uModelScale, 0.8*modelScale,modelScale,modelScale);
				// make spaceship narrower(squarer), length , height (bodge) - TODO scale spaceship properly


			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);

		}else{
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale,modelScale);
				//for new conv hull obj, width, height, length.
		}

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
			drawObjectFromBuffers2(buffers, activeShaderProgram);
		}
		
		//draw guns
		if (includeGuns && gunBuffers.isLoaded){
			mat4.set(invertedWorldCamera, mvMatrix);
			mat4.multiply(mvMatrix,matrix);
			mat4.set(matrix, mMatrix);
			
			var gunScale = 2.3*sshipModelScale;
			gl.uniform3f(activeShaderProgram.uniforms.uModelScale, gunScale,gunScale,gunScale);

			bind2dTextureIfRequired(cannonTexture);
			
			setupAtmosAndPrepBuffersForDrawing(gunBuffers, activeShaderProgram);
			
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
	function drawBall(matrix, size=1){
		drawSimplePlayerObject(matrix, sphereBuffers, size);
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
			drawObjectFromBuffers2(objectBuffers, shaderProgramColored);
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
			drawPortalFrame(portals[ii], activeShaderProgram, portalMatArr[ii], portalInCameraArr[ii]);
		}
	}

	function drawPortalFrame(portalInfo, shaderProg, portalMat, portalInCamera){

		var frameScale = portalInfo.radius/portalInfo.worldSize;
		gl.uniform3f(shaderProg.uniforms.uModelScale, frameScale,frameScale,frameScale);

		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", portalInfo.shared.color);

		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		drawObjectFromBuffers2(cubeFrameSubdivBuffers, shaderProg);

		//draw coloured axis objects
		var smallScale = frameScale*0.1;
		gl.uniform3f(shaderProg.uniforms.uModelScale, smallScale,smallScale,smallScale);
		var moveAmount = Math.atan(frameScale) + smallScale;	//to portal surface then by small frame size

		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", colorArrs.red);
		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		xyzmove4mat(mvMatrix, [moveAmount,0,0]);	//TODO correct mMatrix, but IIRC only impacts lighting 
		drawObjectFromBuffers2(cubeBuffers, shaderProg);
		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", colorArrs.green);
		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		xyzmove4mat(mvMatrix, [0,moveAmount,0]);	//TODO correct mMatrix, but IIRC only impacts lighting 
		drawObjectFromBuffers2(cubeBuffers, shaderProg);
		uniform4fvSetter.setIfDifferent(shaderProg, "uColor", colorArrs.blue);
		mat4.set(portalInCamera, mvMatrix);mat4.set(portalMat, mMatrix);
		xyzmove4mat(mvMatrix, [0,0,moveAmount]);	//TODO correct mMatrix, but IIRC only impacts lighting 
		drawObjectFromBuffers2(cubeBuffers, shaderProg);
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

			var portalRelativeRad = portals[ii].radius / portals[ii].worldSize;

			var portalRad = 1.02*portalRelativeRad;

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
				setupShaderAtmos(activeShaderProgram, wSettings.worldA);
				drawObjectFromBuffers(placeholderPortalMesh, activeShaderProgram);
			}

			if (frustumCull(portalInCameraArr[ii], portalRelativeRad)){
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


				//calcReflectionInfo(transposed, returnObj, portalRad);
				calcReflectionInfoNew(transposed, returnObj, portals[ii].shared.trueRadius, portals[ii].worldSize, portals[ii].otherps.worldSize);


				debugPortalInfo = {returnObj, ii, portals, reflectorInfoArr, infoForPortals};

				returnObj.rad = guiParams.reflector.draw!="none" ? portalRelativeRad : 0;	//when "draw" off, portal is inactivate- can't pass through, doesn't discard pix

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

				moveMatrixThruPortal(matrixToPortal, 1, reflInfo.portal ?? portalsForWorld[worldA][0], true);
				//skips start/end rotations. appears to fix rendering. TODO check for side effects
				//NOTE ?? case is just a bodge to have something defined when call this for playerLight through portal - guess broken since moved portal from default position!

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

		setupShaderAtmos(shaderProgram, wSettings.worldA);
		drawObjectFromBuffers(meshToDraw, shaderProgram, true);
	}
}

function drawWorldScene2(frameTime, wSettings, depthMap){	//TODO drawing using rgba, depth buffer images from previous rendering
	//({worldA,worldInfo, localVecFogColor, localVecReflectorDiffColor, reflectorPosTransformed, dropLightPos} = wSettings);
	
	({worldInfo, sshipDrawMatrices, worldA} = wSettings);
	
	setUboValsFromWorldSettingsFast(wSettings);	//TODO pull out and set less frequently? (eg for all 4 panels in quadview)

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
		drawDuocylinderObject(wSettings, duocylinderObjects[worldInfo.duocylinderModel], duocylinderSpin, 0,0,0, depthMap);
		gl.depthFunc(gl.LESS);
		gl.depthMask(true);
	}

	
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	var seaTime = 0.00005*(frameTime % 20000 ); //20s loop	//note this is duplicated from drawWorldScene
	if (worldInfo.seaActive){
		drawDuocylinderObject(wSettings, duocylinderObjects['sea'], duocylinderSpin, worldInfo.seaLevel, worldInfo.seaPeakiness, seaTime, depthMap);
	}


	//draw bullets
	var transpShadProg = shaderPrograms.coloredPerPixelTransparentDiscard;
	//var transpShadProg = shaderPrograms.coloredPerPixelDiscard;
	shaderSetup(transpShadProg);
	function shaderSetup(shader, tex){
		performShaderSetup(shader, wSettings, tex);
	}
	
	setupShaderAtmos(transpShadProg, worldA);
	prepBuffersForDrawing(sphereBuffers, transpShadProg);
	targetRad=sshipModelScale*150;
	gl.uniform3f(transpShadProg.uniforms.uModelScale, targetRad/50,targetRad/50,targetRad);	//long streaks
	gl.uniform3f(transpShadProg.uniforms.uEmitColor, 1.0, 1.0, 0.5);	//YELLOW
	gl.uniform1f(transpShadProg.uniforms.uOpacity, 1.0);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA , gl.ONE);	
	gl.depthMask(false);
	
	
	for (var b of bullets){
		if (b.active && !b.isBig && b.world == worldA){
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

		if (singleExplosion.life<1){continue;}

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
	
	var wSize = wSettings.worldInfo.worldSize;
	var muzFlashMove = [0,0,0.0025].map(x=>x/wSize);
	var muzFlashStartSize = 0.0025/wSize;
	for (var gg in gunMatrices){
		var mfRad = muzFlashStartSize;
		var flashAmount = muzzleFlashAmounts[gg];
		gl.uniform1f(transpShadProg.uniforms.uOpacity, flashAmount);
		mat4.set(invertedWorldCamera, mvMatrix);
		mat4.multiply(mvMatrix,gunMatrices[gg]);
		xyzmove4mat(mvMatrix, muzFlashMove);

		for (var xx=0;xx<3;xx++){	//nested spheres
			gl.uniform3f(transpShadProg.uniforms.uModelScale, mfRad/5,mfRad/5,mfRad);
			drawObjectFromPreppedBuffers(sphereBuffers, transpShadProg);
			mfRad*=.9;
		}
	}

	//thrusters
	//TODO pass amount of thrust to shader for strength of effect.
	if (guiParams["player model"] == "spaceship" && thrusterBuffers.isLoaded && playerMechanics.currentThrustInput[2]>0){
		
		//NOTE this shader is inefficient since does world/portal lighting calculation, but has zero effect.
		var activeShaderProgram = shaderPrograms.coloredPerPixelDiscardVertexColoredEmit[ guiParams.display.atmosShader ];
		shaderSetup(activeShaderProgram);
		
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", new Float32Array([0.2,1,1.5,1]));
		modelScale = sshipModelScale/wSettings.worldInfo.worldSize;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale*0.8,modelScale,modelScale);
				
		//elsewhere using drawSsshipRotatedMat, but to avoid possible side effects, just make another mat.
		var rotatedMatrix2 = mat4.create();

		for (var drawMat of sshipDrawMatrices){
			//copy matrix stuff for when drawing main spaceship body
			mat4.set(invertedWorldCamera, mvMatrix);
			
			mat4.set(drawMat,rotatedMatrix2);
			xyzrotate4mat(rotatedMatrix2, [-Math.PI/2,0,0]); 

			mat4.multiply(mvMatrix,rotatedMatrix2);
			mat4.set(rotatedMatrix2, mMatrix);

			setupShaderAtmos(activeShaderProgram, worldA);
			drawObjectFromBuffers(thrusterBuffers, activeShaderProgram);
		}
	}

	//draw thrusters for pyramid spaceship. (TODO different thruster object.)
	if (guiParams["player model"] == "convexHullTest" && thrusterBuffers2.isLoaded && playerMechanics.currentThrustInput[2]>0){
		
		//NOTE this shader is inefficient since does world/portal lighting calculation, but has zero effect.
		var activeShaderProgram = shaderPrograms.coloredPerPixelDiscardVertexColoredEmit[ guiParams.display.atmosShader ];
		shaderSetup(activeShaderProgram);
		
		uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", new Float32Array([0.2,1,1.5,1]));
		modelScale =  0.0005/wSettings.worldInfo.worldSize;
		gl.uniform3f(activeShaderProgram.uniforms.uModelScale, -modelScale,modelScale,modelScale);
				
		//elsewhere using drawSsshipRotatedMat, but to avoid possible side effects, just make another mat.
		var rotatedMatrix2 = mat4.create();

		for (var drawMat of sshipDrawMatrices){
			//copy matrix stuff for when drawing main spaceship body
			mat4.set(invertedWorldCamera, mvMatrix);
			
			mat4.multiply(mvMatrix,drawMat);
			mat4.set(drawMat, mMatrix);

			setupShaderAtmos(activeShaderProgram, worldA);
			drawObjectFromBuffers(thrusterBuffers2, activeShaderProgram);
		}
	}
	
	
	
	gl.depthMask(true);



	gl.disable(gl.BLEND);

}

var explosions ={};		//todo how to contain this? eg should constructor be eg explosions.construct()? what's good practice?
var Explosion=function(){
	var nextExplId = 0;
	return function(objcontainer, size, color, rotateWithDuocylinder, hasSound){

		var worldInfo = guiSettingsForWorld[objcontainer.world];

		this.matrix = matPool.create();
		mat4.set(objcontainer.matrix, this.matrix);
		this.world= objcontainer.world;
		this.size = size / worldInfo.worldSize;
		this.color = color;
		this.life=100;
		this.soundSphereRad = 0;
		this.speed = Math.sqrt(0.00002/size);	//larger size = slower. sqrt is arbitrary, effect seems about right 
		explosions[nextExplId]=this;
		nextExplId+=1;
		this.rotateWithDuocylinder=rotateWithDuocylinder;
		
		this.hasSound = hasSound;
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


function drawTennisBall(duocylinderObj, shader, worldDrawingNow, duocylinderSpin, depthMap){
	if (!duocylinderObj.isLoaded){
		return;
	}
	
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
	
	duocylinderObj.objInfoArr.forEach(objInfo => {
		//NOTE this is wasteful when drawing many objects with identity matrix
		mat4.set(invertedWorldCameraDuocylinderFrame, mvMatrix);
		mat4.multiply(mvMatrix,objInfo.mat);
		mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);
		mat4.multiply(mMatrix,objInfo.mat);

		setMatrixUniforms(shader);
		setupShaderAtmos(shader, worldDrawingNow);

		gl.drawElements(duocylinderObj.isStrips? gl.TRIANGLE_STRIP : gl.TRIANGLES, duocylinderObj.vertexIndexBuffer.numItems, 
			duocylinderObj.use32BitIndices? gl.UNSIGNED_INT: gl.UNSIGNED_SHORT, 0);
	});
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
		gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, iSize, gl.FLOAT, false, 4*iSize, 0);
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
	
	//if (shaderProg.uniforms.uPMatrix){
		gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
	//}
}
function setupShaderAtmos(shaderProg, worldDrawingNow){	//TODO generalise more shader stuff
	var worldSettings = guiSettingsForWorld[worldDrawingNow];
	if (shaderProg.uniforms.uAtmosContrast){	//todo do less often (at least query ui less often)
		gl.uniform1f(shaderProg.uniforms.uAtmosContrast, worldSettings.atmosContrast);
	}
	if (shaderProg.uniforms.uAtmosThickness){	//todo do less often (at least query ui less often)
		//make atmos thickness constant at "zero" duocylinder height. thickness here is uAtmosContrast*uAtmosThickness,
		var thicknessValForShader = worldSettings.atmosThickness*Math.pow(2.71,-0.5*worldSettings.atmosContrast);
		thicknessValForShader*=worldSettings.worldSize;

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
	
	if (bufferObj.isStrips){
		gl.drawElements(gl.TRIANGLE_STRIP, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		return;
	}

	if (shaderProg.uniforms.uShadowMat){
		// NOTE eventually shadows like this should do with deferred, this is just a quick hack to check whether worth persuing
		//NOTE this code assumes want shadow cast from player object at sshipMatrix, but could be player not in relevant world, might want to use "portaled"
		// player position here.
		mat4.set(sshipMatrix, relativeShadowMatrix);
		mat4.transpose(relativeShadowMatrix);
		mat4.multiply(relativeShadowMatrix, mMatrix);

		// mat4.set(mMatrix, relativeShadowMatrix);
		// mat4.transpose(relativeShadowMatrix);
		// mat4.multiply(relativeShadowMatrix, sshipMatrix);
		// mat4.transpose(relativeShadowMatrix);

		gl.uniformMatrix4fv(shaderProg.uniforms.uShadowMat, false, relativeShadowMatrix);
	}


	gl.drawElements(gl.TRIANGLES, bufferObj.vertexIndexBuffer.numItems, bufferObj.use32BitIndices? gl.UNSIGNED_INT: gl.UNSIGNED_SHORT, 0);
	//gl.drawElements(gl.LINES, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function drawObjectFromPreppedBuffersVsMatmult(bufferObj, shaderProg){
	gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);
	gl.drawElements(gl.TRIANGLES, bufferObj.vertexIndexBuffer.numItems, bufferObj.use32BitIndices? gl.UNSIGNED_INT: gl.UNSIGNED_SHORT, 0);
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
var relativeShadowMatrix = mat4.create();

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
var playerContainer = {matrix:playerCamera, world:2}

xyzmove4mat(playerCamera,[0,-0.4,0.1]);	//move start point towards problem area where collision distance testing many objs = slowdown

var offsetCameraContainer = {matrix:offsetPlayerCamera, world:0}

var worldCamera = mat4.create();
var portalInCameraCopy = mat4.create();

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
var lastChullPenetration = 0;

var closestBoxDist=100;	//initialise to arbitrarily large. TODO store point so pan sound	
var closestBoxInfo;

function setMatrixUniforms(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.uniforms.uPMatrix, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.uniforms.uMVMatrix, false, mvMatrix);
	if (shaderProgram.uniforms.uMMatrix){gl.uniformMatrix4fv(shaderProgram.uniforms.uMMatrix, false, mMatrix);}

	if (shaderProgram.uniforms.uShadowMat){
		// NOTE eventually shadows like this should do with deferred, this is just a quick hack to check whether worth persuing
		//NOTE this code assumes want shadow cast from player object at sshipMatrix, but could be player not in relevant world, might want to use "portaled"
		// player position here.
		mat4.set(sshipMatrix, relativeShadowMatrix);
		mat4.transpose(relativeShadowMatrix);
		mat4.multiply(relativeShadowMatrix, mMatrix);
		gl.uniformMatrix4fv(shaderProgram.uniforms.uShadowMat, false, relativeShadowMatrix);
	}
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
	
	cellMatData.d16.slice(0,3).forEach(matrix => targets.push({matrix, hitPoints:100}));
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
	duocylinderObjects.greebleTerrain.tex = bricktex;

	//duocylinderObjects.procTerrain.tex = texture;
	//duocylinderObjects.procTerrain.tex = makeTexture("img/14131-diffuse.jpg");  //sand
	duocylinderObjects.procTerrain.tex = nmapTexture;
	duocylinderObjects.procTerrain.texB = diffuseTexture;

	duocylinderObjects.procTerrain.useMapproject = true;	//only affects things when terrainMapProject:true

	//load 2 more textures. already set textures still reference what was loaded already
	//loadTmpFFTexture(4999,'img/no-git/');	//chequerboard
	//loadTmpFFTexture(5876);
	loadTmpFFTexture(4431);	//concrete blocks
	//loadTmpFFTexture(6481);

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

	wedgeShipTexture = makeTexture("data/miscobjs/wedge-ship-combo-z180reflect_1.png");
	wedgeShipTexture2 = makeTexture("data/miscobjs/wedge-ship-color-z180reflect_1_thruster.png");


	frigateTexture = makeTexture("data/frigate/frigate-tex.webp");

	randBoxBuffers.tex=texture;
	
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
	pendingMovement:[0,0],
};
var stats;

var pointerLocked=false;


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

var bvhObjsForWorld=guiParams.worlds.map(xx=>{return {objList:[],worldBvh:null,grids:null}});	//will create once bvhs created

var explodingBoxMatrix = someObjectMatrices[0].mat;

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

var dustMotesInfo = {
	scale:0.05,	
	instanceScale:0.001,
	numInstances:1000,
	accumulatedScroll:new Array(3).fill(0),
	transposedMatRelativeToPlayer:newIdMatWithQuats()	//perhaps could just store as a single quat or mat3 but mat4 makes more similar to other code,
		//perhaps at expense of drift. (dust motes box might move away from player over long time)
}


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
var targets = [];
var gunTargetWorldFrame=[];
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

	setupGui();


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
	
	window.addEventListener("keydown",function(evt){
		//console.log("key pressed : " + evt);
		var willPreventDefault=true;

		//number key to select special weapon
		var n = parseInt(evt.key);
		if (!isNaN(n)){
			if (n>0 && n<=numSpecialWeaps){	//1,2,3... 
				var weapNum = n-1;
				selectedSpecialWeapId = weapNum;
			}
		}else{
			switch (evt.keyCode){	
				case 84:	//T
					//xyzmove4mat(playerCamera,[0.01,0.0,0.01]);	//diagonally forwards/left
					break;
				case 70:	//F
					goFullscreen(canvas);
					break;
				case 67:	//C
					shouldShowControls=!shouldShowControls;
					break;
				default:
					willPreventDefault=false;
					break;
			}
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
		mouseInfo.buttons = evt.buttons;
		evt.preventDefault();
	});
	canvas.addEventListener("mouseup", function(evt){
		mouseInfo.buttons = evt.buttons;
	});
	canvas.addEventListener("mouseout", function(evt){
		mouseInfo.buttons = 0;
	});
	canvas.addEventListener("mousemove", function(evt){
		if (pointerLocked){
			mouseInfo.pendingMovement[0]+=-0.001* evt.movementX;	//TODO screen resolution dependent sensitivity.
			mouseInfo.pendingMovement[1]+=-0.001* evt.movementY;				
		}
	});
	
	initGL();

	initTextureFramebuffer(rttFisheyeRectRenderOutput, false, gl.REPEAT);
	initTextureFramebuffer(rttFisheyeRectRenderOutput2, false, gl.REPEAT);

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

    gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	setupScene();
	var random3Vecs = Array.from({length:dustMotesInfo.numInstances},_=>
						Array.from({length:3},_=>2*Math.random()-1));	//TODO check range of numbers vs wrapping code in shader.
	dustMotesInfo.random3Vecs = random3Vecs;	//only for console inspection. TODO remove
	dustMotesInfo.random3VecsBuf = glBuffer3VecsForInstancedDrawing(random3Vecs);
}

var playerVelVec = [0,0,0];	//TODO use matrix/quaternion for this
							//todo not a global! how to set listeners eg mousemove witin iteratemechanics???
var gunFireDirectionVec = [0,0,1];	//TODO check if requried to define something here
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


var debugRoll=0

var reverseCamera=false;

var mechanicsMoveSpeed = 0.000075;

var iterateMechanics = (function iterateMechanics(){

	var lastTime=Date.now();
	var moveSpeed=mechanicsMoveSpeed;
	var rotateSpeed=-0.0005;
		
	
	var timeTracker =0;
	var timeStep = guiParams.debug.timestep;	//5ms => 200 steps/s! this is small to prevent tunelling. TODO better collision system that does not require this!
	var timeStepMultiplier = timeStep/10;	//because stepSpeed initially tuned for timeStep=10;
	var gunHeatMultiplier = Math.pow(0.995, timeStep/10);
		
	var activeGp;	//gamepad

	var lastPlayerAngMove = [0,0,0];	//for interpolation
	
	

	var bulletMatrixTransposed = mat4.create();	//TODO? instead of transposing matrices describing possible colliding objects orientation.
	var bulletMatrixTransposedDCRefFrame=mat4.create();		//alternatively might store transposed other objects orientation permanently		

	return function(frameTime){
		
		//update timestep stuff to test effect of changing timestep ================
		//TODO remove
		timeStep = guiParams.debug.timestep;	//5ms => 200 steps/s! this is small to prevent tunelling. TODO better collision system that does not require this!
		timeStepMultiplier = timeStep/10;	//because stepSpeed initially tuned for timeStep=10;
		angVelDampMultiplier=Math.pow(0.95, timeStep/10);
		gunHeatMultiplier = Math.pow(0.995, timeStep/10);
		
		//==========================================================================

		reverseCamera=keyThing.keystate(82) || (mouseInfo.buttons & 4); 	//R or middle mouse click
		
		activeGp=getGamepad();
		if (activeGp && activeGp.buttons[10].pressed){	//L3
			reverseCamera=true;
		}
		processGamepadWeaponSwitching(activeGp);

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
		



		//value used in sphere collision TODO? avoid this if switched to box. eg referencing some general
		//collision func. TODO recalc critvalue only when changes
		//var critValue = 1-guiParams.target.scale*guiParams.target.scale;	//small ang approx
		var critValue = 1/Math.sqrt(1+guiParams.target.scale*guiParams.target.scale);	//some small ang approx here
		
		var relativeMat = mat4.create();
		var numRandomBoxes = guiParams['random boxes'].number;
		numRandomBoxes = Math.min(randomMats.length, numRandomBoxes);	//TODO check this doesn't happen/ make obvious error!
		
		var boxSize = guiParams['random boxes'].size;
		var ringBoxSize = 0.1;
		
		var critValueRandBox = 1/Math.sqrt(1+3*boxSize*boxSize);
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
		var bulletPosNewDCF4V = vec4.create();
		
		var worldInfo = guiSettingsForWorld[playerContainer.world];

		var duoCylinderAngVelConst = worldInfo.spinRate;
		
		timeTracker+=timeElapsed;
		var numSteps = Math.floor(timeTracker/timeStep);
		timeTracker-=numSteps*timeStep;
		for (var ii=0;ii<numSteps;ii++){
			stepSpeed(frameTime);
			gunHeat*=gunHeatMultiplier;
		}
		offsetCam.addIts(numSteps);


		//speed/time tracking. TODO call in stepspeed instead?
		if (numSteps>0){
			var speedMultiplier = unitWorldRadiusMetres * moveSpeed * 1000;
			playerInfoForDisplay.setInfo(speedMultiplier, numSteps*timeStep, playerCamera, playerVelVec, scaledSpinVelPlayerCoords);	
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
		
		
		for (var ee in explosions){
			var singleExplosion = explosions[ee];

			singleExplosion.soundSphereRad += soundspd*timeStep/1000;	//TODO check this is right! suspect /1000 is ms to s conversion
			singleExplosion.life-=numSteps*singleExplosion.speed;
			
			if (singleExplosion.soundSphereRad>1 && singleExplosion.life<1){	//TODO allow sounds to travel further? 
				matPool.destroy(singleExplosion.matrix);
				delete explosions[ee];
			}

			if (singleExplosion.hasSound){
				mat4.set(singleExplosion.rotateWithDuocylinder ? invertedWorldCameraDuocylinderFrame:invertedWorldCamera,tmpRelativeMat);
				mat4.multiply(tmpRelativeMat, singleExplosion.matrix);
				
				var distance = distBetween4mats(tmpRelativeMat, identMat);
				//var distance = Math.hypot(tmpRelativeMat[12],tmpRelativeMat[13],tmpRelativeMat[14],tmpRelativeMat[15]-1);	//equivalent to above TODO check perf
				
				var worldSize = guiSettingsForWorld[singleExplosion.world].worldSize;
				distance*=worldSize;

				var soundSize = 0.03;	//closest distance can get to sound, where volume is 1
				var vol = soundSize/Math.hypot(distance, soundSize);
				var pan = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
				
				if (!singleExplosion.soundStarted){
					//TODO start sound when sphere travelling at speed of sound hits observer. 
					//basically check distance vs elapsed time * soundspd

					//var soundSphereSize = 10000*singleExplosion.size;	//TODO get right scaling factor here. NOTE using size here makes inaudible
									//if soundwave hits after rendered explosion disappeared! TODO add doun sphere size var on explosion object?
					var soundSphereSize = singleExplosion.soundSphereRad;
					if (soundSphereSize>distance){
						singleExplosion.sound = myAudioPlayer.playBombSound(0,0);
						singleExplosion.soundStarted=true;
					}
				}
				if (singleExplosion.soundStarted){
					singleExplosion.sound.setAll({gain:vol, pan:pan, distance:distance});
				}
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
			rotatePlayer(scalarvectorprod(duocylinderRotate,axisDirPlayerCoords), false);
		}
		
		function stepSpeed(frameTime){	//NTOE frameTime only passed here for use by fireworks func
			//TODO make all movement stuff fixed timestep (eg changing position by speed)

			guiSettingsForWorld.forEach(setting => {
				setting.spinOld = setting.spin;
				setting.spin += setting.spinRate*timeStep*moveSpeed;
			});

			applyPortalMovement();

			playerMechanics.update(mouseInfo, timeStep, timeStepMultiplier, moveSpeed, rotateSpeed, activeGp);

			// bullet movement and non-grouped collision
			for (var b of bullets){
				if (b.active){	//TODO just delete/unlink removed objects

					if (b.hasTrail){
						if (Math.random()<0.3){
							produceSmoke(b);
						}
					}
					if (b.forwardAcceleration){
						b.vel[2]+=b.forwardAcceleration;

						//hack to prevent speed building up too much. TODO take atmos thickness into account, air speed (eg for rotating duocylinder)
						//and/or limit fuel! 
						for (var ii=0;ii<3;ii++){
							b.vel[ii]*=0.998;
						}
					}
					if (b.towardsTargetAcceleration && b.target){	// && b.target.world == b.world){	//TODO handle homing through portals
						//NOTE separate from forwardAcceleration. TODO combine? 
						//TODO take current velocity into account (otherwise tends to spiral around target unless high drag)
						//get direction of target in frame of missile. TODO this without multiplying matrices! (efficiency)
						var relativeMat = mat4.create(b.matrix);
						mat4.transpose(relativeMat);
						mat4.multiply(relativeMat, b.target.matrix);
						var direction3 = relativeMat.slice(12,15);
						var normalisedDirection = normalise3(direction3);
						console.log(normalisedDirection);
						for (var ii=0;ii<3;ii++){
							b.vel[ii]-=normalisedDirection[ii]*b.towardsTargetAcceleration;
							b.vel[ii]*=0.994;
						}
					}

					//NOTE if stored bullet vel relative to current world, or current world size on bullet, wouldn't need to look up world size.
					// or could store bullets per world, iterate all bullets in each world...
					var worldSize = guiSettingsForWorld[b.world].worldSize

					checkBulletCollision(b, timeStep*moveSpeed/worldSize);
					portalTestMultiPortal(b, 0);
				}
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
		}
		


		//slightly less ridiculous place for this - not declaring functions inside for loop!
		function checkBulletCollision(bullet, bulletMoveAmount){
			
			var worldInfo = guiSettingsForWorld[bullet.world];
			var dcSpin = worldInfo.spin;
			var dcSpinOld = worldInfo.spinOld;
					//todo keep bullets in lists/arrays per world so can check this once per world

			var bulletMatrix=bullet.matrix;
			tmpVec4[0]=tmpVec4[1]=tmpVec4[2]=tmpVec4[3]=0;
			mat4.set(bulletMatrix,bulletMatrixTransposed);
			mat4.transpose(bulletMatrixTransposed);
			
			mat4.set(bulletMatrixTransposed,bulletMatrixTransposedDCRefFrame);	//in frame of duocylinder
			rotate4mat(bulletMatrixTransposedDCRefFrame, 0, 1, dcSpinOld);
			
			for (var cc=0;cc<4;cc++){
				bulletPos[cc] = bulletMatrix[12+cc];
				bulletPos4V[cc]= bulletPos[cc];
				bulletPosDCF4V[cc] = bulletMatrixTransposedDCRefFrame[3+4*cc];
			}

			var bulletVel=bullet.vel;
			xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount,bulletVel));
			
			var newBulletPos = bulletMatrix.slice(12);	//already copying bulletpos before moved.

			mat4.set(bulletMatrix,bulletMatrixTransposed);
			mat4.transpose(bulletMatrixTransposed);
			
			mat4.set(bulletMatrixTransposed,bulletMatrixTransposedDCRefFrame);	//in frame of duocylinder
			rotate4mat(bulletMatrixTransposedDCRefFrame, 0, 1, dcSpin);

			for (var cc=0;cc<4;cc++){
				bulletPosNewDCF4V[cc] = bulletMatrixTransposedDCRefFrame[3+4*cc];
			}

			for (var target of targets){
				if (target.hitPoints<1){continue;}

				mat4.set(target.matrix, relativeMat);
				mat4.transpose(relativeMat);
				mat4.multiply(relativeMat, bulletMatrix);
				
				if (targetCollisionFunc(relativeMat)){
					target.hitPoints-=bullet.damage;
					if (target.hitPoints<1){
						new Explosion({matrix:target.matrix,world:bullet.world}, 0.0002, [1,0.5,0.25], false, true);
					}
					detonateBullet(bullet);
				}
			}

			if (worldInfo.duocylinderModel == "l3dt-brute" || worldInfo.duocylinderModel == "l3dt-blockstrips"){
				var l3dtCollisionResult = terrainBulletCollision(getHeightAboveTerrain2For4VecPos, bulletPos, newBulletPos, dcSpin);
				if (l3dtCollisionResult.collided){
					xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount*(l3dtCollisionResult.fractionAlong-1),bulletVel));
					detonateBullet(bullet, true, [0.3,0.3,0.3,1]);
				}
			}
			if (Object.keys(voxTerrainData).includes(worldInfo.duocylinderModel)){	//TODO generalise collision by specifying a function for terrain. (voxTerrain, procTerrain)
				var voxCollisionResult = terrainBulletCollision(voxTerrainData[worldInfo.duocylinderModel].collisionFunction, bulletPos, newBulletPos, dcSpin);
				if (voxCollisionResult.collided){
					xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount*(voxCollisionResult.fractionAlong-1),bulletVel));
					detonateBullet(bullet, true, [0.5,0.5,0.5,1]);
				}
			}
			if (worldInfo.seaActive){
				var seaCollisionResult = terrainBulletCollision(getHeightAboveSeaFor4VecPos, bulletPos, newBulletPos, dcSpin, lastSeaTime);
				if (seaCollisionResult.collided){
					xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount*(seaCollisionResult.fractionAlong-1),bulletVel));
					detonateBullet(bullet, true, [0.6,0.75,1,1]);
				}
			}
			
			var bvhCollisionResult = rayBvhCollision(bulletPos, newBulletPos, bulletPosDCF4V, bulletPosNewDCF4V, bullet.world);
			if (bvhCollisionResult.collided){
				//move bullet to point on surface (note approximate, since closestFractionAlong is in projected 3d space)
				xyzmove4mat(bulletMatrix,scalarvectorprod(bulletMoveAmount*(bvhCollisionResult.closestFractionAlong-1),bulletVel));
				detonateBullet(bullet, bvhCollisionResult.objectIsSpinning, [0.3,0.3,0.8]);
					//NOTE currently all objects are assumed to rotate with duocylinder of world they are in, so moveWithDuocylinger=true
					//TODO use bvh objects ref frame or surface velocity at collision point to support objects moving/spinning differently
			}
		}

		function detonateBullet(bullet, moveWithDuocylinder, color=[1,1,1,1]){	//TODO what scope does this have? best practice???

			if (!bullet.active){console.log("attempting to destroy bullet that is already destroyed.");return;}

			bullet.vel = [0,0,0];	//if colliding with target, stop bullet.
			bullet.active=false;
			
			var matrix = bullet.matrix;

			var explosionParticles = explosionParticleArrs[bullet.world];

			var explosionSize = bullet.isBig? 0.0001:0.00002;


			if (!moveWithDuocylinder){
				new Explosion(bullet, explosionSize, [1,0.5,0.25], false, true);
			//	explosionParticles.makeExplosion(matrix.slice(12), frameTime, color,0);
			}else{
			//	explosionParticles.makeExplosion(matrix.slice(12), frameTime, color,0);
					//TODO include velocity for explosion particles due to duocylinder rotation.
					//should see slower particles fall to ground, but won't look good yet because particles disappear quickly, abruptly.

				rotate4matCols(matrix, 0, 1, guiSettingsForWorld[bullet.world].spin);	//get bullet matrix in frame of duocylinder. might be duplicating work from elsewhere.
				new Explosion(bullet, explosionSize, [0.2,0.4,0.6],true, true);	//different colour for debugging
			}

			matPool.destroy(matrix);
			
			//singleExplosion.life = 100;
			//singleExplosion.matrix = bulletMatrix;
		}
		
		for(var cc=0;cc<3;cc++){
			gunFireDirectionVec[cc]=playerVelVec[cc];
		}
		gunFireDirectionVec[2]+=muzzleVel;
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

				var portalRelativeRad = thisPortal.radius / thisPortal.worldSize;

				var effectiveRange = Math.tan(Math.atan(portalRelativeRad)+Math.atan(0.0015)/thisPortal.worldSize);	//TODO reformulate more efficiently
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

		var portalRelativeRad = portal.radius/portal.worldSize;

		var adjustedRad = portalRelativeRad + amount;	//avoid issues with rendering very close to surface

		var crossed = portalTestForGivenPortal(obj, adjustedRad, portal);
		if (crossed){break;}	//avoid crossing portal twice, when 1st portal smaller radius than 2nd
	}
}
function portalTestForGivenPortal(obj, adjustedRad, portal){
	if (checkWithinRangeOfGivenPortal(obj.matrix, adjustedRad, portal)){
		moveMatrixThruPortal(obj.matrix, 1.00000001, portal);
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

//NOTE this was written before had different size worlds. however, say, if move from small world to big world,
//remainder of movement from small world, causing step within portal, resulting in movement into big world, will 
//result in moving more than should. 
//can see when drawing copy of player ship within portal as crossing portal.
function moveMatrixThruPortal(matrix, hackMultiplier, portal, skipStartEndRotations){
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


	var entrancePortalAngularRad = Math.atan(portal.radius/portal.worldSize);
	var exitPortalAngularRad = Math.atan(portal.otherps.radius/portal.otherps.worldSize);

	var moveFromPortalEdgeToEdgeToOtherSide = entrancePortalAngularRad + exitPortalAngularRad;

	//corrective additional move that will matter when worlds on each side of portal are different sizes.
	//if worlds same size, distance inside portal when enter will be distance outside portal on exit.
	//otherwise wish to make some correction. NOTE this maybe some bodgy correction - really moveMatrixThruPortal even for same size worlds
	// is approximate, assumes close to portal edge anyway.
	var distanceInsidePortal = entrancePortalAngularRad - Math.asin(Math.sqrt(magsq));
	var distanceOutsidePortalAfterMove = distanceInsidePortal* portal.worldSize/portal.otherps.worldSize;
	var correctiveAdditionalMove = distanceOutsidePortalAfterMove - distanceInsidePortal;

	var totalMoveToOtherSide = moveFromPortalEdgeToEdgeToOtherSide + correctiveAdditionalMove;

	var multiplier2 = -hackMultiplier*totalMoveToOtherSide/mag;
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

function movePlayer(toMoveRelativeToPlayer, worldSize){
	var toMovePlayerRelativeToWorld = scalarvectorprod(1/worldSize, toMoveRelativeToPlayer);
	xyzmove4mat(playerCamera, toMovePlayerRelativeToWorld);
	scrollDustMotes(toMoveRelativeToPlayer);
} 

function scrollDustMotes(vec){
	for (var cc=0;cc<3;cc++){
		for (var kk=0;kk<3;kk++){
			dustMotesInfo.accumulatedScroll[cc]+=vec[kk]*dustMotesInfo.transposedMatRelativeToPlayer[4*kk + cc]/dustMotesInfo.scale;;
		}
	}
}


function rotatePlayer(vec, dustMotesRelativeToPlayerToo=true){
	if (!guiParams.control.onRails){
		//turning player makes velocity rotate relative to player.
		playerVelVec = rotateVelVec(playerVelVec,vec);

		//TODO something similar to rotateVelVec like this for camera lag - possibly like code below (not sure is right)
		//accumulatedPlayerCameraLag = rotateVecByAxisAngleVec(accumulatedPlayerCameraLag, vec);
		for (var cc=0;cc<3;cc++){
			playerCameraLagToAccumulate[cc]+=vec[cc];
		}
	};
	xyzrotate4mat(playerCamera,vec);

	if (dustMotesRelativeToPlayerToo){
		//NOTE hacky! this is only used for a 3d rotation anyway
		//maybe should just store this as a single quat.
		//also seen this break and matRelativeToPlayer become NaNs, causing dust motes to disappear.
		xyzrotate4mat(dustMotesInfo.transposedMatRelativeToPlayer, vec);
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

function log(info){		//can to enable/disable logging globally
	//console.log(info);
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


function initTextureFramebuffer(view, useNearestFiltering, outsideRangeBehaviour) {
	var filterType = useNearestFiltering ? gl.NEAREST : gl.LINEAR;
	view.framebuffer = gl.createFramebuffer();

	outsideRangeBehaviour = outsideRangeBehaviour ?? gl.CLAMP_TO_EDGE;
		//want to use gl.CLAMP_TO_EDGE to fix problems with textures wrapping top-to-bottom on screen, 
		//but doesn't work currently for quad view (3 quads are totally of range and rely on repeat)
		//TODO shift quad views so can use CLAMP across the board

	view.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, view.texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, outsideRangeBehaviour);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, outsideRangeBehaviour);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterType);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterType);
	//gl.generateMipmap(gl.TEXTURE_2D);
	
	view.depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, view.depthTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, outsideRangeBehaviour);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, outsideRangeBehaviour);
	

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
	uniform4fvSetter.setIfDifferent(activeShaderProgram, "uDropLightPos", dropLightPos);

	performGeneralShaderSetup(activeShaderProgram);
}
function drawDuocylinderObject(wSettings, duocylinderObj, duocylinderSpin, zeroLevel, seaPeakiness, seaTime, depthMap){	
	var activeShaderProgram, selectedShaderSet;

	//draw using z prepass if enabled. objects with substancial overdraw may draw faster, though increases num vertices drawn
	//TODO config options, disable z calculation and drawing in 2nd pass if prepass perf good, move prepasses to as early as pos
	//to avoid overdraw for other objects occluded by this one

	//depthMap flag means use depthmap texture (ie this pass is depth aware). prepass is not depth aware, and draws to depthmap texture.
	//afterwards, depth aware pass made with depthMap=true 

	if (!duocylinderObj.isSea && guiParams.display.zPrepass && !depthMap){
		activeShaderProgram = shaderPrograms.zPrepass4Vec;
		gl.useProgram(activeShaderProgram);
		drawTennisBall(duocylinderObj, activeShaderProgram, wSettings.worldA, duocylinderSpin);
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
		}else if (duocylinderObj.vertexColors){
			//todo depth map versions?
			selectedShaderSet = 'texmap4VecPerPixelDiscardPhongVcolor';
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
	
	drawTennisBall(duocylinderObj, activeShaderProgram, wSettings.worldA, duocylinderSpin, depthMap);
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

	var thisPortalSide = portalsForWorld[offsetCameraContainer.world][portalNum];

	var otherPortalSide = guiParams.reflector.isPortal ? thisPortalSide.otherps : thisPortalSide;

	//determine if portal is sufficiently far away.
	//set criteria to size of portal on screen. seems half sensible.
	//uses z distance, which determines size for rectilinear camera view, so can swith approximation on/off
	// as rotate view (for same distance from camera, z-distance is smaller, so appears larger, away from centre.
	// fisheye view reduces this effect, but is not accounted for here. TODO if using fisheye, take into account here.

	var portalRelativeRad = thisPortalSide.radius / thisPortalSide.worldSize;

	var invSizeInScreen = -portalInCamera[14]/portalRelativeRad;
		//approx, works for distant objects. note using inverse since portalInCamera[14] could be 0
		// TODO work out size of cubemap pixels
		// something more like (distance of reflected camera (inside portal) to portal surface)
		//							----------------------------------------
		//							(distance from camera to portal surface)

	//NOTE invsizeInScreen works poorly for fisheye. Also, approximation popping in and out when rotate is unpleasant.
	//use total distance to decide whether to use prerendered cubemap approximation.
	//NOTE could just determine a threshold for portalInCamera[15], get isOnOtherSideOfWorld for free
	var totalXYZSq = 1- portalInCamera[15]*portalInCamera[15];

	var isFarEnoughAway = totalXYZSq > portalRelativeRad*portalRelativeRad * 36;	//TODO use radius relative to world size?

	//var isFarEnoughAwayInZ = invSizeInScreen > 4;	//inverted so if behind camera counts as close (TODO proper calculation of pix density on portal surface)
	var isOnOtherSideOfWorld = portalInCamera[15] <0;
		//IIRC portalInCamera[15] = w = 1 when close to it, portalInCamera[14] = z is -ve in front, +ve behind camera.
	var isFarEnoughAwayForApproximation = isFarEnoughAway || isOnOtherSideOfWorld;

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

		setupShaderAtmos(activeProg, cameraContainer.world);
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

		if (!last){
			return; //hit this on linux firefox. don't know why. cache not initialised yet?
		}

		if (isSame(valueToSet, last)){
			numTimesAvoidedSet++;
			return;
		}
		last.set(valueToSet);

		numTimesSet++;
		gl.uniform4fv(shader.uniforms[uniformName], valueToSet);
	}

	var isSame = function(vecNow, vecLast){
		if (!vecLast){return false;}	//avoid problem on linux firefox? don't know why this happens.
		var componentsMatched = 0;
		for (var ii=0;ii<4;ii++){
			if (vecNow[ii]==vecLast[ii]){		//This has problem on linux firefox!! 
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
function moveMatHandlingPortal(matContainer, moveAmount){

	var currentWorld = matContainer.world;

	var currentWorldSize = guiSettingsForWorld[currentWorld].worldSize;

	var offsetVec = moveAmount.map(x=>x/currentWorldSize);

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

		var portalRelativeRad = portal.radius/portal.worldSize;
		var rad = portalRelativeRad;

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
			console.warn("(scimdDotMd*scimdDotMd)/differenceSq < otherTriangleSideSq  ! unexpected - seems already within portal!");
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
		halfAngleToCollisionPoint+=0.0003;

		var fractionToCollision =halfAngleToCollisionPoint/halfAngleStartToEnd;

		//console.log({angleToCollisionPoint, angleStartToEnd, fractionToCollision});	//expect 0 to 1

		xyzmove4mat(inputMatrix,offsetVec.map(elem => elem*fractionToCollision));

		portalTestMultiPortal(matContainer,0);

		var newWorld = matContainer.world;

		if (newWorld == currentWorld){console.log("worlds same, though expected portal transition!");}

		var remainingFraction = 1- fractionToCollision;
		var newWorldSize = guiSettingsForWorld[newWorld].worldSize;
		var remainingMoveAmount = remainingFraction/newWorldSize;

		xyzmove4mat(inputMatrix,moveAmount.map(elem => elem*remainingMoveAmount));

		return;
	}
	//console.log("ruled out portal camera traversal");
	xyzmove4mat(inputMatrix, offsetVec);
}

function projectTo3dWithScale(posInFrame, objectScale){
	var projectedPosInObjFrame = posInFrame.slice(0,3).map(val => val/(objectScale*posInFrame[3]));
	return projectedPosInObjFrame;
}

function getPosInMatrixFrame(inputPos, matrixTransposed){
	var posInFrame = vec4.create(inputPos);					//todo reuse vector
	mat4.multiplyVec4(matrixTransposed, posInFrame, posInFrame);
	return posInFrame;
}


function addManyObjectsToWorld(world, matArr, bufferObj, objBvh, scale){
	var matAndWorldData = matArr.map(mat=> {
		var transposedMat = mat4.create(mat);
		mat4.transpose(transposedMat);
		return {mat, transposedMat, world}
	});
	addManyObjectsToWorlds(matAndWorldData, bufferObj, objBvh, scale);
}

function addManyObjectsToWorld2(world, matInfoArr, bufferObj, objBvh, scale){
	var matAndWorldData = matInfoArr.map(xx=> {return {mat:xx.mat, transposedMat:xx.transposedMat, world}});
	addManyObjectsToWorlds(matAndWorldData, bufferObj, objBvh, scale);
}

function addManyObjectsToWorlds(matAndWorldData, bufferObj, objBvh, scale){

	var touchedWorlds = new Set();

	ensureBvhHas4dDataForScale(objBvh, scale);

	matAndWorldData.forEach(matAndWorld => {
		bvhObjsForWorld[matAndWorld.world].objList.push({
			mesh: bufferObj,
			mat: matAndWorld.mat, 
			transposedMat: matAndWorld.transposedMat, 
			bvh: objBvh,
			AABB: aabb4DForSphere(matAndWorld.mat.slice(12), scale*objBvh.boundingSphereRadius),
			scale
		});
		touchedWorlds.add(matAndWorld.world);
	});

	//because loading happens whenever, regenerate bvh when object added.
		//this is crappy. improvements?
		//  1) wait for all objs loaded before start game
		//	2) put bvh bounding sphere info with object data so can create bvh before object fully loaded
		//  3) fast bvh insert

	touchedWorlds.forEach(ww => {
		bvhObjsForWorld[ww] = worldBvhObjFromObjList(bvhObjsForWorld[ww].objList);
	});

}
