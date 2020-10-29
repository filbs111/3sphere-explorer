uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

attribute vec4 aVertexCentrePosition;	//instanced attribute
attribute vec2 aVertexPosition;			//offset position

//todo make larger and fade with distance to avoid resolution problems (or make larger generally and use mipmapped blob texture)
//todo tile towards camera or scale so appears correctly in rectilinear projection (sphere off axis should appear as ellipse)

void main(void) {
    vec4 transformedCoord = uMVMatrix * aVertexCentrePosition;
    gl_Position = uPMatrix * ( transformedCoord + vec4(aVertexPosition, vec2(0.)));
}
//for simple speck objects, for use with instanced rendering