#version 300 es
precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;
uniform vec2 uInvSize;

out vec4 fragColor;

float sampleWeight(float depthDifference){
    return step(-0.1,depthDifference);   //TODO tune this!
                //probably should be something like blurAmount - if less deep than centre point but still blurry, should still contribute.
}

void main(void) {

    float depthVal = texture(uSamplerDepthmap, vTextureCoord).r;

    float blurAmount = 0.5 + (1.0/3.14)*( atan(40.0*(depthVal-0.5)) );
    vec2 offsetAmount = uInvSize*blurAmount;

    vec4 mid = texture(uSampler, vTextureCoord);

    vec2 NWCoord = vTextureCoord + offsetAmount*vec2(-1.0,-1.0);
    vec4 NW = texture(uSampler, NWCoord);
    float depthNW = texture(uSamplerDepthmap, NWCoord).r;
    float sampleWeightNW = sampleWeight(depthNW - depthVal);
    
    vec2 NECoord = vTextureCoord + offsetAmount*vec2(1.0,-1.0);
    vec4 NE = texture(uSampler, NECoord);
    float depthNE = texture(uSamplerDepthmap, NECoord).r;
    float sampleWeightNE = sampleWeight(depthNE - depthVal);

    vec2 SWCoord = vTextureCoord + offsetAmount*vec2(-1.0,1.0);
    vec4 SW = texture(uSampler, SWCoord);
    float depthSW = texture(uSamplerDepthmap, SWCoord).r;
    float sampleWeightSW = sampleWeight(depthSW - depthVal);

    vec2 SECoord = vTextureCoord + offsetAmount*vec2(1.0,1.0);
    vec4 SE = texture(uSampler, SECoord);
    float depthSE = texture(uSamplerDepthmap, SECoord).r;
    float sampleWeightSE = sampleWeight(depthSE - depthVal);

    //vec4 avg = 0.2*(mid + NW + NE + SW + SE);
    //avg.a=1.0;

    //for some shaders output a is not 1 (seen for grid terrain)
    //if can ensure input has a=1, can lose the following.
    mid.a=1.0;
    NE.a=1.0;
    NW.a=1.0;
    SE.a=1.0;
    SW.a=1.0;

    vec4 total = 2.0*mid + sampleWeightNE*NE + sampleWeightNW*NW + sampleWeightSE*SE + sampleWeightSW*SW;
    vec4 avg = vec4(total.rgb/total.a , 1.0);

    //avg.rgb = vec3(blurAmount, 1.0-blurAmount, 1.0-blurAmount);
    //avg.rg = vec2(blurAmount, 1.0-blurAmount);
    
    fragColor = avg;
}