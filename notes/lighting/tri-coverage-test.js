//what area of sphere covered by a triangle

//var inputTris = [[0,1,2],[3,4,5],[6,7,8]];
//var inputTris = [[1,0,0],[0,1,0],[0,0,1]];  // result is 1.

var z = 2;
var inputTris = [[z,0,0],[z,0,1],[z,-1,0]];

//normalise
inputTris = inputTris.map(tri => {
    var length = Math.hypot.apply(null,tri);
    return tri.map(xx=> xx/length);
});

console.log(inputTris);

//guess area calculation - sanity check: cyclic a,b,c

var {a,b,c} = {a:inputTris[0],b:inputTris[1],c:inputTris[2]};

console.log({a,b,c});

console.log({
    "cornerAbc":areaByCornerAngles(a,b,c),
    "lHuilier":areaByLHuilier(a,b,c),
    "byVecs":areaByVecs(a,b,c)
});

//found formula here https://www.johndcook.com/blog/2021/11/29/area-of-spherical-triangle/
// referencing [1] “On the measure of solid angles”, F. Eriksson, Math. Mag. 63 (1990) 184–187.
function areaByVecs(a,b,c){
    var aCrossB = crossProduct(a,b);
    var aCrossBDotC = dotProduct(aCrossB, c);
    var denominator = 1 + dotProduct(a,b) + dotProduct(b,c) + dotProduct(c,a);
    var tanEOver2 = aCrossBDotC/denominator;
    return 2*Math.atan(tanEOver2);  //this has a sign.
}

function areaByCornerAngles(a,b,c){
    return Math.abs(triangleCornerAngle2(a,b,c)) + Math.abs(triangleCornerAngle2(b,c,a)) + Math.abs(triangleCornerAngle2(c,a,b)) - Math.PI;
}

function areaByLHuilier(a,b,c){
    //suspect this can be simplified to reduce trig in calculation by use of compound angle tan formula....
    //edge a between corners a,b, etc

    var edgeALength = Math.acos(dotProduct(a,b));
    var edgeBLength = Math.acos(dotProduct(b,c));
    var edgeCLength = Math.acos(dotProduct(c,a));
    var semiPerimeter = (edgeALength + edgeBLength + edgeCLength)/2;
    var tanEOver4 = Math.sqrt( Math.tan(semiPerimeter/2)*Math.tan((semiPerimeter - edgeALength)/2)*Math.tan((semiPerimeter - edgeBLength)/2)*Math.tan((semiPerimeter - edgeCLength)/2) )
    var excess = Math.atan(tanEOver4)*4;

    return excess;
}

function triangleCornerAngle(a,b,c){
    //angle bac
    //b - (b.a)a      (1)
    //c - (c.a)a      (2)
    var aDotB = dotProduct(a,b);
    var aDotC = dotProduct(a,c);
    var modifiedB = b.map((bb,ii)=> bb - aDotB*a[ii]);
    var modifiedC = c.map((cc,ii)=> cc - aDotC*a[ii]);
    var dotP =dotProduct(modifiedB, modifiedC);
    var lengthsSquared = dotProduct(modifiedB,modifiedB)* dotProduct(modifiedC,modifiedC);

    return Math.acos(dotP/Math.sqrt(lengthsSquared));
}

//https://math.stackexchange.com/a/66731
//NOTE could use this more efficiently when calculating 3 angles if calc cross prods up front, but areaByVecs is simpler anyway
function triangleCornerAngle2(a,b,c){
    var cCrossA = crossProduct(c,a);
    var bCrossA = crossProduct(b,a);
    var lenSq = dotProduct(cCrossA,cCrossA) * dotProduct(bCrossA,bCrossA);

    return Math.acos(dotProduct(cCrossA,bCrossA)/Math.sqrt(lenSq));
}

function dotProduct(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2];
}
function crossProduct(vec1, vec2){
    return [
        vec1[1]*vec2[2] - vec1[2]*vec2[1],
        vec1[2]*vec2[0] - vec1[0]*vec2[2],
        vec1[0]*vec2[1] - vec1[1]*vec2[0],
    ];
}