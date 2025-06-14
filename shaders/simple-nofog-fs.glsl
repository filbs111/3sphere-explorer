#version 300 es
	precision mediump float;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
	in vec4 vP;
#endif

out vec4 fragColor;

void main(void) {
	fragColor = vec4(1.0,0.0,1.0,1.0);	//magenta
#ifdef CUSTOM_DEPTH
	// here x=w, y=z, but also confusingly switched by pMatrix ! 
	//TODO if this works, don't bother creating vZW in vert shader.
	//if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
	//gl_FragDepth = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
	gl_FragDepth = -.3183*atan(vP.w/length(vP.xyz)) + .5;
#endif
}