var portalsForWorld = (()=>{

    var portalsForWorld = [[],[],[]];
    
    function addPortalPair(worldOne, worldTwo, radius){
        var matOne = newIdMatWithQuats();
        var matTwo = newIdMatWithQuats();
        var shared = {radius};
        var ps1 = {world:worldOne, matrix:matOne, shared};
        var ps2 = {world:worldTwo, matrix:matTwo, shared, otherps:ps1};
        ps1.otherps = ps2;
        portalsForWorld[worldOne].push(ps1);
        portalsForWorld[worldTwo].push(ps2);
    }

    addPortalPair(0, 1, 0.04);
    addPortalPair(1, 2, 0.08);
    addPortalPair(2, 0, 0.16);

    //move one portal in each world away from default.
    xyzmove4mat( portalsForWorld[0][0].matrix, [0,0,1]);
    xyzmove4mat( portalsForWorld[1][0].matrix, [0,0,1]);
    xyzmove4mat( portalsForWorld[2][0].matrix, [0,0,1]);

    return portalsForWorld;
})();




