//#extension GL_EXT_frag_depth : enable

precision mediump float;
uniform vec4 uColor;
uniform vec3 uEmitColor;
uniform vec4 uFogColor;
varying float fog;
varying vec4 adjustedPos;
varying vec4 transformedNormal;

void main(void) {
    float light = -dot( normalize(adjustedPos), transformedNormal);
    light = max(light,0.0);	//unnecessary if camera pos = light pos
    //falloff
    light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);	//1st num some const to ensure light doesn't go inf at short dist
                                                //guess maybe similar to some gaussian light source
    gl_FragColor = vec4( fog*(( vec3(light) + uFogColor.xyz )*uColor.xyz + uEmitColor), 1.0) + (1.0-fog)*uFogColor;
}

// per pixel lighting
// expect can make this more efficient
