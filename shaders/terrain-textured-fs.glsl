#version 300 es
#define TEX_DOWNSCALE 4.0

precision mediump float;

uniform sampler2D uSampler;
uniform sampler2D uSamplerB;
uniform sampler2D uSamplerNormals;
uniform vec4 uFogColor;

in vec2 vPos;
in vec2 vGrad;
in vec2 vTexBlend;

in vec4 vDebugColor;

in float fog;
in vec2 vZW;	//for custom depth
in vec4 vP;

out vec4 fragColor;

void main(void){
    //fragColor=vec4(vec3(10.0*vColor.z + 0.1),1.0);

    vec2 samplePos = vec2(vPos.x, 1.0-vPos.y);
        //note only using 1.0-... so consistent with uGrad vertex shader gradient. TODO simplify

    vec4 normalMapSample = texture(uSamplerNormals, samplePos);	

    vec2 texCoord = vPos * vec2(TEX_DOWNSCALE);
    vec4 texColor = texture(uSampler, texCoord);
    vec4 texColorB = texture(uSamplerB, texCoord);
    vec4 texColorBlend = vTexBlend.x * texColor + vTexBlend.y * texColorB;

    vec3 norm = normalize( normalMapSample.yxz - vec3(0.5));
    norm.y= -norm.y;
        //note only using so consistent with uGrad vertex shader gradient. TODO simplify

    //float lighting = dot(norm, vec3(0.0,0.0,1.0));
    vec3 directionToSun = vec3(0.0,0.7,0.7);

    float lighting = max( dot(norm, directionToSun), 0.0 );

    // float postGammaLighting = pow(lighting, 0.455);
    // fragColor= texColorBlend * vDebugColor * vec4(vec3(postGammaLighting), 1.0);

    vec4 baseColor = pow(texColorBlend * vDebugColor, vec4(2.2)) * lighting;  //attempt calculate light value from texture?
    // vec4 baseColor = texColorBlend * vDebugColor * lighting; 

    // vec4 preGammaFragColor = vec4( fog*( uPlayerLightColor*light + uReflectorDiffColor*portalLight + uFogColor.xyz )*adjustedColor.xyz*textureProj(uSampler, vTextureCoord).xyz + (1.0-fog)*uFogColor.xyz , 1.);
    //TODO add in proper lights

    vec4 preGammaFragColor = vec4( fog*baseColor.xyz + (1.0-fog)*uFogColor.xyz , 1.);

    //tone mapping
    preGammaFragColor = preGammaFragColor/(1.+preGammaFragColor);	

    fragColor = pow(preGammaFragColor, vec4(0.455));

    float depthVal =-.3183*atan(vP.w/length(vP.xyz)) + .5;
    gl_FragDepth = depthVal;
    fragColor.a = depthVal;
}