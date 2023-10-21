#version 300 es
	precision mediump float;
	in vec3 vTextureCoord;
	uniform sampler2D uSampler;
	uniform vec4 uColor;
	in float fog;
	uniform vec4 uFogColor;
	in vec3 veclight;
	in vec3 vPos;		//3vector position (before mapping onto duocyinder)
	in vec3 vTexAmounts;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
#endif

out vec4 fragColor;

	void main(void) {		
		float texOffset = 0.5;
		vec3 texColor = mat3(texture(uSampler, vec2(vPos.y, vPos.z)).xyz, texture(uSampler, vec2(vPos.x, vPos.z + texOffset )).xyz, texture(uSampler, vec2(vPos.x + texOffset, vPos.y + texOffset )).xyz) * vTexAmounts;
		
		vec4 preGammaFragColor = vec4( texColor*fog*( veclight + uFogColor.xyz ), 1.0)*uColor + (1.0-fog)*uFogColor;
		
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		fragColor = pow(preGammaFragColor, vec4(0.455));
		//fragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
		
		//fragColor = uColor*fog*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//fragColor = (1.0-fog)*uFogColor;
		fragColor.a =1.0;
#ifdef CUSTOM_DEPTH
		float depthVal = .5*(vZW.x/vZW.y) + .5;
		gl_FragDepth = depthVal;
		fragColor.a = depthVal;
#endif
	}

//triplanar texture mapping for voxel terrain