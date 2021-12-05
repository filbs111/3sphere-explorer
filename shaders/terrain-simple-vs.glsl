attribute vec3 aVertexPosition;
attribute vec2 aVertexGradient;

uniform mat4 uMMatrix;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec4 uCameraWorldPos;	//used for atmos calcs. TODO can this be combined with/ used for eyepos calculation (used for specular)?

#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	varying vec3 fog;
#else
	uniform float uAtmosThickness;
	varying float fog;
#endif
uniform float uAtmosContrast;

varying vec2 vPos;
varying vec2 vGrad;
varying vec2 vTexBlend;

varying vec4 vDebugColor;

varying vec2 vZW;	//for custom depth

void main(void) {
	// vec4 transformedCoord = uMVMatrix * vec4(aVertexPosition*0.5,1.0);	//todo use 4x3 mat?
		//^^3d version from terrainTest. 
		
	// vec3 uModelScale = vec3(5.0);	//TODO pass in? maybe pointless for terrain
 	// vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));

//mapping to duocylinder surface
//TODO pretransform vertices (and guarantee no seam on wraparound)
// x = cosCylRadius * Math.sin(ang1));
// y = cosCylRadius * Math.cos(ang1));
	
// z = sinCylRadius * Math.sin(ang2));
// w = sinCylRadius * Math.cos(ang2));

	vec3 scaledPosition = 2.0*3.141593*aVertexPosition;

	float cylRad =  3.141593/4.0 + scaledPosition.z;
	float cosR = cos(cylRad);
	float sinR = sin(cylRad);
	vec4 aVertexPositionNormalized = normalize(vec4(cosR*sin(scaledPosition.x), cosR*cos(scaledPosition.x), sinR*sin(scaledPosition.y), sinR*cos(scaledPosition.y)));

    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;

	gl_Position = uPMatrix * transformedCoord;	
	vPos = aVertexPosition.xy;
	vGrad = 1024.0*aVertexGradient;	//should be muiltiplied by grid squares per unit.
	float amountTexB = smoothstep (-0.01, 0.01, aVertexPosition.z);
	vTexBlend = vec2(1.0-amountTexB, amountTexB);

	vDebugColor = vec4(1.0 + 0.0*amountTexB);	//add 0*something to prevent what i suspect is compiler playing silly buggers
	//and stripping out varying.



#ifdef ATMOS_CONSTANT		
#ifdef VEC_ATMOS_THICK
		fog = vec3(0.5*(1.0 + transformedCoord.w));
#else
		fog = 0.5*(1.0 + transformedCoord.w);
#endif
#else
		vec4 worldCoord = uMMatrix * aVertexPositionNormalized;
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





	vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
}