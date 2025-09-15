// suspect short answer is:
// take a point on each great circle edge - say the midpoint of shape edge (not extended)
// take a point halway between these 2 points, and a points quarter way around world from about collision point on both edges
// find point orthogonal to these 3 points, take this is separating plane.

// this might be approximate, and depends on the selection of initial points.

// perhaps should find the initial points.

// seems sensible that the initial points be points on the great circles that are closest to the other great circle.
// how to find this? 


//first create great circles.
var greatCircle1 = randomOrthoFourvecPair();
var greatCircle2 = randomOrthoFourvecPair();

//checkOrthogonality(greatCircle1[0], [greatCircle1[1]]);

// check for closest point exhaustively

/*
 great circle described by 2 ortho unit 4-vecs A,B
 point on circle is Acost + Bsint
 suspect result will be same if shift both angles by PI. 
 */

var resultOne = bruteForceCheckForClosestPoints(greatCircle1, greatCircle2, 1, 2);  //finds same best dot prod as searching over 2,2
//var resultTwo = bruteForceCheckForClosestPoints(greatCircle1, greatCircle2, 2, 2);
//console.log(resultOne, resultTwo);

console.log(resultOne);


// try gradient descent if exhaustive is too slow



// match this with analytic solution

//from calculations elsewhere, suspect that
// tan(u+v) = (A.D + B.C)/(A.C - B.D)

var AC = dotProduct4(greatCircle1[0], greatCircle2[0]);
var AD = dotProduct4(greatCircle1[0], greatCircle2[1]);
var BC = dotProduct4(greatCircle1[1], greatCircle2[0]);
var BD = dotProduct4(greatCircle1[1], greatCircle2[1]);

var uPlusV = resultOne.bestAngs[0] + resultOne.bestAngs[1];
var test1 = Math.atan2(AD + BC, AC - BD);

console.log(wrapToCircle(uPlusV), wrapToCircle(test1));      //indeed this works

//from calculations elsewhere, suspect similar for u-v
// tan(u-v) = (-A.D + B.C)/(A.C + B.D)
var uMinusV = resultOne.bestAngs[0] - resultOne.bestAngs[1];
var test2 = Math.atan2(-AD + BC, AC + BD);

console.log(wrapToCircle(uMinusV), wrapToCircle(test2));      //indeed this works

//therefore can extract u,v
var uAnalytic = (test1 + test2) /2;
var vAnalytic = (test1 - test2) /2;

var closestPointAnalytic1 = greatCirclePositionForAngle(greatCircle1, uAnalytic);
var closestPointAnalytic2 = greatCirclePositionForAngle(greatCircle2, vAnalytic);

console.log(closestPointAnalytic1, closestPointAnalytic2);
//indeed this matches brute force closest point.

//perhaps this can be simplified using compound tan formula, and forgoing conversion from tan to ang back to sin, cos.

//using 
// tan(a+b) = (tana+ tanb)/(1-tanatanb)

//therefore tan(2u) = (tan(u+v) + tan(u-v))/ (1- tan(u+v)tan(u-v))

// tan(u+v) + tan(u-v) = (A.D + B.C)/(A.C - B.D)  +  (-A.D + B.C)/(A.C + B.D)   =  
//  ( (A.D + B.C)(A.C + B.D) +  (-A.D + B.C)(A.C - B.D) )  / ((A.C)^2 - (B.D)^2)
//  A.D A.C   + B.C A.C +  A.D B.D  +  B.C B.D     -  A.D A.C   + A.D B.D   + B.C A.C  -  B.C B.D   / ((A.C)^2 - (B.D)^2)
//  2 (B.C A.C  + A.D B.D ) / ((A.C)^2 - (B.D)^2)

// tan(u+v)tan(u-v)  =  ((A.D + B.C)/(A.C - B.D))  *  ((-A.D + B.C)/(A.C + B.D))
// = (A.D + B.C)(-A.D + B.C) / ((A.C)^2 - (B.D)^2)
// = ((B.C)^2 - (A.D)^2) / ((A.C)^2 - (B.D)^2)

// 1-tan(u+v)tan(u-v)
// = ((A.C)^2 - (B.D)^2 - (B.C)^2 + (A.D)^2) / ((A.C)^2 - (B.D)^2)

// tan(2u) = (tan(u+v) + tan(u-v))/ (1- tan(u+v)tan(u-v))
// =  2 (B.C A.C  + A.D B.D ) / ((A.C)^2 - (B.D)^2 - (B.C)^2 + (A.D)^2)

var twiceU = Math.atan2( 2* (BC*AC + AD*BD), AC*AC - BD*BD - BC*BC + AD*AD);
console.log(wrapToCircle(twiceU/2));    // u
//TODO similar fomulation for v
//might get sinu, cosu without recourse to js trig funcs, but don't bother unless perf issue.
// currently requires 2* atan2 calls regardless of whether calc u+v, u-v or u,v, so just work with that.



//check probably stupid initial guess at simple solution 
// normalise(A.C * A + A.D * A + B.C * B + B.D * B)  = p1
// normalise(A.C * C + B.C * C + A.D * D + B.D * D)  = p2
var p1guess = greatCircle1[0].map(xx=> xx* AC);
p1guess = vectorSum4d(p1guess, greatCircle1[0].map(xx=> xx* AD));
p1guess = vectorSum4d(p1guess, greatCircle1[1].map(xx=> xx* BC));
p1guess = vectorSum4d(p1guess, greatCircle1[1].map(xx=> xx* BD));
p1guess = normalise(p1guess);
console.log(p1guess);   //indeed turns out to be wrong


// plan: 
// do collision detection between player, triangle soup objects. 
// player convex hull described by a set of points, faces, edges.
// points, faces described by 1 4vec each.
// edges described by 2 4vecs. one could be a ref to a vertex to save space, but don't bother yet.
// to check collision, transform player into frame of object
// check for separating axes for each triangle in the tri soup object.
//  - check for tri soup plane - all points in object on the same side (since polys are 2-sided) of the triangle. (max, min have same sign)
//  - check for object planes - that the 2 points of the triangle are outside an object plane.
// initially just check that collision is detected correctly. later want to recall penetration amount, contact points for collision reponse. 
// (least overlapping axis, contact points is that which force is applied to separate objects.)
// if have found a separating axis, not touching.
// else might be touching, should do edge-edge collision test.
// for edge test, transform player edges into object frame, determine separating axes by combination with each of the 3 edges of tri soup tri.
// check vs all points, but perhaps it is possible to just check the distance between the closest points vs something.

//expect simple optimisation to make this likely fast enough is use player bounding sphere to find set of possible overlapping triangles in 
// the tri soup object. since these triangles are typically large, the list of possibles should be quite small - ~10.

//TODO can the current tri soup data using face, edge normals for triangles be reused?
// NOTE for SAT, can transform candidate axes instead of points.
// NOTE could use faces with >3 edges, reducing number of separating axis checks by reducing face and edge count vs triangulated mesh
// but to process a triangle mesh to combine faces, remove edges is a bit tricky, can just get working with triangles first.
// when come to optimise, perhaps good idea to use blender obj export without triangulate, and maybe for terrain objects, use quads,
// split quads to tris on load for rendering.
// for cube, quads = 6 faces, 12 edges. triangulation adds 6 faces, 6 edges.

//"parallel" edges optimisation: 
// can probably get away with comboing edges that share a distant "vanishing point" (where edge set meets), similar to optimisation for regular 3d edge-edge SAT testing
// (edge directions matter - can check parallel edges together) store the vanishing point only. For parallel edges in 3d objects projected to 4d, vanishing point for is 
// quarter way around world from the object centre- edges that are parallel in 3d will converge here when projected onto 3-sphere.
// to test 2 sets of edges in 2 objects ("parallel" edges in 1 vs "parallel" edges in another object), 
// find the great circle containing these 2 points, find the opposite great circle, project points onto this. eg if edge set 1 has vanishing point (1,0,0,0),
// , edge set 2 has vanishing point (0,1,0,0), then the opposite great circle is Acost + Bsint, where A=(0,0,1,0), B=(0,0,0,1). project each point onto this to find t for each point
// ie atan2(B.p , A.p), check for ranges of angle overlapping. this maybe tricky because cyclic. hope some way to work out angle direction of object origin to point...
// this should enable finding of separating axis. but won't always find right penetration depth (can find a point that overlaps, but extreme points in t aren't necessarily 
// most penetrating. might wish to do regular 1d projection in that case, as described elsewhere here.

function wrapToCircle(angle){
    return (angle+ 2*Math.PI) % (2*Math.PI);
}

function bruteForceCheckForClosestPoints(greatCircle1, greatCircle2, maxUOverPi, maxVOverPi){
    
    var bestPoints;
    var bestDotProd=-1;

    for (var uu=0;uu<maxUOverPi;uu+=0.002){
        var point1 = greatCirclePositionForAngle(greatCircle1, Math.PI * uu);
        for (var vv=0;vv<maxVOverPi;vv+=0.002){
            var point2 = greatCirclePositionForAngle(greatCircle2, Math.PI * vv);
            var dotProd = dotProduct4(point1, point2); 
            //note could maximise dot prod of the points, or minimise distance between. IIRC equivalent here.
            if (dotProd>bestDotProd){
                bestDotProd=dotProd;
                bestPoints=[point1, point2];
                bestAngs=[Math.PI * uu, Math.PI * vv];
            }
        }
    }

    return {
        bestPoints,
        bestDotProd,
        bestAngs
    }
}


function greatCirclePositionForAngle(gs, ang){
    var cosSinAng = [Math.cos(ang), Math.sin(ang)];
    return vectorSum4d( gs[0].map(xx => xx*cosSinAng[0]) , gs[1].map(xx => xx*cosSinAng[1]) );
}


function randomOrthoFourvecPair(){
    var vec1 = randomFourvec();
    var vec2 = randomFourvec();
    var dotProd = dotProduct4(vec1, vec2);
    var vec2componentOrthoToVec1 = vectorDifference4d(vec2, vec1.map(xx=>xx*dotProd));
    vec2 = normalise(vec2componentOrthoToVec1);
    return [vec1, vec2];
}

function checkOrthogonality(vec1, vecsToTestVs){
    console.log({vec1, vecsToTestVs});
    var dotProds = vecsToTestVs.map( vv => dotProduct4(vec1, vv));
    console.log({dotProds});
    //TODO for testing lots, just check results are below some threshold
}


function randomFourvec(){
    return normalise([Math.random()-0.5, Math.random()-0.5, Math.random()-0.5, Math.random()-0.5]);
}

// lib stuff. TODO share lib with main project

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
    var len = vecLen(inputVector);
    return inputVector.map(cc => cc/len);
}

function vecLen(inputVector){
    return Math.hypot.apply(null, inputVector); //TODO specialise for 4d, avoid hypot.apply?
}

function vecLenSq(inputVector){
    return inputVector.reduce((accum, current)=>accum+current*current, 0);
}

/* initial rough notes

convex hull collision. 

with overlapping, do SAT with all possible separating axes: 
	faces of each object.
	pairs of edge of one object, edge of the other.
	if no separating axis is found, objects are colliding.
	least overlapping axis is that which suppose force is applied to separate objects.

if do this for convex hull object vs triangle soup - 
	what happens if hit a seam in the triangle soup ? 
		guess will mostly work OK.
		
can describe an object's faces and vertices, do SAT tests for these easily enough.
but what about edge-edge? 


two extended great circle edges does not define a plane. might define an equidistant surface - in some cases at least a duocylinder.

if can find the points of closest approach of 2 such lines, and join them, can then pick plane that is perpendicular to this line, perhaps bisecting it. 
to do this... ? 

if line 1 is represented by 2 ortho vecs A,B, line 2 by ortho vecs C,D
a point p1 on 1 is Acost + Bsint, a point p2 on 2 is Ccosu + Dsinu
the squared distance between these is:
x^2 = (p1 - p2) ^2 = ( Acost + Bsint - Ccosu - Dsinu )^2 
 
we can differentiate wrt t,v, set to 0 for turning points
d/dt (x^2) = 2x dx/dt
d/dt (x^2) = 2* ( Acost + Bsint - Ccosu - Dsinu ) * ( -Asint + Bcost )  = 0 

similarly
d/du (x^2) = 2* ( Acost + Bsint - Ccosu - Dsinu ) * ( -Csinu + Dcosu )  = 0 

( Acost + Bsint - Ccosu - Dsinu ) = 0 means that the lines cross, so get the hunch that we are looking for:
 
-Asint + Bcost  = 0 
-Csinu + Dcosu  = 0 

which can be rearranged: 
Bcost = Asint
Dcosu = Csinu

but that's impossible because A,B are orthogonal vectors!
guess would need to expand out and consider xyzw terms separately.

make some guess at a neat solution.

normalise(A.C * A + A.D * A + B.C * B + B.D * B)  = p1
normalise(A.C * C + B.C * C + A.D * D + B.D * D)  = p2

this would describe 2 points on each line. perhaps consistent such that the closest points on each line are paired.
then can just take the difference and normalise to get the separating plane. and perhaps the unnormalised lengths are same anyway, in which case don't need initial normalise - 
just take difference and normalise.

----------------------------------------------------
modified guess? 
	
normalise( ((A.C)^2 + (A.D)^2) * A  + ( (B.C)^2 + (B.D)^2) * B))   = p1   ??
 but that can't be right because A, B are arbitrarily chosen and can be reversed

----------------------------------------------

doesn't seem right.


( Acost + Bsint - Ccosu - Dsinu )^2 

= A.A c^2 t   +   B.B s^2 t   +  C.C c^2 u   +   D.D s^2 u   +     2A.B ctst   +   2C.D cusu     -      2A.C ctcu      -    2A.D ctsu      - 2B.Cstcu     - 2B.Dstsu
=   c^2 t     +   s^2 t       +    c^2 u     +     s^2 u     +         0       +       0         +
=				1			  +             1                +

= 2   ( 1 - A.C ctcu - A.D ctsu - B.Cstcu - B.Dstsu )


deriv wrt t =  0 
  A.C stcu + A.D stsu - B.C ctcu - B.D ctsu  =  0			(3)
deriv wrt u =  0 
  A.C ctsu - A.D ctcu + B.C stsu - B.D stcu  =  0			(4)
		rearrange 
  
  
(3) + (4)
(A.C - B.D) ( stcu + ctsu )  +    (A.D + B.C) ( stsu - ctcu )  = 0     (5)
using compound angle: 
(A.C - B.D) sin(u+v) -   (A.D + B.C) cos(u+v) = 0
tan(u+v) = (A.D + B.C)/(A.C - B.D)

(3) - (4)
(A.C + B.D) (stcu - ctsu)   +    (A.D - B.C) (stsu  + ctcu) = 0        (6) 
using compound angle: 
(A.C + B.D) sin(-u+v)   -  (A.D - B.C) cos(u-v)  = 0 
  TODO check signs..
  
should be able to get u,v from this...

*/