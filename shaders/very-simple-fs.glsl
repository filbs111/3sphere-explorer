#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	uniform vec4 uColor;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif
#ifdef INSTANCE_COLOR
	varying vec4 vColor;
#endif
	void main(void) {

#ifdef INSTANCE_COLOR	
		gl_FragColor = uColor*vColor;	//TODO lose uColor
#else
		gl_FragColor = uColor;
#endif	
	
#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
#endif
	}