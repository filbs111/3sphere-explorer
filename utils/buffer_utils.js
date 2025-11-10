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
    
    bufferObj.use32BitIndices = sourceData.vertices.length > sourceData.vertices_len * 65536;

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferObj.use32BitIndices? new Uint32Array(sourceData.indices): new Uint16Array(sourceData.indices), gl.STATIC_DRAW);
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

function glBuffer3VecsForInstancedDrawing(input3VecArr){
    var num3Vecs = input3VecArr.length;
    var f32Arr = new Float32Array(num3Vecs*3);
    for (var ii=0,pp=0;ii<num3Vecs;ii++,pp+=3){
        f32Arr.set(input3VecArr[ii], pp); //TODO check this works - copied matrix code, but glmatrices are f32 already
    }
    var buf = gl.createBuffer();
    bufferArrayDataGeneral(buf, f32Arr, 3);
    return buf;
}
//TODO generalise glBufferMatrixUniformDataForInstancedDrawing, glBuffer3VecsForInstancedDrawing

function createBuffersForInstancedDrawingFromList(container){
	matrixArrWithExtraElem = container.list.map(x=>x.matrix);
	matrixArrWithExtraElem.push(matrixArrWithExtraElem[0]);
		//extra element for "bendy" matrix interpolation instanced draw - 
		// matrix A goes from 0 to n-1, matrix B goes from 1 to n
	container.buffersForInstancedDrawing = glBufferMatrixUniformDataForInstancedDrawing(matrixArrWithExtraElem);
}

function loadDuocylinderBufferData(bufferObj, sourceData){
    bufferObj.vertexPositionBuffer = gl.createBuffer();

    bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, 4);
    bufferObj.normalBuffer = gl.createBuffer();
    bufferArrayData(bufferObj.normalBuffer, sourceData.normals, 4);
    
    if (sourceData.colors){
        //alert("loading with colours. colors length : " + sourceData.colors.length);
        //alert("vertices length : " + sourceData.vertices.length);
        bufferObj.vertexColorBuffer = gl.createBuffer();
        bufferArrayData(bufferObj.vertexColorBuffer, sourceData.colors, 4);
    }
    if (sourceData.uvcoords || sourceData.texturecoords){
        bufferObj.vertexTextureCoordBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTextureCoordBuffer, sourceData.uvcoords || sourceData.texturecoords[0], 2);	//handle inconsistent formats
    }
    if (sourceData.tricoords){
        bufferObj.vertexTriCoordBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTriCoordBuffer, sourceData.tricoords, 3);
    }
    if (sourceData.trinormals){
        bufferObj.vertexTriNormalBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTriNormalBuffer, sourceData.trinormals, 3);
    }
    
    if (sourceData.tangents){
        bufferObj.vertexTangentBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexTangentBuffer, sourceData.tangents, 4);
    }
    if (sourceData.binormals){
        bufferObj.vertexBinormalBuffer= gl.createBuffer();
        bufferArrayData(bufferObj.vertexBinormalBuffer, sourceData.binormals, 4);
    }
    
    bufferObj.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
    if (Array.isArray(sourceData.faces[0])){	//if faces is an array of length 3 arrays
        sourceData.indices = sourceData.faces.flat();
    } else {									//faces is just a set of indices - used for procTerrain indexed strips. TODO maybe don't use "faces"
        sourceData.indices = sourceData.faces;
    }

    bufferObj.use32BitIndices = sourceData.vertices.length > 4 * 65536;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferObj.use32BitIndices? new Uint32Array(sourceData.indices): new Uint16Array(sourceData.indices), gl.STATIC_DRAW);

    bufferObj.vertexIndexBuffer.itemSize = 3;
    bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;

    bufferObj.isLoaded = true;

     console.log({
        mssg:"dc data",
        sourceData,
        bufferObj
    });
}