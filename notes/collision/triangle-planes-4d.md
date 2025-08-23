for triangle soup collision, currently creating face, edge normals in 3d, then converting to 4d, by suspect quite inefficient method.

for speed, and for use in objects that are not projected from 3d space onto 4d space, find formulation straight from 4d vertices.

triangle face direction is orthogonal to all 3 vertex points.

each triangle edge direction is perpendicular to the 2 vertex points for that edge, and the face direction.

to find point orthogonal to 3 points, where points are p,q,r

p dot s = 0
q dot s = 0
r dot s = 0


p.x  p.y  p.z  p.w           s.x          0
q.x  q.y  q.z  q.w    *      s.y     =    0
r.x  r.y  r.z  r.w           x.z          0
                             x.w          


how to solve this? can do matrix inverse of square matrix, so just add zeros 


p.x  p.y  p.z  p.w           s.x          0
q.x  q.y  q.z  q.w    *      s.y     =    0
r.x  r.y  r.z  r.w           x.z          0
0    0    0    0             x.w          0


allegedly this is solved by SVD or something. brain hurts.


consider instead each edge as great circle. take 2 verts. make 1 orthogonal to other by "Gram-Schmidt" (think this is what doing already)

then have 2 orthogonal verts A, B

the extended edge great circle can be described as 

points v where Acost + Bsint, 

points x where (v dot A)^2 + (v dot B)^2 = 1

which is can be expanded like 

(v.x)^2 ((A.x)^2 + (B.x)^2) +
(v.y)^2 ((A.y)^2 + (B.y)^2) +
(v.z)^2 ((A.z)^2 + (B.z)^2) +
(v.w)^2 ((A.w)^2 + (B.w)^2) + 

2 (v.x)(v.y) ( (A.x)(A.y) + (B.x)(B.y) ) + 
2 (v.x)(v.z) ( (A.x)(A.z) + (B.x)(B.z) ) + 
2 (v.x)(v.w) ( (A.x)(A.w) + (B.x)(B.w) ) + 
2 (v.y)(v.z) ( (A.y)(A.z) + (B.y)(B.z) ) + 
2 (v.y)(v.w) ( (A.y)(A.w) + (B.y)(B.w) ) +
2 (v.z)(v.w) ( (A.z)(A.w) + (B.z)(B.w) ) +

and we know A,B so can work out all parts on the RHS, 


?????

suppose have a 4vec

v1, v2, v3, v4

some kind of product of this vec with itself makes a symmetric matrix

v1v1 v1v2 v1v3 v1v4
v2v1 v2v2           etc

is it possible to generally express a symmetric 4matrix like this in such a compact form ? 

probably not - 10 numbers can't be expressed as 4, but is there some extra constraint here? like how can express so4 as quaternion



---------------------------------


learned that this problem is similar to how a 3d cross product is a "partial determinant".

similarly then suppose we have 3 linearly independent 4-vecs, and want to find point orthogonal to all

|Ax, Ay, Az, Aw|
|Bx, By, Bz, Bw|
|Cx, Cy, Cz, Cw|
|i   j   k   l |

= 

i |Ax, Ay, Az| - j |Az, Aw, Ax| + k ....
  |Bx, By, Bz|     |Bz, Bw, Bx|
  |Cx, Cy, Cz|     |Cz, Cw, Cx|

and we might then reuse 2x2 determinants.

and once have the new 4-vec from the 3 vert 4vecs, and use it with each pair of 2 4vec verts to get edge plane normal, might reuse more.

also might reuse calcs across shared edges (though maybe not huge benefit - 2 faces per edge.)

TODO code this, check produces desired results, optim
