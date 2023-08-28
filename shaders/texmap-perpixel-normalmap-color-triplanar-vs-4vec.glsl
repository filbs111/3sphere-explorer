//TODO determine whether more efficient to calc aVertexPosition, aVertexNormal from aTriCoord, aTriNormal here in vert shader, or precalc and pass in.
	attribute vec4 aVertexPosition;
	attribute vec4 aVertexNormal;	//AFAIK shouldn't need this, but removing it causes rendering bug. todo find and fix
	attribute vec4 aVertexColor;
	//attribute vec3 aVertexColor;
	attribute vec3 aTriCoord;
	attribute vec3 aTriNormal;
#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	varying vec3 fog;
#else
	uniform float uAtmosThickness;
	varying float fog;
#endif
	uniform float uAtmosContrast;
	uniform mat4 uMMatrix;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform vec4 uCameraWorldPos;
	uniform vec4 uReflectorPosVShaderCopy;
	uniform vec4 uReflectorPosVShaderCopy2;
	uniform vec4 uReflectorPosVShaderCopy3;

	varying vec4 vPlayerLightPosTangentSpace;
	varying vec4 vPortalLightPosTangentSpace;
	varying vec4 vPortalLightPosTangentSpace2;
	varying vec4 vPortalLightPosTangentSpace3;

	varying vec4 vEyePosTangentSpace;
	varying vec4 transformedCoord;
	varying vec3 vPos;		//3vector position (before mapping onto duocyinder)
	varying vec3 vTexAmounts;
	varying vec4 vColor;
	varying vec3 vNormal;	
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif
#ifdef DEPTH_AWARE
	varying vec3 vScreenSpaceCoord;
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
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
#endif
#ifdef DEPTH_AWARE
		vScreenSpaceCoord = gl_Position.xyw;
#endif		
		vPlayerLightPosTangentSpace = uDropLightPos* vertexMatrix;
		vPortalLightPosTangentSpace = uReflectorPosVShaderCopy*vertexMatrix;
		vPortalLightPosTangentSpace2 = uReflectorPosVShaderCopy2*vertexMatrix;
		vPortalLightPosTangentSpace3 = uReflectorPosVShaderCopy3*vertexMatrix;

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