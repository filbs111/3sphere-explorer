#version 300 es
#define SMALL_AMOUNT 0.01
	#define PIBYTWO 1.5707963

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

	uniform sampler2D uSampler;
	uniform sampler2D uSamplerB;
#ifdef DEPTH_AWARE
	uniform sampler2D uSamplerDepthmap;
	in vec3 vScreenSpaceCoord;
#endif
	uniform vec4 uColor;
	uniform float uSpecularStrength;
	uniform float uSpecularPower;

#ifdef VEC_ATMOS_THICK
	in vec3 fog;
#else	
	in float fog;
#endif
	in vec4 vPlayerLightPosTangentSpace;
	
	in vec4 vPortalLightPosTangentSpace;
	in vec4 vPortalLightPosTangentSpace2;
	in vec4 vPortalLightPosTangentSpace3;

	in vec4 vEyePosTangentSpace;
	in vec4 transformedCoord;	
	in vec4 vColor;
	in vec3 vPos;		//3vector position (before mapping onto duocyinder)
	in vec3 vNormal;
	in vec3 vTexAmounts;
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
float calculatePortalLightContribution(vec3 vPortalLightPosTangentSpace, vec3 nmapNormal, float uReflectorCos, vec4 surfPos, vec4 portalPos, vec3 reflectedEyeVec, float specAmount){
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



	contribution*= cos(elev)+1.0/2.0;	//make go to 0 on opposite side of world. 
		//NOTE might be wrong - if there is a clear view of it, portal really does appear very large from opposite side of world.
		//however, this does fix issue of lighting becoming wierd (negative?) when lit object is within volume opposite the portal volume.
		//TODO shadow map/atmos calc etc




#ifdef SPECULAR_ACTIVE

	//specAmount = max(specAmount,0.);	//avoid problem due to normal not matching physical normal
	specAmount = min(specAmount,1.);	//TODO why does input specAmount go above 1? 

	float dotProd = max(dot(reflectedEyeVec, vPortalLightPosTangentSpace), 0.);
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

		//extract old uniforms from 4vecs
		vec3 uReflectorDiffColor = uReflectorDiffColorAndCos.xyz;
		float uReflectorCos = uReflectorDiffColorAndCos.w;
		vec3 uReflectorDiffColor2 = uReflectorDiffColorAndCos2.xyz;
		float uReflectorCos2 = uReflectorDiffColorAndCos2.w;
		vec3 uReflectorDiffColor3 = uReflectorDiffColorAndCos3.xyz;
		float uReflectorCos3 = uReflectorDiffColorAndCos3.w;

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

		float posCosDiff = dot(normalisedSurfCoord,uReflectorPos) - uReflectorCos;
		float posCosDiff2 = dot(normalisedSurfCoord,uReflectorPos2) - uReflectorCos2;
		float posCosDiff3 = dot(normalisedSurfCoord,uReflectorPos3) - uReflectorCos3;

		if (posCosDiff>0.0){
			discard;
		}
		if (posCosDiff2>0.0){
			discard;	//unnecessary if, when looking through portal (ie drawing cube map), is other portal 
		}
		if (posCosDiff3>0.0){
			discard;	//unnecessary if, when looking through portal (ie drawing cube map), is other portal 
		}
/*	
		//discard some pix, see if makes drawing faster
		vec3 vPosMod = ( 100.*vPos - floor(100.*vPos) ) - 0.5;
		float vPosModDot = dot(vPosMod,vPosMod);
		if (vPosModDot<0.2){discard;}
*/
		float texOffset = 0.5;
		float texScale = 20.;

#ifdef DIFFUSE_TEX_ACTIVE

//vec3 texColor = texture(uSamplerB, vec2(vPos.y, vPos.z)).xyz;	//???
//vec3 texColor = vec3(.5+vPos.x);	//seems to be uphill direction 
//vec3 texColor = vec3(.5+vPos.y);	//seems to be downhill direction 
//vec3 texColor = vec3(.5+vPos.z);	//seems to be vertical direction 
	
//vec3 texColor = texture(uSamplerB, texScale*vec2(vPos.y, vPos.x) ).xyz * vTexAmounts.y; //top-down texture
//vec3 texColor = texture(uSamplerB, texScale*vec2(vPos.x, vPos.z) ).xyz * vTexAmounts.x;
//vec3 texColor = texture(uSamplerB, texScale*vec2(vPos.z, vPos.y) ).xyz * vTexAmounts.z;

vec3 texColor = mat3(texture(uSamplerB, texScale*vec2(vPos.x, vPos.z)).xyz, texture(uSamplerB, texScale*vec2(vPos.y, vPos.x + texOffset )).xyz, texture(uSamplerB, texScale*vec2(vPos.z + texOffset, vPos.y + texOffset )).xyz) * vTexAmounts;

//vec3 texColor = vTexAmounts;

#else	
		vec3 texColor = vec3(1.);		//todo use above to combine diffuse with normal map effect
#endif

		float nmapStrength = -0.5;
			//TODO check whether normal maps use linear or sRGB space
			//TODO include ambient occlusion/colour map to match normal map (don't need z component of normal map anyway)

		//sample normal map in different directions.
		//vec3 normsq = sqrt(vNormal*vNormal);	//maybe not exactly right - something to stop texture stretching
		vec3 normsq = abs(vNormal);	//maybe not exactly right - something to stop texture stretching

		vec3 nmapA = vec3 ( texture(uSampler, texScale*vec2(vPos.x, vPos.z)).xy - vec2(0.5) , 0.0);	//TODO matrix formulation?
		vec3 nmapB = vec3 ( texture(uSampler, texScale*vec2(vPos.y, vPos.x + texOffset )).xy - vec2(0.5) ,0.0);
		vec3 nmapC = vec3 ( texture(uSampler, texScale*vec2(vPos.z + texOffset, vPos.y + texOffset )).xy - vec2(0.5) ,0.0);
		
		vec3 nmapNormal = normalize( vNormal + nmapStrength * (normsq.x*nmapA.zxy + normsq.y*nmapB.xzy + normsq.z*nmapC.xyz ) );
		
		//texColor = nmapNormal;	//test. TODO check normal map looks right - might depend on texture - gl vs directx

		
		vec4 normalizedLightPos = normalize(vPlayerLightPosTangentSpace);
		vec3 normalizedLightPosAdj = normalize(vPlayerLightPosTangentSpace.xyz);
		
		float light = dot( normalizedLightPosAdj, nmapNormal);	
		
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		
#ifdef SPECULAR_ACTIVE
		vec3 normalizedEyePosAdj = normalize(vEyePosTangentSpace.xyz);	
		
		
	//reflect eye vec in surface. 
	vec3 reflectedEyeVec = 2.*nmapNormal*dot(normalizedEyePosAdj, nmapNormal) - normalizedEyePosAdj;
	//vec3 reflectedEyeVec = 2.*vNormal*dot(normalizedEyePosAdj, vNormal) - normalizedEyePosAdj;	//works (ignores normal map)

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

		//light from portal.
		vec3 vPortalLightPosTangentSpaceAdj =normalize(vPortalLightPosTangentSpace.xyz);
		vec3 vPortalLightPosTangentSpaceAdj2 =normalize(vPortalLightPosTangentSpace2.xyz);
		vec3 vPortalLightPosTangentSpaceAdj3 =normalize(vPortalLightPosTangentSpace3.xyz);
		
		float portalLight = calculatePortalLightContribution(vPortalLightPosTangentSpaceAdj, nmapNormal, uReflectorCos, normalisedSurfCoord, uReflectorPos, reflectedEyeVec, schlick);
		float portalLight2 = calculatePortalLightContribution(vPortalLightPosTangentSpaceAdj2, nmapNormal, uReflectorCos2, normalisedSurfCoord, uReflectorPos2, reflectedEyeVec, schlick);
		float portalLight3 = calculatePortalLightContribution(vPortalLightPosTangentSpaceAdj3, nmapNormal, uReflectorCos3, normalisedSurfCoord, uReflectorPos3, reflectedEyeVec, schlick);


		//falloff
		// portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
		// portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);
		// portalLight3/=1.0 + 3.0*dot(posCosDiff3,posCosDiff3);
#ifdef VCOLOR
		//vec4 adjustedColor = uColor*vColor;	//TODO this logid in vert shader
		vec4 adjustedColor = uColor;	//temporarily disable this feature -seems input color data broken - some are black. reenable when fix data.
#else
		vec4 adjustedColor = uColor;
#endif
		

		//blend portal colours together with fog. not great but maybe avoids possibility of negative lighting when multiple dark portals
		float totalSpecularWeight = 1.+portalLight+portalLight2+portalLight3;
		
		vec3 portalColor = uReflectorDiffColor + uFogColor.xyz;			//here might be better to pass in portal colour directly, not diff colour!
		vec3 portalColor2 = uReflectorDiffColor2 + uFogColor.xyz;
		vec3 portalColor3 = uReflectorDiffColor3 + uFogColor.xyz;
		vec3 totalPortalAndSkySpecular = (portalColor*portalLight + portalColor2*portalLight2 +  portalColor3*portalLight3 + uFogColor.xyz) / totalSpecularWeight;

		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor.xyz*light + totalPortalAndSkySpecular )*adjustedColor.xyz*texColor + (1.0-fog)*uFogColor.xyz , 1.);
				
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


		//fragColor.rgb = vec3(schlick);
	}