var terrainCollisionTestBoxPos={a:0,b:0,h:0};
var procTerrainSize=256;

function lookupTerrainForPlayerPos(){
	var playerPos = [playerCamera[12],playerCamera[13],playerCamera[14],playerCamera[15]];			//copied from elsewhere
	terrainCollisionTestBoxPos = terrainGetHeightFor4VecPos(playerPos);	
}

function terrainGetHeightFor4VecPos(vec){
	var multiplier = procTerrainSize/(2*Math.PI);	//TODO don't require enter same number here and elsewhere (gridSize)
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	//TODO interpolation across polygon. initially just reuse equation used to generate terrain grid data.
	var aa=multiplier*decentMod(a,2*Math.PI);
	var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	
	//interpolate height. currently this func used for realtime height detection and mesh creation, and this should make latter slower, but unimportant.
	var aaFloor = Math.floor(aa);
	var bbFloor = Math.floor(bb);
	var aaCeil = (aaFloor + 1)%procTerrainSize;	//&255 maybe faster
	var bbCeil = (bbFloor + 1)%procTerrainSize;
	var aaRemainder = aa-aaFloor;
	var bbRemainder = bb-bbFloor;
	var interpolatedHeight = (1-aaRemainder)*((1-bbRemainder)*terrainGetHeight(aaFloor,bbFloor) + bbRemainder*terrainGetHeight(aaFloor,bbCeil)) +
									aaRemainder*((1-bbRemainder)*terrainGetHeight(aaCeil,bbFloor) + bbRemainder*terrainGetHeight(aaCeil,bbCeil));
							//interpolation that assumes doubly ruled squares. TODO two triangles to match mesh
	
//	console.log("height : " + terrainGetHeight(aa,bb));
	//return {a:-a, b:Math.PI*1.5 -b , h:terrainGetHeight(aa,bb)};	//position such that will draw on landscape
	return {a:-a, b:Math.PI*1.5 -b , h:(Math.PI/4)*interpolatedHeight};
	//return {a:-a, b:Math.PI*1.5 -b , h: -0.5*Math.asin( (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]))};	//position such that will draw at input 4vec position
}

function getHeightAboveTerrainFor4VecPos(vec){
	var multiplier = procTerrainSize/(2*Math.PI);	//TODO don't require enter same number here and elsewhere (gridSize)
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	var c = -0.5*Math.asin( (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]));	//this height of 4vec that can be compared to landscape height
	
	//TODO interpolation across polygon. initially just reuse equation used to generate terrain grid data.
	var aa=multiplier*decentMod(a,2*Math.PI);
	var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	var h = (Math.PI/4)*terrainGetHeight(aa,bb);	//TODO interpolate
	
	return c-h;
}

function decentMod(num,toModBy){	//handle crappy nature of mod function (gives -ve if -ve)
	var returnnum = num%toModBy;
	return returnnum>0? returnnum : returnnum+toModBy;
}

var terrainHeightData = (function generateTerrainHeightData(){
	var allData=[];
	for (ii=0;ii<procTerrainSize;ii++){
		var dataForI = [];
		allData.push(dataForI);
		for (jj=0;jj<procTerrainSize;jj++){
			dataForI.push(terrainPrecalcHeight(ii,jj));
		}
	}
	return allData;
	
	function terrainPrecalcHeight(ii,jj){		
		//make a flat region
		if ((ii<40) && (jj>100) && (jj<156)){
			return 0.0;
		}
		
		//egg box
		var tmpsf = 2*Math.PI*5/procTerrainSize;
		var height = 0.1*Math.sin(ii*tmpsf)*Math.sin(jj*tmpsf);
		//var height = 0.2*Math.sin(jj*jj*tmpsf*0.005);		//sorted out for ii. todo jj. test terrain patterns?
		//var height = 0.000004*((jj*ii)%10000);
		
		//height = 2*Math.max(height,-0.1);	//raise deep parts to "sea" level
		
		//add a big pyramid
		//height = Math.max(0.4-0.02*Math.max(Math.abs(ii-20),Math.abs(jj-20)), height);
		
		return height;
	}
})();

function terrainGetHeight(ii,jj){
	return terrainHeightData[ii][jj];
}



var proceduralTerrainData = (function generateGridData(gridSize){
	var terrainSizeMinusOne=gridSize-1;
	//TODO buffers should be include whether or not they are strip or triangle type. 
	//initially just do triangles. strip more efficient. for large grid, towards 1 vertex per triangle, rather than 3. (though indexed, so cost quite small)

	var vertices = [];
	var normals = [];	//might be able to use 2d gradient instead of 3d normal. for consistency with other shaders just use 3vec
	var indices = [];
	var uvcoords=[];
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
			
		}
	}

	//generate gradient/normal data.
	var nx,nz,ninvmag;
	var twiceSquareSize = 8/gridSize;
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
	return {vertices:vertices, normals:normals, uvcoords:uvcoords, faces:indices};
})(procTerrainSize);