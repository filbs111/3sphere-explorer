var debugDraw = (function(){

    var nummats = 7;
    var mats = [nummats];
    for (var ii=0;ii<nummats;ii++){
        mats[ii] = mat4.identity();
    }

    function drawTestCubeForMatrixColorAndScale(mat, cubeColor, scale){
        mat4.set(invertedWorldCamera, mvMatrix);
        mat4.multiply(mvMatrix, mat);
        mat4.set(mat, mMatrix);
        gl.uniform4fv(shaderProgramTexmap.uniforms.uColor, cubeColor);
        gl.uniform3f(shaderProgramTexmap.uniforms.uModelScale, scale, scale, scale);
        drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
    }
    function drawTriAxisCross(scale){
        var smallScale = scale/20;
        gl.uniform3f(shaderProgramTexmap.uniforms.uModelScale, smallScale,smallScale,scale);
        drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
        gl.uniform3f(shaderProgramTexmap.uniforms.uModelScale, smallScale,scale,smallScale);
        drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
        gl.uniform3f(shaderProgramTexmap.uniforms.uModelScale, scale,smallScale,smallScale);
        drawObjectFromPreppedBuffers(cubeBuffers, shaderProgramTexmap);
    };
    function drawTriAxisCrossForMatrix(mat){
        drawTriAxisCrossForMatrixColorAndScale(mat, colorArrs.gray, 0.05);
    }
    function drawTriAxisCrossForMatrixColorAndScale(mat, crossColor, scale){
        gl.uniform4fv(shaderProgramTexmap.uniforms.uColor, crossColor);
        mat4.set(invertedWorldCamera, mvMatrix);
        mat4.multiply(mvMatrix, mat);
        mat4.set(mat, mMatrix);
        drawTriAxisCross(scale);
    }
    // function drawTriAxisCrossForPosition(posn){
    //     drawTriAxisCrossForMatrix(matForPos(posn));
    // }

    function drawDebugStuff(){
        var testObjScale=0.001;
		drawTriAxisCrossForMatrixColorAndScale(debugDraw.mats[0], colorArrs.cyan, testObjScale*20);
		
		//object centred on object colliding with to see if anything happening!
		drawTestCubeForMatrixColorAndScale(debugDraw.mats[1], colorArrs.magenta, 2*testObjScale);

		//object shifted by normal
		drawTestCubeForMatrixColorAndScale(debugDraw.mats[2], colorArrs.green, 2*testObjScale);

		//try to get something drawing at colliding object, relative to
		drawTriAxisCrossForMatrixColorAndScale(debugDraw.mats[3], colorArrs.blue, 0.02);
		drawTriAxisCrossForMatrixColorAndScale(debugDraw.mats[4], colorArrs.red, 0.02);

		//terrain nearest point
		drawTriAxisCrossForMatrixColorAndScale(debugDraw.mats[5], colorArrs.red, 0.02);

        //menger sponge
        drawTriAxisCrossForMatrixColorAndScale(debugDraw.mats[6], colorArrs.red, 0.01);
    }
    
    return {
        mats,
        drawDebugStuff
    }
})();