precision mediump float;
varying vec3 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;

void main(void) {
    gl_FragColor = uColor*texture2DProj(uSampler, vTextureCoord);	//TODO don't use projective texture if not necessary! (eg for quads)
    //gl_FragColor = uColor;
}