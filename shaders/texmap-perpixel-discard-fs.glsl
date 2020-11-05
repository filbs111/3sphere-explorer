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
	uniform vec4 uReflectorPos;
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
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
#endif
//#endif

		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
	
		if (posCosDiff>0.0){
			discard;
		}
	
		vec4 adjustedPosNormalised = normalize(adjustedPos);
	
		float light = -dot( adjustedPosNormalised, transformedNormal);
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		
#ifdef SPECULAR_ACTIVE
	//other specular implementation is in tangent space.
	//this uses 4vecs. guessed but appears to work fine.
	vec4 eyePos = vec4(0.,0.,0.,1.);
	vec4 vecToEye = normalize(transformedCoord-eyePos);
	vec4 halfVec = normalize( vecToEye + adjustedPosNormalised);
	float phongAmount = uSpecularStrength*pow( max(-dot(halfVec, transformedNormal), 0.),uSpecularPower);
	light*=(1.-uSpecularStrength);
	light+=phongAmount;
#endif
		
		//falloff
		light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);

		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!
		float portalLight = dot( uReflectorPos, transformedNormal);
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos

#ifdef SPECULAR_ACTIVE
		//TODO take into account "size" of portal light. TODO suspect this is not right - speculat much stronger in shader-texmap-perpixel-discard-normalmap-efficient-fs . suspect due to zeroing w component there
		halfVec = normalize( vecToEye + normalize(transformedCoord-uReflectorPos));
		phongAmount = uSpecularStrength*pow( max(-dot(halfVec, transformedNormal), 0.),uSpecularPower);
		portalLight*=(1.-uSpecularStrength);
		portalLight+=phongAmount;
#endif

		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal

#ifdef VCOLOR
		vec4 adjustedColor = uColor*vColor;	//TODO this logid in vert shader
#else
		vec4 adjustedColor = uColor;
#endif		
		
		//guess maybe similar to some gaussian light source
		//vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz ), 1.0)*adjustedColor*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;

		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz )*adjustedColor.xyz*texture2DProj(uSampler, vTextureCoord).xyz + (1.0-fog)*uFogColor.xyz , 1.);
		
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
		gl_FragColor.a =1.0;
#endif	
	}