#version 300 es
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
	return contribution;
}

vec4 vecPerpendicularToVec(vec4 sourceVec, vec4 perpVec){
	//remove component of sourceVec parallel to perpVec and renormalise.

	float dotProd = dot(sourceVec, perpVec);
	vec4 newVec = sourceVec - perpVec*dotProd;
	return newVec;
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
	

		float posDotNormal = dot( normalize(adjustedPos), transformedNormal);

		float light = -posDotNormal;
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		//falloff
		light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);	//1st num some const to ensure light doesn't go inf at short dist
		
		//light from portals
		vec4 norm = vecPerpendicularToVec(transformedNormal, normalisedSurfCoord);
			//NOTE doing this because seems that surfPos and normal might not be perpendicular!
			//if don't do this, see low lighting (with clear onset band) for normal towards light direction, seems because 
			// pos^2 + norm^2 > 1, so xy component = sqrt(1 - pos^2 - norm^2) is doing sqrt(-ve). seen problem with teapot. 
			// suspect vshader norm calc approx fails for large objects. Suspect norms here still wrong for large objs.
			// TODO fix vert shader. 
			// NOTE unknown if problem exists in vert shaders that translate into tangent space for normal map.
		
		float portalLight = calculatePortalLightContribution(norm, uReflectorCos, normalisedSurfCoord, uReflectorPos);
		float portalLight2 = calculatePortalLightContribution(norm, uReflectorCos2, normalisedSurfCoord, uReflectorPos2);
		float portalLight3 = calculatePortalLightContribution(norm, uReflectorCos3, normalisedSurfCoord, uReflectorPos3);
				
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