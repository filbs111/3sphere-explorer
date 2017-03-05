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
	
	//hopefully 120-cell matrices result from multiplying 24-cell matrices by 5-cell matrices (24*5=120)
	cellMats=[];
	var tmpMat;
	for (var aa=0;aa<5;aa++){
		var this5CellMat=returnObj.d5[aa];
		for (var bb=0;bb<24;bb++){
			var this24CellMat=returnObj.d24.cells[bb];
			tmpMat = newMatrix();
			mat4.set(this5CellMat, tmpMat);
			
			//rotate4mat(tmpMat, 0, 1, halfPI));	//guess 
			
			mat4.multiply(tmpMat, this24CellMat);
			
			//mat4.set(this24CellMat, tmpMat);
			//mat4.multiply(tmpMat, this5CellMat);
			
			cellMats.push(tmpMat);
		}
	}
	returnObj.d120 = cellMats;
	
	
	function newMatrix(){
		var newMat = mat4.create();
		mat4.identity(newMat);
		return newMat;
	}
	
	return returnObj;
})();