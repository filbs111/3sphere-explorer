#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	uniform samplerCube uSampler;
	varying vec3 vPos;
#ifdef VEC_ATMOS_THICK
	varying vec3 fog;
#else	
	varying float fog;
#endif
	uniform vec4 uColor;	//TODO remove? (should be white, but useful to tint for debug/ coloured reflector)
	uniform vec4 uFogColor;
	uniform float uPortalRad;
	varying vec3 vScreenSpaceCoord;
	uniform vec4 uPortalCameraPos;	//for "special" 
	uniform vec2 uFNumber;
	uniform mat4 uMVMatrixFSCopy;
	uniform vec3 uCentrePosScaledFSCopy;
	uniform mat4 uPortaledMatrix;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
	void main(void) {
		//gl_FragColor = uColor*textureCube(uSampler, vPos);	//TODO use this (get rid of fog)

#ifndef SPECIAL
#ifndef VPROJ_MIX
		vec3 preGammaFragColor = pow(textureCube(uSampler, vPos).xyz,vec3(2.2));
#else
		vec2 interpCoords = vScreenSpaceCoord.xy/vScreenSpaceCoord.z;
		vec4 pointingDirection = normalize(vec4(-uFNumber*interpCoords,1.,0.));

		//a simpler bodge might be to just use simple "movement" of camera thru portal where close to it (shaky regime). blend between the two.
		vec4 simplePlanarPortalDir = pointingDirection*uPortaledMatrix;
		
		float closeness = dot(uCentrePosScaledFSCopy,uCentrePosScaledFSCopy);	//something that goes to 1 in shaky regime, 0 outside
		closeness = pow(closeness,6.);
		vec3 preGammaFragColor = pow(textureCube(uSampler, vPos - 0.05*closeness*simplePlanarPortalDir.xyz).xyz,vec3(2.2));	//simplePlanar will become dominant when other term small
#endif
#else
		//preGammaFragColor.rg*=0.5*(1.+sin(10.*vScreenSpaceCoord));
		vec2 interpCoords = vScreenSpaceCoord.xy/vScreenSpaceCoord.z;
		vec2 portalCameraCoords = uPortalCameraPos.xy/uPortalCameraPos.z;	//calculating from uniform every pixel is bad!
		vec2 screenDifference = uFNumber*interpCoords + portalCameraCoords;
		
		vec4 position = vec4(vec3(0.),1.);									//for camera in camera space
		vec4 pointingDirection = normalize(vec4(-uFNumber*interpCoords,1.,0.));
		
		//convert these into portal space. TODO do this in vertex shader and benefit from interpolation
		vec4 posA = position * uMVMatrixFSCopy;		//this is posA in main.js:testRayBallCollision
		vec4 posB = pointingDirection * uMVMatrixFSCopy;	//posB in ""
	
		float maxwsq = posA.w*posA.w + posB.w*posB.w;
		float radsq = uPortalRad*uPortalRad;
		float critwsq = 1./(1.+radsq);
		
		if (maxwsq<critwsq){
			discard;
		}
		
		float invmaxw = 1./sqrt(maxwsq);
		vec4 closeApproach = invmaxw * (posA*posA.w + posB*posB.w);	//TODO combo mult by invmaxw here and later
		vec4 equatorVec = - invmaxw * (posB*posA.w - posA*posB.w);

		float projectedradiussq = (1.-maxwsq)/maxwsq;
		float correction = sqrt( radsq - projectedradiussq );
		vec4 collisonPoint = invmaxw*closeApproach - correction*equatorVec;

		//simple test
		vec3 scaledPoint = 10.*(normalize(-collisonPoint.xyz)+1.);
		scaledPoint = scaledPoint - floor(scaledPoint);
	//	vec3 preGammaFragColor = scaledPoint;	//looks solid!

		//no mix version
	//	vec3 preGammaFragColor = pow(textureCube(uSampler, normalize(-collisonPoint.xyz) - uCentrePosScaledFSCopy).xyz,vec3(2.2));

		//mix with simple planar (avoids wobbles at close range)
		vec4 simplePlanarPortalDir = pointingDirection*uPortaledMatrix;
		float closeness = dot(uCentrePosScaledFSCopy,uCentrePosScaledFSCopy);	//something that goes to 1 in shaky regime, 0 outside
		closeness = pow(closeness,6.);
		vec3 preGammaFragColor = pow(textureCube(uSampler, normalize(-collisonPoint.xyz) - uCentrePosScaledFSCopy - 0.05*closeness*simplePlanarPortalDir.xyz).xyz,vec3(2.2));	//simplePlanar will become dominant when other term small


#endif
		
		//undo tone mapping . y=1/(1+x) => x=y/(1-y)
		//seems like in practice, undoing, redoing tone mapping has little value, but guess because currently not using very bright lighting.
		//TODO check whether still need this - 
		
		vec3 preToneMap = preGammaFragColor / (1.001 - preGammaFragColor);	//using 1.001 instead of 1 to prevent /0 problems
		//preToneMap = vec3(fog)*uColor.xyz*preToneMap + (1.0-fog)*uFogColor.xyz;
		preToneMap = fog*uColor.xyz*preToneMap + (1.0-fog)*uFogColor.xyz;
		
		//reapply tone mapping
		preGammaFragColor = preToneMap/(1.+preToneMap);
		
		gl_FragColor = vec4( pow(preGammaFragColor, vec3(0.455)) , 1.0);
		
#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
		//vec2 normZW= normalize(vZW);
		//gl_FragDepthEXT = .5*(normZW.x/normZW.y) + .5;
#endif
}

//simple cubemap pix shader