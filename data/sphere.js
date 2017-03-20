

//drawing a sphere.
//from http://learningwebgl.com/cookbook/index.php/How_to_draw_a_sphere

function makeSphereData(latitudeBands,longitudeBands, radius){
	
	var vertexPositionData = [];
	var normalData = [];
	var textureCoordData = [];
	
	//this appears do duplicate vertices along seem but what the hey
	//to do this properly probably should just make a geosphere and subdivide
	//eg http://www.html5gamedevs.com/topic/17786-icosphere-20-sides-polyhedron-uv-subdivide-smoothflat-normals/
	for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		var theta = latNumber * Math.PI / latitudeBands;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);
		
		for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
		 var phi = longNumber * 2 * Math.PI / longitudeBands;
		 var sinPhi = Math.sin(phi);
		 var cosPhi = Math.cos(phi);
		
		 var x = cosPhi * sinTheta;
		 var y = cosTheta;
		 var z = sinPhi * sinTheta;
		 var u = 1- (longNumber / longitudeBands);
		 var v = latNumber / latitudeBands;
		
		 normalData.push(x);
		 normalData.push(y);
		 normalData.push(z);
		 textureCoordData.push(u);
		 textureCoordData.push(v);
		 vertexPositionData.push(radius * x);
		 vertexPositionData.push(radius * y);
		 vertexPositionData.push(radius * z);
	   }
	}

	var indexData = [];
	 for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
	   for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
		 var first = (latNumber * (longitudeBands + 1)) + longNumber;
		 var second = first + longitudeBands + 1;
		 indexData.push(first);
		 indexData.push(first + 1);
		 indexData.push(second);
		 indexData.push(second);
		 indexData.push(first + 1);
		 indexData.push(second + 1);
	   }
	}
	
	return {
			vertices: vertexPositionData,
			normals: normalData,
			//uvcoords: textureCoordData,
			indices:indexData
	}
}