//bounding volume heirarcy stuff.
//generation of BVH from triangle mesh
//and collision with it.

//Axis-aligned bounding box tree.
//collision tests for 
//vs input AABB, distance query for point (for sphere test) - perhaps with sign (which side of triangle). Test for a line with many points, point to point test...
// for line, collision, equally spaced points on great circle are not evenly spaced on the 3d projected space,
// for sphere test not really correct in projected space. 
// for small objects this might not matter much, but for world level BVH this should be accounted for.

function createBvhFrom3dObjectData(sourceData){
    //take in triangle mesh data.
    //produce bounding volume heirarchy

    var tris = arrayToGroups(sourceData.indices, 3);
    var verts = arrayToGroups(sourceData.vertices, 3);

    var temp3Vec = [...new Array(3)];

    //for each triangle, create an AABB.
    //initial version just have an AABB per tri, don't make a tree. can test collision 
    //using this works OK. Then look to make faster by making a tree.
    var trisWithAABB = tris.map( tri => {
        var triVerts = tri.map( idx => verts[idx]);
        
        var components = temp3Vec.map( (_,component) => triVerts.map(vv => vv[component])); //component[0] is array of values of x for each vert
        var minAABB = components.map( minAABBPointsForComponent => Math.min.apply(null, minAABBPointsForComponent));
        var maxAABB = components.map( maxAABBPointsForComponent => Math.max.apply(null, maxAABBPointsForComponent));

        //TODO calculate centre position so can morton/hilbert order for grouping into tree...

        return {
            triangleIndices: tri,
            AABB: [minAABB, maxAABB] 
        }
    });

    return {
        verts,   //suspect only require vertex data.
        tris: trisWithAABB
    }
}

function bvhOverlapTest(testAABB, bvh){
    //TODO generalise this to take 2 bvhs or items with aabbs? 
    //currently bvh is just an array of triangles with AABBS
    for (var ii=0;ii< bvh.tris.length; ii++){
        if (aabbsOverlap(testAABB, bvh.tris[ii].AABB)){
            return true;
        }
    }
    return false;
}

function aabbsOverlap(aabb1, aabb2){
    var intersection = true;
    for (var ii=0;ii<3;ii++){
            //leftmost of each span left of the rightmost of the other
        var thisAxisIntersects = aabb1[0][ii] < aabb2[1][ii] && aabb2[0][ii] < aabb1[1][ii];
        intersection = intersection && thisAxisIntersects;
    }
    return intersection;
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