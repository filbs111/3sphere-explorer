//perf test in hope of speeding up aabb4DForLineAnalytic and similar
function aabbForTwo4_1(startPos, endPos){
    return [
        startPos.map((xx,ii)=>Math.min(xx, endPos[ii])),
        startPos.map((xx,ii)=>Math.max(xx, endPos[ii]))
    ];
}

function aabbForTwo4_2(startPos, endPos){
    return [[
        startPos[0]<endPos[0]?startPos[0]:endPos[0],
        startPos[1]<endPos[1]?startPos[1]:endPos[1],
        startPos[2]<endPos[2]?startPos[2]:endPos[2],
        startPos[3]<endPos[3]?startPos[3]:endPos[3]
    ],[
        startPos[0]>endPos[0]?startPos[0]:endPos[0],
        startPos[1]>endPos[1]?startPos[1]:endPos[1],
        startPos[2]>endPos[2]?startPos[2]:endPos[2],
        startPos[3]>endPos[3]?startPos[3]:endPos[3]
    ]];
}
//NOTE this compares start, end for each component twice! better to store aabbs as 4x 2vecs intead of 2x 4vecs?

function aabbForTwo4_3(startPos, endPos){
    var toReturn = [new Array(4), new Array(4)];
    for (var ii=0;ii<4;ii++){
        var endPosBiggest = endPos[ii]>startPos[ii] ? 1:0;
        toReturn[endPosBiggest][ii]=endPos[ii];
        toReturn[1-endPosBiggest][ii]=startPos[ii];
    }
    return toReturn;
}

function randomFourvec(){
    return normalise4([Math.random()-0.5, Math.random()-0.5, Math.random()-0.5, Math.random()-0.5]);
}


function normalise4(vv){
    var len = Math.sqrt(vv[0]*vv[0]+ vv[1]*vv[1] + vv[2]*vv[2]+ vv[3]*vv[3]);
    return [vv[0]/len, vv[1]/len, vv[2]/len, vv[3]/len];
}



function combinedAABB(aabb, aabb2){
    return [
        aabb[0].map((xx,ii) => Math.min(xx, aabb2[0][ii])),
        aabb[1].map((xx,ii) => Math.max(xx, aabb2[1][ii])),
    ]
}

function combinedAABB4(aabb, aabb2){
    return [[
        Math.min(aabb[0][0],aabb2[0][0]),
        Math.min(aabb[0][1],aabb2[0][1]),
        Math.min(aabb[0][2],aabb2[0][2]),
        Math.min(aabb[0][3],aabb2[0][3])
    ],[
        Math.max(aabb[1][0],aabb2[1][0]),
        Math.max(aabb[1][1],aabb2[1][1]),
        Math.max(aabb[1][2],aabb2[1][2]),
        Math.max(aabb[1][3],aabb2[1][3])
    ]];
}



function testAAbbForFuncs(numToTest){
    var pairsOfPositions = [];
    for (var xx=0;xx<numToTest;xx++){
        pairsOfPositions.push([randomFourvec(),randomFourvec()]);
    }
    var time0 = performance.now();

    for (var xx=0;xx<numToTest;xx++){
        var pp= pairsOfPositions[xx];
        aabbForTwo4_1(pp[0], pp[1]);
    }
    var time1 = performance.now();

    for (var xx=0;xx<numToTest;xx++){
        var pp= pairsOfPositions[xx];
        aabbForTwo4_2(pp[0], pp[1]);
    }
    var time2 = performance.now();
    
    for (var xx=0;xx<numToTest;xx++){
        var pp= pairsOfPositions[xx];
        aabbForTwo4_3(pp[0], pp[1]);
    }
    var time3 = performance.now();

    console.log({
        aabbForTwo4_1: time1-time0, //slowest
        aabbForTwo4_2: time2-time1, //about equal to 3 in browser, code more obvious. 
        aabbForTwo4_3: time3-time2 //slightly faster than 2 in node 
    });
}


function testAAbbCombineForFuncs(numToTest){
    var aabbPairs = [];
    for (var xx=0;xx<numToTest;xx++){
        aabbPairs.push(aabbForTwo4_2([randomFourvec(),randomFourvec()],[randomFourvec(),randomFourvec()]));
    }
    var time0 = performance.now();

    for (var xx=0;xx<numToTest;xx++){
        var aabbs= aabbPairs[xx];
        combinedAABB(aabbs[0], aabbs[1]);
    }
    var time1 = performance.now();

    for (var xx=0;xx<numToTest;xx++){
        var aabbs= aabbPairs[xx];
        combinedAABB4(aabbs[0], aabbs[1]);
    }
    var time2 = performance.now();
    

    console.log({
        combinedAABB: time1-time0,
        combinedAABB4: time2-time1,
    });
}


testAAbbForFuncs(100000);
testAAbbCombineForFuncs(100000);