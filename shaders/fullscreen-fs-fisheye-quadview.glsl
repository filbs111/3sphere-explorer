#version 300 es
precision mediump float;
	
in vec2 vTextureCoord;
uniform sampler2D uSampler;
//uniform sampler2D uSamplerDepthmap;

uniform vec2 uInvF;
uniform float uOversize;
uniform float uVarOne;
uniform vec2 uInvFadjusted; //??
uniform vec2 adjust;

out vec4 fragColor;

void main(void) {
    
    //vec2 modifiedTextureCoord = 4.*(vTextureCoord - .5)/(uOversize*uInvF);	//TODO modify in vert shader.
    //vec2 modifiedTextureCoord = 2.*(vTextureCoord-.5)/(uOversize*uInvF);
    //vec2 modifiedTextureCoord = 4.*(vTextureCoord+0.5)/(uOversize);
        //TODO what should this be? 
    //vec2 modifiedTextureCoord = 2.*(vTextureCoord+.5)/(uOversize*uInvF);  //??

    //vec2 modifiedTextureCoord = 4.*(vTextureCoord-.5)/(uInvFadjusted); // guess bollocks....
//vec2 modifiedTextureCoord = 2.*vTextureCoord/(uOversize*uInvF);; // guess bollocks....
    //vec2 modifiedTextureCoord = 2.*vTextureCoord-1.;
    vec2 modifiedTextureCoord = vTextureCoord;

    vec3 toproject = vec3(0.0,0.0,1.0)*(2.0 + uVarOne*dot(modifiedTextureCoord,modifiedTextureCoord)) + vec3( modifiedTextureCoord.s, modifiedTextureCoord.t, 0.0);
                                            
    vec3 afterrotate = vec3( uInvFadjusted.x*toproject.x , uInvFadjusted.y*toproject.y, 
                            toproject.z - adjust.x*toproject.x - adjust.y*toproject.y);

    vec3 sampleCoords = vec3( 0.5*afterrotate.x + afterrotate.z,
                                            0.5*afterrotate.y + afterrotate.z,
                                            2.0*afterrotate.z);

    //bodge sample coords that are intended to sample from a quadrant of a surface to sample from whole surface.
    //this requires knowing which quadrant are in.
    //vec3 adjustedSampleCoords = vec3( 2.*sampleCoords.x + sampleCoords.z, 2.*sampleCoords.y + sampleCoords.z, sampleCoords.z);
    vec3 adjustedSampleCoords =vec3( 2.*sampleCoords.x, 2.*sampleCoords.y, sampleCoords.z);;
    //vec3 adjustedSampleCoords =vec3( 4.*sampleCoords.x-4.*sampleCoords.z, 4.*sampleCoords.y-4.*sampleCoords.z, sampleCoords.z);

    fragColor = textureProj(uSampler, adjustedSampleCoords);
}