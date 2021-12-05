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

var terrain2HeightData;
var loadHeightmapTerrain = function(terrainSize, cb){

    terrain2HeightData = new Array(terrainSize*terrainSize);

    //add a method onto array object. TODO terrain "class"?
    terrain2HeightData.getxy = terrainHeightXY;

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
                terrain2HeightData[ii] = 0.0000015*sixteenBitArray[ii] - 0.05;
            }

            console.log("loaded terrain data into array. t= " + (Date.now()-startTime));
            cb(terrain2HeightData);
            console.log("completed terrain callback func. t= " + (Date.now()-startTime));
        }
    };
    oReq.send(null);

    function terrainHeightXY(xx,yy){
        return terrain2HeightData[xyindex(xx,yy)];
    }

    function xyindex(xx,yy){
        return (xx & terrainSizeMinusOne) + terrainSize*(yy & terrainSizeMinusOne);
    }
}


//below located in main.js in terrainTest project

//quadtree stuff
var terrainScene = (
    function(){
        var viewpointPos={};
        var centrePos;
        var quadtree;
		var blockStrips;

		function setPos(xx,yy,zz){

			viewpointPos.x = xx*terrainSize;
			viewpointPos.y = yy*terrainSize;
			viewpointPos.z = zz*terrainSize;
			centrePos = [xx, yy, zz];
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
                return centrePos;
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

function drawTerrain2(wSettings){
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
	gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);

    gl.uniform4fv(shaderProg.uniforms.uFogColor, wSettings.localVecFogColor);

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

function drawTerrain2BlockStrips(wSettings){
    var debugDarkeningMultiplier = 0.0; //just for testing. TODO get rid

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
	gl.uniformMatrix4fv(shaderProg.uniforms.uMMatrix, false, mMatrix);

    gl.uniform4fv(shaderProg.uniforms.uFogColor, wSettings.localVecFogColor);

    var centrePos = terrainScene.getPos();

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

function updateTerrain2QuadtreeForCampos(positionForTerrainMapping){
    //calculate quadtree for terrain2
    //TODO only do this if that terrain type selected for this world?
    //extract position in unmapped terrain co-ordinates (z=height above terrain (or something like that, x,y are map coords))
    //TODO just use 4vec directly? see if makes maths easier.
    //TODO avoid repeating this for every cubemap face!

    var mapx = (Math.atan2(positionForTerrainMapping[0],positionForTerrainMapping[1])+duocylinderSpin)/(2*Math.PI);
    var mapy = Math.atan2(positionForTerrainMapping[2],positionForTerrainMapping[3])/(2*Math.PI);
    var mapz = (Math.atan2(
        Math.sqrt(positionForTerrainMapping[0]*positionForTerrainMapping[0]+positionForTerrainMapping[1]*positionForTerrainMapping[1]),
        Math.sqrt(positionForTerrainMapping[2]*positionForTerrainMapping[2]+positionForTerrainMapping[3]*positionForTerrainMapping[3])
    )/(2*Math.PI) - 0.25) * (-Math.PI*500); //note arbitrary 500 in quadtree_util
    terrainScene.setPos(mapx,mapy,mapz/terrainSize);
}


var timeLog = (function(){

	var time = Date.now();

	return function(description){
		var timeNow = Date.now();
		console.log("time log for: " + description + " t=" + timeNow + " (+ " + (timeNow - time));
		time = timeNow;
	}
})();


//functions mostly copy-pasted, renamed from procTerrain.js
//TODO reuse/generalise

function getHeightAboveTerrain2For4VecPos(vec){
	var multiplier = terrainSize/(2*Math.PI);	//TODO don't require enter same number here and elsewhere (gridSize)
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	var sineVal = (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]);
	sineVal = Math.max(Math.min(sineVal,1),-1);	//will be screwed if this is >1 / <-1 .
	
	var c = -0.5*Math.asin( sineVal );	//this height of 4vec that can be compared to landscape height
	
	//TODO interpolation across polygon. initially just reuse equation used to generate terrain grid data.
	//var aa=multiplier*decentMod(a,2*Math.PI);
	//var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	var aa=decentMod(multiplier*a, terrainSize);
	var bb=decentMod(multiplier*(b + duocylinderSpin),terrainSize);
	var h = 2*Math.PI*terrain2GetInterpHeightForAB(aa,bb);
	
	return c-h;
}

function terrain2GetInterpHeightForAB(aa,bb){
	
	if (aa!=aa || bb!=bb){
	//	console.log("NaN input to terrain2GetInterpHeightForAB");
		console.log(aa, bb);
		return -1;	//todo what should return here? (really should never get here, best to look at where this is called)
	}
	
	//interpolate height. currently this func used for realtime height detection and mesh creation, and this should make latter slower, but unimportant.
	var aaFloor = Math.floor(aa)%terrainSize;
	var bbFloor = Math.floor(bb)%terrainSize;
	
	var heights = terrain2GetFourHeights(aaFloor, bbFloor);
	
	var aaRemainder = aa-aaFloor;
	var bbRemainder = bb-bbFloor;
	
	return (1-aaRemainder)*((1-bbRemainder)*heights[0] + bbRemainder*heights[1]) +
									aaRemainder*((1-bbRemainder)*heights[2] + bbRemainder*heights[3]);
							//interpolation that assumes doubly ruled squares. TODO two triangles to match mesh
}

function terrain2GetFourHeights(aaFloor,bbFloor){
	var aaCeil = (aaFloor + 1)%terrainSize;
	var bbCeil = (bbFloor + 1)%terrainSize;
	
	//check for bad input
	//seems that NaN gets in here (aa,bb)
	if ( aaFloor<0 || bbFloor<0 || aaCeil<0 || bbCeil<0 || aaFloor>=terrainSize || bbFloor>=terrainSize || aaCeil>=terrainSize || bbCeil>=terrainSize){
	//	console.log("bad input!");
		console.log({aaFloor, bbFloor, aaCeil, bbCeil, terrainSize});
		return -1;	//returning this will cause problems.
	}
	
	return [terrain2GetHeight(aaFloor,bbFloor),terrain2GetHeight(aaFloor,bbCeil),terrain2GetHeight(aaCeil,bbFloor),terrain2GetHeight(aaCeil,bbCeil)];
}

function terrain2GetHeight(ii,jj){
	//detect out of bounds. ( have seen "terrainHeightData[ii] is undefined" error )
	if (ii<0 || jj<0 || ii>=terrainSize || jj>=terrainSize){
		console.log("out of bounds! " + ii + ", " + jj);
	}
	return terrain2HeightData[ii*terrainSize + jj];
}