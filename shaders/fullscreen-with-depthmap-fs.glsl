#extension GL_EXT_frag_depth : enable
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;

void main(void) {

    gl_FragColor = texture2D(uSampler, vTextureCoord);

#ifdef COPY_DEPTH_TO_ALPHA
    float depthVal = texture2D(uSamplerDepthmap, vTextureCoord).r;
    gl_FragColor.a = depthVal;
    gl_FragDepthEXT = depthVal;
     //TODO is depth texture required?
#else
    gl_FragDepthEXT = texture2D(uSamplerDepthmap, vTextureCoord).r;
#endif

    //gl_FragDepthEXT = texture2D(uSampler, vTextureCoord).r;
}