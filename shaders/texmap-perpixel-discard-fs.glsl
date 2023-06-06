#define SMALL_AMOUNT 0.01

#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	varying vec3 vTextureCoord;
	uniform sampler2D uSampler;
#ifdef DEPTH_AWARE
	uniform sampler2D uSamplerDepthmap;
	varying vec3 vScreenSpaceCoord;
#endif
	uniform vec4 uColor;
	uniform vec3 uPlayerLightColor;
#ifdef VEC_ATMOS_THICK
	varying vec3 fog;
#else	
	varying float fog;
#endif
	uniform vec4 uFogColor;
	uniform vec3 uReflectorDiffColor;
	uniform vec3 uReflectorDiffColor2;
	uniform vec4 uReflectorPos;
	uniform vec4 uReflectorPos2;
	uniform float uReflectorCos;
	uniform float uSpecularStrength;
	uniform float uSpecularPower;
	varying vec4 adjustedPos;
	varying vec4 transformedNormal;	
	varying vec4 transformedCoord;	
	varying vec4 vColor;
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

//#ifndef DEPTH_AWARE	//other depth aware frag shaders disable depth write, because already done z prepass. 
	//, but still want to write depth when drawing sea, which this shader used for
	//TODO separate shader for sea if impacts perf
#ifdef CUSTOM_DEPTH
		float depthVal = .5*(vZW.x/vZW.y) + .5;
		gl_FragDepthEXT = depthVal;
#endif
//#endif

		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
		if (posCosDiff>0.0){
			discard;
		}

		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos;
		if (posCosDiff2>0.0){
			discard;	//unnecessary if ensure that when viewing through a portal, that portal is 1st.
		}
	
		vec4 adjustedPosNormalised = normalize(adjustedPos);
	
		float light = -dot( adjustedPosNormalised, transformedNormal);
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		

#ifdef SPECULAR_ACTIVE
	//other specular implementation is in tangent space.
	//this uses 4vecs. guessed but appears to work fine.
	vec4 eyePos = vec4(0.,0.,0.,1.);

	//directions are what matter. approximate by using small_amount. TODO more efficient formulation
	//TODO what is adjustedpos, what is transformedPos? 
	vec4 directionToEye = normalize( normalize(transformedCoord+SMALL_AMOUNT*eyePos) -  normalize(transformedCoord));
	vec4 directionToLight = normalize( normalize(transformedCoord-SMALL_AMOUNT*adjustedPosNormalised ) -  normalize(transformedCoord));
	vec4 halfVec = normalize( directionToEye + directionToLight);

	float phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
	light*=(1.-uSpecularStrength);
	light+=phongAmount;
#endif

		//falloff
		light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);

		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!
		float portalLight = dot( uReflectorPos, transformedNormal);
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos

		float portalLight2 = dot( uReflectorPos2, transformedNormal);
		portalLight2 = max(0.5*portalLight2 +0.5+ posCosDiff2,0.0);	//unnecessary if camera pos = light pos

#ifdef SPECULAR_ACTIVE		
		//note maybe faster if calculate half vector in vert shader. (expect interpolates ok).  		
		vec4 directionToLight2 = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToLight2);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight*=(1.-uSpecularStrength);
		portalLight+=phongAmount;

		//second portal light
		directionToLight2 = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos2 ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToLight2);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight2*=(1.-uSpecularStrength);
		portalLight2+=phongAmount;
#endif

		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
		portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);

#ifdef VCOLOR
		vec4 adjustedColor = uColor*vColor;	//TODO this logid in vert shader
#else
		vec4 adjustedColor = uColor;
#endif		
		
		//guess maybe similar to some gaussian light source
		//vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz ), 1.0)*adjustedColor*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;

		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uReflectorDiffColor2*portalLight2 + uFogColor.xyz )*adjustedColor.xyz*texture2DProj(uSampler, vTextureCoord).xyz + (1.0-fog)*uFogColor.xyz , 1.);
		
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	

		gl_FragColor = pow(preGammaFragColor, vec4(0.455));
		//gl_FragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
	
		
		//gl_FragColor = uColor*fog*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//gl_FragColor = (1.0-fog)*uFogColor;

#ifdef DEPTH_AWARE
		//preGammaFragColor.rgb = texture2D(uSamplerDepthmap, gl_FragCoord.xy).rgb;	//just something to show can use texture.
		float depthDifference = newDepth - currentDepth;	//TODO calculate actual length difference
		//preGammaFragColor = vec4( vec3(depthDifference) ,1.);	//TODO use coords that project without extra term
		gl_FragColor.a = 1.-exp(depthDifference*1000.);
#else

	#ifdef CUSTOM_DEPTH
			gl_FragColor.a = depthVal;	//note this is missed ifdef depth_aware, so blur on sea won't be right
	#else
			gl_FragColor.a =1.0;
	#endif

#endif	
	}