#version 300 es
precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;

uniform vec2 uInvSize;
uniform vec2 uInvF;
uniform float uOversize;
uniform float uVarOne;

out vec4 fragColor;

//WIP
//TODO increase size of input texture so that doesn't go out of range after barrel distortion. (can see texture clamp around edges currently)
//TODO use fxaa

void main(void) {
    vec3 centrePoint = (2.0 + uVarOne*dot(vTextureCoord,vTextureCoord)) + vec3(uInvF.st*vTextureCoord.st, 0.0);

	vec4 MIDv4 = textureProj(uSampler, vec3(1.0,1.0,2.0)*centrePoint);

    fragColor = MIDv4;

    gl_FragDepth = textureProj(uSamplerDepthmap, vec3(1.0,1.0,2.0)*centrePoint ).r;
    //^unnecessary if decide to use alpha to contain depth info for input to blur
}