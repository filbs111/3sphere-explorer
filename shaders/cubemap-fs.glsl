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
	in vec4 vInterpCoords;	//4th component always 0 but makes code simpler
	uniform mat4 uMVMatrixFSCopy;
	uniform vec3 uCentrePosScaledFSCopy;
	uniform mat4 uPortaledMatrix;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
	in vec4 vP;
#endif

out vec4 fragColor;

	void main(void) {
		//fragColor = uColor*texture(uSampler, vPos);	//TODO use this (get rid of fog)

#ifndef SPECIAL
#ifndef VPROJ_MIX
		vec3 cubeFragCoords = vPos;
#else
		vec4 pointingDirection = normalize(-vInterpCoords);

		//a simpler bodge might be to just use simple "movement" of camera thru portal where close to it (shaky regime). blend between the two.
		vec4 simplePlanarPortalDir = pointingDirection*uPortaledMatrix;
		
		float closeness = dot(uCentrePosScaledFSCopy,uCentrePosScaledFSCopy);	//something that goes to 1 in shaky regime, 0 outside
		closeness = 1.-500.*(1.-closeness);	//TODO input blending factor instead of calculating every fragment!
		closeness = max(closeness,0.);

		vec3 cubeFragCoords = vPos*(1.0-closeness) - closeness*simplePlanarPortalDir.xyz;	//simplePlanar will become dominant when other term small
#endif
#else
		//preGammaFragColor.rg*=0.5*(1.+sin(10.*vScreenSpaceCoord));
	//	vec2 portalCameraCoords = uPortalCameraPos.xy/uPortalCameraPos.z;	//calculating from uniform every pixel is bad!
	//	vec2 screenDifference = uFNumber*interpCoords + portalCameraCoords;
		
		vec4 position = vec4(vec3(0.),1.);									//for camera in camera space
		vec4 pointingDirection = normalize(-vInterpCoords);	//TODO why no -ve sign? different to VPROJ_MIX version...
		
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
		vec3 scaledPoint = 10.*(normalize(-collisonPoint.xyz)+1.);
		scaledPoint = scaledPoint - floor(scaledPoint);
	//	vec3 preGammaFragColor = scaledPoint;	//looks solid!

		//no mix version
	//	vec3 preGammaFragColor = pow(texture(uSampler, normalize(-collisonPoint.xyz) - uCentrePosScaledFSCopy).xyz,vec3(2.2));

		//mix with simple planar (avoids wobbles at close range)
		vec4 simplePlanarPortalDir = pointingDirection*uPortaledMatrix;
		float closeness = dot(uCentrePosScaledFSCopy,uCentrePosScaledFSCopy);	//something that goes to 1 in shaky regime, 0 outside
		closeness = pow(closeness,80.);
		vec3 cubeFragCoords = normalize(-collisonPoint.xyz) - uCentrePosScaledFSCopy - 0.05*closeness*simplePlanarPortalDir.xyz;
				//simplePlanar will become dominant when other term small
#endif
		
		vec4 fragColorRGBA = texture(uSampler, cubeFragCoords);
		vec3 preGammaFragColor =  pow(fragColorRGBA.xyz,vec3(2.2));

		//undo tone mapping . y=1/(1+x) => x=y/(1-y)
		//seems like in practice, undoing, redoing tone mapping has little value, but guess because currently not using very bright lighting.
		//TODO check whether still need this - 
		
		vec3 preToneMap = preGammaFragColor / (1.001 - preGammaFragColor);	//using 1.001 instead of 1 to prevent /0 problems
		//preToneMap = vec3(fog)*uColor.xyz*preToneMap + (1.0-fog)*uFogColor.xyz;
		preToneMap = fog*uColor.xyz*preToneMap + (1.0-fog)*uFogColor.xyz;
		
		//reapply tone mapping
		preGammaFragColor = preToneMap/(1.+preToneMap);
		
		fragColor = vec4( pow(preGammaFragColor, vec3(0.455)), fragColorRGBA.a);	//copy depth info from alpha channel
		
#ifdef GREY_ALPHA
	    fragColor = vec4(vec3(fragColorRGBA.a),1.0);
#endif

#ifdef CUSTOM_DEPTH
		// here x=w, y=z, but also confusingly switched by pMatrix ! 
		//TODO if this works, don't bother creating vZW in vert shader.
	//	if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
	//	gl_FragDepth = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;

	gl_FragDepth = -.3183*atan(vP.w/length(vP.xyz)) + .5;
#endif
}

//simple cubemap pix shader