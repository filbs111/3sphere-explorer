#extension GL_EXT_frag_depth : enable
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uSamplerDepthmap;

uniform vec2 uInvSize;
uniform vec2 uInvF;
uniform float uOversize;
uniform float uVarOne;

//WIP
//TODO increase size of input texture so that doesn't go out of range after barrel distortion. (can see texture clamp around edges currently)
//TODO use fxaa

void main(void) {
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
    vec4 MIDv4 = texture2DProj(uSampler, vec3(1.0,1.0,2.0)*centrePoint );
    
    gl_FragColor = MIDv4;

    gl_FragDepthEXT = texture2DProj(uSamplerDepthmap, vec3(1.0,1.0,2.0)*centrePoint ).r;
    //^unnecessary if decide to use alpha to contain depth info for input to blur
}