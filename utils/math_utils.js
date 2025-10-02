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
