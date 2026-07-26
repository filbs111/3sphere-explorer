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

	in vec3 vTextureCoord;
	uniform sampler2D uSampler;
#ifdef DEPTH_AWARE
	uniform sampler2D uSamplerDepthmap;
	in vec3 vScreenSpaceCoord;
#endif
	uniform vec4 uColor;
#ifdef VEC_ATMOS_THICK
	in vec3 fog;
#else	
	in float fog;
#endif
	
	uniform float uSpecularStrength;
	uniform float uSpecularPower;
	in vec4 adjustedPos;
	in vec4 transformedNormal;	
	in vec4 transformedCoord;	
	in vec4 vColor;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
	in vec4 vP;
#endif

out vec4 fragColor;

#ifdef RECEIVE_SHADOW
	in vec4 posInShadowCasterSpace;	//since shadow caster (for now, player object) is in projected flat space, scaled by some factor. TODO prevent casting shadow on opposite side of world?

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


float capSqrt(float x){
	return sqrt(max(0.,x));
}
// preventing sqrt(-ve)  fixes issue where a sphere around point opposite light caster (eg portal)
// shows as black. not sure why - expect that mag of surfPos and normalPos are orthogonal and mag 1. perhaps precision issue.
// TODO revisit derivation.

//TODO move some or all of this calculation to vertex shader.
// calculation of alpha, gamma factors can easily be per vertex
float calculatePortalLightContribution(vec4 normal, float uReflectorCos, vec4 surfPos, vec4 portalPos, vec4 reflectedEyeVec, float specAmount){
	//elevation (phi in notes) of portal "sun" in sky viewed from surface
	//in notes actually might be 0=straight above!

	float wComponent = dot(surfPos, portalPos);
	float zComponent = dot(normal, portalPos);
	float xyComponent = capSqrt(1. - wComponent*wComponent - zComponent*zComponent);
	float elev = atan(xyComponent, zComponent);
	//elev is dependent on portal position in surface frame height component vs horizontal component. 
	//TODO simplify? project onto w=1?

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
	float tanTheta = tanAlpha / capSqrt(sinGamma*sinGamma - tanAlpha*tanAlpha*cosGamma*cosGamma );
	float theta = atan(tanTheta);

	float aboveHorizonAngleSize = (sin(min(PIBYTWO, elev+theta)) - sin(min(PIBYTWO, elev-theta)));
	float contribution = aboveHorizonAngleSize*sin(theta)/2.0;

	contribution*= (cos(elev)+1.0/2.0);	//make go to 0 on opposite side of world. 
		//NOTE might be wrong - if there is a clear view of it, portal really does appear very large from opposite side of world.
		//however, this does fix issue of lighting becoming wierd (negative?) when lit object is within volume opposite the portal volume.
		//TODO shadow map/atmos calc etc

#ifdef SPECULAR_ACTIVE

	vec4 directionToPortalLight = normalize( normalize(surfPos+SMALL_AMOUNT*portalPos ) - surfPos);
	float dotProd = max(dot(reflectedEyeVec, directionToPortalLight), 0.);
	float angleDifference = acos(dotProd) - theta;

	//return (angleDifference < 0.) ? 1.: 0.;		//NOTE sign change unexpected! are cosine vals -ve here?

	float specularSharpness = uSpecularPower;	//how sharp reflected image is. resuse existing variable "specular power
	float specularContrib = .5*(tanh(-angleDifference*specularSharpness) + 1.);		//NOTE function of angle so a bit bodgy - expect a point in middle or reflection of disc, but not obvious to viewer.

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

//#ifndef DEPTH_AWARE	//other depth aware frag shaders disable depth write, because already done z prepass. 
	//, but still want to write depth when drawing sea, which this shader used for
	//TODO separate shader for sea if impacts perf
#ifdef CUSTOM_DEPTH
		// here x=w, y=z, but also confusingly switched by pMatrix ! 
		//TODO if this works, don't bother creating vZW in vert shader.
		//if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
		//float depthVal = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
		float depthVal = -.3183*atan(vP.w/length(vP.xyz)) + .5;
		gl_FragDepth = depthVal;
#endif
//#endif

		vec4 normalisedSurfCoord = normalize(transformedCoord);

		float posCosDiff = dot(normalisedSurfCoord,uReflectorPos) - uReflectorCos;
		if (posCosDiff>0.0){
			discard;
		}

		float posCosDiff2 = dot(normalisedSurfCoord,uReflectorPos2) - uReflectorCos2;
		if (posCosDiff2>0.0){
			discard;	//unnecessary if ensure that when viewing through a portal, that portal is 1st.
		}

		float posCosDiff3 = dot(normalisedSurfCoord,uReflectorPos3) - uReflectorCos3;
		if (posCosDiff3>0.0){
			discard;	//unnecessary if ensure that when viewing through a portal, that portal is 1st.
		}

		vec4 norm = normalize(transformedNormal);

		vec4 adjustedPosNormalised = normalize(adjustedPos);
		float light = -dot( adjustedPosNormalised, transformedNormal);
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		

#ifdef SPECULAR_ACTIVE
	//other specular implementation is in tangent space.
	//this uses 4vecs. guessed but appears to work fine.
	vec4 eyePos = vec4(0.,0.,0.,1.);

	//directions are what matter. approximate by using small_amount. TODO more efficient formulation
	//TODO what is adjustedpos, what is transformedPos? 
	vec4 directionToEye = normalize( normalize(transformedCoord+SMALL_AMOUNT*eyePos) -  normalisedSurfCoord);
	vec4 directionToLight = normalize( normalize(transformedCoord-SMALL_AMOUNT*adjustedPosNormalised ) -  normalisedSurfCoord);
	vec4 halfVec = normalize( directionToEye + directionToLight);

	float phongAmount = uSpecularStrength*pow( max(dot(halfVec, norm), 0.),uSpecularPower);
	light*=(1.-uSpecularStrength);
	light+=phongAmount;

	//reflect eye vec in surface.
	vec4 reflectedEyeVec = 2.*norm*dot(directionToEye, norm) - directionToEye;

	//schlick R0 + (1-R0)(1+cost)^5 , where t = view angle (where 0 = looking directly at surface) 
	float cost = dot(directionToEye, norm);	//whatever this is is 0 for glancing suppose this is sint
	//float ctsq = 1. - something*something;
	float r0 = uSpecularStrength;
	float schlick = r0 + (1.-r0)*pow(1.-cost,5.);
#else
	vec4 reflectedEyeVec = vec4(0.);	//unused 
	float schlick=0.;

#endif
		//falloff
		light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);

	//NOTE still using old lighting calc for player light above. TODO use calculatePortalLightContribution or similar. maybe should behave more like gauss light, or area light for thruster?...


		//light from portal
	float portalLight = calculatePortalLightContribution(norm, uReflectorCos, normalisedSurfCoord, uReflectorPos, reflectedEyeVec, schlick);
	float portalLight2 = calculatePortalLightContribution(norm, uReflectorCos2, normalisedSurfCoord, uReflectorPos2, reflectedEyeVec, schlick);
	float portalLight3 = calculatePortalLightContribution(norm, uReflectorCos3, normalisedSurfCoord, uReflectorPos3, reflectedEyeVec, schlick);


#ifdef VCOLOR
		vec4 adjustedColor = uColor*vColor;	//TODO this logid in vert shader
#else
		vec4 adjustedColor = uColor;
#endif		
		

		//blend portal colours together with fog. not great but maybe avoids possibility of negative lighting when multiple dark portals
		float totalSpecularWeight = 1.+portalLight+portalLight2+portalLight3;
		
		vec3 portalColor = uReflectorDiffColor + uFogColor.xyz;			//here might be better to pass in portal colour directly, not diff colour!
		vec3 portalColor2 = uReflectorDiffColor2 + uFogColor.xyz;
		vec3 portalColor3 = uReflectorDiffColor3 + uFogColor.xyz;
		vec3 totalPortalAndSkySpecular = (portalColor*portalLight + portalColor2*portalLight2 +  portalColor3*portalLight3 + uFogColor.xyz) / totalSpecularWeight;

		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor.xyz*light + totalPortalAndSkySpecular )*adjustedColor.xyz*textureProj(uSampler, vTextureCoord).xyz + (1.0-fog)*uFogColor.xyz , 1.);
		
		//tone mapping
		preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);


#ifdef RECEIVE_SHADOW
		vec3 posInShadowCasterSpace3d= 3000.*posInShadowCasterSpace.xyz/posInShadowCasterSpace.w;

		//something simple - draw a 3d grid to confirm moves with player vehicle model
		//vec4 shadowMultiplier = vec4( mod( posInShadowCasterSpace3d , 1.0) , 1.0);

		float shadowFactor = isoShadowFactor(posInShadowCasterSpace3d, shadowObjVerts[0],shadowObjVerts[1],shadowObjVerts[2]) + 
			isoShadowFactor(posInShadowCasterSpace3d, shadowObjVerts[3], shadowObjVerts[0], shadowObjVerts[2]) + 
			isoShadowFactor(posInShadowCasterSpace3d, shadowObjVerts[1], shadowObjVerts[0], shadowObjVerts[4]) +
			isoShadowFactor(posInShadowCasterSpace3d, shadowObjVerts[2], shadowObjVerts[1], shadowObjVerts[4]) +
			isoShadowFactor(posInShadowCasterSpace3d, shadowObjVerts[3], shadowObjVerts[2], shadowObjVerts[4]) +
			isoShadowFactor(posInShadowCasterSpace3d, shadowObjVerts[0], shadowObjVerts[3], shadowObjVerts[4]);
		vec4 shadowMultiplier = vec4(vec3(1.0-shadowFactor),1.0);

		fragColor = pow(shadowMultiplier*preGammaFragColor, vec4(0.455));
#else
		fragColor = pow(preGammaFragColor, vec4(0.455));
#endif	

		//fragColor = vec4( pow(preGammaFragColor.r,0.455), pow(preGammaFragColor.g,0.455), pow(preGammaFragColor.b,0.455), pow(preGammaFragColor.a,0.455));
	
		
		//fragColor = uColor*fog*textureProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
		//fragColor = (1.0-fog)*uFogColor;

#ifdef DEPTH_AWARE
		//preGammaFragColor.rgb = texture(uSamplerDepthmap, gl_FragCoord.xy).rgb;	//just something to show can use texture.
		float depthDifference = newDepth - currentDepth;	//TODO calculate actual length difference
		//preGammaFragColor = vec4( vec3(depthDifference) ,1.);	//TODO use coords that project without extra term
		fragColor.a = 1.-exp(depthDifference*40000.);
#else

	#ifdef CUSTOM_DEPTH
			fragColor.a = depthVal;	//note this is missed ifdef depth_aware, so blur on sea won't be right
	#else
			fragColor.a =1.0;
	#endif

#endif	
	}