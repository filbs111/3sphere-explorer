//an array of cubes where each vertex has a start position and a velocity.
//to be rendered by a shader that uses position = start_position + velocity*t (or e^-t for linear drag, or abs(sin(t)) for bouncy etc)
//initially use repeated texture map (each cube same uvs). 

var explodingCubeData = (function(){
	var dataObj={vertices:[],normals:[],uvcoords:[],indices:[],velocities:[]};
	//would be nice to separately index normals, uvcoords because these are repeated for each cube...
	//for now same index for all.
	var numDivisions=5;
	var vertsPerCube=levelCubeData.vertices.length;
	var uvsPerCube=levelCubeData.uvcoords.length;
	var indicesPerCube=levelCubeData.indices.length;	//not strip data
	var idxStart = 0;
	for (var ii=0;ii<numDivisions;ii++){
		var velX = 2*ii-numDivisions +1;
		for (var jj=0;jj<numDivisions;jj++){
			var velY = 2*jj-numDivisions +1;
			for (var kk=0;kk<numDivisions;kk++){
				var velZ = 2*kk-numDivisions +1;
				
				var velR = [myRand(), myRand(), myRand()];	//random velocity component
				var rr=0;
				for (var dd=0;dd<vertsPerCube;dd++){
					dataObj.vertices.push(levelCubeData.vertices[dd] - velR[rr]);
					dataObj.normals.push(levelCubeData.normals[dd]);
					rr=(rr+1)%3;
				}
				for (var dd=0;dd<uvsPerCube;dd++){
					dataObj.uvcoords.push(levelCubeData.uvcoords[dd]);
				}
				for (var dd=0;dd<vertsPerCube;dd+=3){
					dataObj.velocities.push(velX+velR[0]);	//todo how to push array onto end of array efficiently?
					dataObj.velocities.push(velY+velR[1]);
					dataObj.velocities.push(velZ+velR[2]);
				}
				for (var idx=0;idx<indicesPerCube;idx++){
					dataObj.indices.push(idxStart+levelCubeData.indices[idx]);
				}
				idxStart+=vertsPerCube/3;	//miss the /3 and draws every 3rd box!
			}
		}
	}
	return dataObj;
	
	function myRand(){
		return 2*Math.random()-1;	//maximum randomness range without neighbouring cubes colliding.
	}
})();
