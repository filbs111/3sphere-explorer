precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uInvSize;
uniform vec2 uInvF;
uniform float uOversize;    
uniform float uVarOne;
//uniform vec2 uInvSizeSourceTex; //maybe can calc from other uniforms (oversize?) ? 

//WIP
//TODO increase size of input texture so that doesn't go out of range after barrel distortion. (can see texture clamp around edges currently)

//version with fxaa, integrated.
//non-integrated method is to perform fisheye distortion, then do fxaa on the output.
//this version, for each pixel samples, fxaa is performed in input rectilinear projection texture space.
//suspect may lead to better results, and reduces number of draw calls.
//this shader is a combination of fullscreen-fs-fisheye, fullscreen-fs-bennybox.
//further work: also integrate with blurring.

void main(void) {

    float FXAA_SPAN_MAX = 8.0;
    float FXAA_REDUCE_MIN = 1.0/128.0;
    float FXAA_REDUCE_MUL = 1.0/8.0;

    vec4 luma = vec4(0.299,0.587,0.144,0.0);


    //vec2 oversize = vec2(2.,2.);	//TODO combo this with something else and pass in as uniform?
                                    //using this as simple bodge - increase fx,fy of rendered texture (that will use in this shader), reverse scaling here. could be much more efficient (doing in frag shader is worst case!). also hardcoded value is suitable only for some power, fov... (diagonal FOV ?)
                                    //for small FOV, oversize = 1.
                                    //for value (assumed that same for fx,fy - maybe approximation) 1.6, means ~2.56x more pixels drawn, assuming scale up texture so that detail in centre part of screen is 1:1 in final output. this means a big performance impact, so, if want to keep big FOV, should looks for other method (2 or 4 textures, or cubemap, or vertex shader version (distort meshes in vertex shader - would require sufficient tesselation- project for webgl2?)). similar optimisations apply to rendering view through portal.
                                    
                                    //fisheye also reduces sensation of speed
                                    //todo combine with FXAA
                                    
    /* calculation of oversize to pass in that will fill screen.
        note that probably better to do something like keep diagonal fov constant. 
    
    vTextureCoord runs from 0 to 1
    
    let vTextureCoord=0 
    
    
    modifiedTextureCoord = 4. * (-0.5) * (1/oversize) * (1/uUnvF)  
                            = -2  * (1/oversize) * [1/uInvF.u , 1/uInvF.v]
    
    
    centrepoint.u = 
        2.0  + uVarOne*  4.  * (1/oversize)^2  * { (1/uInvF.u)^2 +   (1/uInvF.v)^2 }    +   -2  * (1/oversize)
        
        let this = 0
        
        =>   2  * (1/oversize)  =  2 + uVarOne*  4.  * (1/oversize)^2  * { (1/uInvF.u)^2 +   (1/uInvF.v)^2 }
        
        =>     oversize   =  oversize^2  +  uVarOne * 2 * { (1/uInvF.u)^2 +   (1/uInvF.v)^2 }
        
        =>    oversize^2  -  oversize  =  -uVarOne * 2 * { (1/uInvF.u)^2 +   (1/uInvF.v)^2 }
    
        =>	(oversize - .5)^2  = 0.25 -uVarOne * 2 * { (1/uInvF.u)^2 +   (1/uInvF.v)^2 }
    
    
    */
                                    
                                    
    //float uVarOne = -0.02;	//TODO USE UNIFORM. +ve = pincushion, -ve = barrel. from webgl-wideangle project. -0.125 for stereographic projection. use something smaller for more subtle effect (since not viewing screen from infinity, only using 1 camera)
    
    vec2 modifiedTextureCoord = 4.*(vTextureCoord - 0.5)/(uOversize*uInvF);	//TODO modify in vert shader.
    
    //gl_FragColor = texture2DProj(uSampler, vec3(1.0,1.0,2.0)*(2.0 + uVarOne*dot(modifiedTextureCoord,modifiedTextureCoord)) + vec3(uInvF.st*modifiedTextureCoord.st, 0.0));

    vec3 centrePoint = (2.0 + uVarOne*dot(modifiedTextureCoord,modifiedTextureCoord)) + vec3(uInvF*modifiedTextureCoord, 0.0);


   //vec4 MIDv4 = texture2DProj(uSampler, vec3(1.0,1.0,2.0)*centrePoint );
    //use texture2d instead
    vec3 fisheyeProjCoords = vec3(1.0,1.0,2.0)*centrePoint;
    vec2 vTextureCoordB = fisheyeProjCoords.xy / fisheyeProjCoords.z;
    // vec4 MIDv4 = texture2D(uSampler, vTextureCoord );
    
    // gl_FragColor = MIDv4;
    // gl_FragColor.a=1.;	//ensure alpha 1 so non-fullscreen looks same as fullscreen (otherwise white)


    //uInvSize for fxaa is different to as used above for fisheye mapping. this is in original texture space (input to fisheye)

    vec2 uInvSizeSourceTex = uInvSize/uOversize;    //note using name beginning u but not a uniform. (but could be, depends only on uniforms)
    
    vec4 MIDv4 = texture2D(uSampler, vTextureCoordB);
    float MID = dot(luma,MIDv4);
    float NW = dot(luma, texture2D(uSampler, vTextureCoordB + uInvSizeSourceTex*vec2(-1.0,-1.0)));
    float NE = dot(luma, texture2D(uSampler, vTextureCoordB + uInvSizeSourceTex*vec2(1.0,-1.0)));
    float SW = dot(luma, texture2D(uSampler, vTextureCoordB + uInvSizeSourceTex*vec2(-1.0,1.0)));
    float SE = dot(luma, texture2D(uSampler, vTextureCoordB + uInvSizeSourceTex*vec2(1.0,1.0)));
    
    //calculate normal to gradient
    vec2 dir;
    dir.x = (SW+SE) - (NW+NE);
    dir.y = (SW+NW) - (SE+NE);
                
    float dirReduce = max((NW+NE+SW+SE)*FXAA_REDUCE_MUL*0.25 , FXAA_REDUCE_MIN);
    float inverseDirAdjustment = 1.0/(min(abs(dir.x),abs(dir.y)) + dirReduce);
    
    dir = max(vec2(-1.0,-1.0)*FXAA_SPAN_MAX , min( vec2(1.0,1.0)*FXAA_SPAN_MAX , dir*inverseDirAdjustment));
    
    vec4 result1 = 0.5*(texture2D(uSampler, vTextureCoordB + uInvSizeSourceTex*(0.16667*dir.xy)) + texture2D(uSampler, vTextureCoordB - uInvSizeSourceTex*(0.16667*dir.xy)));
    
    vec4 result2 = result1*0.5 + 0.25*(texture2D(uSampler, vTextureCoordB + uInvSizeSourceTex*(0.5*dir.xy)) + texture2D(uSampler, vTextureCoordB - uInvSizeSourceTex*(0.5*dir.xy)));
    
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