//test conversion of co-ordinate to distance along hilbert curve.
//want this so can apply simple ordering to create binary tree for sphere tree BVH, similar to how used z-order / morton ordering for AABB BVH.
// because expect morton ordering to not work great for sphere tree, since points near in z-order can be distant in regular space. not really a problem 
// for AABB because jump is along axis, so resulting AABB containing distant points (which are close in z-order) is long in one dimension and thin in
//others. The jump is a problem for sphere tree though.


//info from here.
// https://stackoverflow.com/questions/499166/mapping-n-dimensional-value-to-a-point-on-hilbert-curve
// could copy Skilling's original c code, but Chernoch claims bug fix, so copy that c#, try port to js...
// note js version is likely much slower than it could be. TODO use typed arrays?
/*
namespace HilbertExtensions
{
    /// <summary>
    /// Convert between Hilbert index and N-dimensional points.
    /// 
    /// The Hilbert index is expressed as an array of transposed bits. 
    /// 
    /// Example: 5 bits for each of n=3 coordinates.
    /// 15-bit Hilbert integer = A B C D E F G H I J K L M N O is stored
    /// as its Transpose                        ^
    /// X[0] = A D G J M                    X[2]|  7
    /// X[1] = B E H K N        <------->       | /X[1]
    /// X[2] = C F I L O                   axes |/
    ///        high low                         0------> X[0]
    ///        
    /// NOTE: This algorithm is derived from work done by John Skilling and published in "Programming the Hilbert curve".
    /// (c) 2004 American Institute of Physics.
    /// 
    /// </summary>
    public static class HilbertCurveTransform
    {
        /// <summary>
        /// Convert the Hilbert index into an N-dimensional point expressed as a vector of uints.
        ///
        /// Note: In Skilling's paper, this function is named TransposetoAxes.
        /// </summary>
        /// <param name="transposedIndex">The Hilbert index stored in transposed form.</param>
        /// <param name="bits">Number of bits per coordinate.</param>
        /// <returns>Coordinate vector.</returns>
        public static uint[] HilbertAxes(this uint[] transposedIndex, int bits)
        {
            var X = (uint[])transposedIndex.Clone();
            int n = X.Length; // n: Number of dimensions
            uint N = 2U << (bits - 1), P, Q, t;
            int i;
            // Gray decode by H ^ (H/2)
            t = X[n - 1] >> 1;
            // Corrected error in Skilling's paper on the following line. The appendix had i >= 0 leading to negative array index.
            for (i = n - 1; i > 0; i--) 
                X[i] ^= X[i - 1];
            X[0] ^= t;
            // Undo excess work
            for (Q = 2; Q != N; Q <<= 1)
            {
                P = Q - 1;
                for (i = n - 1; i >= 0; i--)
                    if ((X[i] & Q) != 0U)
                        X[0] ^= P; // invert
                    else
                    {
                        t = (X[0] ^ X[i]) & P;
                        X[0] ^= t;
                        X[i] ^= t;
                    }
            } // exchange
            return X;
        }

        /// <summary>
        /// Given the axes (coordinates) of a point in N-Dimensional space, find the distance to that point along the Hilbert curve.
        /// That distance will be transposed; broken into pieces and distributed into an array.
        /// 
        /// The number of dimensions is the length of the hilbertAxes array.
        ///
        /// Note: In Skilling's paper, this function is called AxestoTranspose.
        /// </summary>
        /// <param name="hilbertAxes">Point in N-space.</param>
        /// <param name="bits">Depth of the Hilbert curve. If bits is one, this is the top-level Hilbert curve.</param>
        /// <returns>The Hilbert distance (or index) as a transposed Hilbert index.</returns>
        public static uint[] HilbertIndexTransposed(this uint[] hilbertAxes, int bits)
        {
            var X = (uint[])hilbertAxes.Clone();
            var n = hilbertAxes.Length; // n: Number of dimensions
            uint M = 1U << (bits - 1), P, Q, t;
            int i;
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

    }
}
*/ 


/*
doConversionForCoords([0,0], 1);
doConversionForCoords([0,1], 1);
doConversionForCoords([1,1], 1);
doConversionForCoords([1,0], 1);

doConversionForCoords([0,0,0], 10);
*/

//print grid
for (var ii=0;ii<8;ii++){
    var results = [...new Array(8)].map((_,jj) => hilbertIndex([ii,jj],3));
    console.log(results.join("\t"));
}

//example use for 4d 8 bits per axis.
doConversionForCoords([0,0,0,0], 8, true);      //start of hilbert curve
doConversionForCoords([255,0,0,0], 8, true);    //end of hilbert curve. produces -1 before XORing with 2^31

doConversionForCoords([0,0,0,0], 8, true);
doConversionForCoords([127,0,0,0], 7, true); //looking for 2^28 - 1  = 268,435,455  - behaves sensibly before xoring (doesn't get to 2^31 so doesn't jump -ve)


function doConversionForCoords(inputCoords, bitsPerCoord, doLog){
    var logIt = doLog ? console.log: function(x){};
    logIt("testing input: " + inputCoords);
    //var converted = HilbertIndexTransposed(inputCoords, bitsPerCoord);
    var hIdx = hilbertIndex(inputCoords, bitsPerCoord);
    logIt("output: " + hIdx);
    //logIt("outputXored: " + (hIdx ^ 0b10000000000000000000000000000000));
    logIt("outputXored: " + (hIdx ^ 0x80000000));    //2^32 - to deal with javascript -ve numbers beyond 2^31!

    logIt();
}

//ported from found code
function HilbertAxes(transposedIndex, bits){
    var X = transposedIndex.slice();
    var n = X.length; // n: Number of dimensions
    var N = 2 << (bits - 1), P, Q, t;
    var i;
    // Gray decode by H ^ (H/2)
    t = X[n - 1] >> 1;
    // Corrected error in Skilling's paper on the following line. The appendix had i >= 0 leading to negative array index.
    for (i = n - 1; i > 0; i--) 
        X[i] ^= X[i - 1];
    X[0] ^= t;
    // Undo excess work
    for (Q = 2; Q != N; Q <<= 1)
    {
        P = Q - 1;
        for (i = n - 1; i >= 0; i--)
            if ((X[i] & Q) != 0)
                X[0] ^= P; // invert
            else
            {
                t = (X[0] ^ X[i]) & P;
                X[0] ^= t;
                X[i] ^= t;
            }
    } // exchange
    return X;
}

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

    /*
    for (var bitnum=0;bitnum<numBits; bitnum++){
        var nextBits = transposedResult.map(component => component & 1);
        //var nextBits = transposedResult.map(component => component % 2);    //should be equivalent 
        //console.log(nextBits);

        transposedResult = transposedResult.map(component => component>>1); //can do in place??
        for (var dd=0;dd<numDimensions;dd++){
            //console.log(transposedResult);

            regularResult<<=1;
            regularResult+=nextBits[dd];
        }
    }
    */

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

    return regularResult;
}