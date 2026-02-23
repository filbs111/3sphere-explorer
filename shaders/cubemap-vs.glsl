#version 300 es
    in vec3 aVertexPosition;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	out vec3 vPos;
	uniform vec3 uModelScale;
	uniform mat4 uPosShiftMat;
	uniform float uPolarity;

#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	out vec3 fog;
#else
	uniform float uAtmosThickness;
	out float fog;
#endif
	uniform float uAtmosContrast;	//atmos variants specific
	uniform mat4 uMMatrix;
	uniform vec4 uCameraWorldPos;

	uniform vec3 uCentrePosScaled;	//vertproj specific. this is position of cubemap centre point in unprojected model space
	
	out vec4 vInterpCoords;
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif

	void main(void) {
#ifdef VERTPROJ
		float csq = dot(uCentrePosScaled,uCentrePosScaled);
		float cdotp = dot(uCentrePosScaled, -aVertexPosition);
		float a = pow((1.0-csq)+cdotp*cdotp, 0.5) - cdotp;
		vec3 scaledVertexPosition = aVertexPosition*a;
	
		vec4 aVertexPositionNormalized = normalize(vec4( uModelScale*(scaledVertexPosition-uCentrePosScaled), 1.0));	
#else
		vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));	//project 3d object onto 3sphere
																//can avoid this by inputting 4vector positions *...
#endif
		vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif
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
		
		//TODO deduplicate sine and density calcs for consecutive sections, reduce its

		float bodgeScale = 1.0 + maxDoubleAngOverIters*maxDoubleAngOverIters/16.0;

		float sum=0.0;
		for (float aa=0.;aa<CONST_ITERS;aa++){
			float sectionStartAngle = aa*maxDoubleAngOverIters+shiftAngle;
			float sectionEndAngle = sectionStartAngle+maxDoubleAngOverIters;

			float modifiedSinStart = magTerm*sin(sectionStartAngle);
			float modifiedSinEnd = magTerm*sin(sectionEndAngle);

			float startDensity = exp(bodgeScale*uAtmosContrast*modifiedSinStart);
			float endDensity = exp(bodgeScale*uAtmosContrast*modifiedSinEnd);

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
	
		//gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); // *... or can just use 1.0 without normalising? TODO try.
		gl_Position = uPMatrix * transformedCoord;
		vPos = uPolarity * (uPosShiftMat*aVertexPositionNormalized).xyz;
		
#ifdef SPECIAL
		vInterpCoords = vec4(transformedCoord.xyz, 0.0);

		//next up - uniform to contain the camera space position of the portal
		//and fx/fy. step 1 indicate by colour difference between screen coord and position on screen of portal.
		//then work out how far from centre line of sighy passed. expect be able to draw concentric circles 
		
#endif
	}