#version 300 es
    in vec4 aVertexPosition;
	in vec4 aVertexNormal;
	in vec4 aVertexTangent;
	in vec4 aVertexBinormal;
	in vec2 aTextureCoord;
	in vec4 aVertexColor;
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
	uniform vec4 uCameraWorldPos;	//used for atmos calcs. TODO can this be combined with/ used for eyepos calculation (used for specular)?
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )

	uniform vec4 uReflectorPosVShaderCopy;
	uniform vec4 uReflectorPosVShaderCopy2;
	uniform vec4 uReflectorPosVShaderCopy3;

	out vec4 vPlayerLightPosTangentSpace;
	out vec4 vPortalLightPosTangentSpace;
	out vec4 vPortalLightPosTangentSpace2;
	out vec4 vPortalLightPosTangentSpace3;

	out vec4 vEyePosTangentSpace;
	
	out vec4 transformedCoord;	
	out vec3 vTextureCoord;
	out vec4 vVertexPos;
	out vec4 vColor;
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
#endif
#ifdef DEPTH_AWARE
	out vec3 vScreenSpaceCoord;
#endif
	void main(void) {
		mat4 vertexMatrix = uMVMatrix*mat4( aVertexTangent, aVertexBinormal, aVertexNormal, aVertexPosition);
		transformedCoord = vertexMatrix[3];
#ifdef CUSTOM_DEPTH
		//vZW = vec2(transformedCoord.z, transformedCoord.w);	
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);	//w/z from -1 to 1. 	//note that w, z switched from intuitive expectation. see projection matrix. stuff nearest the camera has, at this point, w~1, stuff far away has w~-1, stuff in the middle (looks smallest) w=0. z at this point is like later w, and with sign change. 0 near/far, -1 in middle.
		//TODO can this be got efficiently from gl_FragCoord? what is best point to project from? (this is stereographic projection, but something closer to standard (transformedCoord.z, transformedCoord.w) might be worth it if see close range z-fighting for crossing over polygons. 
#endif
		gl_Position = uPMatrix * transformedCoord;
		vPlayerLightPosTangentSpace = uDropLightPos* vertexMatrix;
		vPortalLightPosTangentSpace = uReflectorPosVShaderCopy*vertexMatrix;
		vPortalLightPosTangentSpace2 = uReflectorPosVShaderCopy2*vertexMatrix;
		vPortalLightPosTangentSpace3 = uReflectorPosVShaderCopy3*vertexMatrix;

#ifdef SPECULAR_ACTIVE
		vEyePosTangentSpace = vec4(vec3(0.),1.)*vertexMatrix;	//eye pos
#endif

#ifdef VCOLOR
		vColor = aVertexColor;	//TODO multiply by uColor in vert shader
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
		
#ifdef MAPPROJECT_ACTIVE
		vVertexPos = aVertexPosition;	//pass through for atan tex mapping (overriding uv)
#else
		vTextureCoord = vec3( aTextureCoord, 1.0 );	//todo pass in unnormalised, use z tex coord for length (and normalise before passing onto frag shader)
#endif
#ifdef DEPTH_AWARE
		vScreenSpaceCoord = gl_Position.xyw;
#endif
	}

//vertex shader with tex coords and 4vector input positions (instead of projected 3vectors.)