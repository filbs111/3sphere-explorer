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

function dropBomb(){
	var bombMat = mat4.create(sshipMatrix);
	xyzmove4mat(bombMat,[0,0,-0.0008]);
	launchProjectile(bombMat, [0,0,-0.01], true);
}

//now using bullets array to contain both bullets and bombs.
function launchProjectile(projectileMatrix, muzzleVelVec, isBomb){

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

	bullets.add({
		matrix:newBulletMatrix,
		vel:newFireDirectionVec,
		world:sshipWorld,
		isBomb,
		active:true}
	);

	matPool.destroy(relativeMatrix);
			
	//limit number of bullets
	if (bullets.size>200){
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
			new Explosion({matrix:gunMatrix,world:sshipWorld}, sshipModelScale*0.5, [0.06,0.06,0.06]);	//smoke/steam fx.
															//TODO emit from hot gun (continue after firing), lighting for smoke (don't see in dark) ...
															//TODO get correct world (which side of portal end of gun is in)
		}
	}
}


function createAutofire(callback, periodMillis){
    var timeRemaining = periodMillis;
    return function(condition, timepassed){
        timeRemaining-=timepassed;
        if (timeRemaining<0){
            timeRemaining=0;
            if (condition){
                callback();
                timeRemaining+=periodMillis;
            }else{
                timeRemaining=0;
            }
        }
    }
}