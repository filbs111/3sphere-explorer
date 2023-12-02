
//draw a 8-cell net - like a cube net, that = 8-cell for scale=1, still shows as joined up cubes when scaled small
//don't bother with culling. only intended to help explain project

var draw8cellnet = (function(){

    var cubes = [
        [0,0,0],
        [0,0,1],
        [0,0,-1],
        [0,1,0],
        [0,-1,0],
        [1,0,0],
        [-1,0,0],
        [0,0,2]
    ];

    var colors = [
        colorArrs.white,
        colorArrs.red,
        colorArrs.cyan,
        colorArrs.green,
        colorArrs.magenta,
        colorArrs.blue,
        colorArrs.yellow,
        colorArrs.black
    ]

    return function(activeShaderProgram, modelScale){
		prepBuffersForDrawing(cubeFrameSubdivBuffers, activeShaderProgram);
        var moveAmount = 2.0*Math.atan(modelScale);
        for (var ii=0;ii<8;ii++){
            mat4.identity(mMatrix);
		    mat4.set(invertedWorldCamera, mvMatrix);
            uniform4fvSetter.setIfDifferent(activeShaderProgram, "uColor", colors[ii]);
            xyzmove4mat(mvMatrix, cubes[ii].map(x=>x*moveAmount));
            drawObjectFromPreppedBuffers(cubeFrameSubdivBuffers, activeShaderProgram);
        }
    }

})();