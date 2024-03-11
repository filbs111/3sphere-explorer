#version 300 es
precision mediump float;
	
in vec2 vTextureCoord;
uniform sampler2D uSampler;

// we need to declare an output for the fragment shader
out vec4 fragColor;

//TODO just generalise anaglyph shader, pass in different uniforms.

vec3 mapColour(vec3 inputColor){
  //simple grayscale. TODO conserve colour  
  vec3 gammaed = pow(inputColor, vec3(2.2));
  float grayScale = dot(vec3(0.3,0.6,0.1), gammaed);
  return vec3(grayScale);
}

void main(void) {
    vec4 texelColorL = texture(uSampler, vTextureCoord*vec2(0.5,1.0));
    vec4 texelColorR = texture(uSampler, vTextureCoord*vec2(0.5,1.0) + vec2(0.5,0.0));

    //vec3 anaglyphColor = vec3(texelColorL.r, texelColorR.gb);	//simple anaglyph (not equal brightness)
    
    vec3 mappedLColor = mapColour(texelColorL.xyz);
    vec3 mappedRColor = mapColour(texelColorR.xyz);

    //vec3 combinedColor = vec3(mappedLColor.r, mappedRColor.gb); //no ghosting cancellation

  vec3 combinedColor = vec3(
        mappedRColor.r + 0.041 * (1.0 - mappedLColor.g),
        mappedLColor.g + 0.0036 * (1.0 - mappedRColor.r)  + 0.023 * (1.0 - mappedRColor.b),
        mappedRColor.b
        );

    vec3 anaglyphColor = pow(combinedColor, vec3(0.455));
        
    fragColor = vec4( anaglyphColor, 1.0);
}