
var turret = (()=>{

    var modelScale = 0.001;
    var spin=0;
    var elev=0;
    
    var updateTracking = (matrixOfTarget, matrixOfTurretBase) => {

        //rotate to point towards player. TODO check matrix is player, not the camera!
        // NOTE this just serves to get the player position in the frame of the turret. Full 4x4 matrix rotation is not necessary,
        // only need the player position to be multiplied by the (inverse of the) turret matrix
        var playerInTurretBaseFrame = mat4.create(playerCamera);
        mat4.transpose(playerInTurretBaseFrame);
        mat4.multiply(playerInTurretBaseFrame, turretBaseMatrix);

        //var turretSpin = Math.atan2(playerInTurretBaseFrame[12],playerInTurretBaseFrame[13]);
        spin = Math.atan2(playerInTurretBaseFrame[3],playerInTurretBaseFrame[11]);
        var sidewaysLength = Math.sqrt(playerInTurretBaseFrame[3]*playerInTurretBaseFrame[3] + playerInTurretBaseFrame[11]*playerInTurretBaseFrame[11]);
        elev = Math.atan2(playerInTurretBaseFrame[7], sidewaysLength);

    };

    var setCameraToTurret = (cameraMat) => {
        setMat4FromToWithQuats(turretBaseMatrix, cameraMat);		
		xyzrotate4mat(cameraMat, [0,spin + Math.PI,0]);
		xyzrotate4mat(cameraMat, [elev,0,0]);
    }

    //TODO make shaderSetup, drawObjectFromBuffers2 global funcs? do something else not avoid just passing around funcs?
    var draw = (duocylinderSpin, shaderSetup, drawObjectFromBuffers2) => {
        var activeShaderProgram = shaderProgramTexmap;
        shaderSetup(activeShaderProgram, diffuseTexture);	//TODO different texture.
        mat4.set(invertedWorldCamera, mvMatrix);
        rotate4mat(mvMatrix, 0, 1, duocylinderSpin);
        mat4.multiply(mvMatrix,turretBaseMatrix);

        mat4.identity(mMatrix);rotate4mat(mMatrix, 0, 1, duocylinderSpin);
        mat4.multiply(mMatrix, turretBaseMatrix);

        gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale,modelScale/4,modelScale);	//base plate
        drawObjectFromBuffers2(cubeBuffers, activeShaderProgram);

        rotate4mat(mvMatrix, 2, 0, spin);
        rotate4mat(mMatrix, 2, 0, spin);

        gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/2,modelScale,modelScale/2);
        drawObjectFromBuffers2(cubeBuffers, activeShaderProgram);

        rotate4mat(mvMatrix, 1, 2, -elev);
        rotate4mat(mMatrix, 1, 2, -elev);
        
        gl.uniform3f(activeShaderProgram.uniforms.uModelScale, modelScale/8,modelScale/8,modelScale*2);	//gun
        drawObjectFromBuffers2(cubeBuffers, activeShaderProgram);
    }

    return {
        updateTracking,
        setCameraToTurret,
        draw
    }

})();
