#version 300 es
#define SMALL_AMOUNT 0.01
	#define PIBYTWO 1.5707963

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

	uniform float uSpecularStrength;
	uniform float uSpecularPower;

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
	float cosGamma = wComponent;
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
	specAmount = min(specAmount,1.);	//TODO why does input specAmount go above 1? 

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


float calculateSimpleLightContribution(vec4 normal, float lightRad, vec4 surfPos, vec4 lightPos){
	float wComponent = dot(surfPos, lightPos);
	float gamma = acos(wComponent);

	//perceived size is like 1/sin(gamma)
	float perceivedInvSizeSq = 1.0+pow(sin(gamma)/lightRad,2.0);	//1.0+ is to limit size (so doesn't become inf when very close.)

	float zComponent = dot(normal, lightPos);

	float xyzComponent = sqrt(1. - wComponent*wComponent);
	float cosElev = zComponent/xyzComponent;	//Angle from azimuth? = cos(elevation from horizon)

	//bodge to also light regardless of distance when very close.
	//NOTE has some stripey black artifacts when very near very long polys. numerical error? wrong assumptions about normal perpendicular to surfPos?
	//TODO try something more like portal light? 
	float veryCloseFactor = pow(2.71, -perceivedInvSizeSq);
	float modifiedCosElev = veryCloseFactor + cosElev*(1.0-veryCloseFactor);

	modifiedCosElev = max(cosElev,0.0);	//prevent negative lighting. 
	
	return modifiedCosElev/perceivedInvSizeSq;
}


	void main(void) {

		vec4 normalisedSurfCoord = normalize(transformedCoord);

		float posCosDiff = dot(normalisedSurfCoord,uReflectorPos) - uReflectorCos;
		if (posCosDiff>0.0){
			discard;
		}

		float posCosDiff2 = dot(normalisedSurfCoord,uReflectorPos2) - uReflectorCos2;
		if (posCosDiff2>0.0){
			discard;	//unnecessary if, when viewing thru portal, ensure is other one.
		}

		float posCosDiff3 = dot(normalisedSurfCoord,uReflectorPos3) - uReflectorCos3;
		if (posCosDiff3>0.0){
			discard;	//unnecessary if, when viewing thru portal, ensure is other one.
		}
	
		vec4 norm = normalize(transformedNormal);
		
	//improved player light. 
	// from vert shader 		adjustedPos = transformedCoord - uDropLightPos;
	// so can get back to uDropLightPos ! TODO if this works just use directly here.
		vec4 recalculatedPlayerLightPos = normalize(normalisedSurfCoord - adjustedPos);
			//TODO does this work for all vert shaders? 

		//TODO treat as more like a gaussian blob light - otherwise will have wierd lighting inside radius.
		//float light = calculatePortalLightContribution(norm, 0.9999, normalisedSurfCoord, recalculatedPlayerLightPos);
		float light = calculateSimpleLightContribution(norm, 0.04, normalisedSurfCoord, recalculatedPlayerLightPos);


#ifdef SPECULAR_ACTIVE
	//other specular implementation is in tangent space.
	//this uses 4vecs. guessed but appears to work fine.
	vec4 eyePos = vec4(0.,0.,0.,1.);

	//directions are what matter. approximate by using small_amount. TODO more efficient formulation
	//TODO what is adjustedpos, what is transformedPos? 
	vec4 directionToEye = normalize( normalize(transformedCoord+SMALL_AMOUNT*eyePos) -  normalisedSurfCoord);
	
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

		//light from portals
		float portalLight = calculatePortalLightContribution(norm, uReflectorCos, normalisedSurfCoord, uReflectorPos, reflectedEyeVec, schlick);
		float portalLight2 = calculatePortalLightContribution(norm, uReflectorCos2, normalisedSurfCoord, uReflectorPos2, reflectedEyeVec, schlick);
		float portalLight3 = calculatePortalLightContribution(norm, uReflectorCos3, normalisedSurfCoord, uReflectorPos3, reflectedEyeVec, schlick);
				
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