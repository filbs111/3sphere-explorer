precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;
uniform vec2 uInvSize;

void main(void) {

    float depthVal = texture2D(uSamplerDepthmap, vTextureCoord).r;
    //float blurAmount = smoothstep(0.0,1.0,depthVal*depthVal);
    float blurAmount = 0.5 + (1.0/3.14)*( atan(40.0*(depthVal-0.5)) );
    vec2 offsetAmount = uInvSize*blurAmount;

    vec4 mid = texture2D(uSampler, vTextureCoord);
    vec4 NW = texture2D(uSampler, vTextureCoord + offsetAmount*vec2(-1.0,-1.0));
    vec4 NE = texture2D(uSampler, vTextureCoord + offsetAmount*vec2(1.0,-1.0));
    vec4 SW = texture2D(uSampler, vTextureCoord + offsetAmount*vec2(-1.0,1.0));
    vec4 SE = texture2D(uSampler, vTextureCoord + offsetAmount*vec2(1.0,1.0));
    
    vec4 avg = 0.2*(mid + NW + NE + SW + SE);

    //avg.rgb = vec3(blurAmount, 1.0-blurAmount, 1.0-blurAmount);
    //avg.rg = vec2(blurAmount, 1.0-blurAmount);

    avg.a=1.0;
    gl_FragColor = avg;
}