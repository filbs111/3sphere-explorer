//loading .obj data and similar from files eg .obj, instead of generating json data from.obj files offline

function loadBuffersFromObjFile(bufferObj, location, cb, expectedVertLength=3){
    loadBuffersFromFile(bufferObj, location, cb, false, expectedVertLength, loadBuffersFromObjFileResponse);
}
function loadBuffersFromObj2Or3File(bufferObj, location, cb, expectedVertLength=3){
    loadBuffersFromFile(bufferObj, location, cb, false, expectedVertLength, loadBuffersFromObj2Or3Or5FileResponse);
}
function loadBuffersFromObj5File(bufferObj, location, cb, expectedVertLength=3){
    loadBuffersFromFile(bufferObj, location, cb, true, expectedVertLength, loadBuffersFromObj2Or3Or5FileResponse);
}

function loadConvexHullDataFromObjFile(chullObj, scale, location, expectedVertLength=3){
    loadBuffersFromFile(chullObj, location, x=>x , false, expectedVertLength, (chullObj, location, response, cb, expectedVertLength, indexDataIsDiffs) => {
        //load convex hull data.
        var sd = sourceDataFromObjFileResponse(response, expectedVertLength);

        var in_verts = arrayToGroups(sd.vertices, sd.vertices_len).map(xx=>xx.slice(0,3)); //AFAIK slice is redundant because vertices_len = 3
        var verts = in_verts.map(xx=>xx.map(cc=>cc*scale)).map(xx=>{
            xx.push(1);
            return normalise4(xx)});   //unit 4-vec vertices

        var in_faces = arrayToGroups(sd.indices, 3);

        var faces = [];
        var edgeGcs = [];
        var edgeVertIndices = [];   //only used to draw debug points at ends of a selected edge.
        in_faces.forEach(ff => {
            var facePoints = ff.map(ii=>verts[ii]);
            faces.push(normalise4(findOrthoVecByDiags(facePoints)));
            //edge great circles that are perpendicular to face, edge normal, and a point on edge. used for convex hull edge-edge separating axis tests (SAT)
		    //stored as 2 points on great circle PI/2 apart (quarter way around world along edge)
            for (ee=0;ee<3;ee++){
                var index1 = ee;
                var index2 = (ee+1)%3;
                if (ff[index1]>ff[index2]){   // to avoid edge duplicates. assumes closed mesh without edge splits.
                    var point1 = facePoints[index1];
                    var point2 = facePoints[index2];
                    edgeGcs.push([vectorSum4d(point1, point2), vectorDifference4d(point1, point2)].map(xx=>normalise4(xx)));
                        //NOTE could just point to one of existing verts and only introduce single new point here, but above formulation more readable.

                    edgeVertIndices.push([ff[index1], ff[index2]]);
                }
            }
        });

        chullObj.verts=verts;
        chullObj.faces=faces;
        chullObj.edgeGcs=edgeGcs;
        chullObj.edgeVertIndices=edgeVertIndices;
        chullObj.faceIndices=in_faces;  //only used for debug draw corners of selected face.

        chullObj.isLoaded = true;

        console.log({mssg:"convex hull data loaded from file " + location + " for scale " + scale, sd, chullObj});
    });
}

function loadBuffersFromFile(bufferObj, location, cb, indexDataIsDiffs, expectedVertLength, loaderFunc){
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", x => loaderFunc(bufferObj, location, x.target.response, cb, expectedVertLength, indexDataIsDiffs));
    oReq.open("GET", location);
    oReq.send();
}

function loadBuffersFromObjFileResponse(bufferObj, location, response, cb, expectedVertLength, indexDataIsDiffs){
    var sd = sourceDataFromObjFileResponse(response, expectedVertLength);
    cb(bufferObj, sd);  //loadBufferData
    bufferObj.isLoaded = true;  //should check this before drawing using these buffers (or set some initial dummy data)
}

function sourceDataFromObjFileResponse(response, expectedVertLength){
    //console.log(response);
    var lines = response.split("\n");
    console.log(lines.length);

    var verts = [];
    var norms = [];
    var uvs = [];
    var faces = [];

    for (var ll = 0; ll<lines.length ; ll++){
        var thisLine = lines[ll];
        var splitLine = thisLine.split(" ");
        var firstPart = splitLine[0];

        var floatArr = splitLine.slice(1).map((x)=>{return parseFloat(x)});
        //var floatArr = splitLine.slice(1);

        if (firstPart == 'v'){
            verts.push(floatArr);
            if (floatArr.length != expectedVertLength){
               alert("vertex vector size " + floatArr.length + ", but expected length "+expectedVertLength , floatArr);
            }
        }
        if (firstPart == 'vt'){
            uvs.push(floatArr);
            if (floatArr.length != 2){
                alert("vertex uv with length != 2", floatArr);
            }
        }
        if (firstPart == 'vn'){
            norms.push(floatArr);
            if (floatArr.length != 3){
                alert("vertex n with length != 3", floatArr);
            }
        }
        if (firstPart == 'f'){
            var indicesArr = splitLine.slice(1);
            if (indicesArr.length != 3){
                alert("indicesArr with length != 3", indicesArr);
            }
            faces.push(indicesArr);
        }
    }

    //face data in obj lists indices for position, uv, normals independently.
    //can change file format to describe "whole" vertices by referencing these independent parts, then describe faces referencing the "whole" vertices,
    //but for now just work with regular obj data. this maybe slower, and in some cases file size larger. 
    var vertsCount=0;
    var usedVerts={};
    var newVerts = [];
    var newFaces = [];

    for (var face of faces){
        var theseVerts = [];
        for (var vertInFace of face){
            var lookedupVertId = usedVerts[vertInFace];
            if (lookedupVertId != undefined){
                theseVerts.push(lookedupVertId);
            }else{
                newVerts.push(vertInFace.split("/").map(x=>x-1));  //notice subtracting 1 because obj starts counting from 1. 
                theseVerts.push(vertsCount);
                usedVerts[vertInFace] = vertsCount;
                vertsCount++;
            }
        }
        newFaces.push(theseVerts);
    }

    //produce in format returned by loadBlenderExport()
    var sourceData = {
        vertices: newVerts.map(x=>verts[x[0]]).flat(),
        vertices_len: expectedVertLength,   //not required if is 3 (normal)
        normals: newVerts.map(x=>norms[x[2]]).flat(),
        indices: newFaces.flat()
    };
    if (uvs.length > 0){
        sourceData.uvcoords = newVerts.map(x=>uvs[x[1]]).flat();
    }

    // console.log("Obj data:");
    // console.log(sourceData);

    return sourceData;
}

function loadBuffersFromObj2Or3Or5FileResponse(bufferObj, location, response, cb, expectedVertLength, indexDataIsDiffs){
    var sd = sourceDataFromObj2Or3Or5FileResponse(response, expectedVertLength, indexDataIsDiffs);
    cb(bufferObj, sd);  //loadBufferData
    bufferObj.isLoaded = true;  //should check this before drawing using these buffers (or set some initial dummy data)
}

function sourceDataFromObj2Or3Or5FileResponse(response, expectedVertLength, indexDataIsDiffs){
    //console.log(response);
    var lines = response.split("\n");
    console.log(lines.length);

    var expectedColoursLength = expectedVertLength-3;

    var hasVertexColours = (expectedColoursLength > 0);

    var positions = [];
    var colours = [];
    var norms = [];
    var uvs = [];
    var attrs=[];
    var faces = [];

    for (var ll = 0; ll<lines.length ; ll++){
        var thisLine = lines[ll];
        var splitLine = thisLine.split(" ");
        var firstPart = splitLine[0];
        
        var theRest = splitLine.slice(1);

        var floatArr = theRest.map((x)=>{return parseFloat(x)});
        
        if (firstPart == 'vp' || firstPart == 'v'){
            positions.push(floatArr);
            if (floatArr.length != 3){
               alert("vertex vector size " + floatArr.length + ", but expected length 3. ll = " + ll + JSON.stringify(floatArr));
            }
        }
        if (firstPart == 'vc'){
            colours.push(floatArr);
            if (floatArr.length != expectedColoursLength){
               alert("vertex colour vector size " + floatArr.length + ", but expected length "+ expectedColoursLength , floatArr);
            }
        }
        if (firstPart == 'vt'){
            uvs.push(floatArr);
            if (floatArr.length != 2){
                alert("vertex uv with length != 2", floatArr);
            }
        }
        if (firstPart == 'vn'){
            norms.push(floatArr);
            if (floatArr.length != 3){
                alert("vertex n with length != 3", floatArr, ll);
            }
        }
        if (firstPart == 'a'){
            attrs.push(theRest[0]); //only 1 element of array
        }
        if (firstPart == 'f'){
            faces.push(theRest);
        }
    }

    var newVerts = [];
    var newFaces = [];

    for (var vertInFace of attrs){
        newVerts.push(vertInFace.split("/").map(x=>parseInt(x)-1));  //subtracting 1 because obj starts counting from 1. 
    }

    for (var face of faces){
        newFaces.push(face.map(x=>parseInt(x)));    //using zero-indexed attributes.
    }

    if (indexDataIsDiffs){
        var currentIdx = 0;
        newFaces = newFaces.map(f => {
            currentIdx += f[0];
            return [currentIdx, f[1]+currentIdx, f[2]+currentIdx];
        });
    }

    var sourceData = {
        vertices: (hasVertexColours? 
            //halfway house - code that uses result expects vertex positions and colours to be stuck together.
            //TODO for symmetry (with normals, uvcoods...), separate 
            newVerts.map(x=> positions[x[0]].concat(colours[x[3]])).flat():
            newVerts.map(x=> positions[x[0]]).flat()
            ),
        vertices_len: expectedVertLength,   //not required if is 3 (normal)
        normals: newVerts.map(x=>norms[x[2]]).flat(),
        indices: newFaces.flat()
    };
    if (uvs.length > 0){
        sourceData.uvcoords = newVerts.map(x=>uvs[x[1]]).flat();
    }

    console.log("custom Obj data:");
    console.log(newVerts);
    console.log(sourceData);

    return sourceData;
}