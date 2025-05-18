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

		//third portal
		float portalLight3 = dot( uReflectorPos3, transformedNormal);
		portalLight3 = max(0.5*portalLight3 +0.5+ posCosDiff3,0.0);	//unnecessary if camera pos = light pos
		portalLight3/=1.0 + 3.0*dot(posCosDiff3,posCosDiff3);
		
		//ensure isn't something wierd! should be between -1, 1
		//if (portalLight>0.95){portalLight=-0.9;}
		//if (portalLight<-0.95){portalLight=0.9;}
		//portalLight=0.0;
				
		//guess maybe similar to some gaussian light source
		
		//vec4 preGammaFragColor = vec4( fog*(( uPlayerLightColor*light+ uReflectorDiffColor*portalLight + uFogColor.xyz )*uColor.xyz + uEmitColor), 1.0) + (1.0-fog)*uFogColor;

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

		vec4 preGammaFragColor = vec4( fog*(( uPlayerLightColor*light+ uReflectorDiffColor*portalLight + uReflectorDiffColor2*portalLight2 + uReflectorDiffColor3*portalLight3 + uFogColor.xyz )*surfaceColor + uEmitColor) + (1.0-fog)*uFogColor.xyz , 1.0);
		
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	
		
		fragColor = pow(preGammaFragColor, vec4(0.455));
		//fragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
		
		fragColor.a =uColor.a;	//TODO confirm check logic for transparent objects
#ifdef CUSTOM_DEPTH
		// here x=w, y=z !	//TODO if this works, don't bother creating vZW in vert shader.
		//if (vZW.y > -1.){discard;}
		//float depthVal = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
		float depthVal = -.3183*atan(vP.w/length(vP.xyz)) + .5;

		gl_FragDepth = depthVal;
		fragColor.a = depthVal;
#endif
	}

//discard fragments inside reflector (when rendering cubemap view from inside reflector