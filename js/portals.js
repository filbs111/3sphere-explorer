var portalsForWorld = (()=>{

    var portalsForWorld = [[],[],[]];
    
    function addPortalPair(worldOne, worldTwo){
        var matOne = newIdMatWithQuats();
        var matTwo = newIdMatWithQuats();
        var ps1 = {world:worldOne, matrix:matOne};
        var ps2 = {world:worldTwo, matrix:matTwo, otherps:ps1};
        ps1.otherps = ps2;
        portalsForWorld[worldOne].push(ps1);
        portalsForWorld[worldTwo].push(ps2);
    }

    addPortalPair(0, 1);
    addPortalPair(1, 2);
    addPortalPair(2, 0);

    //move one portal in each world away from default.
    xyzmove4mat( portalsForWorld[0][0].matrix, [0,0,0.6]);
    xyzmove4mat( portalsForWorld[1][0].matrix, [0,0,0.2]);
    xyzmove4mat( portalsForWorld[2][0].matrix, [0,0,0.2]);

    return portalsForWorld;
})();




