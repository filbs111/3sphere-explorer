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
	// here x=w, y=z, but also confusingly switched by pMatrix ! 
	//TODO if this works, don't bother creating vZW in vert shader.
	if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
	gl_FragDepth = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
#endif
	}