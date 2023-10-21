#version 300 es
precision mediump float;
	
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uInvSize;

// we need to declare an output for the fragment shader
out vec4 fragColor;

void main(void) {
    //fragColor = texture2D(uSampler, vTextureCoord);
    //fragColor = vec4(vec3(texture2D(uSampler, vTextureCoord).y),1.0);	//grayscale by just take green channel
    
    vec4 luma = vec4(0.299,0.587,0.144,0.0);
    
    vec4 MIDv4 = texture(uSampler, vTextureCoord);
    float MID = dot(luma,MIDv4);
    float NW = dot(luma, texture(uSampler, vTextureCoord + uInvSize*vec2(-1.0,-1.0)));
    float NE = dot(luma, texture(uSampler, vTextureCoord + uInvSize*vec2(1.0,-1.0)));
    float SW = dot(luma, texture(uSampler, vTextureCoord + uInvSize*vec2(-1.0,1.0)));
    float SE = dot(luma, texture(uSampler, vTextureCoord + uInvSize*vec2(1.0,1.0)));
    
    //calculate normal to gradient
    vec3 dir = 1.5*normalize(vec3( ((SW+SE) - (NW+NE)), ((SW+NW) - (SE+NE)) , 0.25));	//last part a fudge factor so small xy remains after normalisation
                //1.5 is a fudge factor to extend sample position
                
                //TODO should NW, NE etc samples be used in final result if in desired direction?)
            
    vec4 avg = 0.333*(texture(uSampler, vTextureCoord + uInvSize*dir.xy) + texture(uSampler, vTextureCoord - uInvSize*dir.xy) + MIDv4);
    avg.a=1.0;
    fragColor = avg;
    //fragColor = vec4(vec3(avg.y),1.0);	//grayscale by just take green channel
}