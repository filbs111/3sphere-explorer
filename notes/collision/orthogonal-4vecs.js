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

perfTest(100000);

// testIt([
//     [1,0,0,0],
//     [0,1,0,0],
//     [0,0,1,0]
// ]); //should get [0,0,0,1]


//var faceVec = findOrthoVecByGlMatrix(triVerts);



function testIt(triVerts){
    console.log(triVerts);
    var faceVec = findOthoFunc(triVerts);
    var faceVec2 = findOrthoVecByDiags2(triVerts);
    var faceVec3 = findOrthoVecByDiags3(triVerts);
    var faceVec4 = findOrthoVecByDiags4(triVerts);
    var faceVec5 = findOrthoVecByDiags5(triVerts);

    checkOrthogonality(faceVec, triVerts);

    var faceVec2 = findOrthoVecByDiags2(triVerts);

    console.log({
        faceVec,
        faceVec2,
        faceVec3,
        faceVec4
    })
}

function perfTest(howManyCalcs){
    var testTriverts = [];
    for (var ii=0;ii<howManyCalcs;ii++){
        testTriverts.push(makeRandomTriVerts());
    }
    
    var results1 = new Array(howManyCalcs);
    var results2 = new Array(howManyCalcs);
    var results3 = new Array(howManyCalcs);
    var results4 = new Array(howManyCalcs);
    var results5 = new Array(howManyCalcs);
    
    var time0=performance.now();
    
    for (var ii=0;ii<howManyCalcs;ii++){
        results1[ii] = findOrthoVecByDiags(testTriverts[ii]);
    }
    var time1=performance.now();

    for (var ii=0;ii<howManyCalcs;ii++){
        results2[ii] = findOrthoVecByDiags2(testTriverts[ii]);
    }
    var time2=performance.now();

    for (var ii=0;ii<howManyCalcs;ii++){
        results3[ii] = findOrthoVecByDiags3(testTriverts[ii]);
    }
    var time3=performance.now();

    for (var ii=0;ii<howManyCalcs;ii++){
        results4[ii] = findOrthoVecByDiags4(testTriverts[ii]);
    }
    var time4=performance.now();

    for (var ii=0;ii<howManyCalcs;ii++){
        results5[ii] = findOrthoVecByDiags5(testTriverts[ii]);
    }
    var time5=performance.now();

    console.log({
        findOrthoVecByDiags : time1-time0,  //surprisingly quick!
        findOrthoVecByDiags2 : time2-time1,
        findOrthoVecByDiags3 : time3-time2, //usually fastest (but not by much)
        findOrthoVecByDiags4 : time4-time3,
        findOrthoVecByDiags5 : time5-time4
    })


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

    results[0]=-results[0]; //this apparently works. not sure why! guess could flip indices 1,3 instead
    results[2]=-results[2];
 
    return results;
}


function findOrthoVecByDiags2(inputVecs){
    //expand findOrthoVecByDiags
    return [
        -inputVecs[0][1]*inputVecs[1][2]*inputVecs[2][3] + inputVecs[0][3]*inputVecs[1][2]*inputVecs[2][1]
        -inputVecs[0][2]*inputVecs[1][3]*inputVecs[2][1] + inputVecs[0][1]*inputVecs[1][3]*inputVecs[2][2]
        -inputVecs[0][3]*inputVecs[1][1]*inputVecs[2][2] + inputVecs[0][2]*inputVecs[1][1]*inputVecs[2][3]
        ,
        inputVecs[0][2]*inputVecs[1][3]*inputVecs[2][0] - inputVecs[0][0]*inputVecs[1][3]*inputVecs[2][2]
        +inputVecs[0][3]*inputVecs[1][0]*inputVecs[2][2] - inputVecs[0][2]*inputVecs[1][0]*inputVecs[2][3]
        +inputVecs[0][0]*inputVecs[1][2]*inputVecs[2][3] - inputVecs[0][3]*inputVecs[1][2]*inputVecs[2][0]
        ,
        -inputVecs[0][3]*inputVecs[1][0]*inputVecs[2][1] + inputVecs[0][1]*inputVecs[1][0]*inputVecs[2][3]
        -inputVecs[0][0]*inputVecs[1][1]*inputVecs[2][3] + inputVecs[0][3]*inputVecs[1][1]*inputVecs[2][0]
        -inputVecs[0][1]*inputVecs[1][3]*inputVecs[2][0] + inputVecs[0][0]*inputVecs[1][3]*inputVecs[2][1]
        ,
        inputVecs[0][0]*inputVecs[1][1]*inputVecs[2][2] - inputVecs[0][2]*inputVecs[1][1]*inputVecs[2][0]
        +inputVecs[0][1]*inputVecs[1][2]*inputVecs[2][0] - inputVecs[0][0]*inputVecs[1][2]*inputVecs[2][1]
        +inputVecs[0][2]*inputVecs[1][0]*inputVecs[2][1] - inputVecs[0][1]*inputVecs[1][0]*inputVecs[2][2]
    ];
}

function findOrthoVecByDiags3(inputVecs){
    //pair up terms from findOrthoVecByDiags2.
    // the 6 terms below are 2x2 determinants
    var a01 = inputVecs[0][0]*inputVecs[1][1] - inputVecs[0][1]*inputVecs[1][0];
    var a02 = inputVecs[0][0]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][0];
    var a03 = inputVecs[0][0]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][0];
    var a12 = inputVecs[0][1]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][1];
    var a13 = inputVecs[0][1]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][1];
    var a23 = inputVecs[0][2]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][2];
    //TODO put inputVecs[2] to a variable to avoid looking up from here on?
    return [
        a13*inputVecs[2][2] -a23*inputVecs[2][1] -a12*inputVecs[2][3],
        a02*inputVecs[2][3] -a03*inputVecs[2][2] +a23*inputVecs[2][0],
        -a01*inputVecs[2][3] +a03*inputVecs[2][1] -a13*inputVecs[2][0],
        a01*inputVecs[2][2] -a02*inputVecs[2][1] +a12*inputVecs[2][0]
    ];
}


function findOrthoVecByDiags4(inputVecs){
    //pair up terms from findOrthoVecByDiags2.
    // the 6 terms below are 2x2 determinants
    var iv2 = inputVecs[2];
    var a01 = inputVecs[0][0]*inputVecs[1][1] - inputVecs[0][1]*inputVecs[1][0];
    var a02 = inputVecs[0][0]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][0];
    var a03 = inputVecs[0][0]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][0];
    var a12 = inputVecs[0][1]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][1];
    var a13 = inputVecs[0][1]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][1];
    var a23 = inputVecs[0][2]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][2];
    return [
        a13*iv2[2] -a23*iv2[1] -a12*iv2[3],
        a02*iv2[3] -a03*iv2[2] +a23*iv2[0],
        -a01*iv2[3] +a03*iv2[1] -a13*iv2[0],
        a01*iv2[2] -a02*iv2[1] +a12*iv2[0]
    ];
}


function findOrthoVecByDiags5(inputVecs){
    //pair up terms from findOrthoVecByDiags2.
    // the 6 terms below are 2x2 determinants
    var a = [
        inputVecs[0][0]*inputVecs[1][1] - inputVecs[0][1]*inputVecs[1][0],  //a01 = a[0]
        inputVecs[0][0]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][0],  //a02 = a[1]
        inputVecs[0][0]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][0],  //a03 = a[2]
        inputVecs[0][1]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][1],  //a12 = a[3]
        inputVecs[0][1]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][1],  //a13 = a[4]
        inputVecs[0][2]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][2]   //a23 = a[5]
    ];
    return [
        a[4]*inputVecs[2][2] -a[5]*inputVecs[2][1] -a[3]*inputVecs[2][3],
        a[1]*inputVecs[2][3] -a[2]*inputVecs[2][2] +a[5]*inputVecs[2][0],
        -a[0]*inputVecs[2][3] +a[2]*inputVecs[2][1] -a[4]*inputVecs[2][0],
        a[0]*inputVecs[2][2] -a[1]*inputVecs[2][1] +a[3]*inputVecs[2][0]
    ];
}


//apparently the is no "rule of sarrus" for 4x4 matrices, so removing this previously committed function
// function findOrthoVecByDiags2(inputVecs){
// ...
// }


function checkOrthogonality(vec1, vecsToTestVs){
    console.log({vec1, vecsToTestVs});
    var dotProds = vecsToTestVs.map( vv => dotProduct4(vec1, vv));
    console.log({dotProds});
    //TODO for testing lots, just check results are below some threshold
}


function makeRandomTriVerts(){
    return [
        [1+Math.random(),2+Math.random(),2+Math.random(),Math.random()],
        [1+Math.random(),2+Math.random(),Math.random(),Math.random()],
        [1+Math.random(),0,2+Math.random(),Math.random()]

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
