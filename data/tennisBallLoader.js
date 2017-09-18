
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


//data xo,yo,zo in tballGridData

(function loadGridData(){
	var verts = tballGridData.vertices;
	var newverts = [];
	var gridVertdataLen = verts.length;
	console.log("tball vertexdata length = " +  gridVertdataLen);

	for (var vv=0;vv<gridVertdataLen;vv+=3){
		var xo = verts[vv];
		var zo = verts[vv+1];	//note switched y,z. TODO sort out sensible export process, check handedness...
		var yo = verts[vv+2];
		
		var ang1 = 2*Math.PI * xo;
		var ang2 = 2*Math.PI * yo;
		var cylr = Math.PI * (0.25+ zo);
		var sr = Math.sin(cylr);
		var cr = Math.cos(cylr);
		
		newverts.push(cr * Math.sin(ang1));
		newverts.push(cr * Math.cos(ang1));
		newverts.push(sr * Math.sin(ang2));
		newverts.push(sr * Math.cos(ang2));
	}
	tballGridData.vertices = newverts;
	
	//temporary hack for normals - just overwrite with 0,0,0,0
	var norms = tballGridData.normals;
	var newnorms = [];
	var gridNormdataLen = norms.length;
	console.log("tball normals length = " +  gridNormdataLen);

	for (var vv=0;vv<gridNormdataLen;vv+=3){
		//var xo = norms[vv];
		//var yo = norms[vv+1];
		//var zo = norms[vv+2];
		
		newnorms.push(0);
		newnorms.push(0);
		newnorms.push(0);
		newnorms.push(0);
	}
	tballGridData.normals = newnorms;

})();
