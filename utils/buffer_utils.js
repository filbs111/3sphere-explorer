function bufferArrayData(buffer, arr, size){
    bufferArrayDataGeneral(buffer, new Float32Array(arr), size);
}

function bufferArrayDataGeneral(buffer, arr, size){
   //console.log("size:" + size);
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
   buffer.itemSize = size;
   buffer.numItems = arr.length / size;
}

function bufferArraySubDataGeneral(buffer, offs, arr){
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   gl.bufferSubData(gl.ARRAY_BUFFER, offs, arr);
}

function loadBufferData(bufferObj, sourceData){

    bufferObj.vertexPositionBuffer = gl.createBuffer();
    bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, sourceData.vertices_len || 3);
    if (sourceData.uvcoords){
        bufferObj.vertexTextureCoordBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTextureCoordBuffer, sourceData.uvcoords, 2);
    }
    if (sourceData.velocities){	//for exploding objects
        bufferObj.vertexVelocityBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexVelocityBuffer, sourceData.velocities, 3);
    }
    if (sourceData.normals){
        bufferObj.vertexNormalBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexNormalBuffer, sourceData.normals, 3);
    }
    if (sourceData.tangents){
        bufferObj.vertexTangentBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTangentBuffer, sourceData.tangents, 3);
    }
    if (sourceData.binormals){
        bufferObj.vertexBinormalBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexBinormalBuffer, sourceData.binormals, 3);
    }
    bufferObj.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
    bufferObj.vertexIndexBuffer.itemSize = 3;
    bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;
}

function glBufferMatrixUniformDataForInstancedDrawing(sourceMatArr){
    //make a matrix buffer for instanced drawing of random boxes
    var numMats = sourceMatArr.length;
    var matrixF32Arr = new Float32Array(numMats*16);
    
    for (var ii=0,pp=0;ii<numMats;ii++,pp+=16){
        matrixF32Arr.set(sourceMatArr[ii], pp);
    }
    
    var matA = gl.createBuffer();
    bufferArrayDataGeneral(matA, matrixF32Arr, 16);
    
    return matA;
}

function createBuffersForInstancedDrawingFromList(container){
	matrixArrWithExtraElem = container.list.map(x=>x.matrix);
	matrixArrWithExtraElem.push(matrixArrWithExtraElem[0]);
		//extra element for "bendy" matrix interpolation instanced draw - 
		// matrix A goes from 0 to n-1, matrix B goes from 1 to n
	container.buffersForInstancedDrawing = glBufferMatrixUniformDataForInstancedDrawing(matrixArrWithExtraElem);
}