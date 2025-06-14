#version 300 es   
    in vec3 aVertexPosition;
	in vec3 aVertexNormal;
	in vec2 aTextureCoord;
	in vec3 aVertexTangent;
	in vec3 aVertexBinormal;
	in vec3 aVertexColor;
	out vec3 vTextureCoord;
#ifdef VEC_ATMOS_THICK
	uniform vec3 uAtmosThickness;
	out vec3 fog;
#else
	uniform float uAtmosThickness;
	out float fog;
#endif
	uniform float uAtmosContrast;
#ifdef VS_MATMULT
	uniform mat4 uVMatrix;
#else
	uniform mat4 uMVMatrix;
#endif
#ifdef INSTANCED
//	in mat4 uMMatrix;	//note still using u prefix so can share code with non instanced version
	in vec4 aMMatrixA;
	in vec4 aMMatrixB;
	in vec4 aMMatrixC;
	in vec4 aMMatrixD;
#else
	uniform mat4 uMMatrix;
#endif
	uniform mat4 uPMatrix;
	uniform vec4 uCameraWorldPos;
	uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
	uniform vec3 uModelScale;
	
	uniform vec4 uReflectorPosVShaderCopy;	//TODO not this! shouldn't need in both. unsure why need different name. limitation of webgl, or bad assumption in shader loading func?
	uniform vec4 uReflectorPosVShaderCopy2;
	uniform vec4 uReflectorPosVShaderCopy3;

	out vec4 vPlayerLightPosTangentSpace;
	out vec4 vPortalLightPosTangentSpace;
	out vec4 vPortalLightPosTangentSpace2;
	out vec4 vPortalLightPosTangentSpace3;

	out vec4 vEyePosTangentSpace;			//does this get skipped automatically if not used?
	
	out vec4 transformedCoord;
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif	
	void main(void) {
		
		
#ifdef INSTANCED
	//bodge together a matrix from input vectors because suspect chrome bug
		mat4 uMMatrix = mat4( aMMatrixA, aMMatrixB, aMMatrixC, aMMatrixD );
#endif		
		
#ifdef VS_MATMULT
		mat4 MVMatrix = uVMatrix * uMMatrix;
#else
		mat4 MVMatrix = uMVMatrix;
#endif
		
		//transform by normal/tangent/bitangent.
		//this is "efficient" version that moves some work from frag to vertex shader.
		//note could transform the position of lighting objects instead of transforming pos,normal,binormal,tangent, which might be still more efficient.
		vec3 scaledPos = uModelScale*aVertexPosition;
		vec4 untransformedNormal = normalize( vec4( aVertexNormal, -dot(aVertexNormal, scaledPos)));	
		vec4 untransformedTangent = normalize( vec4( aVertexTangent, -dot(aVertexTangent, scaledPos)));	
		vec4 untransformedBinormal = normalize( vec4( aVertexBinormal, -dot(aVertexBinormal, scaledPos)));	
		vec4 aVertexPositionNormalized = normalize(vec4(scaledPos, 1.0));
		
		mat4 vertexMatrix = MVMatrix*mat4(untransformedTangent, untransformedBinormal, untransformedNormal, aVertexPositionNormalized);

		transformedCoord = vertexMatrix[3];
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif
		gl_Position = uPMatrix * transformedCoord;
		
		vPlayerLightPosTangentSpace = uDropLightPos*vertexMatrix;
		vPortalLightPosTangentSpace = uReflectorPosVShaderCopy*vertexMatrix;
		vPortalLightPosTangentSpace2 = uReflectorPosVShaderCopy2*vertexMatrix;
		vPortalLightPosTangentSpace3 = uReflectorPosVShaderCopy3*vertexMatrix;

#ifdef SPECULAR_ACTIVE		
		vEyePosTangentSpace = vec4(vec3(0.),1.)*vertexMatrix;
		
		//https://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_reflection_model
		//camPosTangentSpace should be normalised already (?? maybe depends on transform+TBN matrix being SO(4)? - but currently just using 3vecs (TODO is this best method?)
		//vPlayerLightHalfwayTangentSpace = vec4(normalize(normalize(vEyePosTangentSpace.xyz) + normalize(vPortalLightPosTangentSpace.xyz)), 0.) ;	//TODO should normalisation take place after interpolation? 	//seems interpolation doesn't work well for this. maybe some trick can do. for now do normalisation in frag shader
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