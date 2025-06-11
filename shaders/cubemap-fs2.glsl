#version 300 es
	precision mediump float;
	uniform samplerCube uSampler;
	in vec3 vPos;
#ifdef VEC_ATMOS_THICK
	in vec3 fog;
#else	
	in float fog;
#endif
	uniform vec4 uColor;	//TODO remove? (should be white, but useful to tint for debug/ coloured reflector)
	uniform vec4 uFogColor;
	uniform float uPortalRad;
	uniform vec4 uPortalCameraPos;	//for "special" 
	in vec4 vInterpCoords;
	uniform mat4 uMVMatrixFSCopy;
	uniform vec3 uCentrePosScaledFSCopy;
	uniform mat4 uPortaledMatrix;

	uniform float uPolarityFSCopy;


out vec4 fragColor;

	void main(void) {

		vec4 position = vec4(vec3(0.),1.);									//for camera in camera space
		vec4 pointingDirection = normalize(-vInterpCoords);
		
		//convert these into portal space. TODO do this in vertex shader and benefit from interpolation
		vec4 posA = position * uMVMatrixFSCopy;		//this is posA in main.js:testRayBallCollision
		vec4 posB = pointingDirection * uMVMatrixFSCopy;	//posB in ""
	
		float maxwsq = posA.w*posA.w + posB.w*posB.w;
		float radsq = uPortalRad*uPortalRad;
		float critwsq = 1./(1.+radsq);
		
		if (maxwsq<critwsq){
			discard;
		}
		
		//float invmaxw = 1./sqrt(maxwsq);
		vec4 closeApproachTimesMaxW = (posA*posA.w + posB*posB.w);	//TODO combo mult by invmaxw here and later
		vec4 equatorVecTimesMaxW = -(posB*posA.w - posA*posB.w);

		float correctionTimesMaxW = sqrt( maxwsq*radsq - (1.-maxwsq) );

		vec4 collisonPoint = (closeApproachTimesMaxW - correctionTimesMaxW*equatorVecTimesMaxW);	///maxwsq;

		//simple test
		//vec3 scaledPoint = 10.*(normalize(-collisonPoint.xyz)+1.);
		//scaledPoint = scaledPoint - floor(scaledPoint);
		//vec3 preGammaFragColor = scaledPoint;	//looks solid!

	
//=======================
		//no mix version
		//vec3 preGammaFragColor = pow(texture(uSampler, normalize(-collisonPoint.xyz) - uCentrePosScaledFSCopy).xyz,vec3(2.2));

	//vec3 cubeFragCoords = normalize(-collisonPoint.xyz) - uCentrePosScaledFSCopy;


		//mix with simple planar (avoids wobbles at close range)
		vec4 simplePlanarPortalDir = pointingDirection*uPortaledMatrix;
		float closeness = dot(uCentrePosScaledFSCopy,uCentrePosScaledFSCopy);	//something that goes to 1 in shaky regime, 0 outside
		closeness = pow(closeness,80.);
		vec3 cubeFragCoords = normalize(-collisonPoint.xyz) - uCentrePosScaledFSCopy - 0.05*closeness*simplePlanarPortalDir.xyz;
				//simplePlanar will become dominant when other term small
		
		vec4 fragColorRGBA = texture(uSampler, uPolarityFSCopy*cubeFragCoords);
		vec3 preGammaFragColor =  pow(fragColorRGBA.xyz,vec3(2.2));
//===============



		float deep = .3183*acos( dot(normalize(posA), normalize(collisonPoint)) );

		//undo tone mapping . y=1/(1+x) => x=y/(1-y)
		//seems like in practice, undoing, redoing tone mapping has little value, but guess because currently not using very bright lighting.
		//TODO check whether still need this - 
		
		vec3 preToneMap = preGammaFragColor / (1.001 - preGammaFragColor);	//using 1.001 instead of 1 to prevent /0 problems
		//preToneMap = vec3(fog)*uColor.xyz*preToneMap + (1.0-fog)*uFogColor.xyz;
		preToneMap = fog*uColor.xyz*preToneMap + (1.0-fog)*uFogColor.xyz;
		
		//reapply tone mapping
		preGammaFragColor = preToneMap/(1.+preToneMap);
		
		fragColor = vec4( pow(preGammaFragColor, vec3(0.455)), fragColorRGBA.a);	//copy depth info from alpha channel
		


		gl_FragDepth = deep;
}
