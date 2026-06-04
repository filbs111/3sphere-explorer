//var maxRandBoxes = 8192;
var maxRandBoxes = 128;	//tmp smaller to make startup faster?

function singleWorldSettings(worldSize, fogColor, atmosThickness, duocylinderModel, seaActive, seaLevel){
	return {
		worldSize,
		fogColor,
		atmosThickness,
		atmosContrast:20,
		spinRate:0,
		spin:0,
		duocylinderModel,
		seaActive,
		seaLevel,
		seaPeakiness:0
	};
}

var guiParams={
	worlds:[
		singleWorldSettings(1,'#2f9a16', 0.2, "procTerrain", false, 0),
		singleWorldSettings(1,'#7496a0', 0.2, "greebleTerrain", false, 0),
		singleWorldSettings(1,'#bbbbbb', 0.2, "none", true, -0.0022),
		singleWorldSettings(1,'#f0cd62', 0.2, "procTerrain", false, 0),
		singleWorldSettings(1,'#444444', 0.2, "none", false, 0),	//4
		singleWorldSettings(1,'#888888', 0.2, "none", false, 0),	//5
		singleWorldSettings(1,'#aaaaaa', 0.2, "none", false, 0),	//6
		singleWorldSettings(1,'#884444', 0.2, "none", false, 0),	//7
		singleWorldSettings(1,'#442222', 0.2, "none", false, 0),	//8
		singleWorldSettings(1,'#664444', 0.2, "none", false, 0),	//9
	],
	drawShapes:{
		boxes:{
		'y=z=0':false,	//x*x+w*w=1
		'x=z=0':false,	//y*y+w*w=1
		'x=y=0':false,	//z*z+w*w=1
		'x=w=0':false,
		'y=w=0':false,
		'z=w=0':false
		},
		pillars:false,
		bendyPillars:false,
		explodingBox:false,
		turretScale:5,
		viaduct: 'none'
	},
	'random boxes':{
		number:maxRandBoxes,	//note ui controlled value does not affect singleBuffer
		size:0.01,
		collision:false,
		drawType:'instanced speckles',
		numToMove:0
	},
	"player model":"convexHullTest",
	target:{
		type:"sphere",
		scale:0.02
	},
	"targeting":"on",
	playerLight:'#000000',
	control:{
		onRails:false,
		handbrake:false,
		spinCorrection:true,
		sriMechStr:0,
		smoothMouse:200
	},
	display:{
		cameraType:"far 3rd person",
		cameraAttachedTo:"player vehicle",
		cameraZoom:4,		//cameraZoom: 5.4 , uVarOne: 0.09 good for plane. 160 deg hFOV allegedly
		uVarOne:-0.1,
		cameraMoveSide:0,
		vFOV:"",
		hFOV:"",
		flipReverseCamera:false,	//flipped camera makes direction pointing behavour match forwards, but side thrust directions switched, seems less intuitive
		stereo3d:"off",
		eyeSepWorld:0.0001,	//half distance between eyes in game world
		eyeTurnIn:0.003,
		showHud:true,
		fisheyeEnabled:true,
		renderViaTexture:'blur-b-use-alpha',
		renderLastStage:'fxaa',
		drawTransparentStuff:true,
		voxNmapTest:false,	//just show normal map. more efficient pix shader than standard. for performance check
		terrainMapProject:false,
		texBias:0.0,
		zPrepass:false,	//currently applies only to 4vec objects (eg terrain), and only affect overdraw for that object. 
		perPixelLighting:true,
		atmosShader:"atmos",
		atmosThicknessMultiplier:'#88aaff',
		culling:true,
		useSpecular:true,
		specularStrength:0.5,
		specularPower:20.0,
		quadView:true,
		quadViewCulling:true,
		regularFisheye2:true,
		fFudge:4
	},
	map:{
		show:"off",
		viewDistance:4,
		bendFactor:0.35,
		tetrahedronism:1
	},
	reflector:{
		draw:'high',
		cmFacesUpdated:6,
		cubemapDownsize:'auto',
		mappingType:'screen space 2',
		isPortal:true,
		drawFrame:false,
		forceApproximation:false,
		test1:false
	},
	debug:{
		closestPoint:false,
		drawPlayerPosMarkers:false,
		drawExtraMarkers:false,
		closestPointNearby:false,
		buoys:false,
		nmapUseShader2:true,
		showSpeedOverlay:false,
		showGCInfo:false,
		emitFire:false,
		fireworks:false,
		textTextBox:false,
		showChullStats:false,	//convex hull collision stats
		bvhBoundingSpheres:false,
		worldCollisionTest1:"grid2OnlyOne",
		worldCollisionTest2:"sphere",
		worldBvhCollisionTestPlayer:true,
		timestep:10,
		useInitialCheckPossibles:true,
		chullCollisionApplyResponse:true,
		skipSatPlayerFaceTests:false,
		skipEdgeColAcc:true,	//suspect do want this
		skipEdgeCaseCheck:false,
		flickerPlayerDisplay:false,
		playerDustMotesFrames:false,
		drawDustMotes:true
	},
	hud:{
		test:false,
		portalMarkers:false,
		textWorldNum:true,
		flightDirection:false,
		fireDirection:true,
		bombMarkers:true,
		bombText:true,
	},
	audio:{
		volume:0.2,
	},
	normalMove:0
};

var guiSettingsForWorld = guiParams.worlds;

var settings = {
	playerBallRad:0.0015,
	playerBallRadPadded: 0.0025
}

function setupGui(){
    var gui = new dat.GUI();

    guiParams.control.lockPointer = function(){
		canvas.requestPointerLock();
		gui.close();
	}

	gui.addColor(guiParams, 'playerLight').onChange(function(color){
		setPlayerLight(color);
	});
	var drawShapesFolder = gui.addFolder('drawShapes');

	guiParams.worlds.forEach((world,nn)=>{
		var worldName = 'world'+nn;
		var worldFolder = drawShapesFolder.addFolder(worldName);
		worldFolder.addColor(world, 'fogColor').onChange(function(color){
			setFog(nn,color);
		});
		worldFolder.add(world, "atmosThickness", 0,20,0.05);
		worldFolder.add(world, "atmosContrast", -20,20,0.5);
		worldFolder.add(world, "duocylinderModel", [
			"grid","terrain","greebleTerrain","procTerrain",'voxTerrain','voxTerrain2','voxTerrain3','l3dt-brute','l3dt-blockstrips','none'] );
		worldFolder.add(world, "spinRate", -2.5,2.5,0.25);
		worldFolder.add(world, "seaActive" );
		worldFolder.add(world, "seaLevel", -0.02,0.02,0.0002);
		worldFolder.add(world, "seaPeakiness", 0.0,0.5,0.01);
	});

	var boxesFolder = drawShapesFolder.addFolder('boxes');
	for (shape in guiParams.drawShapes.boxes){
		console.log(shape);
		boxesFolder.add(guiParams.drawShapes.boxes, shape );
	}
	var randBoxesFolder = drawShapesFolder.addFolder("random boxes");
	randBoxesFolder.add(guiParams["random boxes"],"number",0,maxRandBoxes,8);
	randBoxesFolder.add(guiParams["random boxes"],"size",0.001,0.1,0.001);
	randBoxesFolder.add(guiParams["random boxes"],"collision");
	randBoxesFolder.add(guiParams["random boxes"],"drawType", [
		"singleBuffer",
		"indiv",
		"indivVsMatmult",
		"instancedArrays",
		"instancedArraysMenger",
		"instanced speckles"
	]);
	randBoxesFolder.add(guiParams["random boxes"],"numToMove", 0,maxRandBoxes,8);
	drawShapesFolder.add(guiParams.drawShapes,"pillars");
	drawShapesFolder.add(guiParams.drawShapes,"bendyPillars");
	drawShapesFolder.add(guiParams.drawShapes,"explodingBox");
	drawShapesFolder.add(guiParams.drawShapes,"turretScale",0.1,20.0,0.1);
	drawShapesFolder.add(guiParams.drawShapes,"viaduct", ['none','individual','instanced']);

	gui.add(guiParams,"player model", ["spaceship","plane","convexHullTest","ball"]);
	
	var targetFolder = gui.addFolder('target');
	targetFolder.add(guiParams.target, "type",["none", "sphere","box"]);
	targetFolder.add(guiParams.target, "scale",0.005,0.1,0.005);
	targetFolder.add(guiParams, "targeting", ["off","simple","individual"]);
	
	var controlFolder = gui.addFolder('control');	//control and movement
	controlFolder.add(guiParams.control, "onRails");
	controlFolder.add(guiParams.control, "handbrake");
	controlFolder.add(guiParams.control, "spinCorrection");
	controlFolder.add(guiParams.control, "sriMechStr",0,5,0.5);
	controlFolder.add(guiParams.control, 'lockPointer');
	controlFolder.add(guiParams.control, 'smoothMouse', 0, 1000,50);
	
	var displayFolder = gui.addFolder('display');	//control and movement
	displayFolder.add(guiParams.display, "cameraType", ["cockpit", "near 3rd person", "far 3rd person", "really far 3rd person", "side","none"]);
	displayFolder.add(guiParams.display, "cameraAttachedTo", ["player vehicle", "turret","none"]);	//"none" acts like drop camera
	displayFolder.add(guiParams.display, "cameraZoom", 1,10,0.05);
	displayFolder.add(guiParams.display, "uVarOne", -0.125,0,0.0025);
	displayFolder.add(guiParams.display, "cameraMoveSide", -0.002,0.002,0.00001);
	displayFolder.add(guiParams.display, "vFOV").listen();
	displayFolder.add(guiParams.display, "hFOV").listen();
	displayFolder.add(guiParams.display, "flipReverseCamera");
	displayFolder.add(guiParams.display, "stereo3d", ["off","sbs","sbs-cross","top-bottom","anaglyph","anaglyph-green/magenta"]);
	displayFolder.add(guiParams.display, "eyeSepWorld", -0.001,0.001,0.0001);
	displayFolder.add(guiParams.display, "eyeTurnIn", -0.01,0.01,0.0005);
	displayFolder.add(guiParams.display, "showHud");
	displayFolder.add(guiParams.display, "fisheyeEnabled");
	displayFolder.add(guiParams.display, "renderViaTexture", ['basic','blur','blur-b','blur-b-use-alpha','blur-big','2-pass-blur','1d-blur']);
	displayFolder.add(guiParams.display, "renderLastStage", ['simpleCopy','fxaa','fxaaSimple','showAlpha','dither']);
	displayFolder.add(guiParams.display, "drawTransparentStuff");
	displayFolder.add(guiParams.display, "voxNmapTest");
	displayFolder.add(guiParams.display, "terrainMapProject");
	displayFolder.add(guiParams.display, "texBias",-4.0,4.0,0.25);
	displayFolder.add(guiParams.display, "zPrepass");
	displayFolder.add(guiParams.display, "perPixelLighting");
	//displayFolder.add(guiParams.display, "atmosShader", ['constant','atmos','atmos_v1o','atmos_v2']);	//basic is constant (contrast=0) 
	displayFolder.addColor(guiParams.display, "atmosThicknessMultiplier").onChange(setAtmosThicknessMultiplier);
	displayFolder.add(guiParams.display, "culling");
	displayFolder.add(guiParams.display, "useSpecular");
	displayFolder.add(guiParams.display, "specularStrength", 0,1,0.05);	//currently diffuse colour and distance attenuation applies to both specular and diffuse, keeping nonnegative by having diffuse multiplier 1-specularStrength. therefore range 0-1. TODO different specular, diffuse colours, (instead of float strength), specular maybe shouldn't have distance attenuation same way - possibly correct for point source but want solution for sphere light...
	displayFolder.add(guiParams.display, "specularPower", 1,20,0.5);
	displayFolder.add(guiParams.display, "quadView");
	displayFolder.add(guiParams.display, "quadViewCulling");
	displayFolder.add(guiParams.display, "regularFisheye2");
	displayFolder.add(guiParams.display, "fFudge", 0.1,5,0.1);
	displayFolder.add(guiParams, "normalMove", 0,0.02,0.001);

	var mapFolder = gui.addFolder('map');
	mapFolder.add(guiParams.map, "show", ["off", "overlaid", "only map"]);
	mapFolder.add(guiParams.map, "viewDistance", 2,8,0.1);
	mapFolder.add(guiParams.map, "bendFactor", 0,1,0.05);
	mapFolder.add(guiParams.map, "tetrahedronism", 0,1,0.05);

	var debugFolder = gui.addFolder('debug');
	debugFolder.add(guiParams.debug, "closestPoint");
	debugFolder.add(guiParams.debug, "drawPlayerPosMarkers");
	debugFolder.add(guiParams.debug, "drawExtraMarkers");
	debugFolder.add(guiParams.debug, "closestPointNearby");
	debugFolder.add(guiParams.debug, "buoys");
	debugFolder.add(guiParams.debug, "nmapUseShader2");
	debugFolder.add(guiParams.debug, "showSpeedOverlay").onChange(() => {
		var ols = document.querySelector('#info2').style;
		console.log(ols);
		ols.display = (ols.display == 'block')? 'none':'block';
		});
	debugFolder.add(guiParams.debug, "showGCInfo").onChange(() => {
		var ols = document.querySelector('#info3').style;
		ols.display = (ols.display == 'block')? 'none':'block';
		});
	debugFolder.add(guiParams.debug, "emitFire");
	debugFolder.add(guiParams.debug, "fireworks");
	debugFolder.add(guiParams.debug, "textTextBox");
	debugFolder.add(guiParams.debug, "showChullStats");
	debugFolder.add(guiParams.debug, "bvhBoundingSpheres");
	debugFolder.add(guiParams.debug, "worldCollisionTest1", ["none", "worldBvh", "worldBvh2", "worldBvhHilbert", "grid", "grid2", "grid2OnlyOne"]);
	debugFolder.add(guiParams.debug, "worldCollisionTest2", ["none", "aabb", "sphere"]);
	debugFolder.add(guiParams.debug, "worldBvhCollisionTestPlayer");
	debugFolder.add(guiParams.debug, "timestep",2,40,1);
	debugFolder.add(guiParams.debug, "useInitialCheckPossibles");
	debugFolder.add(guiParams.debug, "chullCollisionApplyResponse");
	debugFolder.add(guiParams.debug, "skipSatPlayerFaceTests");
	debugFolder.add(guiParams.debug, "skipEdgeColAcc");
	debugFolder.add(guiParams.debug, "skipEdgeCaseCheck");
	debugFolder.add(guiParams.debug, "flickerPlayerDisplay");
	debugFolder.add(guiParams.debug, "playerDustMotesFrames");
	debugFolder.add(guiParams.debug, "drawDustMotes");

	var hudFolder = gui.addFolder('hud');
	hudFolder.add(guiParams.hud, "test");
	hudFolder.add(guiParams.hud, "portalMarkers");
	hudFolder.add(guiParams.hud, "textWorldNum");
	hudFolder.add(guiParams.hud, "flightDirection");
	hudFolder.add(guiParams.hud, "fireDirection");
	hudFolder.add(guiParams.hud, "bombMarkers");
	hudFolder.add(guiParams.hud, "bombText");

	var audioFolder = gui.addFolder('audio');
	audioFolder.add(guiParams.audio, "volume", 0,1,0.1).onChange(MySound.setGlobalVolume);
	MySound.setGlobalVolume(guiParams.audio.volume);	//if set above 1, fallback html media element will throw exception!!!
	
	var reflectorFolder = gui.addFolder('reflector');
	reflectorFolder.add(guiParams.reflector, "draw",["none","low","high","mesh"]);
	reflectorFolder.add(guiParams.reflector, "cmFacesUpdated", 0,6,1);
	reflectorFolder.add(guiParams.reflector, "cubemapDownsize", [0,1,2,3,'auto']);
	reflectorFolder.add(guiParams.reflector, "mappingType", ['projection', 'vertex projection','screen space','screen space 2','vertproj mix','depth to alpha copy']);
	reflectorFolder.add(guiParams.reflector, "isPortal");
	reflectorFolder.add(guiParams.reflector, "drawFrame");
	reflectorFolder.add(guiParams.reflector, "test1");
	reflectorFolder.add(guiParams.reflector, "forceApproximation");


    for (var ii=0;ii<guiParams.worlds.length;ii++){
		setFog(ii,guiSettingsForWorld[ii].fogColor);
	}
	setAtmosThicknessMultiplier(guiParams.display.atmosThicknessMultiplier);
	setPlayerLight(guiParams.playerLight);

    
    function setFog(world,color){
        var vec4Color = new Float32Array(4);
        vec4Color.set(colorArrFromUiString(color),0);
        vec4Color[3]=1;
        worldColorsPlain[world] = vec4Color;
        worldColors[world]=worldColorsPlain[world].map(function(elem){
            var withGamma =Math.pow(elem,2.2);
            return withGamma/(1.01-withGamma);	//undo tone mapping
        });
    }

	function setAtmosThicknessMultiplier(color){
		atmosThicknessMultiplier = colorArrFromUiString(color);
	}
	function setPlayerLight(color){
		var r = parseInt(color.substring(1,3),16) /255;
		var g = parseInt(color.substring(3,5),16) /255;
		var b = parseInt(color.substring(5,7),16) /255;
		playerLightUnscaled=new Float32Array([r,g,b]).map(function(elem){return Math.pow(elem,2.2)});	//apply gamma
	}
       
    function colorArrFromUiString(color){
        var r = parseInt(color.substring(1,3),16) /255;
        var g = parseInt(color.substring(3,5),16) /255;
        var b = parseInt(color.substring(5,7),16) /255;
        return new Float32Array([r,g,b]);
    }
}
