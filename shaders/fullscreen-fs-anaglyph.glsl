#version 300 es
precision mediump float;
	
in vec2 vTextureCoord;
uniform sampler2D uSampler;

// we need to declare an output for the fragment shader
out vec4 fragColor;

void main(void) {
    vec4 leftView = texture(uSampler, vTextureCoord*vec2(0.5,1.0));
    vec4 rightView = texture(uSampler, vTextureCoord*vec2(0.5,1.0) + vec2(0.5,0.0));
    vec3 combined = vec3(leftView.r, rightView.gb);	//simple anaglyph (not equal brightness)
    fragColor = vec4( combined, 1.0);
}