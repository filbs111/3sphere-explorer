attribute vec3 aVertexPosition;
varying vec2 vTextureCoord;

void main(void) {
    gl_Position = vec4(aVertexPosition, 1.0);		
    vTextureCoord = aVertexPosition.xy*0.5 + 0.5;
}