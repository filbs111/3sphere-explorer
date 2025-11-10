#version 300 es

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uModelScale;
uniform vec3 uInstanceScale;    //applies to all instances
uniform vec3 uScroll;

in vec3 aParticlePosPreOffset;
in vec3 aVertexPosition;

#ifdef CUSTOM_DEPTH
	out vec2 vZW;
    out vec4 vP;
#endif

vec3 wrapToUnitCube(vec3 inputVec){
    return mod(inputVec + 1.0, 2.0) - 1.0;
}

void main(void) {
    vec3 particlePosWrapped = wrapToUnitCube(aParticlePosPreOffset + uScroll);
    vec3 vertexPos = particlePosWrapped + uInstanceScale*aVertexPosition;
    vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*vertexPos, 1.0));
    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;
    gl_Position = uPMatrix * transformedCoord;

#ifdef CUSTOM_DEPTH
    vZW = vec2(.5*transformedCoord.w, transformedCoord.z-1.);
    vP = transformedCoord;
#endif

    //TODO include fog? lighting?
}

