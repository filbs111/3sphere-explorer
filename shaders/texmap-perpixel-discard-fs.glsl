#version 300 es
#define SMALL_AMOUNT 0.01

	precision mediump float;
	in vec3 vTextureCoord;
	uniform sampler2D uSampler;
#ifdef DEPTH_AWARE
	uniform sampler2D uSamplerDepthmap;
	in vec3 vScreenSpaceCoord;
#endif
	uniform vec4 uColor;
	uniform vec3 uPlayerLightColor;
#ifdef VEC_ATMOS_THICK
	in vec3 fog;
#else	
	in float fog;
#endif
	uniform vec4 uFogColor;
	uniform vec3 uReflectorDiffColor;
	uniform vec3 uReflectorDiffColor2;
	uniform vec3 uReflectorDiffColor3;

	uniform vec4 uReflectorPos;
	uniform vec4 uReflectorPos2;
	uniform vec4 uReflectorPos3;

	uniform float uReflectorCos;
	uniform float uReflectorCos2;
	uniform float uReflectorCos3;

	uniform float uSpecularStrength;
	uniform float uSpecularPower;
	in vec4 adjustedPos;
	in vec4 transformedNormal;	
	in vec4 transformedCoord;	
	in vec4 vColor;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
#endif

out vec4 fragColor;

	void main(void) {
#ifdef DEPTH_AWARE
		float currentDepth =  textureProj(uSamplerDepthmap, vec3(.5,.5,1.)*vScreenSpaceCoord.xyz + vec3(.5,.5,0.)*vScreenSpaceCoord.z).r;
		float newDepth = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;	//this is duplicate of custom depth calculation
		if (newDepth>currentDepth){
			discard;
		}
#endif

//#ifndef DEPTH_AWARE	//other depth aware frag shaders disable depth write, because already done z prepass. 
	//, but still want to write depth when drawing sea, which this shader used for
	//TODO separate shader for sea if impacts perf
#ifdef CUSTOM_DEPTH
		// here x=w, y=z, but also confusingly switched by pMatrix ! 
		//TODO if this works, don't bother creating vZW in vert shader.
		if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
		float depthVal = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
		gl_FragDepth = depthVal;
#endif
//#endif

		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
		if (posCosDiff>0.0){
			discard;
		}

		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos2;
		if (posCosDiff2>0.0){
			discard;	//unnecessary if ensure that when viewing through a portal, that portal is 1st.
		}

		float posCosDiff3 = dot(normalize(transformedCoord),uReflectorPos3) - uReflectorCos3;
		if (posCosDiff3>0.0){
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

		float portalLight3 = dot( uReflectorPos3, transformedNormal);
		portalLight3 = max(0.5*portalLight3 +0.5+ posCosDiff3,0.0);	//unnecessary if camera pos = light pos

#ifdef SPECULAR_ACTIVE		
		//note maybe faster if calculate half vector in vert shader. (expect interpolates ok).  		
		vec4 directionToPortalLight = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToPortalLight);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight*=(1.-uSpecularStrength);
		portalLight+=phongAmount;

		//second portal light
		directionToPortalLight = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos2 ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToPortalLight);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight2*=(1.-uSpecularStrength);
		portalLight2+=phongAmount;

		//third portal light
		directionToPortalLight = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos3 ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToPortalLight);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight3*=(1.-uSpecularStrength);
		portalLight3+=phongAmount;

#endif

		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
		portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);
		portalLight3/=1.0 + 3.0*dot(posCosDiff3,posCosDiff3);

#ifdef VCOLOR
		vec4 adjustedColor = uColor*vColor;	//TODO this logid in vert shader
#else
		vec4 adjustedColor = uColor;
#endif		
		
		//guess maybe similar to some gaussian light source
		//vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz ), 1.0)*adjustedColor*textureProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;

		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uReflectorDiffColor2*portalLight2 + uReflectorDiffColor3*portalLight3 + uFogColor.xyz )*adjustedColor.xyz*textureProj(uSampler, vTextureCoord).xyz + (1.0-fog)*uFogColor.xyz , 1.);
		
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	

		fragColor = pow(preGammaFragColor, vec4(0.455));
		//fragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
	
		
		//fragColor = uColor*fog*textureProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//fragColor = (1.0-fog)*uFogColor;

#ifdef DEPTH_AWARE
		//preGammaFragColor.rgb = texture(uSamplerDepthmap, gl_FragCoord.xy).rgb;	//just something to show can use texture.
		float depthDifference = newDepth - currentDepth;	//TODO calculate actual length difference
		//preGammaFragColor = vec4( vec3(depthDifference) ,1.);	//TODO use coords that project without extra term
		fragColor.a = 1.-exp(depthDifference*40000.);
#else

	#ifdef CUSTOM_DEPTH
			fragColor.a = depthVal;	//note this is missed ifdef depth_aware, so blur on sea won't be right
	#else
			fragColor.a =1.0;
	#endif

#endif	
	}