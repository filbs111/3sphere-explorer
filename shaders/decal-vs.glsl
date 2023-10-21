#version 300 es
in vec3 aVertexPosition;
in vec2 aTextureCoord;
out vec3 vTextureCoord;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uModelScale;
uniform vec4 uUvCoords; //corner, dimensions.

void main(void) {
    vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;
    gl_Position = uPMatrix * transformedCoord;
    float myZ = aVertexPositionNormalized.w;

    vec2 adjustedTexcoord = uUvCoords.xy + uUvCoords.zw * aTextureCoord.st;
        //has no effect when uUvCoords = (0,0,1,1)

    vTextureCoord = vec3( adjustedTexcoord*myZ, myZ );
}