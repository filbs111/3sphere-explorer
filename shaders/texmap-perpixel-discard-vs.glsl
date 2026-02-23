#version 300 es
	in vec3 aVertexPosition;
	in vec3 aVertexNormal;
	in vec2 aTextureCoord;
	in vec3 aVertexVelocity;
	out vec3 vTextureCoord;
#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	out vec3 fog;	//varying
#else
	uniform float uAtmosThickness;
	out float fog;	//varying
#endif
	uniform float uAtmosContrast;
	uniform mat4 uMMatrix;
	uniform mat4 uMVMatrix;

#ifdef RECEIVE_SHADOW
	uniform mat4 uShadowMat;
	out vec4 posInShadowCasterSpace;	//since shadow caster (for now, player object) is in projected flat space, scaled by some factor. TODO prevent casting shadow on opposite side of world?
#endif

	uniform mat4 uPMatrix;
	uniform vec4 uCameraWorldPos;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform float uVertexMove;
	uniform vec3 uModelScale;
	out vec4 adjustedPos;	//varying
	out vec4 transformedNormal;	
	out vec4 transformedCoord;
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif
	void main(void) {
		
#ifdef VERTVEL_ACTIVE
		vec3 scaledPosition = uModelScale*aVertexPosition + aVertexVelocity*uVertexMove;
#else
		vec3 scaledPosition = uModelScale*aVertexPosition;
#endif
		vec4 aVertexPositionNormalized = normalize(vec4(scaledPosition, 1.0));
		transformedCoord = uMVMatrix * aVertexPositionNormalized;

#ifdef RECEIVE_SHADOW
	//posInShadowCasterSpace = uShadowMat * vec4(scaledPosition, 1.0);	//suspect this is right, and other bits are wrong!
	posInShadowCasterSpace = uShadowMat * aVertexPositionNormalized;
#endif

#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif
		float distFromOrigin = dot(aVertexNormal, scaledPosition);
		vec4 norm4Vec = normalize(vec4(aVertexNormal,-distFromOrigin));

		transformedNormal = uMVMatrix * norm4Vec;

		adjustedPos = transformedCoord - uDropLightPos;
		gl_Position = uPMatrix * transformedCoord;

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
		//TODO deduplicate sine and density calcs for consecutive sections, reduce its

		float maxDoubleAngOverIters = maxDoubleAng/CONST_ITERS;
		float bodgeScale = 1.0 + maxDoubleAngOverIters*maxDoubleAngOverIters/16.0;

		float sum=0.0;
		for (float aa=0.;aa<CONST_ITERS;aa++){
			float sectionStartAngle = aa*maxDoubleAngOverIters+shiftAngle;
			float sectionEndAngle = sectionStartAngle+maxDoubleAngOverIters;

			float modifiedSinStart = magTerm*sin(sectionStartAngle);
			float modifiedSinEnd = magTerm*sin(sectionEndAngle);

			float startDensity = exp(bodgeScale*uAtmosContrast*modifiedSinStart);
			float endDensity = exp(bodgeScale*uAtmosContrast*modifiedSinEnd);

			//THIS IS THE VS THAT AFFECTS PLAYER MODEL (gradlight shader)
			if (abs(modifiedSinStart - modifiedSinEnd)<0.000001){
				//TODO check maths. basically average of exp(x) between a,b = (exp(b)-exp(a))/(b-a)
				//bat as b->a , this becomes just exp(a). TODO check where bodgeScale goes. TODO checl threshold.
				sum+= startDensity;
			}else{
				sum+= (endDensity-startDensity)/(modifiedSinEnd - modifiedSinStart);
			}
		}


		sum/=uAtmosContrast;

		sum*= bodgeScale*maxDoubleAngOverIters*exp(uAtmosContrast*(constTerm));	
		fog = exp(-uAtmosThickness*sum/2.0);
#endif
#ifdef ATMOS_ONE_OLD
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