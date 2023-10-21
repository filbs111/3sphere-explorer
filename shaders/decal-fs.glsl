#version 300 es
precision mediump float;
in vec3 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;

out vec4 fragColor;

void main(void) {
    fragColor = uColor*textureProj(uSampler, vTextureCoord);	//TODO don't use projective texture if not necessary! (eg for quads)
    //fragColor = uColor;
}