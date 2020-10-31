#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
	void main(void) {
		gl_FragColor = vec4(1.0,0.0,1.0,1.0);	//magenta
#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
#endif
	}