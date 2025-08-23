//apparently can work out a 4-vec that is orthogonal to 3 other unit 4-vecs
// (provided linearly independent, if memory serves linearly independent , perhaps not on a great circle ??) 
// by "psuedo determinant", similar to 3d cross product.

//hope can use this to work out collision data for faces of 3-sphere triangle object using 4-vec verts.

//want to get a face normal that is orthogonal to all 3 tri verts, moved around world 1/4 turn from the face plane.
//then get 3 edge plane normals that pass through 2 tri verts and the face plane normal.

//TODO
// check this works. use glmatrix for determinant, check orthogonality of 4-vecs produced.
// write own version, compare perf
// check whether perf seems acceptable for running at load time for num triangles expect to have in a mesh (2^16 = 65536)

//if perf found wanting, do as follows, ordered by expected cost/benefit

// reuse intermediate determinant results for each ortho vector calc
// reuse intermediate results over the set of orth vec calcs for a tri (face, 3 edges)
// reuse results over multiple faces? (maybe not worth it. also maybe cache issue unless store triangles as strips)


//create tris. each is 3 4-vector verts

var findOthoFunc = findOrthoVecByDiags;


var tris = [];
for (var ii=0;ii<2;ii++){
    var tri = makeRandomTriVerts();
    //tris.push(makeRandomTriVerts());
    testIt(tri);
}

testIt([
    [1,0,0,0],
    [0,1,0,0],
    [0,0,1,0]
]); //should get [0,0,0,1]


//var faceVec = findOrthoVecByGlMatrix(triVerts);



function testIt(triVerts){
    console.log(triVerts);
    var faceVec = findOthoFunc(triVerts);
    checkOrthogonality(faceVec, triVerts);
}


function findOrthoVecByGlMatrix(inputVecs){

}


function findOrthoVecByDiags(inputVecs){
    //do 4d x-prod

    //apparently determinant is something like 
    //multiplying together diagonals... 
    // https://www.youtube.com/watch?v=z5Yf7QwrotE

    var results = [];

    for (var cc=0;cc<4;cc++){
        var sum = 0;
        for (var aa=0;aa<3;aa++){
            var positiveproduct=1;
            var negativeproduct=1;
            for (var bb=0;bb<3;bb++){
                positiveproduct *= inputVecs[bb][(cc+1+(aa+bb)%3)%4];
                negativeproduct *= inputVecs[bb][(cc+1+(aa+2-bb)%3)%4];
            }
            //console.log(positiveproduct, negativeproduct);
            sum+=positiveproduct-negativeproduct;
        }

        //console.log(sum);

        results.push(sum);
    }

    //flip some due to signs
    // + - + - for determinants for ijkl
    // + - - + for whether the determinant square wraps right to left (code above calc determinants using %)
    // multiple: 
    // + + - -
    //and flip this for nice sign of output (might wish to flip back if results inconsistent with other code in 3sphere project)
    results[0]=-results[0];
    results[1]=-results[1];
 
    return results;
}

function checkOrthogonality(vec1, vecsToTestVs){
    console.log({vec1, vecsToTestVs});
    var dotProds = vecsToTestVs.map( vv => dotProduct4(vec1, vv));
    console.log({dotProds});
    //TODO for testing lots, just check results are below some threshold
}


function makeRandomTriVerts(){
    return [
        [10,2+Math.random(),2+Math.random(),0],
        [10,2+Math.random(),0,0],
        [10,0,2+Math.random(),0]

        // [10,1,1,0],
        // [10,1,0,0],
        // [10,0,1,0]
    ].map(xx=> normalise(xx));
}


// lib stuff. TODO share lib with main project

function dotProduct4(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2] + first[3]*second[3];
}

function normalise(inputVector){
    var len = Math.hypot.apply(null, inputVector);
    return inputVector.map(cc => cc/len);
}
//TODO specialise for 4d, avoid hypot.apply?
