var duocylinderBoxInfo=(function generateBoxInfo(){
	var boxInfo = [];
	
	var oneGridSquareOffset = Math.PI/14;
	var fudgeFact = 2/Math.PI;	//maytbe this is correct. seems to be ratio of up move to surface move at surface
	var hh=0.05;
	
	addBoxData(0,0,hh, [0.5, 0.5, 0.5, 1.0]);
	addBoxData(oneGridSquareOffset,0,hh, [1.0, 0.4, 0.4, 1.0]);				//red - around
	addBoxData(0,oneGridSquareOffset,hh, [0.4, 1.0, 0.4, 1.0]);				//green - along
	addBoxData(0,0,oneGridSquareOffset*fudgeFact+hh, [0.4, 0.4, 1.0, 1.0]);	//blue - up

	function addBoxData(aa, bb, hh, cc){
		var boxMatrix = mat4.identity();
		xyzrotate4mat(boxMatrix, [0,0,aa]);
		zmove4mat(boxMatrix, bb);
		xmove4mat(boxMatrix, Math.PI/4 - hh);
		boxInfo.push({matrix:boxMatrix, color:cc});
	};
	
	return boxInfo;
})();

duocylinderBoxCells = duocylinderBoxInfo.map(function(val){return val.matrix;});