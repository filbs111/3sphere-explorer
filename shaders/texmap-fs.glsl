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

		// here x=w, y=z, but also confusingly switched by pMatrix ! 
		//TODO if this works, don't bother creating vZW in vert shader.
		if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
		float depthVal = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;	

#ifdef CUSTOM_DEPTH
		gl_FragDepth = depthVal;
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

		fragColor.a = depthVal;
	}