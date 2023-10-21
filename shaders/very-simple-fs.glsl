#version 300 es
	precision mediump float;
	uniform vec4 uColor;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
#endif
#ifdef INSTANCE_COLOR
	in vec4 vColor;
#endif

out vec4 fragColor;

	void main(void) {

#ifdef INSTANCE_COLOR	
		fragColor = uColor*vColor;	//TODO lose uColor
#else
		fragColor = uColor;
#endif	
	
#ifdef CUSTOM_DEPTH
		gl_FragDepth = .5*(vZW.x/vZW.y) + .5;
#endif
	}