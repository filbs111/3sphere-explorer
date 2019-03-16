var gridData=(function generateGridData(){
	//TODO buffers should be include whether or not they are strip or triangle type. 
	//initially just do triangles. strip more efficient. for large grid, towards 1 vertex per triangle, rather than 3. (though indexed, so cost quite small)

	var gridSize = 32;
	var vertices = [];
	var indices = [];
	//create vertices first. for 3-sphere grid, loops, so different (here have vertices on opposite sides (and 4 corners) that share z-position
	for (var ii=0;ii<=gridSize;ii++){
		for (var jj=0;jj<=gridSize;jj++){
			vertices.push(ii/gridSize);			//TODO how to push multiple things onto an array? 
			vertices.push(jj/gridSize);
			//vertices.push(Math.random());	//TODO maybe shouldn't have z. z might be used for other stuff though eg water depth.
		}
	}
	//TODO strip data, but regular tris data easier.
	var startIdx=0;
	var nextRowStartIdx = gridSize+1;
	for (var ii=0;ii<gridSize;ii++){
		for (var jj=0;jj<gridSize;jj++){
			indices.push(startIdx);
			indices.push(nextRowStartIdx);
			indices.push(nextRowStartIdx+1);
			
			indices.push(startIdx);
			indices.push(nextRowStartIdx+1);
			indices.push(startIdx+1);
			
			startIdx++;
			nextRowStartIdx++;
		}
		startIdx+=1;
		nextRowStartIdx+=1;
	}
	return {vertices:vertices, indices:indices};
})();
