#version 300 es
	#define CONST_TAU 6.2831853
	#define CONST_REPS 16.0
	#define PIBYTWO 1.5707963

	precision mediump float;
	uniform sampler2D uSampler;
	uniform sampler2D uSamplerB;
	uniform sampler2D uSampler2;
	uniform sampler2D uSampler2B;
#ifdef DEPTH_AWARE
	uniform sampler2D uSamplerDepthmap;
	in vec3 vScreenSpaceCoord;
#endif
	uniform vec4 uColor;
	uniform vec3 uPlayerLightColor;
#ifdef VEC_ATMOS_THICK
	in vec3 fog;
#else	
	in float fog;
#endif
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

	uniform float uSpecularStrength;
	uniform float uSpecularPower;
	uniform float uTexBias;

	in vec4 vPlayerLightPosTangentSpace;
	
	in vec4 vPortalLightPosTangentSpace;
	in vec4 vPortalLightPosTangentSpace2;
	in vec4 vPortalLightPosTangentSpace3;

	in vec4 vEyePosTangentSpace;

	in vec4 transformedCoord;
	in vec3 vTextureCoord;
	in vec4 vVertexPos;
	in vec4 vColor;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
	in vec4 vP;
#endif

out vec4 fragColor;



#ifdef RECEIVE_SHADOW
	in vec3 posInShadowCasterSpace;	//since shadow caster (for now, player object) is in projected flat space, scaled by some factor. TODO prevent casting shadow on opposite side of world?

	//rough vals from trial and error, works in conjunction with posInShadowCasterSpace*= in vert shader. TODO correct values
	const vec3 shadowObjVerts[5]=vec3[5](
		vec3(1.,1.,-2.5),
		vec3(1.,-1.,-2.5),
		vec3(-1.,-1.,-2.5),
		vec3(-1.,1.,-2.5),
		vec3(0.,0.,4.5)
	);

	float isoShadowFactor(vec3 catcherPos, vec3 vecA, vec3 vecB, vec3 vecC){
		// var aCrossB = crossProduct(a,b);
		// var aCrossBDotC = dotProduct(aCrossB, c);
		// var denominator = 1 + dotProduct(a,b) + dotProduct(b,c) + dotProduct(c,a);
		// var tanEOver2 = aCrossBDotC/denominator;
		// return 2*Math.atan(tanEOver2);  //this has a sign.

		vec3 vertexA = normalize(vecA + catcherPos);
		vec3 vertexB = normalize(vecB + catcherPos);
		vec3 vertexC = normalize(vecC + catcherPos);

		vec3 aCrossB = cross(vertexA, vertexB);
		float aCrossBDotC = dot(aCrossB, vertexC);
		float denominator = 1. + dot(vertexA, vertexB) + dot(vertexA, vertexC) + dot(vertexB, vertexC) ;
		float tanEOver2 = aCrossBDotC/denominator;
		//return 2.0*atan(tanEOver2);
		//return 0.159*atan(tanEOver2);	//above over 4PI, since want fraction of sphere not stearads
			//TODO try abs?
		return 0.159*abs(atan(tanEOver2));
	}

#endif



//TODO move some or all of this calculation to vertex shader.
// calculation of alpha, gamma factors can easily be per vertex
// nmapNormal is per pixel so wants more thought.
float calculatePortalLightContribution(vec4 vPortalLightPosTangentSpace, vec4 nmapNormal, float uReflectorCos, vec4 surfPos, vec4 portalPos, vec3 reflectedEyeVec, float specAmount){
	float cosElevation = dot(vPortalLightPosTangentSpace, nmapNormal); //elevation = phi in notes
	float elev = acos(cosElevation);	//elevation of portal "sun" in sky viewed from surface

	float alpha = acos(uReflectorCos);	//angular size of portal in world
	float cosGamma = dot(surfPos, portalPos);
		//NOTE this dot prod already cacluated earlier in shader to discard frags inside portals
		//TODO dedupe/ pass in dot prod.
	float gamma = acos(cosGamma);			//angular distance from surface to portal
		//TODO does vPortalLightPosTangentSpace already contain enough info to get this, removing need to pass in surfPos, portalPos?

		//TODO simplify trig. eg get straight from uReflectorCos to tanAlpha, tanAlpha^2,
		// straight from cosGamma to sinGamma^2
	float tanAlpha = tan(alpha);
	float sinGamma = sin(gamma);
	float tanTheta = tanAlpha / sqrt(sinGamma*sinGamma - tanAlpha*tanAlpha*cosGamma*cosGamma );
	float theta = atan(tanTheta);

	float aboveHorizonAngleSize = (sin(min(PIBYTWO, elev+theta)) - sin(min(PIBYTWO, elev-theta)));
	float contribution = aboveHorizonAngleSize*sin(theta)/2.0;

	contribution*= (cos(elev)+1.0/2.0);	//make go to 0 on opposite side of world. 
		//NOTE might be wrong - if there is a clear view of it, portal really does appear very large from opposite side of world.
		//however, this does fix issue of lighting becoming wierd (negative?) when lit object is within volume opposite the portal volume.
		//TODO shadow map/atmos calc etc



#ifdef SPECULAR_ACTIVE

	//specAmount = max(specAmount,0.);	//avoid problem due to normal not matching physical normal
	specAmount = min(specAmount,1.);	//TODO why does input specAmount go above 1? 

	vec3 vPortalLightPosTangentSpace3 = normalize(vPortalLightPosTangentSpace.xyz);
	float dotProd = max(dot(reflectedEyeVec, vPortalLightPosTangentSpace3), 0.);



	float angleDifference = acos(dotProd) - theta;

	//return (angleDifference < 0.) ? 1.: 0.;		//NOTE sign change unexpected! are cosine vals -ve here?

	float specularSharpness = uSpecularPower;	//how sharp reflected image is. resuse existing variable "specular power
	float specularContrib = .5*(tanh(-angleDifference*specularSharpness) + 1.);		//NOTE function of angle so a bit bodgy - expect a point in middle or reflection of disc, but not obvious to viewer.

	//specularContrib = max(specularContrib, 0.);	//doesn't fix problem of wierd very drak parts at glancing incidence.
		// (FWIW can avoid by having low specular power eg 1.5, though then no point having disc portal reflection code, in fact run into bad pointy highlight!


	contribution*=(1.-specAmount);
	contribution += specAmount*specularContrib;
#endif


	return contribution;
}


	void main(void) {

#ifdef DEPTH_AWARE
		float currentDepth =  textureProj(uSamplerDepthmap, vec3(.5,.5,1.)*vScreenSpaceCoord.xyz + vec3(.5,.5,0.)*vScreenSpaceCoord.z).r;
		//float newDepth = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;	//this is duplicate of custom depth calculation
		float newDepth =-.3183*atan(vP.w/length(vP.xyz)) + .5;
		if (newDepth>currentDepth){
			discard;
		}
#endif		

#ifndef DEPTH_AWARE
#ifdef CUSTOM_DEPTH
		// here x=w, y=z, but also confusingly switched by pMatrix ! 
		//TODO if this works, don't bother creating vZW in vert shader.
		//if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
		//gl_FragDepth = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
		gl_FragDepth = -.3183*atan(vP.w/length(vP.xyz)) + .5;
#endif
#endif

		vec4 normalisedSurfCoord = normalize(transformedCoord);

		float posCosDiff = dot(normalisedSurfCoord,uReflectorPos) - uReflectorCos;	//TODO is transformedcoord still needed if have vPortalLightPosTangentSpace ? 
		float posCosDiff2 = dot(normalisedSurfCoord,uReflectorPos2) - uReflectorCos2;	//TODO is transformedcoord still needed if have vPortalLightPosTangentSpace ? 
		float posCosDiff3 = dot(normalisedSurfCoord,uReflectorPos3) - uReflectorCos3;	//TODO is transformedcoord still needed if have vPortalLightPosTangentSpace ? 

		if (posCosDiff>0.0){
			discard;
		}
		if (posCosDiff2>0.0){
			discard;
			//note maybe unnecessary, inefficient - only really need to ensure discard pix inside portal that camera is in
		}
		if (posCosDiff3>0.0){
			discard;
			//note maybe unnecessary, inefficient - only really need to ensure discard pix inside portal that camera is in
		}
		
#ifdef MAPPROJECT_ACTIVE
		vec2 newTexCoord = vec2( atan(vVertexPos.x,vVertexPos.y)*CONST_REPS/CONST_TAU, atan(vVertexPos.z,vVertexPos.w)*CONST_REPS/CONST_TAU);
		vec3 texSample = texture(uSampler, newTexCoord).xyz;
#ifdef DOUBLE_TEXTURES
		vec3 texSample2 = texture(uSampler2, newTexCoord).xyz;
		texSample = mix(texSample, texSample2, vColor.a);	//use tex vertex colour 4th channel
#endif
#else


#ifdef CUSTOM_TEXBIAS
	vec3 texSample = textureProj(uSampler, vTextureCoord, uTexBias).xyz;
#ifdef DOUBLE_TEXTURES
	vec3 texSample2 = textureProj(uSampler2, vTextureCoord, uTexBias).xyz;
	texSample = mix(texSample, texSample2, vColor.a);	//use tex vertex colour 4th channel
#endif
#else
	vec3 texSample = textureProj(uSampler, vTextureCoord).xyz;	//is this case ever used?
#ifdef DOUBLE_TEXTURES
	vec3 texSample2 = textureProj(uSampler2, vTextureCoord).xyz;
	texSample = mix(texSample, texSample2, vColor.a);	//use tex vertex colour 4th channel
#endif
#endif

#endif
				
		vec3 texSampleAdjusted = texSample*vec3(2.)-vec3(1.);
		texSampleAdjusted.xy*=0.1;	//make surface flatter.
				
		texSampleAdjusted = normalize(texSampleAdjusted);
		
		vec4 nmapNormal = vec4(texSampleAdjusted,0.0);	//trivial TODO tidy up
		
#ifdef VCOLOR
		vec4 adjustedColor = pow(uColor*vColor, vec4(2.-texSampleAdjusted.z));
#else
		vec4 adjustedColor = pow(uColor, vec4(2.-texSampleAdjusted.z));	//bodge - idea is to make colour deeper in recesses. (TODO special bake for this)
#endif

#ifdef DIFFUSE_TEX_ACTIVE
#ifdef MAPPROJECT_ACTIVE
		//adjustedColor*=texture(uSamplerB, newTexCoord);	//hope that 4th component is 1 (opaque). note currently only used in conjunction with MAPPROJECT_ACTIVE
		vec4 diffuseSample=texture(uSamplerB, newTexCoord);
#ifdef DOUBLE_TEXTURES
		diffuseSample= mix(diffuseSample, texture(uSampler2B, newTexCoord), vColor.a);
		//diffuseSample= mix(diffuseSample, texture(uSampler2B, newTexCoord), 0.);
#endif		
		adjustedColor*=pow(diffuseSample,vec4(2.2));	//convert rgb to linear. this is inefficient and expect interpolation won't work right. todo figure out how to use properly, or convert to linear before using in shader.
#else

		vec4 diffuseSample=textureProj(uSamplerB, vTextureCoord);
#ifdef DOUBLE_TEXTURES
		diffuseSample= mix(diffuseSample, textureProj(uSampler2B, vTextureCoord), vColor.a);
#endif
		adjustedColor*=pow(diffuseSample,vec4(2.2));
#endif
#endif
		
		vec4 normalizedLightPos = normalize(vPlayerLightPosTangentSpace);
		vec4 normalizedLightPosAdj = normalize(vec4( vPlayerLightPosTangentSpace.xyz , 0.0));
		
		float light = dot( normalizedLightPosAdj, nmapNormal);		
		
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		
#ifdef SPECULAR_ACTIVE		
		//add specular component (currently for playerLight only)
		//really should also take into account that light is not point source, especially relevant if apply logic to portal light too, but 
		//	guess if surface not that shiny will work OK with assumption
		//TODO something more efficient. can the halfVec be a varying? what should it be (tried normalising it in vert shader and doesnt interpolate well)
		
		vec4 normalizedEyePosAdj = normalize(vec4( vEyePosTangentSpace.xyz , 0.));

		light*=(1.-uSpecularStrength);
		//float phongAmount = pow(max(dot(normalizedEyePosAdj, nmapNormal),0.),10.);	//simple glossy camera light
		vec4 halfVec = normalize(normalizedEyePosAdj + normalizedLightPosAdj);
		float phongAmount = uSpecularStrength*pow( max(dot(halfVec, nmapNormal), 0.),uSpecularPower);
		
		light+=phongAmount;


	//reflect eye vec in surface. 
	vec4 reflectedEyeVec4 = 2.*nmapNormal*dot(normalizedEyePosAdj, nmapNormal) - normalizedEyePosAdj;
	//vec4 reflectedEyeVec4 = 2.*vNormal*dot(normalizedEyePosAdj, vNormal) - normalizedEyePosAdj;	//works (ignores normal map)

	vec3 reflectedEyeVec = normalize(reflectedEyeVec4.xyz);

	//schlick R0 + (1-R0)(1+cost)^5 , where t = view angle (where 0 = looking directly at surface) 
	float cost = dot(normalizedLightPosAdj, nmapNormal);	//whatever this is is 0 for glancing suppose this is sint
	//float ctsq = 1. - something*something;
	float r0 = uSpecularStrength;
	float schlick = r0 + (1.-r0)*pow(1.-cost,5.);
#else
	vec3 reflectedEyeVec = vec3(0.);	//unused 
	float schlick=0.;

#endif		
		//falloff
	//	light/=0.1 + 5.0*(1.0-normalizedLightPos.w);				//results consistent with "inefficient" version for small distances
		vec4 vecToLight = normalizedLightPos - vec4(vec3(0.0),1.0);	//result fully consistent with "inefficient" version, but maybe not worth extra calcs
		light/=0.1 + 5.0*dot(vecToLight,vecToLight);
	

		//light from portal
		float portalLight = calculatePortalLightContribution(vPortalLightPosTangentSpace, nmapNormal, uReflectorCos, normalisedSurfCoord, uReflectorPos, reflectedEyeVec, schlick);
		float portalLight2 = calculatePortalLightContribution(vPortalLightPosTangentSpace2, nmapNormal, uReflectorCos2, normalisedSurfCoord, uReflectorPos2, reflectedEyeVec, schlick);
		float portalLight3 = calculatePortalLightContribution(vPortalLightPosTangentSpace3, nmapNormal, uReflectorCos3, normalisedSurfCoord, uReflectorPos3, reflectedEyeVec, schlick);


		//falloff
		// portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
		// portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);	//just something that's 1 at edge of portal
		// portalLight3/=1.0 + 3.0*dot(posCosDiff3,posCosDiff3);	//just something that's 1 at edge of portal
				
		//guess maybe similar to some gaussian light source

		//blend portal colours together with fog. not great but maybe avoids possibility of negative lighting when multiple dark portals
		float totalSpecularWeight = 1.+portalLight+portalLight2+portalLight3;

		vec3 portalColor = uReflectorDiffColor + uFogColor.xyz;			//here might be better to pass in portal colour directly, not diff colour!
		vec3 portalColor2 = uReflectorDiffColor2 + uFogColor.xyz;
		vec3 portalColor3 = uReflectorDiffColor3 + uFogColor.xyz;
		vec3 totalPortalAndSkySpecular = (portalColor*portalLight + portalColor2*portalLight2 +  portalColor3*portalLight3 + uFogColor.xyz) / totalSpecularWeight;

		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + totalPortalAndSkySpecular )*adjustedColor.xyz + (1.0-fog)*uFogColor.xyz , 1.);


		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);		

#ifdef RECEIVE_SHADOW
		//something simple - draw a 3d grid to confirm moves with player vehicle model
		// vec4 shadowMultiplier = vec4(mod(1.0*posInShadowCasterSpace,1.0), 1.0);

		float shadowFactor = isoShadowFactor(posInShadowCasterSpace, shadowObjVerts[0],shadowObjVerts[1],shadowObjVerts[2]) + 
			isoShadowFactor(posInShadowCasterSpace, shadowObjVerts[3], shadowObjVerts[0], shadowObjVerts[2]) + 
			isoShadowFactor(posInShadowCasterSpace, shadowObjVerts[1], shadowObjVerts[0], shadowObjVerts[4]) +
			isoShadowFactor(posInShadowCasterSpace, shadowObjVerts[2], shadowObjVerts[1], shadowObjVerts[4]) +
			isoShadowFactor(posInShadowCasterSpace, shadowObjVerts[3], shadowObjVerts[2], shadowObjVerts[4]) +
			isoShadowFactor(posInShadowCasterSpace, shadowObjVerts[0], shadowObjVerts[3], shadowObjVerts[4]);
		vec4 shadowMultiplier = vec4(vec3(1.0-shadowFactor),1.0);

		fragColor = pow(shadowMultiplier*preGammaFragColor, vec4(0.455));
#else
		fragColor = pow(preGammaFragColor, vec4(0.455));
#endif	

		float depthVal = .5*(vZW.x/vZW.y) + .5;
		fragColor.a = depthVal;

		//gl_FragDepth = gl_FragCoord.z;	//reproduces standard behaviour. TODO try z/(1+w) for stereographic projection (with some scaling to get inside capped range. 0->1 or -1->1 ?) , to avoid near/far clipping
	}