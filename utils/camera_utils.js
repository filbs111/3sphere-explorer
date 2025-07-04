var offsetCam = (function(){
	var offsetVec;
	var offsetVecReverse;
	var targetForType = {
		"near 3rd person":[0,-37.5,-25],	//TODO reduce code duplication. do scalar vector product targetForType time?
		"far 3rd person":[0,-65,-72],
		"really far 3rd person":[0,-75,-125],
		"cockpit":[0,0,25],
		"side":[30,0,12.5],
		"none":[0,0,0]
	}
	var targetForTypeReverse = {
		"near 3rd person":[0,-37.5,25],
		"far 3rd person":[0,-65,82],
		"really far 3rd person":[0,-75,125],
		"cockpit":[0,0,-50],
		"side":[30,0,12.5],
		"none":[0,0,0]
	}
	var offsetVecTarget = targetForType["far 3rd person"].map(x=>sshipModelScale*x);
	var offsetVecTargetReverse = targetForTypeReverse["far 3rd person"].map(x=>sshipModelScale*x);
	offsetVec = offsetVecTarget;
	offsetVecReverse = offsetVecTargetReverse;

	var mult1=0.98;
	var mult2=1-mult1;
	
    var desiredCamMoveVec=[0,0,0];  //?
    var smoothedDesiredCamMoveVec=[0,0,0]

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
        desiredCamMoveVec = (currentReverse? targetForTypeReverse:targetForType)[currentType].map(x=>sshipModelScale*x);
    }

	return {
		getVec: function (){
			return desiredCamMoveVec;
		},
		setType,
		addIts: function(numIts){
            camItsToDo+=numIts;
		},
        getSmoothedWithCamCollision(offsetCameraContainer){
            setType();
            
            if (haveSwitchedCam){
                smoothedDesiredCamMoveVec = desiredCamMoveVec;
            }

            var collidedVec = getCameraToMoveVecWithCameraCollision(offsetCameraContainer, smoothedDesiredCamMoveVec);

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

            return smoothedCurrentVec;
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

    var tempMat4 = mat4.create(offsetCameraContainer.matrix);
    var cameraRayStartPos = tempMat4.slice(12);
    xyzmove4mat(tempMat4, testCameraMoveVec);
    var cameraRayEndPos = tempMat4.slice(12);

    var bvhCollideResult = rayBvhCollision(cameraRayStartPos, cameraRayEndPos, offsetCameraContainer.world);

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
