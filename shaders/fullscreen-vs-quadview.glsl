#version 300 es
in vec3 aVertexPosition;
out vec2 vTextureCoord;

uniform vec2 xMultShift;	//used when drawing left and right halfs of fullscreen plane separately (could just use different mesh, but very few verts so inexpensive)
								//to recover old behaviour multiply by 1 and shift by zero ie vec2(1,0, 0.0)
uniform vec2 yMultShift;
uniform float uVarTwo;
uniform float uAspect;

void main(void) {
    gl_Position = vec4(aVertexPosition, 1.0);
	vTextureCoord = vec2( (aVertexPosition.s*xMultShift.x + xMultShift.y )*uVarTwo*uAspect, (aVertexPosition.t*yMultShift.x + yMultShift.y )*uVarTwo);
}