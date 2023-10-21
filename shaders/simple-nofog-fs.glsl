#version 300 es
	precision mediump float;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
#endif

out vec4 fragColor;

void main(void) {
	fragColor = vec4(1.0,0.0,1.0,1.0);	//magenta
#ifdef CUSTOM_DEPTH
	gl_FragDepth = .5*(vZW.x/vZW.y) + .5;
#endif
}