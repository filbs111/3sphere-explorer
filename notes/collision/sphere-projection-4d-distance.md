
most 3d objects in the game are triangular meshes projected from 3D to 4D.

currently in game, player is treated as a sphere, and collides with triangles in these meshes.

currently uses approximate system where project the player position from 4D into 3D object frame, and treat the player collision 
shape as a sphere in this space, calculating distance from player to triangle as proportional to distance in this space. 
This approximation is good when the player is close to the centre of the object, which is true for the whole object when the object 
is scaled sufficiently small. 

however, when the player is further from the centre of the object, approximation breaks down. The player bounding sphere when projected
is actually ellipsoidal.

want to convert code to avoid using this approximation.

in collision code, currently calculate in 3D, distance from player position in object 3D from from triangle verts, edges, faces.

how to convert to 4D? 

vertices
--------

in frame of object, project triangle point to 4d, using glsl style psuedocode:

normalize(vec4(point*objectScale , 1.0))

then just take vector difference between this and 4d player position in object frame.

edges
-----

already storing 3d distance from obj origin to edge and direction of closest point on extended edge. in 4d, extended edge is a great circle. 

distance from edge to some point might be found by considering moving a plane (dividing 4sphere in halves) from origin towards edge, and seeing when it hits the point. however, this isn't full story - point could be equidistant from origin, but distant from edge.

the great circle can be defined by 2 vectors - one the 4d point closest to the origin, another a quarter way around great circle in edge direction. any point on this circle is a sum of these 2 vectors Asin(t) + Bcos(t)

if know A,B, and player point p,

p - A(A dot p) - B(B dot p) = q

take length of q.

if closest point in 3d is C,

A = normalize(vec4(C*objectScale , 1.0))

if 3d edge direction is E

B = vec4(E , 0.0)

likely maths can be massively simplified here.


actually stored edge normals might be different! suspect points away from edge  along triangle face surface, and the distance from origin stored is actually distance from the prism face. suspect can take the distance from the triangle plane and the prism plane in 4d by dot prods (see face section here), and combine somehow - perhaps just simple vector addition (total length by pythagoras) - not about this... also are edge normals equivalent to direction of prism face from origin??? (think yes)


face
----

seems simpler - read start of edges section! 

take direction quarter way around world from closest point on face

if closest point in 3d is c

the 4d point is 

C = normalize( vec4(c, 1.0) )

a point 1/4 around world is 

D = vec4( -normalize(c)*C.w, len(C.xyz))

can simplify this

D =  vec4( -normalize(c), len(c) ) * C.w

and because c is stored as direction, length, normalize(c), len(c) are for free, len(c) should be scaled by object scale.


then for point P, just look at magnitude of P dot D,
here critical value for collision is projected player radius r/root(1+r*r) . should ensure vert, edge, face tests use same dist measure - eg angle, projected distance etc (though in practice player small so may not matter)




TODO 
code converting from 3d may also require calculation of collision point...