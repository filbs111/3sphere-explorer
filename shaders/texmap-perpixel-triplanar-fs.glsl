#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif

	precision mediump float;
	varying vec3 vTextureCoord;
	uniform sampler2D uSampler;
	uniform vec4 uColor;
	uniform vec3 uPlayerLightColor;
	varying float fog;
	uniform vec4 uFogColor;
	uniform vec3 uReflectorDiffColor;
	uniform vec3 uReflectorDiffColor2;
	uniform vec4 uReflectorPos;
	uniform vec4 uReflectorPos2;
	uniform float uReflectorCos;
	uniform float uReflectorCos2;
	uniform float uSpecularStrength;
	uniform float uSpecularPower;
	varying vec4 adjustedPos;
	varying vec4 transformedNormal;	
	varying vec4 transformedCoord;	
	varying vec4 vColor;
	varying vec3 vPos;		//3vector position (before mapping onto duocyinder)
	varying vec3 vTexAmounts;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif		
	void main(void) {
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos2;

		if (posCosDiff>0.0){
			discard;
		}
		if (posCosDiff2>0.0){
			discard;	//unnecessary if ensure portal that are looking through is other.
		}
	
		float texOffset = 0.5;
		vec3 texColor = mat3(texture2D(uSampler, vec2(vPos.y, vPos.z)).xyz, texture2D(uSampler, vec2(vPos.x, vPos.z + texOffset )).xyz, texture2D(uSampler, vec2(vPos.x + texOffset, vPos.y + texOffset )).xyz) * vTexAmounts;
		
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
	light*=(1.-uSpecularStrength);	//ensure total light doesn't go -ve
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
		//TODO take into account "size" of portal light. TODO suspect this is not right - speculat much stronger in shader-texmap-perpixel-discard-normalmap-efficient-fs . suspect due to zeroing w component there
		halfVec = normalize( vecToEye + normalize(transformedCoord-uReflectorPos));
		phongAmount = uSpecularStrength*pow( max(-dot(halfVec, transformedNormal), 0.),uSpecularPower);
		portalLight*=(1.-uSpecularStrength);
		portalLight+=phongAmount;
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
		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uReflectorDiffColor2*portalLight2 + uFogColor.xyz ), 1.0)*adjustedColor*vec4(texColor,1.) + (1.0-fog)*uFogColor;
				
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		gl_FragColor = pow(preGammaFragColor, vec4(0.455));
		//gl_FragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
		
		//gl_FragColor = uColor*fog*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//gl_FragColor = (1.0-fog)*uFogColor;
		gl_FragColor.a =1.0;
#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
#endif
	}