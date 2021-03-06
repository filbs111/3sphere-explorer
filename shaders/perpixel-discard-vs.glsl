    attribute vec3 aVertexPosition;
	attribute vec3 aVertexNormal;
#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	varying vec3 fog;
#else
	uniform float uAtmosThickness;
	varying float fog;
#endif
	uniform float uAtmosContrast;
#ifdef BENDY_
	uniform mat4 uMMatrixA;
	uniform mat4 uMVMatrixA;
	uniform mat4 uMMatrixB;
	uniform mat4 uMVMatrixB;	//TODO don't have separate mmatrix, mvmatrix x 2 for bendy. should be able to have fewer inputs
#else
	uniform mat4 uMMatrix;
	uniform mat4 uMVMatrix;
#endif
	uniform mat4 uPMatrix;
	uniform vec4 uCameraWorldPos;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform vec3 uModelScale;
	varying vec4 adjustedPos;
	varying vec4 transformedNormal;
	varying vec4 transformedCoord;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
	void main(void) {	

#ifdef BENDY_

//todo simpler formulation!

vec4 scaledCoord = vec4( uModelScale*aVertexPosition, 1.0);
vec4 xyFlatCoord = normalize(scaledCoord * vec4(1.0,1.0,0.0,1.0));
//vec4 zFlatCoord = scaledCoord * vec4(0.0,0.0,1.0,1.0);	//TODO simply maths by using fact that transformedCoord-flatCoord = ?

vec2 blendWeights = 0.5*(1.0 + aVertexPosition.z*vec2(1.0,-1.0));

vec4 transformedCoordEndA = uMVMatrixA * xyFlatCoord;
vec4 transformedCoordEndB = uMVMatrixB * xyFlatCoord;
vec4 avgCoord1 = blendWeights.x*transformedCoordEndA + blendWeights.y*transformedCoordEndB;

vec4 aVertexPositionNormalizedA = normalize(vec4(uModelScale*(aVertexPosition-vec3(0.0,0.0,1.0)), 1.0));
vec4 aVertexPositionNormalizedB = normalize(vec4(uModelScale*(aVertexPosition+vec3(0.0,0.0,1.0)), 1.0));
vec4 transformedCoordA = uMVMatrixA * aVertexPositionNormalizedA;
vec4 transformedCoordB = uMVMatrixB * aVertexPositionNormalizedB;
vec4 avgCoord2 = blendWeights.x*transformedCoordA + blendWeights.y*transformedCoordB;

float weighting = aVertexPosition.z*aVertexPosition.z;

//transformedCoord = normalize(0.5*(avgCoord1*(1.0-weighting) + avgCoord2*(1.0+weighting)));	//guess, but seems bit wrong at ends
transformedCoord = normalize(0.5*(avgCoord1*(3.0-weighting) + avgCoord2*(3.0+weighting)));	//seems about right. 

vec4 transformedNormalA = uMVMatrixA * vec4(aVertexNormal,0.0);
vec4 transformedNormalB = uMVMatrixB * vec4(aVertexNormal,0.0);
transformedNormal = blendWeights.x*transformedNormalA + blendWeights.y*transformedNormalB;	//approx. TODO use equivalent logic as vertex position

#else
		vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
		transformedCoord = uMVMatrix * aVertexPositionNormalized;
		transformedNormal = uMVMatrix * vec4(aVertexNormal,0.0);
#endif

#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
#endif	
		
		adjustedPos = transformedCoord - uDropLightPos;


		gl_Position = uPMatrix * transformedCoord;
	
#ifdef ATMOS_CONSTANT		
#ifdef VEC_ATMOS_THICK
		fog = vec3(0.5*(1.0 + transformedCoord.w));
#else
		fog = 0.5*(1.0 + transformedCoord.w);
#endif
#else		
#ifdef BENDY_
		vec4 worldCoord = uMMatrixA * aVertexPositionNormalizedA;	//TODO interpolation (currently just using val for 1 matrix)
#else
		vec4 worldCoord = uMMatrix * aVertexPositionNormalized;
#endif		
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
	}