//note the 0th dimension is plane will project onto (0th dimension =1)

//var testDirections = [[1,1],[1,0.5],[1,0]].map(vv => normalise(vv));    //results match well for 2d->1d projection

// var testDirections = [
//     [1,1,0],
//     [1,1,1],
// //    [1,0,0],
// ].map(vv => normalise(vv));


var testDirections = [[1,1,0,0],[1,1,1,1]].map(vv => normalise(vv));


testDirections.forEach(dd => 
    calcProjectedAABB(dd, 0.3)
);


function calcProjectedAABB(position, radius){

    //first brute force.
    //make a sphere positioned at position*(1+ r*r)
    var sphereDistFromOrigin = 1 + radius*radius;
    var spherePos = position.map(xx=>xx*sphereDistFromOrigin );
    var sphereRadius = radius * Math.sqrt(sphereDistFromOrigin);

    var fullNumDimensions = position.length;
    var pointsOnSphere = Array.from({
        length: 100_000
    }, () => randomNormalisedVector(position.length));
    pointsOnSphere = pointsOnSphere.map(xx => xx.map((xxx,ii) => xxx*sphereRadius + spherePos[ii])); //vector add.

    //calc AABB for this by brute force.
    var projectedPoints = pointsOnSphere.map(pp => pp.slice(1).map(qq=> qq/pp[0]));
    
    var aabb = [Math.min, Math.max].map(ff => 
        Array.from({
            length: fullNumDimensions-1
        }, _=>0).map((_,ii) => ff.apply(null,projectedPoints.map(pp=>pp[ii])))
    );

    //console.log(projectedPoints);
    
    //this appears to be correct
    // var aabbAnalyticCorrect1 = [
    //     spherePos.slice(1).map(pp => Math.tan( Math.atan2(pp, spherePos[0]) - Math.asin(sphereRadius/Math.sqrt(spherePos[0]*spherePos[0]+ pp*pp)))),
    //     spherePos.slice(1).map(pp => Math.tan( Math.atan2(pp, spherePos[0]) + Math.asin(sphereRadius/Math.sqrt(spherePos[0]*spherePos[0]+ pp*pp))))
    // ];
    //equivalent to 
    var aabbAnalytic1 = [
        position.slice(1).map(pp => Math.tan( Math.atan2(pp, position[0]) - Math.asin(sphereRadius/(sphereDistFromOrigin*Math.sqrt(position[0]*position[0]+ pp*pp))))),
        position.slice(1).map(pp => Math.tan( Math.atan2(pp, position[0]) + Math.asin(sphereRadius/(sphereDistFromOrigin*Math.sqrt(position[0]*position[0]+ pp*pp)))))
    ];

    //according to copilot, tan( atan2(y,x) - asin( (r*sqrt(1+r*r)) / ((1+r*r)*sqrt(x*x + y*y))) )
    // is    y root D - x r 
    //       --------------
    //       x root D + y r
    //
    // where D = ( 1+ r*r) ( x*x + y*y ) - r*r
    // already we have 1+r*r = sphereDistFromOrigin

    var posXSq = position[0] * position[0];
    var aabbAnalytic = [
        position.slice(1).map(pp => {
            var D = sphereDistFromOrigin * (pp*pp + posXSq) - radius*radius;
            var rootD = Math.sqrt(D);
            return (pp*rootD - position[0]*radius)/(position[0]*rootD + pp*radius);
        }),
        position.slice(1).map(pp => {
            var D = sphereDistFromOrigin * (pp*pp + posXSq) - radius*radius;
            var rootD = Math.sqrt(D);
            return (pp*rootD + position[0]*radius)/(position[0]*rootD - pp*radius);
        })
    ];

    console.log({
        position,
        radius, 
        aabb,
        aabbAnalytic1,
        aabbAnalytic
    });

}

function randomNormalisedVector(numDimensions){
    var arr = Array.from({
        length: numDimensions
    }, () => Math.random()-0.5);
    return normalise(arr);
}

function normalise(arr){
    var arrLen = Math.hypot.apply(null, arr);
    return arr.map(xx=>xx/arrLen);
}