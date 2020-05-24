var quadData = {
	vertices: [-1,-1,0,-1,1,0,1,-1,0,1,1,0],
	normals: [0,0,1,0,0,1,0,0,1,0,0,1],	//TODO don't use this unless have to
	uvcoords: [0,0,0,1,1,0,1,1],
	indices: [0,2,1,1,2,3]	//TODO indexed strip for efficiency
};

var quadData2D = {	//2d version for use with billboards (probably makes next to no difference)
	vertices: [-1,-1,-1,1,1,-1,1,1].map(x=>x*0.001),
	vertices_len:2,
	indices: [0,2,1,1,2,3]
}