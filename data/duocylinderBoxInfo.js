var duocylinderBoxInfo=(function generateBoxInfo(){
	var boxInfoTowerblocks = initialiseInfo();
	var boxInfoHyperboloids = initialiseInfo();
	var boxInfoStonehenge = initialiseInfo();
	var boxInfoViaducts = initialiseInfo();
	var boxInfoViaducts2 = initialiseInfo();
	var boxInfoRoads = initialiseInfo();
	var currentboxInfo;
	
	function initialiseInfo(){
		//todo more conventional constuctor
		var gridArr = [];
		for (gg=0;gg<64;gg++){
			gridArr.push([]);
		}
		return {list:[],gridContents:gridArr};
	}
	
	var oneGridSquareOffset = Math.PI/14;
	var fudgeFact = 2/Math.PI;	//maytbe this is correct. seems to be ratio of up move to surface move at surface
	var hh=0.05;
	
	currentboxInfo=boxInfoTowerblocks;
	
	var midGreyColor = new Float32Array([0.5, 0.5, 0.5, 1]);
	var lightGreyColor = new Float32Array([0.7, 0.7, 0.7, 1]);
	var whiteColor = new Float32Array([1,1,1,1]);	//TODO use colorArrs.white? perhaps should be declared earlier.

	addBoxData(0,0,hh, midGreyColor, 0);
	addBoxData(oneGridSquareOffset,0,hh, new Float32Array([1.0, 0.4, 0.4, 1.0]),0);				//red - around
	addBoxData(0,oneGridSquareOffset,hh, new Float32Array([0.4, 1.0, 0.4, 1.0]),0);				//green - along
	addBoxData(0,0,oneGridSquareOffset*fudgeFact+hh, new Float32Array([0.4, 0.4, 1.0, 1.0]),0);	//blue - up

	//an array of boxes, with view to testing atmosphere shader.
	//this is a huge number of boxes. very inefficient. testing only. if want scene like this, combine into fewer objects (eg one)
	for (var ii=0;ii<4;ii++){
		for (var jj=0;jj<4;jj++){
			for (var hi=-1;hi<8;hi++){
				addBoxData((ii+jj)*0.15 -1.5,(ii-jj)*0.15 -0.5,hi*0.05, midGreyColor, Math.PI/4);	//45 degree twist
			}
		}
	}
	
	currentboxInfo=boxInfoRoads;
	
	//add a ring of boxes to form a 2 roads - one "around" duocylinder (in spin/antispin direction), another "along".
	var aroundRoadSteps = 82;	//raised up so shorter than on duocyl surf
	var alongRoadSteps = 100;	//raised up so looser than on duocyl surf
	var stepSizeAroundRoad= Math.PI*2/aroundRoadSteps;
	var stepSizeAlongRoad= Math.PI*2/alongRoadSteps;
	for (var ii=0;ii<aroundRoadSteps;ii++){
		addBoxData(ii*stepSizeAroundRoad +10,-1.7,0.05, midGreyColor,0);
	}
	for (var ii=0;ii<alongRoadSteps;ii++){
		addBoxData(Math.PI/2,ii*stepSizeAlongRoad +10,0.15, midGreyColor,0);
	}
	
	currentboxInfo=boxInfoHyperboloids;
	for (var ii=0;ii<4;ii++){
		for (var jj=0;jj<4;jj++){
			for (var hi=2;hi<3;hi++){
				addBoxData((ii+jj)*0.2 ,(ii-jj)*0.2 -0.8,hi*0.05, lightGreyColor, 0);
			}
		}
	}
	
	currentboxInfo=boxInfoStonehenge;
	
	function randColor(){
		var coherentShift = Math.random()*0.05;
		return new Float32Array([0.9+coherentShift+Math.random()*0.05,
				0.6+coherentShift+Math.random()*0.03,
				0.1+coherentShift+Math.random()*0.01,1.0]);
	}
	
	var stepSize= Math.PI*2/31;
	for (var ii=0;ii<31;ii++){	//doesn't quite meet up. probably exact is 10*PI
		for (var hi=0;hi<4;hi++){
			addBoxData(ii*stepSize +10,ii*stepSize,hi*0.05, randColor(), Math.PI/4 + 0.2);	//tiny extra twist so stonehenge diagonal monorail thing looks ok  
		}
		for (var kk=0.125;kk<1;kk+=0.25){
			addBoxData((ii+kk)*stepSize +10,(ii+kk)*stepSize,4*0.05, randColor(),Math.PI/4 + 0.2);
		}
	}
	//add some tower that passes through portal?
	//currently requires 2 towers. TODO different setup for each side.
	for (var hi=0;hi<11;hi++){
		addBoxData(-0.1,0,hi*0.05, lightGreyColor,0);
		addBoxData(Math.PI-0.1,0,hi*0.05, lightGreyColor,0);
	}

	currentboxInfo = boxInfoViaducts;
	for (var ii=0;ii<31;ii++){	//doesn't quite meet up. probably exact is 10*PI
		//copied from stonehenge but just the top parts
		for (var kk=0.25;kk<1;kk+=0.5){
			addBoxData((ii+kk)*stepSize +10,(ii+kk)*stepSize,0 , whiteColor , Math.PI/4);
		}
	}
	adjustMatricesForBendyDrawing(currentboxInfo.list);

	currentboxInfo = boxInfoViaducts2;
	var ringRad = 0.4;
	for (var ii=0;ii<16;ii++){
		var angle = Math.PI*ii/8;
		addBoxData(ringRad * Math.sin(angle),-ringRad * Math.cos(angle), 0 , whiteColor , angle);
	}
	adjustMatricesForBendyDrawing(currentboxInfo.list);

	function adjustMatricesForBendyDrawing(list){
		var rotationCorrection =[3*Math.PI/2,0,0];
		for (var ii=0;ii<list.length;++ii){
			var thisMat = list[ii].matrix;
			xyzrotate4mat(thisMat, rotationCorrection);
			//fix bug - didn't rotate the transposed matrix!
			mat4.set(thisMat, list[ii].matrixT);
			mat4.transpose(list[ii].matrixT);
		}
	}
	
	function addBoxData(aa, bb, hh, cc, turn){
		var boxMatrix = mat4.identity();
		xyzrotate4mat(boxMatrix, [0,0,aa]);
		zmove4mat(boxMatrix, bb);
		xmove4mat(boxMatrix, Math.PI/4 - hh);
		xyzrotate4mat(boxMatrix, [turn,0,0]);
		xyzrotate4mat(boxMatrix, [0,Math.PI/2,0]);	//put hyperboloids upright
		
		var boxMatrixT = mat4.create(boxMatrix);	//todo use only transposed/not transposed matrix in code
		mat4.transpose(boxMatrixT);

		var thisItem = {matrix:boxMatrix, matrixT:boxMatrixT, color:cc};
		currentboxInfo.list.push(thisItem);
		
		//do in reliable way - use same logic as bullet pos lookup. (could do this direct from aa, bb here, but code more complex)
		var tmpXYPos = duocylXYfor4Pos([boxMatrix[12],boxMatrix[13],boxMatrix[14],boxMatrix[15]],0);
		var gridSquareX = (Math.floor(tmpXYPos.x + 0.5))%8;
		var gridSquareY = (Math.floor(tmpXYPos.y + 0.5))%8;
		var gridSq = gridSquareX + 8*gridSquareY;
		
		currentboxInfo.gridContents[gridSq].push(thisItem);
	};
	
	return {
		towerblocks:boxInfoTowerblocks,
		hyperboloids:boxInfoHyperboloids,
		stonehenge:boxInfoStonehenge,
		viaducts:boxInfoViaducts,
		viaducts2:boxInfoViaducts2,
		roads:boxInfoRoads
	};
})();

function duocylXYfor4Pos(inputPos, duocylinderSpin){
		
	//this is similar to terrainGetHeightFor4VecPos func in proceduralTerrain.js
	//at time of writing, only want x,y from this, but could extend to give z too
	var multiplier = 4/Math.PI;
	var a = Math.atan2(inputPos[2],inputPos[3]);
	var b = Math.atan2(inputPos[0],inputPos[1]);
	
	var aa=((multiplier*a)%8 + 8)%8;	//avoid -ve %
	var bb=((multiplier*(b + duocylinderSpin))%8 +8)%8;
	
	//return {x:-a, y:Math.PI*1.5 -b};	//used something like this for terrainGetHeightFor4VecPos
	return {x:aa, y:bb};
}

function testDuocylXYfor4Pos(){
	var playerPos = [playerCamera[12],playerCamera[13],playerCamera[14],playerCamera[15]];
	console.log(duocylXYfor4Pos(playerPos,0));
}

function getGridSqFor4Pos(pos, duocylinderSpin){
	var tmpXYPos = duocylXYfor4Pos(pos, duocylinderSpin);
	var gridSquareX = (Math.floor(tmpXYPos.x))%8;
	var gridSquareY = (Math.floor(tmpXYPos.y))%8;
	var gridSqs = [
		gridSquareX + 8*gridSquareY,
		(gridSquareX+1)%8 + 8*gridSquareY,
		gridSquareX + 8*((gridSquareY+1)%8),
		(gridSquareX+1)%8 + 8*((gridSquareY+1)%8)
	];
	if (gridSqs[0]<0 || gridSqs[0]>63){alert("grid square out of range! " + gridSq);}
	return gridSqs;
}