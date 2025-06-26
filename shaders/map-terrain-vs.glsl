#version 300 es
#define M_PI 3.141593
#define M_ROOT2 1.4142

in vec3 aVertexPosition;

#ifdef VERTCOLORS
    in vec3 aVertexColor;
    out vec3 vColor;
#endif

out vec2 vUnitPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec2 uObjCentreRelativeToCameraAngleCoords;
uniform float uBendFactor;
uniform float uTetrahedronism;

vec3 convertToFatTetrahedron(vec3 vertexMapAngles){
    vec2 cosSinZ = vec2(cos(vertexMapAngles.z), sin(vertexMapAngles.z));    //TODO is this fight
    //vec2 cosSinSqZ = cosSinZ*cosSinZ; //TODO why different to other terrain shader? double angle formula?
    vec2 tetrahedronMulitplier = mix(vec2(.707), cosSinZ,uTetrahedronism);

    //vec2 tetrahedronMulitplier = vec2(.707);   //rule out above being broken

	float xOut = vertexMapAngles.x* tetrahedronMulitplier.x;     //would rather use mapAngles.u,v for clarity, but "illegal vector field selection"!!
    float yOut = vertexMapAngles.y* tetrahedronMulitplier.y;
	float zOut = vertexMapAngles.z;

    //retain some pringle curvature to reduce map distortion, make more readable.
    // perhaps circular curvature is better, but to first order, parabolic/cubic should be equivalent
    // perhaps can do better by different curvatures for different z. 

	float multiplier1 = uBendFactor*uBendFactor*0.5;
	float multiplier2 = uBendFactor*multiplier1*0.3333;	//could be about right amount would like terrain dots evenly spaced on map. would like corners to be 90deg
			//guess cos ~ 1 - (1/2)*(bx)^2. sin ~ x + (1/6)(bx)^3 	
    float bend = multiplier1*(xOut*xOut - yOut*yOut);
	return vec3(xOut,yOut,zOut) + bend*vec3(-multiplier2*xOut, multiplier2*yOut, 1.);
}

void main(void) {
    vec3 vertexMapAngles = vec3(aVertexPosition.xy*vec2(2.*M_PI) + 
         uObjCentreRelativeToCameraAngleCoords,  M_PI*(0.25+aVertexPosition.z*M_ROOT2));

    //tennisBallLoader etc shows a strange relation - angle z = Math.PI * (0.25+ z*Math.sqrt(2));
    //could precalculate this, but for consistency with existing code:

    //transform from cube to fat tetrahedron
    vec3 vertexPositionInFatTetrahedron = convertToFatTetrahedron(vertexMapAngles);

    vUnitPos = vertexMapAngles.xy/vec2(M_PI);

    //transform map in frame of output camera
    vec4 transformedCoord = uMVMatrix * vec4(vertexPositionInFatTetrahedron, 1.0);
    gl_Position = uPMatrix * transformedCoord;

    #ifdef VERTCOLORS
        vColor=aVertexColor;
    #endif
}