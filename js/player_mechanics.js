var playerMechanics = (() => {

    var autoFireCountdown=0;

    return {
        update
    }

    function update(playerPos, playerAngVelVec, spd, mouseInfo, timeStep, timeStepMultiplier, moveSpeed, rotateSpeed,
     currentThrustInput, activeGp){
        //TODO don't pass stuff in/use globals
        
        var thrust = 0.001*timeStep;	//TODO make keyboard/gamepad fair! currently thrust, moveSpeed config independent!
        var angVelDampMultiplier=Math.pow(0.85, timeStep/10);
        var duoCylinderAngVelConst = guiSettingsForWorld[playerContainer.world].spinRate;
        var autoFireCountdownStartVal=Math.ceil(5 / (timeStep/10));


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


        //blend velocity with velocity of rotating duosphere. (todo angular vel to use this too)
        //matrix entries 12-15 describe position. (remain same when rotate player and don't move)
        //playerVel is in frame of player though - so apply matrix rotation to this.
        
        var spinVelWorldCoords = [ duoCylinderAngVelConst*playerPos[1],-duoCylinderAngVelConst*playerPos[0],0,0];
                        
        var spinVelPlayerCoords = [
            spinVelWorldCoords[0]*playerCamera[0] + spinVelWorldCoords[1]*playerCamera[1],
            spinVelWorldCoords[0]*playerCamera[4] + spinVelWorldCoords[1]*playerCamera[5],
            spinVelWorldCoords[0]*playerCamera[8] + spinVelWorldCoords[1]*playerCamera[9]];
        
        //this is in frame of duocylinder. playerVelVec is in frame of player though... ?!! possible to do without matrix mult? by choosing right parts of playerCamera mat?
        
        //do the same thing for "up" vector. 
        //var radialWorldCoords = [ playerPos[0], playerPos[1],0,0];	AFAIK the following is not const length, but hope will give correct direction on duocylinder surf
        var radialWorldCoords = playerPos;	//this maybe correct
        var radialPlayerCoords = [
            radialWorldCoords[0]*playerCamera[0] + radialWorldCoords[1]*playerCamera[1],
            radialWorldCoords[0]*playerCamera[4] + radialWorldCoords[1]*playerCamera[5],
            radialWorldCoords[0]*playerCamera[8] + radialWorldCoords[1]*playerCamera[9]];
        
        
        //square drag //want something like spd = spd - const*spd*spd = spd (1 - const*|spd|)

        var airSpdVec = playerVelVec.map((val, idx) => val-spinVelPlayerCoords[idx]);
        //spd = Math.sqrt(airSpdVec.map(val => val*val).reduce((val, sum) => val+sum));
        spd = Math.hypot.apply(null, airSpdVec);
        
        //print speed
        if (guiParams.debug.showSpeedOverlay){
            var infoToShow ="";
            var speed = Math.hypot.apply(null, playerVelVec);
            infoToShow += "spd:" + speed.toFixed(2);

            infoToShow+=", airspd: " + spd.toFixed(2);
        //	infoToShow+=", sshipMat:" + Array.from(sshipMatrix).map(elem=>elem.toFixed(3)).join(",");	//toFixed doesn't work right on float32 array so use Array.from first
            infoToShow+=", debugRoll: " + debugRoll;

            document.querySelector("#info2").innerHTML = infoToShow;
            //document.querySelector("#info2").innerHTML = myDebugStr;
        }
        
        if (guiParams.control.handbrake){
            for (var cc=0;cc<3;cc++){
                airSpdVec[cc]*=0.9;	//TODO time dependence, but this is just to aid debugging (switch thru display options while view static)
            }
        }
        
        //get the current atmospheric density.
        var atmosThick = 0.001*guiParams.display.atmosThickness;	//1st constant just pulled out of the air.
        atmosThick*=Math.pow(2.71, guiParams.display.atmosContrast*(playerPos[0]*playerPos[0] + playerPos[1]*playerPos[1] -0.5)); //as atmosScale increases, scale height decreases


        
        if (guiParams["player model"] == "plane"){
            //TODO resolve issues
            // take into account air velocity due to duocylinder spin
            // Too much lift?
            // odd behaviour when travelling backward

            //lift
            //function of alpha/ pitch angle of attack and airflow.
            //is relevant speed total, or in direction of flight?
            var forwardSpeed = airSpdVec[2];	//sign? what if flying backwards? should take abs?
            var upspeed = airSpdVec[1];	//sign?
            var alpha = Math.atan2(upspeed,forwardSpeed);
            var mappedAlpha = alpha / (1 + 2*alpha*alpha);	//something that's linear around 0, goes to 0 for large values.
            var lift = forwardSpeed * atmosThick * mappedAlpha;

            if (Math.random()*100 < 1){
                //console.log({alpha, mappedAlpha});
            }

            airSpdVec[1] -= 200*lift;
            
            //stabilisation
            //plane tends to point towards direction of flight.
            playerAngVelVec[0] += 1000*lift;

            //function of beta/ turn angle of attack, airflow
            var sidespeed = airSpdVec[0];
            var beta = Math.atan2(sidespeed,forwardSpeed);
            var mappedBeta = beta / (1 + 2*beta*beta);	//?
            var sideLift = forwardSpeed * atmosThick * mappedBeta;	//TODO does this make sense?
            
            airSpdVec[0] -= 50*sideLift;
            playerAngVelVec[1] -= 2000*sideLift;

            //tendency to roll right when turning right (outer wing is faster).
            //this will affect AOA for each wing (and so will reduce outside central linear part of lift curve)
            //but for now, just add some simple force
            var turnSpeed = playerAngVelVec[1];
            playerAngVelVec[2] -= 0.1*atmosThick*turnSpeed;
        }


        
        //want to be able to steer in the air. todo properly - guess maybe wants "lift" from wings, but easiest implementation guess is to increase drag for lateral velocity.
        //would like for both left/right, up/down velocity, but to test, try getting just one - like a aeroplane.
        //TODO better aerodynamic model - would like decent "steerability" without too much slowdown when completely sideways.
        //some tweak for non-isotropic drag. relates to drag coefficients in different directions
        var airSpdScale = [0.1,0.1,1];	//left/right, up/down, forwards/back
        var scaledAirSpdVec = airSpdVec.map((elem,ii)=>elem/airSpdScale[ii]);
        var spdScaled = Math.hypot.apply(null, scaledAirSpdVec);
        
        playerVelVec=scalarvectorprod(1.0-atmosThick*spdScaled,scaledAirSpdVec).map((val,idx) => val*airSpdScale[idx]+spinVelPlayerCoords[idx]);
        


        if (autoFireCountdown>0){
            autoFireCountdown--;
        }else{
            if (keyThing.keystate(71) ||( activeGp && activeGp.buttons[gpSettings.fireButton].value) || (pointerLocked && mouseInfo.buttons&1)){	//G key or joypad button or LMB (pointer locked)
                fireGun();
                autoFireCountdown=autoFireCountdownStartVal;
            }
        }

        var heatEmit = gunHeat/(gunHeat+1.5);	//reuse logic from drawSpaceship
        if (10*Math.random()<heatEmit){
            //smokeGuns();	//TODO independently random smoking guns? blue noise not white noise, smoke from end of gun, ...
        }
        
        //particle stream
        if (guiParams.debug.emitFire){
            if (Math.random()<0.5){
                //making a new matrix is inefficient - expect better if reused a temp matrix, copied it into buffer
                var newm4 = mat4.create(sshipMatrix);
                xyzmove4mat(newm4, [1,1,1].map(elem => sshipModelScale*60*elem*(Math.random()-0.5)));	//square uniform distibution
                new Explosion({matrix:newm4,world:sshipWorld}, sshipModelScale*0.5, [0.2,0.06,0.06]);
            }
        }
        if (guiParams.debug.fireworks){
            if (Math.random()<0.05){
                explosionParticleArrs[0].makeExplosion(random_quaternion(), frameTime, [Math.random(),Math.random(),Math.random(),1],1);	//TODO guarantee bright colour
            }
        }

    }
})()
