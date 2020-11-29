#define CONST_TAU 6.2831853
#define CONST_REPS 16.0

#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif

	uniform sampler2D uSampler;
	uniform vec4 uColor;
	varying float fog;
	uniform vec4 uFogColor;
	varying vec3 veclight;
	varying vec3 vTextureCoord;
	varying vec4 vVertexPos;
	
	void main(void) {
		//gl_FragColor = uColor*texture2D(uSampler, vTextureCoord);

#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
#endif

#ifdef MAPPROJECT_ACTIVE
		vec2 newTexCoord = vec2( atan(vVertexPos.x,vVertexPos.y)*CONST_REPS/CONST_TAU, atan(vVertexPos.z,vVertexPos.w)*CONST_REPS/CONST_TAU);
		
		//gl_FragColor = vec4( fog*( veclight + uFogColor.xyz ), 1.0)*uColor*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		vec4 preGammaFragColor = vec4( fog*( veclight + uFogColor.xyz ), 1.0)*uColor*texture2D(uSampler, newTexCoord) + (1.0-fog)*uFogColor;
#else
		vec4 preGammaFragColor = vec4( fog*( veclight + uFogColor.xyz ), 1.0)*uColor*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
#endif
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		gl_FragColor = pow(preGammaFragColor, vec4(0.455));
		//gl_FragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
		
		
		//gl_FragColor = uColor*fog*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//gl_FragColor = (1.0-fog)*uFogColor;
		gl_FragColor.a =1.0;
	}