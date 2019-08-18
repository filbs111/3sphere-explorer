var hyperboloidData = (function generateHyperboloidData({top,bottom,topRad,bottomRad,rotation,divisions}){
	//TODO strip data, but do as simple indexed first
	//TODO grid data instead of twisted to avoid "screwlike" shading artifacts
	var innerTopRad = topRad-0.01;
	var innerBottomRad = bottomRad-0.01;
	
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
		normals.push(Math.sin(angle));
		normals.push(Math.cos(angle));
		normals.push(0);
		normals.push(Math.sin(angle+rotation));
		normals.push(Math.cos(angle+rotation));
		normals.push(0);
		
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
		normals.push(-Math.sin(angle));
		normals.push(-Math.cos(angle));
		normals.push(0);
		normals.push(-Math.sin(angle+rotation));
		normals.push(-Math.cos(angle+rotation));
		normals.push(0);
		
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
	
	return {
		vertices:vertices,
		normals:normals,
		indices:indices
	}
	
})({
	top:0.1,
	bottom:-0.1,
	topRad:0.08,
	bottomRad:0.1,
	rotation:-Math.PI/2,
	divisions:48
});