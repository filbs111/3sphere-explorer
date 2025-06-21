#version 300 es
in vec3 aVertexPosition;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uModelScale;
        
void main(void) {
    vec4 aVertexPositionFourvec = (vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoord = uMVMatrix * aVertexPositionFourvec;
    gl_Position = uPMatrix * transformedCoord;    
}