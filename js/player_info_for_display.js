var playerInfoForDisplay = (()=>{

    var airSpdVec = [0,0,0];
    var airSpdSq = [0,0,0];
    var airSpeedMetresPerSec = 0;
    var trueSpeedMetresPerSec = 0;

    var previousTrueSpeedMetresPerSec = 0;
    var previousPlayerWorldVelocityMetresPerSec = [0,0,0,0];
    var measuredAccelerationMetresPerSecSquared = 0;

    function getInfo(){

		var airSpeedKmh = airSpeedMetresPerSec*3.6;
		var trueSpeedKmh = trueSpeedMetresPerSec*3.6;
        var measuredAccelerationGees = measuredAccelerationMetresPerSecSquared/9.81;

        return {
            airSpdVec,
            airSpdSq,
            airSpeedKmh,
            trueSpeedKmh,
            measuredAccelerationGees
        };
    }

    function setInfo(speedMultiplier, timeChange, playerCamera, playerVelVec, scaledSpinVelPlayerCoords){

		previousTrueSpeedMetresPerSec = trueSpeedMetresPerSec;

        //1000 is per ms to per second
		var speed = Math.hypot.apply(null, playerVelVec);
		trueSpeedMetresPerSec = speedMultiplier * speed;

        airSpdVec = playerVelVec.map((val, idx) => val-scaledSpinVelPlayerCoords[idx]);	//speed relative to local air speed due to duocylinder rotation.
		airSpdSq = airSpdVec.reduce((accum, current)=>accum+current*current,0);

        var airSpeed = Math.hypot.apply(null, airSpdVec);
        airSpeedMetresPerSec = speedMultiplier * airSpeed;

        //NOTE acceleration measured here is unreasonable because  difference in speeds measured not velocities (so acceleration perpendicular to velocity not measured)
        // furthermore, each speed is in player frame, so will not detect acceleration when landed on a spinning terrain, even did vector difference.
        // therefore current measurement only valid for acceleration due to thrust, drag when travelling in straight line. 
        //measuredAccelerationMetresPerSecSquared = (trueSpeedMetresPerSec - previousTrueSpeedMetresPerSec)* (1000/(numSteps*timeStep));

        //find acceleration by taking this difference in 4d velocities, and removing radial component (which is proportional to speed)

        //get velocity in world frame by matrix multiplying velocity in player frame by player matrix.
        // note that diffing this velocity will fail for portal transition, but for now just using for debug measurement
        var currentPlayerWorldVelocityMetresPerSec = [0,0,0,0];

        for (var ii=0;ii<4;ii++){
            for (var jj=0;jj<3;jj++){
                currentPlayerWorldVelocityMetresPerSec[ii] += playerCamera[ii + 4*jj]*playerVelVec[jj];
            }
        }

        var playerAccWorldFrame4d = currentPlayerWorldVelocityMetresPerSec.map((xx,ii)=> xx - previousPlayerWorldVelocityMetresPerSec[ii] );
        var playerAccRadial = dotProduct4(playerAccWorldFrame4d, playerCamera.slice(12));
        var playerAccRadialSq = playerAccRadial*playerAccRadial;
        var playerAccTotalMag = dotProduct4(playerAccWorldFrame4d,playerAccWorldFrame4d);
        var playerAccNonRadialSq = playerAccTotalMag - playerAccRadialSq;
        var playerAccNonRadial = Math.sqrt(playerAccNonRadialSq);

        var measuredCurrentAccelerationMetresPerSecSquared = speedMultiplier* playerAccNonRadial * (1000/timeChange);
        
        var smoothingFactor = 0;       // smoothing necessary for stable g reading when landed on surface because noisy physics.
            // no smoothing works fine for thrust, drag. can see g at duocylinder land surface matches expectation at terminal velocity using handbrake

        if (measuredCurrentAccelerationMetresPerSecSquared >= 0){
            measuredAccelerationMetresPerSecSquared = (1-smoothingFactor)* measuredCurrentAccelerationMetresPerSecSquared + smoothingFactor*measuredAccelerationMetresPerSecSquared;
        }

        previousPlayerWorldVelocityMetresPerSec = currentPlayerWorldVelocityMetresPerSec;
    }

    return {
        getInfo,
        setInfo
    };
})();
