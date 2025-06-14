#version 300 es
    in vec3 aVertexPosition;
	in vec3 aVertexNormal;
#ifdef VERTCOLOR
	in vec3 aVertexColor;
#endif
#ifdef TEXMAP
	in vec3 aTextureCoord;
	out vec3 vTextureCoord;
#endif
#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	out vec3 fog;
#else
	uniform float uAtmosThickness;
	out float fog;
#endif
	uniform float uAtmosContrast;

#ifdef BENDY_
	#ifdef INSTANCED
		in vec4 aMMatrixA_A;
		in vec4 aMMatrixA_B;
		in vec4 aMMatrixA_C;
		in vec4 aMMatrixA_D;
		in vec4 aMMatrixB_A;
		in vec4 aMMatrixB_B;
		in vec4 aMMatrixB_C;
		in vec4 aMMatrixB_D;
	#else
		uniform mat4 uMMatrixA;
		uniform mat4 uMMatrixB;
	#endif
#else
	#ifdef INSTANCED
		in vec4 aMMatrixA;
		in vec4 aMMatrixB;
		in vec4 aMMatrixC;
		in vec4 aMMatrixD;
	#else
		uniform mat4 uMMatrix;
	#endif
#endif

#ifdef VS_MATMULT
	uniform mat4 uVMatrix;
#else
	#ifdef BENDY_
		uniform mat4 uMVMatrixA;
		uniform mat4 uMVMatrixB;
	#else
		uniform mat4 uMVMatrix;
	#endif
#endif

	uniform mat4 uPMatrix;
	uniform vec4 uCameraWorldPos;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform vec3 uModelScale;
	out vec4 adjustedPos;
	out vec4 transformedNormal;
	out vec4 transformedCoord;
#ifdef VERTCOLOR
	out vec3 vVertexColor;
#endif
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif

	void main(void) {	

#ifdef BENDY_
//todo simpler formulation!

	#ifdef INSTANCED
		mat4 uMMatrixA = mat4( aMMatrixA_A, aMMatrixA_B, aMMatrixA_C, aMMatrixA_D );
		mat4 uMMatrixB = mat4( aMMatrixB_A, aMMatrixB_B, aMMatrixB_C, aMMatrixB_D );
	#endif

	#ifdef VS_MATMULT
		mat4 MVMatrixA = uVMatrix * uMMatrixA;
		mat4 MVMatrixB = uVMatrix * uMMatrixB;
	#else
		mat4 MVMatrixA = uMVMatrixA;
		mat4 MVMatrixB = uMVMatrixB;
	#endif

	vec4 scaledCoord = vec4( uModelScale*aVertexPosition, 1.0);
	vec4 xyFlatCoord = normalize(scaledCoord * vec4(1.0,1.0,0.0,1.0));
	//vec4 zFlatCoord = scaledCoord * vec4(0.0,0.0,1.0,1.0);	//TODO simply maths by using fact that transformedCoord-flatCoord = ?

	vec2 blendWeights = 0.5*(1.0 + aVertexPosition.z*vec2(1.0,-1.0));

	vec4 transformedCoordEndA = MVMatrixA * xyFlatCoord;
	vec4 transformedCoordEndB = MVMatrixB * xyFlatCoord;
	vec4 avgCoord1 = blendWeights.x*transformedCoordEndA + blendWeights.y*transformedCoordEndB;

	vec4 aVertexPositionNormalizedA = normalize(vec4(uModelScale*(aVertexPosition-vec3(0.0,0.0,1.0)), 1.0));
	vec4 aVertexPositionNormalizedB = normalize(vec4(uModelScale*(aVertexPosition+vec3(0.0,0.0,1.0)), 1.0));
	vec4 transformedCoordA = MVMatrixA * aVertexPositionNormalizedA;
	vec4 transformedCoordB = MVMatrixB * aVertexPositionNormalizedB;
	vec4 avgCoord2 = blendWeights.x*transformedCoordA + blendWeights.y*transformedCoordB;

	float weighting = aVertexPosition.z*aVertexPosition.z;

	//transformedCoord = normalize(0.5*(avgCoord1*(1.0-weighting) + avgCoord2*(1.0+weighting)));	//guess, but seems bit wrong at ends
	transformedCoord = normalize(0.5*(avgCoord1*(3.0-weighting) + avgCoord2*(3.0+weighting)));	//seems about right. 

	vec4 transformedNormalA = MVMatrixA * vec4(aVertexNormal,0.0);
	vec4 transformedNormalB = MVMatrixB * vec4(aVertexNormal,0.0);
	transformedNormal = blendWeights.x*transformedNormalA + blendWeights.y*transformedNormalB;	//approx. TODO use equivalent logic as vertex position

#else
		vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
	#ifdef INSTANCED
		//bodge together a matrix from input vectors because suspect chrome bug
			mat4 uMMatrix = mat4( aMMatrixA, aMMatrixB, aMMatrixC, aMMatrixD );
	#endif

	#ifdef VS_MATMULT
			mat4 MVMatrix = uVMatrix * uMMatrix;
	#else
			mat4 MVMatrix = uMVMatrix;
	#endif

		transformedCoord = MVMatrix * aVertexPositionNormalized;
		transformedNormal = MVMatrix * vec4(aVertexNormal,0.0);
#endif

#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif	
		
		adjustedPos = transformedCoord - uDropLightPos;


		gl_Position = uPMatrix * transformedCoord;

#ifdef VERTCOLOR
	vVertexColor = aVertexColor;
#endif

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

#ifdef TEXMAP
#ifdef BENDY_
	float myZ = aVertexPositionNormalizedA.w;
#else
	float myZ = aVertexPositionNormalized.w;
#endif
	vTextureCoord = vec3( aTextureCoord.st*myZ, myZ );
#endif
	}