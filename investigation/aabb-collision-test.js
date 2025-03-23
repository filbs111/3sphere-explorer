
const NUM_CIRCLES = 1000;
const MAX_OBJ_SIZE = 0.01;

console.log("hello world");
//3D AABB collision testing for circular regions on a sphere
//compare with basic circle test (suspect similar speed)
//use AABBs to generate 

//generate circles at random positions on sphere with random radius
var circles = [];
for (var ii=0;ii<NUM_CIRCLES;ii++){
    circles.push(randomCircle());
}

//construct tree
//many ways to do this. 
//order by morton code. then just create a binary tree by pairing successively
//maybe no need for explicit links between layers, but complicated by non power of 2- how to handle only 1 item?

circles.sort((circleA, circleB) => circleB.centreMorton - circleA.centreMorton);

//test array to groups
//console.log(arrayToGroups([1,2,3,4,5,6],2));

var bvh = generateBvh(circles, 8);  //can tune group size. smallest 2 for binary tree. larger numbers for shallower trees

var collisionCountSimple = 0;
var collisionCountSimple1 = 0;
var collisionCountSimple2 = 0;
var collisionCountAABB = 0;
var collisionCountMorton = 0;
var collisionCountBvh = 0;
var collisionCountBvhPossibilities = 0;

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

console.time("aabb morton");
for (var ii=0;ii<NUM_CIRCLES;ii++){
    for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
        var circle1 = circles[ii];
        var circle2 = circles[jj];
        collisionCountMorton+= 
            collisionTestMorton(circle1, circle2) && 
            collisionTestAABB(circle1, circle2) && 
            collisionTestSimple2(circle1, circle2) ? 1:0;
    }
}
console.timeEnd("aabb morton");


console.time("bvh");
var countBvhFuncCalls=0;

for (var ii=0;ii<NUM_CIRCLES;ii++){
    var circle1 = circles[ii];
    var possibles = collisionTestBvh(circle1, bvh);

    collisionCountBvhPossibilities+=possibles.length;

    possibles.forEach(possibility => {
        collisionCountBvh += collisionTestSimple2(circle1, possibility) ? 1:0;   
            //TODO is AABB test applied at leaf node? perhaps shouldn't - circle test faster anyway 
    });
}
console.timeEnd("bvh");



console.log("total collision tests: " + NUM_CIRCLES*NUM_CIRCLES);
console.log("collisions detected: " + collisionCountSimple);
console.log("collisions detected 1: " + collisionCountSimple1);
console.log("collisions detected 2: " + collisionCountSimple2);
console.log("collisions detected AABB: " + collisionCountAABB);
console.log("collisions detected morton: " + collisionCountMorton);

console.log("possibilities processed bvh: " + collisionCountBvhPossibilities);
console.log("collisions detected BVH: " + collisionCountBvh);

console.log(countBvhFuncCalls);

//console.log(circles);

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
    var AABB = [-1,1].map(sign => centreOfCircle.map((component,ii) => component + sign*circleAABBSize[ii] ));

    //find out whether the circle surrounds one of the axes.
    for (var ii=0;ii<3;ii++){
        if (xyz[ii] > cosAng){
            AABB[1][ii]=1;
        }
        if (xyz[ii] <-cosAng){
            AABB[0][ii]=-1;
        }
    }

    return {
        position: xyz,
        angRad,
        sinAng: Math.sin(angRad),
        cosAng,
        AABB,
        morton: AABB.map(morton3),
        centreMorton: morton3(xyz)
    }
}

function dotProduct(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2];
}

function morton3(threevec){
    //might be slow and crap! 
    //TODO round up or down the response to this?
    var bitarrays = threevec.map(xx => {

        var intnum = (xx+1)*512;
        intnum = Math.min(intnum, 1023);  //because could be 1024 before this? 

        var bits = [...Array(10)].map((x,i)=>intnum>>i&1);
            //least to most significant 10 bits

        return bits
    } ); //map 0 to 2 to 0 to 2^32

    //console.log(bitarrays);

    var morton 
        = (bitarrays[0][9] << 29)
        + (bitarrays[1][9] << 28)
        + (bitarrays[2][9] << 27)
        + (bitarrays[0][8] << 26)
        + (bitarrays[1][8] << 25)
        + (bitarrays[2][8] << 24)
        + (bitarrays[0][7] << 23)
        + (bitarrays[1][7] << 22)
        + (bitarrays[2][7] << 21)
        + (bitarrays[0][6] << 20)
        + (bitarrays[1][6] << 19)
        + (bitarrays[2][6] << 18)
        + (bitarrays[0][5] << 17)
        + (bitarrays[1][5] << 16)
        + (bitarrays[2][5] << 15)
        + (bitarrays[0][4] << 14)
        + (bitarrays[1][4] << 13)
        + (bitarrays[2][4] << 12)
        + (bitarrays[0][3] << 11)
        + (bitarrays[1][3] << 10)
        + (bitarrays[2][3] << 9)
        + (bitarrays[0][2] << 8)
        + (bitarrays[1][2] << 7)
        + (bitarrays[2][2] << 6)
        + (bitarrays[0][1] << 5)
        + (bitarrays[1][1] << 4)
        + (bitarrays[2][1] << 3)
        + (bitarrays[0][0] << 2)
        + (bitarrays[1][0] << 1)
        + (bitarrays[2][0]);

    return morton;
}


function generateBvh(items, groupSize){

    if (items.length < 2){  //TODO why is length ever 0?
        //console.log("returning because items of length: " + items.length);
        //console.log(items);
        return items[0];
    }

    var groups = arrayToGroups(items, groupSize);
    //console.log("NUM GROUPS:" + groups.length);

    var nextLayerUp = groups.map(group => {
        //find min, max AABB of group.
        // var AABB = [0,1,2].map(
        //     ii => [
        //         Math.min( group.map(item => item.AABB[0][ii] )),
        //         Math.max( group.map(item => item.AABB[1][ii] ))
        //     ]);

        //console.log(JSON.stringify(group));

        var minAABBPoints = [0,1,2].map( component => group.map(item => item.AABB[0][component]));
        var minAABB = minAABBPoints.map( minAABBPointsForComponent => Math.min.apply(null, minAABBPointsForComponent));

        var maxAABBPoints = [0,1,2].map( component => group.map(item => item.AABB[1][component]));
        var maxAABB = maxAABBPoints.map( maxAABBPointsForComponent => Math.max.apply(null, maxAABBPointsForComponent));

        // console.log({
        //     minAABBPoints,
        //     minAABB,
        //     maxAABBPoints,
        //     maxAABB
        // });

        var morton = [
            Math.min.apply(null, group.map(item => item.morton[0])),
            Math.max.apply(null, group.map(item => item.morton[1]))
        ];

        var toReturn = {
            group,
            AABB: [minAABB, maxAABB],
            morton
        };
        //console.log("toReturn");
        //console.log(toReturn);
        return toReturn;

        // return {
        //     group,
        //     AABB: [minAABB, maxAABB],
        //     morton
        // }
    });

    //console.log(nextLayerUp);

    return generateBvh(nextLayerUp, groupSize);
}

function arrayToGroups(initialArray, groupSize){
    https://stackoverflow.com/a/44996257
    //altered to take arbitrary group size instead of hard coded to 2.
    return initialArray.reduce(function(result, value, index, array) {
        if (index % groupSize === 0)
          result.push(array.slice(index, index + groupSize));
        return result;
      }, []);
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
        var thisAxisIntersects = circle1.AABB[0][ii] < circle2.AABB[1][ii] && circle2.AABB[0][ii] < circle1.AABB[1][ii];
        intersection = intersection && thisAxisIntersects;
    }

    return intersection;
}

function collisionTestMorton(circle1, circle2){
    return circle1.morton[0] <= circle2.morton[1] && circle2.morton[0] <= circle1.morton[1];
}

//TOOD 2 versions of this - one using just min, max morton values, one using AABB. which is faster?
//this returns possible colliding bvh nodes in the group.
function collisionTestBvh(circle1, bvh){
    
    countBvhFuncCalls+=1;

    if (!bvh.group){ //is a leaf node
        //console.log("returning because bvh has no group");
        //console.log(bvh);

        return bvh;
    }

    var filteredGroup =  bvh.group.filter(
            item =>
            collisionTestAABB(circle1, item)
        );
    
    return filteredGroup.map(group2 => collisionTestBvh(circle1, group2)).flat();
}


//TODO
/*
measure time to generate data for circles (probably pretty quick so could do at runtime for moving objects OK)
3-sphere version
BVH
    for AABBs
    sphere trees simpler? faster?

morton
store centre, 2 corners

to construct tree top down (or could do bottom up if decide up front, just group in 2s then the result in 2s etc? just sort by morton centre and use as tree in situ?)
sort by morton of the centre of each AABB (imagine consuming from either end - to minimise total overlap given have same num on each side, makes sense
    if think about it! https://www.youtube.com/watch?v=LAxHQZ8RjQ4)


why is BVH slower than just testing all circles separately?
is sort failing?
does the BVH look ok? 
is the code too javascripty - better to use typedarrays?
*/