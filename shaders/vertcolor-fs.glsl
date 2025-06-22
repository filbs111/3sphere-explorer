#version 300 es
precision mediump float;
uniform vec4 uColor;
in vec3 vColor;
out vec4 fragColor;

void main(void) {
    fragColor = vec4(vColor,1.)*uColor;
}