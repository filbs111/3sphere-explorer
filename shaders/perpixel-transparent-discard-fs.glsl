#version 300 es
	precision mediump float;
	uniform vec3 uEmitColor;

	uniform vec4 uReflectorPos;
	uniform float uReflectorCos;
	in float fog;	//note currently assume fog distance same for all colours
	in vec4 transformedCoord;
	in vec4 transformedNormal;
#ifdef CUSTOM_DEPTH
	in vec2 vZW;
#endif

out vec4 fragColor;

	void main(void) {
		float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;
		if (posCosDiff>0.0){
			discard;
		}
		
		//some hack for falloff by ~normal dot camera direction to make edges of spherical explosions fade out
		//float light = dot( normalize(transformedCoord).xyz, transformedNormal.xyz);
		//float light = transformedNormal.z;	//this very approx.
		//todo actually dot with direction to camera, divide by sqrt(1-wsq) ? (guess currently get excessive depth falloff)
											//probably should just combo with "fog" value calculation in vert shader
		
		//fragColor = vec4(uEmitColor, fog*light);
		fragColor = vec4(uEmitColor, fog);
#ifdef CUSTOM_DEPTH
		// here x=w, y=z, but also confusingly switched by pMatrix ! 
		//TODO if this works, don't bother creating vZW in vert shader.
		if (vZW.y > -1.){discard;} //other side of world. shouldn't happen much with culling. TODO discard earlier?
		gl_FragDepth = .3183*atan((vZW.x*2.)/(vZW.y+1.)) + .5;
#endif
	}