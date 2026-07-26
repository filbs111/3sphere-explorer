//some data to show on map to get idea of size of things.

var testObjectsData = (function(){

    var worldposoffset = 0;

    var objs = [];

    addObject("10M CUBE", [10,10,10]);

    addObject("HUMAN", [0.4,0.4,2]);
    addObject("BUS", [12,2.5,3]);   //or big shipping container!
    addObject("SUPER HEAVY BOOSTER", [9,9,72]);
    //addObject("CONTAINER SHIP", [400,60,60]);

    //addObject("100M CUBE", [100,100,100]);

     addObject("500M CUBE", [500,500,500]);


    //addObject("1KM CUBE", [1000,1000,1000]);
    //addObject("10KM CUBE", [10000,10000,10000]);


    function addObject(name, size){ //size is length, width, height in metres
        var mat = mat4.identity();    //TODO move xyz, set heigh above terrain..

        //initial matrix defaults to positioning object at top of world (x=y=0). w or z = + or - 1 (TODO check!)

        worldposoffset+=0.025;   //space test objects uniformly

        //xyzmove4mat(mat, [0,0,worldposoffset]); //move along top spine of world, affects "downhill" position once moved down to surface
        xyzrotate4mat(mat, [0,0, worldposoffset]);  //spin around top spine, affects "uphill" position once moved down to surface

//        xyzmove4mat(mat, [Math.PI/4 - 0.02,0,0]);  //move down to surface (and up a tiny amount )
       xyzmove4mat(mat, [.2,0,0]);  //move down a bit


        //xyzrotate4mat(mat, [Math.PI/4,0,0]);    //spin 45 deg about vertical axis
        xyzrotate4mat(mat, [0,Math.PI/2,0]); //pitch 90 deg

        objs.push({
            name,
            mat,
            size
        })
    }

    function forWorldSize(worldSize){
        return objs.map(obj => {return {
            obj,
            mat: obj.mat,
            scale: obj.size.map(x=>x/(2*unitWorldRadiusMetres*worldSize))
        }});
    }

    return {
        forWorldSize
    }
})();