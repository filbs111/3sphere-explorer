#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec4 uDropLightPos;	//position in camera frame ( 0,0,0,1 if light at camera )
out float fog;
uniform vec3 uModelScale;
out float light;
        
void main(void) {
    vec4 aVertexPositionNormalized = normalize(vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoord = uMVMatrix * aVertexPositionNormalized;
    gl_Position = uPMatrix * transformedCoord;

    vec4 transformedNormal = uMVMatrix * vec4(aVertexNormal,0.0);
    vec4 adjustedPos = transformedCoord - uDropLightPos;
    light = -dot( normalize(adjustedPos), transformedNormal);
    light = max(light,0.0);	//unnecessary if camera pos = light pos
    //falloff
    light/=0.1 + 5.0*dot(adjustedPos,adjustedPos);	//1st num some const to ensure light doesn't go inf at short dist
                                                //guess maybe similar to some gaussian light source
    fog = 0.5*(1.0 + transformedCoord.w);
}

/*
note that taking in 3vector for vertex positions since generally objects are significantly smaller than the 3-sphere radius, 
so can project them onto unit 3sphere (set w=1 and normalise to r=1) or j ust set w=1. 
if normalisation is used, i expect will be more efficient to generate 4-vector vertiex buffers and pass those in
mvmatrix will be an SO4 matrix. pmatrix will try a standard projection matrix
possibly want to output additional varying to pass some depth variable
TODO use textured shader to check that that interpolates in sensible way (ie perspective projection observed for rectangles).
*/