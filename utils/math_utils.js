function findOrthoVecByDiags(inputVecs){
    // this is findOrthoVecByDiags3 from orthogonal-4vecs.js test node project
    // the 6 terms below are 2x2 determinants
    var a01 = inputVecs[0][0]*inputVecs[1][1] - inputVecs[0][1]*inputVecs[1][0];
    var a02 = inputVecs[0][0]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][0];
    var a03 = inputVecs[0][0]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][0];
    var a12 = inputVecs[0][1]*inputVecs[1][2] - inputVecs[0][2]*inputVecs[1][1];
    var a13 = inputVecs[0][1]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][1];
    var a23 = inputVecs[0][2]*inputVecs[1][3] - inputVecs[0][3]*inputVecs[1][2];
    return [
        a13*inputVecs[2][2] -a23*inputVecs[2][1] -a12*inputVecs[2][3],
        a02*inputVecs[2][3] -a03*inputVecs[2][2] +a23*inputVecs[2][0],
        -a01*inputVecs[2][3] +a03*inputVecs[2][1] -a13*inputVecs[2][0],
        a01*inputVecs[2][2] -a02*inputVecs[2][1] +a12*inputVecs[2][0]
    ];
}

function findClosePointsBetweenGreatCircles(greatCircle1, greatCircle2){
    //find a pair of points, one on each great circle, which are closest aproach. switching sign of points also is a pair of closest points.

    var AC = dotProduct4(greatCircle1[0], greatCircle2[0]);
    var AD = dotProduct4(greatCircle1[0], greatCircle2[1]);
    var BC = dotProduct4(greatCircle1[1], greatCircle2[0]);
    var BD = dotProduct4(greatCircle1[1], greatCircle2[1]);

    var test1 = Math.atan2(AD + BC, AC - BD);
    var test2 = Math.atan2(-AD + BC, AC + BD);

    var uAnalytic = (test1 + test2) /2;
    var vAnalytic = (test1 - test2) /2;

    var closestPointAnalytic1 = greatCirclePositionForAngle(greatCircle1, uAnalytic);
    var closestPointAnalytic2 = greatCirclePositionForAngle(greatCircle2, vAnalytic);

    return [closestPointAnalytic1, closestPointAnalytic2];
}


function findAxisBetweenGreatCircles(greatCircle1, greatCircle2){
    //direction between closest points, but without problem/sign switch at crossing.
    //find point that is perpendicular to average of crossing points, and points 90 deg around world on each circle.
    //TODO detect/reject (near) parallel great circles (like cross product between parallel vecs makes no sense.)

    //find a pair of points, one on each great circle, which are closest aproach. switching sign of points also is a pair of closest points.

    var AC = dotProduct4(greatCircle1[0], greatCircle2[0]);
    var AD = dotProduct4(greatCircle1[0], greatCircle2[1]);
    var BC = dotProduct4(greatCircle1[1], greatCircle2[0]);
    var BD = dotProduct4(greatCircle1[1], greatCircle2[1]);

    var test1 = Math.atan2(AD + BC, AC - BD);
    var test2 = Math.atan2(-AD + BC, AC + BD);

    var uAnalytic = (test1 + test2) /2;
    var vAnalytic = (test1 - test2) /2;

    var closestPointAnalytic1 = greatCirclePositionForAngle(greatCircle1, uAnalytic);
    var closestPointAnalytic2 = greatCirclePositionForAngle(greatCircle2, vAnalytic);

    var sumPoint = vectorSum4d(closestPointAnalytic1.close, closestPointAnalytic2.close); //average, but don't need to normalise

    var axis = findOrthoVecByDiags([sumPoint, closestPointAnalytic1.ninetyDegAround, closestPointAnalytic2.ninetyDegAround]);

    return {sumPoint, axis:normalise(axis)};
}

function greatCirclePositionForAngle(gs, ang){
    var cosSinAng = [Math.cos(ang), Math.sin(ang)];
    return {
        close:[0,0,0,0].map((_,ii)=> gs[0][ii]*cosSinAng[0] + gs[1][ii]*cosSinAng[0]*cosSinAng[1]),
        ninetyDegAround:[0,0,0,0].map((_,ii)=> gs[0][ii]*cosSinAng[1] - gs[1][ii]*cosSinAng[0]*cosSinAng[0])
    };
}
