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
		if (!defines.includes("CUSTOM_DEPTH")){
			defines.push("CUSTOM_DEPTH");
		}

		var idstring = id + ":" + defines.join(';');
		compileShaderPromises[idstring] = compileShaderPromises[idstring] || 
			getShaderFilePromise(id).then(shaderText=>{
				var str = defines.map(elem => "#define " + elem + "\n").join('') + shaderText;
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
					var uName = gl.getActiveUniform(shaderProgram,uu).name;
					shaderProgram.uniforms[uName] = gl.getUniformLocation(shaderProgram, uName);
				}
			}
		});
	})).then(()=>{cb()});
}



//var atmosVariants = ['CONSTANT','ONE','TWO'];
var atmosVariants = ['ONE'];	//disable variants to speed up loading
function genShaderVariants(vs_id, fs_id, vs_defines=[], fs_defines=[], usesVecAtmosThickness){
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
	//shaders.constant = shaders.CONSTANT;
	shaders.atmos = shaders.ONE;
	//shaders.atmos_v2 = shaders.TWO;
	
	return shaders;
};

function initShaders(shaderProgs){
	var initShaderTimeStart = performance.now();
	var shaderProgNoVariationsList = {
		fullscreenTextured:["fullscreen-vs", "fullscreen-fs"],
		fullscreenTexturedShowAlphaChan:["fullscreen-vs", "fullscreen-fs-showalpha"],
		fullscreenTexturedWithDepthmap:["fullscreen-vs", "fullscreen-with-depthmap-fs"],
		fullscreenTexturedFisheye:["fullscreen-vs", "fullscreen-fs-fisheye"],
		fullscreenBennyBoxLite:["fullscreen-vs", "fullscreen-fs-bennybox-lite"],
		fullscreenBennyBox:["fullscreen-vs", "fullscreen-fs-bennybox"],		//https://www.youtube.com/watch?v=Z9bYzpwVINA
		fullscreenBlur:["fullscreen-vs", "fullscreen-fs-blur"],
		fullscreenBlurB:["fullscreen-vs", "fullscreen-fs-blur-b"],
		fullscreenBlurBUseAlpha:["fullscreen-vs", "fullscreen-fs-blur-b",[],['USE_ALPHA']],
		coloredPerVertex:["simple-vs", "simple-fs"],
		//coloredPerPixel:["perpixel-vs", "perpixel-fs"],		//unused
		coloredPerPixelTransparentDiscard:["perpixel-transparent-discard-vs", "perpixel-transparent-discard-fs",[],[]],
			//TODO fog variants, vector fog
		texmapPerVertex:["texmap-vs", "texmap-fs"],
		//texmapPerPixel:["texmap-perpixel-vs", "texmap-perpixel-fs"],
		zPrepass4Vec:["simple-nofog-vs-4vec", "simple-nofog-fs",[],[]],	//for z prepass. 
		decal:["decal-vs", "decal-fs"],		
		billboardQuads:["simple-moving-billboard-vs", "very-simple-fs",['INSTANCE_COLOR'],['INSTANCE_COLOR']],
		terrain_l3dt_simple:["terrain-simple-vs", "terrain-textured-fs",["ATMOS_ONE",'CONST_ITERS 4.0'],[]],
		terrain_l3dt_morph_4d_eff:["terrain-morph-vs", "terrain-textured-fs",["ATMOS_ONE",'CONST_ITERS 4.0',"IS_4D"],[]],
	};
	var shaderProgWithVariationsList = {
		coloredPerPixelDiscard:["perpixel-discard-vs", "perpixel-discard-fs", [],[],true],
		coloredPerPixelDiscardBendy:["perpixel-discard-vs", "perpixel-discard-fs", ['BENDY_'],[],true],
		texmapPerPixelDiscard:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-fs", [],[],true],
		texmapPerPixelDiscardForText:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-text-fs", [],[],true],
		texmapPerPixelDiscardPhong:["texmap-perpixel-discard-vs", "texmap-perpixel-discard-fs", [],['SPECULAR_ACTIVE'],true],
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
		
		texmap4VecPerPixelDiscardPhongVcolor:["texmap-perpixel-vs-4vec", "texmap-perpixel-discard-fs", ['VCOLOR'], ['VCOLOR','SPECULAR_ACTIVE'],true],
		texmap4VecPerPixelDiscardNormalmapAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", [],['DIFFUSE_TEX_ACTIVE'],true],
		texmap4VecPerPixelDiscardNormalmapPhongAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['SPECULAR_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE'],true],
		texmap4VecPerPixelDiscardNormalmapVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR'], ['DIFFUSE_TEX_ACTIVE','VCOLOR'],true],
		texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE'],true],
		texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse2Tex:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','DOUBLE_TEXTURES',"CUSTOM_TEXBIAS"],true],
		texmap4VecPerPixelDiscardNormalmapPhongVcolorAndDiffuse2TexDepthAware:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','DEPTH_AWARE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','DOUBLE_TEXTURES',"CUSTOM_TEXBIAS",'DEPTH_AWARE'],true],

		//voxTerrain shaders
		triplanarColor4Vec:["texmap-color-triplanar-vs-4vec", "texmap-triplanar-fs",[],[]],
		//triplanarPerPixel:["texmap-perpixel-color-triplanar-vs-4vec", "texmap-perpixel-triplanar-fs", ['VCOLOR','SPECULAR_ACTIVE'],['VCOLOR','SPECULAR_ACTIVE']],
		triplanarPerPixel:["texmap-perpixel-color-triplanar-vs-4vec", "texmap-perpixel-triplanar-fs", ['SPECULAR_ACTIVE'],['SPECULAR_ACTIVE']],	//like texmap4VecPerPixelDiscard - vertex position, normal are varyings, light positions are uniform
		//triplanarPerPixelTwo:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs-BASIC", ['VCOLOR','SPECULAR_ACTIVE'],['VCOLOR','SPECULAR_ACTIVE']],
		triplanarPerPixelTwoAndDiffuse:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs", ['SPECULAR_ACTIVE'],['DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE'],true],	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)
		triplanarPerPixelTwoAndDiffuseDepthAware:["texmap-perpixel-normalmap-color-triplanar-vs-4vec", "texmap-perpixel-normalmap-triplanar-fs", ['SPECULAR_ACTIVE','DEPTH_AWARE'],['DIFFUSE_TEX_ACTIVE','SPECULAR_ACTIVE','DEPTH_AWARE'],true],	//calculate vertexMatrix, get light positions in this frame (light positions are varyings)
		

		//procTerrain shaders
		texmap4VecMapproject:["texmap-vs-4vec", "texmap-fs", ['MAPPROJECT_ACTIVE'], ['MAPPROJECT_ACTIVE']],	//per vertex lighting
		texmap4VecMapprojectDiscardNormalmapVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','MAPPROJECT_ACTIVE'],true],	//per pixel tangent space lighting
		texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'],true],
		texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2Tex:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','DOUBLE_TEXTURES'],true],		
		texmap4VecMapprojectDiscardNormalmapPhongVcolorAndDiffuse2TexDepthAware:["texmap-perpixel-normalmap-vs-4vec", "texmap-perpixel-discard-normalmap-efficient-fs", ['VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','DEPTH_AWARE'], ['DIFFUSE_TEX_ACTIVE','VCOLOR','SPECULAR_ACTIVE','MAPPROJECT_ACTIVE','DOUBLE_TEXTURES','DEPTH_AWARE'],true],

		//sea shaders
		//duocylinderSea:["texmap-vs-duocylinder-sea", "texmap-fs", []],
		//duocylinderSeaPerPixelDiscard:["texmap-perpixel-vs-duocylinder-sea", "texmap-perpixel-discard-fs", [],[],true],
		duocylinderSeaPerPixelDiscardPhong:["texmap-perpixel-vs-duocylinder-sea", "texmap-perpixel-discard-fs", [], ['SPECULAR_ACTIVE','IS_SEA'],true],
		duocylinderSeaPerPixelDiscardPhongDepthAware:["texmap-perpixel-vs-duocylinder-sea", "texmap-perpixel-discard-fs", ['DEPTH_AWARE'], ['SPECULAR_ACTIVE','DEPTH_AWARE'],true],
		
		cubemap:[ "cubemap-vs", "cubemap-fs",[],[],true],
		vertprojCubemap:["cubemap-vs", "cubemap-fs", ['VERTPROJ'],[],true],
		vertprojCubemapTestDepthAlpha:["cubemap-vs", "cubemap-fs", ['VERTPROJ'],['GREY_ALPHA'],true],
		specialCubemap:["cubemap-vs", "cubemap-fs", ['VERTPROJ','SPECIAL'],['SPECIAL'],true],		//try calculating using screen space coordinates, to work around buggy wobbly rendering close to portal. initially use inefficient frag shader code to get screen coord, and solve problem of getting from screen coord to correct pix value. if works, might move to using scaled homogeneous coords that linearly interpolate	on screen. 	
		vertprojMix:["cubemap-vs", "cubemap-fs", ['VERTPROJ','SPECIAL'],['VPROJ_MIX'],true],		
	};

	Object.entries(shaderProgNoVariationsList).forEach(([key,value])=>{
		shaderProgs[key] = loadShader.apply(null, value);
	});
	Object.entries(shaderProgWithVariationsList).forEach(([key,value])=>{
		shaderProgs[key] = genShaderVariants.apply(null, value);
	});

	//get locations later by calling getLocationsForShadersUsingPromises (when expect compiles/links to have completed)
	console.log("time to init shaders: " + ( performance.now() - initShaderTimeStart ) + "ms");
}