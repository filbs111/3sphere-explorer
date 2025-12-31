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

	var target = towardsTargetAcceleration ? {matrix:targetMatrix, world: 2} : null;

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