// lib stuff. TODO share lib with main project
var temp4vec = [...new Array(4)];


function vectorSum4d(vec1, vec2){
    return [
        vec1[0] + vec2[0],
        vec1[1] + vec2[1],
        vec1[2] + vec2[2],
        vec1[3] + vec2[3]
    ];
}

function vectorDifference4d(vec1, vec2){
    return [
        vec1[0] - vec2[0],
        vec1[1] - vec2[1],
        vec1[2] - vec2[2],
        vec1[3] - vec2[3],
    ];
}

function dotProduct4(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2] + first[3]*second[3];
}

function normalise(inputVector){
    var len = Math.hypot.apply(null, inputVector);
    return inputVector.map(cc => cc/len);
}
function lensq(inputVector){
    return inputVector.reduce((accum, current)=>accum+current*current,0);
}
//TODO specialise for 4d, avoid hypot.apply?


function surfOfAABB4d(aabb){
    var sides = aabb[0].map((xx,ii) => aabb[1][ii]-xx);
    return 2*(sides[0]*sides[1]*sides[2] + sides[1]*sides[2]*sides[3] +
         sides[2]*sides[3]*sides[0] + sides[3]*sides[0]*sides[1]);
}

function calcAABBVolume(aabb){
    return aabb[1].reduce((accum, current, ii) => accum*(current - aabb[0][ii]),1);
}

function random4vec(){
    var vec=[];
    for (var ii=0;ii<4;ii++){
        vec.push(Math.random() - 0.5);
    }
    return normalise(vec);
}

function combinedAABB(aabb, edgeaabb){
    return [
        aabb[0].map((xx,ii) => Math.min(xx, edgeaabb[0][ii])),
        aabb[1].map((xx,ii) => Math.max(xx, edgeaabb[1][ii])),
    ]
}


//runTest([0,0,0,1],[0,0,1,0]);
// runTest(random4vec(), random4vec());

// var randVecPairs = [];
// for (var ii=0;ii<10000;ii++){
//     randVecPairs.push([random4vec(), random4vec()]);
// }

// runSpeedTest(randVecPairs);

//var randVecTriple = [random4vec(), random4vec(), random4vec()];
//var randVecTriple = [[0.8, 0.6,0,0], [0.8, 0,0.6,0],[0.8, 0,0,0.6]];
//var randVecTriple = [[0.8, 0.6,0,0],[0.8, 0,0,0.6], [0.8, 0,0.6,0]];    //switch winding order

// runTriangleTest([
//     [
//       0.4906016880333901, 
//       -0.1744549583023323,
//       0.7127240200152329, 
//       -0.46999991757004145
//     ],
//     [
//       -0.5613985509879181,
//       0.36119634595923544,
//       -0.6902836319621373,
//       0.27906517887318494 
//     ],
//     [
//       0.39133576257943425,
//       -0.7483792187037337,
//       0.20415489752406524,
//       0.4950814516377079  
//     ]
//   ]);   //some problem numbers where analytic larger than sampled. see whether problem persists if up samples.

for (var ii=0;ii<100;ii++){
    var randVecTriple = [random4vec(), random4vec(), random4vec()];
    runTriangleTest(randVecTriple);
}

function runTest(startPoint, endPoint){
    var aabbs={
        approxSphere:  aabb4DForLine(startPoint, endPoint),
        sampling: aabb4DForLineBySampling(startPoint, endPoint, 1000),
        analytic: aabb4DForLineAnalytic(startPoint, endPoint),
        analytic2: aabb4DForLineAnalytic2(startPoint, endPoint),
        analytic3: aabb4DForLineAnalytic3(startPoint, endPoint),
        analytic4: aabb4DForLineAnalytic4(startPoint, endPoint)
    }

    //test that analytic includes sampling result.
    console.log({
        input: [startPoint, endPoint],
        approxSphere: aabbs.approxSphere,
        approxSphereSAH: surfOfAABB4d(aabbs.approxSphere),
        sampling: aabbs.sampling,
        samplingSAH: surfOfAABB4d(aabbs.sampling),
        analytic: aabbs.analytic,
        analyticSAH: surfOfAABB4d(aabbs.analytic),
        analytic2: aabbs.analytic2,
        analytic2SAH: surfOfAABB4d(aabbs.analytic2),
        analytic3: aabbs.analytic3,
        analytic3SAH: surfOfAABB4d(aabbs.analytic3),
        analytic4: aabbs.analytic4,
        analytic4SAH: surfOfAABB4d(aabbs.analytic4)
    });
}

function runSpeedTest(vecPairs){

    var time1 = testAMethod(aabb4DForLine, vecPairs);
    var timeSampling = testAMethod((ss,ee)=>aabb4DForLineBySampling(ss,ee,10), vecPairs);
    var timeAnalytic = testAMethod(aabb4DForLineAnalytic, vecPairs);
    var timeAnalytic2 = testAMethod(aabb4DForLineAnalytic2, vecPairs);
    var timeAnalytic3 = testAMethod(aabb4DForLineAnalytic3, vecPairs);
    var timeAnalytic4 = testAMethod(aabb4DForLineAnalytic4, vecPairs);

    console.log({
        time1,
        timeSampling,
        timeAnalytic,
        timeAnalytic2,
        timeAnalytic3,
        timeAnalytic4
    })

    function testAMethod(meth, pairs){
        var startTime = performance.now();
        pairs.forEach(pair=>meth(pair[0],pair[1]))
        var timeTaken = performance.now() - startTime;
        return timeTaken;
    }
}

function runTriangleTest(triVerts){
    //brute force AABB 
    var aabbs={
        sampling: aabb4DForTriSampling(triVerts,1000),
        analytic: aabb4DForTriAnalytic(triVerts),
    }
    // console.log({
    //     sampling: aabbs.sampling,
    //     analytic: aabbs.analytic,
    // });
    //confirm that results match up - analytic aabb should contain sampling aabb, and not be much larger.

    var paddingMin = aabbs.sampling[0].map((xx,ii) => xx - aabbs.analytic[0][ii]);
    var paddingMax = aabbs.sampling[1].map((xx,ii) => aabbs.analytic[1][ii] - xx);
    //confirm padding all nonnegative.
    var paddingMinOk = paddingMin.reduce((accum, current) => accum && (current>=-Number.EPSILON) && (current<0.001), true);
    var paddingMaxOk = paddingMax.reduce((accum, current) => accum && (current>=-Number.EPSILON) && (current<0.001), true);
    if (!(paddingMinOk && paddingMaxOk)){
        console.log({
            mssg: "problem!",
            triVerts,
            paddingMin,
            paddingMax,
            sampling: aabbs.sampling,
            analytic: aabbs.analytic,
        })
    }
}


//currently using this approximate func
function aabb4DForLine(startPos, endPos){
    //larger aabb than necessary but easy calculation.
    var sumSq = 0;
    var centre = new Array(4);
    for (var cc=0;cc<4;cc++){
        centre[cc] = (startPos[cc] + endPos[cc])/2;
        var halfDisp = (endPos[cc] - startPos[cc])/2;
        sumSq+= halfDisp*halfDisp;
    }
    var rad = Math.sqrt(sumSq);
    return [-1,1].map(direction => centre.map(xx => xx+direction*rad ));
}

function aabb4DForLineBySampling(startPos, endPos, numSections){
    //bodge method. more sections = more accurate

    //could do this exactly - basically a sine wave projected onto each axis.
    // so min/max of start, end points unless passes inflection point
    //but expect simple method (AABB bigger than needed) fine for now.

    var points = [startPos, endPos];
    for (var ii=1;ii<numSections;ii++){
        var thisPoint = [];
        for (var cc=0;cc<4;cc++){
            var component = (endPos[cc]*ii + startPos[cc]*(numSections-ii))/numSections;
            thisPoint.push(component);
        }
        points.push(normalise(thisPoint));
    }

    return aabbForPoints(points);
}

function aabb4DForTriSampling(triVerts, numSections){
    var points = [];
    for (var ii=0;ii<=numSections;ii++){
        for (var jj=0;jj<=numSections-ii;jj++){
            //ii/numSections * vert1
            //jj/numSections * vert2
            //(numSections-ii-jj)/numSections * vert3
            var thisPoint = [];
            for (var cc=0;cc<4;cc++){
                var component = (triVerts[0][cc]*ii + triVerts[1][cc]*jj + triVerts[2][cc]*(numSections-ii-jj))/numSections;
                thisPoint.push(component);
            }

            points.push(normalise(thisPoint));
        }
    }
    return aabbForPoints(points);
}

function aabbForPoints(points){

    return [Math.min,Math.max].map( ff => 
            points.reduce((accum, current) => current.map((xx,ii) => ff(accum[ii],xx)), points[0] )
        );
}

//maybe a neater way to forumate this by treating start, end symmetrically, but just do more obvious way to get it working...
function aabb4DForLineAnalytic(startPos, endPos){
    //assume input is normalised 4vecs

    //initial AABB just taking start, end points into account 
    var aabb = [
        startPos.map((xx,ii)=>Math.min(xx, endPos[ii])),
        startPos.map((xx,ii)=>Math.max(xx, endPos[ii]))
    ];

    var dp = dotProduct4(startPos, endPos);
    //angle two points these is then acos(dp)
    //var endAngle = Math.acos(dp);

    var componentOfEndPosInStartPosDirection = startPos.map(xx => xx*dp);

    var orthogonalisedEndPos = vectorDifference4d(endPos, componentOfEndPosInStartPosDirection);
    var normalisedOrthoEndPos = normalise(orthogonalisedEndPos);

/*
    console.log({
        dp,
        componentOfEndPosInStartPosDirection,
        startPos,
        endPos,
        orthogonalisedEndPos,
        normalisedOrthoEndPos,
        dpCheck: dotProduct4(normalisedOrthoEndPos, startPos)   //fails!!!
    });
*/

    //this point is 90 deg from startpoint in direction of endpoint.

    //equation of line is then like 
    // startPoint*cos(t) + normalisedOrthoEndPos * sin(t)
    // where 0<=t<=endAngle

    //can look at each axis independently
    // eg startPoint.x*cos(t) + normalisedOrthoEndPos.x * sin(t)


    //detect extrema from turning points
    // look at sign of derivative wrt t for start, end. if changes, is a turning point inbetween, 
    // and the magnitude of the turning point is pythagoras from the 2 orthogonal points (start, othogonalised end)

    var derivativeAtStart = normalisedOrthoEndPos; 

    var otherComponent = Math.sqrt(1-dp*dp);
    var derivativeAtEnd = vectorDifference4d(normalisedOrthoEndPos.map(xx=>xx*dp) , startPos.map(xx=>xx*otherComponent)); 

    //var maxMagnitudes = normalisedOrthoEndPos.map((xx,ii) => xx*xx + startPos[ii]*startPos[ii]).map(xx=>Math.sqrt(xx));

    for (var cc=0;cc<4;cc++){
        var derivsMultiplied = derivativeAtStart[cc]*derivativeAtEnd[cc];
        if (derivsMultiplied<0){   //switched so include turning point
            var maxMagnitude = Math.sqrt(normalisedOrthoEndPos[cc]*normalisedOrthoEndPos[cc] + startPos[cc]*startPos[cc]);
            //console.log("adding point for cc = " + cc + ", maxMagnitude = " + maxMagnitude);
            if (derivativeAtStart[cc]>0){
                aabb[1][cc] = maxMagnitude;
            }else{
                aabb[0][cc] = -maxMagnitude;
            }
        }
    }

    return aabb;
}



//symmetric start+end points version. less readable, maybe faster
function aabb4DForLineAnalytic2(startPos, endPos){
    //assume input is normalised 4vecs

    //initial AABB just taking start, end points into account 
    var aabb = [
        startPos.map((xx,ii)=>Math.min(xx, endPos[ii])),
        startPos.map((xx,ii)=>Math.max(xx, endPos[ii]))
    ];

    var orthoVecs = [
        vectorDifference4d(endPos, startPos),
        vectorSum4d(endPos, startPos)
    ];

    orthoVecs=orthoVecs.map(vv=>normalise(vv));
    var dps = orthoVecs.map(vv => dotProduct4(vv, endPos));   //should sumsq to 1

    //var maxMagnitudes = normalisedOrthoEndPos.map((xx,ii) => xx*xx + startPos[ii]*startPos[ii]).map(xx=>Math.sqrt(xx));

    for (var cc=0;cc<4;cc++){

        var derivativeAtStart = dps[1]*orthoVecs[0][cc] + dps[0]*orthoVecs[1][cc];
        var derivativeAtEnd = dps[1]*orthoVecs[0][cc] - dps[0]*orthoVecs[1][cc]; 

        var derivsMultiplied = derivativeAtStart*derivativeAtEnd;
        if (derivsMultiplied<0){   //switched so include turning point
            var maxMagnitude = Math.sqrt(orthoVecs[0][cc]*orthoVecs[0][cc] + orthoVecs[1][cc]*orthoVecs[1][cc]);
            //console.log("adding point for cc = " + cc + ", maxMagnitude = " + maxMagnitude);
            if (derivativeAtStart>0){
                aabb[1][cc] = maxMagnitude;
            }else{
                aabb[0][cc] = -maxMagnitude;
            }
        }
    }

    return aabb;
}



function aabb4DForLineAnalytic3(startPos, endPos){
    //assume input is normalised 4vecs

    //initial AABB just taking start, end points into account 
    var aabb = [
        startPos.map((xx,ii)=>Math.min(xx, endPos[ii])),
        startPos.map((xx,ii)=>Math.max(xx, endPos[ii]))
    ];

    var orthoVecs = [
        vectorDifference4d(endPos, startPos),
        vectorSum4d(endPos, startPos)
    ];

    var orthoVecsSq = orthoVecs.map(vv=> vv.map(xx=>xx*xx));
    var orthoVecsLensq = orthoVecsSq.map(vv=>vv.reduce((acc,ss)=>acc+ss,0));
    //var orthoVecsOverLensq = orthoVecs.map((vv,ii) => vv.map(xx=>xx/orthoVecsLensq[ii]));
    var dps = orthoVecs.map(vv => dotProduct4(vv, endPos));

    //var maxMagnitudes = normalisedOrthoEndPos.map((xx,ii) => xx*xx + startPos[ii]*startPos[ii]).map(xx=>Math.sqrt(xx));

    for (var cc=0;cc<4;cc++){

        var derivativeAtStart = dps[1]*orthoVecs[0][cc] + dps[0]*orthoVecs[1][cc];
        var derivativeAtEnd = dps[1]*orthoVecs[0][cc] - dps[0]*orthoVecs[1][cc]; 

        var derivsMultiplied = derivativeAtStart*derivativeAtEnd;
        if (derivsMultiplied<0){   //switched so include turning point
            var maxMagnitude = Math.sqrt(orthoVecsSq[0][cc]/orthoVecsLensq[0] + orthoVecsSq[1][cc]/orthoVecsLensq[1]);;
            //console.log("adding point for cc = " + cc + ", maxMagnitude = " + maxMagnitude);
            if (derivativeAtStart>0){
                aabb[1][cc] = maxMagnitude;
            }else{
                aabb[0][cc] = -maxMagnitude;
            }
        }
    }

    return aabb;
}


function aabb4DForLineAnalytic4(startPos, endPos){
    //assume input is normalised 4vecs

    //initial AABB just taking start, end points into account 
    var aabb = [
        startPos.map((xx,ii)=>Math.min(xx, endPos[ii])),
        startPos.map((xx,ii)=>Math.max(xx, endPos[ii]))
    ];

    var orthoVecs = [
        vectorDifference4d(endPos, startPos),
        vectorSum4d(endPos, startPos)
    ];

    var orthoVecsSq = orthoVecs.map(vv=> vv.map(xx=>xx*xx));
    var orthoVecsLensq = orthoVecsSq.map(vv=>vv.reduce((acc,ss)=>acc+ss,0));
    //var orthoVecsOverLensq = orthoVecs.map((vv,ii) => vv.map(xx=>xx/orthoVecsLensq[ii]));
    var dps = orthoVecs.map(vv => dotProduct4(vv, endPos));

    //var maxMagnitudes = normalisedOrthoEndPos.map((xx,ii) => xx*xx + startPos[ii]*startPos[ii]).map(xx=>Math.sqrt(xx));

    var derivativeAtStart = temp4vec.map((_,cc) => dps[1]*orthoVecs[0][cc] + dps[0]*orthoVecs[1][cc]);
    var derivativeAtEnd = temp4vec.map((_,cc) => dps[1]*orthoVecs[0][cc] - dps[0]*orthoVecs[1][cc]);

    for (var cc=0;cc<4;cc++){

        var derivsMultiplied = derivativeAtStart[cc]*derivativeAtEnd[cc];
        if (derivsMultiplied<0){   //switched so include turning point
            var maxMagnitude = Math.sqrt(orthoVecsSq[0][cc]/orthoVecsLensq[0] + orthoVecsSq[1][cc]/orthoVecsLensq[1]);;
            //console.log("adding point for cc = " + cc + ", maxMagnitude = " + maxMagnitude);
            if (derivativeAtStart[cc]>0){
                aabb[1][cc] = maxMagnitude;
            }else{
                aabb[0][cc] = -maxMagnitude;
            }
        }
    }

    return aabb;
}



//suspect that a 4d AABB for a triangle is the AABB of its 3 sides, and an extreme point (+/- 1) if the triangle wraps around a point axis (eg (0,0,0,1)). 
// to check if wraps an axis, for each of the 3 great circle edges, determine a great sphere, guess plane ortho to 2 edge points and the face plane.
// each pair of axis points eg (0,0,0,1), (0,0,0,-1), one is on each side of the great sphere.
// an axis is wrapped if the great sphere 4-vecs for all 3 edges have same sign for component in question, and the sign determines sign of the wrapped axis.
// (axis contained inside the triangle)

function aabb4DForTriAnalytic(triVerts){
    //combo aabbs for each line between verts
    var aabb = [triVerts[0],triVerts[0]];   //some point that will be in the final aabb
    for (ee=0;ee<3;ee++){
        edgeaabb = aabb4DForLineAnalytic(triVerts[ee],triVerts[(ee+1)%3]);
        aabb = combinedAABB(aabb, edgeaabb);
    }

    //include extreme point if some condition true
    var faceVec = findOrthoVecByDiags(triVerts);
    // console.log("checking orthogonality...");
    // checkOrthogonality(faceVec, triVerts);

    var edgePlaneVecs = []; 
    for (ee=0;ee<3;ee++){
        edgePlaneVecs.push(findOrthoVecByDiags([triVerts[ee], triVerts[(ee+1)%3], faceVec]));
    }

    var normalisedFaceVec = normalise(faceVec);
    // console.log({faceVec, normalisedFaceVec});

    //if all signs the same then do something
    for (cc=0;cc<4;cc++){
        var isPositive = edgePlaneVecs.map(pv => pv[cc]>0 ? 1:0);
        if (isPositive[0]==isPositive[1] && isPositive[0]==isPositive[2]){
            var valueToAdd = Math.sqrt(1-normalisedFaceVec[cc]*normalisedFaceVec[cc]);  //or could sum other 3 squared components if want more robust (avoid sqrt -ve num)
            // console.log({cc, isPositive: isPositive[0], valueToAdd});
            aabb[1-isPositive[0]][cc] = isPositive[0]? -valueToAdd: valueToAdd;   //is sign to use here reliable? or is it just pot luck, depending on face winding order?
        }
    }
    
    return aabb;
}



//taken from orthogonal-4vecs.js
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
    //results[0]=-results[0];
    //results[1]=-results[1];


    results[0]=-results[0]; //this apparently works. not sure why
    results[2]=-results[2];
 
    return results;
}

function checkOrthogonality(vec1, vecsToTestVs){
    console.log({vec1, vecsToTestVs});
    var dotProds = vecsToTestVs.map( vv => dotProduct4(vec1, vv));
    console.log({dotProds});
    //TODO for testing lots, just check results are below some threshold
}