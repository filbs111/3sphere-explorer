#version 300 es
precision mediump float;
in vec3 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;

out vec4 fragColor;

void main(void) {

    float texSample= textureProj(uSampler, vTextureCoord).x; //TODO don't use projective texture if not necessary! (eg for quads)

    //note doing screenspace derivs here is maybe inefficient - for fixed size on screen, could just be a uniform,
    //or for a quad, just done in vert shader...
    //note also that doing fwidth of the sampled value doesn't work well for points where no gradient/

    //float wide = fwidth(sample);

    float derivX = dFdx(texSample);
    float derivY = dFdy(texSample);
    float wide = abs(derivX) + abs(derivY);

    float growPix = 0.; //grow in screen space

    float midval = 0.4;   //default 0.5, but can hack to smaller to grow in text space (ie proportional to letter size). 

    float smoothStepped = smoothstep(midval - wide*(growPix + 1.) , midval - wide*(growPix - 1.), texSample);


        // TODO achieve vector display-like effect where lines are fixed width in screen frame 

        // bloom effect
        //TODO fix this - currently glitches for distant text. guess because hitting sdf maxima between chars.
        // assumption that gradient magnitude is constant breaks down. perhaps better to pass in scale to shader, just use
        // SDF value (not fwidth)
        // maybe increasing border around chars on font sheet would help too
        // or don't bother here, just do bloom as a final pass, perhaps on whole scene.
    // float blurFactor = 5.;
    // float blurry = smoothstep(midval - blurFactor*wide*(growPix + 1.) , midval - blurFactor*wide*(growPix - 1.), sample);
    // smoothStepped = smoothStepped + blurry;

    fragColor = uColor * vec4(vec3(1.0), smoothStepped);

}