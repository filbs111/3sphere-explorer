var playerCameraLagToAccumulate = [0,0,0];
var accumulatedPlayerCameraLag = [0,0,0];

var offsetCam = (function(){
	var offsetVec;
	var offsetVecReverse;

    var camSettings = {
        "near 3rd person":{
            forward: [0,-37.5,-25],
            reverse: [0,-37.5,25],
            tiltMultiplier:0.3
        },
        "far 3rd person":{
            forward:[0,-65,-72],
            reverse:[0,-65,82],
            tiltMultiplier:1.3  //what does this do? would like cam tilt ? 45 deg when 90 deg AOA. would like to increase tilt. but does this setting just change tilt ? 
        },
        "really far 3rd person":{
            forward:[0,-75,-125],
            reverse:[0,-75,125],
            tiltMultiplier:1
        },
        "cockpit":{
            forward:[0,0,35],
            reverse:[0,0,-50],
            tiltMultiplier:0
        },
        "side":{
            forward:[30,0,12.5],
            reverse:[30,0,12.5],
            tiltMultiplier:0
        },
        "none":{
            forward:[0,0,0],
            reverse:[0,0,0],
            tiltMultiplier:0
        }
    }

    var currentSettings = camSettings["far 3rd person"];
	var offsetVecTarget = currentSettings.forward.map(x=>sshipModelScale*x);
	var offsetVecTargetReverse = currentSettings.reverse.map(x=>sshipModelScale*x);
	offsetVec = offsetVecTarget;
	offsetVecReverse = offsetVecTargetReverse;

	var mult1=0.98;
	var mult2=1-mult1;
	
    var desiredCamMoveVec=[0,0,0];  //?
    var smoothedDesiredCamMoveVec=[0,0,0]

    var smoothedHackPositionOffset=[0,0,0];

    var smoothedCurrentVec = [0,0,0];
    var lastType;
    var lastReverse=true;

    var haveSwitchedCam=false;
    var camItsToDo = 0;

    function setType(){
        var currentType = guiParams.display.cameraType;
        var currentReverse = reverseCamera;
        if (lastType == currentType && currentReverse == lastReverse){return;}
        if (currentReverse != lastReverse){haveSwitchedCam=true;}
        lastType = currentType;
        lastReverse = currentReverse;

        currentSettings = camSettings[currentType];
        desiredCamMoveVec = (currentReverse? currentSettings.reverse : currentSettings.forward).map(x=>sshipModelScale*x);
    }

	return {
		getVec: () => desiredCamMoveVec,
		setType,
		addIts: function(numIts){
            camItsToDo+=numIts;
		},
        getTiltMultiplier: () => currentSettings.tiltMultiplier,
        getSmoothedWithCamCollision(offsetCameraContainer){
            setType();
            
            if (haveSwitchedCam){
                smoothedDesiredCamMoveVec = desiredCamMoveVec;
            }

            var worldSize = guiSettingsForWorld[offsetCameraContainer.world].worldSize;

            //var worldSize = 1;

            var scaledSmoothedDesiredCamMoveVec = smoothedDesiredCamMoveVec.map(x => x/worldSize);

            var scaledCollidedVec = getCameraToMoveVecWithCameraCollision(offsetCameraContainer, scaledSmoothedDesiredCamMoveVec);

            var collidedVec = scaledCollidedVec.map(x=>x*worldSize);

            if (haveSwitchedCam){
                smoothedCurrentVec = collidedVec;
                haveSwitchedCam=false;
            }

            for (var it=0;it<camItsToDo;it++){
                for (var cc=0;cc<3;cc++){
                    smoothedDesiredCamMoveVec[cc] = smoothedDesiredCamMoveVec[cc]*mult1+desiredCamMoveVec[cc]*mult2;
                    smoothedCurrentVec[cc] = smoothedCurrentVec[cc]*mult1+collidedVec[cc]*mult2;

                }
            }
            camItsToDo=0;

            var collidedVecLenSq = collidedVec.reduce((accum, current) => accum + current*current, 0);
            var smoothedCurrentVecLenSq = smoothedCurrentVec.reduce((accum, current) => accum + current*current, 0);

            if (collidedVecLenSq<smoothedCurrentVecLenSq){
                //don't smooth cam if would mean is inside an object
                smoothedCurrentVec = collidedVec;
            }

            var toReturn=smoothedCurrentVec;
            toReturn[0] -= guiParams.display.cameraMoveSide;    //bodge on side shift to aid debugging. [1]= up,down



            var shiftMultiplier = currentSettings.tiltMultiplier;


            //tilt camera movement vector so when camera tilted at its final rotation, result is that spaceship doesn't change screen position - 
            // if don't do this, can look like a windscreen wiper!
            //note this is a bodge, and might avoid rotating twice - here rotate the movement vector AND rotate after movement.
            // could alternatively rotate camera before movement and just move along unrotated vector in camera frame.
            toReturn = rotateVecByAxisAngleVec(toReturn, cameraTilt.map(x=>-shiftMultiplier*x));


            //bodge - shift by smoothed thrust.
            // TODO include drag for overall acceleration
            // TODO proper spring/damper
            var unsmoothedOffset = playerMechanics.currentThrustInput; 
            smoothedHackPositionOffset = smoothedHackPositionOffset.map((xx,ii)=>xx*mult1 + mult2*unsmoothedOffset[ii]);


            toReturn = toReturn.map((xx,ii) => xx - 0.1*shiftMultiplier*smoothedHackPositionOffset[ii]);

            return toReturn;
        }
	}
})();

function getCameraToMoveVecWithCameraCollision(offsetCameraContainer, desiredCameraMoveVec){
    //camera collision
    //really ray collision should be check both sides of the portal, 
    //but for basic version, move without portal jump, just check starting side of portal.
    //provided stuff camera collides with not close to portal, should work fine.

    // smooth distance of camera from player as function of distance of collision in movement direction
    // eg when back into a wall

    //supposed acheive this by something liek spline running over simple kinked version: 
    // average ( min(desired, measured+k), min(desired, measured-k))
    //outcome: 
    //measured < desired-k : distance = measured 
    //then parabolic smoothed.
    //measured > desired+k : distance = desired

    //turns out both these transitions are visible. TODO something better!
	
    var kOverDesired = 0.1;
    var testDistOverDesired = 1+kOverDesired;
    var testCameraMoveVec = desiredCameraMoveVec.map(xx=>xx*testDistOverDesired);


    //rotate with duocylinder. NOTE this code is inefficient! (could reorder mat mults etc)
	var dcSpin = guiSettingsForWorld[offsetCameraContainer.world].spin;

    var tempMat4 = mat4.create(offsetCameraContainer.matrix);
    var tempMat4Copy = mat4.create(tempMat4);
    var cameraRayStartPos = tempMat4.slice(12);   //this could be correct for unspun objects
    xyzmove4mat(tempMat4Copy, testCameraMoveVec);
    var cameraRayEndPos = tempMat4Copy.slice(12);     // ""

    mat4.transpose(tempMat4);
    mat4.transpose(tempMat4Copy);

	rotate4mat(tempMat4, 0, 1, dcSpin);
   	rotate4mat(tempMat4Copy, 0, 1, dcSpin);

    mat4.transpose(tempMat4);
    mat4.transpose(tempMat4Copy);

    var cameraRayStartPosSpun = tempMat4.slice(12);
    var cameraRayEndPosSpun = tempMat4Copy.slice(12);



    var bvhCollideResult = rayBvhCollision(cameraRayStartPos, cameraRayEndPos, cameraRayStartPosSpun, cameraRayEndPosSpun, offsetCameraContainer.world);

    var resultAsFractionOfDesired = bvhCollideResult.closestFractionAlong*testDistOverDesired;
    var smoothed = (
        Math.min(resultAsFractionOfDesired-kOverDesired, 1)+
        Math.min(resultAsFractionOfDesired+kOverDesired, 1))/2;

    var toMoveFraction = smoothed - 0.05;
        //remove some amount to move camera away from being exactly on collided surface.
        //the number here should be relative to total expected length
        //and also collision should really by a sphere (won't work well for glancing collision as is)

    var cameraToMoveVec = desiredCameraMoveVec.map(xx=> xx*toMoveFraction );
        //NOTE ideally should account for being a great circle - the fraction returned by bvh collision
        //is in projected flat space. however, for small objects/rays relative to world, not big problem
    return cameraToMoveVec;
}
