#ifdef CUSTOM_DEPTH
	#extension GL_EXT_frag_depth : enable
#endif
	precision mediump float;
	uniform vec3 uEmitColor;

	uniform vec4 uReflectorPos;
	uniform float uReflectorCos;
	varying float fog;	//note currently assume fog distance same for all colours
	varying vec4 transformedCoord;
	varying vec4 transformedNormal;
#ifdef CUSTOM_DEPTH
	varying vec2 vZW;
#endif	
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
		
		//gl_FragColor = vec4(uEmitColor, fog*light);
		gl_FragColor = vec4(uEmitColor, fog);
#ifdef CUSTOM_DEPTH
		gl_FragDepthEXT = .5*(vZW.x/vZW.y) + .5;
#endif
	}