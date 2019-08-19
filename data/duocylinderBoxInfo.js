var duocylinderBoxInfo=(function generateBoxInfo(){
	var boxInfoTowerblocks = [];
	var boxInfoHyperboloids = [];
	var boxInfoStonehenge = [];
	
	var oneGridSquareOffset = Math.PI/14;
	var fudgeFact = 2/Math.PI;	//maytbe this is correct. seems to be ratio of up move to surface move at surface
	var hh=0.05;
	
	currentboxInfo=boxInfoTowerblocks;
	
	addBoxData(0,0,hh, [0.5, 0.5, 0.5, 1.0]);
	addBoxData(oneGridSquareOffset,0,hh, [1.0, 0.4, 0.4, 1.0]);				//red - around
	addBoxData(0,oneGridSquareOffset,hh, [0.4, 1.0, 0.4, 1.0]);				//green - along
	addBoxData(0,0,oneGridSquareOffset*fudgeFact+hh, [0.4, 0.4, 1.0, 1.0]);	//blue - up

	//an array of boxes, with view to testing atmosphere shader.
	//this is a huge number of boxes. very inefficient. testing only. if want scene like this, combine into fewer objects (eg one)
	for (var ii=0;ii<4;ii++){
		for (var jj=0;jj<4;jj++){
			for (var hi=-1;hi<8;hi++){
				addBoxData((ii+jj)*0.15 +1,(ii-jj)*0.15 -1,hi*0.05, [0.5, 0.5, 0.5, 1.0]);
			}
		}
	}
	
	currentboxInfo=boxInfoHyperboloids;
	for (var ii=0;ii<4;ii++){
		for (var jj=0;jj<4;jj++){
			for (var hi=2;hi<3;hi++){
				addBoxData((ii+jj)*0.2 +10,(ii-jj)*0.2 -1,hi*0.05, [0.7, 0.7, 0.7, 1.0]);
			}
		}
	}
	
	currentboxInfo=boxInfoStonehenge;
	
	var stepSize= Math.PI*2/31;
	for (var ii=0;ii<31;ii++){	//doesn't quite meet up. probably exact is 10*PI
		for (var hi=0;hi<4;hi++){
			addBoxData(ii*stepSize +10,ii*stepSize,hi*0.05, [1.0, 1.0, 0.9, 1.0]);
		}
		for (var kk=0.125;kk<1;kk+=0.25){
			addBoxData((ii+kk)*stepSize +10,(ii+kk)*stepSize,4*0.05, [1.0, 1.0, 0.9, 1.0]);
		}
	}
	
	function addBoxData(aa, bb, hh, cc){
		var boxMatrix = mat4.identity();
		xyzrotate4mat(boxMatrix, [0,0,aa]);
		zmove4mat(boxMatrix, bb);
		xmove4mat(boxMatrix, Math.PI/4 - hh);
		xyzrotate4mat(boxMatrix, [Math.PI/4,0,0]);	//45 degree twist
		xyzrotate4mat(boxMatrix, [0.2,0,0]);	//tiny extra twist so stonehenge diagonal monorail thing looks ok (TODO separate rotations different arrays)
		
		xyzrotate4mat(boxMatrix, [0,Math.PI/2,0]);	//put hyperboloids upright
		currentboxInfo.push({matrix:boxMatrix, color:cc});
	};
	
	return {
		towerblocks:boxInfoTowerblocks,
		hyperboloids:boxInfoHyperboloids,
		stonehenge:boxInfoStonehenge
	};
})();