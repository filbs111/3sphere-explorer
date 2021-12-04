var terrainSize=1024;	//expect will want something like 128x128. check that something larger faster to validate calculation at runtime. alternatively can load image. if will generate at runtime, want something to do deterministic random numbers (Math.random() is not deterministic!!)
var terrainSizeMinusOne=terrainSize-1;

var DIVISIONS=terrainSize*terrainSize/32768;	
					//256+ (257*257 verts +) do in multiple parts to stay under 2^16 index limit
					//currently, decause divisions must have containt integer number of terrain lines, and 
					// all divisions equal, 
					// terrainSize/ DIVISIONS must be int, so DIVISIONS must be a power of 2, at least
					// ((terrainSize/256)^2 ) *2 . 
					// TODO? switch to integer terrain lines size, allow drawing of remainder division (last division can be smaller)
console.log("terrain divisions: " + DIVISIONS);

var VERTS_PER_DIVISION = (terrainSize+1)*(terrainSize/DIVISIONS);


var loadHeightmapTerrain = function(terrainSize, cb){

    var terrainHeightData = new Array(terrainSize*terrainSize);

    //add a method onto array object. TODO terrain "class"?
    terrainHeightData.getxy = terrainHeightXY;

    var oReq = new XMLHttpRequest();
    oReq.open("GET", './data/terrain2/try1024.r16', true); //16 bit heightmap.
    oReq.responseType = "arraybuffer";

    var startTime = Date.now();

    oReq.onload = function (oEvent) {

        console.log("loaded terrain data. t= " + (Date.now()-startTime));

        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
            var sixteenBitArray = new Uint16Array(arrayBuffer);
            for (var ii = 0; ii < sixteenBitArray.byteLength; ii++) {
                terrainHeightData[ii] = 0.000005*sixteenBitArray[ii] - 0.2;
            }

            console.log("loaded terrain data into array. t= " + (Date.now()-startTime));
            cb(terrainHeightData);
            console.log("completed terrain callback func. t= " + (Date.now()-startTime));
        }
    };
    oReq.send(null);

    function terrainHeightXY(xx,yy){
        return terrainHeightData[xyindex(xx,yy)];
    }

    function xyindex(xx,yy){
        return (xx & terrainSizeMinusOne) + terrainSize*(yy & terrainSizeMinusOne);
    }
}


//below located in main.js in terrainTest project

//quadtree stuff
var terrainScene = (
    function(){
        var viewpointPos = {x:-100, y:0, z:0};
        var quadtree;
		var blockStrips;

		function setPos(xx,yy,zz){

			viewpointPos.x = xx;
			viewpointPos.y = yy;
			viewpointPos.z = zz;
			centrePos = [viewpointPos.x/terrainSize, viewpointPos.y/terrainSize, viewpointPos.z/terrainSize];
            quadtree = calculateQuadtree(viewpointPos, {xpos:0, ypos:0, size:terrainSize});

			//generate list of strips for drawing (combined blocks)
			blocksforscales = {};
			renderQuadtree(quadtree, generateBlockInfo);
			//console.log(blocksforscales);

			blockStrips = blockStripsFromBlockInfo(blocksforscales);
			// console.log(blockStrips);

			return quadtree;
		}

		//generate a list of strips covering consectutive quadtree blocks
		//note this code is inefficient, and is intended to test performance improvement of 
		//rendering consecutive blocks using single draw calls. optimise if works.
		//note that with square morph ranges, easy to calculate strips without use of quadtree data.
		//also, can extend strips up to morph ranges- no need to stick to quadtree...

		var blocksforscales;
		function generateBlockInfo(xpos,ypos,size){
			// console.log("in generateBlockInfo. blocksforscales = " + blockstrips)
			var combocoords = 1024*ypos + xpos;
			if (!blocksforscales[size]){
				blocksforscales[size]=[];
			}
			blocksforscales[size].push(combocoords);
		}
		function blockStripsFromBlockInfo(blocksforscales){
			var scales = Object.keys(blocksforscales);
			var blockStripsForScales={};
			for (var ss of scales){
				ss = Number.parseInt(ss);	//??
				// console.log(ss);
				var blockStripForThisScale=[];

				//show that not in convenient order
				// for (var cc of blocksforscales[ss]){
				// 	var xx = cc & 1023;
				// 	var yy = cc >> 10;
				// 	console.log("xx/ss: " + xx/ss + " , yy/ss: " + yy/ss);
				// }

				var arrayofcombocoords = blocksforscales[ss];
				for (var xx=0;xx<1024;xx+=ss){
					var currentline = false;
					for (var yy=0;yy<1024;yy+=ss){
						var combocoordidx = (yy<<10) + xx;
						if (arrayofcombocoords.indexOf(combocoordidx)!=-1){
							if (currentline){
								currentline.count++;
							}else{
								currentline = {combocoordstart:combocoordidx, count:1};
							}
						}else{
							if (currentline){
								blockStripForThisScale.push(currentline);
							}
							currentline = false;
						}
					}
					if (currentline){
						blockStripForThisScale.push(currentline);
					}
				}

				blockStripsForScales[ss] = blockStripForThisScale;
			}
			return blockStripsForScales;
		}

        return {
            getPos: function(){
                return viewpointPos;
            },
            getQuadtree: function(){
                return quadtree;
            },
			getBlockStrips: function(){
                return blockStrips;
            },
			setPos
        }
    }
)();


var doUponTerrainInitialised = function(terrainHeightData){

	timeLog("terrain initialisation callback");

	//this is a modified copy of data/gridData from 3sphere project
    // (above comment from terrainTest project. have copied back to 3sphere project. previous terrain "procTerrain" is elsewhere in this project)

	var gridData=(function generateGridData(gridSize){
		//TODO buffers should be include whether or not they are strip or triangle type. 
		//initially just do triangles. strip more efficient. for large grid, towards 1 vertex per triangle, rather than 3. (though indexed, so cost quite small)

		var vertices = new Array((gridSize+1)*(gridSize+1)*3);
		var grads = new Array((gridSize+1)*(gridSize+1)*2);	//might be able to use 2d gradient instead of 3d normal. perhaps normal quicker to use in shader though.
		var indices = [];
		//create vertices first. for 3-sphere grid, loops, so different (here have vertices on opposite sides (and 4 corners) that share z-position
		var vertex2dData= new Array(gridSize+1);
		var thisLine;

		var vertidx =0;
		for (var ii=0;ii<=gridSize;ii++){
			thisLine = new Array(gridSize+1);
			var lineidx =0;
			vertex2dData[ii]=thisLine;
			for (var jj=0;jj<=gridSize;jj++){
				vertices[vertidx++]=ii/gridSize;
				vertices[vertidx++]=jj/gridSize;
				//vertices.push(Math.random());	//TODO maybe shouldn't have z. z might be used for other stuff though eg water depth.
				
				// var height = terrainHeightData.getxy(ii & terrainSizeMinusOne,jj & terrainSizeMinusOne);
				var height = terrainHeightData[( ii & terrainSizeMinusOne) + terrainSize*(jj & terrainSizeMinusOne)];
				//height = Math.max(height,-0.1);	//raise deep parts to "sea" level. 
					//disable sea level because using normal map generated before this
				height = 0.15*height;
				thisLine[lineidx++]=height;
				
				vertices[vertidx++]=height;	
				//vertices.push(0.05*Math.sin(ii*0.1)*Math.sin(jj*0.1));
				//vertices.push(0.03*Math.random());
			}
		}

		timeLog("generated grid data part 1");

		//console.log(vertex2dData);
		//generate gradient/normal data.
		//note this is slower than code it replaces. DO NOT COMMIT!
		// try useing flat array instead of vertex2dData
		// or use separate loops for horiz, vertical grads 
		var gradidx =0;
		// var vertex2dDataII;
		
		for (var ii=0;ii<=gridSize;ii++){
			// var vertex2dDataII = vertex2dData[ii];
			// vertex2dDataIIplus = vertex2dData[(ii+1)&terrainSizeMinusOne];
			// vertex2dDataIIminus = vertex2dData[(ii-1)&terrainSizeMinusOne];

			for (var jj=0;jj<=gridSize;jj++){

				// grads[gradidx++]= vertex2dDataII[(jj+1) &terrainSizeMinusOne] - vertex2dDataII[(jj-1) &terrainSizeMinusOne];
				grads[gradidx++]=  vertex2dData[ii&terrainSizeMinusOne][(jj+1) &terrainSizeMinusOne] -  vertex2dData[ii&terrainSizeMinusOne][(jj-1) &terrainSizeMinusOne];
					//adding redundant &terrainSizeMinusOne appears to speed things up!

				grads[gradidx++]= vertex2dData[(ii+1)&terrainSizeMinusOne][jj&terrainSizeMinusOne] - vertex2dData[(ii-1)&terrainSizeMinusOne][jj&terrainSizeMinusOne];


			}
			// grads[gradidx++]= vertex2dDataIIplus[0] - vertex2dDataIIminus[0];
			//grads[gradidx]= vertex2dDataII[1] - vertex2dDataII[gridSize-1];
			//gradidx+=2;
		}
		timeLog("generated grid data grads part 1");

		// gradidx=1;
		// for (var jj=0;jj<=gridSize;jj++){
		// 	// var gradidx = gradidx;
		// 	var jwrap = jj&terrainSizeMinusOne;
		// 	for (var ii=0;ii<=gridSize;ii++){
		// 		grads[gradidx]= vertex2dData[(ii+1)&terrainSizeMinusOne][jwrap] - vertex2dData[(ii-1)&terrainSizeMinusOne][jwrap];
		// 		gradidx+=2;
		// 	}
		// }

		timeLog("generated grid data grads");

		//extra positions/grads for morphing LOD transition
		var morphverts=new Array(gridSize*gridSize*3);
		var morphgrads=new Array(gridSize*gridSize*2);
		var gridIdxV=0;
		var gridIdxG=0;

		for (var ii=0;ii<=gridSize;ii++){
			for (var jj=0;jj<=gridSize;jj++){
				var mapped = downsizePair(ii,jj);
				morphverts[gridIdxV++]=vertices[mapped*3];
				morphverts[gridIdxV++]=vertices[mapped*3+1];
				morphverts[gridIdxV++]=vertices[mapped*3+2];
				morphgrads[gridIdxG++]=grads[mapped*2];
				morphgrads[gridIdxG++]=grads[mapped*2+1];
			}
		}
		
		timeLog("generated grid data morph verts");

		//draw a strip of strips (big "strip" stripWidth wide, formed of gridSize* strips of stripWidth length, and width 1 )

		var stripWidth = terrainSize/DIVISIONS;	//strip of strips	
		var bottomOfRowIdx = 0;
		for (var jj=0;jj<gridSize;jj++){
			var idx = bottomOfRowIdx;
			indices.push(idx);	//1st in strip will be repeated
			for (var ii=0;ii<=stripWidth;ii++){
				indices.push(idx++);
				indices.push(idx);
				idx+=gridSize; //gridSize+1 = one row of verts
			}
			indices.push(idx-gridSize);	//repeat last in strip
			bottomOfRowIdx++;
		}

		timeLog("generated grid data strips");

        terrainScene.setPos(0,0,0); //TODO remove from here, do each frame

		return {vertices, grads, morphverts, morphgrads, indices};
	})(terrainSize);

	timeLog("generated grid data");

	initTerrain2Buffers(gridData);
	
	timeLog("initialised buffers");
}


var terrain2Buffer={};
function initTerrain2Buffers(sourceData){   //this is named initBuffers in terrainTest project. 
        //note some code redundancy w/ initBuffers in this project too.
	var bufferObj = terrain2Buffer;
		
	bufferObj.vertexPositionBuffer = gl.createBuffer();
	bufferArrayData(bufferObj.vertexPositionBuffer, sourceData.vertices, 3);
	bufferObj.vertexMorphBuffer = gl.createBuffer();
	bufferArrayData(bufferObj.vertexMorphBuffer, sourceData.morphverts, 3);

	bufferObj.vertexGradientBuffer = gl.createBuffer();
	bufferArrayData(bufferObj.vertexGradientBuffer, sourceData.grads, 2);
	bufferObj.vertexGradientMorphBuffer = gl.createBuffer();
	bufferArrayData(bufferObj.vertexGradientMorphBuffer, sourceData.morphgrads, 2);	

	bufferObj.vertexIndexBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferObj.vertexIndexBuffer);
	//sourceData.indices = [].concat.apply([],sourceData.faces);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData.indices), gl.STATIC_DRAW); 	//note uint16 limits to 256*256 verts
	bufferObj.vertexIndexBuffer.itemSize = 3;
	bufferObj.vertexIndexBuffer.numItems = sourceData.indices.length;

	bufferObj.isInitialised = true;

	function bufferArrayData(buffer, arr, size){
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
		buffer.itemSize = size;
		buffer.numItems = arr.length / size;
		console.log("buffered. numitems: " + buffer.numItems);
	}

}

function drawTerrain2(){
    //draw brute force (todo add cdlod option)
    //TODO put into standard duocylinder rendering functions

    var shaderProg = shaderPrograms.terrain_l3dt_simple;
    var bufferObj = terrain2Buffer;

    gl.useProgram(shaderProg);
    enableDisableAttributes(shaderProg);
    prepBuffersForDrawing(terrain2Buffer, shaderProg);

    bind2dTextureIfRequired(terrain2Texture);
    bind2dTextureIfRequired(terrain2TextureB, gl.TEXTURE1);
    bind2dTextureIfRequired(terrain2TextureNormals, gl.TEXTURE2);

    gl.uniform1i(shaderProg.uniforms.uSampler, 0);
	gl.uniform1i(shaderProg.uniforms.uSamplerB, 1);
	gl.uniform1i(shaderProg.uniforms.uSamplerNormals, 2);

    gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
	gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);


    //this is "bruteforenomorph" from terrainTest project
    for (var ii=0;ii<DIVISIONS;ii++){
        //TODO interleaved single buffer to avoid bindbuffer calls?
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, bufferObj.vertexPositionBuffer.itemSize , gl.FLOAT, false, 0, ii*12*VERTS_PER_DIVISION);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexGradientBuffer);
        gl.vertexAttribPointer(shaderProg.attributes.aVertexGradient, bufferObj.vertexGradientBuffer.itemSize, gl.FLOAT, false, 0, ii*8*VERTS_PER_DIVISION);
        
        gl.drawElements(gl.TRIANGLE_STRIP, bufferObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

}

function drawTerrain2BlockStrips(){
    
    var debugDarkeningMultiplier = 0.5; //just for testing. TODO get rid

    var shaderProg = shaderPrograms.terrain_l3dt_morph_4d_eff;
    var bufferObj = terrain2Buffer;

    gl.useProgram(shaderProg);
    enableDisableAttributes(shaderProg);
    prepBuffersForDrawing(terrain2Buffer, shaderProg);

    bind2dTextureIfRequired(terrain2Texture);
    bind2dTextureIfRequired(terrain2TextureB, gl.TEXTURE1);
    bind2dTextureIfRequired(terrain2TextureNormals, gl.TEXTURE2);

    gl.uniform1i(shaderProg.uniforms.uSampler, 0);
	gl.uniform1i(shaderProg.uniforms.uSamplerB, 1);
	gl.uniform1i(shaderProg.uniforms.uSamplerNormals, 2);

    gl.uniformMatrix4fv(shaderProg.uniforms.uPMatrix, false, pMatrix);
	gl.uniformMatrix4fv(shaderProg.uniforms.uMVMatrix, false, mvMatrix);


    var posxyz = terrainScene.getPos();
    var centrePos = [posxyz.x, posxyz.y, posxyz.z];

    // if (shaderProg.uniforms.uCentrePos){
		gl.uniform3fv(shaderProg.uniforms.uCentrePos, centrePos);
	// }
    
    // drawDebugResults = [];

    //TODO populate blockStrips before calling this.

    var blockStrips = terrainScene.getBlockStrips();
    var scales = Object.keys(blockStrips);
    for (var ss of scales){
        // if (ss!=32){continue;}
        var blocksForThisScale = blockStrips[ss];
        for (var strip of blocksForThisScale){
            var combocoordidx = strip.combocoordstart;
            var xx = combocoordidx & 1023;
            var yy = combocoordidx >> 10;
            glDrawBlock(xx, yy, Number.parseInt(ss), strip.count);

            // drawDebugResults.push({xx,yy,ss:Number.parseInt(ss),count:strip.count});
        }
    }

    
    function glDrawBlock(xpos,ypos,size, numblocks){
        drawBlock(size*32/terrainSize, xpos/size, ypos/size, numblocks);
    }

    function drawBlock(downsizeAmount, xx, yy, numblocks){
        if (!numblocks){numblocks=1;}

        gl.uniform1f(shaderProg.uniforms.uMorphScale, downsizeAmount/1024 );	//TODO draw blocks at each scale consecutively, so don't call this every block
        gl.uniform1f(shaderProg.uniforms.uDebugDarkeningMultiplier, debugDarkeningMultiplier);	//""

        var shiftAmount = downsizeAmount*(xx*VERTS_PER_DIVISION + yy*32);

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProg.attributes.aVertexPosition, bufferObj.vertexPositionBuffer.itemSize , gl.FLOAT, false, 12*downsizeAmount, 12*shiftAmount);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexMorphBuffer);
        gl.vertexAttribPointer(shaderProg.attributes.aVertexMorph, bufferObj.vertexMorphBuffer.itemSize , gl.FLOAT, false, 12*downsizeAmount, 12*shiftAmount);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexGradientBuffer);
        gl.vertexAttribPointer(shaderProg.attributes.aVertexGradient, bufferObj.vertexGradientBuffer.itemSize, gl.FLOAT, false, 8*downsizeAmount, 8*shiftAmount);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.vertexGradientMorphBuffer);
        gl.vertexAttribPointer(shaderProg.attributes.aVertexGradientMorph, bufferObj.vertexGradientMorphBuffer.itemSize, gl.FLOAT, false, 8*downsizeAmount, 8*shiftAmount);

        gl.drawElements(gl.TRIANGLE_STRIP, numblocks*bufferObj.vertexIndexBuffer.numItems/32, gl.UNSIGNED_SHORT, 0);
    }

}


var timeLog = (function(){

	var time = Date.now();

	return function(description){
		var timeNow = Date.now();
		console.log("time log for: " + description + " t=" + timeNow + " (+ " + (timeNow - time));
		time = timeNow;
	}
})();