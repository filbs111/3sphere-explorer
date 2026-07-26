	#version 300 es
	precision mediump float;

// THIS IS CALLED A UNIFORM BLOCK
uniform Settings {
	vec4 uPlayerLightColor;
	vec4 uFogColor;
	vec4 uReflectorDiffColorAndCos;
	vec4 uReflectorDiffColorAndCos2;
	vec4 uReflectorDiffColorAndCos3;
	vec4 uReflectorPos;
	vec4 uReflectorPos2;
	vec4 uReflectorPos3;
};

	in vec3 vTextureCoord;
	uniform sampler2D uSampler;
	uniform vec4 uColor;
	in float fog;
	in vec4 adjustedPos;
	in vec4 transformedNormal;	
	in vec4 transformedCoord;
	in vec4 transformedTangent;
	in vec4 transformedBinormal;
	
	out vec4 fragColor;

	void main(void) {

		//extract old uniforms from 4vecs
		//NOTE not using 3rd reflector here. TODO add if keep this shader
		vec3 uReflectorDiffColor = uReflectorDiffColorAndCos.xyz;
		float uReflectorCos = uReflectorDiffColorAndCos.w;
		vec3 uReflectorDiffColor2 = uReflectorDiffColorAndCos2.xyz;
		float uReflectorCos2 = uReflectorDiffColorAndCos2.w;
		
		
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
	
		if (posCosDiff>0.0){
			discard;
		}
		float posCosDiff2 = dot(normalize(transformedCoord),uReflectorPos2) - uReflectorCos2;
	
		if (posCosDiff2>0.0){
			discard;	//unneeded if ensure, when looking thru portal, that it's the other one.
		}
		
		vec3 texSample = textureProj(uSampler, vTextureCoord).xyz;
				
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
		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor.xyz*light + uReflectorDiffColor*portalLight+ uReflectorDiffColor2*portalLight2 + uFogColor.xyz ), 1.0)*adjustedColor + (1.0-fog)*uFogColor;

		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);		
		
		fragColor = pow(preGammaFragColor, vec4(0.455));

		fragColor.a =1.0;
	}