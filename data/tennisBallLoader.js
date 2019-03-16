
//load "tennis ball" data in xo,yo,zo format, to x,y,z,w, where a plane where zo=0 divides space in two
// ( x*x + y*y = z*z + w*w )

//from tennisBall.js, want something like

//
/*
x = cosCylRadius * Math.sin(ang1));
y = cosCylRadius * Math.cos(ang1));
	
z = sinCylRadius * Math.sin(ang2));
w = sinCylRadius * Math.cos(ang2));

where
ang1 is determined by xo ( eg ang1 = 2*pi*xo, where xo goes from 0 to 1 )
ang2 is determined by yo ( eg ang1 = 2*pi*yo, where yo goes from 0 to 1 )

cosCylRadius, sinCylRadius are determined by zo . cylRadius of PI/4 divides in 2, so let cylRadius= PI/4 * zo where zo goes from -1 to 1
 ( actually, might like system where zo goes to +/- infinity, cylRadius = atan(zo)... (?) - something like mercator )
 
 //the normal data can just be 0,0,0,0 for now...
 
*/


//data xo,yo,zo in toLoad

loadGridData(tballGridDataPantheonStyle);
loadGridData(terrainData);

//map 3d point data to 4d points, wrapping square onto duocylinder
function loadGridData(toLoad){
	var verts = toLoad.vertices;
	var newverts = [];
	var gridVertdataLen = verts.length;
	console.log("tball vertexdata length = " +  gridVertdataLen);

	var norms = toLoad.normals;
	var newnorms = [];
	var gridNormdataLen = norms.length;
	console.log("tball normals length = " +  gridNormdataLen);
	
	for (var vv=0;vv<gridVertdataLen;vv+=3){
		var xo = verts[vv];
		var zo = verts[vv+1];	//note switched y,z. TODO sort out sensible export process, check handedness...
		var yo = verts[vv+2];
		
		var outverts = get4vecfrom3vec(0.25*xo,0.25*yo,0.25*zo);	//scale things down so can use 4x4 grid of these
		
		for (var cc=0;cc<4;cc++){
			newverts.push(outverts[cc]);
		}
		
		var nx = norms[vv];
		var nz = norms[vv+1];
		var ny = norms[vv+2];
		
		//simple way to calc norms - move a little along normal, subtract this from original value, normalise the result.
		//probably can express as a derivative wrt normal movment, then normalise result, but this way is easier.
		
		var vertsalong = get4vecfrom3vec(
			0.25*xo + 0.001*nx,
			0.25*yo + 0.001*ny,
			0.25*zo + 0.001*nz
			);
			
		//take difference and normalise
		var difference = [];
		var sumsq=0;
		for (var cc=0;cc<4;cc++){
			var diff = vertsalong[cc] - outverts[cc];
			sumsq += diff*diff;
			difference[cc]=diff;
		}
		var divisor=Math.sqrt(sumsq);
		for (var cc=0;cc<4;cc++){
			newnorms.push(difference[cc]/divisor);
		}
		
		function get4vecfrom3vec(x,y,z){
			var ang1 = 2*Math.PI * x;
			var ang2 = 2*Math.PI * y;
			var cylr = Math.PI * (0.25+ z);
			var sr = Math.sin(cylr);
			var cr = Math.cos(cylr);
			return [ cr * Math.sin(ang1), cr * Math.cos(ang1), sr * Math.sin(ang2), sr * Math.cos(ang2) ];
		}
		
	}
	toLoad.vertices = newverts;
	toLoad.normals = newnorms;

};
