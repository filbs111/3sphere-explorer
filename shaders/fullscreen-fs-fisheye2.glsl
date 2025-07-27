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
    //vec3 centrePoint = (2.0 + uVarOne*dot(vTextureCoord,vTextureCoord)) + vec3(uInvF*vTextureCoord, 0.0);
    //vec3 samplePoint = vec3(1.0,1.0,2.0)*centrePoint;

    //this looks complicated but actually this can be broken down into 2 parts
    // where Q = 2.0 + uVarOne*dot(vTextureCoord,vTextureCoord)
    // 1) vec3(uInvF*vTextureCoord, Q)
    // 2) vec3(Q)
    // where 2) just shifts the output effective uv coords from range -1 to 1 to 0 to 1

    // float q = (2.0 + uVarOne*dot(vTextureCoord,vTextureCoord));
    // vec3 samplePoint = vec3(uInvF*vTextureCoord, q) + vec3(q);

    // // expect this actually differs from assumption used when doing reverse mapping, excepting where 
    // // uVarOne is 0 (rectilinear render) or -0.125 ( stereographic )
    // // because of wrong assumption. as a result, calculated HUD positions for intermediate fisheye are a bit wrong

    // fragColor = textureProj(uSampler, samplePoint);
    // gl_FragDepth = textureProj(uSamplerDepthmap, samplePoint).r;
    // //^unnecessary if decide to use alpha to contain depth info for input to blur

    vec2 modifiedTextureCoordB = .5*vTextureCoord;   //guess hack multiplier...
    float lengthOfT = length(modifiedTextureCoordB);
    float phi = -8.0*uVarOne;
    float m = (1.0 + phi)/lengthOfT;
    float onePlusMSq = 1.0 + m*m;
    float p = (phi*m + sqrt(onePlusMSq - phi*phi)) / onePlusMSq;
    float s = sqrt(1.0 - p*p);  //flip sign dependent on sign of m-phi? might not need to bother for small enough angle
    //can get direction from p,s

    float pOverS = p/s; //project onto top plane. NOTE this won't cope with -ve s.
    float hacknum = 0.97;   //temp hack consistent with that used in current quadview (so intermediate quad views cover final screen) 
    vec2 uCoords = vec2(0.5) + normalize(modifiedTextureCoordB) * pOverS * uInvF* hacknum* 0.5; 

    fragColor = texture(uSampler, uCoords ); 
    gl_FragDepth = texture(uSamplerDepthmap, uCoords ).r;

}