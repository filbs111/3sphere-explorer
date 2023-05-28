

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


function makeOctoSphereData(detail){
	//make an octohedron, normalise verts to sphere.
	//probably better than lat/long sphere.
	//regular indexed, but strips would work well.

	var vertexPositionData = [];
	var indexData = [];

	vertexPositionData.push(0);
	vertexPositionData.push(0);
	vertexPositionData.push(-detail);

	//diamond rings, so indices use buffer well (though might not matter)
	for (var ww=0;ww<detail;ww++){
		var hh = detail-ww-1;
		for (var ii=0;ii<ww;ii++){
			vertexPositionData.push(ii);
			vertexPositionData.push(ww-ii);
			vertexPositionData.push(-hh);
		}
		for (var ii=0;ii<ww;ii++){
			vertexPositionData.push(ww-ii);
			vertexPositionData.push(-ii);
			vertexPositionData.push(-hh);
		}
		for (var ii=0;ii<ww;ii++){
			vertexPositionData.push(-ii);
			vertexPositionData.push(ii-ww);
			vertexPositionData.push(-hh);
		}
		for (var ii=0;ii<ww;ii++){
			vertexPositionData.push(ii-ww);
			vertexPositionData.push(ii);
			vertexPositionData.push(-hh);
		}
	}

	
	var innerStart = 0;
	var outerStart = 1;
	var innerRingSize = 1;
	for (var ww=1;ww<detail;ww++){
		var innerOffs = 0;
		var outerOffs = 0;
		//innerRingSize goes 1,4,8,16,... - how to generalise?
		var outerRingSize = ww*4;
		for (var ss=0;ss<4;ss++){
			for (var ii=1;ii<ww;ii++){
				indexData.push(innerStart + innerOffs);
				indexData.push(outerStart + outerOffs);
				outerOffs= (outerOffs+1)%outerRingSize;
				indexData.push(outerStart + outerOffs);
				indexData.push(innerStart + innerOffs);

				innerOffs= (innerOffs+1)%innerRingSize;

				indexData.push(outerStart + outerOffs);
				indexData.push(innerStart + innerOffs);
			}
			indexData.push(innerStart + innerOffs);
			indexData.push(outerStart + outerOffs);
			outerOffs= (outerOffs+1)%outerRingSize;
			indexData.push(outerStart + outerOffs);
		}

		innerRingSize = outerRingSize;
		innerStart = outerStart;
		outerStart +=outerRingSize;
	}

	
	//improve consistency of spacing? TODO confirm/investigate...
	for (var idx=0; idx<vertexPositionData.length; idx++){
		//note this can be done with LUT with detail values in
		vertexPositionData[idx] = Math.sin((vertexPositionData[idx]/detail)*Math.PI/2);
	}

	//normalise vertex data 
	for (var idx=0; idx<vertexPositionData.length; idx+=3){
		var xx = vertexPositionData[idx];
		var yy = vertexPositionData[idx+1];
		var zz = vertexPositionData[idx+2];
		var mag = Math.sqrt(xx*xx + yy*yy + zz*zz);
		vertexPositionData[idx]/=mag;
		vertexPositionData[idx+1]/=mag;
		vertexPositionData[idx+2]/=mag;
	}

	//just make an inverted copy for other half - means that verts around equator are duplicated, but unimportant
	// ... if want more efficiency, could draw multiple instances of a half or octant.
	var vertDataLenInitial = vertexPositionData.length;
	for (var ii=0;ii<vertDataLenInitial;ii++){
		vertexPositionData.push( ii%3 ? -vertexPositionData[ii] : vertexPositionData[ii]);
	}
	var idxDataLenInitial = indexData.length;
	for (var ii=0;ii<idxDataLenInitial;ii++){
		indexData.push(indexData[ii]+vertDataLenInitial/3);
	}

	//make normal data a copy of position data. (TODO omit this? unnecessary for portal.)
	var normalData = vertexPositionData.map(x=>x);

	return {
		vertices: vertexPositionData,
		normals: normalData,
		//uvcoords: textureCoordData,
		indices:indexData
	}
}