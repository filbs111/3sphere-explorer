#define CONST_TAU 6.2831853
	
	attribute vec2 aVertexPosition;
	uniform float uAtmosThickness;
	uniform float uAtmosContrast;
	uniform mat4 uMMatrix;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform float uTime;
	uniform float uZeroLevel;
	uniform vec4 uCameraWorldPos;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform vec3 uPlayerLightColor;
	uniform vec3 uReflectorDiffColor;
	uniform vec4 uReflectorPos;
	uniform float uReflectorCos;
	varying float fog;
	varying vec3 veclight;
	
	varying vec3 vTextureCoord;
	
	void addWaveContribution(in vec2 wavePosIn, inout vec3 wavePosAccum, inout vec3 vDerivativeWRTX, inout vec3 vDerivativeWRTY, float peakiness, vec2 waveCycles){	//waveCycles should be int2
		//wavecycles - number of waves across repeating square in each direction.
		//wavevector relates to this...
		//speed of wave - deep water, speed ~ sqrt(wavelength)
		// wavevector = 2pi/wavelength. wave speed= angularvelocity*wavevector ie (rads/s) / (rads/m)
			//		or speed = frequency*wavelength
			
		// sqrt(wavelength) = angvec * (2pi/wavelength)
		
		//frequency = speed/wavelength ~ sqrt(wavelength)/wavelength = 1/sqrt(wavelength)
		
		//square is 16x16 (TODO make unit square? then can change grid size for fidelity without other messing
		
		//var normalisedGridPos = wavePos
				
		//wavevector is wavecycles * 2PI / square_side_length
		// square_side_length = 1
		
		//wavevector (IIRC direction/wavelength) ~ vec2(n,m), so wavelength = 1/sqrt(n*n+m*m)
		// wavelength = 1/length (wavevector/2PI) = 1/length(wavecycles)
		
		float invWavelength = length(waveCycles);
		
		//since freq and therefore ang vel proportional to 1/invWavelength
		float someConstant = 0.4;	//affects speed of animation
		float freq = someConstant*sqrt(invWavelength);	//<--this why pythagorean tribles not working!
			//unless find triples whose lengths are square! eg 7 24 25, (and 0 1 1, 0 4 4 0 9 9 etc)
		//presumably there is some distribution of wave amplitude with wavelength. for now just try manual terms. IIRC some ratio (since fluid particles circular path)
		//makes pointy waves. therefore pass in "peakiness" - 1 for sharp peak. rolling wheel. 1 revolution in 2pi radii -> pi* peak-to-peak amplitude
		
		//round angfreq so loops? (uTime from 0 to 1 so freq should be integer)
		freq=ceil(freq);
		
		/*
		float phase = CONST_TAU * (uTime*angFreq + dot(waveCycles, wavePosIn.xy));	//TODO should angvel be hardcoded/passed into shader (rather than calc for each vertex)
									//if time is to loop, should ensure waves loop in time - guess by subtle manipulation of angVel (pythagorean triples unrealistic)
		//is this the problem?
		phase=mod(phase,CONST_TAU);	//if works, should mod with 1 before multiplying with CONST_TAU. .... it doesn't work! still glitches!	
		*/
		
		float phase = CONST_TAU* (uTime*freq + dot(waveCycles, wavePosIn));	
		
		float ampl = peakiness/(invWavelength*CONST_TAU);
		wavePosAccum+= ampl*vec3( cos(phase)*waveCycles/invWavelength, sin(phase) );
		
		//add derivative to vDerivativeWRTX, vDerivativeWRTY (TODO combine into matrix?)
		vec3 derivVector = ampl*vec3( -sin(phase)*waveCycles/invWavelength , cos(phase) );	//educated guess TODO proper working
		vDerivativeWRTX += waveCycles.x * derivVector;
		vDerivativeWRTY += waveCycles.y * derivVector;
	}
	
	//ported from tennisBallLoader.js
	vec4 get4vecfrom3vec(in vec3 invec){
		vec2 ang = CONST_TAU * invec.xy;
		float cylr = CONST_TAU * (0.125+ invec.z);
		float sr = sin(cylr);	//todo possible to do this in 1 go? special shader cmmd?
		float cr = cos(cylr);
		return vec4( cr * sin(ang.x), cr * cos(ang.x), sr * sin(ang.y), sr * cos(ang.y) );
	}
	
	void main(void) {
		//1 calc height and normal
		vec3 vDerivativeWRTX = vec3(1./CONST_TAU,0.,0.);
		vec3 vDerivativeWRTY = vec3(0.,1./CONST_TAU,0.);
		
		vec3 vModifiedVertexPosition = vec3( aVertexPosition.xy, uZeroLevel);
		addWaveContribution(aVertexPosition, vModifiedVertexPosition, vDerivativeWRTX, vDerivativeWRTY, 0.15, vec2(1.0,9.0));
		addWaveContribution(aVertexPosition, vModifiedVertexPosition, vDerivativeWRTX, vDerivativeWRTY, 0.15, vec2(-13.0,2.0));
		addWaveContribution(aVertexPosition, vModifiedVertexPosition, vDerivativeWRTX, vDerivativeWRTY, 0.15, vec2(3.0,-7.0));
		addWaveContribution(aVertexPosition, vModifiedVertexPosition, vDerivativeWRTX, vDerivativeWRTY, 0.15, vec2(-4.0,5.0));
		
		vec3 surfNorm = normalize(cross(vDerivativeWRTX,vDerivativeWRTY));	//get surface normal by cross product of derivative vectors
				
		//2 convert position and normal to 4vec
		//fake initially to get right vec type
		//vec4 calculatedVertexPosition = vec4(aVertexPosition, 0.,0.);
		vec4 calculatedVertexPosition = get4vecfrom3vec(vModifiedVertexPosition);
		
		//simple way to calc norms - move a little along normal, subtract this from original value, normalise the result.
		//probably can express as a derivative wrt normal movment, then normalise result, but this way is easier.
		vec4 shiftedVertexPosition = get4vecfrom3vec(vModifiedVertexPosition+.001*surfNorm);
		vec4 calculatedVertexNormal = normalize(shiftedVertexPosition - calculatedVertexPosition);
		
		//3 use thse values same as in shader-texmap-vs-4vec
		vec4 transformedCoord = uMVMatrix * calculatedVertexPosition;
		
		gl_Position = uPMatrix * transformedCoord;
		
#ifdef ATMOS_CONSTANT
		fog = 0.5*(1.0 + transformedCoord.w);
#else
		vec4 worldCoord = uMMatrix * calculatedVertexPosition;
		/*
		float dotProd = dot(uCameraWorldPos,worldCoord);
		float maxAng = acos(dotProd);	//angle from camera to object
		float maxAngOverIters = maxAng/CONST_ITERS;
		
		vec4 normalDirection = normalize(worldCoord - dotProd*uCameraWorldPos);	//point 90 deg around world from camera, in direction of worldCoord
		float totalPath=0.0;
		float currentAngle;
		vec4 currentPos;
		for (float aa=0.0;aa<CONST_ITERS;aa++){
			currentAngle=maxAngOverIters*aa;
			currentPos = uCameraWorldPos*cos(currentAngle)+normalDirection*sin(currentAngle);
			totalPath+=exp(uAtmosContrast*dot(currentPos.xy,currentPos.xy));	//number here affects how different atmos pressure is between extremes
		}
		fog=exp(-totalPath*uAtmosThickness*maxAngOverIters);
		*/
		
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
	
		vec4 transformedNormal = uMVMatrix * calculatedVertexNormal;
		vec4 adjustedPos = transformedCoord - uDropLightPos;
		float light = -dot( normalize(adjustedPos), transformedNormal);
		light = max(light,0.0);	//unnecessary if camera pos = light pos
		light/=1.0 + 4.2*dot(adjustedPos,adjustedPos);		//terms higher than other shaders by sqrt(2) because length
															//of 1,0,0,0 -> 0,1,0,0 (90 deg around world)
															//todo recalc
		veclight=uPlayerLightColor*light;
		
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
	
		//light from portal. TODO pass in a colour for this, more complex lighting (at surface of portal, should be hemispherical light etc)
		//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!
		float portalLight = dot( uReflectorPos, transformedNormal);
		portalLight = max(0.5*portalLight +0.5+ posCosDiff,0.0);	//unnecessary if camera pos = light pos
		//falloff
		portalLight/=1.0 + 3.0*dot(posCosDiff,posCosDiff);	//just something that's 1 at edge of portal
				
		veclight+=uReflectorDiffColor*portalLight;
		
		vTextureCoord = vec3( aVertexPosition, 1.0 );	//any point in projected tex??
	}