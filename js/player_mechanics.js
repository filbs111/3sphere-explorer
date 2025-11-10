var mostRecentInfo={};
var chullCollisionScreenInfo = "";
var chullCollisionScreenInfo2 = "";
var savedSpinVelPlayerCoordsForHud = [0,0,0];

var playerMechanics = (() => {

    var playerAngVelVec = [0,0,0];
    var currentThrustInput = [0,0,0];
    var autoFireCountdown=0;
	var currentTriangleObjectPlayerPen=0;
    var foundClosestPointTriangleObj=false;
    var currentTriangleObjectPlayerPen2=0;
    var foundClosestPointTriangleObj2=false;

    return {
        update,
        currentThrustInput
    }

    function update(mouseInfo, timeStep, timeStepMultiplier, moveSpeed, rotateSpeed, activeGp){
        
        debugDraw.removeExtraMarkers();

        var playerPos = playerCamera.slice(12);
        var playerWorldSettings = guiSettingsForWorld[playerContainer.world];

        var thrust = 0.00025*timeStep*(guiParams.control.handbrake?0.1:1);	//TODO make keyboard/gamepad fair! currently thrust, moveSpeed config independent!
        var angVelDampMultiplier=Math.pow(0.85, timeStep/10);
        var duoCylinderAngVelConst = playerWorldSettings.spinRate;
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
        currentThrustInput[1]=-keyThing.keystate(87)+keyThing.keystate(83);	//vertical W,S = up, down
        currentThrustInput[2]=keyThing.keystate(32)-keyThing.keystate(220);	//logtitudinal. space. \ = forward, back

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

        savedSpinVelPlayerCoordsForHud = spinVelPlayerCoords; //bodge global so can use when drawing HUD

        //spd = Math.sqrt(airSpdVec.map(val => val*val).reduce((val, sum) => val+sum));
        var spd = Math.hypot.apply(null, airSpdVec);
        

        //for camera view. 
        //show a mark intermediate between flight dir and forward pointing dir. TODO tilt camera in this direction.
		//want to avoid snapping from side to side when switch from backwards-left to backwards0right travel etc.
		//simpleish solution something like stereographic direction. put a point on circle in flight direction, centre circle 1 unit ahead, make radius 
		// of circle tend to 1 for high speed.
        var airSpdSq = spd*spd;
		var tiltCameraCircleRad = airSpdSq / (0.1+airSpdSq);	//something that goes 1 1 as airSpdSq=>inf. other number is some speed approx below which circle small
		var tiltCameraDirection = airSpdVec.map(xx=>tiltCameraCircleRad*xx/spd);
		tiltCameraDirection[2]+=1;	//z coord?		

		//TODO check this - is it correct for larger angles? - perhaps doesn't matter - direction wanted is only approximate.
		cameraTilt = [ Math.atan(-tiltCameraDirection[1]), Math.atan(tiltCameraDirection[0]), 0]; //pitch, yaw, roll
		//cameraTilt = [ Math.atan2(-tiltCameraDirection[1],tiltCameraDirection[2]), Math.atan2(tiltCameraDirection[0],tiltCameraDirection[2]), 0]; //pitch, yaw, roll
				//expected atan2 to work better, but prefer just atan (afaik atan(x) = atan2(x,1))

        //add accumulated camera rotation lag
        for (var cc=0;cc<3;cc++){
            cameraTilt[cc]-=accumulatedPlayerCameraLag[cc];
        }

        //print speed
        if (guiParams.debug.showSpeedOverlay){
            var infoToShow ="";
            var speed = Math.hypot.apply(null, airSpdVec);
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
        var atmosThick = 0.001*playerWorldSettings.atmosThickness;	//1st constant just pulled out of the air.
        atmosThick*=Math.pow(2.71, playerWorldSettings.atmosContrast*(playerPos[0]*playerPos[0] + playerPos[1]*playerPos[1] -0.5)); //as atmosScale increases, scale height decreases


        
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
        
        var terrainAudio = {
            distance: 100,   //something arbitrarily large
            pan:0
        };
                    
        //some logic shared with drawing code
        var worldInfo = guiSettingsForWorld[playerContainer.world];
        var dcSpin = worldInfo.spin;



        if (worldInfo.seaActive){
            terrainAudio.distance = getHeightAboveSeaFor4VecPos(playerPos, dcSpin, lastSeaTime);	//height. todo use distance (unimportant because sea gradient low
        }


        function processVoxCollision(terrainAudio){
            voxTerrainData[worldInfo.duocylinderModel].test2VoxABC(dcSpin);	//updates closestPointTestMat
            
            distanceForVox = distBetween4mats(playerCamera, closestPointTestMat);

            mat4.set(invertedPlayerCamera,tmpRelativeMat);
            mat4.multiply(tmpRelativeMat, closestPointTestMat);
            //distanceForTerrainNoise = distBetween4mats(tmpRelativeMat, identMat);	//should be same as previous result
            
            
            //voxel collision. 
            //simple version, just push away from closest point. this will be in "wrong direction" if inside voxel volume, so will fall down if tunnel inside. TODO this better! see notes for function drawBall. TODO damping, friction etc
            
            var signedDistanceForVox = (voxCollisionCentralLevel<0) ? distanceForVox: -distanceForVox;	//this is a bodge. better to use gradient/value, or direction and signed distance, from modified test2VoxABC().
            
            var penetration = settings.playerBallRad - signedDistanceForVox;
            var penetrationChange = penetration - lastVoxPenetration;	//todo cap this.
            lastVoxPenetration = penetration;
            
            var pointDisplacement = tmpRelativeMat.slice(12, 15);	//for small distances, length of this is ~ distanceForVox

            if (terrainAudio){
                if (distanceForVox<terrainAudio.distance){
                    terrainAudio.distance = distanceForVox;
                    var soundSize = 0.002;	//reduced this below noiseRad so get more pan
                    terrainAudio.pan = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));	//tanh(left/hypot(size,down,forwards)). tanh smoothly limits to +/- 1
                }

                //piggyback on this to only do 1 debug mat update per timestep (not for substeps)
                mat4.set(playerCamera, voxCollisionDebugMat);
                xyzmove4mat(voxCollisionDebugMat, pointDisplacement.map(elem => -elem));
            }

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
        

        //apply same forces for other items. 
        //start with just player centre. 
        //get transposed playerpos in frame of duocylinder. this is generally useful, maybe should have some func to convert? code copied from bullet collision stuff...
        var playerMatrixTransposed = mat4.create(playerCamera);	//instead of transposing matrices describing possible colliding objects orientation.
                                                            //alternatively might store transposed other objects orientation permanently
        mat4.transpose(playerMatrixTransposed);
        var playerMatrixTransposedDCRefFrame=mat4.create(playerMatrixTransposed);	//in frame of duocylinder
                //not using create, because playerMatrixTransposed is not subsequently used
        rotate4mat(playerMatrixTransposedDCRefFrame, 0, 1, dcSpin);
        
        

        //simply use smaller timesteps for player - triangle soup collision.
        //this reduces chance of failing to detect collision, but can still break if fast enough. increasing numSubsteps runs
        //causes performance issues, obvious in 600-cell world.
        //TODO improve. ideas:
        // 1) dedicated fast method for sphere overlap rather than use general find closest point on object. (still use closest point
        // method for audio, debug markers, but do less frequently.)
        // 2) do the broad phase world bvh less frequently, but do the sphere vs triangles in individual objects more frequently (substeps)
        // 3) continuous collision (swept sphere)

        processTriangleObjectCollisionSlow();   //updates debug point, audio from flying past objects

        var speed = Math.sqrt(playerVelVec.reduce((accum, current) => accum+current*current,0));
        var numSubsteps = 5+ Math.floor(speed / 0.1);
            //TODO inside substep loop/ using a while loop, ensure don't keep making many steps once collide and slow down
            //TODO take step size into account for spring/damper style collision? (expect more substeps = stiff)
        //console.log({playerVelVec, speed, numSubsteps});

        var subTimeStep = timeStep/numSubsteps;

        var terrainCollisionFunc = x=>x;
        if (Object.keys(voxTerrainData).includes(worldInfo.duocylinderModel)){
            terrainCollisionFunc = processVoxCollision;
        }

        for (var ii=0;ii<numSubsteps;ii++){
            var timestepFraction = ii/numSubsteps;

            //TODO update variables to do with duocylinder between substeps? 
            terrainCollisionFunc(ii==0 ? terrainAudio : false);

            processTriangleObjectCollisionFast(timestepFraction);   //collision detection
            processTriangleTerrainCollisionFast(timestepFraction);  //for terrain objects using 4d tris

            rotatePlayer(scalarvectorprod(subTimeStep * rotateSpeed,playerAngVelVec));
            movePlayer(scalarvectorprod(subTimeStep * moveSpeed,playerVelVec));

            //update things used in triangle collision code
            playerPos = playerCamera.slice(12);
            mat4.set(playerCamera, playerMatrixTransposed);
            mat4.transpose(playerMatrixTransposed);
        }

        for (var ii=0;ii<3;ii++){
			dustMotesInfo.accumulatedScroll[ii]+=timeStep*moveSpeed*playerVelVec[ii]/dustMotesInfo.scale;
		}



        //whoosh sound. simple educated guess model for sound of passing by objects. maybe with a some component of pure wind noise
        //volume increase with speed - either generally, or component perpendicular to nearest surface normal
        //volume increases with proximity to obstacles. (can just use 1/r consistent with other sounds)
        //todo use the projected nearest surface point to inform stereo pan
        //todo use atmos thickness
        //todo use correct speed of sound (consistent with elsewhere)
        setSoundHelper(myAudioPlayer.setWhooshSound, terrainAudio.distance, terrainAudio.pan, spd);

        
        var thrustVolume = Math.tanh(40*Math.hypot.apply(null, currentThrustInput));	//todo jet noise. take speed, atmos thickness into account. should be loud when going fast but not thrusting, pitch shift
        myAudioPlayer.setJetSound({delay:0, gain:thrustVolume, pan:0});

        
        function processTriangleObjectCollisionFast(timestepFraction){

            if (guiParams.debug.drawPlayerPosMarkers){
                debugDraw.addTestPoint(playerContainer.matrix, colorArrs.white);
            }

            var worldBvhObj = bvhObjsForWorld[playerContainer.world];

            var wSettings = guiSettingsForWorld[playerContainer.world];
            var dcSpin = wSettings.spin * timestepFraction + (1-timestepFraction)*wSettings.spinOld;

            var rotatedRefMat = mat4.identity();
            rotate4mat(rotatedRefMat, 0, 1, dcSpin);

            var playerPosInRotatedFrame = new Array(4).fill(0);
            for (var ii=0;ii<4;ii++){
                for(var jj=0;jj<4;jj++){
                    playerPosInRotatedFrame[ii]+=playerPos[jj]*rotatedRefMat[4*ii+jj];
                }
            }

            var initialCandidates = guiParams.debug.worldBvhCollisionTestPlayer ? getFastPossibles(playerPosInRotatedFrame):worldBvhObj.objList;
            

            if (guiParams["player model"] == "convexHullTest"){

                var hackObjInfoArr = initialCandidates.map(objInfo => {
                    //var mat = mat4.create(objInfo.mat);
                    //rotate4mat(mat, 0, 1, dcSpin);  //this works for terrain objects, but not here! perhaps terrain object orientation just happens to 
                        //work with this instruction...
                    
                    var mat = mat4.create(rotatedRefMat);
                    mat4.multiply(mat, objInfo.mat);
                    

                    var transposedMat = mat4.create(mat);
                    mat4.transpose(transposedMat);
                    return {
                        mat,
                        transposedMat,
                        collisionTriangleData: objInfo.bvh.triCollisionData4dBvh[objInfo.scale],
                    }
                });

                var chullResult = processTrianglePossiblesForConvexHull(hackObjInfoArr);
                //NOTE this is very slow for some objects. perhaps num triangles processed excessive.
                //see that callback passed into processTrianglePossibles below is quite complex, different to terrain collision code. 
                // perhaps should pass similar cb to processTrianglePossiblesForConvexHull

                chullCollisionScreenInfo2= ["-","V","E","F","FE"][chullResult.chosenChullCollisionPointType+1] + 
                " (" + chullResult.possiblyCollidingTrisCount + "/" + chullResult.nearbyCount + ")" + 
                "(" + chullResult.notCollidingDueToObjTriFaceCheckCount + "," + chullResult.notCollidingDueToObjTriEdgeFaceCheckCount + 
                "," + chullResult.notCollidingDueToPlayerFaceCheckCount + "," + chullResult.notCollidingDueToEdgeEdgeCount + ")" + 
                "PEN: " + Math.floor(1_000_000*chullResult.greatestPenetrationFound);

                return;
            }

            var resultMat = mat4.create();
            var foundClosestPointTriangleObjPreviously = foundClosestPointTriangleObj; 
            foundClosestPointTriangleObj = processTrianglePossibles(resultMat, initialCandidates, 0.05, (posInObjFrame, objScale, rad, objInfo, greatestAcceptedDistance) => {
                
                if (posInObjFrame[3]<=0.3){
                    return;
                }
                var projectedPosInObjFrame = posInObjFrame.slice(0,3).map(val => val/(objScale*posInObjFrame[3]));
                
                specialCollisionInfo = {};

                var nearby = closestPointBvhAABBIntialCheck(posInObjFrame, rad, objInfo);

                if (guiParams.debug.useInitialCheckPossibles){
                    //return nearby.length>0 ? closestPointForTris4dWithLookup(posInObjFrame, objInfo, nearby) : false;

                    //filter using minmax logic. TODO take 4d into account properly (currently this is in object space, so could rule out true closest tri)
                    var minMaxVals = nearby.map(item => aabbMinMaxDistanceFromPoint(projectedPosInObjFrame, item.AABB));
                        
                    var lowestMax = minMaxVals.map(xx => xx[1]).reduce((accum, yy) => Math.min(accum, yy), Infinity);

                    var nearbyFiltered = nearby.filter(
                        (_, ii) =>
                        minMaxVals[ii][0]<lowestMax
                    );

                    specialCollisionInfo.nearbyFilteredLen = nearbyFiltered.length;



                    // var minMaxVals2 = nearby.map(item => aabbMinMaxDistanceFromPoint(posInObjFrame, aabb4dFrom3D(item.AABB, objInfo.scale)));
                    //     //TODO precalc 4d aabbs for scale. also could be tighter than 4d AABB from the 3d AABB
                    //     //TODO don't get min val if not used to filter

                    // var lowestMax2 = minMaxVals2.map(xx => xx[1]).reduce((accum, yy) => Math.min(accum, yy), Infinity);

                    // var nearbyFiltered2 = nearby.filter(
                    //     (_, ii) =>
                    //     minMaxVals2[ii][0]<lowestMax2
                    // );

                    // specialCollisionInfo.nearbyFilteredLen2 = nearbyFiltered2.length;

                    // if (nearbyFiltered2.length!=nearbyFiltered.length){
                    //     console.log({
                    //         nearbyFiltered,
                    //         nearbyFiltered2
                    //     })
                    // }

                    return nearbyFiltered.length>0 ? closestPointForTris4dWithLookup(posInObjFrame, objInfo.bvh.triCollisionData4d[objInfo.scale], nearbyFiltered) : false;

                }else{
                    return nearby.length>0 ? closestPointBvhEfficient(projectedPosInObjFrame, posInObjFrame, objInfo, greatestAcceptedDistance): false;
                }
            });

            // draw debug points for nearby collision tests. note this inefficient! (makes matrices)
            if (guiParams.debug.closestPointNearby){
                if (triObjClosestPointType!=-1){
                    mat4.set(playerMatrixTransposed, tmpRelativeMat);
                    mat4.multiply(tmpRelativeMat, resultMat);
                    new Explosion({matrix:mat4.create(resultMat),world:playerContainer.world}, sshipModelScale*0.05, [[1,0,0],[0,1,0],[0,0,1]][triObjClosestPointType]);
                }
            }

            function getFastPossibles(playerPosInRotatedFrame){

                var paddedRad = settings.playerBallRadPadded;
                    //add padding so detect distance to object before collide (rate of penetration used for damping)

                var playerAABB = aabb4DForSphere(playerPosInRotatedFrame, paddedRad);
                //var possiblities = worldBvhObj.grids4d ?Array.from(gridSystem4d.getGridItemsForAABB(worldBvhObj.grids4d, playerAABB)): [];
                var possiblities = worldBvhObj.grids4dPadded ?Array.from(gridSystem4d.getGridItemsForAABB(worldBvhObj.grids4dPadded, playerAABB)): [];
                    //player rad AFAIK less than padding so should work

                //sphere filter (currently typically returns more candidates than slow version)
                var testSphere = {
                    position: playerPosInRotatedFrame,
                    cosAng:Math.cos(paddedRad),
                    sinAng:Math.sin(paddedRad)
                };  //TODO precalculate
                possiblities = possiblities.filter(objInfo => 
                    collisionTestSimpleSpheres2(testSphere,
                        {
                            cosAng: objInfo.cosAng,
                            sinAng: objInfo.sinAng,
                            position: objInfo.mat.slice(12) //store as dedicated field on objInfo?
                        }));
                return possiblities;
            }

            //TODO efficient distance calculation without matrix mult
            mat4.set(playerMatrixTransposed, tmpRelativeMat);
            mat4.multiply(tmpRelativeMat, resultMat);   //TODO just slice matrix then do 4vec mult (not matxmat mult)

            var relativePosC = tmpRelativeMat.slice(12);
            var relativePosCLength = Math.sqrt(relativePosC[0]*relativePosC[0]+relativePosC[1]*relativePosC[1]+relativePosC[2]*relativePosC[2]);

            //stick on debug object to investigate
            closestPointInfo.triObjCloPoinTyp = triObjClosestPointType;
            closestPointInfo.distFromCloPoin = relativePosCLength;
            closestPointInfo.foundCloPoinTriObj = foundClosestPointTriangleObj;
            closestPointInfo.triObjCloPoTyp = triObjClosestPointType;

            //player collision - apply reaction force due to penetration, with some smoothing (like spring/damper)
            //cribbed from collidePlayerWithObjectByClosestPointFunc
            var lastTriangleObjPen = currentTriangleObjectPlayerPen;
            currentTriangleObjectPlayerPen = settings.playerBallRad - relativePosCLength;

            closestPointInfo.currentTriangleObjectPlayerPen = currentTriangleObjectPlayerPen;

            if (foundClosestPointTriangleObj && foundClosestPointTriangleObjPreviously){
                //if volume checked has some padding so can detect closest point before collide with object this shouldn't 
                //be necessary. appears to be necessary for lucy collisions! ??

                var penChange = currentTriangleObjectPlayerPen - lastTriangleObjPen;
                var reactionForce = Math.max(100*currentTriangleObjectPlayerPen + 1000*penChange, 0);
                
                if (currentTriangleObjectPlayerPen > 0 && reactionForce> 0){

                    var relativePosCNormalised = relativePosC.map(x=>x/relativePosCLength);
                    var forcePlayerFrame = relativePosCNormalised.map(elem => elem*reactionForce);

                    for (var cc=0;cc<3;cc++){
                        playerVelVec[cc]+=forcePlayerFrame[cc];
                    }
                }
            }
        }


        //very similar to above. TODO deduplicate
        function processTriangleTerrainCollisionFast(timestepFraction){
            var wSettings = guiSettingsForWorld[playerContainer.world];
            var dcInfo = duocylinderObjects[wSettings.duocylinderModel];

            if (!(dcInfo?.data)){
                return;
            }

            var dcSpin = wSettings.spin * timestepFraction + (1-timestepFraction)*wSettings.spinOld;

            //inefficient but readable way to spin many objects by same amount
            var spunObjInfoArr = dcInfo.objInfoArr.map(objInfo => {
                var mat = mat4.create(objInfo.mat);
                rotate4mat(mat, 0, 1, dcSpin);
                var transposedMat = mat4.create(mat);
                mat4.transpose(transposedMat);
                return {
                    mat,
                    transposedMat,
                    collisionTriangleData: objInfo.collisionTriangleData,
                }
            });


            if (guiParams["player model"] == "convexHullTest"){
                var chullResult = processTrianglePossiblesForConvexHull(spunObjInfoArr);
                chullCollisionScreenInfo= ["-","V","E","F","FE"][chullResult.chosenChullCollisionPointType+1] + 
                " (" + chullResult.possiblyCollidingTrisCount + "/" + chullResult.nearbyCount + ")" + 
                "(" + chullResult.notCollidingDueToObjTriFaceCheckCount + "," + chullResult.notCollidingDueToObjTriEdgeFaceCheckCount + 
                "," + chullResult.notCollidingDueToPlayerFaceCheckCount + "," + chullResult.notCollidingDueToEdgeEdgeCount + ")" + 
                "PEN: " + Math.floor(1_000_000*chullResult.greatestPenetrationFound);
                //console.log(chullCollisionScreenInfo, chullResult);
                return;
            }

            var resultMat = mat4.create();
            var foundClosestPointTriangleObjPreviously2 = foundClosestPointTriangleObj2;
            foundClosestPointTriangleObj2 = processTrianglePossibles(resultMat, spunObjInfoArr, 0.05, (posInObjFrame, objScale, rad, objInfo, lowestAcceptedMultiplier) => {
                
                var queryAABB = [-1,1].map(ss=>ss*settings.playerBallRadPadded).map(offs => posInObjFrame.map(xx => xx+offs));
                    // could use aabb4DForSphere() but maybe too slow.

                var nearby = collisionTestBvh4d(queryAABB, objInfo.collisionTriangleData);
                
                if (nearby.length<1){return false;} 
                
                var detailedTriCollisionData = nearby.map(pp => objInfo.collisionTriangleData.cache.getTriDataForFace(pp.faceIdx));
                var closestPoint = closestPointForTris4d(posInObjFrame, detailedTriCollisionData);

                return closestPoint;    //TODO augment with penetration, normal
            });

            // draw debug points for nearby collision tests. note this inefficient! (makes matrices)
            if (guiParams.debug.closestPointNearby){
                if (triObjClosestPointType!=-1){
                    mat4.set(playerMatrixTransposed, tmpRelativeMat);
                    mat4.multiply(tmpRelativeMat, resultMat);
                    new Explosion({matrix:mat4.create(resultMat),world:playerContainer.world}, sshipModelScale*0.05, [[1,0,0],[0,1,0],[0,0,1]][triObjClosestPointType]);
                }
            }

            //TODO efficient distance calculation without matrix mult
            mat4.set(playerMatrixTransposed, tmpRelativeMat);
            mat4.multiply(tmpRelativeMat, resultMat);

            var relativePosC = tmpRelativeMat.slice(12);
            var relativePosCLength = Math.sqrt(relativePosC[0]*relativePosC[0]+relativePosC[1]*relativePosC[1]+relativePosC[2]*relativePosC[2]);
                //note this is not exact distance between mat and ident mat - w values differ (ident 1, tmpRelativeMat slightly less than 1)

            //player collision - apply reaction force due to penetration, with some smoothing (like spring/damper)
            //cribbed from collidePlayerWithObjectByClosestPointFunc
            var lastTriangleObjPen2 = currentTriangleObjectPlayerPen2;
            currentTriangleObjectPlayerPen2 = settings.playerBallRad - relativePosCLength;

             //stick on debug object to investigate
            closestPointInfo.terrainCollisionInfo = {
                triObjClosestPointType,
                relativePosCLength,
                foundClosestPointTriangleObj2,
                currentTriangleObjectPlayerPen2
            }

            if (guiParams.debug.logCollisionInfo){
                closestPointInfoArr.push(closestPointInfo);
                closestPointInfo = {};
            }

            if (foundClosestPointTriangleObj2 && foundClosestPointTriangleObjPreviously2){

                //if volume checked has some padding so can detect closest point before collide with object this shouldn't 
                //be necessary. appears to be necessary for lucy collisions! ??

                var penChange = currentTriangleObjectPlayerPen2 - lastTriangleObjPen2;
                var reactionForce = Math.max(100*currentTriangleObjectPlayerPen2 + 1000*penChange, 0);
                
                if (currentTriangleObjectPlayerPen2 > 0 && reactionForce> 0){

                    var relativePosCNormalised = relativePosC.map(x=>x/relativePosCLength);
                    var forcePlayerFrame = relativePosCNormalised.map(elem => elem*reactionForce);

                    for (var cc=0;cc<3;cc++){
                        playerVelVec[cc]+=forcePlayerFrame[cc];
                    }
                }
            }
        }

        
        function processTriangleObjectCollisionSlow(){

            if (guiParams.debug.drawPlayerPosMarkers){
                debugDraw.addTestPoint(playerContainer.matrix, colorArrs.gray);
            }

            var worldBvhObj = bvhObjsForWorld[playerContainer.world];
            var worldSettings = guiSettingsForWorld[playerContainer.world];

            var rotatedRefMat = mat4.identity();
            rotate4mat(rotatedRefMat, 0, 1, worldSettings.spin);

            var playerPosInRotatedFrame = new Array(4).fill(0);
            for (var ii=0;ii<4;ii++){
                for(var jj=0;jj<4;jj++){
                    playerPosInRotatedFrame[ii]+=playerPos[jj]*rotatedRefMat[4*ii+jj];
                }
            }

            var initialCandidates = guiParams.debug.worldBvhCollisionTestPlayer ? getSlowPossibles(worldBvhObj.objList, playerPosInRotatedFrame):worldBvhObj.objList;

            
            //rotate objects. NOTE maybe better to just adjust moving object array into frame of objects.
            //TODO deduplicate objInfoArr terrain collision with other large object collision
            var hackObjInfoArr = initialCandidates.map(objInfo => {

                var copiedObject = Object.assign({},objInfo);
                    
                var mat = mat4.create(rotatedRefMat);
                mat4.multiply(mat, objInfo.mat);

                var transposedMat = mat4.create(mat);
                mat4.transpose(transposedMat);
                
                Object.assign(copiedObject,{
                    mat,
                    transposedMat});

                return copiedObject;
            });


            var resultMat = mat4.create();
            
            foundClosestPointTriangleObj = processTrianglePossibles(resultMat, hackObjInfoArr, 0.2, (posInObjFrame, objScale, rad, objInfo, greatestAcceptedDistance) => {
            
                if (posInObjFrame[3]<=0.3){
                    return;
                }
                var projectedPosInObjFrame = posInObjFrame.slice(0,3).map(val => val/(objScale*posInObjFrame[3]));
            
                return closestPointBvhEfficient(projectedPosInObjFrame, posInObjFrame, objInfo, greatestAcceptedDistance);
            });

            //do triangle collision for 4d terrain objects.
            //TODO deduplicate with regular projected 3d triangle objects.
            //TODO what should initialcandidates be?
            var dcInfo = duocylinderObjects[worldSettings.duocylinderModel];
            if (dcInfo?.data){
                var terrainCollisionResultMat = mat4.identity();

                var startProcessTrianglePossiblesTime=performance.now();
                closestPointInfo.terrainProcessingTimes = [];

                //rotate objects. NOTE maybe better to just adjust moving object array into frame of objects.
                //TODO deduplicate objInfoArr terrain collision with other large object collision
                var hackObjInfoArr = dcInfo.objInfoArr.map(objInfo => {
                    var mat = mat4.create(objInfo.mat);
                    rotate4mat(mat, 0, 1, worldSettings.spin);
                    var transposedMat = mat4.create(mat);
                    mat4.transpose(transposedMat);
                    return {
                        mat,
                        transposedMat,
                        collisionTriangleData: objInfo.collisionTriangleData,
                    }
                });

                processTrianglePossibles(terrainCollisionResultMat, hackObjInfoArr, 0.2,
                        //lowestAcceptedMultiplier - rules out distant aabbs quicker to improve perf
                        // surprised this can't be smaller!
                    (posInObjFrame, objScaleUnused, rad, objInfo, greatestAcceptedDistance) => {
                        return closestPointBvhEfficient4d(posInObjFrame, objInfo, greatestAcceptedDistance);
                    });

                //sound. 
                //TODO efficient distance calculation without matrix mult
                //TODO deduplicate (also used for reguar tri mesh collision)
                mat4.set(playerMatrixTransposed, tmpRelativeMat);
                mat4.multiply(tmpRelativeMat, terrainCollisionResultMat);
                distanceForNoise = distBetween4mats(tmpRelativeMat, identMat);

                var soundSize = 0.002;
                panForNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));
                //note spd (speed) in is in duocylinder frame, but object currently does not rotate with it.
                setSoundHelper(myAudioPlayer.setWhooshSoundTriangleMesh2, distanceForNoise, panForNoise, spd);

                mat4.set(terrainCollisionResultMat, debugDraw.mats[9]);
            }
            

            function getSlowPossibles(possibleObjects, playerPosInRotatedFrame){
                //find set of candiate objects by their bounding spheres - 
                //provided each object has something solid within its bounding sphere
                //any each object has a maximum and minimum possible distance from a given point
                //the find the minimum maximum distance for all objects.
                //any object with a minimum distance above this is NOT the closest so can skip testing for.
                //which in practice is likely to be the bulk of objects. 
                var objsWithMinMaxDistances = possibleObjects.map(objInfo => {return {
                    objInfo,
                    minMaxDist: minMaxDistanceFromPointToBoundingSphere(playerPosInRotatedFrame, objInfo.mat.slice(12), objInfo.scale*objInfo.bvh.boundingSphereRadius)
                }});
                var maxPossibleDistance = objsWithMinMaxDistances.map(xx=>xx.minMaxDist[1]).reduce((a,b)=>Math.min(a,b), 0.1);
                return objsWithMinMaxDistances
                    .filter(xx=>xx.minMaxDist[0]<=maxPossibleDistance)
                    .map(xx=>xx.objInfo);
            }

            //sound. 
            //TODO efficient distance calculation without matrix mult
            mat4.set(playerMatrixTransposed, tmpRelativeMat);
            mat4.multiply(tmpRelativeMat, resultMat);
            distanceForNoise = distBetween4mats(tmpRelativeMat, identMat);

            var soundSize = 0.002;
            panForNoise = Math.tanh(tmpRelativeMat[12]/Math.hypot(soundSize,tmpRelativeMat[13],tmpRelativeMat[14]));
            //note spd (speed) in is in duocylinder frame, but object currently does not rotate with it.
            setSoundHelper(myAudioPlayer.setWhooshSoundTriangleMesh, distanceForNoise, panForNoise, spd);
            //draw object - position at object centre, then move by vec to point in object space.
            mat4.set(resultMat, debugDraw.mats[8]);
        }


        function processTrianglePossibles(resultMat, possibleObjects, greatestAcceptedDistance, closestPointFunc){
            var closestRoughSqDistanceFound = Infinity;
            var bestResult = false;

            possibleObjects.forEach(objInfo =>
            {
                var transposedObjMat = objInfo.transposedMat;
                var objScale = objInfo.scale;

                var playerPosVec = vec4.create(playerPos);
                mat4.multiplyVec4(transposedObjMat, playerPosVec, playerPosVec);
                
                //here to work properly for 4d, the closestpoint func should be scale aware.
                var closestPointResult = closestPointFunc(playerPosVec, objScale, settings.playerBallRadPadded, objInfo, greatestAcceptedDistance);

                if (closestPointResult){
                    var closestPointInObjectFrame = closestPointResult.closestPoint;
                    
                    //get distance from player.
                    //TODO return from above, or combine with closestPointBvh / use world level bvh?

                    var vectorToPlayerInObjectSpace = vectorDifference4d(playerPosVec, closestPointInObjectFrame);
                    var roughDistanceSqFromPlayer = dotProduct4(vectorToPlayerInObjectSpace,vectorToPlayerInObjectSpace);
                    //TODO what is correct distance to use here?

                    if (roughDistanceSqFromPlayer<closestRoughSqDistanceFound){
                        bestResult = {
                            closestPointResult,
                            objInfo
                        }
                        closestRoughSqDistanceFound = roughDistanceSqFromPlayer;

                        closestPointInfo.closestRoughDist = Math.sqrt(closestRoughSqDistanceFound);
                    }
                }
            });

            closestPointInfo.bestResult = bestResult;
            

            if (!bestResult){
                return false;
            }

            var closestPointResult= bestResult.closestPointResult;
            triObjClosestPointType = closestPointResult.closestPointType;


            //this is a dumb, overcomplicated way to deliver collision point info back to the calling function 
            // retained for now for consistency with previous code, side effect of placing the debug point

            //convert to projected space to avoid modifying more code here.
            var closestPointInObjectFrame = closestPointResult.closestPoint;
            var positionXyz = closestPointInObjectFrame.slice(0,3);

            var veclenXyz = Math.sqrt(positionXyz.reduce((accum, xx)=>accum+xx*xx, 0));
            var scalarAngleDifference = Math.atan2(veclenXyz, closestPointInObjectFrame[3]);

            var correction = -scalarAngleDifference/veclenXyz;
            var angleToMove = positionXyz.map(val => val*correction);

            mat4.set(bestResult.objInfo.mat, resultMat);
            xyzmove4mat(resultMat, angleToMove);	//draw x on closest vertex

            return true;
        }

        function processTrianglePossiblesForConvexHull(possibleObjects){
            //processTrianglePossibles is for player simple sphere.
            //this should work for player convex hull shape. 
            //later may wish to generalise so sphere collision also uses this code - perhaps describe as a single point, allow expanded/rounded convex hull
            
            var greatestPenetrationFound = -Infinity;
            var chosenChullCollisionPointType = -1;
            var collisionPointResult;

            var nearbyCount = 0;
            var possiblyCollidingTrisCount = 0;
            var notCollidingDueToObjTriFaceCheckCount =0;
            var notCollidingDueToObjTriEdgeFaceCheckCount =0;
            var notCollidingDueToPlayerFaceCheckCount =0;
            var notCollidingDueToEdgeEdgeCount =0;

            var extraInfo;

            possibleObjects.forEach(objInfo => {
                
                var transposedObjMat = objInfo.transposedMat;

                var relativeMat = mat4.create(transposedObjMat);    //TODO which way around ?
                mat4.multiply(relativeMat, playerCamera);

                // var posInObjFrame = vec4.create(playerPos);
                // mat4.multiplyVec4(transposedObjMat, posInObjFrame, posInObjFrame);

                var posInObjFrame = playerPointInObjFrame([0,0,0,1]);


                //find nearby candidates by bounding sphere check as done elsewhere, return early if none nearby
                //note this logic differs for small objects, terrain objects elsewhere.

                //copied from terrain check
                //TODO use rad of chull bounding sphere
                var queryAABB = [-1,1].map(ss=>ss*settings.playerBallRadPadded).map(offs => posInObjFrame.map(xx => xx+offs));
                var nearby = collisionTestBvh4d(queryAABB, objInfo.collisionTriangleData);                
                if (nearby.length<1){return false;} 

                nearbyCount+=nearby.length;

                //for small level objects
                // if (posInObjFrame[3]<=0.3){
                //     return;
                // }
                // var nearby = closestPointBvhAABBIntialCheck(posInObjFrame, rad, objInfo);

                //to do like sphere collision, get player info into object frame.
                function playerPointInObjFrame(vv){
                    //TODO fix this! is used to rotate player position into 

                    var vv4 = vec4.create(vv);
                    mat4.multiplyVec4(relativeMat, vv4, vv4);
                    return vv4;
                }
                var playerVertsInObjFrame = chullObj.verts.map(vv => playerPointInObjFrame(vv));  //transform player convex hull points into obj frame.
                var playerFacesInObjFrame = chullObj.faces.map(vv => playerPointInObjFrame(vv));  //same thing for faces
                
                var playerEdgeGcsInObjFrame = chullObj.edgeGcs.map(egcarr => egcarr.map(vv => playerPointInObjFrame(vv)));
                    //NOTE could reuse a player vert for 1 of 2 of each edge point, avoid transforming them here 

                // console.log({
                //     posInObjFrame,
                //     playerVertsInObjFrame,
                //     playerFacesInObjFrame,
                //     playerEdgeGcsInObjFrame
                // });

                //TODO maybe use this to pick object/triangle, rerun with minMaxInDirectionWithPoint once know which obj/tri
                function minMaxInDirection(dirVec, pointVecs){
                    var dotProdsWithFace = pointVecs.map(vv => dotProduct4(vv, dirVec));

                    var greatest = dotProdsWithFace.reduce((accum, dp) => Math.max(dp,accum), -1);  //can work with unnormalised input with +/- inf, but expect want
                    var least = dotProdsWithFace.reduce((accum, dp) => Math.min(dp,accum), 1);          //normalised anyway in order to compare penetration

                    return [least, greatest];
                }

                function minMaxInDirectionWithIndex(dirVec, pointVecs){
                    var minResult = {best: 1};
                    var maxResult = {best: -1};

                    pointVecs.forEach((pv, idx) => {
                        var dotProdWithFace = dotProduct4(pv, dirVec);
                        if (dotProdWithFace < minResult.best){
                            minResult = {
                                best: dotProdWithFace,
                                idx
                            }
                        }
                        if (dotProdWithFace > maxResult.best){
                            maxResult = {
                                best: dotProdWithFace,
                                idx
                            }
                        }
                    })

                    return [minResult, maxResult];
                }

                function minMaxInDirectionWithPoint(dirVec, pointVecs){
                    var minResult = {best: 1};
                    var maxResult = {best: -1};

                    pointVecs.forEach(pv => {
                        var dotProdWithFace = dotProduct4(pv, dirVec);
                        if (dotProdWithFace < minResult.best){
                            minResult = {
                                best: dotProdWithFace,
                                picked: pv
                            }
                        }
                        if (dotProdWithFace > maxResult.best){
                            maxResult = {
                                best: dotProdWithFace,
                                picked: pv
                            }
                        }
                    })

                    return [minResult, maxResult];
                }

                //currently using cache system for data for 4d objects, not for projected 3d objects yet.
                // getTriDataForFace method exists if using cache system.
                detailedNearby = objInfo.collisionTriangleData.cache ? 
                    nearby.map(pp => objInfo.collisionTriangleData.cache.getTriDataForFace(pp.faceIdx)):
                    nearby;

                detailedNearby.forEach(tt => {
                    var collisionPointInObjectFrame;
                    var contactNormalInObjectFrame;
                    var leastPenetrationThisObjectTriangle = Infinity;
                    var chosenChullCollisionPointTypeThisObjectTriangle = -1;

                    var extraInfoThisFace;

                    //tri data has properties: verts (3 4vecs), face (4vec), edges(3x 4vecs)
                    //TODO find penetration, contact normal etc, but initially should just find if overlapping.

                    //test player verts vs tri soup faces - dot obj face vecs with player points.
                    var faceRange = minMaxInDirectionWithPoint(tt.face, playerVertsInObjFrame);

                    // if (faceRange[0]*faceRange[1]>0){
                    //     notCollidingDueToObjTriFaceCheckCount+=1;
                    // }

                    var minPenetrationFace = -faceRange[0] < faceRange[1] ?
                        {minPen:-faceRange[0].best, picked:faceRange[0].picked}:
                        {minPen:faceRange[1].best, picked:faceRange[1].picked};

                    if (minPenetrationFace.minPen<0){
                        notCollidingDueToObjTriFaceCheckCount+=1;
                        return;
                    }
                    if (minPenetrationFace.minPen<leastPenetrationThisObjectTriangle){
                        leastPenetrationThisObjectTriangle = minPenetrationFace.minPen;
                        chosenChullCollisionPointTypeThisObjectTriangle = 2;  //face. note that penetration could be -ve here
                        collisionPointInObjectFrame = minPenetrationFace.picked;
                        contactNormalInObjectFrame = tt.face;
                        extraInfoThisFace={objFacePoints:tt.verts};
                    }

                    // to reduce likelihood of needing edge test, also check vs obj triangle existing "edge" data, taking this to describe an infinitely thin face
                    // perpendicular to triangle plane. (this is a point vs face SAT test, NOT a SAT edge test )
                    //TODO don't bother with minmax - only need one or other. (which?) 
                    for (var ii=0;ii<tt.edges.length;ii++){
                        var edge = tt.edges[ii];
                        var edgeFaceRange = minMaxInDirectionWithPoint(edge, playerVertsInObjFrame);
                        var minPenetrationFaceEdge = -edgeFaceRange[0].best;
                        if (minPenetrationFaceEdge<0){
                            //console.log("found separating axis using obj tri edge face", edgeFaceRange);
                            notCollidingDueToObjTriEdgeFaceCheckCount+=1;
                            return; //found separating axis
                        }
                        if (minPenetrationFaceEdge<leastPenetrationThisObjectTriangle){
                            leastPenetrationThisObjectTriangle = minPenetrationFaceEdge;
                            chosenChullCollisionPointTypeThisObjectTriangle = 3;  //"face edge". like infinitely thin face, but if disabled this check, would get picked up by edge check
                                //really the penetration here will be no less than than found true edge check (usually greater), so no point, unless using it to exit 
                                // early. might with to do so if penetration more negative than zero or some negative number describing a inflated skin around object. 
                                // (nonzero maybe useful to measure -ve penetration to use for damper force on first +ve penetration).
                            collisionPointInObjectFrame = edgeFaceRange[0].picked;
                            contactNormalInObjectFrame = edge.map(xx=>xx*-1);   //TODO is direction correct?
                        }
                    }

                    if (!guiParams.debug.skipSatPlayerFaceTests){
                        //test player faces vs tri soup verts. (note repetition here since verts used in adjacent tri soup faces)
                        var playerFaceRanges = playerFacesInObjFrame.map(ff=>minMaxInDirectionWithIndex(ff, tt.verts));
                        for (var ii=0;ii<playerFaceRanges.length;ii++){
                            var playerFaceRange = playerFaceRanges[ii];
                            var maxPenetrationPlayerFace = playerFaceRange[1].best;

                            if (maxPenetrationPlayerFace<0){
                                //console.log("found separating axis using player face", playerFaceRange);
                                notCollidingDueToPlayerFaceCheckCount+=1;
                                return; //found separating axis
                            }
                            if (maxPenetrationPlayerFace<leastPenetrationThisObjectTriangle){
                                leastPenetrationThisObjectTriangle = maxPenetrationPlayerFace;
                                chosenChullCollisionPointTypeThisObjectTriangle = 0;  //"vertex" on the world object, consist with sphere-world object tri collision
                                collisionPointInObjectFrame = tt.verts[playerFaceRange[1].idx];
                                contactNormalInObjectFrame = playerFacesInObjFrame[ii].map(xx=>xx*-1);  //reverse? TODO flip chull face norms?
                                extraInfoThisFace={facePoints:chullObj.faceIndices[ii].map(idx=>playerVertsInObjFrame[idx])};
                            }
                        }
                    }

                    //TODO edge-edge test if haven't yet found separating axis for this obj tri vs the player convex hull.
                    for (var ii=0;ii<tt.edgeGcs.length;ii++){   //3 edges for tris, but may wish to support quads etc.
                        var objEdgeGc = tt.edgeGcs[ii];
                        for (var jj=0;jj<playerEdgeGcsInObjFrame.length;jj++){
                            var playerEdgeGc = playerEdgeGcsInObjFrame[jj];
                           
                            var findAxisResult = findAxisBetweenGreatCircles(objEdgeGc, playerEdgeGc);
                            var pointDifferenceDirection = findAxisResult.axis;
                            
                            var distRange = minMaxInDirection(pointDifferenceDirection, playerVertsInObjFrame);
                            var distRangObjTriPoints = minMaxInDirection(pointDifferenceDirection, tt.verts);

                            var minPenetrationEdgeEdge = Math.min( distRangObjTriPoints[1]-distRange[0], distRange[1] - distRangObjTriPoints[0]);
                            //var minPenetrationEdgeEdge = distRange[1] - distRangObjTriPoints[0];

                            var sign = distRangObjTriPoints[1]-distRange[0] <  distRange[1] - distRangObjTriPoints[0] ? -1:1;
                            //var sign = 1;

                            if (minPenetrationEdgeEdge<0){
                            //if (distRangObjTriPoints[1]< distRange[0] || distRange[1]< distRangObjTriPoints[0]){   //no overlap
                                //console.log({distRange, distRangObjTriPoints});
                                notCollidingDueToEdgeEdgeCount+=1;
                                return;
                            }

                            //detect ranges of the 2 objects not crossing 0. (each fully on same side of test plane), AND on same side.
                            //  in this case the ranges of vertices of each might not be correct range of whole object, because wraps round, leading to 
                            // missing overlap between 2 shapes
                            // seems this edge case is hit sometimes, but removing it does NOT fix jumpy edge-edge collision!
                            // NOTE if just detected that each obj doesn't cross 0, could miss near but non-overlap.

                            //TODO toggle this edge case detection on/off - could be makes matters worse!!
                            var edgeCaseDetected = (distRange[0]*distRange[1]>0) && (distRangObjTriPoints[0]*distRangObjTriPoints[1]>0) && (distRange[0]*distRangObjTriPoints[0]>0);

                            if (guiParams.debug.skipEdgeCaseCheck){edgeCaseDetected=false;}
                            
                            //if (edgeCaseDetected){alert("edge case detected!!");}

                            //TODO actually project into space with straight lines?

                            //possible reasons/cures for wacky collision: 
                            // if spurious selected collision points are only when there is no overlap, might disregard last penetration or cap to 0, (still get spurious zeros though)
                            // put a skin on object/only take last penetration into account if was +ve
                            // TODO semi transparent/flash player object/lines so can see if point detected inside
                            //TODO highlighted the edges that collision detected for
                            //TODO toggle collision response on/off so can see if spurious axis detection is only when not colliding.


                            //TODO suspect that the problem here is that because not comparing ANGLE ranges, there is a preference for differences
                            //that are away from centre, so ends up selecting edges away from true newrly colliding edge, on opposite side of player object.
                            //to avoid this, change selection criteria to favour close things?

                            //actually, suspect issue might be solved by looking at distance between tested edges
                            //should consider distance (along SAT axis) of edges in question...

                            var isAcceptableEdgeCollision = guiParams.debug.skipEdgeColAcc || (distRange[0]*distRangObjTriPoints[1] <=0 && distRange[1]*distRangObjTriPoints[0] <=0);
                                //seems like should work, but seems to rule out legit things!
                            

                            if ((minPenetrationEdgeEdge<leastPenetrationThisObjectTriangle) && !edgeCaseDetected && isAcceptableEdgeCollision){
                                leastPenetrationThisObjectTriangle = minPenetrationEdgeEdge;
                                chosenChullCollisionPointTypeThisObjectTriangle = 1; //edge
                                //var avgPoint = normalise4(vectorSum4d(closePoints[0], closePoints[1]));
                                var avgPoint = normalise4(findAxisResult.sumPoint);
                                collisionPointInObjectFrame = avgPoint;
                                contactNormalInObjectFrame = pointDifferenceDirection.map(xx=>xx*sign);
                                extraInfoThisFace = {
                                    distRangObjTriPoints,
                                    distRange,
                                    minPenetrationEdgeEdge,
                                    sign,
                                    triEdgeEndpoints:{
                                        onObject:[tt.verts[ii], tt.verts[(ii+1)%3]],
                                        onPlayer:chullObj.edgeVertIndices[jj].map(idx=>playerVertsInObjFrame[idx])
                                    }
                                };
                            }
                        }
                    }

                    if (chosenChullCollisionPointTypeThisObjectTriangle == -1){
                        possiblyCollidingTrisCount+=1;
                    }

                    // if (leastPenetrationThisObjectTriangle>0){
                    //     //colliding with this tri. however, for now, just find 1 triangle max
                    // }

                    if (leastPenetrationThisObjectTriangle>greatestPenetrationFound){
                        extraInfo = extraInfoThisFace;
                        greatestPenetrationFound = leastPenetrationThisObjectTriangle;
                        chosenChullCollisionPointType = chosenChullCollisionPointTypeThisObjectTriangle;
                        collisionPointResult = {
                            collisionPointInObjectFrame,
                            contactNormalInObjectFrame,
                            objInfo
                        };
                    }
                });
            });


            //possible problem? 
            // could be that face direction dotted with point is not good.
            //because in order to move objects aparts, should move along a great circle. 

            if (guiParams.debug.closestPointNearby){
                if (collisionPointResult?.collisionPointInObjectFrame){ 
                    //copypaste code from elsewhere to get a matrix describing contact point.
                    //TODO generalise! also don't actually need a matrix for this. just position

                    putDebugPointInObjFrame(collisionPointResult.objInfo, collisionPointResult.collisionPointInObjectFrame, [colorArrs.red,colorArrs.green,colorArrs.blue,colorArrs.magenta][chosenChullCollisionPointType]);

                    //add an extra point offset in contact normal position.
                    var offsetPoint = normalise4(vectorSum4d(collisionPointResult.collisionPointInObjectFrame, 
                        collisionPointResult.contactNormalInObjectFrame.map(xx=>xx*-0.0001)));
                    putDebugPointInObjFrame(collisionPointResult.objInfo, offsetPoint, colorArrs.white);

                    if (extraInfo?.closePoints){
                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.closePoints[0], colorArrs.magenta);
                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.closePoints[1], colorArrs.magenta);

                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.triEdgeEndpoints.onObject[0], colorArrs.red, 0.1);
                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.triEdgeEndpoints.onObject[1], colorArrs.red, 0.1);
                        //TODO draw whole edge

                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.triEdgeEndpoints.onPlayer[0], colorArrs.cyan, 0.01);
                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.triEdgeEndpoints.onPlayer[1], colorArrs.cyan, 0.01);
                    }

                    if (extraInfo?.facePoints){  //found least SAT overlap for object vertex vs player face. put debug points on corners of the player face.
                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.facePoints[0], colorArrs.red, 0.01);
                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.facePoints[1], colorArrs.red, 0.01);
                        putDebugPointInObjFrame(collisionPointResult.objInfo, extraInfo.facePoints[2], colorArrs.red, 0.01);
                    }

                    if (extraInfo?.objFacePoints){  //same for verts of obj face, but make bigger else can be hard to see
                        extraInfo?.objFacePoints.forEach(fp =>{
                            putDebugPointInObjFrame(collisionPointResult.objInfo, fp, [1,1,0], 0.1);
                        });
                    }
                }
            }

            function putDebugPointInObjFrame(objInfo, collisionPointInObjectFrame, pointColor, size = 0.01){
                var closestPointInObjectFrame = collisionPointInObjectFrame;
                var positionXyz = closestPointInObjectFrame.slice(0,3);
                var veclenXyz = Math.sqrt(positionXyz.reduce((accum, xx)=>accum+xx*xx, 0));
                var scalarAngleDifference = Math.atan2(veclenXyz, closestPointInObjectFrame[3]);

                var correction = -scalarAngleDifference/veclenXyz;
                var angleToMove = positionXyz.map(val => val*correction);

                var tempMat = mat4.create();

                mat4.set(objInfo.mat, tempMat);
                xyzmove4mat(tempMat, angleToMove);	//draw x on closest vertex

                debugDraw.addExtraMarker(tempMat, sshipModelScale*size, pointColor);

                //new Explosion({matrix:mat4.create(tempMat),world:playerContainer.world}, sshipModelScale*size, pointColor.slice(0,3);
            }


            
            // apply force to player along contactNormalInObjectFrame (at collisionPointInObjectFrame, but for linear acceleration may not matter)
            //convert normal into player frame from object frame. 
            if (guiParams.debug.chullCollisionApplyResponse && collisionPointResult?.contactNormalInObjectFrame){
                var transposedObjMat = collisionPointResult.objInfo.transposedMat;
                var relativeMat = mat4.create(transposedObjMat);    //TODO which way around ?
                mat4.multiply(relativeMat, playerCamera);
                mat4.transpose(relativeMat);    //??
                var normInPlayerFrame = vec4.create(collisionPointResult.contactNormalInObjectFrame);
                mat4.multiplyVec4(relativeMat, normInPlayerFrame, normInPlayerFrame);

                if (greatestPenetrationFound>0 && lastChullPenetration != -Infinity){  //TODO better logic here! 
                    var penChange = greatestPenetrationFound - lastChullPenetration;
                    var reactionForce = Math.max(200*greatestPenetrationFound + 5000*penChange, 0);

                    //apply force along normal. convert 4vec to 3vec. not sure what is correct here. code copied from elsewhere.
                    var relativePosC = Array.from(normInPlayerFrame);   //TODO is Array from needed?
                    var relativePosCLength = Math.sqrt(relativePosC[0]*relativePosC[0]+relativePosC[1]*relativePosC[1]+relativePosC[2]*relativePosC[2]);
                    var relativePosCNormalised = relativePosC.map(x=>x/relativePosCLength);
                    var forcePlayerFrame = relativePosCNormalised.map(elem => elem*reactionForce);
                    // console.log({greatestPenetrationFound, lastChullPenetration, normInPlayerFrame, relativePosC, relativePosCLength, relativePosCNormalised, forcePlayerFrame});
                    for (var cc=0;cc<3;cc++){
                        playerVelVec[cc]+=forcePlayerFrame[cc];
                    }


                    //apply torque.
                    //have the reaction normal, the player position, some position force is applied*
                    mat4.set(transposedObjMat, relativeMat);
                    mat4.multiply(relativeMat, playerCamera);
                    mat4.transpose(relativeMat);    //??
                    var collisionPointInPlayerFrame = vec4.create(collisionPointResult.collisionPointInObjectFrame);
                    mat4.multiplyVec4(relativeMat, collisionPointInPlayerFrame, collisionPointInPlayerFrame);
                    var torqueGuess = findOrthoVecByDiags([normInPlayerFrame, collisionPointInPlayerFrame, [0,0,0,1]]);
                    //NOTE in player frame, can just take 3d x-prod of 3d components of collision point and norm. simpler, expect approx same
                    for (var ii=0;ii<3;ii++){
                        playerAngVelVec[ii]+=100000*reactionForce*torqueGuess[ii];
                            //NOTE this may be large, but effect of torque reduced by very high angular damping
                            //TODO* make this right for edge-edge collision - suspect current collision point does not work as a contact point.
                    }

                }
            }

            lastChullPenetration = Math.max(greatestPenetrationFound,0);

            return {
                chosenChullCollisionPointType,
                greatestPenetrationFound,
                nearbyCount,
                possiblyCollidingTrisCount,
                notCollidingDueToObjTriFaceCheckCount,
                notCollidingDueToObjTriEdgeFaceCheckCount,
                notCollidingDueToPlayerFaceCheckCount,
                notCollidingDueToEdgeEdgeCount
            }

            //processTrianglePossibles returns bool, has side-effect of altering resultMat, which contains collision point,
            // is used later to work out force, penetration - force is always thru player centre for sphere collision
            // here need more info - collision normal or 2 points (closest point on both shapes), penetration

            //for now, possiblyCollidingWithAnObjTriangle can be used to detect collision (without collision response)
        }
    }
})();

var shouldDumpDebug3 = false;

var closestPointInfo = {};
var specialCollisionInfo = {};