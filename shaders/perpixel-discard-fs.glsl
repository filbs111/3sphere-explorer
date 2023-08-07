#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	uniform vec4 uColor;
	uniform vec3 uEmitColor;
	uniform vec3 uPlayerLightColor;
	uniform vec4 uFogColor;
	uniform vec3 uReflectorDiffColor;
	uniform vec3 uReflectorDiffColor2;
	uniform vec4 uReflectorPos;
	uniform vec4 uReflectorPos2;
	uniform float uReflectorCos;
	uniform float uReflectorCos2;
#ifdef VEC_ATMOS_THICK
	varying vec3 fog;
#else	
	varying float fog;
#endif
	varying vec4 adjustedPos;
	varying vec4 transformedNormal;
	varying vec4 transformedCoord;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
	void main(void) {
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
		if (posCosDiff>0.0){
			discard;
		}

		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos2;
		if (posCosDiff2>0.0){
			discard;	//unnecessary if, when viewing thru portal, ensure is other one.
		}
	
		float light = -dot( normalize(adjustedPos), transformedNormal);
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		//falloff
		light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);	//1st num some const to ensure light doesn't go inf at short dist
		
		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		float portalLight = dot( uReflectorPos, transformedNormal);
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos
		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal

		//second portal
		float portalLight2 = dot( uReflectorPos2, transformedNormal);
		portalLight2 = max(0.5*portalLight2 +0.5+ posCosDiff2,0.0);	//unnecessary if camera pos = light pos
		portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);
		
		//ensure isn't something wierd! should be between -1, 1
		//if (portalLight>0.95){portalLight=-0.9;}
		//if (portalLight<-0.95){portalLight=0.9;}
		//portalLight=0.0;
				
		//guess maybe similar to some gaussian light source
		
		//vec4 preGammaFragColor = vec4( fog*(( uPlayerLightColor*light+ uReflectorDiffColor*portalLight + uFogColor.xyz )*uColor.xyz + uEmitColor), 1.0) + (1.0-fog)*uFogColor;
		vec4 preGammaFragColor = vec4( fog*(( uPlayerLightColor*light+ uReflectorDiffColor*portalLight + uReflectorDiffColor2*portalLight2+ uFogColor.xyz )*uColor.xyz + uEmitColor) + (1.0-fog)*uFogColor.xyz , 1.0);
		
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		gl_FragColor = pow(preGammaFragColor, vec4(0.455));
		//gl_FragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
		
		gl_FragColor.a =uColor.a;	//TODO confirm check logic for transparent objects
#ifdef CUSTOM_DEPTH
		float depthVal = .5*(vZW.x/vZW.y) + .5;
		gl_FragDepthEXT = depthVal;
		gl_FragColor.a = depthVal;
#endif
	}

//discard fragments inside reflector (when rendering cubemap view from inside reflector