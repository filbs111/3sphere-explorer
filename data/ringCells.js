var ringCells=(function generateRingCells(){

	var numBallsInRing = 16;
	var startAng = Math.PI / numBallsInRing;
	var angleStep = startAng * 2.0;

	var ringCellsArr=[];
	
	var tmpMatrix = mat4.identity();pushRing();																		//'boxes y=z=0'
	mat4.identity(tmpMatrix);rotate4mat(tmpMatrix, 0, 1, Math.PI*0.5);pushRing(); 									//'boxes x=z=0'
	mat4.identity(tmpMatrix);rotate4mat(tmpMatrix, 0, 2, Math.PI*0.5);pushRing();									//'boxes x=y=0'
	mat4.identity(tmpMatrix);xmove4mat(tmpMatrix, Math.PI*0.5);rotate4mat(tmpMatrix, 0, 1, Math.PI*0.5);pushRing();	//'boxes z=w=0'
	mat4.identity(tmpMatrix);xmove4mat(tmpMatrix, Math.PI*0.5);rotate4mat(tmpMatrix, 0, 2, Math.PI*0.5);pushRing();	//'boxes y=w=0'
	mat4.identity(tmpMatrix);ymove4mat(tmpMatrix, Math.PI*0.5);rotate4mat(tmpMatrix, 0, 2, Math.PI*0.5);pushRing();	//'boxes x=w=0'

	function pushRing(){
		thisRing=[];
		xmove4mat(tmpMatrix, startAng);
		for (var ii=0;ii<numBallsInRing;ii++){
			xmove4mat(tmpMatrix, angleStep);
			thisRing.push(mat4.create(tmpMatrix));
		}
		ringCellsArr.push(thisRing);
	}

	return ringCellsArr;
})();