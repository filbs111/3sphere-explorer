#version 300 es
precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uInvSize;

out vec4 fragColor;

/*
constant big inefficient gaussian blur to be gold standard for comparison with faster techniques:
 * separable 2-pass blur
 * sharing samples across same 2x2 patch using ddx ddy stuff
 * downscaling
*/

float modu(float a) {
    return a-2.0*floor(a*0.5);
}

void main(void) {

    float decayFactor = .8;    //bigger=tighter, negligible blur impact on regular things, around very bright stuff.

    vec4 totals = vec4(0.0);

    //untonemap - note has problem if colour maxed out, so add small amount
    //note has little impact at the moment, but take into account if use bright lighting, have bloom fx
    vec3 onePointSomething = vec3(1.0001);

    for (float ii=-3.0;ii<3.5;ii+=1.0){
        vec4 sampledValues = texture(uSampler, vTextureCoord + uInvSize*vec2(ii));
        vec4 ungammaed = pow(sampledValues,vec4(2.2));
        ungammaed.a = 1.0;  //not sure what this is otherwise
        ungammaed.xyz = ungammaed.xyz/(onePointSomething-ungammaed.xyz);    //untonemap
        float weighting = exp(-decayFactor*(ii*ii));
        totals = totals + weighting*ungammaed;
    }

    vec3 avg = totals.rgb/totals.a;

	avg = avg/(vec3(1.0)+avg);  //tone mapping
    
	avg = pow(avg,vec3(0.455));

    float evenOdd = 0.5* modu(vTextureCoord.x* 1.0/uInvSize.x);  //?? hack - perhaps want another variable for this.

    fragColor = vec4(avg * (1.0-evenOdd), 1.0);
}