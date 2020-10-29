    attribute vec3 aVertexPosition;
	attribute vec3 aVertexNormal;
	attribute vec2 aTextureCoord;
	attribute vec3 aVertexTangent;
	attribute vec3 aVertexBinormal;
	varying vec3 vTextureCoord;
	uniform float uAtmosThickness;
	uniform float uAtmosContrast;
	uniform mat4 uMMatrix;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform vec4 uCameraWorldPos;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	varying float fog;
	uniform vec3 uModelScale;
	varying vec4 adjustedPos;
	varying vec4 transformedNormal;		//note could use mat4 varying to tidy up
	varying vec4 transformedCoord;
	varying vec4 transformedTangent;
	varying vec4 transformedBinormal;
	
	void main(void) {
		vec3 scaledPos = uModelScale*aVertexPosition;
		vec4 aVertexPositionNormalized = normalize(vec4(scaledPos, 1.0));
		vec4 untransformedNormal = normalize( vec4( aVertexNormal, -dot(aVertexNormal, scaledPos)));	
		vec4 untransformedTangent = normalize( vec4( aVertexTangent, -dot(aVertexTangent, scaledPos)));	
		vec4 untransformedBinormal = normalize( vec4( aVertexBinormal, -dot(aVertexBinormal, scaledPos)));	
		
		transformedNormal = uMVMatrix * untransformedNormal;
		transformedTangent = uMVMatrix * untransformedTangent;	
		transformedBinormal = uMVMatrix * untransformedBinormal;
		transformedCoord = uMVMatrix * aVertexPositionNormalized;
		
		gl_Position = uPMatrix * transformedCoord;
		
		/*
		transformedNormal = uMVMatrix * vec4(aVertexNormal,0.0);	//TODO use matrix for normal, tangent, binormal
		transformedTangent = uMVMatrix * vec4(aVertexTangent,0.0);
		transformedBinormal = uMVMatrix * vec4(aVertexBinormal,0.0);
			//these should be approximately right for small objects.
			//however, really should be something like  normalise( vec4(aVertexPosition + delta*aVertexNormal, 1.0) - aVertexPositionNormalized ) 
			//is there is a neat calculation? are the results any different?
		*/
		adjustedPos = transformedCoord - uDropLightPos;

#ifdef ATMOS_CONSTANT		
		fog = 0.5*(1.0 + transformedCoord.w);		
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
		
		float myZ = aVertexPositionNormalized.w;
		vTextureCoord = vec3( aTextureCoord.st*myZ, myZ );
	}