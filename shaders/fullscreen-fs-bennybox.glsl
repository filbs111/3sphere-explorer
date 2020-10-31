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
    
    vec4 result1 = 0.5*(texture2D(uSampler, vTextureCoord + uInvSize*(0.16667*dir.xy)) + texture2D(uSampler, vTextureCoord - uInvSize*(0.16667*dir.xy)));
    
    vec4 result2 = result1*0.5 + 0.25*(texture2D(uSampler, vTextureCoord + uInvSize*(0.5*dir.xy)) + texture2D(uSampler, vTextureCoord - uInvSize*(0.5*dir.xy)));
    
    float lumaM = dot(luma, MIDv4);
    float lumaMin = min(lumaM, min(min(NW,NE), min(SW,SE)));
    float lumaMax = max(lumaM, max(max(NW,NE), max(SW,SE)));
    float lumaResult2 = dot(luma, result2);

    result1.a=1.0;	//make alpha 1 because in some cases input data has alpha, and output may use alpha.  
    result2.a=1.0;	//TODO ensure that input alpha=1 , or ensure output alpha doesn't matter, remove this 

    if (lumaResult2 < lumaMin || lumaResult2> lumaMax){
        gl_FragColor = result1;
    }else{
        gl_FragColor = result2;
    }		
}