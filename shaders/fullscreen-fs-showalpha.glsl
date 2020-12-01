precision mediump float;
	
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uInvSize;

void main(void) {
    
    vec4 MIDv4 = texture2D(uSampler, vTextureCoord);
    
    gl_FragColor = vec4(vec3(MIDv4.a),1.0);
}