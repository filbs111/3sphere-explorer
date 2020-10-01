//loading .obj data and similar from files eg .obj, instead of generating json data from.obj files offline

function loadBuffersFromObjFile(bufferObj, location, cb){
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", x => {loadBuffersFromObjFileResponse(bufferObj, x.target.response, cb);});
    oReq.open("GET", location);
    oReq.send();
}

function loadBuffersFromObjFileResponse(bufferObj, response, cb){
    console.log(response);
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
            if (floatArr.length != 3){
                alert("vertex with length != 3", floatArr, ll);
            }
        }
        if (firstPart == 'vt'){
            uvs.push(floatArr);
            if (floatArr.length != 2){
                alert("vertex uv with length != 2", floatArr, ll);
            }
        }
        if (firstPart == 'vn'){
            norms.push(floatArr);
            if (floatArr.length != 3){
                alert("vertex n with length != 3", floatArr, ll);
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
        uvcoords: [].concat.apply([],newVerts.map(x=>uvs[x[1]])),
        normals: [].concat.apply([],newVerts.map(x=>norms[x[2]])),
        indices: [].concat.apply([],newFaces)
    };

    cb(bufferObj, sourceData);  //loadBufferData
    bufferObj.isLoaded = true;  //should check this before drawing using these buffers (or set some initial dummy data)
}