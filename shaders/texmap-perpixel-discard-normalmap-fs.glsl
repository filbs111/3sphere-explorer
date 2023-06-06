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
	varying vec4 adjustedPos;
	varying vec4 transformedNormal;	
	varying vec4 transformedCoord;
	varying vec4 transformedTangent;
	varying vec4 transformedBinormal;
		
	void main(void) {
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
	
		if (posCosDiff>0.0){
			discard;
		}
		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos;
	
		if (posCosDiff2>0.0){
			discard;	//unneeded if ensure, when looking thru portal, that it's the other one.
		}
		
		vec3 texSample = texture2DProj(uSampler, vTextureCoord).xyz;
				
		vec3 texSampleAdjusted = texSample*vec3(2.)-vec3(1.);
		texSampleAdjusted.xy*=0.4;	//make surface flatter.
				
		texSampleAdjusted = normalize(texSampleAdjusted);
		
		vec4 nmapNormal = transformedNormal*texSampleAdjusted.z +transformedTangent*texSampleAdjusted.x+ transformedBinormal*texSampleAdjusted.y;	//TODO use matrix for normal, tangent, binormal!
	
		vec4 adjustedColor = pow(uColor, vec4(2.-texSampleAdjusted.z));	//bodge - idea is to make colour deeper in recesses. (TODO special bake for this)
	
		float light = -dot( normalize(adjustedPos), nmapNormal);
		
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		
		
		//falloff
		light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);
		
		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!
		float portalLight = dot( uReflectorPos, nmapNormal);
	
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos
		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal


		float portalLight2 = dot( uReflectorPos2, nmapNormal);
		
		portalLight2 = max(0.5*portalLight2 +0.5+ posCosDiff2,0.0);	//unnecessary if camera pos = light pos
		//falloff
		portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);	//just something that's 1 at edge of portal
		

		//guess maybe similar to some gaussian light source
		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight+ uReflectorDiffColor2*portalLight2 + uFogColor.xyz ), 1.0)*adjustedColor + (1.0-fog)*uFogColor;

		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);		
		
		gl_FragColor = pow(preGammaFragColor, vec4(0.455));

		gl_FragColor.a =1.0;
	}