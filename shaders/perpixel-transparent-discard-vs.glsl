    attribute vec3 aVertexPosition;
	attribute vec3 aVertexNormal;
	uniform mat4 uMVMatrix;
	uniform mat4 uPMatrix;
	uniform vec3 uModelScale;
	varying float fog;
	varying vec4 transformedCoord;
	varying vec4 transformedNormal;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
	void main(void) {	
		vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
		transformedCoord = uMVMatrix * aVertexPositionNormalized;
#ifdef CUSTOM_DEPTH
		vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
#endif
		gl_Position = uPMatrix * transformedCoord;
		
		fog = 0.5*(1.0 + transformedCoord.w);
	}