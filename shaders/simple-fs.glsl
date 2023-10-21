#version 300 es
precision mediump float;
uniform vec4 uColor;
uniform vec3 uEmitColor;
in float fog;
uniform vec4 uFogColor;
in float light;

out vec4 fragColor;

void main(void) {
    fragColor = vec4( fog*(( vec3(light) + uFogColor.xyz )*uColor.xyz + uEmitColor), 1.0) + (1.0-fog)*uFogColor;
}