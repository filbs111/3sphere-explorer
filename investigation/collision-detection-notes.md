broad phase collision detection
===============================

At time of writing, 3sphere game has a grid system, where the 3-sphere is comprised of 8 3d grids, for each cube in a tesseract.

In this system, a grid cube is found for each object, and collision tests performed against objects in same or neighbouring grid cubes. 

This works for objects of dimension not more than the grid cube size.

Would like to try something different - Bounding Volume Heirarchy (BVH).

Bounding Volumes
================

Use "Global" (for a single 3-sphere) bounding volumes at the level of meshes. 

This way can instance meshes about environment with different orientations, and share collision detection routines, data once past the global bounding volume check. The next stage of collision testing in the shared reference frame of instanced object might also be BVH.

This should reduce loading, rendering time, amount of collision data requried.

Sphere BVH
----------

One option is to make a BVH of spheres. Perhaps good idea. Haven't considered thoroughly. Suspect AABBs preferable.

Axis Aligned Bounding Boxes (AABB)
----------------------------------

To calculate 4D AABBs for an arbitrarily oriented mesh is not trivial. For a simple and good-enough system, for each mesh, find some bounding volume. A sphere should do. Then for each instance of that mesh, find the global AABB for the sphere. This AABB includes the AABB of the actual mesh - generally it will be larger but expect OK.

In order to find the AABB of the sphere, can again be approximate. Easy to take a 3-sphere, and AABB will be a hypercube. Can clip this to the hypercube containing the world (unit) 3-shpere. 

Or can get accurate AABB of the sphere - think this is the AABB of the AABB of the surface of the sphere, and of the points where any of x,y,z,w are 1 or -1 that are within the sphere.

### calculation of AABB for sphere

For easier thinking, consider circular region on surface of a sphere, then extend this to spherical region on a 3-sphere.

circle radius r at distance 1 from origin before projection onto sphere.

position of circle centre is unit vector p (on the sphere surface)

circle radius projected onto sphere = r / root( 1 + r^2)

the centre of the circle = p / root( 1 + r^2)

half size of the AABB = circlerad* ( py^2 + pz^2,  px^2 + pz^2,  px^2 + py^2 )
            = circlerad*(1-px^2 , 1-py^2, 1-pz^2)
and centre of this AABB = centre of the circle

and extend AABB to include points if d close enough to an axis (so circle includes axis)

TODO this logic

TODO make a test with many random circles, check many random points for collision with these circles. control test is brute force point in circle. then with AABB check first. See whether results same, whether calculation time same. (generate AABBs once). might find that brute force is faster. then try BVH.



Once these AABBs are found, simplest use - broad phase for a point - check vs each AABB, or for another object or great circle (bullet trajectory), check its AABB vs each object's AABB. (x,y,z AABB ranges must overlap)

Next optimisation - might store morton code for +ve, -ve corners of each AABB. Then can do simple first check of these bounds that rules out more candidates (morton code ranges must overlap).

Or construct a Bounding Volume Heirarchy (BVH).

Bounding Volume Heirarchy (BVH)
===============================

TODO. 

https://www.youtube.com/watch?v=LAxHQZ8RjQ4 suggests morton codes might be handy for building this quickly.

narrow phase collision detection
================================

For fine collision test once passed broad phase.

Could use another AABB BVH, constructed from triangles. SDF (also useful for finding closest point on mesh, used for whoosh audio effect when passing by). Convex hulls, custom logic eg for fractals, etc.  
