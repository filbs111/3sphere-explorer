var terrainCollisionTestBoxPos={a:0,b:0,h:0};
var procTerrainSize=256;

function getFourHeights(aaFloor,bbFloor){
	var aaCeil = (aaFloor + 1)%procTerrainSize;	//&255 maybe faster
	var bbCeil = (bbFloor + 1)%procTerrainSize;
	
	//check for bad input
	//seems that NaN gets in here (aa,bb)
	if ( aaFloor<0 || bbFloor<0 || aaCeil<0 || bbCeil<0 || aaFloor>=procTerrainSize || bbFloor>=procTerrainSize || aaCeil>=procTerrainSize || bbCeil>=procTerrainSize){
	//	console.log("bad input!");
		console.log({aaFloor:aaFloor, bbFloor:bbFloor, aaCeil:aaCeil, bbCeil:bbCeil, procTerrainSize:procTerrainSize});
		//this results in a bug so return something! seems that is looking up index 256
		return -1;	//returning this will cause problems.
	}
	
	return [terrainGetHeight(aaFloor,bbFloor),terrainGetHeight(aaFloor,bbCeil),terrainGetHeight(aaCeil,bbFloor),terrainGetHeight(aaCeil,bbCeil)];
}

function getInterpHeightForAB(aa,bb){
	
	if (aa!=aa || bb!=bb){
	//	console.log("NaN input to getInterpHeightForAB");
		console.log(aa, bb);
		return -1;	//todo what should return here? (really should never get here, best to look at where this is called)
	}
	
	//interpolate height. currently this func used for realtime height detection and mesh creation, and this should make latter slower, but unimportant.
	var aaFloor = Math.floor(aa)%procTerrainSize;
	var bbFloor = Math.floor(bb)%procTerrainSize;
	
	var heights = getFourHeights(aaFloor, bbFloor);
	
	var aaRemainder = aa-aaFloor;
	var bbRemainder = bb-bbFloor;
	
	return (1-aaRemainder)*((1-bbRemainder)*heights[0] + bbRemainder*heights[1]) +
									aaRemainder*((1-bbRemainder)*heights[2] + bbRemainder*heights[3]);
							//interpolation that assumes doubly ruled squares. TODO two triangles to match mesh
}

function getInterpHeightAndGradForAB(aa,bb){
	if (aa!=aa || bb!=bb){
	//	console.log("NaN input to getInterpHeightForAB");
		console.log(aa, bb);
		return -1;	//todo what should return here? (really should never get here, best to look at where this is called)
	}
	
	//interpolate height. currently this func used for realtime height detection and mesh creation, and this should make latter slower, but unimportant.
	var aaFloor = Math.floor(aa)%procTerrainSize;
	var bbFloor = Math.floor(bb)%procTerrainSize;
	
	var heights = getFourHeights(aaFloor, bbFloor);
	
	var aaRemainder = aa-aaFloor;
	var bbRemainder = bb-bbFloor;
	
	var centreHeight = (1-aaRemainder)*((1-bbRemainder)*heights[0] + bbRemainder*heights[1]) +
									aaRemainder*((1-bbRemainder)*heights[2] + bbRemainder*heights[3]);
							//interpolation that assumes doubly ruled squares. TODO two triangles to match mesh
	var grad = [ (1-bbRemainder)*(heights[2] - heights[0])+ bbRemainder*(heights[3] - heights[1]), (1-aaRemainder)*(heights[1] - heights[0]) + aaRemainder*(heights[3] - heights[2])];
	return {centreHeight:centreHeight, grad:grad};
	
}

function terrainGetHeightFor4VecPos(vec){	//returns point in procTerrain space directly below the input 4vector
	var multiplier = procTerrainSize/(2*Math.PI);	//TODO don't require enter same number here and elsewhere (gridSize)
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	//TODO interpolation across polygon. initially just reuse equation used to generate terrain grid data.
	//var aa=multiplier*decentMod(a,2*Math.PI);
	//var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	var aa=decentMod(multiplier*a,procTerrainSize);
	var bb=decentMod(multiplier*(b + duocylinderSpin),procTerrainSize);
	
	if (vec[0]!=vec[0] || vec[1]!=vec[1] || vec[2]!=vec[2]){	//things can go wrong here with fast collision with boxes
		console.log("NaN vector input to terrainGetHeightFor4VecPos");
		console.log(vec);
		return {a:0, b:0 , h:-1};	//todo what should return here? 
	}
	if (aa!=aa || bb!=bb){
		console.log("NaN ab in terrainGetHeightFor4VecPos");
		console.log(aa, bb);
		return {a:0, b:0 , h:-1};	//todo what should return here? 
	}
	
	var interpolatedHeight = getInterpHeightForAB(aa,bb);
	
//	interpolatedHeight*=Math.sqrt(2);	//fudge factor. TODO figure out if this is true height (think "true" height is before multtiply)
	
//	console.log("height : " + getInterpHeightForAB(aa,bb));
	//return {a:-a, b:Math.PI*1.5 -b , h:terrainGetHeight(aa,bb)};	//position such that will draw on landscape
	return {a:-a, b:Math.PI*1.5 -b , h:(Math.PI/4)*interpolatedHeight};
	//return {a:-a, b:Math.PI*1.5 -b , h: -0.5*Math.asin( (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]))};	//position such that will draw at input 4vec position
}

function terrainGetNearPointFor4VecPos(vec){	//returns estimated point in procTerrain space nearest the input 4vector
	var multiplier = procTerrainSize/(2*Math.PI);	//TODO don't require enter same number here and elsewhere (gridSize)
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	//TODO interpolation across polygon. initially just reuse equation used to generate terrain grid data.
	//var aa=multiplier*decentMod(a,2*Math.PI);
	//var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	var aa=decentMod(multiplier*a,procTerrainSize);
	var bb=decentMod(multiplier*(b + duocylinderSpin),procTerrainSize);
	
	if (vec[0]!=vec[0] || vec[1]!=vec[1] || vec[2]!=vec[2]){	//things can go wrong here with fast collision with boxes
		console.log("NaN vector input to terrainGetHeightFor4VecPos");
		console.log(vec);
		return {a:0, b:0 , h:-1};	//todo what should return here? 
	}
	if (aa!=aa || bb!=bb){
		console.log("NaN ab in terrainGetHeightFor4VecPos");
		console.log(aa, bb);
		return {a:0, b:0 , h:-1};	//todo what should return here? 
	}
	
	var sineVal = (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]);
	sineVal = Math.max(Math.min(sineVal,1),-1);	//will be screwed if this is >1 / <-1 .
	var c = -0.5*Math.asin( sineVal );	//this height of 4vec that can be compared to landscape height

	var hinfo = getInterpHeightAndGradForAB(aa,bb);
	
	var h = (Math.PI/4)*hinfo.centreHeight*Math.sqrt(2);
	var altitude = c-h;
	
	//estimate closest point. to do this properly should use grid separation specific to this height, but for simplicity, assume close to zero level.
	//get a surface normal by normalising (gx,gy,gridsize)
	var tnormal = [ hinfo.grad[0], hinfo.grad[1], 0.4/multiplier ];	//0.4 is a fudge/guess. this depends on terrain scaling - is 1 height same as 1 across? guess maybe a factor root 2 here, or pi etc? see what terrainGetHeightFor4VecPos returns... TODO check.
	var normLen = Math.hypot.apply(null,tnormal);	
	tnormal = tnormal.map(x=>x/normLen);	//normalise  (todo normLen with *altitude)
	
	//console.log(tnormal);
	testTnormal = {norm:tnormal, len:normLen};
	
	//return {a:-a+tnormal[0]*altitude, b:Math.PI*1.5 -b +tnormal[1]*altitude , h:(Math.PI/4)*hinfo.centreHeight};	//TODO do h correctly
	//return {a:-a+tnormal[0]*altitude, b:Math.PI*1.5 -b +tnormal[1]*altitude , h:c/Math.sqrt(2)};	// height just return input
	return {a:-a-tnormal[0]*altitude, b:Math.PI*1.5 -b -tnormal[1]*altitude , h:(c - tnormal[2]*altitude) /Math.sqrt(2)};	// h
	
	
}

var testTnormal;

function getHeightAboveTerrainFor4VecPos(vec){
	var multiplier = procTerrainSize/(2*Math.PI);	//TODO don't require enter same number here and elsewhere (gridSize)
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	var sineVal = (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]);
	sineVal = Math.max(Math.min(sineVal,1),-1);	//will be screwed if this is >1 / <-1 .
	
	var c = -0.5*Math.asin( sineVal );	//this height of 4vec that can be compared to landscape height
	
	//TODO interpolation across polygon. initially just reuse equation used to generate terrain grid data.
	//var aa=multiplier*decentMod(a,2*Math.PI);
	//var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	var aa=decentMod(multiplier*a,procTerrainSize);
	var bb=decentMod(multiplier*(b + duocylinderSpin),procTerrainSize);
	var h = (Math.PI/4)*getInterpHeightForAB(aa,bb);
	
	h*=Math.sqrt(2);	//fudge factor. TODO figure out if this is true height (think "true" height is before multtiply)
	
	return c-h;
}

//function getNearestTerrain4VecPosFor4VecPos(posVec){
function getNearestTerrainPosMatFor4VecPos(posVec){
	//find height above terrain, gradient here. estimate nearest surface point assuming constant gradient
	//this should give decent results for slowly varying gradient. but where there are sharp changes in gradient (which is the case assuming linear interpolation between grid points), may notice problems.

	//for sanity check, get point directly below player. should be able to calc distance to this repro existing behaviour
	//var abhPos = terrainGetHeightFor4VecPos(posVec);
	var abhPos = terrainGetNearPointFor4VecPos(posVec);
		//convert this to 4vec space, using function in voxterrain.js (todo generalise). 
		//todo account for duocylinder spin

	return getMatForABCDCCoords(abhPos.a,Math.PI*1.5 - abhPos.b,abhPos.h*Math.sqrt(2));	//note Math.PI*1.5 - ... , *Math.sqrt(2) because vox, procterrain stuff is inconsistent
}

function decentMod(num,toModBy){	//handle crappy nature of mod function (gives -ve if -ve)
	var returnnum = num%toModBy;
	return returnnum<0? returnnum+toModBy: returnnum;
}

var terrainHeightData = (function generateTerrainHeightData(){
	var allData=[];
	for (ii=0;ii<procTerrainSize;ii++){
		var dataForI = [];
		allData.push(dataForI);
		for (jj=0;jj<procTerrainSize;jj++){
			//dataForI.push(terrainPrecalcHeight(ii,jj));
			//dataForI.push(terrainPrecalcHeightTest(ii,jj));
			dataForI.push(terrainPrecalcHeightPerlin(ii,jj));
			//dataForI.push(terrainPrecalcHeightCastellated(ii,jj));
			//dataForI.push(terrainPrecalcHeight111(ii,jj));
		}
	}
	
	//console.log(allData);
		
	return allData;
	
	function terrainPrecalcHeight(ii,jj){		
		//make a flat region
		if ((ii<40) && (jj>100) && (jj<156)){
		//	return 0.0;
		}
		
		//egg box
		var tmpsf = 2*Math.PI*5/procTerrainSize;
		var height = 0.025*Math.sin(ii*tmpsf)*Math.sin(jj*tmpsf);
		//var height = 0.2*Math.sin(jj*jj*tmpsf*0.005);		//sorted out for ii. todo jj. test terrain patterns?
		//var height = 0.000004*((jj*ii)%10000);
		
		//height = 2*Math.max(height,-0.1);	//raise deep parts to "sea" level
		
		//add a big pyramid
		//height = Math.max(0.4-0.02*Math.max(Math.abs(ii-20),Math.abs(jj-20)), height);
		
		return 5*height;
	}
	
	function terrainPrecalcHeightTest(ii,jj){		
		//make a flat region
		if ((ii<40) && (jj>100) && (jj<156)){
			return 0.2;
		}
		
		//egg box
		var tmpsf = 2*Math.PI*5/procTerrainSize;
		var height = 0.025*Math.sin(ii*tmpsf)*Math.sin(jj*tmpsf);
		//var height = 0.2*Math.sin(jj*jj*tmpsf*0.005);		//sorted out for ii. todo jj. test terrain patterns?
		//var height = 0.000004*((jj*ii)%10000);
		
		//height = 2*Math.max(height,-0.1);	//raise deep parts to "sea" level
		
		//add a big pyramid
		//height = Math.max(0.4-0.02*Math.max(Math.abs(ii-20),Math.abs(jj-20)), height);
		
		return 5*height;
	}
	
	function terrainPrecalcHeightCastellated(ii,jj){		
		var reps = 16;
		//var halfheight = 0.5/reps;
		var halfheight = 0.5/reps;	//seems to make about square, but just a guess
		var tmpsf = 2*Math.PI*reps/procTerrainSize;	//don't really need to use sine for this, but easy to change later
		var sini = Math.sin(ii*tmpsf);
		var sinj = 1; // Math.sin(jj*tmpsf);
		
		var chequersine = sini*sinj;
		return (chequersine>0) ?halfheight:-halfheight;	//shows that assumption that 3vec to 4vec scales isotropically is out by ~ factor 2
		//return halfheight*Math.tanh(chequersine*5);
	}
	
	function terrainPrecalcHeight111(ii,jj){		
		var iiupdown = Math.abs(ii%16 - 8);
		var jjupdown = 0;	//Math.abs(jj%16 - 8);
		
		var height = (4/procTerrainSize)*Math.max(iiupdown, jjupdown);	//AFAIK grid squares are 4 wide
	
		return height;
		//return Math.sqrt(2)*height;	//this makes zigzag "square" if comment out fudge factor multiplications (same commit)
	}
	
	
	function terrainPrecalcHeightPerlin(ii,jj){			//todo perlin generator for correct scale?
		var hi = 2.8*sumPerlinWrap(ii/64,jj/64,0,2);
		//noise.perlin3 is quite odd. noise.perlin3(0,0,n) returns 0 always, suggesting doesn't treat all coords the same. TODO own perlin!!
															
		//noise.perlin3 seems to be 0 for any integer coords, eg (0,0,0), (1,2,3) etc, but (0.5,0,0) does not match (1.5,0,0) etc
		//appears to truly wrap every 256 
				
		//todo make something more efficient, should make small random grid, then make one 2x larger, adding tiled contribution from smaller grid, and so on. that way have something live 256x256 calls, instead of 256x256xoctaves. (check how slow this function is now)
		
		//suspect that high detail (octaves) data might be nothing here due to sampling
	
		//make a raised region
		//if ((ii<40) && (jj>100) && (jj<156)){
		//	hi += 0.05;
		//}
	
		return hi;
	}
	
})();

function terrainGetHeight(ii,jj){
	//detect out of bounds. ( have seen "terrainHeightData[ii] is undefined" error )
	if (ii<0 || jj<0 || ii>=procTerrainSize || jj>=procTerrainSize){
		console.log("out of bounds! " + ii + ", " + jj);
	}
	if (!terrainHeightData[ii]){
		console.log("terrainHeight undefined for ii = " + ii);	//turns out ii sometimes NaN
	}
	return terrainHeightData[ii][jj];
}

var proceduralTerrainData = (function generateGridData(gridSize){
	var terrainSizeMinusOne=gridSize-1;
	//TODO buffers should be include whether or not they are strip or triangle type. 
	//initially just do triangles. strip more efficient. for large grid, towards 1 vertex per triangle, rather than 3. (though indexed, so cost quite small)

	var vertices = [];
	var normals = [];	//might be able to use 2d gradient instead of 3d normal. for consistency with other shaders just use 3vec
	var binormals = [];
	var tangents = [];
	var indices = [];
	var uvcoords=[];
	var colors=[];
	//create vertices first. for 3-sphere grid, loops, so different (here have vertices on opposite sides (and 4 corners) that share z-position
	var vertex2dData=[];
	var thisLine;
	for (var ii=0;ii<gridSize;ii++){
		thisLine = [];
		vertex2dData.push(thisLine);
		for (var jj=0;jj<gridSize;jj++){
			vertices.push(4*ii/gridSize);			//TODO how to push multiple things onto an array? 
			
			var height = terrainGetHeight(ii,jj);
			thisLine.push(height);
			
			vertices.push(height);	
			vertices.push(4*jj/gridSize);	//moved to last - guess this is how laid other models out...
						
			//var h2 = (4*height+1)/2;	//similar to tanh version
			var h2 = (Math.tanh(10*height)+1)/2;	//tanh ensures within 0-1
			//var colorArr = [h2, 1-h2,0,1];	//green-red
			var colorArr = [h2, (h2+1)/2,h2/2,1];	//green-beige
			colorArr.forEach(elem=>colors.push(elem));
		}
	}

	//generate gradient/normal data.
	var nx,nz,ninvmag;
	var twiceSquareSize = 8/gridSize;	//think this maybe some dumb thing whereby 4vec mapping stuff designed for -1 to +1, with 4x4 tiles. see duocylinderObjects.grid  
	for (var ii=0;ii<gridSize;ii++){
		for (var jj=0;jj<gridSize;jj++){
			nx= -vertex2dData[(ii+1)&terrainSizeMinusOne][jj] + vertex2dData[(ii-1)&terrainSizeMinusOne][jj];
			nz= -vertex2dData[ii][(jj+1)&terrainSizeMinusOne] + vertex2dData[ii][(jj-1)&terrainSizeMinusOne];
			nx/=twiceSquareSize;
			nz/=twiceSquareSize;
			invmag = 1/Math.sqrt(1+nx*nx+nz*nz);
			normals.push(invmag*nx);
			normals.push(invmag);
			normals.push(invmag*nz);
			
			//binormals, tangents. guess use normalised. TODO check. note these are not perpendicular to eachother (unless terrain level)
			invmag = 1/Math.sqrt(1+nx*nx);
			binormals.push(invmag);
			binormals.push(-invmag*nx);
			binormals.push(0);
			
			invmag = 1/Math.sqrt(1+nz*nz);
			tangents.push(0);
			tangents.push(-invmag*nz);
			tangents.push(invmag);
			
			//tmp - for use in existing shader, requires some uv coord. since grid will wrap, this is not ideal - might reproject texture later, but for time being, just stick something here.
			uvcoords.push(8*ii/gridSize);
			uvcoords.push(8*jj/gridSize);
		}
	}
		
	//triangle strip data
	for (var ii=0;ii<gridSize;ii++){
		indices.push(lookupIndex(ii,0));	//duplicate vert at start of strip
		for (var jj=0;jj<=gridSize;jj++){
			indices.push(lookupIndex(ii,jj));
			indices.push(lookupIndex(ii+1,jj));
		}
		indices.push(indices[indices.length-1]);
	}
	//remove 1st, last index
	indices.pop();
	indices.shift();
	
	//this is a inefficient but comprehension more important. should swap to indexed strips anyway.
	function lookupIndex(xx,yy){
		return (xx&terrainSizeMinusOne)+gridSize*(yy&terrainSizeMinusOne)
	}
	return {vertices:vertices, normals:normals, binormals:binormals, tangents:tangents, uvcoords:uvcoords, colors:colors, faces:indices};
})(procTerrainSize);

var procTerrainSurfaceParticleMats = (function(){
	var mats=[];
	var nummats = 8192;
	for (nn=0;nn<nummats;nn++){
		var this4vec = random_quaternion();
		var thinfo = terrainGetHeightFor4VecPos(this4vec);	//note this returns coords and height. to do this for 4vec is quite inefficient. TODO create random xy coords and get height.
		
		//get a matrix for this position. TODO align to surface
		//use something very similar to main.js:moveToDuocylinderAB, and to generate voxSurfaceParticleMats, but signs, offsets differ. TODO sort out mess!!
		var thisMat = mat4.identity();
		xyzrotate4mat(thisMat, [0,0, thinfo.b]);
		zmove4mat(thisMat, thinfo.a);
		xmove4mat(thisMat, Math.PI/4 - Math.sqrt(2)*thinfo.h);	//or ymove - should check what way up want models to be. PI/4 is onto surface of duocylinder
		mats.push(thisMat);
	}
	return mats;
})();