precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;
uniform vec2 uInvSize;

float sampleWeight(float depthDifference){
    return step(-0.1,depthDifference);   //TODO tune this!
                //probably should be something like blurAmount - if less deep than centre point but still blurry, should still contribute.
}

void main(void) {

    float depthVal = texture2D(uSamplerDepthmap, vTextureCoord).r;

    float blurAmount = 0.5 + (1.0/3.14)*( atan(40.0*(depthVal-0.5)) );
    vec2 offsetAmount = uInvSize*blurAmount;

    vec4 mid = texture2D(uSampler, vTextureCoord);

    vec2 NWCoord = vTextureCoord + offsetAmount*vec2(-1.0,-1.0);
    vec4 NW = texture2D(uSampler, NWCoord);
    float depthNW = texture2D(uSamplerDepthmap, NWCoord).r;
    float sampleWeightNW = sampleWeight(depthNW - depthVal);
    
    vec2 NECoord = vTextureCoord + offsetAmount*vec2(1.0,-1.0);
    vec4 NE = texture2D(uSampler, NECoord);
    float depthNE = texture2D(uSamplerDepthmap, NECoord).r;
    float sampleWeightNE = sampleWeight(depthNE - depthVal);

    vec2 SWCoord = vTextureCoord + offsetAmount*vec2(-1.0,1.0);
    vec4 SW = texture2D(uSampler, SWCoord);
    float depthSW = texture2D(uSamplerDepthmap, SWCoord).r;
    float sampleWeightSW = sampleWeight(depthSW - depthVal);

    vec2 SECoord = vTextureCoord + offsetAmount*vec2(1.0,1.0);
    vec4 SE = texture2D(uSampler, SECoord);
    float depthSE = texture2D(uSamplerDepthmap, SECoord).r;
    float sampleWeightSE = sampleWeight(depthSE - depthVal);

    //vec4 avg = 0.2*(mid + NW + NE + SW + SE);
    //avg.a=1.0;

    vec4 total = 2.0*mid + sampleWeightNE*NE + sampleWeightNW*NW + sampleWeightSE*SE + sampleWeightSW*SW;
    vec4 avg = vec4(total.rgb/total.a , 1.0);

    //avg.rgb = vec3(blurAmount, 1.0-blurAmount, 1.0-blurAmount);
    //avg.rg = vec2(blurAmount, 1.0-blurAmount);
    
    gl_FragColor = avg;
}