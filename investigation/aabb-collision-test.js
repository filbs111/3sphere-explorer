
const NUM_CIRCLES = 8000;
const FIRST_CIRCLE_COUNT = 20;  //must not be greater than NUM_CIRCLES
const MAX_OBJ_SIZE = 0.01;
var temp3vec = [...new Array(3)];
var temp4vec = [...new Array(4)];
var countBvhFuncCalls=0;

console.log("hello world");
//3D AABB collision testing for circular regions on a sphere
//compare with basic circle test (suspect similar speed)
//use AABBs to generate 

//var randFunctionToUse = Math.random;  //uniform
var randFunctionToUse = randomCantorMember; //cantor set -maybe more representative of real data because clustered
doCirclesOnSphereTest();
doSpheresOn3SphereTest();

function doCirclesOnSphereTest(){
    //generate circles at random positions on sphere with random radius
    var circles = [];
    for (var ii=0;ii<NUM_CIRCLES;ii++){
        circles.push(randomCircle(randFunctionToUse));
    }

    //construct tree
    //many ways to do this. 
    //order by morton code. then just create a binary tree by pairing successively
    //maybe no need for explicit links between layers, but complicated by non power of 2- how to handle only 1 item?

    circles.sort(mortonSort);

    //test array to groups
    //console.log(arrayToGroups([1,2,3,4,5,6],2));

    var bvh = generateBvh(circles, temp3vec, 8);  //can tune group size. smallest 2 for binary tree. larger numbers for shallower trees

    circles.sort(hilbertSort);
    var bvhHilbert = generateBvh(circles, temp4vec, 8);

    var bvhCones = generateConeBvh(circles);

    var collisionCountSimple = 0;
    var collisionCountSimple1 = 0;
    var collisionCountSimple2 = 0;
    var collisionCountAABB = 0;
    var collisionCountMorton = 0;
    var collisionCountBvh = 0;
    var collisionCountBvhPossibilities = 0;
    var collisionCountBvhHilbert = 0;
    var collisionCountBvhHilbertPossibilities = 0;
    var collisionCountCones = 0;

    console.time("simple circles");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            collisionCountSimple+= collisionTestSimple(circles[ii],circles[jj]) ? 1:0;
        }
    }
    console.timeEnd("simple circles");

    console.time("simple circles 1");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            collisionCountSimple1+= collisionTestSimple1(circles[ii],circles[jj]) ? 1:0;
        }
    }
    console.timeEnd("simple circles 1");

    console.time("simple circles 2");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            collisionCountSimple2+= collisionTestSimple2(circles[ii],circles[jj]) ? 1:0;
        }
    }
    console.timeEnd("simple circles 2");

    console.time("aabb");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            var circle1 = circles[ii];
            var circle2 = circles[jj];
            collisionCountAABB+= collisionTestAABB(circle1, circle2) && collisionTestSimple2(circle1, circle2) ? 1:0;
        }
    }
    console.timeEnd("aabb");

    console.time("morton");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            var circle1 = circles[ii];
            var circle2 = circles[jj];
            collisionCountMorton+= 
                collisionTestMorton(circle1, circle2) && 
                collisionTestSimple2(circle1, circle2) ? 1:0;
        }
    }
    console.timeEnd("morton");

    countBvhFuncCalls=0;
    console.time("bvh");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        var circle1 = circles[ii];
        var possibles = collisionTestBvh(circle1, bvh);

        collisionCountBvhPossibilities+=possibles.length;

        possibles.forEach(possibility => {
            collisionCountBvh += collisionTestSimple2(circle1, possibility) ? 1:0;   
                //TODO is AABB test applied at leaf node? perhaps shouldn't - circle test faster anyway 
        });
    }
    console.timeEnd("bvh");

    var countBvhFuncCalls1= countBvhFuncCalls;
    countBvhFuncCalls=0;

    console.time("bvh Hilbert");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        var circle1 = circles[ii];
        var possibles = collisionTestBvh(circle1, bvhHilbert);

        collisionCountBvhHilbertPossibilities+=possibles.length;

        possibles.forEach(possibility => {
            collisionCountBvhHilbert += collisionTestSimple2(circle1, possibility) ? 1:0;   
                //TODO is AABB test applied at leaf node? perhaps shouldn't - circle test faster anyway 
        });
    }
    console.timeEnd("bvh Hilbert");

    console.time("bvh cones");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        var circle1 = circles[ii];
        collisionCountCones+= collisionTestBvhCones(circle1, bvhCones).length;
    }
    console.timeEnd("bvh cones");

    console.log("total collision tests: " + FIRST_CIRCLE_COUNT*NUM_CIRCLES);
    console.log("collisions detected: " + collisionCountSimple);
    console.log("collisions detected 1: " + collisionCountSimple1);
    console.log("collisions detected 2: " + collisionCountSimple2);
    console.log("collisions detected AABB: " + collisionCountAABB);
    console.log("collisions detected morton: " + collisionCountMorton);

    console.log("possibilities processed bvh: " + collisionCountBvhPossibilities);
    console.log("collisions detected BVH: " + collisionCountBvh);
    console.log(countBvhFuncCalls1);
    console.log("possibilities processed bvh Hilbert: " + collisionCountBvhHilbertPossibilities);
    console.log("collisions detected BVH Hilbert: " + collisionCountBvhHilbert);
    console.log(countBvhFuncCalls);
    console.log("collisions detected BVH cones: " + collisionCountCones);
}

function doSpheresOn3SphereTest(){
    var items = [];
    for (var ii=0;ii<NUM_CIRCLES;ii++){
        items.push(randomSphere(randFunctionToUse));
    }

    items.sort(mortonSort);
    var bvh = generateBvh(items, temp4vec, 16);

    items.sort(hilbertSort);
    var bvhHilbert = generateBvh(items, temp4vec, 16);
    
    var collisionCountSimple = 0;
    var collisionCountSimple1 = 0;
    var collisionCountSimple2 = 0;
    var collisionCountAABB = 0;
    var collisionCountMorton = 0;
    var collisionCountBvh = 0;
    var collisionCountBvhPossibilities = 0;
    var collisionCountBvh = 0;
    var collisionCountBvhPossibilities = 0;
    var collisionCountBvhHilbert = 0;
    var collisionCountBvhHilbertPossibilities = 0;

    console.time("simple spheres");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            collisionCountSimple+= collisionTestSimpleSpheres(items[ii],items[jj]) ? 1:0;
        }
    }
    console.timeEnd("simple spheres");

    console.time("simple spheres 1");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            collisionCountSimple1+= collisionTestSimpleSpheres1(items[ii],items[jj]) ? 1:0;
        }
    }
    console.timeEnd("simple spheres 1");

    console.time("simple spheres 2");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            collisionCountSimple2+= collisionTestSimpleSpheres2(items[ii],items[jj]) ? 1:0;
        }
    }
    console.timeEnd("simple spheres 2");

    console.time("aabb spheres");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            var items1 = items[ii];
            var items2 = items[jj];
            collisionCountAABB+= collisionTestAABBSpheres(items1, items2) && collisionTestSimpleSpheres2(items1, items2) ? 1:0;
        }
    }
    console.timeEnd("aabb spheres");

    console.time("morton spheres");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        for (var jj=0;jj<NUM_CIRCLES;jj++){ //doubles up collision checks (i vs j, j vs i), but unimportant
            var sphere1 = items[ii];
            var sphere2 = items[jj];
            collisionCountMorton+= 
                collisionTestMorton(sphere1, sphere2) && 
                collisionTestSimpleSpheres2(sphere1, sphere2) ? 1:0;
        }
    }
    console.timeEnd("morton spheres");

    console.time("bvh for spheres");
    collisionCountBvh=0;
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        var sphere1 = items[ii];
        var possibles = collisionTestBvhForSpheres(sphere1, bvh);

        collisionCountBvhPossibilities+=possibles.length;

        possibles.forEach(possibility => {
            collisionCountBvh += collisionTestSimpleSpheres2(sphere1, possibility) ? 1:0;   
        });
    }
    console.timeEnd("bvh for spheres");

    var countBvhFuncCalls1= countBvhFuncCalls;
    countBvhFuncCalls=0;

    console.time("bvh hilbert for spheres");
    for (var ii=0;ii<FIRST_CIRCLE_COUNT;ii++){
        var sphere1 = items[ii];
        var possibles = collisionTestBvhForSpheres(sphere1, bvhHilbert);

        collisionCountBvhHilbertPossibilities+=possibles.length;

        possibles.forEach(possibility => {
            collisionCountBvhHilbert += collisionTestSimpleSpheres2(sphere1, possibility) ? 1:0;   
        });
    }
    console.timeEnd("bvh hilbert for spheres");


    console.log("total collision tests: " + FIRST_CIRCLE_COUNT*NUM_CIRCLES);
    console.log("collisions detected: " + collisionCountSimple);
    console.log("collisions detected 1: " + collisionCountSimple1);
    console.log("collisions detected 2: " + collisionCountSimple2);
    console.log("collisions detected AABB: " + collisionCountAABB);
    console.log("collisions detected morton: " + collisionCountMorton);

    console.log("possibilities processed bvh: " + collisionCountBvhPossibilities);
    console.log("collisions detected BVH: " + collisionCountBvh);
    console.log(countBvhFuncCalls1);
    console.log("possibilities processed bvh Hilbert: " + collisionCountBvhHilbertPossibilities);
    console.log("collisions detected BVH Hilbert: " + collisionCountBvhHilbert);
    console.log(countBvhFuncCalls);
}



function randomCircle(randFunc){
    var position = temp3vec.map(unused => randFunc()-0.5);
    //normalise
    var len = Math.hypot.apply(null, position);
    if (len == 0){    //unlikely but should catch this!
        position[0]=1;
        len=1;
    }
    position = position.map(component => component/len);

    var rad = Math.random()*MAX_OBJ_SIZE;
    //opp=rad. adj=1. sinAng = rad. cosAng = sqrt(1-sin^2) 

    var angRad = Math.atan(rad);
    //note could probably replace sin cos tan with squares, roots etc, but this is precalculation so unimportant

    var cosAng = Math.cos(angRad);

    //AABB calculation? 
    var positionOfCircle = position.map(component => component*cosAng);
    var projectedCircleRad = rad*cosAng;
    var circleAABBSize = temp3vec.map((_,ii)=> [1-position[ii]*position[ii]])
        .map(Math.sqrt)
        .map(component => component*projectedCircleRad);
    var AABB = [-1,1].map(sign => positionOfCircle.map((component,ii) => component + sign*circleAABBSize[ii] ));

    //find out whether the circle surrounds one of the axes.
    for (var ii=0;ii<3;ii++){
        if (position[ii] > cosAng){
            AABB[1][ii]=1;
        }
        if (position[ii] <-cosAng){
            AABB[0][ii]=-1;
        }
    }

    return {
        position,
        angRad,
        sinAng: Math.sin(angRad),
        cosAng,
        AABB,
        morton: AABB.map(morton3),
        positionMorton: morton3(position),
        positionHilbert: hilbert3(position)
    }
}
function randomSphere(randFunc){
    var position = temp4vec.map(unused => randFunc()-0.5);
    //normalise
    var len = Math.hypot.apply(null, position);
    if (len == 0){    //unlikely but should catch this!
        position[0]=1;
        len=1;
    }
    position = position.map(component => component/len);

    var rad = Math.random()*MAX_OBJ_SIZE;
    //opp=rad. adj=1. sinAng = rad. cosAng = sqrt(1-sin^2) 

    var angRad = Math.atan(rad);
    //note could probably replace sin cos tan with squares, roots etc, but this is precalculation so unimportant

    var cosAng = Math.cos(angRad);

    //AABB calculation? 
    var positionOfCircle = position.map(component => component*cosAng);
    var projectedCircleRad = rad*cosAng;
    var circleAABBSize = temp4vec.map((_,ii)=> [1-position[ii]*position[ii]])
        .map(Math.sqrt)
        .map(component => component*projectedCircleRad);
    var AABB = [-1,1].map(sign => positionOfCircle.map((component,ii) => component + sign*circleAABBSize[ii] ));

    //find out whether the circle surrounds one of the axes.
    for (var ii=0;ii<4;ii++){
        if (position[ii] > cosAng){
            AABB[1][ii]=1;
        }
        if (position[ii] <-cosAng){
            AABB[0][ii]=-1;
        }
    }

    return {
        position,
        angRad,
        sinAng: Math.sin(angRad),
        cosAng,
        AABB,
        morton: AABB.map(morton4),
        positionMorton: morton4(position),
        positionHilbert: hilbert4(position)
    }
}

function randomCantorMember(){
    return randomCantorMemberForIterations(20);
}
//thanks to bing AI for this one! prompt: "random member of cantor set in javascript"
function randomCantorMemberForIterations(iterations) {
    let number = 0;
    let scale = 1;

    for (let i = 0; i < iterations; i++) {
        scale /= 3;
        let digit = Math.floor(Math.random() * 2);
        number += digit * scale;
    }

    return number;
}




function mortonSort(itemA, itemB){
    return itemB.positionMorton - itemA.positionMorton;
}
function hilbertSort(itemA, itemB){
    return itemB.positionHilbert - itemA.positionHilbert;
}

function dotProduct(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2];
}
function dotProduct4(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2] + first[3]*second[3];
}

function hilbert3(threevec){
    var intCoords = threevec.map(xx => {
        var intnum = (xx+1)*512;    //map -1 to 1 to 0 to 1024
        intnum = Math.min(intnum, 1023);
        return intnum;
    });
    return hilbertIndex(intCoords, 10);
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

function hilbert4(fourvec){
    var intCoords = fourvec.map(xx => {
        var intnum = (xx+1)*128;    //map -1 to 1 to 0 to 255
        intnum = Math.min(intnum, 255);  //because could be 256 before this?
        return intnum;
    });
    return hilbertIndex(intCoords, 8);
}

function morton4(fourvec){
    //might be slow and crap! 
    var bitarrays = fourvec.map(xx => {

        var intnum = (xx+1)*128;
        intnum = Math.min(intnum, 255);  //because could be 256 before this? 

        var bits = [...Array(8)].map((x,i)=>intnum>>i&1);
            //least to most significant 8 bits

        return bits
    } );

    var morton 
        = (bitarrays[0][7] << 31)
        + (bitarrays[1][7] << 30)
        + (bitarrays[2][7] << 29)
        + (bitarrays[3][7] << 28)
        + (bitarrays[0][6] << 27)
        + (bitarrays[1][6] << 26)
        + (bitarrays[2][6] << 25)
        + (bitarrays[3][6] << 24)
        + (bitarrays[0][5] << 23)
        + (bitarrays[1][5] << 22)
        + (bitarrays[2][5] << 21)
        + (bitarrays[3][5] << 20)
        + (bitarrays[0][4] << 19)
        + (bitarrays[1][4] << 18)
        + (bitarrays[2][4] << 17)
        + (bitarrays[3][4] << 16)
        + (bitarrays[0][3] << 15)
        + (bitarrays[1][3] << 14)
        + (bitarrays[2][3] << 13)
        + (bitarrays[3][3] << 12)
        + (bitarrays[0][2] << 11)
        + (bitarrays[1][2] << 10)
        + (bitarrays[2][2] << 9)
        + (bitarrays[3][2] << 8)
        + (bitarrays[0][1] << 7)
        + (bitarrays[1][1] << 6)
        + (bitarrays[2][1] << 5)
        + (bitarrays[3][1] << 4)
        + (bitarrays[0][0] << 3)
        + (bitarrays[1][0] << 2)
        + (bitarrays[2][0] << 1)
        + (bitarrays[3][0]);

    //return morton;
    return morton^ 0x80000000;
}


function generateConeBvh(items){
    //just binary tree for now since can find circle surrounding 2 circles easily
    //TODO more levels, and optimise eg bin tree by surrounding only leaf nodes (requries code for minimum bounding circle/sphere for >2)
    //as is, is comparable to AABB also binary, but AABB works better for ~8 children per node. 
    // doing similar for cone tree and tightening to only circle leaf nodes might make it faster than AABB...

    //assume input sorted appropriately - hope Hilbert to work.
    
    //same logic as AABB tree building...
    //TODO generalise logic/function? 
    //note could build this at same time as the AABB BVH but want to do bin tree for now. 
    if (items.length < 2){
        return items[0];
    }

    var groups = arrayToGroups(items, 2);

    var nextLayerUp = groups.map(group => {
        
        //assuming a bin tree so group should be of length 1.
        
        //find centre and cos, sin for the new cone.
        //if rad in angle of circle1 is ang1, of circle2 is ang2, between is angBetween, is 
        // (ang1+ang2+between)/2 -ang1   along rotation from 1 to 2.
        // = (ang2-ang1+between)/2       ""
        
        //the angular radius of the bounding circle is (ang1+ang2+between)
        
        //calculate this jankily. TODO find efficient, neat formulation (compound angle formula etc)

        //console.log(group.length);
        if (group.length<2){
            return group[0];    //??should this happen?
        }

        var c1 = group[0];
        var c2 = group[1];
        var posDotProd = dotProduct(c1.position, c2.position);
        var safePosDotProd = Math.min(1,Math.max(-1, posDotProd));
        var angleBetween = Math.acos(safePosDotProd);
        var angRad = (angleBetween+c1.angRad+c2.angRad)/2;

        var toRotateFrom1To2 = (angleBetween+c2.angRad-c1.angRad)/2;
        var perpToC1 = c2.position.map((component,ii) => component - safePosDotProd*c1.position[ii]);
        //normalise it (TODO cover possibility that len=0)
        var len = Math.hypot.apply(null, perpToC1);
        perpToC1 = perpToC1.map(component => component/len);

        var position = c1.position.map((component, ii) => component*Math.cos(toRotateFrom1To2) + perpToC1[ii]*Math.sin(toRotateFrom1To2));

        var toReturn = {
            group,
            position,
            angRad, //TODO don't keep this if can eliminate from calculation by compound angle etc.
            cosAng: Math.cos(angRad),
            sinAng: Math.sin(angRad)
        };
        return toReturn;
    });


    return generateConeBvh(nextLayerUp);
}


function generateBvh(items, tempVec, groupSize){

    if (items.length < 2){  //TODO why is length ever 0?
        //console.log("returning because items of length: " + items.length);
        //console.log(items);
        return items[0];
    }

    var groups = arrayToGroups(items, groupSize);
    //console.log("NUM GROUPS:" + groups.length);

    var nextLayerUp = groups.map(group => {
        
        var minAABBPoints = tempVec.map( (_,component) => group.map(item => item.AABB[0][component]));
        var minAABB = minAABBPoints.map( minAABBPointsForComponent => Math.min.apply(null, minAABBPointsForComponent));

        var maxAABBPoints = tempVec.map( (_,component) => group.map(item => item.AABB[1][component]));
        var maxAABB = maxAABBPoints.map( maxAABBPointsForComponent => Math.max.apply(null, maxAABBPointsForComponent));

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
    });

    return generateBvh(nextLayerUp, tempVec, groupSize);
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
function collisionTestSimpleSpheres(sphere1, sphere2){
    var totalAngRad = sphere1.angRad + sphere2.angRad;
    var dotProd = dotProduct4(sphere1.position, sphere2.position);
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
function collisionTestSimpleSpheres1(sphere1, sphere2){    //faster
    var totalAngRad = sphere1.angRad + sphere2.angRad;
    var dotProd = dotProduct4(sphere1.position, sphere2.position);
    var cosTotalAngRad = Math.cos(totalAngRad); 
    return dotProd>cosTotalAngRad;
}

function collisionTestSimple2(circle1, circle2){    //faster still, avoids cos call from Simple1
    //using compound angle formula cos(A+B) = cosAcosB - sinAsinB
    var compondCosAngle = circle1.cosAng*circle2.cosAng - circle1.sinAng*circle2.sinAng;
    var dotProd = dotProduct(circle1.position, circle2.position);
    return dotProd>compondCosAngle;
}
function collisionTestSimpleSpheres2(sphere1, sphere2){    //faster still, avoids cos call from Simple1
    //using compound angle formula cos(A+B) = cosAcosB - sinAsinB
    var compondCosAngle = sphere1.cosAng*sphere2.cosAng - sphere1.sinAng*sphere2.sinAng;
    var dotProd = dotProduct4(sphere1.position, sphere2.position);
    return dotProd>compondCosAngle;
}

function collisionTestAABBGeneral(item1, item2, numAxes){
    var intersection = true;
    for (var ii=0;ii<numAxes;ii++){
            //leftmost of each span left of the rightmost of the other
        var thisAxisIntersects = item1.AABB[0][ii] < item2.AABB[1][ii] && item2.AABB[0][ii] < item1.AABB[1][ii];
        intersection = intersection && thisAxisIntersects;
    }
    return intersection;
}
function collisionTestAABB(circle1, circle2){    //faster still, avoids cos call from Simple1
    return collisionTestAABBGeneral(circle1, circle2, 3);
}
function collisionTestAABBSpheres(sphere1, sphere2){    //faster still, avoids cos call from Simple1
    return collisionTestAABBGeneral(sphere1, sphere2, 4);
}

function collisionTestMorton(circle1, circle2){
    return circle1.morton[0] <= circle2.morton[1] && circle2.morton[0] <= circle1.morton[1];
}


function collisionTestBvhCones(circle1, bvh){
    if (!bvh.group){ //is a leaf node
        return bvh;
    }
    var filteredGroup =  bvh.group.filter(
        item =>
        collisionTestSimple2(circle1, item)
    );
    return filteredGroup.map(group2 => collisionTestBvhCones(circle1, group2)).flat();
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
function collisionTestBvhForSpheres(item1, bvh){
    
    countBvhFuncCalls+=1;

    if (!bvh.group){ //is a leaf node
        //console.log("returning because bvh has no group");
        //console.log(bvh);

        return bvh;
    }

    var filteredGroup =  bvh.group.filter(
            item => collisionTestAABBSpheres(item1, item)
        );
    
    return filteredGroup.map(group2 => collisionTestBvhForSpheres(item1, group2)).flat();
}


//TODO
/*
measure time to generate data for circles (probably pretty quick so could do at runtime for moving objects OK)
3-sphere version
BVH
    for AABBs
    sphere trees simpler? faster?

morton
store position, 2 corners

to construct tree top down (or could do bottom up if decide up front, just group in 2s then the result in 2s etc? just sort by morton position and use as tree in situ?)
sort by morton of the position of each AABB (imagine consuming from either end - to minimise total overlap given have same num on each side, makes sense
    if think about it! https://www.youtube.com/watch?v=LAxHQZ8RjQ4)

NOTE on speed - 
BVH can be faster or slower than just brute force simple circle-circle in test here

the current BVH test checks each single object's bounding box vs the BVH tree. A more efficient way to find colliding object pairs would be to check 
tree vs tree, but single object vs tree is chosen to represent initial use case - player object vs static level geometry, and needs no dynamic BVH.

The BVH tree might be better chosen. Currently using morton ordering, which is quick to create. There are many ways of building trees, but don't expect 
big improvement.

The BVH tree code might be significantly optimised. Might try typed arrays, make more c-like code rather than creating loads of objects, walk the tree instead 
returning new array to the level above, etc.

The BVH test might make sense over simple brute force circle test for ray test, where check a BVH for eg the trajectory of a bullet - might build out of 
many short sections or a line.
*/




//ported from found code
function HilbertIndexTransposed(hilbertAxes, bits){
    var X = hilbertAxes.slice();
    var n = hilbertAxes.length; // n: Number of dimensions
    var M = 1 << (bits - 1), P, Q, t;
    var i;
    // Inverse undo
    for (Q = M; Q > 1; Q >>= 1)
    {
        P = Q - 1;
        for (i = 0; i < n; i++)
            if ((X[i] & Q) != 0)
                X[0] ^= P; // invert
            else
            {
                t = (X[0] ^ X[i]) & P;
                X[0] ^= t;
                X[i] ^= t;
            }
    } // exchange
    // Gray encode
    for (i = 1; i < n; i++)
        X[i] ^= X[i - 1];
    t = 0;
    for (Q = M; Q > 1; Q >>= 1)
        if ((X[n - 1] & Q)!=0)
            t ^= Q - 1;
    for (i = 0; i < n; i++)
        X[i] ^= t;

    return X;
}

//extract an integer
function hilbertIndex(hilbertAxes, numBits){
    //addition for convenience. perhaps can speed up by comboing this with HilbertIndexTransposed
    //this is just intended to be readable!
    var transposedResult = HilbertIndexTransposed(hilbertAxes, numBits);
    //console.log(transposedResult);
    var regularResult = 0;
    var numDimensions = hilbertAxes.length;

    //this works - different order to above attempt. TODO rewrite to avoid creating separatedBits array?
    var separatedBits = [...new Array(numBits)].map(_ => []);
    for (var bitnum=0;bitnum<numBits; bitnum++){
        var nextBits = transposedResult.map(component => component & 1);
        transposedResult = transposedResult.map(component => component>>1);
        separatedBits.push(nextBits);
    }
    for (var bitnum=0;bitnum<numBits; bitnum++){
        var nextBits = separatedBits.pop();
        for (var dd=0;dd<numDimensions;dd++){
            regularResult<<=1;
            regularResult+=nextBits[dd];
        }
    }

    //return regularResult;
    return regularResult ^ 0x80000000;  // shift so instead 0 0 to 2^31-1 then wrapping around, starts at -2^31
}