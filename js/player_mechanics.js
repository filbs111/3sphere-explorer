var playerMechanics = (() => {

    var playerAngVelVec = [0,0,0];
    var currentThrustInput = [0,0,0];
    var autoFireCountdown=0;
    var currentPen=0;	//for bodgy box collision (todo use collision points array)
	var currentTriangleObjectPlayerPen=0;
    
    var landingLegData=[
                                    //tricycle
        //	{pos:[0,0.006,0.007],suspHeight:0},	//down, forward
        //	{pos:[0.006,0.006,-0.004],suspHeight:0},	//left, down, back a bit
        //	{pos:[-0.006,0.006,-0.004],suspHeight:0},	//right, down, back a bit
            
                                    //add collision balls for other parts of body. TODO size/hardness property, visibility?.
                                    //note that cubeColPen, suspHeight are ~analagous. might be combined, though may affect when one "leg" colliding with both terrain abnd boxes. maybe currentPen should be a vector
            {pos:[0.006,-0.0045,0.003],suspHeight:0,cubeColPen:0},	//top front engine pods
            {pos:[-0.006,-0.0045,0.003],suspHeight:0,cubeColPen:0},
            {pos:[0.006,-0.0045,-0.008],suspHeight:0,cubeColPen:0},	//top back engine pods
            {pos:[-0.006,-0.0045,-0.008],suspHeight:0,cubeColPen:0},
            
            {pos:[0.006,0.0045,0.003],suspHeight:0,cubeColPen:0},	//bottom front engine pods
            {pos:[-0.006,0.0045,0.003],suspHeight:0,cubeColPen:0},
            {pos:[0.006,0.0045,-0.008],suspHeight:0,cubeColPen:0},	//bottom back engine pods
            {pos:[-0.006,0.0045,-0.008],suspHeight:0,cubeColPen:0},
            
        ];

    playerCentreBallData = {pos:[0,0,0],suspHeight:0,cubeColPen:0};


    return {
        update,
        currentThrustInput
    }

    function update(mouseInfo, timeStep, timeStepMultiplier, moveSpeed, rotateSpeed, activeGp){
        
        var playerPos = playerCamera.slice(12);
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
        currentThrustInput.forEach((elem,ii) => currentThrustInput[ii]=elem*thrust);

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
        var spd = Math.hypot.apply(null, airSpdVec);
        
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



        //IIRC playerCamera is the spaceship (or virtual spaceship if "dropped spaceship"), and worldCamera is the actual camera (screen)
        //mat4.set(worldCamera, invertedWorldCamera);		//ensure up to date...
        //mat4.transpose(invertedWorldCamera);
        mat4.set(playerCamera, invertedPlayerCamera);		//using spaceship as sound listener. 
        mat4.transpose(invertedPlayerCamera);
        
        var distanceForTerrainNoise = 100;	//something arbitrarily large
        var panForTerrainNoise = 0;
                    
        //some logic shared with drawing code
        var worldInfo = guiSettingsForWorld[playerContainer.world];
        var dcSpin = worldInfo.spin;


        
        if (worldInfo.duocylinderModel == 'procTerrain'){
            
            //distanceForTerrainNoise = getHeightAboveTerrainFor4VecPos(playerPos);	//TODO actual distance using surface normal (IIRC this is simple vertical height above terrain)

            processTerrainCollisionForBall(playerCentreBallData, settings.playerBallRad, true);
            /*
            for (var legnum=0;legnum<landingLegData.length;legnum++){
                var landingLeg = landingLegData[legnum];
                processTerrainCollisionForBall(landingLeg, 0.001);
            }
            */
            function processTerrainCollisionForBall(landingLeg, ballSize, useForThwop){	//0.005 reasonable ballSize for centre of player model. smaller for landing legs
                var legPosPlayerFrame=landingLeg.pos;
                var suspensionHeight=landingLeg.suspHeight;
                            
                var landingLegMat = mat4.create(playerCamera);
                xyzmove4mat(landingLegMat, legPosPlayerFrame);
                var legPos = landingLegMat.slice(12);	
                
                //simple spring force terrain collision - 
                //lookup height above terrain, subtract some value (height above terrain where restoring force goes to zero - basically maximum extension of landing legs. apply spring force upward to player proportional to this amount.
                var suspensionHeightNow = getHeightAboveTerrainFor4VecPos(legPos, dcSpin);
                
                //get nearest point on terrain. could do this in terrain space, but to be reliable, testable, find nearest 4vec position, find this position in player frame.
                //note this matrix "jiggles" when duocylinder rotating due to interpolation (other test mats that don't jiggle probably are in duocylinder rotating frame space)
                var nearestTerrainPosInfo = getNearestTerrainPosMatFor4VecPos(legPos, dcSpin);
                var nearestPosMat = nearestTerrainPosInfo.mat;
                var nearestPos = nearestPosMat.slice(12);
                
                //find length from this to position in player space.
                var lengthToNearest = Math.hypot.apply(null, nearestPos.map((elem,ii) => elem-legPos[ii]));

                //bodge to get signed distance. TODO more sensible method without if/ternary
                forceSwitch =  nearestTerrainPosInfo.altitude > 0 ? 1 : -1;
                lengthToNearest*=forceSwitch;
                
                myDebugStr = "suspensionHeightNow: " + suspensionHeightNow.toFixed(4) + ", lengthToNearest: " + lengthToNearest.toFixed(4);
                
                suspensionHeightNow = lengthToNearest;	//override suspension height with new distance. improves collision detection (barring glitches if break assumptions - eg might collide with phantom terrain if have abrupt steep wall...) . reaction force will remain upwards with just this change.
                
                
                suspensionHeightNow = Math.max(Math.min(-suspensionHeightNow,0) + ballSize, 0);	//capped
                var suspensionVel = suspensionHeightNow-suspensionHeight;
                var suspensionForce = 20*suspensionHeightNow+ 150*suspensionVel;	
                                                                        //TODO rotational speed impact on velocity									
                suspensionForce=Math.max(suspensionForce,0) * forceSwitch;
                landingLeg.suspHeight = suspensionHeightNow;
                                                    
                //apply force to player, "up" wrt duocylinder
                /*
                for (var cc=0;cc<3;cc++){
                    playerVelVec[cc]+=suspensionForce*radialPlayerCoords[cc];	//radialPlayerCoords will be a bit different for landing legs but assume same since small displacement
                }
                */
                
                //get the position of the closest point in the player frame. really only need to rotate the position vector by player matrix
                var relevantMat = mat4.create();	//just for testing
                mat4.set(landingLegMat, relevantMat);
                mat4.transpose(relevantMat);
                var nearestPosPlayerFrame = [];
                for (var cc=0;cc<3;cc++){
                    nearestPosPlayerFrame[cc]=relevantMat[cc]*nearestPos[0] +  relevantMat[cc+4]*nearestPos[1] +  relevantMat[cc+8]*nearestPos[2] +  relevantMat[cc+12]*nearestPos[3];
                }
                //normalise it 
                var distNearestPointPlayerFrame = Math.hypot.apply(null, nearestPosPlayerFrame);	//this should recalculate existing vec
                myDebugStr += ", distNearestPointPlayerFrame: " + distNearestPointPlayerFrame.toFixed(4);
                
                if (useForThwop){
                    mat4.set(nearestPosMat, debugDraw.mats[5]);	//for visual debugging (TODO display object for each contact)
                
                    distanceForTerrainNoise = distNearestPointPlayerFrame;	//assumes only 1 thing used for thwop
                    var soundSize = 0.002;	//reduced this below noiseRad so get more pan
                    panForTerrainNoise = Math.tanh(nearestPosPlayerFrame[0]/Math.hypot(soundSize,nearestPosPlayerFrame[1],nearestPosPlayerFrame[2]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
                }
                nearestPosPlayerFrame = nearestPosPlayerFrame.map(elem=>elem/distNearestPointPlayerFrame);	//normalise
                var forcePlayerFrame = nearestPosPlayerFrame.map(x=>x*suspensionForce);	//TODO combo with above
                
                for (var cc=0;cc<3;cc++){
                    playerVelVec[cc]+=forcePlayerFrame[cc];
                }
                
                var torquePlayerFrame = [
                                legPosPlayerFrame[1]*forcePlayerFrame[2] - legPosPlayerFrame[2]*forcePlayerFrame[1],
                                legPosPlayerFrame[2]*forcePlayerFrame[0] - legPosPlayerFrame[0]*forcePlayerFrame[2],
                                legPosPlayerFrame[0]*forcePlayerFrame[1] - legPosPlayerFrame[1]*forcePlayerFrame[0]
                                ];
                for (cc=0;cc<3;cc++){
                    playerAngVelVec[cc]-=20000*torquePlayerFrame[cc];	//assumes moment of intertia of sphere/cube/similar
                }
                
                //TODO apply force along ground normal, friction force
            }
        }


        if (worldInfo.seaActive){
            distanceForTerrainNoise = getHeightAboveSeaFor4VecPos(playerPos, lastSeaTime, dcSpin);	//height. todo use distance (unimportant because sea gradient low
        }
        if (Object.keys(voxTerrainData).includes(worldInfo.duocylinderModel)){
            voxTerrainData[worldInfo.duocylinderModel].test2VoxABC(dcSpin);	//updates closestPointTestMat
            
            distanceForVox = distBetween4mats(playerCamera, closestPointTestMat);

            mat4.set(invertedPlayerCamera,tmpRelativeMat);
            mat4.multiply(tmpRelativeMat, closestPointTestMat);
            //distanceForTerrainNoise = distBetween4mats(tmpRelativeMat, identMat);	//should be same as previous result
            
            if (distanceForVox<distanceForTerrainNoise){
                distanceForTerrainNoise = distanceForVox;
                //get terrain noise pan. TODO reuse other pan code (explosions etc)
                
                var soundSize = 0.002;	//reduced this below noiseRad so get more pan
                panForTerrainNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
            }
            //console.log(panForTerrainNoise);
            
            //distanceForVox = 0.02*voxCollisionFunction(playerPos);	//TODO get distance. shouldn't be necessary with SDF. maybe problem is with other terrain funcs. to estimate distance, guess want to divide this by its downhill slope (which for proper SDF should be 1). for now guess some constant that will work ~consistently with other terrain. 
            
            
            //voxel collision. 
            //simple version, just push away from closest point. this will be in "wrong direction" if inside voxel volume, so will fall down if tunnel inside. TODO this better! see notes for function drawBall. TODO damping, friction etc
            
            var signedDistanceForVox = (voxCollisionCentralLevel<0) ? distanceForVox: -distanceForVox;	//this is a bodge. better to use gradient/value, or direction and signed distance, from modified test2VoxABC().
            
            var penetration = settings.playerBallRad - signedDistanceForVox;
            var penetrationChange = penetration - lastVoxPenetration;	//todo cap this.
            lastVoxPenetration = penetration;
            //if (penetration>0){
            var pointDisplacement = tmpRelativeMat.slice(12, 15);	//for small distances, length of this is ~ distanceForVox
            mat4.set(playerCamera, voxCollisionDebugMat);
            xyzmove4mat(voxCollisionDebugMat, pointDisplacement.map(elem => -elem));
            
            if (penetration>0){
                var springConstant = 100;	//simple spring. rebounding force proportional to penetration. //high number = less likely tunneling at high speed.
                var multiplier = penetration*springConstant
                var dampConstant = 200;
                multiplier+=penetrationChange*dampConstant;
                
                multiplier/=signedDistanceForVox;	//normalise. playerBallRad would give near same result assuming penetrations remain small
                
                var forcePlayerFrame = pointDisplacement.map(elem => elem*multiplier);	//TODO use vector class?
                for (var cc=0;cc<3;cc++){
                    playerVelVec[cc]+=forcePlayerFrame[cc];
                    //playerVelVec[cc]*=0.96;	////simple bodge for some friction that does not work because doesnt account for duocylinder spin. 
                        //TODO modify velocity in rotating frame
                }
            }
        }


        	
        //whoosh sound. simple educated guess model for sound of passing by objects. maybe with a some component of pure wind noise
        //volume increase with speed - either generally, or component perpendicular to nearest surface normal
        //volume increases with proximity to obstacles. (can just use 1/r consistent with other sounds)
        //todo use the projected nearest surface point to inform stereo pan
        //todo use atmos thickness
        //todo use correct speed of sound (consistent with elsewhere)
        setSoundHelper(myAudioPlayer.setWhooshSound, distanceForTerrainNoise, panForTerrainNoise, spd);
        

        //apply same forces for other items. 
        //start with just player centre. 
        var gridSqs = getGridSqFor4Pos(playerPos, dcSpin);
        //get transposed playerpos in frame of duocylinder. this is generally useful, maybe should have some func to convert? code copied from bullet collision stuff...
        var playerMatrixTransposed = mat4.create(playerCamera);	//instead of transposing matrices describing possible colliding objects orientation.
                                                            //alternatively might store transposed other objects orientation permanently
        mat4.transpose(playerMatrixTransposed);
        var playerMatrixTransposedDCRefFrame=mat4.create(playerMatrixTransposed);	//in frame of duocylinder
                //not using create, because playerMatrixTransposed is not subsequently used
        rotate4mat(playerMatrixTransposedDCRefFrame, 0, 1, dcSpin);
        
        
        
        currentPen = Math.max(currentPen,0);	//TODO better place for this? box penetration should not be -ve

        closestBoxDist =100; //used for thwop noise. initialise to arbitrarily large. TODO store point so pan sound
        closestBoxInfo={box:-1};
        
        if (guiParams.drawShapes.stonehenge || guiParams.drawShapes.singleBufferStonehenge){
            processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.stonehenge);
        }
        if (guiParams.drawShapes.towers || guiParams.drawShapes.singleBufferTowers){
            processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.towerblocks);
        }
        if (guiParams.drawShapes.roads || guiParams.drawShapes.singleBufferRoads){
            processBoxCollisionsForBoxInfoAllPoints(duocylinderBoxInfo.roads);
        }

        
        processTriangleObjectCollision();	//after boxes to reuse whoosh noise (assume not close to both at same time)

        //whoosh for boxes, using result from closest point calculation done inside collision function
        var distanceForBoxNoise = 100;
        var panForBoxNoise = 0;
        if (closestBoxInfo && closestBoxInfo.box!=-1){	//TODO something better - calc pan/dist in place calculate box dist. then can just initialise to something (large dist, 0 pan), not need if statement here.
        
            mat4.set(playerMatrixTransposedDCRefFrame, tmpRelativeMat);
            mat4.multiply(tmpRelativeMat, closestBoxInfo.box.matrix);
            xyzmove4mat(tmpRelativeMat, closestBoxInfo.surfPoint);
            distanceForBoxNoise = distBetween4mats(tmpRelativeMat, identMat);
        
            var soundSize = 0.002;
            panForBoxNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));
        }
        setSoundHelper(myAudioPlayer.setWhooshSoundBox, distanceForBoxNoise, panForBoxNoise, spd);
        

        
        function processBoxCollisionsForBoxInfoAllPoints(boxInfo){
            processBoxCollisionsForBoxInfo(boxInfo, playerCentreBallData, settings.playerBallRad, true, true);
                    
            for (var legnum=0;legnum<landingLegData.length;legnum++){
            //	processBoxCollisionsForBoxInfo(boxInfo, landingLegData[legnum], 0.001, false);	//disable to debug easier using only playerCentreBallData collision
            }
        }
        
        function processBoxCollisionsForBoxInfo(boxInfo, landingLeg, collisionBallSize, drawDebugStuff, useForThwop){
            var pointOffset = landingLeg.pos.map( elem => -elem);	//why reversed? probably optimisable. TODO untangle signs!
                            
            var relativeMat = mat4.identity();
            var boxArrs = boxInfo.gridContents;
            for (var gs of gridSqs){	//TODO get gridSqs
                var bArray = boxArrs[gs];
                if (bArray){	//occurs if in centre of world. TODO fail earlier in this case (avoid checking inside loop)
                for (var bb of bArray){
                    
                    mat4.identity(relativeMat);
                    xyzmove4mat(relativeMat, pointOffset);	//TODO precalc this matrix and set copy
                    
                    //get player position in frame of bb.matrix
                    
                    //code copied from bullet collision stuff - //boxCollideCheck(bb.matrix,duocylinderSurfaceBoxScale,critValueDCBox, bulletMatrixTransposedDCRefFrame, true); ...				
                    
                    //mat4.set(playerMatrixTransposedDCRefFrame, relativeMat);
                    mat4.multiply(relativeMat, playerMatrixTransposedDCRefFrame);
                    mat4.multiply(relativeMat, bb.matrix);
                
                    //try applying landing leg offset relative to player.
                    //where should the matrix multiplication go? if got the rotation between player and box, should be able to apply leg rotation to that somehow (without need for multiplying player, box matrices independently for each collision point/landing leg
                    //xyzmove4mat(relativeMat, [0,0,0.01]);	//sadly this doesn't work
                
                    //if (relativeMat[15]<boxCritValue){return;}	//early sphere check. TODO get crit value, enable
                
                /*
                    if (Math.max(Math.abs(relativeMat[3]),
                                Math.abs(relativeMat[7]),
                                Math.abs(relativeMat[11]))<duocylinderSurfaceBoxScale*relativeMat[15]){
                        //detonateBullet(bullet, bulletMatrix, moveWithDuocylinder);
                        console.log("COLLIDING");
                    }
                    */
                    //TODO rounded corner collision, show object placed relative to player to indicate direction of collision(treat player as sphere) - this is similar to SDF stuff
                    //from relativeMat stuff can determine both position, and direction of reaction force in frame of object collising with. can then draw something in frame of that object to indicate this. 
                    //then find how to transform into frame of player.
                    //what doing might only work for small boxes. TODO check big (relative to 3sphere)
                    
                    //proposed method (this maybe inefficient/inaccurate but should do ok)
                    //get direction of reaction normal in frame of box
                    //add this to the position of the spaceship in the frame of the box
                    //(project back onto 3sphere - normalise)
                    //get this position in the frame of the player
                    //once working, consider how to make efficient/correct etc
                    
                    var relativePos = [relativeMat[3], relativeMat[7], relativeMat[11], relativeMat[15]];	//need last one?
                    var projectedBoxSize = duocylinderSurfaceBoxScale*relativePos[3];
                    
                    //??possibly want to do projectedPos = relativePos[0-2]/relativePos[3] , cmp with duocylinderSurfaceBoxScale
                    
                    //rounded box. TODO 1st check within bounding box of the rounded box.
                    var vectorFromBox = relativePos.map(elem => elem>0 ? Math.max(elem - projectedBoxSize,0) : Math.min(elem + projectedBoxSize,0));
                    var surfacePoint = vectorFromBox.map((elem,ii)=> elem-relativePos[ii]);
                    var distFromBox = Math.hypot.apply(null, vectorFromBox.slice(0,3));		//todo handle distSqFromBox =0 (centre of collision ball is inside box) - can happen if moving fast, cover collisionBallSize in 1 step. currently results in passing thru box)
                    
                    if (useForThwop && (distFromBox < closestBoxDist)){
                        closestBoxInfo.box=bb;
                        closestBoxInfo.surfPoint=surfacePoint;
                        closestBoxDist = distFromBox;
                    }
                    
                    //if (Math.max(Math.abs(relativePos[0]),
                    //			Math.abs(relativePos[1]),
                    //			Math.abs(relativePos[2]))<projectedBoxSize){
                    if (distFromBox<collisionBallSize && distFromBox>0){
                        
                        //find "penetration"
                        currentPen = collisionBallSize-distFromBox;		//todo handle simultaneous box collisions
                        var penChange = currentPen - landingLeg.cubeColPen;
                        landingLeg.cubeColPen = currentPen;
                        
                        var reactionNormal=vectorFromBox.map(elem => elem/distFromBox);
                        
                        //reaction force proportional to currentPen -> spring force, penChange -> damper
                    //	var reactionForce = Math.max(20*currentPen+150*penChange, 0);	//soft like landing leg. for body collision, increase constants
                        
                        var reactionForce = Math.max(50*currentPen+1000*penChange, 0);	//for body collision, increased constants to prevent tunneling. 
                                                                                        //(TODO redo this system - timesteps should get smaller as get closer, can jump using SDF, maybe should only react to colliding with closest box, etc.
                                                    
                        
                        //position of collisionTestObj3Mat relative to playerMatrixTransposedDCRefFrame
                        //mising up playerCamera, playerMatrixTransposedDCRefFrame here... TODO sort out.
                        var relativeMatC = mat4.create();
                        mat4.set(playerMatrixTransposedDCRefFrame, relativeMatC);
                        
                        //moved one matrix outside if drawdebugstuff because it's required (collisionTestObj3Mat)
                        var tempMat3 = mat4.create();
                        mat4.set(bb.matrix, tempMat3);
                        xyzmove4mat(tempMat3, [-relativePos[0],-relativePos[1],-relativePos[2]]);
                        xyzmove4mat(tempMat3, reactionNormal);
                        mat4.multiply(relativeMatC, tempMat3);
                    
                        var relativePosC = relativeMatC.slice(12);
                        
                        if (drawDebugStuff){
                            //TODO sort out what's what here. chopped around so comments a mess
                            //TODO transparent boxes mode so can see debug stuff more clearly
                            
                            //draw object relative to box to check is at player position (relativePos)
                            //draw another relative to box at relativePos+constant*reactionNormal to check in right direction
                            //then can calc this point in frame of player
                            //todo what is sense of 4vec relativePos, 3vec normal?
                            
                            mat4.set(bb.matrix, debugDraw.mats[0]);
                            mat4.set(bb.matrix, debugDraw.mats[1]);
                            xyzmove4mat(debugDraw.mats[0], [-relativePos[0],-relativePos[1],-relativePos[2]]);
                            
                            //mat4.set(bb.matrix, debugDraw.mats[2]);
                            //xyzmove4mat(debugDraw.mats[2], [-relativePos[0],-relativePos[1],-relativePos[2]]);
                            //xyzmove4mat(debugDraw.mats[2], reactionNormal);
                            mat4.set(tempMat3, debugDraw.mats[2]);		//just set because using outside if (drawDebugStuff)
                            
                            
                            //this might show that should have /relativePos[3] here.
                            
                            //get the position of debugDraw.mats[2] in the frame of the player.
                            //draw something at this position (similar to how draw landing legs)
                            //....
                            
                            //already have relativeMat. position of box relative to player maybe already available
                            var relativePosB = relativeMat.slice(12);
                            mat4.set(playerCamera, debugDraw.mats[3]);
                            xyzmove4mat(debugDraw.mats[3], [-relativePosB[0],-relativePosB[1],-relativePosB[2]]);
                            //TODO account for duocylinder rotation (currently assuming unrotated)
                            
                            mat4.set(bb.matrix, debugDraw.mats[4]);
                            xyzmove4mat(debugDraw.mats[5], surfacePoint);
                        }
                        
                        //apply force in this direction
                        var forcePlayerFrame = relativePosC.map(elem => elem*reactionForce);
                        for (var cc=0;cc<3;cc++){
                            playerVelVec[cc]+=forcePlayerFrame[cc];
                        }
                        
                        //apply torque
                        var legPosPlayerFrame = landingLeg.pos;
                        var torquePlayerFrame = [
                                legPosPlayerFrame[1]*forcePlayerFrame[2] - legPosPlayerFrame[2]*forcePlayerFrame[1],
                                legPosPlayerFrame[2]*forcePlayerFrame[0] - legPosPlayerFrame[0]*forcePlayerFrame[2],
                                legPosPlayerFrame[0]*forcePlayerFrame[1] - legPosPlayerFrame[1]*forcePlayerFrame[0]
                                ];
                        for (cc=0;cc<3;cc++){
                            playerAngVelVec[cc]-=20000*torquePlayerFrame[cc];	//assumes moment of intertia of sphere/cube/similar
                        }
                        
                        
                    }
                    
                }
                }	//end if bArray (defined)
            }
        }

        function processTriangleObjectCollision(){
            var closestRoughSqDistanceFound = Number.POSITIVE_INFINITY;

            processPossibles(bvhObjsForWorld[playerContainer.world].objList);
            

            function processPossibles(possibleObjects){
                if (guiParams.debug.worldBvhCollisionTestPlayer){
                    //find set of candiate objects by their bounding spheres - 
                    //provided each object has something solid within its bounding sphere
                    //any each object has a maximum and minimum possible distance from a given point
                    //the find the minimum maximum distance for all objects.
                    //any object with a minimum distance above this is NOT the closest so can skip testing for.
                    //which in practice is likely to be the bulk of objects. 
                    var objsWithMinMaxDistances = possibleObjects.map(objInfo => {return {
                        objInfo,
                        minMaxDist: minMaxDistanceFromPointToBoundingSphere(playerPos, objInfo.mat.slice(12), objInfo.scale*objInfo.bvh.boundingSphereRadius)
                    }});
                    var maxPossibleDistance = objsWithMinMaxDistances.map(xx=>xx.minMaxDist[1]).reduce((a,b)=>Math.min(a,b), 0.1);
                    possibleObjects = objsWithMinMaxDistances
                        .filter(xx=>xx.minMaxDist[0]<=maxPossibleDistance)
                        .map(xx=>xx.objInfo);
                }

                var bestResult = false;

                possibleObjects.forEach(objInfo =>
                {
                    var transposedObjMat = objInfo.transposedMat;
                    var objBvh = objInfo.bvh;
                    var objScale = objInfo.scale;

                    var playerPosVec = vec4.create(playerPos);
                    mat4.multiplyVec4(transposedObjMat, playerPosVec, playerPosVec);
                    
                    if (playerPosVec[3]<=0.3){
                        return;
                    }						

                    var projectedPosInObjFrame = playerPosVec.slice(0,3).map(val => val/(objScale*playerPosVec[3]));

                    //var closestPointResult = closestPointBvhBruteForce(projectedPosInObjFrame, objBvh);
                    var closestPointResult = closestPointBvhEfficient(projectedPosInObjFrame, objBvh);

                    if (closestPointResult){
                        var closestPointInObjectFrame = closestPointResult.closestPoint;
                        
                        //get distance from player.
                        //TODO return from above, or combine with closestPointBvh / use world level bvh?

                        var vectorToPlayerInObjectSpace = vectorDifference(projectedPosInObjFrame, closestPointInObjectFrame);
                        var roughDistanceSqFromPlayer = dotProduct(vectorToPlayerInObjectSpace,vectorToPlayerInObjectSpace)
                                            *objScale*objScale;	//multiplying by scale with view to using multiple scales

                        if (roughDistanceSqFromPlayer<closestRoughSqDistanceFound){
                            bestResult = {
                                closestPointResult,
                                objInfo
                            }
                            closestRoughSqDistanceFound = roughDistanceSqFromPlayer;
                        }
                    }
                });

                if (bestResult){
                    var closestPointResult= bestResult.closestPointResult;
                    triObjClosestPointType = closestPointResult.closestPointType;

                    var closestPointInObjectFrame = closestPointResult.closestPoint;
                    var positionInProjectedSpace = closestPointInObjectFrame.map(val => val*bestResult.objInfo.scale);
                    var veclen = Math.sqrt(positionInProjectedSpace.reduce((accum, xx)=>accum+xx*xx, 0));
                    var scalarAngleDifference = Math.atan(veclen);

                    var correction = -scalarAngleDifference/veclen;
                    var angleToMove = positionInProjectedSpace.map(val => val*correction);

                    //draw object - position at object centre, then move by vec to point in object space.
                    mat4.set(bestResult.objInfo.mat, debugDraw.mats[8]);
                    xyzmove4mat(debugDraw.mats[8], angleToMove);	//draw x on closest vertex
                }
            }


            //TODO handle possibility that returned early and debugDraw.mats[8] is not set.


            //sound. 
            //TODO efficient distance calculation without matrix mult
            mat4.set(playerMatrixTransposed, tmpRelativeMat);
            mat4.multiply(tmpRelativeMat, debugDraw.mats[8]);
            distanceForNoise = distBetween4mats(tmpRelativeMat, identMat);
            var soundSize = 0.002;
            panForNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));
            
            //note spd (speed) in is in duocylinder frame, but object currently does not rotate with it.
            setSoundHelper(myAudioPlayer.setWhooshSoundTriangleMesh, distanceForNoise, panForNoise, spd);


            //player collision - apply reaction force due to penetration, with some smoothing (like spring/damper)
            //cribbed from collidePlayerWithObjectByClosestPointFunc
            var lastTriangleObjPen = currentTriangleObjectPlayerPen;
            currentTriangleObjectPlayerPen = settings.playerBallRad - distanceForNoise;
            var penChange = currentTriangleObjectPlayerPen - lastTriangleObjPen;
            var reactionForce = Math.max(50*currentTriangleObjectPlayerPen + 1000*penChange, 0);
            
            if (currentTriangleObjectPlayerPen > 0 && reactionForce> 0){
                    //different to collidePlayerWithObjectByClosestPointFunc, which takes places in duocylinder spun space.
                var relativePosC = tmpRelativeMat.slice(12);
                //normalise. note could just assume that length is player radius, or matches existing calculation for penetration etc, to simplify.
                var relativePosCLength = Math.sqrt(1-relativePosC[3]*relativePosC[3]);	//assume matrix SO4
                var relativePosCNormalised = relativePosC.map(x=>x/relativePosCLength);
                var forcePlayerFrame = relativePosCNormalised.map(elem => elem*reactionForce);
                for (var cc=0;cc<3;cc++){
                    playerVelVec[cc]+=forcePlayerFrame[cc];
                }
            }
        }



        rotatePlayer(scalarvectorprod(timeStep * rotateSpeed,playerAngVelVec));
        movePlayer(scalarvectorprod(timeStep * moveSpeed,playerVelVec));
        
        //TODO apply duocylinder spin inside loop here. 
    
        
        var thrustVolume = Math.tanh(40*Math.hypot.apply(null, currentThrustInput));	//todo jet noise. take speed, atmos thickness into account. should be loud when going fast but not thrusting, pitch shift
        myAudioPlayer.setJetSound({delay:0, gain:thrustVolume, pan:0});

    }
})()
