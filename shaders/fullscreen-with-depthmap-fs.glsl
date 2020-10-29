#extension GL_EXT_frag_depth : enable
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;

void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
    gl_FragDepthEXT = texture2D(uSamplerDepthmap, vTextureCoord).r;
    //gl_FragDepthEXT = texture2D(uSampler, vTextureCoord).r;
}