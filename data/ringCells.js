var ringCells=(function generateRingCells(){

	var numBallsInRing = 16;
	var startAng = Math.PI / numBallsInRing;
	var angleStep = startAng * 2.0;

	var ringCellsArr=[];
	
	var tmpMatrix = mat4.identity();pushRing(colorArrs.red);																		//'boxes y=z=0'
	mat4.identity(tmpMatrix);rotate4mat(tmpMatrix, 0, 1, Math.PI*0.5);pushRing(colorArrs.green); 									//'boxes x=z=0'
	mat4.identity(tmpMatrix);rotate4mat(tmpMatrix, 0, 2, Math.PI*0.5);pushRing(colorArrs.blue);									//'boxes x=y=0'
	mat4.identity(tmpMatrix);xmove4mat(tmpMatrix, Math.PI*0.5);rotate4mat(tmpMatrix, 0, 1, Math.PI*0.5);pushRing(colorArrs.yellow);	//'boxes z=w=0'
	mat4.identity(tmpMatrix);xmove4mat(tmpMatrix, Math.PI*0.5);rotate4mat(tmpMatrix, 0, 2, Math.PI*0.5);pushRing(colorArrs.magenta);	//'boxes y=w=0'
	mat4.identity(tmpMatrix);ymove4mat(tmpMatrix, Math.PI*0.5);rotate4mat(tmpMatrix, 0, 2, Math.PI*0.5);pushRing(colorArrs.cyan);	//'boxes x=w=0'

	function pushRing(color){
		mats=[];
		xmove4mat(tmpMatrix, startAng);
		for (var ii=0;ii<numBallsInRing;ii++){
			xmove4mat(tmpMatrix, angleStep);
			mats.push(mat4.create(tmpMatrix));
		}
		ringCellsArr.push({color, mats});
	}

	return ringCellsArr;
})();

var ringCellsT = ringCells.map( ring => ring.mats.map(mtrx => mat4.transpose(mat4.create(mtrx))));