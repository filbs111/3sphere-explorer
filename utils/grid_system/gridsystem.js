var getGridId=(function generateGetGridId(gridDivs){
    
    var halfGridDivs = gridDivs/2;
    var piBy4 = Math.PI/4;

    function get3dAngleGridNum(localcoords){
        var atan2GridNums = new Array(3);
        for (var cc=0;cc<3;cc++){
            var atan2GridNum = Math.atan2(localcoords[cc+1], localcoords[0]);
            atan2GridNum = Math.floor(halfGridDivs* (atan2GridNum/piBy4 +1));
            if (atan2GridNum >= gridDivs){console.log("hit max atan2");}
            if (atan2GridNum <0){console.log("hit min atan2");}
            atan2GridNum = Math.min(atan2GridNum, gridDivs-1);
            atan2GridNum = Math.max(atan2GridNum, 0);
            atan2GridNums[cc] = atan2GridNum;
        }
        return atan2GridNums;
    }

    function get3dAngleGridNumMinMax(localcoords, sphereRad){
        var atan2GridNumMinMax = new Array(3);
        for (var cc=0;cc<3;cc++){
            var atan2GridNum = Math.atan2(localcoords[cc+1], localcoords[0]);

            var vsq = localcoords[0]*localcoords[0] + localcoords[cc+1]*localcoords[cc+1];  // or 1- this??
            var wsq = 1-vsq;    //= coords[2]*coords[2] + coords[3]*coords[3], if coords normalised
            var plusMinusTanAng = sphereRad / Math.sqrt( vsq - (sphereRad*sphereRad*wsq));
                    //this basically works, though falls over when part inside sqrt goes -ve.
            var plusMinusAng = Math.atan(plusMinusTanAng);

            var maxAng = atan2GridNum + plusMinusAng;
            var minAng = atan2GridNum - plusMinusAng;

            var maxGridNum = Math.floor(halfGridDivs* (maxAng/piBy4 +1));
            var minGridNum = Math.floor(halfGridDivs* (minAng/piBy4 +1));

            maxGridNum+=1;  //range is from minGridNum to maxGridNum+1

            // if (maxGridNum > gridDivs){console.log("hit max atan2");}
            // if (maxGridNum <0){console.log("hit min atan2");}

            // if (minGridNum > gridDivs){console.log("hit max atan2");}
            // if (minGridNum <0){console.log("hit min atan2");}

            maxGridNum = Math.min(maxGridNum, gridDivs);
            maxGridNum = Math.max(maxGridNum, 0);

            minGridNum = Math.min(minGridNum, gridDivs);
            minGridNum = Math.max(minGridNum, 0);

            atan2GridNumMinMax[cc] = {max:maxGridNum, min:minGridNum};
        }
        return atan2GridNumMinMax;
    }

    var absArr = new Array(4);

    var getGridId = function getGridId(coords){ //coords = [w,x,y,z]
        
        var lwIdx;
        var localIdx=new Array(4);
        var localcoords=new Array(4);
        var projectedCoords = new Array(3);
        var gridIdx;

        for (var cc=0;cc<4;cc++){
            absArr[cc]=Math.abs(coords[cc]);
        }

        //this part maybe has some cunning trick to make more efficient
        lwIdx = 0;
        for (var cc=1;cc<4;cc++){
            lwIdx = absArr[cc] > absArr[lwIdx]? cc:lwIdx;
        }
        
        isNegativeShift = coords[lwIdx]<0 ? 4:0;

        localIdx[0] = lwIdx + isNegativeShift;
        localcoords[0] = absArr[lwIdx];
        for (var cc=1;cc<4;cc++){
            localIdx[cc] = (lwIdx + cc + isNegativeShift) & 7; // which element of array [w,x,y,z.-w,-x,-y,-z]
            localcoords[cc] = coords[localIdx[cc] & 3] * ( localIdx[cc] < 4 ? 1:-1 );
            projectedCoords[cc-1] = localcoords[cc]/localcoords[0];
        }
        //note projected coords would work better if w used array position 3 instead of 0

        //simple logging of results
        // console.log("input coords:", coords);
        // console.log("cell id: ", localIdx[0]);
        // console.log("projected coords:", projectedCoords);

        //get grid id
        var atan2GridNums = get3dAngleGridNum(localcoords);

        //get gridIdx
        gridIdx = atan2GridNums[0] + gridDivs*( atan2GridNums[1] + gridDivs*atan2GridNums[2] );

        // console.log("atan2gridnums: ", atan2GridNums);
        // console.log("atan2grididx: ", gridIdx);

        //TODO list neighbouring squares. don't need this for all use cases.

        gridIdx+= gridDivs*gridDivs*gridDivs * (lwIdx + isNegativeShift);   //shift for cell. (ie cell 0 is grid indices from 0 to gridDivs^3 -1, etc)

        return gridIdx;
    }
    

    var getGridIndicesForSphereByLimits = function(centrecoord, sphereRad){

        //shift by cell number
        var gridDivsCubed = gridDivs*gridDivs*gridDivs;

        for (var cc=0;cc<4;cc++){
            absArr[cc]=Math.abs(centrecoord[cc]);
        }

        var localIdx = new Array(4);
        var localcoords = new Array(4);
        var gridIndices = new Set();

        for (var lwIdx=0;lwIdx<4;lwIdx++){
            //assumes that sphere is small enough to only hit maximum of 4 cells at a time. falls over for larger spheres that can hit 2 opposite cells simultaneously.
                //happens for sphereRad 1 in centre, or sphereRad 1/root2 halfway along edge. 

            isNegativeShift = centrecoord[lwIdx]<0 ? 4:0;

            localIdx[0] = lwIdx + isNegativeShift;
            localcoords[0] = absArr[lwIdx];
            for (var cc=1;cc<4;cc++){
                localIdx[cc] = (lwIdx + cc + isNegativeShift) & 7; // which element of array [w,x,y,z.-w,-x,-y,-z]
                localcoords[cc] = centrecoord[localIdx[cc] & 3] * ( localIdx[cc] < 4 ? 1:-1 );
            }

            cellShift = gridDivsCubed* localIdx[0];

            var minMax = get3dAngleGridNumMinMax(localcoords, sphereRad);
            //console.log(minMax);
            
            for (var aa=minMax[0].min; aa<minMax[0].max; aa++){
                for (var bb=minMax[1].min; bb<minMax[1].max; bb++){
                    for (var cc=minMax[2].min; cc<minMax[2].max; cc++){
                        gridIndices.add(aa + gridDivs*(bb + gridDivs*cc) + cellShift );
                    }
                }
            }
        }
        
        //console.log(gridIndices);

        return gridIndices;
    }
    

    return {
        forPoint:getGridId,
        forSphere:getGridIndicesForSphereByLimits
    }

})(GRID_DIVS);