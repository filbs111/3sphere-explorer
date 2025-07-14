function hilbert4(fourvec){
    var intCoords = fourvec.map(xx => {
        var intnum = (xx+1)*128;    //map -1 to 1 to 0 to 255
        intnum = Math.min(intnum, 255);  //because could be 256 before this?
        intnum = Math.max(intnum, 0);
        return intnum;
    });
    return hilbertIndex(intCoords, 8);
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