#version 300 es
    in vec4 aVertexPosition;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
	out vec4 vP;
#endif
	void main(void) {
		vec4 transformedCoord = uMVMatrix * aVertexPosition;
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
		vP = transformedCoord;
#endif
		gl_Position = uPMatrix * transformedCoord;
	}