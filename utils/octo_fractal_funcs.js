var octoFractalUtils = (function(){

    function getClosestPoint(input, levels){
        //basically collide with the nearest solid octohedron (num levels down.)
        //find closest octohedron, then find closest of the 6 at next nevel down, and so on.

        //initial test - find approx closest point on outer octohedron (doesn't handle edges correctly)
        
        var absInput = input.map(Math.abs);
        var signInput = input.map((xx,ii)=> xx/absInput[ii]);
        var totalAbs = absInput[0]+absInput[1]+absInput[2];

        var awayFromToSurface = signInput.map(ss=>ss*((totalAbs-1)/3));
        var movedToSurface = input.map((xx,ii)=>xx-awayFromToSurface[ii]);

        return movedToSurface;

        // if (absInput[0]>absInput[1]){

        // }
    }

    var lastPen = 0;
    function getLastPen(current){
        //TODO improve. won't work for more than one instance of octoFractal, code copied from menger_sponge_funcs
        last = lastPen;
        lastPen=current;
        return last;
    }

    var isInside = function(inputVec, levels){
        if (levels<0){
            return true;
        }
        inputVec = inputVec.map(x => 2*Math.abs(x));	//TODO modify in place? (can sum in loop too)
        var total = inputVec[0]+inputVec[1]+inputVec[2];

        if (total>2){
            return false;
        }

        if (inputVec[0]>inputVec[1]){
            if (inputVec[2]>inputVec[0]){
                --inputVec[2];
            }else{
                --inputVec[0];
            }
        }else{
            if (inputVec[2]>inputVec[1]){
                --inputVec[2];
            }else{
                --inputVec[1];
            }
        }

        return isInside(inputVec, --levels);
    }

    return {
        getClosestPoint,
        isInside,
        getLastPen
    };
})();