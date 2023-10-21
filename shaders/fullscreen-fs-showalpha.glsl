#version 300 es
precision mediump float;
	
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uInvSize;

out vec4 fragColor;

void main(void) {
    
    vec4 MIDv4 = texture(uSampler, vTextureCoord);
    
    fragColor = vec4(vec3(MIDv4.a),1.0);
}