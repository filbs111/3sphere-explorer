#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	varying vec3 vTextureCoord;
	uniform sampler2D uSampler;
	uniform sampler2D uSampler2;
	uniform vec4 uColor;
	uniform vec3 uPlayerLightColor;
	uniform vec4 uOtherLightAmounts;
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
	varying vec4 adjustedPos;
	varying vec4 transformedNormal;	
	varying vec4 transformedCoord;	
	
	uniform vec3 uLightPosPlayerFrame;	//tmp. TODO do this stuff in v shader
	uniform vec3 uLightPosPlayerFrame2;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif
	void main(void) {
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
	
		if (posCosDiff>0.0){
			discard;
		}

		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos;
		if (posCosDiff2>0.0){
			discard;	//unnecessary if, when viewing thru portal, ensure is other one.
		}
	
	/*
		float light = -dot( normalize(adjustedPos), transformedNormal);
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		//falloff
		light/=0.7 + 3.0*dot(adjustedPos,adjustedPos);
	*/
		//tmp remove player light 
	
	/*
		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!
		float portalLight = dot( uReflectorPos, transformedNormal);										
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos
		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
		*/
		//todo figure out the above and make lighting in this shader consistent with lighting of other objects
		
		//bodge - treat as if gradient light, where centre colour = uFogColor + 0.5*(uReflectorDiffColor*portalLight), gradient = uReflectorDiffColor*portalLight
		//TODO maybe better to approximate light as some percentage standard directional light, some amount gradient (all gradient at portal surface)
		//maybe quadratic gradient light will be significant improvement (but may require many textures)
		//float gradRange = 1.0 / (1.0 + 3.0*dot(posCosDiff,posCosDiff));
		float gradRange = (1.-uReflectorCos)/(1.-uReflectorCos - posCosDiff);	//~ r^2/x^2 falloff (since 1-cos(x)~x^2)
		float gradRange2 = (1.-uReflectorCos)/(1.-uReflectorCos - posCosDiff2);

		vec3 averageLight = uFogColor.xyz + uReflectorDiffColor * 0.5*gradRange + uReflectorDiffColor2 * 0.5*gradRange2;

			//calculation contribution of gradient lights and sum. this is portalLight vector basically.
		
		vec3 modifiedLightDirection = gradRange*normalize(uLightPosPlayerFrame.xyz);	//TODO scale less when far from portal surf (by difference betwee "average" colour and fog) 
		vec3 modifiedLightDirection2 = gradRange2*normalize(uLightPosPlayerFrame2.xyz);
		
		vec3 modifiedLightDirectionR = modifiedLightDirection*uReflectorDiffColor.r + modifiedLightDirection2*uReflectorDiffColor2.r;	//todo matrix notation, do in vert shader
		vec3 modifiedLightDirectionG = modifiedLightDirection*uReflectorDiffColor.g + modifiedLightDirection2*uReflectorDiffColor2.g;
		vec3 modifiedLightDirectionB = modifiedLightDirection*uReflectorDiffColor.b + modifiedLightDirection2*uReflectorDiffColor2.b;

		vec4 vChanWeightsR = vec4(modifiedLightDirectionR, averageLight.r-dot(modifiedLightDirectionR,vec3(0.5)));
		vec4 vChanWeightsG = vec4(modifiedLightDirectionG, averageLight.g-dot(modifiedLightDirectionG,vec3(0.5)));
		vec4 vChanWeightsB = vec4(modifiedLightDirectionB, averageLight.b-dot(modifiedLightDirectionB,vec3(0.5)));
		

		float uMaxAlbedo = 0.4;	//todo use uColor? (baked maps assume some albedo though)
		vChanWeightsR*=uMaxAlbedo;
		vChanWeightsG*=uMaxAlbedo;
		vChanWeightsB*=uMaxAlbedo;	//todo just apply after litColor
		
		vec4 sampleColor = texture2DProj(uSampler, vTextureCoord);
		
		vec3 litColor = vec3( dot(sampleColor, vChanWeightsR), 
								dot(sampleColor, vChanWeightsG),
								dot(sampleColor, vChanWeightsB));
		
		//litColor = vec3(0.0);	//zero lighting to test below stuff
		
		//bodge thruster light by player space light contributon. this is very approximate!
		//todo replace by baked thruster light
		//litColor.b += sampleColor.a;	//isotropic light contribution
		//litColor.b += sampleColor.r;	//light contribution from the left
		//litColor.b += sampleColor.g;	//light contribution from behind
		//litColor.b += sampleColor.b;	//light contribution from below
		vec3 thrustLightColor = vec3(0.1,0.2,0.9)* uOtherLightAmounts.b;
		vec3 gunLightColor = vec3(1.0,1.0,0.1)* uOtherLightAmounts.g;

		vec4 sampleColor2 = texture2DProj(uSampler2, vTextureCoord);

								//TODO matrix formulation
		litColor += thrustLightColor*sampleColor2.b;	//thruster bake
		litColor += gunLightColor*sampleColor2.g;	//gun bake

		//guess maybe similar to some gaussian light source
		//vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz ), 1.0)*uColor*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		vec4 preGammaFragColor = vec4( fog*litColor + (1.0-fog)*uFogColor.xyz, 1.);

		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		gl_FragColor = pow(preGammaFragColor, vec4(0.455));
		//gl_FragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
	
		
		//gl_FragColor = uColor*fog*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//gl_FragColor = (1.0-fog)*uFogColor;

		float depthVal = .5*(vZW.x/vZW.y) + .5;
		gl_FragColor.a = depthVal;

#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = depthVal;
		//vec2 normZW=normalize(vZW);
		//gl_FragDepthEXT = .5*(normZW.x/normZW.y) + .5;
#endif
	}