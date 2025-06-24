
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
loadGridData(proceduralTerrainData);

//map 3d point data to 4d points, wrapping square onto duocylinder
function loadGridData(toLoad){
	var verts = toLoad.vertices;
	var newverts = [];
	var tricoords = [];
	var gridVertdataLen = verts.length;
	console.log("tball vertexdata length = " +  gridVertdataLen);

	var norms = toLoad.normals;
	var newnorms = [];
	var gridNormdataLen = norms.length;
	console.log("tball normals length = " +  gridNormdataLen);
	
	for (var vv=0;vv<gridVertdataLen;vv+=3){
		var yo = verts[vv];
		var zo = verts[vv+1];
		var xo = verts[vv+2];
		
		var tricoord = [xo,yo,zo].map(xx=>xx/4);
		tricoord.forEach(tt => tricoords.push(tt));
		
		var outverts = get4vecfrom3vec(tricoord[0],tricoord[1],tricoord[2]);	//scale things down so can use 4x4 grid of these
		
		for (var cc=0;cc<4;cc++){
			newverts.push(outverts[cc]);
		}
		
		var ny = norms[vv];
		var nz = norms[vv+1];
		var nx = norms[vv+2];
		
		//simple way to calc norms - move a little along normal, subtract this from original value, normalise the result.
		//probably can express as a derivative wrt normal movment, then normalise result, but this way is easier.
		
		var smallOffset = 0.0001;
		var vertsalong = get4vecfrom3vec(
			0.25*(xo + smallOffset*nx),
			0.25*(yo + smallOffset*ny),
			0.25*(zo + smallOffset*nz)
			);
			
		//take difference and normalise
		var difference = [];
		for (var cc=0;cc<4;cc++){
			difference[cc] = vertsalong[cc] - outverts[cc];
		}
		var divisor=Math.hypot.apply(null,difference);
		
		for (var cc=0;cc<4;cc++){
			newnorms.push(difference[cc]/divisor);
		}
	}
	
	if (toLoad.binormals){
		var binormals = toLoad.binormals;
		var newbinormals = [];
		var tangents = toLoad.tangents;
		var newtangents = [];

		//note duplication of outverts = get4vecfrom3vec... here. TODO tidy up/generalise
		
		//TODO check that (near "zero" height), terrain is uniformly scaled from 3vec to 4vec
		//TODO more correct to map all vertices into 4vec space and calculate tangents, binormals there, normals from cross products.
		// that nouniform scaling shouldn't matter
		
		for (var vv=0;vv<gridVertdataLen;vv+=3){
			var yo = verts[vv];
			var zo = verts[vv+1];
			var xo = verts[vv+2];
			
			var outverts = get4vecfrom3vec(0.25*xo,0.25*yo,0.25*zo);	//scale things down so can use 4x4 grid of these
			
			var by = binormals[vv];
			var bz = binormals[vv+1];
			var bx = binormals[vv+2];
			
			//simple way to calc norms - move a little along normal, subtract this from original value, normalise the result.
			//probably can express as a derivative wrt normal movment, then normalise result, but this way is easier.
			
			var smallOffset = 0.0001;
			var vertsalong = get4vecfrom3vec(
				0.25*(xo + smallOffset*bx),
				0.25*(yo + smallOffset*by),
				0.25*(zo + smallOffset*bz)
				);
				
			//take difference and normalise
			var difference = [];
			for (var cc=0;cc<4;cc++){
				difference[cc] = vertsalong[cc] - outverts[cc];
			}
			var divisor=Math.hypot.apply(null,difference);
			
			for (var cc=0;cc<4;cc++){
				newbinormals.push(difference[cc]/divisor);
			}
			
			
			
			var ty = tangents[vv];
			var tz = tangents[vv+1];
			var tx = tangents[vv+2];
			
			//simple way to calc norms - move a little along normal, subtract this from original value, normalise the result.
			//probably can express as a derivative wrt normal movment, then normalise result, but this way is easier.
			
			var smallOffset = 0.0001;
			var vertsalong = get4vecfrom3vec(
				0.25*(xo + smallOffset*tx),
				0.25*(yo + smallOffset*ty),
				0.25*(zo + smallOffset*tz)
				);
				
			//take difference and normalise
			var difference = [];
			for (var cc=0;cc<4;cc++){
				difference[cc] = vertsalong[cc] - outverts[cc];
			}
			var divisor=Math.hypot.apply(null,difference);
			
			for (var cc=0;cc<4;cc++){
				newtangents.push(difference[cc]/divisor);
			}
			
			
			
		}
	
	}
	
	//test get4vecfrom3vec - check that is "square" for small displacements
	var centre4vec = get4vecfrom3vec(0,0,0);
	var xshift4vec = get4vecfrom3vec(0.01,0,0);
	var yshift4vec = get4vecfrom3vec(0,0.01,0);
	var zshift4vec = get4vecfrom3vec(0,0,0.01);
	
	console.log("TESTING get4vecfrom3vec");
	printDifference(centre4vec, centre4vec);
	printDifference(centre4vec, xshift4vec);
	printDifference(centre4vec, yshift4vec);
	printDifference(centre4vec, zshift4vec);
	
	function printDifference(v1,v2){
		var vdifference = v1.map(function(elem, ii){return elem-v2[ii];});
		console.log(Math.hypot.apply(null, vdifference));
	}
	
	function get4vecfrom3vec(x,y,z){
			var ang1 = 2*Math.PI * x;
			var ang2 = 2*Math.PI * y;
			var cylr = Math.PI * (0.25+ z*Math.sqrt(2));
			var sr = Math.sin(cylr);
			var cr = Math.cos(cylr);
			return [ cr * Math.sin(ang1), cr * Math.cos(ang1), sr * Math.sin(ang2), sr * Math.cos(ang2) ];
		}
	
	toLoad.tricoords = tricoords;
	toLoad.vertices = newverts;
	toLoad.normals = newnorms;
	toLoad.binormals = newbinormals;
	toLoad.tangents = newtangents;
};
