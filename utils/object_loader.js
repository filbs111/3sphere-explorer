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
function loadBuffersFromFile(bufferObj, location, cb, indexDataIsDiffs, expectedVertLength, loaderFunc){
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", x => loaderFunc(bufferObj, x.target.response, cb, expectedVertLength, indexDataIsDiffs));
    oReq.open("GET", location);
    oReq.send();
}

function loadBuffersFromObjFileResponse(bufferObj, response, cb, expectedVertLength, indexDataIsDiffs){
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
            faces.push(splitLine.slice(1));
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
        vertices: [].concat.apply([],newVerts.map(x=>verts[x[0]])),
        vertices_len: expectedVertLength,   //not required if is 3 (normal)
        normals: [].concat.apply([],newVerts.map(x=>norms[x[2]])),
        indices: [].concat.apply([],newFaces)
    };
    if (uvs.length > 0){
        sourceData.uvcoords = [].concat.apply([],newVerts.map(x=>uvs[x[1]]));
    }

    // console.log("Obj data:");
    // console.log(sourceData);

    cb(bufferObj, sourceData);  //loadBufferData
    bufferObj.isLoaded = true;  //should check this before drawing using these buffers (or set some initial dummy data)
}

function loadBuffersFromObj2Or3Or5FileResponse(bufferObj, response, cb, expectedVertLength, indexDataIsDiffs){
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
               alert("vertex vector size " + floatArr.length + ", but expected length 3" , floatArr);
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
            [].concat.apply([],newVerts.map(x=> positions[x[0]].concat(colours[x[3]]))):
            [].concat.apply([],newVerts.map(x=> positions[x[0]]))
            ),
        vertices_len: expectedVertLength,   //not required if is 3 (normal)
        normals: [].concat.apply([],newVerts.map(x=>norms[x[2]])),
        indices: [].concat.apply([],newFaces)
    };
    if (uvs.length > 0){
        sourceData.uvcoords = [].concat.apply([],newVerts.map(x=>uvs[x[1]]));
    }

    console.log("custom Obj data:");
    console.log(newVerts);
    console.log(sourceData);

    cb(bufferObj, sourceData);  //loadBufferData
    bufferObj.isLoaded = true;  //should check this before drawing using these buffers (or set some initial dummy data)
}