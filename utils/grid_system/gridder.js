const GRID_DIVS = 8;

function generateGridArrayArray(matrixArray, sphereRad){
    var gridArrayArrayLen = GRID_DIVS*GRID_DIVS*GRID_DIVS*8;
    var gridArrayArray = new Array(gridArrayArrayLen);

    for (var gg=0;gg<gridArrayArrayLen;gg++){
        gridArrayArray[gg]=[];
    }

    var numMats = matrixArray.length;
    for (var mm=0;mm<numMats;mm++){
        var centrePoint = matrixArray[mm].slice(12);
        var arrOfGridCubesForObject = Array.from(getGridId.forSphere(centrePoint, sphereRad));
        var numGridCubes = arrOfGridCubesForObject.length;
        for (var gg=0;gg<numGridCubes;gg++){
            gridArrayArray[arrOfGridCubesForObject[gg]].push(mm);
        }
    }

    return gridArrayArray;   //array with element for every grid cube (8 cube cells, each broken into GRID_DIVS^3 sub cubes)
                        //each element is an array listing objects (spheres), which including all that might be 
                        // collided with within that grid cube
}