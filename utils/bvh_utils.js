//bounding volume heirarcy stuff.
//generation of BVH from triangle mesh
//and collision with it.

//Axis-aligned bounding box tree.
//collision tests for 
//vs input AABB, distance query for point (for sphere test) - perhaps with sign (which side of triangle). Test for a line with many points, point to point test...
// for line, collision, equally spaced points on great circle are not evenly spaced on the 3d projected space,
// for sphere test not really correct in projected space. 
// for small objects this might not matter much, but for world level BVH this should be accounted for.

function createBvhFrom3dObjectData(sourceData, bvhToPopulate, vertAttrs=3){

    //take in triangle mesh data.
    //produce bounding volume heirarchy

    var tris = arrayToGroups(sourceData.indices, 3);

    var verts = arrayToGroups(sourceData.vertices, vertAttrs);
    if (vertAttrs!=3){
        verts = verts.map(vert => vert.slice(0,3)); //redundant if vertAttrs=3
    }

    //calculate the whole object's bounds so fit within cube for morton/hilbert
    //AABB would be tighter, but easy to just find furthest point for origin for bounding sphere, wrap this sphere in a cube.
    var boundingSphereDiam = 2* Math.sqrt(verts.reduce((greatest, current) => { 
        return Math.max(greatest, current.reduce((cumul, val) => {return cumul + val*val}, 0));
    }, 0));
    console.log("boundingSphereDiam:" + boundingSphereDiam);

    bvhToPopulate.boundingSphereRadius = boundingSphereDiam/2;
        //NOTE if this is tried to be used to create AABB4d data before is loaded, won't work!

    var temp3Vec = [...new Array(3)];

    //for each triangle, create an AABB.
    //initial version just have an AABB per tri, don't make a tree. can test collision 
    //using this works OK. Then look to make faster by making a tree.
    var trisWithAABB = tris.map( tri => {
        var triVerts = tri.map( idx => verts[idx]);
        
        var components = temp3Vec.map( (_,component) => triVerts.map(vv => vv[component])); //component[0] is array of values of x for each vert
        var minAABB = components.map( minAABBPointsForComponent => Math.min.apply(null, minAABBPointsForComponent));
        var maxAABB = components.map( maxAABBPointsForComponent => Math.max.apply(null, maxAABBPointsForComponent));

        var normalisedBoxCentre = minAABB.map( (minval, ii) => {return (minval + maxAABB[ii])/boundingSphereDiam;} );  //between -1, 1
        var centreMorton = morton3(normalisedBoxCentre);
        //var centreHilbert = hilbert3(normalisedBoxCentre);

        //calculate triangle normal.
        var edgeVecs = [
            vectorDifference(triVerts[1], triVerts[0]),
            vectorDifference(triVerts[2], triVerts[1]),
            vectorDifference(triVerts[0], triVerts[2])
        ];
        var crossp = crossProduct(edgeVecs[0], edgeVecs[1]);
        var normal = normalise(crossp);
        var distFromOrigin = dotProduct(triVerts[0], normal);

        //edge normals
        var edgeData = edgeVecs.map((edgeVec, ii) => {
            var crossp = crossProduct(edgeVec, normal);
            var edgeNormal = normalise(crossp);
            var edgeDistFromOrigin = dotProduct(triVerts[ii], edgeNormal);
            return {
                normal: edgeNormal,
                distFromOrigin: edgeDistFromOrigin
            };
        });

        return {
            triangleIndices: tri,
            normal,
            distFromOrigin,
            edgeData,
            AABB: [minAABB, maxAABB],
            centreMorton,    //note only used for ordering. TODO remove once used?
            //centreHilbert
        }
    });

    trisWithAABB.sort((a,b) => a.centreMorton - b.centreMorton);  //sort by morton code.
    //trisWithAABB.sort((a,b) => a.centreHilbert - b.centreHilbert);  //sort by hilbert code.

    bvhToPopulate.verts = verts;    //suspect only require vertex data.
    bvhToPopulate.tris = generateBvh(trisWithAABB, temp3vec, 16);
    bvhToPopulate.isLoaded = true;
    return;
}

function worldBvhObjFromObjList(objList){
    augmentObListWithCosAndSin(objList);

    objList.forEach(bvhObj => {
        var inputPos = bvhObj.mat.slice(12);
        var outputMorton = morton4(Array.from(inputPos));

        bvhObj.centreMorton4d = outputMorton;

        bvhObj.hilbert = hilbert4(inputPos);
    });

    objList.sort((a,b) => a.centreMorton4d - b.centreMorton4d);
    var worldBvh = generateBvh(objList, temp4vec, 4);
    
    objList.sort((a,b) => a.hilbert - b.hilbert);
    var worldBvhHilbert = generateBvh(objList, temp4vec, 4);

    return {
        objList,
        worldBvh,
        worldBvhHilbert,
        grids: generateGridArrayArray(objList, 0),    //NOTE current grid system can miss large objects
            // collisions, and the padding is unneeded since doesn't work as proposed next:
            //TODO better grid system to look up, for an object of size lequal to padding, with centre 
            // in a given grid square, all the objects it could be colliding with. 
            // however, seems most bad perf is due to the individual object bvh test, not this broad 
            // filter. therefore better to concentrate on:
            // *intermediate tighter bounds test eg bounding sphere check convex hull
            // *speeding up obj level bvh test
            // *grouping eg bullets to test many against same object simultaneously
            //      including bullets tested against many instances of a given object!
            // *doing line collision detection for multiple frames (assumes constant velocity, fiddly)
        grids4d: gridSystem4d.generateGridArrays2(objList,0),
        grids4dPadded: gridSystem4d.generateGridArrays2(objList,0.05)   //padding is max side length of query AABB
    }
}


function generateBvh(items, tempVec, groupSize){
    //console.log({items});

    if (items.length < 2){  //TODO why is length ever 0?
        //console.log("returning because items of length: " + items.length);
        //console.log(items);
        return items[0];
    }

    var groups = arrayToGroups(items, groupSize);
    //console.log("NUM GROUPS:" + groups.length);
    //console.log({groups});

    var nextLayerUp = groups.map(group => {
        
        var minAABBPoints = tempVec.map( (_,component) => group.map(item => item.AABB[0][component]));
        var minAABB = minAABBPoints.map( minAABBPointsForComponent => Math.min.apply(null, minAABBPointsForComponent));

        var maxAABBPoints = tempVec.map( (_,component) => group.map(item => item.AABB[1][component]));
        var maxAABB = maxAABBPoints.map( maxAABBPointsForComponent => Math.max.apply(null, maxAABBPointsForComponent));

        
        // var morton = [
        //     Math.min.apply(null, group.map(item => item.morton[0])),
        //     Math.max.apply(null, group.map(item => item.morton[1]))
        // ];
        // morton for AABB corners. maybe useful for fast coarse AABB check (only compare single value, but false positives)

        var toReturn = {
            group,
            AABB: [minAABB, maxAABB],
            // morton
        };
        return toReturn;
    });

    return generateBvh(nextLayerUp, tempVec, groupSize);
}


//TODO: 
// 1) find the collision point
// 2) find how far (eg fraction) along the ray - conversion to great circle fraction can be done
// outside this, because this func works in projected "flat" space, doesn't know scale of object
// 3) make a swept sphere test. this is harder because not spheres in projected space...

function bvhRayCollision(rayStart4Vec, rayEnd4Vec, objInfo){
    var projectedPosInObjFrame = projectTo3dWithScale(rayStart4Vec, objInfo.scale);
    var projectedPosEndInObjFrame = projectTo3dWithScale(rayEnd4Vec, objInfo.scale);
    return bvhRayOverlapTest(projectedPosInObjFrame, projectedPosEndInObjFrame, objInfo.bvh);   
}

function bvhRayOverlapTest(rayStart, rayEnd, bvh){
    var tempVec3 = [...new Array(3)];
    var rayAABB = [Math.min, Math.max].map(minmaxfunc => {
        return tempVec3.map( (_,ii) => {return minmaxfunc(rayStart[ii], rayEnd[ii]);});
    });
    
    var possibles = collisionTestBvh(rayAABB, bvh.tris);
    var closestFractionAlong = 1;    //1 is useful since eg for camera collision want to move full dist if no collide
    var collided = false;

    for (var ii=0;ii< possibles.length; ii++){
        var thisTri = possibles[ii];
        if (aabbsOverlap(rayAABB, thisTri.AABB)){
            startDistFromPlane = dotProduct(thisTri.normal, rayStart) - thisTri.distFromOrigin;
            endDistFromPlane = dotProduct(thisTri.normal, rayEnd) - thisTri.distFromOrigin;

            if (startDistFromPlane>0 && endDistFromPlane<=0){
                //crosses plane test (in one direction. if want both ways could xor conditions)

                //confirm is within triangle
                //option 1) find collision point on the plane, then use edge normals to check is inside each edge. 
                //option 2) check winding direction around edge - ray direction crossed with vector to line - +ve or -ve?
                // pick option 1 because simple, getting point on plane maybe useful later.
                var pointOnPlane = [];
                var total = startDistFromPlane-endDistFromPlane;
                for (var cc=0;cc<3;cc++){
                    pointOnPlane[cc]=(startDistFromPlane*rayEnd[cc]-endDistFromPlane*rayStart[cc])/total;
                }
                var withinTri = thisTri.edgeData.reduce( (accum, edge) =>
                    accum && dotProduct(pointOnPlane, edge.normal)<=edge.distFromOrigin, true);

                if(withinTri){
                    collided = true;
                    var thisFractionAlong = startDistFromPlane/(startDistFromPlane-endDistFromPlane);
                    closestFractionAlong = Math.min(closestFractionAlong, thisFractionAlong);
                }
            }
        }
    }
    return {
        collided,
        closestFractionAlong
    };
}

//this returns possible colliding bvh nodes in the group.
function collisionTestBvh(aabb, bvh){
    var picked=[];
    innerTest(bvh);
    return picked;

    function innerTest(bvhInner){
        if (!bvhInner.group){
            picked.push(bvhInner);
            return;
        }
        var filteredGroup =  bvhInner.group.filter(
            item =>
            aabbsOverlap(aabb, item.AABB)
        );
        filteredGroup.forEach(gg => innerTest(gg));
    }
}

function collisionTestBvh4d(aabb, bvh){
    
    if (!bvh.group){ //is a leaf node
        //console.log("returning because bvh has no group");
        //console.log(bvh);

        return bvh;
    }

    var filteredGroup =  bvh.group.filter(
            item =>
            aabbsOverlap4d(aabb, item.AABB)
        );
    
    return filteredGroup.map(group2 => collisionTestBvh4d(aabb, group2)).flat();
}

function collisionTestBvh4d2(aabb, bvh){
    var picked=[];
    innerTest(bvh);
    return picked;

    function innerTest(bvhInner){
        if (!bvhInner.group){
            picked.push(bvhInner);
            return;
        }
        var filteredGroup =  bvhInner.group.filter(
            item =>
            aabbsOverlap4d(aabb, item.AABB)
        );
        filteredGroup.forEach(gg => innerTest(gg));
    }
}

var triObjClosestPointType=0; //0=vert, 1=edge, 2=face

function closestPointBvhBruteForce(fromPoint, bvh){
    var matchAllAABB = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY].map(xx=>[xx,xx,xx]);
    var allTris = collisionTestBvh(matchAllAABB, bvh.tris);
    return closestPointForTris(fromPoint, bvh.verts, allTris);    //tris returned from bvh func
}

function closestPointBvhEfficient(fromPoint, objInfo, lowestAcceptedMultiplier){
    var possibles = collisionTestPossibleClosest2(fromPoint, [objInfo.bvh.tris], objInfo.scale*lowestAcceptedMultiplier);
        //lowestAccepted passed into collisionTestPossibleClosest2 is in object space! if object pre-scaling is big, this should be big too! 

    //var possibles = collisionTestPossibleClosest2(fromPoint, [bvh.tris], 0.1);  //NOTE currently doing flypast noise+collision in 
        // same collision/closest point calc, but if need more speed, might do tighter collision check. noise
        // check likely can be less frequent than collision check. 
        
    if (possibles.length == 0){
        return false;
    }

    return closestPointForTris(fromPoint, objInfo.bvh.verts, possibles);
}

function closestPointBvhAABBIntialCheck(fromPoint, queryRad, objInfo){

    var radInObjSpace = 2*queryRad/objInfo.scale;

    //some test AABB for sphere. note this is in projected space, so really should be ellipse.
    //just hope padding is enough. later gfinding of closest point also doesn't account for this.
    var queryAABB = [fromPoint.map(xx=> xx-radInObjSpace) , fromPoint.map(xx=> xx+radInObjSpace)];

    var possibles = collisionTestBvh(queryAABB, objInfo.bvh.tris);
        //TODO variant of collisionTestBvh that doesn't populate a list. just return bool.

    return (possibles.length != 0);
}


function closestPointForTris(fromPoint, verts, tris){
    //want to find point in frame of object and vector from point to fromPoint (and its length)
    // for sphere collision, and flypast audio (with doppler shift, distance falloff)
    //actually collision detection is simpler - can already skip anything outside collison sphere size

    //brute force can just look at every triangle.
    //faster version can a range of possible min max distance based on the aabb
    //then can skip over anything that's outside of that range. may wish to explore bvh tree closest first.
    //expect not urgent optimisation - only doing it for player object for now.

    //closest in 3d projected space is likely good enough for smaller objects 
    // can check how close matches precise 4d version.

    var closestSq = Number.MAX_VALUE;
    var closestPointType = 0;
    var chosenVectorToClosestPoint=[0,0,0]; //expect to be set! but hit bug with vectorSum if don't initialise?

    //for each triangle, test dist from edges, face
    // can do this by separating axis test
    tris.forEach(tri => {
        
        var greatestSeparationSq = Number.NEGATIVE_INFINITY;
        var chosenPointTypeThisFace = -1;
        var vectorToClosestPoint;
        var triPoints = tri.triangleIndices.map(pp => verts[pp]);
        //SAT test for verts? 
        //each corner can only be closest point on the triangle if the other points are behind this point in the 
        //direction from the corner in question to the fromPoint.
        // eg tri (a,b,c), fromPoint p . if (f->a).(a->b)>0 and (f->a).(a->c)>0, then a is closest point, etc
        // maybe could make more efficient using logic like that.
        //for now simple SAT test.

        var triPointsFromPoint = triPoints.map(pp => vectorDifference(pp, fromPoint));

        triPointsFromPoint.forEach((vecToCorner,ii) => {
            var vecToCornerLenSq = dotProduct(vecToCorner, vecToCorner);
            //loop over all points, find minimum in this direction (for point in question this calc can is unnecessary, but do 
            // for all 3 points for simplicity)
            var dotProds = triPointsFromPoint.map(vecToCorner2=> dotProduct(vecToCorner, vecToCorner2) );
            var leastDotProd = dotProds.filter((_,jj)=>ii!=jj).reduce((accum,current)=>Math.min(accum,current),Number.MAX_VALUE);
            //AFAICT this can only be the greatest separating axis (and outside triangle) if that's between 0 and vecToCorner^2
            //but can just find the greatest separation without checking.
            
            var absoluteDistanceSq = leastDotProd*leastDotProd /vecToCornerLenSq;
            if (leastDotProd> 0 && absoluteDistanceSq>greatestSeparationSq){
                greatestSeparationSq=absoluteDistanceSq;
                vectorToClosestPoint = vecToCorner;
                chosenPointTypeThisFace = 0;
            }
        });

        //edges and normal
        var distToPlane = dotProduct(tri.normal, fromPoint) - tri.distFromOrigin;
        var distToPlaneSq = distToPlane*distToPlane;
        var vecToPlane = tri.normal.map(xx=> -xx*distToPlane);

        //plane separation.
        //TODO skip this if outside any edge?
        if (distToPlaneSq>greatestSeparationSq){
            greatestSeparationSq = distToPlaneSq;
            vectorToClosestPoint = vecToPlane;
            chosenPointTypeThisFace = 2;
        }

        //check 3 edges - if dot prod of point with edge direction >0 then check dist from edge.
        for (var ee=0;ee<3;ee++){
            //distance from this edge. is pythagoras of dist from plane and dist in edge direction.
            var edgeData = tri.edgeData[ee];
            //var firstPointOnEdge = triPoints[ee];
            var distInEdgeDir = dotProduct(edgeData.normal, fromPoint) - edgeData.distFromOrigin;
            if (distInEdgeDir>0){
                var totalDistSq = distInEdgeDir*distInEdgeDir + distToPlaneSq;
                var vecInEdgeDir = edgeData.normal.map(xx=> xx*distInEdgeDir);
                if (totalDistSq>greatestSeparationSq){
                    greatestSeparationSq = totalDistSq;
                    vectorToClosestPoint = vectorDifference(vecToPlane, vecInEdgeDir);
                    chosenPointTypeThisFace = 1;
                }
            }
        }

        if (greatestSeparationSq < closestSq){
            chosenVectorToClosestPoint = vectorToClosestPoint;
            closestSq = greatestSeparationSq;
            closestPointType = chosenPointTypeThisFace;
        }
    });

    var closestPoint = vectorSum(fromPoint, chosenVectorToClosestPoint);

    return {
        closestPoint,
        closestPointType
    };
}

function collisionTestPossibleClosest(fromPoint, bvh, lowestAccepted){
    if (!bvh.group){ //is a leaf node
        return bvh;
        //NOTE IIIRC could check AABB is possibly closest here too (same as check below)
    }

    //get range of distances for the AABBs at this level.
    //find the AABB with the lowest value of its greatest possible distance
    //then filter any where the minimum possible distance is greater than this.

    var minMaxVals = bvh.group.map(item => aabbMinMaxDistanceFromPoint(fromPoint, item.AABB));
    var lowestMax = minMaxVals.map(xx => xx[1]).reduce((accum, yy) => Math.min(accum, yy), Number.POSITIVE_INFINITY);

    lowestMax = Math.min(lowestMax, lowestAccepted);    //TODO rule out groups earlier using lowestAccepted?

    var filteredGroup = bvh.group.filter(
        (item, ii) =>
        minMaxVals[ii][0]<lowestMax
    );

    return filteredGroup.map(group2 => collisionTestPossibleClosest(fromPoint, group2,lowestMax)).flat();
}

function collisionTestPossibleClosest2(fromPoint, bvhGroup, lowestAccepted){
    lowestAccepted*=lowestAccepted;   //using squared distances.

    var minMaxVals = bvhGroup.map(item => aabbMinMaxDistanceFromPoint(fromPoint, item.AABB));
    var lowestMax = minMaxVals.map(xx => xx[1]).reduce((accum, yy) => Math.min(accum, yy), Number.POSITIVE_INFINITY);

    //IIRC in practice, all leaves are at same depth.
    //if want to have leaves at multiple depths should split out leaves, recurse with non-leaves

    //get range of distances for the AABBs at this level.
    //find the AABB with the lowest value of its greatest possible distance
    //then filter any where the minimum possible distance is greater than this.
    lowestMax = Math.min(lowestMax, lowestAccepted);    //TODO rule out groups earlier using lowestAccepted?

    var filtered = bvhGroup.filter(
        (_, ii) =>
        minMaxVals[ii][0]<lowestMax
    );

    var leafNodes = filtered.filter(xx => !xx.group);
    var nonLeafNodes = filtered.filter(xx => xx.group);

    if (nonLeafNodes.length == 0){
        return leafNodes;
    }

    //since 1st bvh in the group didn't have a subgroup, assume they all don't, so should recurse.
    var fromNextLevel = collisionTestPossibleClosest2(fromPoint, nonLeafNodes.map(nn=>nn.group).flat(), lowestAccepted);
        //TODO update lowestAccepted?

    return [fromNextLevel, leafNodes].flat();   //TODO keep in separate arrays to make filtering easier, reduce garbage.
}



// function aabbMinMaxDistanceFromPoint(fromPoint, aabb){
//     var greatestPossibleSq=0;
//     var lowestPossibleSq=0;

//     for (var cc=0;cc<3;cc++){
//         var aabbRangeRelativeToPoint = [fromPoint[cc]-aabb[0][cc] , fromPoint[cc]-aabb[1][cc]]; 
//         var absAabbRangeRelativeToPoint = aabbRangeRelativeToPoint.map(xx => Math.abs(xx));
//         var greatestPossibleThisComponent = Math.max( absAabbRangeRelativeToPoint[0], absAabbRangeRelativeToPoint[1]);
//         var lowestPossibleThisComponent = Math.min( absAabbRangeRelativeToPoint[0], absAabbRangeRelativeToPoint[1]);
//         if (aabbRangeRelativeToPoint[0]*aabbRangeRelativeToPoint[1]<0){
//             lowestPossibleThisComponent=0;
//         }
//         greatestPossibleSq+=greatestPossibleThisComponent*greatestPossibleThisComponent;
//         lowestPossibleSq+=lowestPossibleThisComponent*lowestPossibleThisComponent;
//     }
//     return [lowestPossibleSq, greatestPossibleSq];
// }

//equivalent to above but harder to read, ~2x speed!

function aabbMinMaxDistanceFromPoint(fromPoint, aabb){
    var greatestPossibleSq=0;
    var lowestPossibleSq=0;

    for (var cc=0;cc<3;cc++){
        var aabbRangeRelativeToPoint = [aabb[0][cc]-fromPoint[cc] , aabb[1][cc]-fromPoint[cc]];

        var spaceToRight = aabbRangeRelativeToPoint[0];
        var spaceToLeft = -aabbRangeRelativeToPoint[1];
        var closest = Math.max(0, Math.max(spaceToLeft, spaceToRight));

        var farToRight = aabbRangeRelativeToPoint[1];
        var farToLeft = -aabbRangeRelativeToPoint[0];
        var furthest = Math.max(farToRight, farToLeft);

        greatestPossibleSq+=furthest*furthest;
        lowestPossibleSq+=closest*closest;
    }
    return [lowestPossibleSq, greatestPossibleSq];
}

//currently unused. TODO use for player sphere collision with level?
// function bvhSphereOverlapTest(spherePos, sphereRad, bvh){

//     var testAABB = [
//         spherePos.map(cc => cc-sphereRad),
//         spherePos.map(cc => cc+sphereRad)
//     ];

//     //TODO generalise this to take 2 bvhs or items with aabbs? 
//     //currently bvh is just an array of triangles with AABBS
//     for (var ii=0;ii< bvh.tris.length; ii++){
//         if (aabbsOverlap(testAABB, bvh.tris[ii].AABB)){
//             //check for distance from triangle plane. 
//             //with just this, result is passable so far (teapot object, shots)
//             if (Math.abs(pointSignedDistanceFromPlane(spherePos, bvh.tris[ii])) > sphereRad){
//                 return false;
//             }
//             //check that within edge planes too.
//             //with this is like point collision with triangular prism minkowski sum
//             for (var ee=0;ee<3;ee++){
//                 if (pointSignedDistanceFromPlane(spherePos, bvh.tris[ii].edgeData[ee]) > sphereRad){
//                     return false;
//                 }
//             }
//             return true;
//             //TODO correct distance from triangle for sphere - minkowski sum should have rounded edges and corners
//             // can do with Separating Axis Test for edges, points
//             // without this might suspect may observe player object bumping on edges,points when sliding on object surface.
//         }
//     }
//     return false;
// }

function aabbsOverlap(aabb1, aabb2){
    //leftmost of each span left of the rightmost of the other
    return aabb1[0][0] < aabb2[1][0] && aabb2[0][0] < aabb1[1][0]
        && aabb1[0][1] < aabb2[1][1] && aabb2[0][1] < aabb1[1][1]
        && aabb1[0][2] < aabb2[1][2] && aabb2[0][2] < aabb1[1][2];
}

var aabbsOverlap4d = aabbsOverlap4da;

function aabbsOverlap4da(aabb1, aabb2){
    //leftmost of each span left of the rightmost of the other
    return aabb1[0][0] < aabb2[1][0] && aabb2[0][0] < aabb1[1][0]
        && aabb1[0][1] < aabb2[1][1] && aabb2[0][1] < aabb1[1][1]
        && aabb1[0][2] < aabb2[1][2] && aabb2[0][2] < aabb1[1][2]
        && aabb1[0][3] < aabb2[1][3] && aabb2[0][3] < aabb1[1][3];
}

// //less readable version of above, about same speed.
// function aabbsOverlap4db(aabb1, aabb2){
//     //leftmost of each span left of the rightmost of the other
//     return (
//         (1&(-1-aabb1[0][0]+aabb2[1][0])>>31) |
//         (1&(-1-aabb2[0][0]+aabb1[1][0])>>31) |
//         (1&(-1-aabb1[0][1]+aabb2[1][1])>>31) |
//         (1&(-1-aabb2[0][1]+aabb1[1][1])>>31) |
//         (1&(-1-aabb1[0][2]+aabb2[1][2])>>31) |
//         (1&(-1-aabb2[0][2]+aabb1[1][2])>>31) |
//         (1&(-1-aabb1[0][3]+aabb2[1][3])>>31) |
//         (1&(-1-aabb2[0][3]+aabb1[1][3])>>31)) ==0;
// }

// //less readable version of above, about same speed.
// function aabbsOverlap4de(aabb1, aabb2){
//     //leftmost of each span left of the rightmost of the other
//     return (
//         ((-1-aabb1[0][0]+aabb2[1][0])>>31) |
//         ((-1-aabb2[0][0]+aabb1[1][0])>>31) |
//         ((-1-aabb1[0][1]+aabb2[1][1])>>31) |
//         ((-1-aabb2[0][1]+aabb1[1][1])>>31) |
//         ((-1-aabb1[0][2]+aabb2[1][2])>>31) |
//         ((-1-aabb2[0][2]+aabb1[1][2])>>31) |
//         ((-1-aabb1[0][3]+aabb2[1][3])>>31) |
//         ((-1-aabb2[0][3]+aabb1[1][3])>>31)) ==0;
// }
// //less readable version of above, about same speed.
// function aabbsOverlap4df(aabb1, aabb2){
//     //leftmost of each span left of the rightmost of the other
//     return (
//         1&((-1-aabb1[0][0]+aabb2[1][0])>>31) |
//         1&((-1-aabb2[0][0]+aabb1[1][0])>>31) |
//         1&((-1-aabb1[0][1]+aabb2[1][1])>>31) |
//         1&((-1-aabb2[0][1]+aabb1[1][1])>>31) |
//         1&((-1-aabb1[0][2]+aabb2[1][2])>>31) |
//         1&((-1-aabb2[0][2]+aabb1[1][2])>>31) |
//         1&((-1-aabb1[0][3]+aabb2[1][3])>>31) |
//         1&((-1-aabb2[0][3]+aabb1[1][3])>>31)) ==0;
// }

// //for use in console to check perf
// //example testOverlapFunc(bvhObjsForWorld[9].objList, aabbsOverlap4d)
// var testOverlapFunc = (objList, testFunc) => {
// 	var timestart = performance.now();
//     var numOverlaps =
//         objList.reduce( (cumul, oo) =>
//             cumul + objList.filter(xx=> testFunc(oo.AABB, xx.AABB)).length,0);
//     var timetaken = performance.now()-timestart;
//     return {numOverlaps, timetaken}
// }

function pointSignedDistanceFromPlane(point, plane){
    return dotProduct(point, plane.normal) - plane.distFromOrigin;
}

function dotProduct(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2];
}

function dotProduct4(first, second){
    return first[0]*second[0] + first[1]*second[1] + first[2]*second[2] + first[3]*second[3];
}

function crossProduct(vec1, vec2){
    return [
        vec1[1]*vec2[2] - vec1[2]*vec2[1],
        vec1[2]*vec2[0] - vec1[0]*vec2[2],
        vec1[0]*vec2[1] - vec1[1]*vec2[0],
    ];
}

function normalise(inputVector){
    var len = Math.hypot.apply(null, inputVector);
    return inputVector.map(cc => cc/len);
}

function vectorSum(vec1, vec2){

    // if (vec1 == undefined || vec1[0] == undefined || vec1[1] == undefined || vec1[2] == undefined){
    //     console.log("problem with vec1! " + vec1);
    // }
    // if (vec2 == undefined || vec2[0] == undefined || vec2[1] == undefined || vec2[2] == undefined){
    //     console.log("problem with vec2! " + vec2);
    // }

    return [
        vec1[0] + vec2[0],
        vec1[1] + vec2[1],
        vec1[2] + vec2[2],
    ];
}

function vectorDifference(vec1, vec2){
    return [
        vec1[0] - vec2[0],
        vec1[1] - vec2[1],
        vec1[2] - vec2[2],
    ];
}

/*
//TODO move elsewhere? useful beyond bvh stuff.
function pointToTriangle(point, triangle){
    //DO Separating Axis Test (SAT) for 3 triangle points, 3 edges, face.
    //return the vector, possibly and its length 
    
}
*/

function arrayToGroups(initialArray, groupSize){
    https://stackoverflow.com/a/44996257
    //altered to take arbitrary group size instead of hard coded to 2.
    return initialArray.reduce(function(result, value, index, array) {
        if (index % groupSize === 0)
          result.push(array.slice(index, index + groupSize));
        return result;
      }, []);
}

function morton3(threevec){
    //might be slow and crap! 
    //TODO round up or down the response to this?
    var bitarrays = threevec.map(xx => {

        var intnum = (xx+1)*512;
        intnum = Math.min(intnum, 1023);  //because could be 1024 before this? 
        intnum = Math.max(intnum, 0);

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

function morton4(fourvec){
    //might be slow and crap! 
    var bitarrays = fourvec.map(xx => {

        var intnum = (xx+1)*128;
        intnum = Math.min(intnum, 255);  //because could be 256 before this? 
        intnum = Math.max(intnum, 0);
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

var temp3vec = [...new Array(3)];
var temp4vec = [...new Array(4)];

function aabb4DForSphere(position, sphereRad){
    //position is 4d unit vector.
    //sphere radius is in flat projected space (before projection onto 3-sphere surface)

    var cosAng = Math.cos(Math.atan(sphereRad));   //TODO reformulate for efficiency

    var positionOfCircle = position.map(component => component*cosAng); //position of centre of sphere in flat 4d space
    var projectedCircleRad = sphereRad*cosAng;                                //projected from flat space onto surface of 3-sphere.
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

    // console.log({
    //     note:"aabb calculation",
    //     position,
    //     sphereRad,
    //     AABB
    // })

    return AABB;
}

/*
function aabb4DForLine(startPos, endPos){
    //bodge method. more sections = more accurate

    //could do this exactly - basically a sine wave projected onto each axis.
    // so min/max of start, end points unless passes inflection point
    //but expect simple method (AABB bigger than needed) fine for now.

    var numSections = 10;
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
*/

function aabb4DForLine(startPos, endPos){
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

function minMaxDistanceFromPointToBoundingSphere(pointPos, spherePos, sphereRad){
    var dp = dotProduct4(pointPos, spherePos);
    var angDifference = Math.acos(dp);
    var circleAngRad = Math.atan(sphereRad);    //TODO precalculate?
    return [Math.max(0,angDifference-circleAngRad), angDifference+circleAngRad];
        //TODO maybe remove the max(0, here since may work without anyway
}

function rayBvhCollision(rayStart, rayEnd, world){

    var collided = false;
    var closestFractionAlong = 1;

    processObjs(bvhObjsForWorld[world]);

    function processObjs(worldBvh){

        var possiblities=worldBvh.objList;

        var lineAABB = aabb4DForLine(rayStart, rayEnd);

        //this performs worse than "none" option!
        //TODO bring back grid system?
        if (guiParams.debug.worldCollisionTest1 == "worldBvh"){
            possiblities = collisionTestBvh4d(lineAABB, worldBvh.worldBvh);
        }
        if (guiParams.debug.worldCollisionTest1 == "worldBvh2"){
            possiblities = collisionTestBvh4d2(lineAABB, worldBvh.worldBvh);
        }
        if (guiParams.debug.worldCollisionTest1 == "worldBvhHilbert"){
            possiblities = collisionTestBvh4d2(lineAABB, worldBvh.worldBvhHilbert);
        }
        if (guiParams.debug.worldCollisionTest1 == "grid"){
            var cellIdxForBullet = getGridId.forPoint(rayStart);    //could take average start, end, not need as much padding.
            possiblities = worldBvh.grids ? worldBvh.grids[cellIdxForBullet] : [];
        }

        if (guiParams.debug.worldCollisionTest1 == "grid2"){
            possiblities = worldBvh.grids4d ?Array.from(gridSystem4d.getGridItemsForAABB(worldBvh.grids4d, lineAABB)): [];
        }
        if (guiParams.debug.worldCollisionTest1 == "grid2OnlyOne"){
            possiblities = worldBvh.grids4dPadded ?Array.from(gridSystem4d.getGridItemsForAABBOnlyOne(worldBvh.grids4dPadded, lineAABB)): [];
        }

        var firstStagePossibles = possiblities.length;

        if (guiParams.debug.worldCollisionTest2 == "aabb"){
            possiblities = possiblities.filter(objInfo => 
                aabbsOverlap4d(lineAABB, objInfo.AABB));
        }
        if (guiParams.debug.worldCollisionTest2 == "sphere"){
            //TODO more discerning than AABB filter and faster?
            var bulletSphereRad = 0.01; //radians. what should this be? 
            var bulletSphere = {
                position: rayStart, //TODO use middle?
                cosAng:Math.cos(bulletSphereRad),
                sinAng:Math.sin(bulletSphereRad)
            };  //TODO precalculate this, or make it depend on bullet speed
            possiblities = possiblities.filter(objInfo => 
                collisionTestSimpleSpheres2(bulletSphere,
                    {
                        cosAng: objInfo.cosAng,
                        sinAng: objInfo.sinAng,
                        position: objInfo.mat.slice(12) //store as dedicated field on objInfo?
                    }));
        }

        if (shouldDumpDebug2){
            console.log({
                first: firstStagePossibles,
                second: possiblities.length
            });
            shouldDumpDebug2=false;
        }

        possiblities.forEach(objInfo => {
            //transform ray into object frame (similar logic to boxes etc), applying scale factor.

            var rayPosVec = getPosInMatrixFrame(rayStart, objInfo.transposedMat);
            var rayPosEndVec = getPosInMatrixFrame(rayEnd, objInfo.transposedMat);

            //reject if ray start or end is in other hemisphere to object checking collision with.
            //NOTE this is a stopgap measure - when using world BVH, or long ray collision with world object bounds,
            // won't be necessary to do this.
            if (rayPosVec[3]<=0 || rayPosEndVec[3]<=0){
                return;
            }

            var result = bvhRayCollision(rayPosVec, rayPosEndVec, objInfo);
            collided = collided || result.collided;
            closestFractionAlong = Math.min(closestFractionAlong, result.closestFractionAlong);
        });
    }

    return {
        collided,
        closestFractionAlong
    }
}

//not really bvh stuff:

function augmentObListWithCosAndSin(objList){
    return objList.forEach(oo => 
    {
        var rad = oo.scale * oo.bvh.boundingSphereRadius;
        var ang = Math.atan(rad);
        oo.cosAng = Math.cos(ang);  //TODO replace trig with sqrt etc (but speed here unimportant)
        oo.sinAng = Math.sin(ang);
    });
}

function collisionTestSimpleSpheres2(sphere1, sphere2){    //faster still, avoids cos call from Simple1
    //using compound angle formula cos(A+B) = cosAcosB - sinAsinB
    var compondCosAngle = sphere1.cosAng*sphere2.cosAng - sphere1.sinAng*sphere2.sinAng;
    var dotProd = dotProduct4(sphere1.position, sphere2.position);
    return dotProd>compondCosAngle;
}


// function bvhSurfaceAreaHeuristic(bvh){
//     var thisSurf = surfOfAABB(bvh.AABB);
    
//     if (!bvh.group){
//         return thisSurf;
//     }

//     var surfOfGroups = bvh.group.reduce((cumul,xx) => cumul+ bvhSurfaceAreaHeuristic(xx), 0);

//     return surfOfGroups+thisSurf;
// }
// function surfOfAABB(aabb){
//     var sides = aabb[0].map((xx,ii) => aabb[1][ii]-xx);
//     return 2*(sides[0]*sides[1] + sides[1]*sides[2] + sides[2]*sides[0]);
// }

// function bvhSurfaceAreaHeuristic4d(bvh){
//     var thisSurf = surfOfAABB4d(bvh.AABB);
    
//     if (!bvh.group){
//         return thisSurf;
//     }

//     var surfOfGroups = bvh.group.reduce((cumul,xx) => cumul+ bvhSurfaceAreaHeuristic4d(xx), 0);

//     return surfOfGroups+thisSurf;
// }
// function surfOfAABB4d(aabb){
//     var sides = aabb[0].map((xx,ii) => aabb[1][ii]-xx);
//     return 2*(sides[0]*sides[1]*sides[2] + sides[1]*sides[2]*sides[3] +
//          sides[2]*sides[3]*sides[0] + sides[3]*sides[0]*sides[1]);
// }
