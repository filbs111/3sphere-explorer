//this probably has a official maths name.
//basically it's the result of scaling up a cylinder that's a fixed distance from, say, x*x + y*y =1, until it separates the 3-sphere into 2 equal volumes (if keep on going, get to z*z + w*w =1)
//TODO have a slider for this, and a shader to blend between the two extremes 
//TODO pass in a parameter for general making "cylinders" with a number of bands in each direction

var tennisBallData = (function(){
	
	var vertexPositionData = [];
	var normalData = [];
	var textureCoordData = [];
	var indexData = [];

	var abands =32;	//x and y aren't really related to the 4-dimensional space. really should be xy and wz
	var bbands =32;
	
	//indices. note would be more performant to use indexed vertex strips, but not that much in it.
	//basically a grid.
	for (var ii=0;ii<abands;ii++){
		for (var jj=0;jj<bbands;jj++){
			var iip = ii+1;
			var jja = jj*(abands+1);
			var jjpa = jja+abands+1;
			indexData.push( ii + jja);	//1st triangle in quad
			indexData.push( iip + jja);
			indexData.push( ii + jjpa);
			
			indexData.push( ii + jjpa);	//2nd triangle in quad
			indexData.push( iip + jja);
			indexData.push( iip + jjpa);
		}
	}
	
	//vertices. (note could simiplify this since abands=bbands, but may want them to be different later )
	var xvalues = [];
	var yvalues = [];
	
	var zvalues = [];
	var wvalues = [];
	
	var increment, ang, ang2;
	
	var cylRadius = 0.5 * (Math.PI/2);	//0-90 degrees . 45 degrees divides 3sphere in two
	var cosCylRadius = Math.cos(cylRadius);
	var sinCylRadius = Math.sin(cylRadius);
	
	for (var ii=0, ang=0, increment=Math.PI * 2.0 / abands; ii<=abands;ii++,ang+=increment){
		xvalues.push(cosCylRadius * Math.sin(ang));
		yvalues.push(cosCylRadius * Math.cos(ang));
	}
	for (var ii=0, ang=0, increment=Math.PI * 2.0 / bbands;ii<=bbands;ii++,ang+=increment){
		zvalues.push(sinCylRadius * Math.sin(ang));
		wvalues.push(sinCylRadius * Math.cos(ang));
	}
	
	var x, y, z, w;
	for (var ii=0;ii<=abands;ii++){
		x = xvalues[ii];
		y = yvalues[ii];
		for (var jj=0;jj<=bbands;jj++){
			vertexPositionData.push(x);
			vertexPositionData.push(y);
			vertexPositionData.push(zvalues[jj]);
			vertexPositionData.push(wvalues[jj]);
			
			//assuming divides space in 2, 90 deg around world is opposite point on cylinder
			//define this as the normal.
			
			normalData.push(-x);
			normalData.push(-y);
			normalData.push(zvalues[jj]);
			normalData.push(wvalues[jj]);
			
			textureCoordData.push(4*ii/abands);	//these can be precalculated to avoid division every time. 4* is so repeat texture 4 times
			textureCoordData.push(4*jj/bbands);
		}
	}
	
	return {
			vertices: vertexPositionData,
			normals: normalData,
			uvcoords: textureCoordData,
			indices:indexData
	}
})();