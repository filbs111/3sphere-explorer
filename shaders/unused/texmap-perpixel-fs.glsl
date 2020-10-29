precision mediump float;
varying vec3 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;
varying float fog;
uniform vec4 uFogColor;
varying vec4 adjustedPos;
varying vec4 transformedNormal;	

void main(void) {
    float light = -dot( normalize(adjustedPos), transformedNormal);
    light = max(light,0.0);	//unnecessary if camera pos = light pos
    //falloff
    light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);
    
    gl_FragColor = vec4( fog*( vec3(light) + uFogColor.xyz ), 1.0)*uColor*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
    
    //gl_FragColor = uColor*fog*texture2DProj(uSampler, vTextureCoord) + (1.0-fog)*uFogColor;
    //gl_FragColor = (1.0-fog)*uFogColor;
    gl_FragColor.a =1.0;
}