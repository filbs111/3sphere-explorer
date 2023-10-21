#version 300 es
precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;

// we need to declare an output for the fragment shader
out vec4 fragColor;

void main(void) {

    fragColor = texture(uSampler, vTextureCoord);
    gl_FragDepth = texture(uSamplerDepthmap, vTextureCoord).r;

    //gl_FragDepth = texture(uSampler, vTextureCoord).r;
}