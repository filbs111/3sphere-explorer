var cellMatData=(function(){
	var returnObj={};
	var halfPI = Math.PI*0.5;
	//5-cell ===================

	var moveDist = Math.acos(-0.25);
			
	var cellMats = [];			
	cellMats.push(newMatrix());
			
	var tmpMat;
	var tempRot = Math.atan(1.0/Math.sqrt(2));

	tmpMat = newMatrix();
	rotate4mat(tmpMat, 0, 1, Math.PI*1.0);	//turn upside down (roll)
	ymove4mat(tmpMat, -moveDist);
	cellMats.push(tmpMat);
			
	tmpMat = newMatrix();
	rotate4mat(tmpMat, 1, 2, tempRot*2);
	ymove4mat(tmpMat, -moveDist);
	cellMats.push(tmpMat);

	tmpMat = newMatrix();
	xyzrotate4mat(tmpMat,[ -tempRot, 0, -tempRot*Math.sqrt(3)]);
	ymove4mat(tmpMat, -moveDist);
	cellMats.push(tmpMat);
			
	tmpMat = newMatrix();
	xyzrotate4mat(tmpMat,[ -tempRot, 0, tempRot*Math.sqrt(3)]);
	ymove4mat(tmpMat, -moveDist);
	cellMats.push(tmpMat);	
	
	returnObj.d5=cellMats;
	
	//8-cell
	cellMats = [];			
	cellMats.push(newMatrix());
	cellMats.push(xmove4mat(newMatrix(), Math.PI));
	cellMats.push(xmove4mat(newMatrix(), halfPI));
	cellMats.push(xmove4mat(newMatrix(), -halfPI));
	cellMats.push(ymove4mat(newMatrix(), halfPI));
	cellMats.push(ymove4mat(newMatrix(), -halfPI));
	cellMats.push(zmove4mat(newMatrix(), halfPI));
	cellMats.push(zmove4mat(newMatrix(), -halfPI));
	
	returnObj.d8=cellMats;
	
	
	//16-cell
	cellMats = [];			
	var moveAmount = Math.PI/3;	
	var ang = -0.5*Math.sqrt(2)*Math.atan(Math.sqrt(2));
			
	var tmpMatrix = mat4.create();
	var mvMatrix = mat4.create();
	mat4.identity(tmpMatrix);
	drawHalf16Cells();
	xyzrotate4mat(tmpMatrix,[ Math.PI, 0, 0]);
	drawHalf16Cells();
			
	function drawHalf16Cells(){
		drawTetraFromPair(1,1,1);
		drawTetraFromPair(-1,-1,5);
		drawTetraFromPair(1,-1,-1);
		drawTetraFromPair(-1,1,-5);
	}
			
	function drawTetraFromPair(xsign,ysign,rotatesign){
		mat4.set(tmpMatrix, mvMatrix);
		
		xyzrotate4mat(mvMatrix,[ -ang*xsign, 0, -ang*ysign]);
		
		xyzrotate4mat(mvMatrix,[0,rotatesign*Math.PI/12,0]);
		ymove4mat(mvMatrix, moveAmount);
		pushMat();
		ymove4mat(mvMatrix, Math.PI);
		xyzrotate4mat(mvMatrix,[0,Math.PI,0]);	
		pushMat();
		
		function pushMat(){
			var tmpMat = newMatrix();
			mat4.set(mvMatrix, tmpMat);
			cellMats.push(tmpMat);
		}
	}
	
	returnObj.d16=cellMats;
	
	
	//24-cell
	var ringMats = [];
	ringMats.push(newMatrix());	
	ringMats.push(rotate4mat(newMatrix(), 0, 1, halfPI));
	ringMats.push(rotate4mat(newMatrix(), 0, 2, halfPI));
	ringMats.push(rotate4mat(xmove4mat(newMatrix(), halfPI), 0, 1, halfPI));
	ringMats.push(rotate4mat(xmove4mat(newMatrix(), halfPI), 0, 2, halfPI));
	ringMats.push(rotate4mat(ymove4mat(newMatrix(), halfPI), 0, 2, halfPI));
	
	var ringColors = [
		[1.0, 0.4, 0.4, 1.0],	//RED
		[0.4, 1.0, 0.4, 1.0],	//GREEN
		[0.4, 0.4, 1.0, 1.0],	//BLUE
		[1.0, 1.0, 0.4, 1.0],	//YELLOW
		[1.0, 0.4, 1.0, 1.0],	//MAGENTA
		[0.4, 1.0, 1.0, 1.0]	//CYAN
	];
	
	cellMats = [];
	var cellColors=[];
			
	for (var rr in ringMats){
		addOctoFrameRing(ringMats[rr],ringColors[rr]);
	}
	
	returnObj.d24={cells:cellMats, colors:cellColors};
	
	
	function addOctoFrameRing(ringMat,ringColor){
		rotate4mat(ringMat, 1, 2, Math.PI*0.25);
			
		//this is basically a copy of drawRing func. TODO generalise
		var numInRing = 4;
		var startAng = Math.PI / numInRing;
		var angleStep = startAng * 2.0;
				
		xmove4mat(ringMat, startAng);
		for (var ii=0;ii<numInRing;ii++){
			xmove4mat(ringMat, angleStep);
			var tmpMat = newMatrix();
			mat4.set(ringMat, tmpMat);
			cellMats.push(tmpMat);
			cellColors.push(ringColor);
		}
	}

	
	function newMatrix(){
		var newMat = mat4.create();
		mat4.identity(newMat);
		return newMat;
	}
	
	
	
	
//other method from rotations-generator project
//override the above for some 

//TODO:
//4d rotations : 5, 8, 16, 24, 120, 600-cell

var halfPI = Math.PI*0.5;
var rotationStack;
var generatorRotations;
var rotateMat;

var emergencyExit;

var myMat = mat4.create();
mat4.identity(myMat);


//4D ROTATIONS

//8-cell (tesseract) - should be easiest.
rotationStack=[];
generatorRotations = [];

rotateMat = mat4.create();
mat4.identity(rotateMat);
xmove4mat(rotateMat, halfPI);
generatorRotations.push(rotateMat);

rotateMat = mat4.create();
mat4.identity(rotateMat);
ymove4mat(rotateMat, halfPI);
generatorRotations.push(rotateMat);

rotateMat = mat4.create();
mat4.identity(rotateMat);
zmove4mat(rotateMat, halfPI);
generatorRotations.push(rotateMat);

emergencyExit=0;

addMatsFromMat(myMat);
console.log("8-cell: " + rotationStack.length);

returnObj.d8=rotationStack;	//override. 

//5-cell

rotationStack=[];
generatorRotations = [];

var moveDist = Math.acos(-0.25);
var tempRot = Math.atan(1.0/Math.sqrt(2));			

rotateMat = mat4.create();
mat4.identity(rotateMat);
rotate4mat(rotateMat, 0, 1, Math.PI);	//turn upside down (roll)
ymove4mat(rotateMat, -moveDist);
generatorRotations.push(rotateMat);

rotateMat = mat4.create();
mat4.identity(rotateMat);
rotate4mat(rotateMat, 1, 2, tempRot*2);
ymove4mat(rotateMat, -moveDist);
generatorRotations.push(rotateMat);

rotateMat = mat4.create();
mat4.identity(rotateMat);
xyzrotate4mat(rotateMat,[ -tempRot, 0, -tempRot*Math.sqrt(3)]);
ymove4mat(rotateMat, -moveDist);
generatorRotations.push(rotateMat);


addMatsFromMat(myMat);
console.log("5-cell: " + rotationStack.length);

returnObj.d5=rotationStack;	//override. 


//try 120-cell
var dodecaMove = Math.PI/5;
var dodecaMove2 = Math.PI/3;
var movedir;
rotationStack=[];
generatorRotations = [];

rotateMat = mat4.create();
mat4.identity(rotateMat);
xyzrotate4mat(rotateMat,[0,Math.PI,0]);	//rotate 180 about touching face
ymove4mat(rotateMat, dodecaMove);
generatorRotations.push(rotateMat);

rotateMat = mat4.create();
mat4.identity(rotateMat);
movedir=[2/Math.sqrt(5),1/Math.sqrt(5),0];
xyzmove4mat(rotateMat, [movedir[0]*dodecaMove, movedir[1]*dodecaMove, movedir[2]*dodecaMove]);
xyzrotate4mat(rotateMat,[movedir[0]*Math.PI, movedir[1]*Math.PI, movedir[2]*Math.PI]);
generatorRotations.push(rotateMat);

movedir=[2/Math.sqrt(5)*Math.cos(Math.PI*0.4),1/Math.sqrt(5),2/Math.sqrt(5)*Math.sin(Math.PI*0.4)];
xyzmove4mat(rotateMat, [movedir[0]*dodecaMove, movedir[1]*dodecaMove, movedir[2]*dodecaMove]);
xyzrotate4mat(rotateMat,[movedir[0]*Math.PI, movedir[1]*Math.PI, movedir[2]*Math.PI]);
generatorRotations.push(rotateMat);


addMatsFromMat(myMat);
console.log("120-cell: " + rotationStack.length);

returnObj.d120 = rotationStack;



//600-cell
rotationStack=[];
generatorRotations = [];

var moveLength = 2*Math.asin((3-Math.sqrt(5))/(4*Math.sqrt(2)));
console.log("movelength = " + moveLength);


rotateMat = mat4.create();
mat4.identity(rotateMat);
xyzrotate4mat(rotateMat, [0, Math.PI*2/3, 0]);	//rotate 3rd from above. this results in a straight line!
xyzrotate4mat(rotateMat, [-Math.acos(1/3), 0, 0]);
//costheta = 1/3 -> sintheta = sqrt(8)/3
xyzmove4mat(rotateMat,[0, moveLength/3, moveLength*Math.sqrt(8)/3 ]);	//not sure if this is right.
generatorRotations.push(rotateMat);

rotateMat = mat4.create();
mat4.identity(rotateMat);
xyzrotate4mat(rotateMat, [Math.acos(1/3), 0, 0]);
xyzmove4mat(rotateMat,[0, -moveLength, 0]);	
generatorRotations.push(rotateMat); //with just this 1 generator, if moveLength is correct, should get 5 cells

rotateMat = mat4.create();
mat4.identity(rotateMat);
xyzrotate4mat(rotateMat, [0, Math.PI*2/3, 0]);	//chuck in extra rotation
xyzrotate4mat(rotateMat, [Math.acos(1/3), 0, 0]);
xyzmove4mat(rotateMat,[0, -moveLength, 0]);	
generatorRotations.push(rotateMat); //with just this 1 generator, if moveLength is correct, should get 5 cells

rotateMat = mat4.create();
mat4.identity(rotateMat);
xyzrotate4mat(rotateMat, [0, Math.PI*4/3, 0]);	//chuck in extra rotation
xyzrotate4mat(rotateMat, [Math.acos(1/3), 0, 0]);
xyzmove4mat(rotateMat,[0, -moveLength, 0]);	
generatorRotations.push(rotateMat); //with just this 1 generator, if moveLength is correct, should get 5 cells

//note might be able to do with fewer (3) generators


addMatsFromMat(myMat);
console.log("600-cell: " + rotationStack.length);
console.log("trials: " + emergencyExit);
returnObj.d600 = rotationStack;


function addMatsFromMat(thisMat){
	emergencyExit++;
	//if (emergencyExit>800){return;}	//setting this makes for interesting partial 600-cell!

	//console.log("trying to add mat");

	//for an input matrix, if something "equivalent" is not already on the rotationStack (same up vector):
	//add it, and call addMatsFromMat for all matrices that can be rotated to from it.
	
	//step 1: identify if is already on stack.
	var isCovered = false;
	
	var thisMatUpVec = [
			thisMat[12], 	//for 4-cell
			thisMat[13],
			thisMat[14],
			thisMat[15]	
	];

	
	for (var ii=0;ii<rotationStack.length;ii++){
		var thatMat = rotationStack[ii];
		var thatMatUpVec = [
			thatMat[12], 	//for 4-cell
			thatMat[13],
			thatMat[14],
			thatMat[15]
		];	//TODO maybe precalc this, or use matrix library better (update to newer version??)
		var dotProd = thatMatUpVec[0]*thisMatUpVec[0]+
					thatMatUpVec[1]*thisMatUpVec[1]+
					thatMatUpVec[2]*thisMatUpVec[2]+
					thatMatUpVec[3]*thisMatUpVec[3];
		if ((dotProd <1.0001) && (dotProd>0.9999)){
			//console.log("already covered");
			isCovered=true;
			break;
		}else{
			//console.log("this one doesn't match. dotProd = " + dotProd);
		}
	}
	
	if (isCovered==false){
		//console.log("not yet covered. will add");
		rotationStack.push(thisMat);
		var newMat; 

		for (var gg=0;gg<generatorRotations.length;gg++){
			var thisG = generatorRotations[gg];
			newMat = mat4.create();
			mat4.set(thisMat,newMat);
			mat4.multiply(newMat, thisG);
			
			addMatsFromMat(newMat);
		}
		
	}
}
	
	//sort arrays by distance from portal to reduce rendering time
	returnObj.d24.cells.sort(function(a,b){return a[15]<b[15];});	//how are these rendered? in cell order?
	returnObj.d16.sort(function(a,b){return a[15]<b[15];});
	returnObj.d8.sort(function(a,b){return a[15]<b[15];});
	returnObj.d5.sort(function(a,b){return a[15]<b[15];});
	
	returnObj.d120=generateSortedArrays(returnObj.d120);
	returnObj.d600=generateSortedArrays(returnObj.d600);

	function generateSortedArrays(myArr){
		var arrayOfSortedArrays = [];
		for (var ii=0;ii<4;ii++){
			myArr = myArr.slice(0);	//shallow copy. 1st time is pointless
			var relevantMatElem = 12+ii;	//might be 3+4*ii, depending on matrix row or column.
			//var relevantMatElem = 3+ii;		
			arrayOfSortedArrays.push(myArr.sort(function(a,b){return a[relevantMatElem]<b[relevantMatElem];}));
			myArr = myArr.slice(0);
			arrayOfSortedArrays.push(myArr.reverse());
		}
		return arrayOfSortedArrays;
	}

	returnObj.d120GridArrayArray = generateGridArrayArray(returnObj.d120[0], 0.515 * (0.4/0.505));	//dodecaScale not yet defined. TODO move all constants to top
	returnObj.d600GridArrayArray = generateGridArrayArray(returnObj.d600[0], 0.4094);	//from collision culling 0.386/(4/Math.sqrt(6) , then extra factor sqrt(3) in checkTetraCollisionForArray 
																			//0.355); ?? used for drawing culling

	return returnObj;
})();

function sortIdForMatrix(inputMatrix){
	//only using position in matrix (though might do better with view direction too)
	
	//for each set of things to draw, 8 arrays. each lists the same set of matrices describing cell positions, sorted in different orders. ordered by distance from x=1, x=-1, y=1, y=-1, z= .... 
	//want some method to return either id of cell, or actual cell mat (should cell mat be class or something - would like to autogenerate 8 lists for each set of objects. 
	
	//note can get this in neat way for 16-cell 
	
	//initially just code logic to find which 8-cell are in
	var position =inputMatrix.slice(12);
	var absPosition =position.map(function(coord){return Math.abs(coord);});
	
	/*
	var greatestXY = Math.max(absPosition[0], absPosition[1]);	//(A)
	var greatestZW = Math.max(absPosition[2], absPosition[3]);	//(B)
	var greatestXZ = Math.max(absPosition[0], absPosition[2]);	//(C)
	var greatestYW = Math.max(absPosition[1], absPosition[3]);	//(D)
	//can do 2 comparisons AvsB, CvsD to determine which element of absPosition is greatest ( ...
	
	//above way might be fast or avoid GC but needlessly complex
	*/
	
	var greatestIdx=0;
	var greatestVal=0;
	for (var ii=0;ii<4;ii++){
		if (absPosition[ii]>greatestVal){
			greatestIdx = ii;
			greatestVal = absPosition[ii];
		}
	}
	return greatestIdx*2 + (position[greatestIdx] < 0 ? 1 : 0);
}