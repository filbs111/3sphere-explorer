function applyPortalMovement(){
    var leftmove = keyThing.keystate(100);  //numpad 4
    var rightmove = keyThing.keystate(102); //numpad 6
    var upmove = keyThing.keystate(104);    //numpad 8
    var downmove = keyThing.keystate(98);   //numpad 2
    var fwdmove = keyThing.keystate(105);   //numpad 9
    var backmove = keyThing.keystate(99);   //numpad 3

    var holdToRotate = !keyThing.keystate(96);   //numpad 0

    var movespeed = 0.001;
    var rotatespeed = 0.001; 

    if (holdToRotate){
        xyzrotate4mat(portalMats[0],[   rotatespeed*(downmove-upmove),
                                        rotatespeed*(leftmove-rightmove),
                                        rotatespeed*(fwdmove-backmove)]);
    }else{
        xyzmove4mat(portalMats[0],[ movespeed*(leftmove-rightmove),
                                    movespeed*(downmove-upmove),
                                    movespeed*(fwdmove-backmove)]);
    }

    //appears mats get wonky after a while. maybe should do this more routinely when making transformations
    cleanupMat(portalMats[0]);
}