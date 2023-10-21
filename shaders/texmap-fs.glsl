#version 300 es
#define CONST_TAU 6.2831853
#define CONST_REPS 16.0

precision mediump float;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
#endif

	uniform sampler2D uSampler;
	uniform vec4 uColor;
	in float fog;
	uniform vec4 uFogColor;
	in vec3 veclight;
	in vec3 vTextureCoord;
	in vec4 vVertexPos;
	
out vec4 fragColor;

	void main(void) {
		//gl_FragColor = uColor*texture(uSampler, vTextureCoord);

#ifdef CUSTOM_DEPTH
		gl_FragDepth = .5*(vZW.x/vZW.y) + .5;
#endif

#ifdef MAPPROJECT_ACTIVE
		vec2 newTexCoord = vec2( atan(vVertexPos.x,vVertexPos.y)*CONST_REPS/CONST_TAU, atan(vVertexPos.z,vVertexPos.w)*CONST_REPS/CONST_TAU);
		
		//fragColor = vec4( fog*( veclight + uFogColor.xyz ), 1.0)*uColor*textureProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		vec4 preGammaFragColor = vec4( fog*( veclight + uFogColor.xyz ), 1.0)*uColor*texture(uSampler, newTexCoord) + (1.0-fog)*uFogColor;
#else
		vec4 preGammaFragColor = vec4( fog*( veclight + uFogColor.xyz ), 1.0)*uColor*textureProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
#endif
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		fragColor = pow(preGammaFragColor, vec4(0.455));
		//fragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
		
		//fragColor = uColor*fog*textureProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//fragColor = (1.0-fog)*uFogColor;

		float depthVal = .5*(vZW.x/vZW.y) + .5;	//assumes passing though vZW.
		fragColor.a = depthVal;
	}