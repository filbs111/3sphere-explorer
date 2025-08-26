// lib stuff. TODO share lib with main project
var temp4vec = [...new Array(4)];

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


//runTest([0,0,0,1],[0,0,1,0]);
runTest(random4vec(), random4vec());


function runTest(startPoint, endPoint){
    var aabbs={
        approxSphere:  aabb4DForLine(startPoint, endPoint),
        sampling: aabb4DForLineBySampling(startPoint, endPoint, 10000),
        analytic: aabb4DForLineAnalytic(startPoint, endPoint)
    }

    //test that analytic includes sampling result.
    console.log({
        input: [startPoint, endPoint],
        approxSphere: aabbs.approxSphere,
        approxSphereSAH: surfOfAABB4d(aabbs.approxSphere),
        sampling: aabbs.sampling,
        samplingSAH: surfOfAABB4d(aabbs.sampling),
        analytic: aabbs.analytic,
        analyticSAH: surfOfAABB4d(aabbs.analytic)
    });
}

//currently using this approximate func
function aabb4DForLine(startPos, endPos, numSteps){
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
        var sumSq = 0;
        for (var cc=0;cc<4;cc++){
            var component = (endPos[cc]*ii + startPos[cc]*(numSections-ii))/numSections;
            thisPoint.push(component);
            sumSq+=component*component;
        }
        var len = Math.sqrt(sumSq); //normalise
        points.push(thisPoint.map(xx => xx/len));
    }

    return [Math.min,Math.max].map( ff => 
            temp4vec.map((_, ii) => ff.apply(null, points.map(pp => pp[ii])))
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
            console.log("adding point for cc = " + cc + ", maxMagnitude = " + maxMagnitude);
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


