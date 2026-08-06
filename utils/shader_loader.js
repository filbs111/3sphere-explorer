var getShaderFilePromise = (function(){
	var timestamp = Date.now();	//ensure getting up to date shaders. TODO use revision number instead,
	var fetchFilePromises = {};		//duplicate fetch requests expect should hit browser cache, but to be sure, just cache promises
	return function(id){
		//check for an existing promise
		fetchFilePromises[id] = fetchFilePromises[id] || 
			fetch("shaders/" + id+".glsl?cache-bust=" + timestamp).then(r=>r.text());
		return fetchFilePromises[id];
	}
})();

var getShaderUsingPromises = (function(){
	//just single file, but with defines
	var compileShaderPromises = {};

	return function(gl, id, shaderType, defines = []){	//TODO infer shaderType from -fs / -vs
		//add custom depth define if not already
		//requires support in shader code. not applicable to all shaders, but guess negligible cost
		// if (!defines.includes("CUSTOM_DEPTH")){
		// 	defines.push("CUSTOM_DEPTH");
		// }

		var idstring = id + ":" + defines.join(';');
		compileShaderPromises[idstring] = compileShaderPromises[idstring] || 
			getShaderFilePromise(id).then(shaderText=>{
				var str = "#version 300 es\n" + 	//in webgl2, should put this even before defines!
					defines.map(elem => "#define " + elem + "\n").join('') +
					"//" +	//comment out the "#version 300 es" in the shader file (useful there for IDE)
					shaderText;

				//console.log("got shader using promises!");
				//console.log(str);
				var shader = gl.createShader(shaderType);
				//console.log({shader});
				gl.shaderSource(shader, str);
				gl.compileShader(shader);

				
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
					alert(id + ":" + gl.getShaderInfoLog(shader));
					return null;
				}
				
				//appears to force waiting for completion of compile etc.
				//if don't call this, much faster (measured time, presumably continues to compile asynchronously)
				//TODO defer calling get compile status.

				return shader;
			});
		return compileShaderPromises[idstring];
	}
})();

//example usage: getShaderUsingPromises(gl,"fullscreen-fs", gl.FRAGMENT_SHADER, ["CUSTOM_DEPTH"]);

var shadersToGetLocationsForPromises = [];

function loadShader(vs_id,fs_id, vs_defines, fs_defines) {
	var shaderProgram = gl.createProgram();
	var vertShader = getShaderUsingPromises(gl,vs_id,gl.VERTEX_SHADER,vs_defines);
	var fragShader = getShaderUsingPromises(gl,fs_id,gl.FRAGMENT_SHADER,fs_defines);
	shadersToGetLocationsForPromises.push( Promise.all([vertShader,fragShader]).then(values=>{
		console.log("promise all returning");
		//console.log(values);
		var vertexShader = values[0];	//TODO deconstructing assignment
		var fragmentShader = values[1];
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
		return shaderProgram; 
	}));
	return shaderProgram;
}

// Create Uniform Buffer to store our data
var uboBuffer;
var uboBackingArray = new Float32Array(9*4);
var blank4VecForNoPortal = new Float32Array([0,0,0,1]);

/*
uniform Settings {
	vec4 uPlayerLightColor;
	vec4 uFogColor;
	vec4 uReflectorDiffColorAndCos;
	vec4 uReflectorDiffColorAndCos2;
	vec4 uReflectorDiffColorAndCos3;
	vec4 uReflectorPos;
	vec4 uReflectorPos2;
	vec4 uReflectorPos3;
	vec4 uDropLightPosn;
};
*/

function initialiseUbo(){	//to be called once gl initialised
    uboBuffer = gl.createBuffer();

	//block size etc in example is read from shader, but for now, just try assuming given shader code.
	var blockSize = 9*16;		//8x 4vec floats (16 bytes is 4 bytes per float)

	// Bind it to tell WebGL we are working on this buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);

    // Allocate memory for our buffer equal to the size of our Uniform Block
    // We use dynamic draw because we expect to respecify the contents of the buffer frequently
    gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);

    // Unbind buffer when we're done using it for now
    // Good practice to avoid unintentionally working on it
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

	// Bind the buffer to a binding point
	// Think of it as storing the buffer into a special UBO ArrayList
	// The second argument is the index you want to store your Uniform Buffer in
	// Let's say you have 2 unique UBO, you'll store the first one in index 0 and the second one in index 1
	gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboBuffer);
}

function setUboValsFromWorldSettings(wSettings){

	/*
		uniform Settings {
			vec4 uPlayerLightColor;
			vec4 uFogColor;
			vec4 uReflectorDiffColorAndCos;
			vec4 uReflectorDiffColorAndCos2;
			vec4 uReflectorDiffColorAndCos3;
			vec4 uReflectorPos;
			vec4 uReflectorPos2;
			vec4 uReflectorPos3;
		};
	*/

//uses code from function generalGetWorldSceneSettings(worldA, psides, otherWorlds)
 
	var blank4VecForNoPortal = [0,0,0,1];
	var valuesToSet = [
		[...playerLight,0], 
		wSettings.localVecFogColor,
		//[...wSettings.localVecFogColor],
		blank4VecForNoPortal, blank4VecForNoPortal, blank4VecForNoPortal,
		blank4VecForNoPortal, blank4VecForNoPortal, blank4VecForNoPortal
	];

	var infoForPortals = wSettings.infoForPortals;
	for (var ii=0;ii<infoForPortals.length;ii++){
		valuesToSet[2+ii] = [...infoForPortals[ii].localVecReflectorDiffColor, infoForPortals[ii].cosReflector];	//TODO don't create intermediate regular array - create float32array straight from world settings..
		valuesToSet[5+ii] = infoForPortals[ii].reflectorPosTransformed;
	}

	setUboVals(valuesToSet);
}

function setUboValsFromWorldSettingsFast(wSettings){
	uboBackingArray.set(playerLight, 0);
	//uboBackingArray[3]=0;
	uboBackingArray.set(wSettings.localVecFogColor, 4);

	var infoForPortals = wSettings.infoForPortals;
	for (var ii=0;ii<infoForPortals.length;ii++){
		uboBackingArray.set(infoForPortals[ii].localVecReflectorDiffColor , 8+ii*4);
		uboBackingArray[11+ii*4] = infoForPortals[ii].cosReflector;
		uboBackingArray.set(infoForPortals[ii].reflectorPosTransformed, 20+ii*4);
	}
	for (var ii=infoForPortals.length;ii<3;ii++){
		uboBackingArray.set(blank4VecForNoPortal, 8+ii*4);
		uboBackingArray.set(blank4VecForNoPortal, 20+ii*4);
	}

	uboBackingArray.set(wSettings.dropLightPos, 32);

	gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);

	// Push some data to our Uniform Buffer
	gl.bufferSubData(
		gl.UNIFORM_BUFFER,
		0,
		uboBackingArray
	);
}


function setUboVals(vec4arr){
	gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);

	for (var ii=0;ii<vec4arr.length;ii++){
		// Push some data to our Uniform Buffer
		gl.bufferSubData(
			gl.UNIFORM_BUFFER,
			16*ii,
			new Float32Array(vec4arr[ii])
		);
	}
}

function getLocationsForShadersUsingPromises(cb){
	//to be called some time after loadShader, when hope (!!) that attach, link etc have completed, because if they haven't this will block for whatever amount of time.
	//TODO is there some property to query for shader to say whether compilation, linking complete?
	// (webgl shaders don't have proper async - why would they? it's not like that's the way everything is done on the web.)
	// https://stackoverflow.com/questions/51710067/webgl-async-operations
	//TODO some more bodging to call one at a time and check that it didn't take too long, so will only block waiting for 1 shader.

	//for (var shaderProgramPromise of shadersToGetLocationsForPromises){
	Promise.all(shadersToGetLocationsForPromises.map(shaderProgramPromise=>{
		return shaderProgramPromise.then(shaderProgram=>{
			if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
				alert("Could not initialise shaders");
			}
			
			shaderProgram.uniforms={};
			shaderProgram.uniformCache={};	//TODO combo with uniforms? (same keys)
			shaderProgram.attributes={};
			
			var numActiveAttribs = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
			if (numActiveAttribs>0){
				for (var aa=0;aa<numActiveAttribs;aa++){
					var aName = gl.getActiveAttrib(shaderProgram,aa).name;
					shaderProgram.attributes[aName] = gl.getAttribLocation(shaderProgram, aName);
				}
			}
			shaderProgram.numActiveAttribs = numActiveAttribs;
			
			var numActiveUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
			if (numActiveUniforms>0){
				for (var uu=0;uu<numActiveUniforms;uu++){
					var activeUniform =  gl.getActiveUniform(shaderProgram,uu);
					var uName = activeUniform.name;
					var uType = activeUniform.type;
					shaderProgram.uniforms[uName] = gl.getUniformLocation(shaderProgram, uName);
					if (uType == gl.FLOAT_VEC4){
						//TODO is this doable without ifs? just get the current value?
						shaderProgram.uniformCache[uName] = new Float32Array([-1,-1,-1,-1]);
					}
				}
			}

			//do uniform buffer object stuff? 
			var uboIndex = gl.getUniformBlockIndex(shaderProgram, "Settings");
			if (uboIndex!=4294967295){
				console.log("found one! " + uboIndex);
			 	gl.uniformBlockBinding(shaderProgram, uboIndex, 0);
			}

		});
	})).then(()=>{cb()});
}



//var atmosVariants = ['CONSTANT','ONE','ONE_OLD','TWO'];
var atmosVariants = ['ONE'];	//disable variants to speed up loading
function genShaderVariants(name, vs_id, fs_id, vs_defines=[], fs_defines=[], usesVecAtmosThickness){
	var shaders = {};
	if (usesVecAtmosThickness){
		vs_defines.push('VEC_ATMOS_THICK');
		fs_defines.push('VEC_ATMOS_THICK');
	}
	vs_defines.push('CONST_ITERS 4.0');	//TODO compare. suspect that by shifting samples by 0.5 (0.5->n-0.5 instead of 0->n-1) might get decent approximation with few samples
								//effect with very few samples (even 2) looks OK, but might have edge cases. 
	
	//try deleting CUSTOM_DEPTH - use this to test if can get decent z-buffer performance (increase range without introducing z-fighting), without recourse to custom depth, by increasing depth buffer precision,
	/*
	var index = vs_defines.indexOf('CUSTOM_DEPTH');
	if (index > -1) {
	  vs_defines.splice(index, 1);
	}
	index = fs_defines.indexOf('CUSTOM_DEPTH');
	if (index > -1) {
	  fs_defines.splice(index, 1);
	}
	*/
	
	for (var variant of atmosVariants){
		var variantString = "ATMOS_"+variant;
		shaders[variant]=loadShader(vs_id, fs_id, vs_defines.concat(variantString), fs_defines.concat(variantString));
		shaders[variant].usesVecAtmosThickness = usesVecAtmosThickness;
	}
	//temp:
	shaders.constant = shaders.CONSTANT;
	shaders.atmos = shaders.ONE;
	shaders.atmos_v1o = shaders.ONE_OLD;
	shaders.atmos_v2 = shaders.TWO;
	
	return shaders;
};

function initShaders(shaderProgs){
	var initShaderTimeStart = performance.now();
	var shaderProgNoVariationsList = {
		fullscreenTextured:["fullscreen-vs", "fullscreen-fs"],	//NOTE this actually makes multiple samples. should it?
		fullscreenTexturedShowAlphaChan:["fullscreen-vs", "fullscreen-fs-showalpha"],
		fullscreenTexturedWithDepthmap:["fullscreen-vs", "fullscreen-with-depthmap-fs"],
		fullscreenTexturedFisheye:["fullscreen-vs", "fullscreen-fs-fisheye"],
		fullscreenTexturedFisheye2:["fullscreen-vs-quadview", "fullscreen-fs-fisheye2"],	//to make more similar to wide angle camera proj,	
			//for simpler diff to help porting of quadview

		fullscreenTexturedFisheyeQuadView:["fullscreen-vs-quadview", "fullscreen-fs-fisheye-quadview"],
		fullscreenTexturedAnaglyph:["fullscreen-vs", "fullscreen-fs-anaglyph"],
		fullscreenTexturedAnaglyphGm:["fullscreen-vs", "fullscreen-fs-anaglyph-greenmagenta"],
		fullscreenBennyBoxLite:["fullscreen-vs", "fullscreen-fs-bennybox-lite"],
		fullscreenBennyBox:["fullscreen-vs", "fullscreen-fs-bennybox"],		//https://www.youtube.com/watch?v=Z9bYzpwVINA
		fullscreenBlur:["fullscreen-vs", "fullscreen-fs-blur"],
		fullscreenBlurB:["fullscreen-vs", "fullscreen-fs-blur-b"],
		fullscreenBlurBUseAlpha:["fullscreen-vs", "fullscreen-fs-blur-b",[],['USE_ALPHA']],
		fullscreenBlurBig:["fullscreen-vs", "fullscreen-fs-blur-big"],
		fullscreenBlur1d:["fullscreen-vs", "fullscreen-fs-blur-1d"],
		fullscreenBlur1dDdx:["fullscreen-vs", "fullscreen-fs-blur-1d-ddx"],
		fullscreenDither:["fullscreen-vs", "fullscreen-fs-dither"],
		coloredPerVertex:["simple-vs", "simple-fs"],
		//coloredPerPixel:["perpixel-vs", "perpixel-fs"],		//unused
		coloredPerPixelTransparentDiscard:["perpixel-transparent-discard-vs", "perpixel-transparent-discard-fs",[],[]],
			//TODO fog variants, vector fog
		texmapPerVertex:["texmap-vs", "texmap-fs"],
		//texmapPerPixel:["texmap-perpixel-vs", "texmap-perpixel-fs"],
		zPrepass4Vec:["simple-nofog-vs-4vec", "simple-nofog-fs",[],[]],	//for z prepass. 
		decal:["decal-vs", "decal-fs"],
		decalSdf:["decal-vs", "decal-sdf-fs"],		
		billboardQuads:["simple-moving-billboard-vs", "very-simple-fs",['INSTANCE_COLOR'],['INSTANCE_COLOR']],
		terrain_l3dt_simple:["terrain-simple-vs", "terrain-textured-fs",["ATMOS_ONE",'CONST_ITERS 4.0'],[]],
		terrain_l3dt_morph_4d_eff:["terrain-morph-vs", "terrain-textured-fs",["ATMOS_ONE",'CONST_ITERS 4.0',"IS_4D"],[]],

		threeSpaceColored:["threespace-vs", "flatcolor-fs"],
		mapShaderTwo:["map-two-vs","flatcolor-fs"],
		mapShaderTwoVertColors:["map-two-vs","vertcolor-fs",["VERTCOLORS","DISCARD_OUTSIDE"],["DISCARD_OUTSIDE"]],
		mapTerrainShader:["map-terrain-vs","flatcolor-fs",[],["DISCARD_OUTSIDE"]],	//if have terrain stored "flat" not mapped onto duocylinder...
		mapTerrainVertColors:["map-terrain-vs","vertcolor-fs",["VERTCOLORS"],["DISCARD_OUTSIDE"]],

		wrappedDustMotes:["wrapped-dust-mote-vs", "very-simple-fs"],
	};

	var receiveShadowsString = "RECEIVE_SHADOW";	//set to "NOTHING" here to turn off

	var shaderProgWithVariationsList = {
		coloredPerPixelDiscard:["perpixel-discard-vs", "perpixel-discard-fs", [receiveShadowsString],['SPECULAR_ACTIVE', receiveShadowsString],true],	//used for teapots
		coloredPerPixelDiscardVertexColored:["perpixel-discard-vs", "perpixel-discard-fs", ['VERTCOLOR',receiveShadowsString],['VERTCOLOR','SPECULAR_ACTIVE',receiveShadowsString],true],	//used for mushrooms, lucy,
		coloredPerPixelDiscardVertexColoredEmit:["perpixel-discard-vs", "perpixel-discard-emit-fs", ['VERTCOLOR',receiveShadowsString],['VERTCOLOR',receiveShadowsString],true],
			//^^ note perpixel lighting is irrelevant because no effect of lights

		coloredPerPixelDiscardVertexColoredTexmap:["perpixel-discard-vs", "perpixel-discard-fs", ['VERTCOLOR','TEXMAP',receiveShadowsString],['VERTCOLOR','TEXMAP','SPECULAR_ACTIVE',receiveShadowsString],true],	//used for menger cube

		coloredPerPixelDiscardVertexColoredTexmapBendy:["perpixel-discard-vs", "perpixel-discard-fs", ['VS_MATMULT','VERTCOLOR','TEXMAP','BENDY_'],['VERTCOLOR','TEXMAP'],true],
		coloredPerPixelDiscardVertexColoredTexmapBendyInstanced:["perpixel-discard-vs", "perpixel-discard-fs", ['INSTANCED','VS_MATMULT','VERTCOLOR','TEXMAP','BENDY_'],['VERTCOLOR','TEXMAP'],true],
		coloredPerPixelDiscardVertexColoredInstanced:["perpixel-discard-vs", "perpixel-discard-fs", ['INSTANCED','VS_MATMULT','VERTCOLOR'],['VERTCOLOR'],true],
		coloredPerPixelDiscardBendy:["perpixel-discard-vs", "perpixel-discard-fs", ['BENDY_'],[],true],
		texmapPerPixelDiscard:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-fs", [],[],true],
		texmapPerPixelDiscardForText:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-text-fs", [],[],true],
		texmapPerPixelDiscardPhong:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-fs", [receiveShadowsString],['SPECULAR_ACTIVE',receiveShadowsString],true],
		texmapPerPixelDiscardPhongVsMatmult:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-fs", [receiveShadowsString, 'VS_MATMULT'],['SPECULAR_ACTIVE',receiveShadowsString],true],

		texmapPerPixelDiscardNormalmapV1:["texmap-perpixel-discard-normalmap-vs", "texmap-perpixel-discard-normalmap-fs", [],[],true],
		texmapPerPixelDiscardNormalmap:["texmap-perpixel-discard-normalmap-efficient-vs", "texmap-perpixel-discard-normalmap-efficient-fs", [],[],true],	
		texmapPerPixelDiscardNormalmapPhong:["texmap-perpixel-discard-normalmap-efficient-vs", "texmap-perpixel-discard-normalmap-efficient-fs", ['SPECULAR_ACTIVE'], ['SPECULAR_ACTIVE'],true],
		texmapPerPixelDiscardNormalmapPhongVsMatmult:["texmap-perpixel-discard-normalmap-efficient-vs", "texmap-perpixel-discard-normalmap-efficient-fs", ['VS_MATMULT','SPECULAR_ACTIVE'], ['SPECULAR_ACTIVE'],true],
		texmapPerPixelDiscardNormalmapPhongInstanced:["texmap-perpixel-discard-normalmap-efficient-vs", "texmap-perpixel-discard-normalmap-efficient-fs", ['INSTANCED','VS_MATMULT','SPECULAR_ACTIVE'], ['SPECULAR_ACTIVE'],true],
		
		texmapPerPixelDiscardAtmosGradLight:["texmap-perpixel-discard-vs", "texmap-perpixel-gradlight-discard-fs", [],[],true], 	//could do more work in vert shader currently because light calculated per vertex - could just pass channel weights to frag shader...
		
		texmapPerPixelDiscardExplode:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-fs", ['VERTVEL_ACTIVE'],[],true],			
		texmap4Vec:["texmap-vs-4vec", "texmap-fs", []],
		texmap4VecPerPixelDiscard:["texmap-perpixel-vs-4vec", "texmap-perpixel-discard-fs", [],[],true],
	
		texmap4VecPerPixelDiscardVcolor:["texmap-perpixel-vs-4vec", "texmap-perpixel-discard-fs", ['VCOLOR'],['VCOLOR'],true],
		texmap4VecPerPixelDiscardPhong:["texmap-perpixel-vs-4vec", "texmap-perpixel-discard-fs", [], ['SPECULAR_ACTIVE'],true],
		texmap4VecPerPixelDiscardPhongDepthAware:["texmap-perpixel-vs-4vec", "texmap-perpixel-discard-fs", ['DEPTH_AWARE'], ['SPECULAR_ACTIVE','DEPTH_AWARE'],true],
		
		texmap4VecPerPixelDiscardPhongVcolor:["texmap-perpixel-vs-4vec", "texmap-perpixel-discard-fs", ['VCOLOR',receiveShadowsString], ['VCOLOR','SPECULAR_ACTIVE',receiveShadowsString],true],
		texmap4VecPerPixelDiscardNormalmapAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", [],['DIFFUSE_TEX_ACTIVE'],true],
		texmap4VecPerPixelDiscardNormalmapPhongAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['SPECULAR_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE'],true],
		texmap4VecPerPixelDiscardNormalmapVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR'], ['DIFFUSE_TEX_ACTIVE','VCOLOR'],true],
		texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE'],true],
		
		//with shadow receiving...
		texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse2Tex:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", 
			['VCOLOR','SPECULAR_ACTIVE',receiveShadowsString], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','DOUBLE_TEXTURES',"CUSTOM_TEXBIAS",receiveShadowsString],true],
				//^^ appears to be used for procTerrain
		texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse2TexDepthAware:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", 
			['VCOLOR','SPECULAR_ACTIVE','DEPTH_AWARE',receiveShadowsString], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','DOUBLE_TEXTURES',"CUSTOM_TEXBIAS",'DEPTH_AWARE',receiveShadowsString],true],

		//noTexmap4VecPerPixelDiscardVcolorOnly:["perpixel-discard-vs-4vec", "perpixel-discard-fs", ['VERTCOLOR'], ['VERTCOLOR','SPECULAR_ACTIVE'],true],	//no specular?

		
		//voxTerrain shaders
		triplanarColor4Vec:["texmap-color-triplanar-vs-4vec", "texmap-triplanar-fs",[],[]],
		//triplanarPerPixel:["texmap-perpixel-color-triplanar-vs-4vec", "texmap-perpixel-triplanar-fs", ['VCOLOR','SPECULAR_ACTIVE'],['VCOLOR','SPECULAR_ACTIVE']],
		triplanarPerPixel:["texmap-perpixel-color-triplanar-vs-4vec", "texmap-perpixel-triplanar-fs", ['SPECULAR_ACTIVE'],['SPECULAR_ACTIVE']],	//like texmap4VecPerPixelDiscard - vertex position, normal are varyings, light positions are uniform
		//triplanarPerPixelTwo:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs-BASIC", ['VCOLOR','SPECULAR_ACTIVE'],['VCOLOR','SPECULAR_ACTIVE']],
		
		
		// without TRY_REPRODUCE_DEPTH
		// triplanarPerPixelTwoAndDiffuse:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs", ['DEPTH_DEBUG','SPECULAR_ACTIVE',receiveShadowsString],['DEPTH_DEBUG','DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE',receiveShadowsString],true],	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)	
		// triplanarPerPixelTwoAndDiffuseDepthAware:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs", ['DEPTH_DEBUG','SPECULAR_ACTIVE','DEPTH_AWARE'],['DEPTH_DEBUG','DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE','DEPTH_AWARE'],true],	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)

		//TRY_REPRODUCE_DEPTH added
		triplanarPerPixelTwoAndDiffuse:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs", ['DEPTH_DEBUG','SPECULAR_ACTIVE',receiveShadowsString],['TRY_REPRODUCE_DEPTH','DEPTH_DEBUG','DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE',receiveShadowsString],true],	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)	
		triplanarPerPixelTwoAndDiffuseDepthAware:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs", ['DEPTH_DEBUG','SPECULAR_ACTIVE','DEPTH_AWARE'],['TRY_REPRODUCE_DEPTH','DEPTH_DEBUG','DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE','DEPTH_AWARE'],true],	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)


	//	triplanarPerPixelTwoAndDiffuse:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs", [receiveShadowsString],['DIFFUSE_TEX_ACTIVE',receiveShadowsString],true],	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)	



		//procTerrain shaders
		texmap4VecMapproject:["texmap-vs-4vec", "texmap-fs", ['MAPPROJECT_ACTIVE'], ['MAPPROJECT_ACTIVE']],	//per vertex lighting
		texmap4VecMapprojectDiscardNormalmapVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','MAPPROJECT_ACTIVE'],true],	//per pixel tangent space lighting
		texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'],true],
		texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2Tex:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','DOUBLE_TEXTURES'],true],		
		texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2TexDepthAware:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','DEPTH_AWARE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','DOUBLE_TEXTURES','DEPTH_AWARE'],true],

		//sea shaders
		//duocylinderSeaPerPixelDiscard:["texmap-perpixel-vs-duocylinder-sea", "texmap-perpixel-discard-fs", [],[],true],
		duocylinderSeaPerPixelDiscardPhong:["texmap-perpixel-vs-duocylinder-sea", "texmap-perpixel-discard-fs", [], ['SPECULAR_ACTIVE','IS_SEA'],true],
		duocylinderSeaPerPixelDiscardPhongDepthAware:["texmap-perpixel-vs-duocylinder-sea", "texmap-perpixel-discard-fs", ['DEPTH_AWARE'], ['SPECULAR_ACTIVE','DEPTH_AWARE'],true],
		
		cubemap:[ "cubemap-vs", "cubemap-fs",[],[],true],
		vertprojCubemap:["cubemap-vs", "cubemap-fs", ['VERTPROJ'],[],true],
		vertprojCubemapTestDepthAlpha:["cubemap-vs", "cubemap-fs", ['VERTPROJ'],['GREY_ALPHA'],true],
		specialCubemap:["cubemap-vs", "cubemap-fs", ['VERTPROJ','SPECIAL'],['SPECIAL'],true],
			//try calculating using screen space coordinates, to work around buggy wobbly rendering close to portal.
			//initially use inefficient frag shader code to get screen coord, and solve problem of getting from screen coord to
			//correct pix value. if works, might move to using scaled homogeneous coords that linearly interpolate	on screen.
		specialCubemap2:["cubemap-vs", "cubemap-fs2", ['SPECIAL'],[],true],
		vertprojMix:["cubemap-vs", "cubemap-fs", ['VERTPROJ','SPECIAL'],['VPROJ_MIX'],true],		
	};

	initialiseUbo();

	Object.entries(shaderProgNoVariationsList).forEach(([key,value])=>{
		shaderProgs[key] = loadShader.apply(null, value);
	});
	Object.entries(shaderProgWithVariationsList).forEach(([key,value])=>{
		value.unshift(key)	//add key to start of args (this doesn't return altered value, so can't easily make one liner).
		shaderProgs[key] = genShaderVariants.apply(null, value);
	});

	//get locations later by calling getLocationsForShadersUsingPromises (when expect compiles/links to have completed)
	console.log("time to init shaders: " + ( performance.now() - initShaderTimeStart ) + "ms");
}
