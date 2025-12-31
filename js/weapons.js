var gunEven=1;
function fireGun(){
	gunEven = 1-gunEven;
	for (var g in gunMatrices){
		if (g%2 == gunEven){
			muzzleFlashAmounts[g]+=0.25
			
			var gunMatrix = gunMatrices[g];
			
			xyzrotate4mat(gunMatrix,[0.02*(Math.random()-0.5),0.02*(Math.random()-0.5),0]);	//random spread TODO gaussian
			
			launchProjectile(gunMatrix, [0,0,muzzleVel], false);
			
			new Explosion({matrix:gunMatrix,world:sshipWorld}, sshipModelScale*0.5, [0.06,0.06,0.06]);	//smoke/steam fx.
															//TODO emit from hot gun (continue after firing), lighting for smoke (don't see in dark) ...
															//TODO get correct world (which side of portal end of gun is in)
			
		}
	}
	myAudioPlayer.playGunSound(0);	//todo use delay param to play at exact time.
	gunHeat+=0.1;
	
//	var gunJerkAmount = 0.004;
//	rotatePlayer([(Math.random()-0.5)*gunJerkAmount, (Math.random()-0.5)*gunJerkAmount,0]);
}

function fireSpecial(){
	var sweap = specialWeapsData[selectedSpecialWeapId];
	if (sweap.fireSoundFunc){sweap.fireSoundFunc();}
	launchLargeProjectile(sweap);
}

//TODO include regular gun in this listing
//reference separate table of munitions?
//TODO include autofire countdown as weapon property
var specialWeapsData = [
	{	//0
		name:"BOMB",
		periodMillis:500,
		forwardOffset:-0.0008,
		getLaunchVel:()=>[0,0,-0.01],
		markerText:"BOMB"
	},
	{	//1
		name:"MORTAR",
		periodMillis:500,
		forwardOffset:0.002,
		getLaunchVel:()=>[0,0,2],
	},
	{	//2
		name:"ROCKETS",
		noMarker:true,
		periodMillis:200,
		forwardOffset:0.001,	//TODO side offset
		hasTrail:true,
		numProjectiles:4,
		forwardAcceleration:0.01,
		getLaunchVel: ii =>{ var ang = Math.PI*ii/2; return [0.02*Math.sin(ang), 0.02*Math.cos(ang),0.01];}
	},
	{	//3
		name:"SHOTGUN",
		fireSoundFunc:()=>myAudioPlayer.playGunSound(),
		periodMillis:150,
		forwardOffset:0.002,
		getLaunchVel:()=>[spreadRand(0.2),spreadRand(0.2),4],
		numProjectiles:10,
		bigProjectiles:false,
	},
	{	//4
		name:"CANISTER",
		periodMillis:600,
		forwardOffset:0.002,
		getLaunchVel:()=>{
			var octXy = spreadOctagon(1);
			return [octXy[0],octXy[1],6];
		},
		numProjectiles:80,
		bigProjectiles:false,
	},
	{	//5
		name:"MISSILE",
		periodMillis:500,
		forwardOffset:0.001,	//TODO side offset
		hasTrail:true,
		numProjectiles:1,
		towardsTargetAcceleration:0.01,
		getLaunchVel: ()=>[0,0,0.5]
	},
];

var numSpecialWeaps=specialWeapsData.length;
var selectedSpecialWeapId=0;
window.addEventListener("wheel", event => {
    const delta = Math.sign(event.deltaY);
    selectedSpecialWeapId = (numSpecialWeaps+selectedSpecialWeapId+Math.sign(delta))%numSpecialWeaps;
});

function spreadRand(amount){
	return (Math.random()-0.5)*amount;	//TODO precalc, gaussia etc
}
function spreadOctagon(amount){
	var x=spreadRand(amount)*1.414;
	var y=spreadRand(amount)*1.414
	var a=spreadRand(amount);
	var b=spreadRand(amount);
	x+=a;
	x+=b;
	y+=a;
	y-=b;
	return [x,y];
}

function launchLargeProjectile(weaponDef){
	var {forwardOffset, getLaunchVel, numProjectiles, bigProjectiles, noMarker, markerText, hasTrail, forwardAcceleration, towardsTargetAcceleration} = weaponDef;
	var projectileMat = mat4.create(sshipMatrix);
	xyzmove4mat(projectileMat,[0,0,forwardOffset]);

	numProjectiles??=1;
	bigProjectiles??=true;
	for (var ii=0;ii<numProjectiles;ii++){
		launchProjectile(projectileMat, getLaunchVel(ii), bigProjectiles, noMarker, markerText, hasTrail, forwardAcceleration, towardsTargetAcceleration);
	}
}

//now using bullets array to contain both bullets and bombs.
function launchProjectile(projectileMatrix, muzzleVelVec, isBig, noMarker, markerText, hasTrail, forwardAcceleration, towardsTargetAcceleration){

	var newBulletMatrix = matPool.create(); 
	mat4.set(projectileMatrix,newBulletMatrix);
	
	//work out what fireDirectionVec should be in frame of gun/bullet (rather than player ship body)
	//this maybe better done alongside targeting code.
	var relativeMatrix = matPool.create();
	mat4.set(sshipMatrix,relativeMatrix);
	mat4.transpose(relativeMatrix);
	mat4.multiply(relativeMatrix, projectileMatrix);
	
	var newFireDirectionVec = new Array(3);
	for (var ii=0;ii<3;ii++){
		var sum=0;
		for (var jj=0;jj<3;jj++){
			sum+=relativeMatrix[ii*4+jj]*playerVelVec[jj];
		}
		newFireDirectionVec[ii]=sum;
	}
	for (var cc=0;cc<3;cc++){
		newFireDirectionVec[cc]+=muzzleVelVec[cc];
	}

	var target = null;
	
	if (towardsTargetAcceleration){
		//select closest target matrix. 
		// TODO better selection criteria! favour stuff in pointing direction, perhaps also screen centre (so favour flight direction), divvy up 
		// missiles between multiple targets etc.
		var winningScore = 2;
		for (var targetMatrix of targetMatrices){
			var thisScore = distBetween4mats(newBulletMatrix, targetMatrix);
			if (thisScore < winningScore){
				winningScore = thisScore;
				target = {matrix:targetMatrix, world:-1}
			}
		}
	}

	bullets.add({
		matrix:newBulletMatrix,
		vel:newFireDirectionVec,
		world:sshipWorld,
		isBig,
		marker: !noMarker,
		markerText,
		hasTrail,
		forwardAcceleration,
		towardsTargetAcceleration,
		target,
		active:true}
	);

	matPool.destroy(relativeMatrix);
			
	//limit number of bullets
	if (bullets.size>2000){
		var bulletToDestroy = bullets.keys().next().value;
		//console.log("removing bullet because too many. ",bulletToDestroy.matrix,"pool:",matPool.getMats());
		if (bulletToDestroy.active){
			matPool.destroy(bulletToDestroy.matrix);
		}
		bullets.delete(bulletToDestroy);
	}
}

function smokeGuns(){
	for (var g in gunMatrices){
		if (g%2 == gunEven){
			var gunMatrix = gunMatrices[g];
			produceSmoke({matrix:gunMatrix,world:sshipWorld});
			
		}
	}
}

function produceSmoke(matAndWorld){
	new Explosion(matAndWorld, sshipModelScale*0.5, [0.06,0.06,0.06]);	//smoke/steam fx.
															//TODO emit from hot gun (continue after firing), lighting for smoke (don't see in dark) ...
															//TODO get correct world (which side of portal end of gun is in)
}


function createAutofire(callback, periodMilliFunction){
    var timeRemaining = periodMilliFunction();
    return function(condition, timepassed){
        timeRemaining-=timepassed;
        if (timeRemaining<0){
            timeRemaining=0;
            if (condition){
                callback();
                timeRemaining+=periodMilliFunction();
            }else{
                timeRemaining=0;
            }
        }
    }
}


function processGamepadWeaponSwitching(activeGp){
	//TODO do this will callbacks, and only on keydown.

	if (!activeGp){return;}

	var selectSpecialButtonValues = gpSettings.selectSpecialButtons.map(buttonIdx => activeGp.buttons[buttonIdx].value);
	for (var ii=0;ii<selectSpecialButtonValues.length;ii++){
		if (selectSpecialButtonValues[ii]){
			selectedSpecialWeapId = ii;
		}
	}
}



function getTargetingSolution(matrixForTargeting, targetMatrix, logStuff){

	//TODO not use globals for these. need to hook up with rendering code
	var targetWorldFrame=[];
	var targetingResultOne=[];
	var targetingResultTwo=[];
	var selectedTargeting="none";

	var rotvec=[0,0,0];

	//solve accounting for launch velocity
	//get position of target in frame of player. can then plot this on screen.
	//unit vector of this is "targetWorldFrame"
	//then the gun velocity (in frame of player) should be (see paper calculations, 2018-07-25)
	// t = targetWorldFrame
	// v= playervel
	// m= muzzle speed
	// g= muzzle velocity
	
	// g = t (t.v (+/-) sqrt(v.v - (t.v)^2 + m*m )) - v
	//should confirm that |g| = m
	//depending if part in sqrt is +ve or -ve, have 2 or 0 solutions (for the +/- bit in the sqrt).
		//+ve has greater velocity, so gets there quicker
	//should pick 1st if guns can rotate to that direction, else 2nd if guns can get there, else no solution.
	
	//first get target direction in frame of screen.
	var targetPos = targetMatrix.slice(12);
	for (var ii=0;ii<4;ii++){
		var total=0;
		for (var jj=0;jj<4;jj++){
			total+=matrixForTargeting[ii*4+jj]*targetPos[jj];
		}
		targetWorldFrame[ii]=total;
	}
	//normalise x,y,z parts of to target vector.
	var length = Math.sqrt(1-targetWorldFrame[3]*targetWorldFrame[3]);	//TODO ensure not 0. can combo with range check.
	
	targetWorldFrame = targetWorldFrame.map(val => val/length);	//FWIW last value unneeded
	
	//confirm tWF length 1? 
	var lensqtwf=0;
	for (var ii=0;ii<3;ii++){
		lensqtwf += targetWorldFrame[ii]*targetWorldFrame[ii];
	}
	
	var playerVelVecMagsq = playerVelVec.reduce((total, val) => total+ val*val, 0);	//v.v
				//todo reuse code or result (copied from elsewhere)
	var tDotV = playerVelVec.reduce((total, val, ii) => total+ val*targetWorldFrame[ii], 0);
	var inSqrtBracket =  tDotV*tDotV + muzzleVel*muzzleVel -playerVelVecMagsq;
	
	//console.log(inSqrtBracket);
	
	var sqrtResult = inSqrtBracket>0 ? Math.sqrt(inSqrtBracket): 0;	//TODO something else for 0 (no solution)
	//console.log(sqrtResult);
	
	for (var ii=0;ii<3;ii++){
		targetingResultOne[ii] = targetWorldFrame[ii]*(tDotV + sqrtResult) - playerVelVec[ii];
		targetingResultTwo[ii] = targetWorldFrame[ii]*(tDotV - sqrtResult) - playerVelVec[ii];
	}
	//check lengths of these = muzzle vel sq
	var targetingResultOneLengthSq = targetingResultOne.reduce((total, val) => total+ val*val, 0);
	var targetingResultTwoLengthSq = targetingResultTwo.reduce((total, val) => total+ val*val, 0);

	//select a result.
	//appears to in practice pick solution 2, which seems to be correct result
	//todo find if can just dump solution 1. 
	var selectedTargetingString;
	if (targetingResultOne[2]>0){
		selectedTargeting = targetingResultOne;
		selectedTargetingString = "ONE";
	}else if(targetingResultTwo[2]>0){
		selectedTargeting = targetingResultTwo;
		selectedTargetingString = "TWO";
	}else{
		selectedTargeting = "none";
		selectedTargetingString = "NONE";
	}
	//TODO check that angle isn't too extreme.
	
	//if (targetWorldFrame[2] > 0){	//behind player
	if (targetWorldFrame[2] > -0.85 ||	//appears to check that within a cone in front of player. works because this vector is was normalised 
										//is direction towards target)
		targetWorldFrame[3] < -0.5){	//exclude beyond some distance (w=1 close, w=-1 opposite side of 3-sphere)								
			selectedTargeting = "none";
			selectedTargetingString = "NONE";
	}
	
	if (logStuff){
		//console.log(targetingResultOneLengthSq);
		document.getElementById("info2").innerHTML = "lensqtwf: " + lensqtwf + "<br/>" +
										"targetWorldFrame[3]: " + targetWorldFrame[3] + "<br/>" +
										"sqrtResult: " + sqrtResult + "<br/>" +
										"targetingResultOneLengthSq: " + targetingResultOneLengthSq + "<br/>" +
										"targetingResultTwoLengthSq: " + targetingResultTwoLengthSq + "<br/>" +
										"selectedTargeting: " + selectedTargetingString;
	}
	
	//override original gun rotation code (todo delete previous/ option to disable/enable this correction)
	if (selectedTargeting!="none"){
		if (guiParams.target.type!="none" && guiParams["targeting"]!="off"){
			//rotvec = getRotBetweenMats(matrixForTargeting, targetMatrix);	//target in frame of spaceship.
			var pointingDir={x:selectedTargeting[0],y:selectedTargeting[1],z:selectedTargeting[2]};
			pointingDir = capGunPointing(pointingDir);					
			rotvec=getRotFromPointing(pointingDir);
			
			//override fireDirectionVec for hud purposes
			fireDirectionVec = [-pointingDir.x,-pointingDir.y,pointingDir.z].map(val=> val*muzzleVel); 
				//todo pointingdir simple vector!( not .x, .y, ,z)
			
				//redo adding player velocity (todo maybe combine with where do this elsewhere..)
				//ie guntargetingvec
				//todo solve targeting in mechanics loop - currently doing when drawing !!!!!!!!!!!!!!!!!!! stupid!
			fireDirectionVec = fireDirectionVec.map((val,ii) => val+playerVelVec[ii]);
				
		}
	}
	
	return {
		results:[targetingResultOne, targetingResultTwo],
		selected: selectedTargeting,
		rotvec:rotvec,
		targetWorldFrame:targetWorldFrame
	};
}