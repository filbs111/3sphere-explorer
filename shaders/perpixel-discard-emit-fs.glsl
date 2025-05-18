#version 300 es
	precision mediump float;
	uniform vec4 uColor;
	uniform vec3 uEmitColor;
	uniform vec3 uPlayerLightColor;
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

#ifdef VEC_ATMOS_THICK
	in vec3 fog;
#else	
	in float fog;
#endif
	in vec4 adjustedPos;
	in vec4 transformedNormal;
	in vec4 transformedCoord;
#ifdef VERTCOLOR
	in vec3 vVertexColor;
#endif
#ifdef TEXMAP
	uniform sampler2D uSampler;
	in vec3 vTextureCoord;
#endif
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
	in vec4 vP;
#endif

out vec4 fragColor;

	void main(void) {
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
		if (posCosDiff>0.0){
			discard;
		}

		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos2;
		if (posCosDiff2>0.0){
			discard;	//unnecessary if, when viewing thru portal, ensure is other one.
		}

		float posCosDiff3 = dot(normalize(transformedCoord),uReflectorPos3) - uReflectorCos3;
		if (posCosDiff3>0.0){
			discard;	//unnecessary if, when viewing thru portal, ensure is other one.
		}
	
#ifdef VERTCOLOR
	vec3 surfaceColor = vVertexColor*uColor.xyz;
#else
	vec3 surfaceColor = uColor.xyz;
#endif

#ifdef TEXMAP
	vec4 sampleColor = textureProj(uSampler, vTextureCoord);
	//sampleColor = pow(sampleColor, vec4(2.2));	//guess gamma correction?
	//vec4 sampleColor = vec4(1.0,0.0,0.0,1.0);
	surfaceColor = surfaceColor * sampleColor.xyz;		

	surfaceColor = pow(surfaceColor, vec3(2.2));	//guess gamma correction with vert colours included (expect incorrect)
#endif

	//NOTE this is used for transparency, use of fog with transparency here may be wrong!
	//have just bodged in alpha multiplier as red channel of vert colour (using 3-vec grayscale).
	//note that the alpha blending in linear space probably doesn't work great with very bright light, which 
	//should saturate after blending (perhaps 1/(1+x) blending should be used for alpha too.)

		vec3 adjustedVertColor = pow(surfaceColor, vec3(2.));	//so fades out nicely. used for thruster fx
					//NOTE might just include with earlier gamma correction.

		vec4 preGammaFragColor = vec4( fog*adjustedVertColor + (1.0-fog)*uFogColor.xyz , 1.0);
		
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		fragColor = pow(preGammaFragColor, vec4(0.455));
		//fragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
		
		fragColor.a = uColor.a * vVertexColor.r;	//TODO confirm check logic for transparent objects
#ifdef CUSTOM_DEPTH

		// here x=w, y=z, but also confusingly switched by pMatrix ! 
		//TODO if this works, don't bother creating vZW in vert shader.
		//if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
		//float depthVal = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
		float depthVal = -.3183*atan(vP.w/length(vP.xyz)) + .5;

		//float depthVal = .5*(vZW.x/vZW.y) + .5;
		gl_FragDepth = depthVal;
		fragColor.a = depthVal;
#endif
	}

//discard fragments inside reflector (when rendering cubemap view from inside reflector