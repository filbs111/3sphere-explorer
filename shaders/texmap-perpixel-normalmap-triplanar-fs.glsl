#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	uniform sampler2D uSampler;
	uniform sampler2D uSamplerB;
#ifdef DEPTH_AWARE
	uniform sampler2D uSamplerDepthmap;
	varying vec3 vScreenSpaceCoord;
#endif
	uniform vec4 uColor;
	uniform vec3 uPlayerLightColor;
	uniform vec4 uFogColor;
	uniform vec3 uReflectorDiffColor;
	uniform vec3 uReflectorDiffColor2;
	uniform vec4 uReflectorPos;
	uniform vec4 uReflectorPos2;
	uniform float uReflectorCos;
	uniform float uSpecularStrength;
	uniform float uSpecularPower;

#ifdef VEC_ATMOS_THICK
	varying vec3 fog;
#else	
	varying float fog;
#endif
	varying vec4 vPlayerLightPosTangentSpace;
	varying vec4 vPortalLightPosTangentSpace;
	varying vec4 vPortalLightPosTangentSpace2;
	varying vec4 vEyePosTangentSpace;
	varying vec4 transformedCoord;	
	varying vec4 vColor;
	varying vec3 vPos;		//3vector position (before mapping onto duocyinder)
	varying vec3 vNormal;
	varying vec3 vTexAmounts;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
	void main(void) {

#ifdef DEPTH_AWARE
		float currentDepth =  texture2DProj(uSamplerDepthmap, vec3(.5,.5,1.)*vScreenSpaceCoord.xyz + vec3(.5,.5,0.)*vScreenSpaceCoord.z).r;
		float newDepth = .5*(vZW.x/vZW.y) + .5;	//this is duplicate of custom depth calculation
		if (newDepth>currentDepth){
			discard;
		}
#endif		

#ifndef DEPTH_AWARE
#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
#endif
#endif

		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos;
		
		if (posCosDiff>0.0){
			discard;
		}
		if (posCosDiff2>0.0){
			discard;	//unnecessary if, when looking through portal (ie drawing cube map), is other portal 
		}
/*	
		//discard some pix, see if makes drawing faster
		vec3 vPosMod = ( 100.*vPos - floor(100.*vPos) ) - 0.5;
		float vPosModDot = dot(vPosMod,vPosMod);
		if (vPosModDot<0.2){discard;}
*/
		float texOffset = 0.5;
		
#ifdef DIFFUSE_TEX_ACTIVE
		vec3 texColor = mat3(texture2D(uSamplerB, vec2(vPos.y, vPos.z)).xyz, texture2D(uSamplerB, vec2(vPos.x, vPos.z + texOffset )).xyz, texture2D(uSamplerB, vec2(vPos.x + texOffset, vPos.y + texOffset )).xyz) * vTexAmounts;
#else	
		vec3 texColor = vec3(1.);		//todo use above to combine diffuse with normal map effect
#endif

		float nmapStrength = -0.7;
			//TODO check whether normal maps use linear or sRGB space
			//TODO include ambient occlusion/colour map to match normal map (don't need z component of normal map anyway)

		//sample normal map in different directions.
		//vec3 normsq = sqrt(vNormal*vNormal);	//maybe not exactly right - something to stop texture stretching
		vec3 normsq = abs(vNormal);	//maybe not exactly right - something to stop texture stretching

		vec3 nmapA = vec3 ( texture2D(uSampler, vec2(vPos.y, vPos.z)).xy - vec2(0.5) , 0.0);	//TODO matrix formulation?
		vec3 nmapB = vec3 ( texture2D(uSampler, vec2(vPos.x, vPos.z + texOffset )).xy - vec2(0.5) ,0.0);
		vec3 nmapC = vec3 ( texture2D(uSampler, vec2(vPos.x + texOffset, vPos.y + texOffset )).xy - vec2(0.5) ,0.0);
		
		vec3 nmapNormal = normalize( vNormal + nmapStrength * (normsq.x*nmapA.zxy + normsq.y*nmapB.xzy + normsq.z*nmapC.xyz ) );
		
		
		vec4 normalizedLightPos = normalize(vPlayerLightPosTangentSpace);
		vec3 normalizedLightPosAdj = normalize(vPlayerLightPosTangentSpace.xyz);
		
		float light = dot( normalizedLightPosAdj, nmapNormal);	
		
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		
#ifdef SPECULAR_ACTIVE
		vec3 normalizedEyePosAdj = normalize(vEyePosTangentSpace.xyz);	
		
		//float phongAmount = pow(max(dot(normalizedEyePosAdj, nmapNormal),0.),10.);	//simple glossy camera light
		vec3 halfVec = normalize(normalizedEyePosAdj + normalizedLightPosAdj);
		float phongAmount = uSpecularStrength*pow( max(dot(halfVec, nmapNormal), 0.),uSpecularPower);
		light*=(1.-uSpecularStrength);	//ensure total light doesn't go -ve
		light+=phongAmount;
#endif
		
		//falloff
		//	light/=0.1 + 5.0*(1.0-normalizedLightPos.w);				//results consistent with "inefficient" version for small distances
		vec4 vecToLight = normalizedLightPos - vec4(vec3(0.0),1.0);	//result fully consistent with "inefficient" version, but maybe not worth extra calcs
		light/=0.1 + 5.0*dot(vecToLight,vecToLight);

		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!
		vec3 vPortalLightPosTangentSpaceAdj =normalize(vPortalLightPosTangentSpace.xyz);
		float portalLight = dot( vPortalLightPosTangentSpaceAdj, nmapNormal);
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos

		vec3 vPortalLightPosTangentSpaceAdj2 =normalize(vPortalLightPosTangentSpace2.xyz);
		float portalLight2 = dot( vPortalLightPosTangentSpaceAdj2, nmapNormal);
		portalLight2 = max(0.5*portalLight2 +0.5+ posCosDiff2,0.0);	//unnecessary if camera pos = light pos

#ifdef SPECULAR_ACTIVE

		//TODO take into account "size" of portal light
		halfVec = normalize( normalizedEyePosAdj + vPortalLightPosTangentSpaceAdj );
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, nmapNormal), 0.),uSpecularPower);
		portalLight*=(1.-uSpecularStrength);	//ensure total light doesn't go -ve
		portalLight+=phongAmount;

		halfVec = normalize( normalizedEyePosAdj + vPortalLightPosTangentSpaceAdj2 );
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, nmapNormal), 0.),uSpecularPower);
		portalLight2*=(1.-uSpecularStrength);	//ensure total light doesn't go -ve
		portalLight2+=phongAmount;
#endif

		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
		portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);
#ifdef VCOLOR
		//vec4 adjustedColor = uColor*vColor;	//TODO this logid in vert shader
		vec4 adjustedColor = uColor;	//temporarily disable this feature -seems input color data broken - some are black. reenable when fix data.
#else
		vec4 adjustedColor = uColor;
#endif
		
		//guess maybe similar to some gaussian light source
		//vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz ), 1.0)*adjustedColor*vec4(texColor,1.) + (1.0-fog)*uFogColor;
		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uReflectorDiffColor2*portalLight2 + uFogColor.xyz )*adjustedColor.xyz*texColor + (1.0-fog)*uFogColor.xyz , 1.);
				
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		gl_FragColor = pow(preGammaFragColor, vec4(0.455));
		
		float depthVal = .5*(vZW.x/vZW.y) + .5;
		gl_FragColor.a = depthVal;
	}