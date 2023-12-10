var octoFractalUtils = (function(){

    function getClosestPoint(input, levels){
        //basically collide with the nearest solid octohedron (num levels down.)
        //find closest octohedron, then find closest of the 6 at next level down, and so on.

        if (levels<1){
            return getClosestPointSimpleOctohedon(input);
        }

        var absInput = input.map(Math.abs);
        var largestComponent;
        if (absInput[0]>absInput[1]){
            largestComponent = absInput[2]>absInput[0] ? 2:0;
        }else{
            largestComponent = absInput[2]>absInput[1] ? 2:1;
        }

        var centreToCollideWith = [0,0,0];       
        centreToCollideWith[largestComponent]+=input[largestComponent]>0?  1:-1;

        var remainderInput = input.map((xx, ii)=> xx*2 - centreToCollideWith[ii] );

        var returnValFromNextLevel = getClosestPoint(remainderInput,--levels);
        return returnValFromNextLevel.map((xx,ii) => (xx+centreToCollideWith[ii])/2);
    }

    function getClosestPointSimpleOctohedon(input){
        // finds closest point on plane for the 1/8th space (x,y,z signs)
        // NOTE doesn't handle edges correctly - TODO return points on edges, not on plane beyond tri faces
        
        var absInput = input.map(Math.abs);
        var signInput = input.map((xx,ii)=> xx/absInput[ii]);
        var totalAbs = absInput[0]+absInput[1]+absInput[2];

        var awayFromToSurface = signInput.map(ss=>ss*((totalAbs-1)/3));
        var movedToSurface = input.map((xx,ii)=>xx-awayFromToSurface[ii]);

        return movedToSurface;
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