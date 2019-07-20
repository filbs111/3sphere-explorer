var duocylinderBoxInfo=(function generateBoxInfo(){
	var boxInfo = [];
	
	var oneGridSquareOffset = Math.PI/14;
	var fudgeFact = 2/Math.PI;	//maytbe this is correct. seems to be ratio of up move to surface move at surface
	var hh=0.05;
	
	addBoxData(0,0,hh, [0.5, 0.5, 0.5, 1.0]);
	addBoxData(oneGridSquareOffset,0,hh, [1.0, 0.4, 0.4, 1.0]);				//red - around
	addBoxData(0,oneGridSquareOffset,hh, [0.4, 1.0, 0.4, 1.0]);				//green - along
	addBoxData(0,0,oneGridSquareOffset*fudgeFact+hh, [0.4, 0.4, 1.0, 1.0]);	//blue - up

	//an array of boxes, with view to testing atmosphere shader.
	//this is a huge number of boxes. very inefficient. testing only. if want scene like this, combine into fewer objects (eg one)
	for (var ii=0;ii<8;ii++){
		for (var jj=0;jj<8;jj++){
			for (var hi=-1;hi<10;hi++){
				addBoxData(ii*0.4 +1,jj*0.4 -1,hi*0.05, [1.0, 1.0, 1.0, 1.0]);
			}
		}
	}
	
	function addBoxData(aa, bb, hh, cc){
		var boxMatrix = mat4.identity();
		xyzrotate4mat(boxMatrix, [0,0,aa]);
		zmove4mat(boxMatrix, bb);
		xmove4mat(boxMatrix, Math.PI/4 - hh);
		boxInfo.push({matrix:boxMatrix, color:cc});
	};
	
	return boxInfo;
})();