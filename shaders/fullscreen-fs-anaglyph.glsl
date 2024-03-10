#version 300 es
precision mediump float;
	
in vec2 vTextureCoord;
uniform sampler2D uSampler;

// we need to declare an output for the fragment shader
out vec4 fragColor;


vec3 mapColour(vec3 inputColor){
  
  //vec3 premapped = inputColor * vec3(2.0) - vec3(0.5);  //make more extreme image to get ghosting?
  
  vec3 strengths = pow(inputColor, vec3(2.2));   
  //vec3 strengths = pow(inputColor, vec3(1.0));    //not sure if gamma should be applied! 
  
  vec3 stretchVec = vec3(1.0,2.0,1.0);
  vec3 projectionVec = vec3(2.0,-1.0,-1.0);     //??

  vec3 adjustedStrengths = strengths*stretchVec;   //guess. not sure why this looks OK.
                //TODO what is this for (see that not currently used!)
  vec3 normalisedProjDirVec = normalize(projectionVec);

  float dotProd = dot(adjustedStrengths,normalisedProjDirVec);
  vec3 projected = adjustedStrengths - dotProd*normalisedProjDirVec;
  return projected/stretchVec;
}

void main(void) {
    vec4 texelColorL = texture(uSampler, vTextureCoord*vec2(0.5,1.0));
    vec4 texelColorR = texture(uSampler, vTextureCoord*vec2(0.5,1.0) + vec2(0.5,0.0));

    //vec3 anaglyphColor = vec3(texelColorL.r, texelColorR.gb);	//simple anaglyph (not equal brightness)
    
    vec3 mappedLColor = mapColour(texelColorL.xyz);
    vec3 mappedRColor = mapColour(texelColorR.xyz);

    //vec3 combinedColor = vec3(mappedLColor.r, mappedRColor.gb); //no ghosting cancellation

    vec3 combinedColor = vec3(
        0.0314 + mappedLColor.r - 0.035*mappedRColor.g, 
        0.00106 + mappedRColor.g - 0.001*mappedRColor.r,
        mappedRColor.b
        );
        //note half of calculated colours are disregarded!
        //might make calculation more efficient by not calculating those parts.

    vec3 anaglyphColor = pow(combinedColor, vec3(0.455));
        
    fragColor = vec4( anaglyphColor, 1.0);
}