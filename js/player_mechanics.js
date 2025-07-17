function updatePlayerMechanics(playerAngVelVec, mouseInfo, timeStep, timeStepMultiplier, moveSpeed, rotateSpeed,
     currentThrustInput, activeGp){
    //TODO don't pass stuff in/use globals
    
    var thrust = 0.001*timeStep;	//TODO make keyboard/gamepad fair! currently thrust, moveSpeed config independent!
   	var angVelDampMultiplier=Math.pow(0.85, timeStep/10);


    //auto-roll upright. with view to using for character controller
    //could put this outside stepspeed if didn't decay towards 0 roll (could do immediately like do with spinCorrection
    if (true){
        //get position of point "above" player by zeroing x,y components of player position. get this in player frame/ dot with player side vector...
        //var pointAbovePlayer = [ 
        
        debugRoll = playerCamera[14]*playerCamera[2] + playerCamera[15]*playerCamera[3];
            //this works because playerCamera 0 thru 3 represents the player's "side" position in the world - ie move quarter way around world from player in sideways direction
            //and playerCamera 12 thru 15 represents player's position in the world.
            //not ideal - will be nothing when y=z=0.
        //debugRoll-= playerCamera[12]*playerCamera[0] + playerCamera[13]*playerCamera[1];	//similar to above but this part -> when x=y=0
        debugRoll-= playerCamera[12]*playerCamera[0] + playerCamera[13]*playerCamera[1];	//similar to above but this part -> when x=y=0

        //multiply by factor that describes how far from top/bottom "poles" (x=y=0, w=z=0) are.
        //something like 1 -(x*x + y*y - z*z - w*w)^2
        //since x*x + y*y + z*z + w*w = 1, get 
        //	1 - ( 2*(x*x + y*y) - 1)^2  = 4(x*x+y*y)^2 - 4(x*x+y*y)
        var xxplusyy = playerCamera[12]*playerCamera[12] + playerCamera[13]*playerCamera[13];
        var multFactor = 4*xxplusyy*(1-xxplusyy);
        
        playerAngVelVec[2]+=debugRoll*guiParams.control.sriMechStr*multFactor*timeStepMultiplier;
    }

    var fractionToKeep= guiParams.control.smoothMouse == 0 ? 0 : Math.exp(-timeStep/guiParams.control.smoothMouse);	
        //smoothMouse ~ smoothing time (ms)
    
    var amountToMove = new Array(2);
    for (var cc=0;cc<2;cc++){
        amountToMove[cc]=mouseInfo.pendingMovement[cc]*(1-fractionToKeep);
        mouseInfo.pendingMovement[cc]*=fractionToKeep;
    }
    
    rotatePlayer([ amountToMove[1], amountToMove[0], 0]);

    currentThrustInput[0]=keyThing.keystate(65)-keyThing.keystate(68);	//lateral
    currentThrustInput[1]=keyThing.keystate(32)-keyThing.keystate(220);	//vertical
    currentThrustInput[2]=keyThing.keystate(87)-keyThing.keystate(83);	//fwd/back
    currentThrustInput=currentThrustInput.map(elem => elem*thrust);

    var currentRotateInput=[keyThing.keystate(40)-keyThing.keystate(38), //pitch
                            keyThing.keystate(39)-keyThing.keystate(37), //turn
                            keyThing.keystate(69)-keyThing.keystate(81)]; //roll

    if (activeGp){
        var buttons = activeGp.buttons;
			//buttons 0 to 15, on xbox controller are:
			//A,B,X,Y
			//L1,R1,L2,R2,
			//BACK,START,
			//L3,R3,	(analog values)
			//d-pad u,d,l,r
			//button 16? don't know (there is a central xbox button but does nothing)
			
		var axes = activeGp.axes;
			//axes for xbox controller:
			//left thumbstick left(-1) to right(+1)
			//left thumbstick up(-1) to down(+1)
			//right thumbstick left(-1) to right(+1)
			//right thumbstick up(-1) to down(+1)

        //TODO move calculation of total input from keys/gamepad outside this loop
        if (gpSettings.moveEnabled){
            var gpMove = [Math.abs(axes[0])>gpSettings.deadZone ? -moveSpeed*axes[0] : 0, //lateral
                          Math.abs(axes[1])>gpSettings.deadZone ? moveSpeed*axes[1] : 0, //vertical
                          moveSpeed*(buttons[7].value-buttons[6].value)]; //fwd/back	//note Firefox at least fails to support analog triggers https://bugzilla.mozilla.org/show_bug.cgi?id=1434408
            
            var magsq = gpMove.reduce((total, val) => total+ val*val, 0);
            
            for (var cc=0;cc<3;cc++){
                currentThrustInput[cc]+=gpMove[cc]*5000000000*magsq;
            }
            
            //testInfo=[axes,buttons,gpMove,magsq];
            
            //note doing cube bodge to both thrust and to adding velocity to position (see key controls code)
            //maybe better to pick one! (probably should apply cube logic to acc'n for exponential smoothed binary key input, do something "realistic" for drag forces
        }
        
        currentRotateInput[2]+=gpSettings.roll(activeGp); //roll
        
        //other rotation
        var gpRotate=[];
        var fixedRotateAmount = 10*rotateSpeed;
        gpRotate[0] = gpSettings.pitch(activeGp, fixedRotateAmount);
        gpRotate[1] = gpSettings.turn(activeGp, fixedRotateAmount);
        gpRotate[2] = 0;	//moved to code above
            
        magsq = gpRotate.reduce((total, val) => total+ val*val, 0);
        
        //var magpow = Math.pow(50*magsq,1.5);	//TODO handle fact that max values separately maxed out, so currently turns faster in diagonal direction.
        //lastPlayerAngMove = scalarvectorprod(100000*magpow*timeStepMultiplier,gpRotate);
            //arguably above nicer for gamepad, better supports precise movement

        var magpow = Math.pow(1*magsq,0.25);
        lastPlayerAngMove = scalarvectorprod(100*magpow*timeStepMultiplier,gpRotate);
        rotatePlayer(lastPlayerAngMove);	//TODO add rotational momentum - not direct rotate
    }
    
    for (var cc=0;cc<3;cc++){
        playerAngVelVec[cc]+= timeStepMultiplier*currentRotateInput[cc];
        playerAngVelVec[cc]*=angVelDampMultiplier;
        playerVelVec[cc]+=currentThrustInput[cc];	//todo either write vector addition func or use glmatrix vectors
    }
}