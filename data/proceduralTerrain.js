var proceduralTerrainData = (function generateGridData(gridSize){
	var terrainSizeMinusOne=gridSize-1;
	//TODO buffers should be include whether or not they are strip or triangle type. 
	//initially just do triangles. strip more efficient. for large grid, towards 1 vertex per triangle, rather than 3. (though indexed, so cost quite small)

	var vertices = [];
	var normals = [];	//might be able to use 2d gradient instead of 3d normal. for consistency with other shaders just use 3vec
	var indices = [];
	var uvcoords=[];
	//create vertices first. for 3-sphere grid, loops, so different (here have vertices on opposite sides (and 4 corners) that share z-position
	var vertex2dData=[];
	var thisLine;
	for (var ii=0;ii<gridSize;ii++){
		thisLine = [];
		vertex2dData.push(thisLine);
		for (var jj=0;jj<gridSize;jj++){
			vertices.push(4*ii/gridSize);			//TODO how to push multiple things onto an array? 
			
			//egg box
			var tmpsf = 2*Math.PI*10/gridSize;
			var height = 0.07*Math.sin(ii*tmpsf)*Math.sin(jj*tmpsf);
			//var height = 0.02*Math.sin(jj*tmpsf);
			
			height = 2*Math.max(height,-0.1);	//raise deep parts to "sea" level
			thisLine.push(height);
			
			vertices.push(height);	
			vertices.push(4*jj/gridSize);	//moved to last - guess this is how laid other models out...
			
		}
	}

	//generate gradient/normal data.
	var nx,nz,ninvmag;
	var twiceSquareSize = 8/gridSize;
	for (var ii=0;ii<gridSize;ii++){
		for (var jj=0;jj<gridSize;jj++){
			nx= -vertex2dData[(ii+1)&terrainSizeMinusOne][jj] + vertex2dData[(ii-1)&terrainSizeMinusOne][jj];
			nz= -vertex2dData[ii][(jj+1)&terrainSizeMinusOne] + vertex2dData[ii][(jj-1)&terrainSizeMinusOne];
			nx/=twiceSquareSize;
			nz/=twiceSquareSize;
			invmag = 1/Math.sqrt(1+nx*nx+nz*nz);
			normals.push(invmag*nx);
			normals.push(invmag);
			normals.push(invmag*nz);
			
			//tmp - for use in existing shader, requires some uv coord. since grid will wrap, this is not ideal - might reproject texture later, but for time being, just stick something here.
			uvcoords.push(8*ii/gridSize);
			uvcoords.push(8*jj/gridSize);
		}
	}
	
	//TODO strip data, but regular tris data easier.
	for (var ii=0;ii<gridSize;ii++){	//TODO join up. (missing one row and column currently
		for (var jj=0;jj<gridSize;jj++){
			indices.push(lookupIndex(ii,jj));
			indices.push(lookupIndex(ii+1,jj+1));
			indices.push(lookupIndex(ii,jj+1));
			
			indices.push(lookupIndex(ii,jj));
			indices.push(lookupIndex(ii+1,jj));
			indices.push(lookupIndex(ii+1,jj+1));
		}
	}
	
	//this is a inefficient but comprehension more important. should swap to indexed strips anyway.
	function lookupIndex(xx,yy){
		return (xx&terrainSizeMinusOne)+gridSize*(yy&terrainSizeMinusOne)
	}
	return {vertices:vertices, normals:normals, uvcoords:uvcoords, faces:indices};
})(256);
