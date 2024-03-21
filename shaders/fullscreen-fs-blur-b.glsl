#version 300 es
precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;
uniform vec2 uInvSize;

out vec4 fragColor;

float sampleWeight(float depthDifference){
    //return step(-0.1,depthDifference);   //TODO tune this!
    //return smoothstep(-0.3,-0.1,depthDifference);   //TODO tune this!
    return 2.0*smoothstep(-0.1,0.1,depthDifference); 
                //probably should be something like blurAmount - if less deep than centre point but still blurry, should still contribute.
}

float random( vec2 p )
{
    vec2 K1 = vec2(
        23.14069263277926, // e^pi (Gelfond's constant)
         2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
    );
    return fract( cos( dot(p,K1) ) * 12345.6789 );
}

void main(void) {

    vec4 mid = texture(uSampler, vTextureCoord);

#ifdef USE_ALPHA
    float depthVal = mid.a;
#else
    float depthVal = texture(uSamplerDepthmap, vTextureCoord).r;
#endif

    float blurAmount = 0.5 + (1.0/3.14)*( atan(40.0*(depthVal-0.5)) );
    vec2 offsetAmount = uInvSize*blurAmount;

    float valA = 0.8;
    float valB = 1.2;

    //float valA = 2.0*random(vTextureCoord); //hideous random noise!
   // float valB = 2.0*random(0.5*vTextureCoord);

    //float valA = 1.0;
    //float valB = 1.0;

    vec2 NWCoord = vTextureCoord + offsetAmount*vec2(-valA,-valB);
    vec4 NW = texture(uSampler, NWCoord);
    vec2 NECoord = vTextureCoord + offsetAmount*vec2(valB,-valA);
    vec4 NE = texture(uSampler, NECoord);
    vec2 SWCoord = vTextureCoord + offsetAmount*vec2(-valB,valA);
    vec4 SW = texture(uSampler, SWCoord);
    vec2 SECoord = vTextureCoord + offsetAmount*vec2(valA,valB);
    vec4 SE = texture(uSampler, SECoord);

#ifdef USE_ALPHA
    float depthNW = NW.a;
    float depthNE = NE.a;
    float depthSW = SW.a;
    float depthSE = SE.a;
#else
    float depthNW = texture(uSamplerDepthmap, NWCoord).r;
    float depthNE = texture(uSamplerDepthmap, NECoord).r;
    float depthSW = texture(uSamplerDepthmap, SWCoord).r;
    float depthSE = texture(uSamplerDepthmap, SECoord).r;
#endif

    float sampleWeightNW = sampleWeight(depthNW - depthVal);
    float sampleWeightNE = sampleWeight(depthNE - depthVal);
    float sampleWeightSW = sampleWeight(depthSW - depthVal);
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

    //ungamma
    vec4 midug = pow(mid,vec4(2.2));
    vec4 NWug = pow(NW,vec4(2.2));
    vec4 NEug = pow(NE,vec4(2.2));
    vec4 SWug = pow(SW,vec4(2.2));
    vec4 SEug = pow(SE,vec4(2.2));

    //untonemap - note has problem if colour maxed out, so add small amount
    //note has little impact at the moment, but take into account if use bright lighting, have bloom fx
    vec3 onePointSomething = vec3(1.001);
    midug.xyz = midug.xyz/(onePointSomething-midug.xyz);
    NWug.xyz = NWug.xyz/(onePointSomething-NWug.xyz);
    NEug.xyz = NEug.xyz/(onePointSomething-NEug.xyz);
    SWug.xyz = SWug.xyz/(onePointSomething-SWug.xyz);
    SEug.xyz = SEug.xyz/(onePointSomething-SEug.xyz);

    vec4 total = 2.0*midug + sampleWeightNE*NEug + sampleWeightNW*NWug + sampleWeightSE*SEug + sampleWeightSW*SWug;
    vec4 avg = vec4(total.rgb/total.a , 1.0);

    //avg.rgb = vec3(blurAmount, 1.0-blurAmount, 1.0-blurAmount);
    //avg.rg = vec2(blurAmount, 1.0-blurAmount);
    
	avg.xyz = avg.xyz/(vec3(1.0)+avg.xyz);  //tone mapping
    
        //TODO maybe store exp(-brightness). might make summing contiributions better (can do by multiplying)

	avg.xyz = pow(avg.xyz,vec3(0.455));
	
    fragColor = avg;
}