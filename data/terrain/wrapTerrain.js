//node script to process tileable object
//such that vertex normals on opposite sides of tile (that but up against eachother)
//are aligned. (assumes same smoothing group)

//for duocylinder wrap (1 tile=entire cylinder) could also combine these vertices for efficiency,
//but for simplicity, ability to use smaller tiles (eg 4 tiles to cover duocylinder), don't bother.

//load a file.
//deal with fact it could start with var myObjData = {...}

var filename = process.argv[2];

var fs = require('fs'),
    path = require('path'),    
    filePath = path.join(__dirname, filename);
	
fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        //console.log('received data: ' + data);
		
		var extractedData = data.match("{.*}$")[0];
		var parsedData = JSON.parse(extractedData);
		
		//console.log(parsedData.vertices);
		
		//find the most extreme vertex positions
		console.log(parsedData.vertices.length / 3);
		
		var verts = parsedData.vertices;
		var vdataLength = verts.length;
		console.log(vdataLength/3);
		
		var faces = parsedData.faces;
		var fdataLength = faces.length;
		console.log(fdataLength);	//faces are in arrays (waste of space FWIW)

		var texcoords = parsedData.texturecoords[0];
		console.log(texcoords.length/2);	//faces are in arrays (waste of space FWIW)

		var norms = parsedData.normals;
		console.log(norms.length/3);

		var smallestX = 100;
		var largestX=-100;
		var smallestY=100;
		var largestY=-100;
		var smallestZ=100;
		var largestZ=-100;
		for (var ii=0;ii<vdataLength;ii+=3){
			if (verts[ii]<smallestX){smallestX=verts[ii];}
			if (verts[ii]>largestX){largestX=verts[ii];}
			if (verts[ii+1]<smallestY){smallestY=verts[ii+1];}
			if (verts[ii+1]>largestY){largestY=verts[ii+1];}
			if (verts[ii+2]<smallestZ){smallestZ=verts[ii+2];}
			if (verts[ii+2]>largestZ){largestZ=verts[ii+2];}
		}
		console.log(smallestX);
		console.log(largestX);
		console.log(smallestY);
		console.log(largestY);
		console.log(smallestZ);
		console.log(largestZ);
		//shows that x,z are things that want to wrap (and go from -1 to 1)
		
		//a general solution would cope with jagged edges, and almost same values, 
		//but since this example is simple, can do in simple way.
		
		//just step through verts. see how many match (expect only pairs)
		
		console.log("---");
		
		var matchesCount=[0,0,0,0,0,0,0,0,0,0];
		var exactMatchesCount=[0,0,0,0,0,0,0,0,0,0];
		var exactMatchesWithUvCount=[0,0,0,0,0,0,0,0,0,0];
		var exactMatchesWithUvAndNormsCount=[0,0,0,0,0,0,0,0,0,0];
		
		for (var ii=0,pp=0;ii<vdataLength;ii+=3,pp+=2){
			var matches =0;
			var exactMatches =0;
			var exactMatchesWithUv =0;
			var exactMatchesWithUvAndNorms=0;
			//for (var jj=ii+3;jj<vdataLength;jj+=3){
			for (var jj=0;jj<vdataLength;jj+=3){
				if ( ((verts[ii] - verts[jj])%2 == 0) &&
						//((verts[ii+1] - verts[jj+1])%2 == 0) &&
						((verts[ii+2] - verts[jj+2])%2 == 0) ){
							matches++;
							
	//						console.log("match: " + ii/3 + ", " + jj/3 + ", " + verts[ii] + ", " + verts[jj] + ", " + verts[ii+2] + ", " + verts[jj+2]);
							
						}
			}
			
			for (var jj=0;jj<vdataLength;jj+=3){
				if ( ((verts[ii] - verts[jj]) == 0) &&
						((verts[ii+2] - verts[jj+2]) == 0) ){
							exactMatches++;	
						}
			}
			
			for (var jj=0,qq=0;jj<vdataLength;jj+=3,qq+=2){
				if ( ((verts[ii] - verts[jj]) == 0) &&
						((verts[ii+2] - verts[jj+2]) == 0) &&
						((texcoords[pp] - texcoords[qq]) == 0) &&
						((texcoords[pp+1] - texcoords[qq+1]) == 0)	){
							exactMatchesWithUv++;	
						}
			}
			
			for (var jj=0,qq=0;jj<vdataLength;jj+=3,qq+=2){
				if ( ((verts[ii] - verts[jj]) == 0) &&
						((verts[ii+2] - verts[jj+2]) == 0) &&
						((norms[ii] - norms[jj]) == 0) &&
						((norms[ii+1] - norms[jj+1]) == 0) &&
						((norms[ii+2] - norms[jj+2]) == 0) &&
						((texcoords[pp] - texcoords[qq]) == 0) &&
						((texcoords[pp+1] - texcoords[qq+1]) == 0)	){
							exactMatchesWithUvAndNorms++;	
						}
			}
			

			matchesCount[matches]++;
			exactMatchesCount[exactMatches]++;
			exactMatchesWithUvCount[exactMatchesWithUv]++;
			exactMatchesWithUvAndNormsCount[exactMatchesWithUvAndNorms]++;
			//if (matches>1){
	//			console.log(matches);
			//}
		}
		
		//console.log(parsedData.normals);
		//console.log(parsedData.faces);
		
       // response.writeHead(200, {'Content-Type': 'text/html'});
       // response.write(data);
       // response.end();
	   
	   		console.log("---");
		console.log(parsedData.vertices.length / 3);

		console.log(matchesCount);
		console.log(exactMatchesCount);
		console.log(exactMatchesWithUvCount);
		console.log(exactMatchesWithUvAndNormsCount);
	   
	   
	   
	   //go through faces and see how many times each vertex is used. 
	   //are any vertices unused?
		var vertUsage=[];
		for (var ff=0;ff<fdataLength;ff++){
			var	face = faces[ff];	
			for (var cc=0;cc<3;cc++){
				vertUsage[face[cc]] = (vertUsage[face[cc]] || 0) +1;
			}
		}
	    //console.log(vertUsage);
		//find unused faces
		var unusedVerts=0;
		for (var ii=0;ii<vdataLength;ii+=3){
			var vert = ii/3;
			if (vertUsage[vert]==0){
				unusedVerts++;
			}
	    }
	    console.log(unusedVerts);
		//there are no unused vertices!
		
		//therefore we can merge together vertices
		//to do this, go through verts, and create a mapping from old vert to new vert array.
		
		var newVertNext=0;
		var newVertList=[];
		var vertMapping={};
		
		for (var ii=0;ii<vdataLength;ii+=3){
			var oldVertNum = ii/3;
			if (vertMapping[oldVertNum]){continue;}
						
			//if (
			for (var jj=ii;jj<vdataLength;jj+=3){
				var oldVertNumJ = jj/3;
				if (vertMapping[oldVertNumJ]){continue;}

				if ( ((verts[ii] - verts[jj]) == 0) &&
						((verts[ii+2] - verts[jj+2]) == 0) ){
							vertMapping[oldVertNumJ]=newVertNext;
			
						}
			}
			newVertList.push(oldVertNum);
			//vertMapping[oldVertNum]=
			newVertNext++;
		}
		
		console.log(newVertNext);
		
		var newVerts = [];
		var newNorms = [];
		var newTexcoords = [];
		for (var vv=0;vv<newVertList.length;vv++){
			var oldPos = newVertList[vv]*3;
			newVerts.push(verts[oldPos]);
			newVerts.push(verts[oldPos+1]);
			newVerts.push(verts[oldPos+2]);
			
			newNorms.push(norms[oldPos]);
			newNorms.push(norms[oldPos+1]);
			newNorms.push(norms[oldPos+2]);
			
			var oldPosUv = newVertList[vv]*2;
			newTexcoords.push(texcoords[oldPosUv]);
			newTexcoords.push(texcoords[oldPosUv+1]);
		}
		console.log(newVerts.length/3);
		console.log(newNorms.length/3);
		console.log(newTexcoords.length/2);
		var newFaces = [];
		for (var ff=0;ff<fdataLength;ff++){
			var oldFace = faces[ff];
			var newFace = [];
			for (var cc=0;cc<3;cc++){
				newFace.push(vertMapping[oldFace[cc]]);
			}
			newFaces.push(newFace);
		}
		console.log(newFaces.length);
		
		
		
		
		
		
		//=======================================
		// now have deduplicated vertices. next up, smooth across wrapped edges
		//TODO
		var wrapMatchesCount=[0,0,0,0,0,0,0,0,0,0];
		var newVdataLength=newVerts.length;
		for (var ii=0;ii<newVdataLength;ii+=3){
			var wrapMatches =0;
			var matchedPosns=[];
			var normTotal=[0,0,0];
			
			for (var jj=0;jj<newVdataLength;jj+=3){
				
				if ( ((newVerts[ii] - newVerts[jj])%2 == 0) &&
						((newVerts[ii+1] - newVerts[jj+1])%2 == 0) &&
						((newVerts[ii+2] - newVerts[jj+2])%2 == 0) ){
							wrapMatches++;
							matchedPosns.push(jj);
							normTotal[0]+=newNorms[jj];
							normTotal[1]+=newNorms[jj+1];
							normTotal[2]+=newNorms[jj+2];
						}
			}
			
			if (wrapMatches!=1){
				//should average normals.
				normTotal[0]/=wrapMatches;
				normTotal[1]/=wrapMatches;
				normTotal[2]/=wrapMatches;
				//TODO normalise
				
				for (var pp=0;pp<matchedPosns.length;pp++){
					var posn = matchedPosns[pp];
					newNorms[posn] = normTotal[0];
					newNorms[posn+1] = normTotal[1];
					newNorms[posn+2] = normTotal[2];
				}
			}
			
			wrapMatchesCount[wrapMatches]++;
		}
		console.log(wrapMatchesCount);
		
		
		
		
		//write out a new object containing new arrays
		var newData = {
			vertices:newVerts,
			normals:newNorms,
			texturecoords:[newTexcoords],
			faces:newFaces
		}
		
		fs.writeFile(process.argv[2]+".deduped",JSON.stringify(newData));
		
		
		
    } else {
        console.log(err);
    }
});

