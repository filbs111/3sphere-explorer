var portalsForWorld = (()=>{

    var portalsForWorld = [[],[],[],[],[],[],[],[],[],[]];
    
    function addPortalPair(worldOne, worldTwo, radius, color){
        var matOne = newIdMatWithQuats();
        var matTwo = newIdMatWithQuats();
        var shared = {radius, color};
        var ps1 = {world:worldOne, matrix:matOne, shared};
        var ps2 = {world:worldTwo, matrix:matTwo, shared, otherps:ps1};
        ps1.otherps = ps2;
        portalsForWorld[worldOne].push(ps1);
        portalsForWorld[worldTwo].push(ps2);
    }

    addPortalPair(0, 1, 0.025, [0.5,0.5,0.5,1.0]);
    addPortalPair(1, 2, 0.05, [0.1,0.1,0.1,1.0]);
    addPortalPair(2, 0, 0.1, [0.5,0.1,0.1,1.0]);

    addPortalPair(0, 3, 0.075, [0.5,0.5,0.1,1.0]);
    

    addPortalPair(3, 4, 0.075, [0.5,0.5,0.1,1.0]);
    addPortalPair(4, 5, 0.075, [0.5,0.5,0.1,1.0]);
    addPortalPair(4, 6, 0.075, [0.5,0.5,0.1,1.0]);

    addPortalPair(3, 7, 0.075, [0.5,0.5,0.1,1.0]);
    addPortalPair(7, 8, 0.075, [0.5,0.5,0.1,1.0]);
    addPortalPair(7, 9, 0.075, [0.5,0.5,0.1,1.0]);

    //move one portal in each world away from default.
    xyzmove4mat( portalsForWorld[0][0].matrix, [0,0,1]);
    xyzmove4mat( portalsForWorld[1][0].matrix, [0,0,1]);
    xyzmove4mat( portalsForWorld[2][0].matrix, [0,0,1]);

    xyzmove4mat( portalsForWorld[0][2].matrix, [0,0,-0.5]);


    xyzmove4mat( portalsForWorld[3][1].matrix, [0.2,0,0]);  //move portal from world 3 to world 4

    xyzmove4mat( portalsForWorld[4][1].matrix, [0,0,0.3]);  //move portal from world 4 to world 5
    xyzmove4mat( portalsForWorld[5][0].matrix, [0.2,0,0.2]);    //move portal from world 5 to world 4   (otherwise inside object)
    xyzmove4mat( portalsForWorld[4][2].matrix, [0.2,0,0.2]);  //move portal from world 4 to world 6
    xyzmove4mat( portalsForWorld[6][0].matrix, [0.4,0,0.4]);    //move portal from world 6 to world 4   (otherwise inside object)

    xyzmove4mat( portalsForWorld[3][2].matrix, [-0.2,0,0]);  //move portal from world 3 to world 7
    xyzmove4mat( portalsForWorld[7][1].matrix, [-0.2,0, 0.2]);   //move portal from world 7 to world 8
    xyzmove4mat( portalsForWorld[7][2].matrix, [0,0,0.3]); //move portal from world 7 to world 9

    //portal from world 4 to world 4:
    //addPortalPair(3, 3, 0.075, [0.5,0.5,0.5,1.0]);
    //xyzmove4mat( portalsForWorld[3][0].matrix, [0,0,1]);
    //xyzmove4mat( portalsForWorld[3][1].matrix, [0,0.5,1]);

    return portalsForWorld;
})();




