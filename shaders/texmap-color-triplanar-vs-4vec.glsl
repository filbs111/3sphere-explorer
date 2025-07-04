#version 300 es
//TODO determine whether more efficient to calc aVertexPosition, aVertexNormal from aTriCoord, aTriNormal here in vert shader, or precalc and pass in.
	in vec4 aVertexPosition;
	in vec4 aVertexNormal;
	in vec3 aVertexColor;	//todo 4vec?
	in vec3 aTriCoord;
	in vec3 aTriNormal;
	uniform float uAtmosThickness;
	uniform float uAtmosContrast;
	uniform mat4 uMMatrix;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform vec4 uCameraWorldPos;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform vec3 uPlayerLightColor;
	uniform vec3 uReflectorDiffColor;
	uniform vec4 uReflectorPos;
	uniform float uReflectorCos;
	out float fog;
	out vec3 veclight;
	out vec3 vPos;		//3vector position (before mapping onto duocyinder)
	out vec3 vTexAmounts;
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif	
	void main(void) {
		vec4 transformedCoord = uMVMatrix * aVertexPosition;
		gl_Position = uPMatrix * transformedCoord;
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif

#ifdef ATMOS_CONSTANT		
		fog = 0.5*(1.0 + transformedCoord.w);
#else
		vec4 worldCoord = uMMatrix * aVertexPosition;
		float dotProd = dot(uCameraWorldPos,worldCoord);
		
		vec4 normalDirection = normalize(worldCoord - dotProd*uCameraWorldPos);	//point 90 deg around world from camera, in direction of worldCoord
		
		float partOne = dot(uCameraWorldPos.xy, uCameraWorldPos.xy);
		float partTwo = dot(normalDirection.xy, normalDirection.xy);
		float constTerm = (partOne+partTwo)/2.0;
		float cos2Term = (partOne-partTwo)/2.0;
		float sin2Term = dot(uCameraWorldPos.xy, normalDirection.xy);
		float shiftAngle = atan(cos2Term,sin2Term);
		//float magTerm = sqrt(cos2Term*cos2Term+sin2Term*sin2Term);
		float magTerm = length(vec2(cos2Term, sin2Term));
		
		float maxDoubleAng = 2.0*acos(dotProd);
#endif
#ifdef ATMOS_ONE
		float maxDoubleAngOverIters = maxDoubleAng/CONST_ITERS;
		
		float total=0.0;
		for (float aa=0.5;aa<CONST_ITERS;aa++){
			float rsq = magTerm*sin(aa*maxDoubleAngOverIters+shiftAngle);
			total+= exp(uAtmosContrast*rsq);
		}
		total*= maxDoubleAngOverIters*exp(uAtmosContrast*(constTerm));	
		fog = exp(-uAtmosThickness*total/2.0);
#endif
#ifdef ATMOS_TWO
		float kk = magTerm * uAtmosContrast;
		float ksq = kk*kk;

		float maxA = maxDoubleAng+shiftAngle;

		float kcxa = kk*cos(maxA);
		float kcxb = kk*cos(shiftAngle);
		float ksxa = kk*sin(maxA);
		float ksxb = kk*sin(shiftAngle);
		float kcxasq=kcxa*kcxa;
		float kcxbsq=kcxb*kcxb;
		
		float integral=(1.0+ksq/4.0 + ksq*ksq/64.0)*(maxA -shiftAngle);
		integral-= (1.0+ksq/8.0)*(kcxa-kcxb);
		integral-=(ksq/48.0+0.25)*(kcxa*ksxa - kcxb*ksxb);
		integral+=(kcxa*kcxasq - kcxb*kcxbsq)*(4.0/72.0);
		integral-=ksq*(kcxa -kcxb)*(3.0/72.0);
		integral+=(4.0/768.0)*((2.0*kcxasq-ksq)*kcxa*ksxa -(2.0*kcxbsq-ksq)*kcxb*ksxb);

		float total=integral*exp(uAtmosContrast*constTerm);
		fog = exp(-uAtmosThickness*total/2.0);
#endif
		
		
		vec4 transformedNormal = uMVMatrix * aVertexNormal;
		vec4 adjustedPos = transformedCoord - uDropLightPos;
		float light = -dot( normalize(adjustedPos), transformedNormal);
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		light/=1.0 + 4.2*dot(adjustedPos,adjustedPos);		//terms higher than other shaders by sqrt(2) because length
															//of 1,0,0,0 -> 0,1,0,0 (90 deg around world)
															//todo recalc
		//TODO can process multiple lights using matrix?
		
		veclight=uPlayerLightColor*light;
		
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
	
		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!
		float portalLight = dot( uReflectorPos, transformedNormal);
		
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos
		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
				
		veclight+=uReflectorDiffColor*portalLight;
		veclight*=aVertexColor;
		//veclight=aVertexColor;
				
		//vTexAmounts = vec3(1.0);	//aTriNormal*aTriNormal;
		vPos = aTriCoord;
		vTexAmounts = aTriNormal*aTriNormal;
	}