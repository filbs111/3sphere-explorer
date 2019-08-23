var hyperboloidData = (function generateHyperboloidData({top,bottom,topRad,bottomRad,rotation,divisions}){
	//TODO strip data, but do as simple indexed first
	//TODO grid data instead of twisted to avoid "screwlike" shading artifacts
	var innerTopRad = topRad-0.005;
	var innerBottomRad = bottomRad-0.005;
	
	var cRotation = Math.cos(rotation);
	
	//precalculation for collision checking
	var topRadSq = topRad*topRad;
	var bottomRadSq = bottomRad*bottomRad;
	var twoCRotBottomRadTopRad = 2*cRotation*topRad*bottomRad;
	var topMinusBottom = top-bottom;
	
	//to find normal to surface, consider the two straight lines on surface that cross at the point of interest
	//for example, at bottom
	// (bottomRad,0,bottom)
	// lines go to 2 points: 
	// (cos(rotation)*topRad, (+/-)sin(rotation)*topRad, top)
	//which have centre point
	// (cos(rotation)*topRad, 0, top)
	// taking the difference -> vector
	// cos(rotation)*topRad - bottomRad ,0,top-bottom
	// => normal : normalize( -(top-bottom),0, cos(rotation)*topRad - bottomRad);
	
	//note using same for normals inside and outside bar sign, because almost the same. (really should use inner radii for calculation)
	
	var bottomNormRadial = top-bottom;
	var bottomNormUp = bottomRad-cRotation*topRad;
	var mag = Math.sqrt(bottomNormRadial*bottomNormRadial + bottomNormUp*bottomNormUp);
	bottomNormRadial/=mag;
	bottomNormUp/=mag;
	//console.log("bottomNormRadial="+bottomNormRadial);
	//console.log("bottomNormUp="+bottomNormUp);
	
	var topNormRadial = top-bottom;
	var topNormUp = cRotation*bottomRad-topRad;
	var mag = Math.sqrt(topNormRadial*topNormRadial + topNormUp*topNormUp);
	topNormRadial/=mag;
	topNormUp/=mag;
	//console.log("topNormRadial="+topNormRadial);
	//console.log("topNormUp="+topNormUp);
	
	var vertices=[];
	var normals=[];
	var indices=[];
	var idx=0;
	var numverts = 2*divisions;	//per part - inner, outer, rim
	var angle = 0;
	var angleStep = 2*Math.PI/divisions;
	for (var ii=0;ii<divisions;ii++){
		vertices.push(topRad*Math.sin(angle));
		vertices.push(topRad*Math.cos(angle));
		vertices.push(top);
		vertices.push(bottomRad*Math.sin(angle+rotation));
		vertices.push(bottomRad*Math.cos(angle+rotation));
		vertices.push(bottom);
		
		//TODO proper normals . for now, zero z component
		normals.push(topNormRadial*Math.sin(angle));
		normals.push(topNormRadial*Math.cos(angle));
		normals.push(topNormUp);
		normals.push(bottomNormRadial*Math.sin(angle+rotation));
		normals.push(bottomNormRadial*Math.cos(angle+rotation));
		normals.push(bottomNormUp);
		
		indices.push(idx);
		indices.push((idx+2)%numverts);
		indices.push((idx+1)%numverts);
		
		indices.push((idx+1)%numverts);
		indices.push((idx+2)%numverts);
		indices.push((idx+3)%numverts);
		
		idx+=2;
		angle+=angleStep;
	}
	
	idx=0;
	//inner faces/vertices
	for (var ii=0;ii<divisions;ii++){
		vertices.push(innerTopRad*Math.sin(angle));
		vertices.push(innerTopRad*Math.cos(angle));
		vertices.push(top);
		vertices.push(innerBottomRad*Math.sin(angle+rotation));
		vertices.push(innerBottomRad*Math.cos(angle+rotation));
		vertices.push(bottom);
		
		//TODO proper normals . for now, zero z component
		normals.push(-topNormRadial*Math.sin(angle));
		normals.push(-topNormRadial*Math.cos(angle));
		normals.push(-topNormUp);
		normals.push(-bottomNormRadial*Math.sin(angle+rotation));
		normals.push(-bottomNormRadial*Math.cos(angle+rotation));
		normals.push(-bottomNormUp);
		
		indices.push(numverts+idx);
		indices.push(numverts+(idx+1)%numverts);
		indices.push(numverts+(idx+2)%numverts);
		
		indices.push(numverts+(idx+1)%numverts);
		indices.push(numverts+(idx+3)%numverts);
		indices.push(numverts+(idx+2)%numverts);
		
		idx+=2;
		angle+=angleStep;
	}
	
	//upper rim
	idx=0;
	var offs = 2*numverts;
	for (var ii=0;ii<divisions;ii++){
		vertices.push(innerTopRad*Math.sin(angle));
		vertices.push(innerTopRad*Math.cos(angle));
		vertices.push(top);
		vertices.push(topRad*Math.sin(angle));
		vertices.push(topRad*Math.cos(angle));
		vertices.push(top);
		
		normals.push(0);
		normals.push(0);
		normals.push(1);
		normals.push(0);
		normals.push(0);
		normals.push(1);
		
		indices.push(offs+idx);
		indices.push(offs+(idx+2)%numverts);
		indices.push(offs+(idx+1)%numverts);
		
		indices.push(offs+(idx+1)%numverts);
		indices.push(offs+(idx+2)%numverts);
		indices.push(offs+(idx+3)%numverts);
		
		idx+=2;
		angle+=angleStep;
	}
	
	
	function collisionCheck(pos3vec){
		//takes position in frame of hyperbola. returns if inside shape.
		//3vec calculated by matrix rotation of world position by matrix for hyperbola object in question
		//then projecting onto 3d, normalising by scale of object.
		//TODO early bounding sphere check
		//todo OO
		
		//temporary approx cylinder collision
		if (pos3vec[2]>top){
			return false;
		}
		if (pos3vec[2]<bottom){
			return false;
		}
		
		var adjustedZ = (pos3vec[2]-bottom) / topMinusBottom;
		var oneMAdjustedZ = 1- adjustedZ;
		
		var aPointAtHeightSq = oneMAdjustedZ*oneMAdjustedZ*bottomRadSq + adjustedZ*adjustedZ*topRadSq + 
							adjustedZ*oneMAdjustedZ*twoCRotBottomRadTopRad;
		
		var xySq = pos3vec[0]*pos3vec[0] + pos3vec[1]*pos3vec[1];
		if (xySq>aPointAtHeightSq){	//simple cylinder check
			return false;
		}
		//console.log("collising with hyperbola " + JSON.stringify(pos3vec));
		return true;
	}
	
	return {
		vertices:vertices,
		normals:normals,
		indices:indices,
		colCheck:collisionCheck
	}
	
})({
	top:0.1,
	bottom:-0.1,
	topRad:0.08,
	bottomRad:0.1,
	rotation:-Math.PI/2,
	divisions:48
});