#version 300 es
    uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform float uTime;

	in vec4 aVertexCentrePosition;	//instanced attribute for starting position
	in vec4 aVertexCentreDirection;		//instanced attribute a quarter way around "world" from starting position
	in vec2 aVertexPosition;			//offset position
#ifdef CUSTOM_DEPTH
	out vec2 vZW;
#endif
#ifdef INSTANCE_COLOR
	in vec4 aColor;
	out vec4 vColor;
#endif
	void main(void) {
		float angle = uTime*0.0005;	//TODO different speeds for different particles, ensure clean looping. speeds should be multiples of 2*PI/loopTime
		vec4 transformedCoord = uMVMatrix * (aVertexCentrePosition*cos(angle) + aVertexCentreDirection*sin(angle));
#ifdef INSTANCE_COLOR
		vColor = aColor;
#endif
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
#endif
		gl_Position = uPMatrix * ( transformedCoord + vec4(aVertexPosition, vec2(0.)));
	}