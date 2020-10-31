attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
varying vec3 vTextureCoord;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uModelScale;

void main(void) {
    vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;
    gl_Position = uPMatrix * transformedCoord;
    float myZ = aVertexPositionNormalized.w;
    vTextureCoord = vec3( aTextureCoord.st*myZ, myZ );
}