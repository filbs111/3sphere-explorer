#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	varying vec3 vTextureCoord;
	uniform sampler2D uSampler;
	uniform vec4 uColor;
	varying float fog;
	uniform vec4 uFogColor;
	varying vec3 veclight;
	varying vec3 vPos;		//3vector position (before mapping onto duocyinder)
	varying vec3 vTexAmounts;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
	void main(void) {		
		float texOffset = 0.5;
		vec3 texColor = mat3(texture2D(uSampler, vec2(vPos.y, vPos.z)).xyz, texture2D(uSampler, vec2(vPos.x, vPos.z + texOffset )).xyz, texture2D(uSampler, vec2(vPos.x + texOffset, vPos.y + texOffset )).xyz) * vTexAmounts;
		
		vec4 preGammaFragColor = vec4( texColor*fog*( veclight + uFogColor.xyz ), 1.0)*uColor + (1.0-fog)*uFogColor;
		
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

//triplanar texture mapping for voxel terrain