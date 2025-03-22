
const NUM_CIRCLES = 1_000;
const MAX_OBJ_SIZE = 0.2;

console.log("hello world");
//3D AABB collision testing for circular regions on a sphere
//compare with basic circle test (suspect similar speed)
//use AABBs to generate 

//generate circles at random positions on sphere with random radius
var circles = [];
for (var ii=0;ii<NUM_CIRCLES;ii++){
    circles.push(randomCircle());
}

var collisionCountSimple = 0;
var collisionCountSimple1 = 0;
var collisionCountSimple2 = 0;
var collisionCountAABB = 0;

console.time("simple circles");
for (var ii=0;ii<NUM_CIRCLES;ii++){
    for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
        collisionCountSimple+= collisionTestSimple(circles[ii],circles[jj]) ? 1:0;
    }
}
console.timeEnd("simple circles");

console.time("simple circles 1");
for (var ii=0;ii<NUM_CIRCLES;ii++){
    for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
        collisionCountSimple1+= collisionTestSimple1(circles[ii],circles[jj]) ? 1:0;
    }
}
console.timeEnd("simple circles 1");

console.time("simple circles 2");
for (var ii=0;ii<NUM_CIRCLES;ii++){
    for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
        collisionCountSimple2+= collisionTestSimple2(circles[ii],circles[jj]) ? 1:0;
    }
}
console.timeEnd("simple circles 2");

console.time("aabb");
for (var ii=0;ii<NUM_CIRCLES;ii++){
    for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
        var circle1 = circles[ii];
        var circle2 = circles[jj];
        collisionCountAABB+= collisionTestAABB(circle1, circle2) && collisionTestSimple2(circle1, circle2) ? 1:0;
    }
}
console.timeEnd("aabb");


console.log("total collision tests: " + NUM_CIRCLES*NUM_CIRCLES);
console.log("collisions detected: " + collisionCountSimple);
console.log("collisions detected 1: " + collisionCountSimple1);
console.log("collisions detected 2: " + collisionCountSimple2);
console.log("collisions detected AABB: " + collisionCountAABB);

function randomCircle(){
    var xyz = [0,0,0].map(unused => Math.random()-0.5);
    //normalise
    var lensq = xyz[0]*xyz[0] + xyz[1]*xyz[1] + xyz[2]*xyz[2];
    var len = Math.sqrt(lensq);
    if (len == 0){    //unlikely but should catch this!
        x=1;
        len=1;
    }
    xyz = xyz.map(component => component/len);

    var rad = Math.random()*MAX_OBJ_SIZE;
    //opp=rad. adj=1. sinAng = rad. cosAng = sqrt(1-sin^2) 

    var angRad = Math.atan(rad);
    //note could probably replace sin cos tan with squares, roots etc, but this is precalculation so unimportant

    var cosAng = Math.cos(angRad);

    //AABB calculation? 
    var centreOfCircle = xyz.map(component => component*cosAng);
    var projectedCircleRad = rad*cosAng;
    var circleAABBSize = [1-xyz[0]*xyz[0] , 1-xyz[1]*xyz[1], 1-xyz[2]*xyz[2] ]
        .map(Math.sqrt)
        .map(component => component*projectedCircleRad);
    var AABB = centreOfCircle.map((component,ii) => [component - circleAABBSize[ii], component + circleAABBSize[ii]]);

    //find out whether the circle surrounds one of the axes.
    for (var ii=0;ii<3;ii++){
        if (xyz[ii] > cosAng){
            AABB[ii][1]=1;
        }
        if (xyz[ii] <-cosAng){
            AABB[ii][0]=-1;
        }
    }

    return {
        position: xyz,
        angRad,
        sinAng: Math.sin(angRad),
        cosAng,
        AABB
    }
}

function dotProduct(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2];
}

function collisionTestSimple(circle1, circle2){
    var totalAngRad = circle1.angRad + circle2.angRad;
    var dotProd = dotProduct(circle1.position, circle2.position);
    //var angleBetween = Math.acos(dotProd);    //this gets different result to others because dotProd can be >1 due to numerical error
    var angleBetween = dotProd>1 ? 0 :Math.acos(dotProd);
    return angleBetween<totalAngRad;
}

function collisionTestSimple1(circle1, circle2){    //faster
    var totalAngRad = circle1.angRad + circle2.angRad;
    var dotProd = dotProduct(circle1.position, circle2.position);
    var cosTotalAngRad = Math.cos(totalAngRad); 
    return dotProd>cosTotalAngRad;
}

function collisionTestSimple2(circle1, circle2){    //faster still, avoids cos call from Simple1
    //using compound angle formula cos(A+B) = cosAcosB - sinAsinB
    var compondCosAngle = circle1.cosAng*circle2.cosAng - circle1.sinAng*circle2.sinAng;
    var dotProd = dotProduct(circle1.position, circle2.position);
    return dotProd>compondCosAngle;
}

function collisionTestAABB(circle1, circle2){    //faster still, avoids cos call from Simple1
    var intersection = true;
    for (var ii=0;ii<3;ii++){
            //leftmost of each span left of the rightmost of the other
        var thisAxisIntersects = circle1.AABB[ii][0] < circle2.AABB[ii][1] && circle2.AABB[ii][0] < circle1.AABB[ii][1];
        intersection = intersection && thisAxisIntersects;
    }

    return intersection;
}


//TODO
/*
measure time to generate data for circles (probably pretty quick so could do at runtime for moving objects OK)
morton encoding = faster due to more likely to discard on 1st check?
3-sphere version
BVH
sphere trees simpler? how speed compares?
*/