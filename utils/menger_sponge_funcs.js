var mengerUtils = (function(){
   
    function getClosestPoint(input, levels){
        var projectedPoint = input.map(p => Math.min(1,Math.max(-1,p)));
        //if was outside cube, from now on only need to solve for a 2d Sierpiński carpet, which might be simpler/more efficient.
        
        //see if is inside central third. note that this is only a possibility if was inside cube, so previous operation will have done nothing.
        
        var recursionsRemaining = levels;	//0 = cube, 1= simple ( 20 solid subcubes), etc. level is what using in 3sphere game at the mo 
        
        return getClosestPointInner(projectedPoint);
        
        function getClosestPointInner(point){
        
            if (recursionsRemaining <1){return point;}
            recursionsRemaining--;
        
            //var absPoint = input.map(Math.abs);
            var absPoint = point.map(Math.abs);
            var numInside = absPoint.map(x => x < 0.33333).reduce( (a,b) => a + (b ? 1:0), 0);
            
            var projectedPointInner = point.map((p,ii) => 0.33333* p/ Math.min(0.33333,absPoint[ii]));
            if (absPoint[0]<absPoint[1]){
                if (absPoint[0]<absPoint[2]){
                    projectedPointInner[0] = point[0];	//0 is smallest
                }else{
                    projectedPointInner[2] = point[2];	//2 is smallest
                }
            }else{
                if (absPoint[1]<absPoint[2]){
                    projectedPointInner[1] = point[1];	//1 is smallest
                }else{
                    projectedPointInner[2] = point[2];	//2 is smallest
                }
            }
            
                //in central subcube, should return closest point on edge. 
            if (numInside == 3){	//low probability this is true, and terminates after,
                return projectedPointInner;
            }
            
            //otherwise find which subcube is in (or was projected onto)
            
            //to do this more properly, should look at which subcube was projected onto.
            //however, it doesn't matter if accidentally treat it as if in a neighbouring subcube (even if that's an empty space)
            //in these cases,
            
            var subcubeCentre = projectedPointInner.map( x => (0.666667* Math.floor((x+1)/0.666667)) - 0.666667 );
            var toInput = projectedPointInner.map( (x,i) => 3*(x-subcubeCentre[i]));
            
            return getClosestPointInner(toInput).map( (x,i) =>0.333333*x + subcubeCentre[i]);	 
        }
    }

    /*
     * this is inefficient, but reused existing distance function
     * TODO dedicated function
    */
    var isInside = function(input, levels){
        var closestPoint = getClosestPoint(input, levels);
        var distanceToClosestPointSq = closestPoint.map((xx,ii) => xx-input[ii]).reduce((accum, yy) => yy*yy +accum, 0);
        return distanceToClosestPointSq < 0.00001; //arbitrary small number
    }

    return {
        getClosestPoint,
        isInside
    };
})();