#version 300 es
#define M_PI 3.141593

in vec3 aVertexPosition;
uniform mat4 uMVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uPMatrix;
uniform vec3 uModelScale;
uniform vec2 uMapCentreAngleCoords;
uniform float uBendFactor;

float wrapToMinusPiToPi(float inputAngle){
    return (mod((inputAngle/M_PI) + 1.0, 2.0) - 1.0)*M_PI;   //note could just divide whole thing by PI, reduce distance viewing map from to 
        //compensate for map being smaller.
}

vec2 pos4ToMapAngles(vec4 fourVecPos){
    float uAng = atan(fourVecPos.x,fourVecPos.y)-uMapCentreAngleCoords.x;   //would rather use uMapCentreAngleCoords.u,v for clarity, but "illegal vector field selection"!!
    float vAng = atan(fourVecPos.z,fourVecPos.w)-uMapCentreAngleCoords.y;
    return vec2(wrapToMinusPiToPi(uAng), wrapToMinusPiToPi(vAng));
}

vec3 convertToFatTetrahedron(vec2 mapAngles, vec4 fourVecPos){
    vec4 squaredPos = fourVecPos*fourVecPos;
    float lenxy = sqrt( squaredPos.x+squaredPos.y);
	float lenzw = sqrt( squaredPos.z+squaredPos.w);
	float xOut = mapAngles.x* lenxy;     //would rather use mapAngles.u,v for clarity, but "illegal vector field selection"!!
    float yOut = mapAngles.y* lenzw;
	float zOut = atan( lenzw, lenxy);

    //retain some pringle curvature to reduce map distortion, make more readable.
    // perhaps circular curvature is better, but to first order, parabolic/cubic should be equivalent
    // perhaps can do better by different curvatures for different z. 

	float multiplier1 = uBendFactor*uBendFactor*0.5;
	float multiplier2 = uBendFactor*multiplier1*0.3333;	//could be about right amount would like terrain dots evenly spaced on map. would like corners to be 90deg
			//guess cos ~ 1 - (1/2)*(bx)^2. sin ~ x + (1/6)(bx)^3 
	float uBendFactor = multiplier1*(xOut*xOut - yOut*yOut);
	zOut += uBendFactor;
	xOut -= multiplier2*xOut*uBendFactor;
	yOut += multiplier2*yOut*uBendFactor;

	return vec3(xOut, yOut, zOut);
}

void main(void) {
    vec4 vertexPositionFourvec = (vec4(uModelScale*aVertexPosition, 1.0));
    vec4 transformedCoordWorld = uMMatrix * normalize(vertexPositionFourvec);

    //translate this into map angle, subtract the map centre position (usually player position) and move by steps of 2*PI so within +/-PI
    vec2 vertexMapAnglesCentred = pos4ToMapAngles(transformedCoordWorld);

    //transform from cube to fat tetrahedron
    vec3 vertexPositionInFatTetrahedron = convertToFatTetrahedron(vertexMapAnglesCentred, transformedCoordWorld);

    //transform map in frame of output camera
    vec4 transformedCoord = uMVMatrix * vec4(vertexPositionInFatTetrahedron, 1.0);
    gl_Position = uPMatrix * transformedCoord;    
}