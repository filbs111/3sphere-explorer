#version 300 es
    in vec3 aVertexPosition;
	in vec3 aVertexNormal;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform vec3 uModelScale;
	uniform float uOpacity;
	out float fog;
	out vec4 transformedCoord;
	out vec4 transformedNormal;
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif	
	void main(void) {	
		vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
		transformedCoord = uMVMatrix * aVertexPositionNormalized;
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif
		gl_Position = uPMatrix * transformedCoord;
		
		fog = 0.5*(1.0 + transformedCoord.w);
		fog*=uOpacity;
	}