var duocylinderBoxInfo=(function generateBoxInfo(){
	var boxInfoViaducts = initialiseInfo();
	var boxInfoViaducts2 = initialiseInfo();
	var currentboxInfo;
	
	function initialiseInfo(){
		//todo more conventional constuctor
		var gridArr = [];
		for (gg=0;gg<64;gg++){
			gridArr.push([]);
		}
		return {list:[],gridContents:gridArr};
	}
	
	var whiteColor = new Float32Array([1,1,1,1]);	//TODO use colorArrs.white? perhaps should be declared earlier.

	var stepSize= Math.PI*2/31;
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
		xyzrotate4mat(boxMatrix, [0,Math.PI/2,0]);	//put upright (TODO remove? not needed for boxes)
		
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
		viaducts:boxInfoViaducts,
		viaducts2:boxInfoViaducts2,
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
