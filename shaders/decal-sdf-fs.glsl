#extension GL_OES_standard_derivatives : enable
precision mediump float;
varying vec3 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;

void main(void) {

    float sample= texture2DProj(uSampler, vTextureCoord).y; //TODO don't use projective texture if not necessary! (eg for quads)

    //note doing screenspace derivs here is maybe inefficient - for fixed size on screen, could just be a uniform,
    //or for a quad, just done in vert shader...
    //note also that doing fwidth of the sampled value doesn't work well for points where no gradient/

    float wide = fwidth(sample);
    float smoothStepped = smoothstep(0.5 - wide , 0.5 + wide, sample);

    gl_FragColor = uColor * vec4(vec3(1.0), smoothStepped);

}