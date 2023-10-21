#version 300 es
in vec3 aVertexPosition;
out vec2 vTextureCoord;

void main(void) {
    gl_Position = vec4(aVertexPosition, 1.0);		
    vTextureCoord = aVertexPosition.xy*0.5 + 0.5;
}