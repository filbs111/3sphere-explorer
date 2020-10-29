precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uInvSize;

void main(void) {	
    float FXAA_SPAN_MAX = 8.0;
    float FXAA_REDUCE_MIN = 1.0/128.0;
    float FXAA_REDUCE_MUL = 1.0/8.0;

    vec4 luma = vec4(0.299,0.587,0.144,0.0);
    
    vec4 MIDv4 = texture2D(uSampler, vTextureCoord);
    float MID = dot(luma,MIDv4);
    float NW = dot(luma, texture2D(uSampler, vTextureCoord + uInvSize*vec2(-1.0,-1.0)));
    float NE = dot(luma, texture2D(uSampler, vTextureCoord + uInvSize*vec2(1.0,-1.0)));
    float SW = dot(luma, texture2D(uSampler, vTextureCoord + uInvSize*vec2(-1.0,1.0)));
    float SE = dot(luma, texture2D(uSampler, vTextureCoord + uInvSize*vec2(1.0,1.0)));
    
    //calculate normal to gradient
    vec2 dir;
    dir.x = (SW+SE) - (NW+NE);
    dir.y = (SW+NW) - (SE+NE);
                
    float dirReduce = max((NW+NE+SW+SE)*FXAA_REDUCE_MUL*0.25 , FXAA_REDUCE_MIN);
    float inverseDirAdjustment = 1.0/(min(abs(dir.x),abs(dir.y)) + dirReduce);
    
    dir = max(vec2(-1.0,-1.0)*FXAA_SPAN_MAX , min( vec2(1.0,1.0)*FXAA_SPAN_MAX , dir*inverseDirAdjustment));
    dir = dir*0.5;	//like result2 from video
    //now dir is multiplied by thirds, so guess could simplify above code.
    //missing test for extreme result2 values, sampling for result1. 
    
    vec4 avg = 0.333*(texture2D(uSampler, vTextureCoord + uInvSize*dir.xy) + texture2D(uSampler, vTextureCoord - uInvSize*dir.xy) + MIDv4);
    avg.a=1.0;
    gl_FragColor = avg;
    //gl_FragColor = vec4(vec3(avg.y),1.0);	//grayscale by just take green channel
    //gl_FragColor = vec4(vec3(dot(luma,avg)),1.0);	//grayscale
}