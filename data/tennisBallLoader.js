
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

loadGridData(tballGridDataPantheonStyle, true);
loadGridData(terrainData, true);
loadGridData(proceduralTerrainData, true);

//map 3d point data to 4d points, wrapping square onto duocylinder
function loadGridData(toLoad, generateCollisionData){
	var verts = toLoad.vertices;
	var newverts = [];
	var tricoords = [];
	var gridVertdataLen = verts.length;
	console.log("tball vertexdata length = " + gridVertdataLen);

	var norms = toLoad.normals;
	var newnorms = [];
	var gridNormdataLen = norms.length;
	console.log("tball normals length = " + gridNormdataLen);
	
	var vertStep = toLoad.vertices_len ?? 3;

	for (var vv=0, nn=0;vv<gridVertdataLen;vv+=vertStep, nn+=3){
		var yo = verts[vv];
		var zo = verts[vv+1];
		var xo = verts[vv+2];
		
		var tricoord = [xo,yo,zo].map(xx=>xx/4);
		tricoord.forEach(tt => tricoords.push(tt));
		
		var outverts = get4vecfrom3vec(tricoord[0],tricoord[1],tricoord[2]);	//scale things down so can use 4x4 grid of these
		
		for (var cc=0;cc<4;cc++){
			newverts.push(outverts[cc]);
		}
		
		var ny = norms[nn];
		var nz = norms[nn+1];
		var nx = norms[nn+2];
		
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

	//add color info if loaded from model.
	if (toLoad.vertices_len == 6){
		var colorData = [];
		for (var vv=0;vv<gridVertdataLen;vv+=vertStep){
			colorData.push(verts[vv+3], verts[vv+4], verts[vv+5], 1);
		}
		toLoad.colors = colorData;
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
		
		for (var vv=0;vv<gridVertdataLen;vv+=vertStep){
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
	// var centre4vec = get4vecfrom3vec(0,0,0);
	// var xshift4vec = get4vecfrom3vec(0.01,0,0);
	// var yshift4vec = get4vecfrom3vec(0,0.01,0);
	// var zshift4vec = get4vecfrom3vec(0,0,0.01);
	
	// console.log("TESTING get4vecfrom3vec");
	// printDifference(centre4vec, centre4vec);
	// printDifference(centre4vec, xshift4vec);
	// printDifference(centre4vec, yshift4vec);
	// printDifference(centre4vec, zshift4vec);
	
	// function printDifference(v1,v2){
	// 	var vdifference = v1.map(function(elem, ii){return elem-v2[ii];});
	// 	console.log(Math.hypot.apply(null, vdifference));
	// }
	
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

	
	if (generateCollisionData){
		//console.log("num faces in obj: " + toLoad.faces.length);
		//generate collision data for triangles, like how doing for projected 3d->4d triangle meshes.
		
		var verts4d = arrayToGroups(newverts, 4);
		var facesAsTriVerts = toLoad.unstrippedFaces || toLoad.faces;	//procTerrain stores strips data in faces

		var allTris = facesAsTriVerts.

		//filter(triVerts => fourVecsDiffer(triVerts[0], triVerts[1]) && fourVecsDiffer(triVerts[0], triVerts[2])).
		map((triVerts, ii) => {			//look up transformed 4vec verts by index
			return makeAABBDataForTriangle4d(triVerts, ii, verts4d);
		});

		//filter bad tris, apparently degenerate tris with repeated verts (TODO remove earlier - ideally from object before loading!)
		allTris = allTris.filter(tri => !tri.isDegenerate);
		allTris.sort((a,b) => a.morton - b.morton);
		//TODO strip out morton once used for sort, since wastes memory.

		toLoad.collisionTriangleData = generateBvh(allTris, temp4vec, 8);

		toLoad.collisionTriangleData.getTriDataForFace = ((facesAsTriVerts, verts4d) => {

			var cache = new Map();	//TODO LRU cache (limited size). for now, just store everything.

			function getTriDataForFaceIndex(faceIdx){
				var cachedVal = cache.get(faceIdx);
				if (cachedVal){return cachedVal;}
				var calculatedVal = makeCollisionDataForTriangle4dNoAABB(facesAsTriVerts[faceIdx].map(vv => verts4d[vv]));
				cache.set(faceIdx, calculatedVal);
				return calculatedVal;
			}

			return getTriDataForFaceIndex;
		})(facesAsTriVerts, verts4d);	//don't really need to pass this in since accessible here, but will want if move function outside

	}

};

//will create collision data at runtime when testing collision vs tris, so only do what's necessary
// to create aabb.
function makeAABBDataForTriangle4d(vertIndices, faceIdx, verts4d){
	//TODO deduplicate aabb4DForLineAnalytic calls here (typically edges used for 2 tris)

	var triVerts = vertIndices.map(vv => verts4d[vv]);

	//combo aabbs for each line between verts
	var aabb = [triVerts[0],triVerts[0]];   //some point that will be in the final aabb
	for (ee=0;ee<3;ee++){
		edgeaabb = aabb4DForLineAnalytic(triVerts[ee],triVerts[(ee+1)%3]);
		aabb = combinedAABB4(aabb, edgeaabb);
	}

	//face, edges will not be returned from this function, but are used to create the AABB
	//TODO can this be simplified? do edges need to be like this for this purpose? 

	var face = findOrthoVecByDiags(triVerts);

	var edges = []; 
	for (ee=0;ee<3;ee++){
		edges.push(normalise4(findOrthoVecByDiags([triVerts[ee], triVerts[(ee+1)%3], face])));
	}

	var face = normalise4(face);

	//if all signs the same then do something
	for (cc=0;cc<4;cc++){
		var isPositive = edges.map(pv => pv[cc]>0 ? 1:0);
		if (isPositive[0]==isPositive[1] && isPositive[0]==isPositive[2]){
			var valueToAdd = Math.sqrt(1-face[cc]*face[cc]);  //or could sum other 3 squared components if want more robust (avoid sqrt -ve num)
			// console.log({cc, isPositive: isPositive[0], valueToAdd});
			aabb[1-isPositive[0]][cc] = isPositive[0]? -valueToAdd: valueToAdd;   //is sign to use here reliable? or is it just pot luck, depending on face winding order?
		}
	}

	return {
		faceIdx,
		vertIndices,
		AABB: aabb,
		isDegenerate: isNaN(face[0]),
		morton: morton4(triVerts[0])	//TODO use centre/average point?
	};
}


//copy of aabb4DForTriAnalytic from test project that also returns face, edge data
function makeCollisionDataForTriangle4d(triVerts){

	//combo aabbs for each line between verts
	var aabb = [triVerts[0],triVerts[0]];   //some point that will be in the final aabb
	for (ee=0;ee<3;ee++){
		edgeaabb = aabb4DForLineAnalytic(triVerts[ee],triVerts[(ee+1)%3]);
		aabb = combinedAABB4(aabb, edgeaabb);
	}

	//include extreme point if some condition true
	var face = findOrthoVecByDiags(triVerts);
	// console.log("checking orthogonality...");
	// checkOrthogonality(faceVec, triVerts);

	var edges = []; 
	for (ee=0;ee<3;ee++){
		edges.push(normalise4(findOrthoVecByDiags([triVerts[ee], triVerts[(ee+1)%3], face])));
	}

	//edge great circles that are perpendicular to face, edge normal, and a point on edge. used for convex hull edge-edge separating axis tests (SAT)
	//stored as 2 points on great circle PI/2 apart
	var edgeGcs = [];
	for (ee=0;ee<3;ee++){
		// var otherPoint = normalise4(findOrthoVecByDiags([face, edges[ee], triVerts[ee]]));
		// edgeGcs.push([triVerts[ee], otherPoint]);	//could avoid storing triVerts[ee] here since already know it from verts, but like this is more explicit
	
		var point1 = triVerts[ee];
		var point2 = triVerts[(ee+1)%3];
		edgeGcs.push([vectorSum4d(point1, point2), vectorDifference4d(point1, point2)].map(xx=>normalise4(xx))); //avoid expensive call to findOrthoVecByDiags.
		// 	// NOTE this generates 2 new 4vecs - between the verts and 90 deg along great circle, rather than just 1 new 4vec, reusing triVerts[ee]
			//probably could still calculate equivalent of otherPoint and reuse triVerts[ee] here for intermediate cost TODO?
	}

	var face = normalise4(face);

	//if all signs the same then do something
	for (cc=0;cc<4;cc++){
		var isPositive = edges.map(pv => pv[cc]>0 ? 1:0);
		if (isPositive[0]==isPositive[1] && isPositive[0]==isPositive[2]){
			var valueToAdd = Math.sqrt(1-face[cc]*face[cc]);  //or could sum other 3 squared components if want more robust (avoid sqrt -ve num)
			// console.log({cc, isPositive: isPositive[0], valueToAdd});
			aabb[1-isPositive[0]][cc] = isPositive[0]? -valueToAdd: valueToAdd;   //is sign to use here reliable? or is it just pot luck, depending on face winding order?
		}
	}
	
	return {
		verts:triVerts,
		face,
		edges,
		edgeGcs,
		AABB: aabb,
		morton: morton4(triVerts[0])	//TODO use centre/average point?
	};
}

function makeCollisionDataForTriangle4dNoAABB(triVerts){
	var face = findOrthoVecByDiags(triVerts);
	
	var edges = []; 
	for (ee=0;ee<3;ee++){
		edges.push(normalise4(findOrthoVecByDiags([triVerts[ee], triVerts[(ee+1)%3], face])));
	}
	// var edges = [
	// 	normalise4(findOrthoVecByDiags([triVerts[0], triVerts[1], face])),
	// 	normalise4(findOrthoVecByDiags([triVerts[1], triVerts[2], face])),
	// 	normalise4(findOrthoVecByDiags([triVerts[2], triVerts[0], face]))
	// ];

	//edge great circles that are perpendicular to face, edge normal, and a point on edge. used for convex hull edge-edge separating axis tests (SAT)
	//stored as 2 points on great circle PI/2 apart
	var edgeGcs = [];
	for (ee=0;ee<3;ee++){
		// var otherPoint = normalise4(findOrthoVecByDiags([face, edges[ee], triVerts[ee]]));
		// edgeGcs.push([triVerts[ee], otherPoint]);	//could avoid storing triVerts[ee] here since already know it from verts, but like this is more explicit
	
		var point1 = triVerts[ee];
		var point2 = triVerts[(ee+1)%3];
		edgeGcs.push([vectorSum4d(point1, point2), vectorDifference4d(point1, point2)].map(xx=>normalise4(xx))); //avoid expensive call to findOrthoVecByDiags.
		// 	// NOTE this generates 2 new 4vecs - between the verts and 90 deg along great circle, rather than just 1 new 4vec, reusing triVerts[ee]
			//probably could still calculate equivalent of otherPoint and reuse triVerts[ee] here for intermediate cost TODO?
	}

	var face = normalise4(face);

	return {
		verts:triVerts,
		face,
		edges,
		edgeGcs
	};
}