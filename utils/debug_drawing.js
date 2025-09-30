var debugDraw = (function(){

    var nummats = 10;
    var mats = new Array(nummats);
    for (var ii=0;ii<nummats;ii++){
        mats[ii] = mat4.identity();
    }

    var numTestPoints = 50;
    var nextTestPoint = 0;
    var testPoints = [];
    for (var ii=0;ii<numTestPoints;ii++){
        testPoints[ii] = {mat:mat4.identity(), color:[0,0,0]};
    }
    function addTestPoint(mat, color){
        var testPoint = testPoints[nextTestPoint];
        mat4.set(mat, testPoint.mat);
        testPoint.color = color;
        nextTestPoint = (nextTestPoint+1)%numTestPoints;
    }


    //additional markers using a pool of mats. 
    //TODO use system like this for other points.
    //TODO ensure stay within limit! NOTE quite a lot here AFAIK since resetting to 0 then drawing markers for multiple phys steps. TODO reset more often!
    var numExtraMarkers=0;
    var extraMarkerPoolSize=200;
    var extraMarkerPool=[];
    for (var ee=0;ee<extraMarkerPoolSize;ee++){
        extraMarkerPool.push({mat:mat4.identity()});
    }

    function drawTestCubeForMatrixColorAndScale(mat, cubeColor, scale){
        mat4.set(invertedWorldCamera, mvMatrix);
        mat4.multiply(mvMatrix, mat);
        mat4.set(mat, mMatrix);
        uniform4fvSetter.setIfDifferent(shaderProgramTexmap, "uColor", cubeColor);
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
        uniform4fvSetter.setIfDifferent(shaderProgramTexmap, "uColor", crossColor);
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

        //triangle objs
        drawTriAxisCrossForMatrixColorAndScale(debugDraw.mats[8], 
            [colorArrs.red,colorArrs.green,colorArrs.blue][triObjClosestPointType], 0.01);

        drawTriAxisCrossForMatrixColorAndScale(debugDraw.mats[9], 
            [colorArrs.red,colorArrs.green,colorArrs.blue][triObjClosestPointType], 0.01);
    }

    function drawPlayerPosMarkers(){
        testPoints.forEach(tp => {
            drawTriAxisCrossForMatrixColorAndScale(tp.mat, tp.color, 0.001);
        });
    }

    function drawExtraMarkers(){
        console.log("drawing " + numExtraMarkers + "extra markers");
        for (var mm=0;mm<numExtraMarkers;mm++){
            var thisMarker = extraMarkerPool[mm];
            drawTriAxisCrossForMatrixColorAndScale(thisMarker.mat, thisMarker.color, thisMarker.size);
        }
    }
    
    function addExtraMarker(mat, size, color){
        var thisMarker = extraMarkerPool[numExtraMarkers++];
        mat4.set(mat, thisMarker.mat);
        thisMarker.size = 500*size;
        thisMarker.color = color;
    }

    function removeExtraMarkers(){
        numExtraMarkers=0;
    }

    return {
        mats,
        drawDebugStuff,
        drawTriAxisCrossForMatrixColorAndScale,
        addTestPoint,
        drawPlayerPosMarkers,
        addExtraMarker,
        removeExtraMarkers,
        drawExtraMarkers
    }
})();