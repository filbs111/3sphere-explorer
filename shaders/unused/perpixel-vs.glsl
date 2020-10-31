attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
uniform vec3 uModelScale;
varying float fog;
varying vec4 adjustedPos;
varying vec4 transformedNormal;

void main(void) {
    vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;
    gl_Position = uPMatrix * transformedCoord;

    transformedNormal = uMVMatrix * vec4(aVertexNormal,0.0);
    adjustedPos = transformedCoord - uDropLightPos;
    
    fog = 0.5*(1.0 + transformedCoord.w);
}