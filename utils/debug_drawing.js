var debugDraw = (function(){
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
    
    return {
        drawTestCubeForMatrixColorAndScale,
        drawTriAxisCrossForMatrixColorAndScale
    }
})();