#version 300 es
#define SMALL_AMOUNT 0.01
	#define PIBYTWO 1.5707963

	precision mediump float;
	in vec3 vTextureCoord;
	uniform sampler2D uSampler;
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


//TODO move some or all of this calculation to vertex shader.
// calculation of alpha, gamma factors can easily be per vertex
float calculatePortalLightContribution(vec4 normal, float uReflectorCos, vec4 surfPos, vec4 portalPos){
	//elevation (phi in notes) of portal "sun" in sky viewed from surface
	//in notes actually might be 0=straight above!

	float wComponent = dot(surfPos, portalPos);
	float zComponent = dot(normal, portalPos);
	float xyComponent = sqrt(1. - wComponent*wComponent - zComponent*zComponent);
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
	float tanTheta = tanAlpha / sqrt(sinGamma*sinGamma - tanAlpha*tanAlpha*cosGamma*cosGamma );
	float theta = atan(tanTheta);

	float aboveHorizonAngleSize = (sin(min(PIBYTWO, elev+theta)) - sin(min(PIBYTWO, elev-theta)));
	float contribution = aboveHorizonAngleSize*sin(theta)/2.0;

	contribution*= (cos(elev)+1.0/2.0);	//make go to 0 on opposite side of world. 
		//NOTE might be wrong - if there is a clear view of it, portal really does appear very large from opposite side of world.
		//however, this does fix issue of lighting becoming wierd (negative?) when lit object is within volume opposite the portal volume.
		//TODO shadow map/atmos calc etc

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
	vec4 directionToEye = normalize( normalize(transformedCoord+SMALL_AMOUNT*eyePos) -  normalize(transformedCoord));
	vec4 directionToLight = normalize( normalize(transformedCoord-SMALL_AMOUNT*adjustedPosNormalised ) -  normalize(transformedCoord));
	vec4 halfVec = normalize( directionToEye + directionToLight);

	float phongAmount = uSpecularStrength*pow( max(dot(halfVec, norm), 0.),uSpecularPower);
	light*=(1.-uSpecularStrength);
	light+=phongAmount;
#endif
		//falloff
		light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);

		//light from portal
		float portalLight = calculatePortalLightContribution(norm, uReflectorCos, normalisedSurfCoord, uReflectorPos);
		float portalLight2 = calculatePortalLightContribution(norm, uReflectorCos2, normalisedSurfCoord, uReflectorPos2);
		float portalLight3 = calculatePortalLightContribution(norm, uReflectorCos3, normalisedSurfCoord, uReflectorPos3);

#ifdef SPECULAR_ACTIVE		
		//note maybe faster if calculate half vector in vert shader. (expect interpolates ok).  		
		vec4 directionToPortalLight = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToPortalLight);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight*=(1.-uSpecularStrength);
		portalLight+=phongAmount;

		//second portal light
		directionToPortalLight = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos2 ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToPortalLight);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight2*=(1.-uSpecularStrength);
		portalLight2+=phongAmount;

		//third portal light
		directionToPortalLight = normalize( normalize(transformedCoord+SMALL_AMOUNT*uReflectorPos3 ) -  normalize(transformedCoord));
		halfVec = normalize( directionToEye + directionToPortalLight);
		
		phongAmount = uSpecularStrength*pow( max(dot(halfVec, normalize(transformedNormal)), 0.),uSpecularPower);
		portalLight3*=(1.-uSpecularStrength);
		portalLight3+=phongAmount;
#endif

		//falloff
		// portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
		// portalLight2/=1.0 + 3.0*dot(posCosDiff2,posCosDiff2);
		// portalLight3/=1.0 + 3.0*dot(posCosDiff3,posCosDiff3);

#ifdef VCOLOR
		vec4 adjustedColor = uColor*vColor;	//TODO this logid in vert shader
#else
		vec4 adjustedColor = uColor;
#endif		
		
		//guess maybe similar to some gaussian light source
		//vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz ), 1.0)*adjustedColor*textureProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;

		vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uReflectorDiffColor2*portalLight2 + uReflectorDiffColor3*portalLight3 + uFogColor.xyz )*adjustedColor.xyz*textureProj(uSampler, vTextureCoord).xyz + (1.0-fog)*uFogColor.xyz , 1.);
		
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