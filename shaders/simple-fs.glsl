//#extension GL_EXT_frag_depth : enable

precision mediump float;
uniform vec4 uColor;
uniform vec3 uEmitColor;
varying float fog;
uniform vec4 uFogColor;
varying float light;

void main(void) {
    gl_FragColor = vec4( fog*(( vec3(light) + uFogColor.xyz )*uColor.xyz + uEmitColor), 1.0) + (1.0-fog)*uFogColor;
}