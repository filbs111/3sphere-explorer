
//from http://learningwebgl.com/blog/?p=507
var levelCubeData={
	vertices:[
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,

      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,

      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ],
	normals:[
      // Front face
      0, 0,  1.0,
      0, 0,  1.0,
      0, 0,  1.0,
      0, 0,  1.0,

      // Back face
      0, 0, -1.0,
      0, 0, -1.0,
      0, 0, -1.0,
      0, 0, -1.0,

      // Top face
      0,  1.0, 0,
      0,  1.0, 0,
	  0,  1.0, 0,
      0,  1.0, 0,
	  
      // Bottom face
      0, -1.0, 0,
	  0, -1.0, 0,
      0, -1.0, 0,
	  0, -1.0, 0,

      // Right face
       1.0, 0, 0,
       1.0, 0, 0,
	   1.0, 0, 0,
	   1.0, 0, 0,

      // Left face
      -1.0, 0, 0,
      -1.0, 0, 0,
	  -1.0, 0, 0,
	  -1.0, 0, 0,
    ],	
	uvcoords:[
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Back face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Top face
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,

      // Bottom face
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,

      // Right face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ],	
	indices:[
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
    ]
}

var smoothCubeData = (function(){
	var normConst = 1/Math.sqrt(3);
	var vertices=[
		-1,-1,-1,	//						0
		-1,-1,1,	//		1
		-1,1,-1,	//						2
		-1,1,1,		//		3
		1,-1,-1,	//									4
		1,-1,1,		//					5
		1,1,-1,		//									6
		1,1,1		//					7
	];
	var normals=vertices.map(function(elem){return elem*normConst;});
	
	return {
		vertices:vertices,
		normals:normals,
		uvcoords:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],	//TODO no uvcoords - require no texture variant of shader
		indices:[
			0,1,2,
			2,1,3,
			2,3,6,
			6,3,7,
			6,7,4,
			4,7,5,
			4,5,0,
			0,5,1,
			7,3,5,
			5,3,1,
			2,6,0,
			0,6,4
		],
		stripIndices:[		//untested
			6,6,4,2,0,
			0,1,2,3,6,7,4,5,0,1,
			1,3,5,7,7
		]
	}	
})();