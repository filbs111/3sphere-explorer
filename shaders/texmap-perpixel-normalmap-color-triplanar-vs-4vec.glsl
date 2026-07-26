#version 300 es
precision mediump float;

// THIS IS CALLED A UNIFORM BLOCK
uniform Settings {
	vec4 uPlayerLightColor;
	vec4 uFogColor;
	vec4 uReflectorDiffColorAndCos;
	vec4 uReflectorDiffColorAndCos2;
	vec4 uReflectorDiffColorAndCos3;
	vec4 uReflectorPos;
	vec4 uReflectorPos2;
	vec4 uReflectorPos3;
};

//TODO determine whether more efficient to calc aVertexPosition, aVertexNormal from aTriCoord, aTriNormal here in vert shader, or precalc and pass in.
	in vec4 aVertexPosition;
	in vec4 aVertexNormal;	//AFAIK shouldn't need this, but removing it causes rendering bug. todo find and fix
	in vec4 aVertexColor;
	//in vec3 aVertexColor;
	in vec3 aTriCoord;
	in vec3 aTriNormal;
#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	out vec3 fog;
#else
	uniform float uAtmosThickness;
	out float fog;
#endif
	uniform float uAtmosContrast;
	uniform mat4 uMMatrix;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform vec4 uCameraWorldPos;

#ifdef RECEIVE_SHADOW
	uniform mat4 uShadowMat;
	out vec3 posInShadowCasterSpace;	//since shadow caster (for now, player object) is in projected flat space, scaled by some factor. TODO prevent casting shadow on opposite side of world?
#endif

	out vec4 vPlayerLightPosTangentSpace;
	out vec4 vPortalLightPosTangentSpace;
	out vec4 vPortalLightPosTangentSpace2;
	out vec4 vPortalLightPosTangentSpace3;

	out vec4 vEyePosTangentSpace;
	out vec4 transformedCoord;
	out vec3 vPos;		//3vector position (before mapping onto duocyinder)
	out vec3 vTexAmounts;
	out vec4 vColor;
	out vec3 vNormal;	
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif
#ifdef DEPTH_AWARE
	out vec3 vScreenSpaceCoord;
#endif
	void main(void) {
		//calculate vectors moved quarter way around world from this vertex, in the direction of each voxel axis. this is like TBNP "vertexMatrix" matrix, for a normal in one of these directions. (true normal is aVertexNormal though)
		// guess top/bottom world axes x=y=0, z=w=0. up/down turns x,y into z,w. sideways turns x into y and w into z
		float lenRatio = length(aVertexPosition.zw)/length(aVertexPosition.xy);
		vec4 updownaxis = vec4( lenRatio*aVertexPosition.xy , -(1./lenRatio)*aVertexPosition.zw);	//moved up or down from vertex point (not sure sign)
		vec4 sideaxisone = normalize( vec4(aVertexPosition.y, -aVertexPosition.x, 0.,0.));
		vec4 sideaxistwo = normalize( vec4(0.,0., aVertexPosition.w, -aVertexPosition.z));
		
		//zero out some components. expect lighting to be as if projected onto this relative position..
		//mat4 vertexMatrix=uMVMatrix*mat4( vec4(0.), -updownaxis, vec4(0.), aVertexPosition);	//up-down OK
		//mat4 vertexMatrix=uMVMatrix*mat4( sideaxistwo, vec4(0.), vec4(0.), aVertexPosition);	//along tunnel ok	
		mat4 vertexMatrix=uMVMatrix*mat4( sideaxistwo, -updownaxis, sideaxisone, aVertexPosition);
	
		transformedCoord = vertexMatrix[3];		
		gl_Position = uPMatrix * transformedCoord;



#ifdef RECEIVE_SHADOW
	vec4 posInShadowCasterSpace4d = uShadowMat * aVertexPosition;
		// here shadowmat is shadow caster relative to catcher, but could rejig, pass in shadow caster and catcher mats, avoid relative calc in js.
		//	(reasonable if pass in model mat anyway, but currently passing in modeview) 
		
	posInShadowCasterSpace = posInShadowCasterSpace4d.xyz / posInShadowCasterSpace4d.w;
	posInShadowCasterSpace*=3000.0;	//TODO use whatever scale factor for model
		//get vertex position in frame of shadow caster object.
#endif



#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif
#ifdef DEPTH_AWARE
		vScreenSpaceCoord = gl_Position.xyw;
#endif		
		vPlayerLightPosTangentSpace = uDropLightPos* vertexMatrix;
		vPortalLightPosTangentSpace = uReflectorPos*vertexMatrix;
		vPortalLightPosTangentSpace2 = uReflectorPos*vertexMatrix;
		vPortalLightPosTangentSpace3 = uReflectorPos*vertexMatrix;

#ifdef SPECULAR_ACTIVE
		vEyePosTangentSpace = vec4(vec3(0.),1.)*vertexMatrix;	//eye pos
#endif
		
		
#ifdef ATMOS_CONSTANT
#ifdef VEC_ATMOS_THICK
		fog = vec3(0.5*(1.0 + transformedCoord.w));
#else
		fog = 0.5*(1.0 + transformedCoord.w);
#endif
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
				
#ifdef VCOLOR
		vColor = aVertexColor;	//TODO multiply by uColor in vert shader
		//vColor = vec4(aVertexColor,1.);	//TODO multiply by uColor in vert shader
#endif
			
		vPos = aTriCoord;
		vNormal = aTriNormal;
		vTexAmounts = aTriNormal*aTriNormal;
	}