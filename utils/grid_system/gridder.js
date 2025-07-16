const GRID_DIVS = 8;

function generateGridArrayArray(objList, spherePadding){
    var gridArrayArrayLen = GRID_DIVS*GRID_DIVS*GRID_DIVS*8;
    var gridArrayArray = new Array(gridArrayArrayLen);

    for (var gg=0;gg<gridArrayArrayLen;gg++){
        gridArrayArray[gg]=[];
    }

    objList.forEach(obj => {
        var centrePoint = obj.mat.slice(12);
        var boundingSphereRad = obj.scale * obj.bvh.boundingSphereRadius;
        var paddedRad = boundingSphereRad + spherePadding;
        var arrOfGridCubesForObject = Array.from(getGridId.forSphere(centrePoint, paddedRad));
        arrOfGridCubesForObject.forEach(xx=>gridArrayArray[xx].push(obj));
    });

    return gridArrayArray;
        //array with element for every grid cube (8 cube cells, each broken into GRID_DIVS^3 sub cubes)
        
        //IIRC this actually assumes that objects to be collided with are no larger than grid cells, so 
        // can assign each obj to a grid square, then to check point collision, take the 8 (2x2x2) grid cells
        // around the point (or fewer if on an edge/corner between the 8 3d cubes that make up the tesseract)
        // this doesn't work properly for objects larger than grid squares.

        //a better system might store an array of objects for each grid cell - to determine what a query object
        //might collide with, look at the objects listed for any cell(s) it touches. has benefit that in projected
        //space of the 8 cubes, great circles are lines.

        //however, this grid system quite complicated, so opting to try simple 4d grid system instead...
}


// SIMPLE 4D GRID SYSTEM.
// already have 4d aabb, so then easy to check for intersected 4d grid squares. downside of having many redundant cells 
// (inside /outside 3-sphere), but not a big deal

var gridSystem4d = (() => {
    const GRID_DIVS_4D = 16;

    function generateGridArrays2(objList, padding){
        var numCells = Math.pow(GRID_DIVS_4D, 4);
        var gridLists = Array.from({length:numCells}, ()=> new Set());

        objList.forEach(
            obj => {

                var paddedAABB = [obj.AABB[0], obj.AABB[1].map(xx=>xx+padding)];
                var gridStartEnd = paddedAABB.map(startOrEnd => startOrEnd.map(coord => getGridIdx4dSingleAxis(coord) )); 

                var gridStart = gridStartEnd[0];
                var gridEnd = gridStartEnd[1];

                for (var aa=gridStart[0]; aa<=gridEnd[0]; aa++){
                    for (var bb=gridStart[1]; bb<=gridEnd[1]; bb++){
                        for (var cc=gridStart[2]; cc<=gridEnd[2]; cc++){
                            for (var dd=gridStart[3]; dd<=gridEnd[3]; dd++){
                                var gridIdx = getGridIdxForGridCoords([aa,bb,cc,dd]);
                                gridLists[gridIdx].add(obj);
                            }
                        }
                    }
                }

            }
        );

        return gridLists;
    }

    function getGridIdx4dSingleAxis(coord){
        return Math.min(Math.floor(GRID_DIVS_4D*(coord + 1)/2), GRID_DIVS_4D-1);
        //TODO expand grid a bit to avoid max ?
    }

    function getGridIdx4d(coords){
        var gridCoords = coords.map(coord => getGridIdx4dSingleAxis(coord));
        return getGridIdxForGridCoords(gridCoords);
    }

    function getGridIdxForGridCoords(gridCoords){
        return gridCoords[0]*GRID_DIVS_4D*GRID_DIVS_4D*GRID_DIVS_4D+
            gridCoords[1]*GRID_DIVS_4D*GRID_DIVS_4D+
            gridCoords[2]*GRID_DIVS_4D+
            gridCoords[3];
            //obvious but inefficient!
    }

    function getGridItemsForAABB(gridLists, aabb){
        var gridStartEnd = aabb.map(startOrEnd => startOrEnd.map(coord => getGridIdx4dSingleAxis(coord) )); 

        var gridStart = gridStartEnd[0];
        var gridEnd = gridStartEnd[1];

        var found = new Set();

        for (var aa=gridStart[0]; aa<=gridEnd[0]; aa++){
            for (var bb=gridStart[1]; bb<=gridEnd[1]; bb++){
                for (var cc=gridStart[2]; cc<=gridEnd[2]; cc++){
                    for (var dd=gridStart[3]; dd<=gridEnd[3]; dd++){
                        var gridIdx = getGridIdxForGridCoords([aa,bb,cc,dd]);
                        gridLists[gridIdx].forEach(item => found.add(item));
                    }
                }
            }
        }

        return found;
    }

    function getGridItemsForAABBOnlyOne(gridLists, aabb){
        //check perf impact of just getting for one grid cell. 
        // for small aabb querys most of the time will work
        // if perf boost is good, might precalc this by expanding grid cells by max query aabb size.

        var gridIdx = getGridIdx4d(aabb[0]); 

        return gridLists[gridIdx];
    }

    return {
        generateGridArrays2,
        getGridItemsForAABB,
        getGridItemsForAABBOnlyOne
    }

})();
