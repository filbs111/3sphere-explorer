Collision data currently takes up a lot of RAM!

Currently, collision data for triangle mesh objects exists for both 4d and 3d data. This is done similarly. Currently the 4d data takes up more space largely because more widely used in project currently. Will consider 4d data hereafter.

Collision data for triangle mesh objects contains an AABB tree to make checks for collisions more efficient, and data for each triangle. 

In the browser dev tools, at current time, total of 800M used. Of this, sorting heap snapshot by size shows {verts, face, edges, edgeGcs, AABB, morton} with a retained size of 381M. These are the objects for each triangle. Also shows {group, AABB} with retained size 400M. This is the AABB tree, and references the triangle data, so guess bulk of memory used is triangles.

The triangle data is currently quite inefficiently stored. For each triangle: 

verts: 3 4vecs (vert positions)
face: 1 4vec (face normal)
edges: 3 4vecs (normal to edge, perpendicular to face)
edgeGcs: 3x2 4vecs (two points on great circle through edge)
AABB: 4d axis aligned bounding box of the triangle, used in tree
morton: morton code for position, used for sorting to create aabb tree.

Morton code could be omitted because only used for initial sort, but inexpensive.

Total of 3+1+3+6 = 13 4-vectors per triangle. This could be reduced greatly.

### Ideas

#### 1. caching, coord compression, remove data

1.1) Remove much of this data and just compute at runtime when near to triangle. Perhaps reasonable idea, might work well with cache, since nearby triangles is similar from frame to frame.

1.2) compress 4-vecs. since unit vecs, might store as eg projected onto 8-cell as 3d cube coords and 3 bit cube index. Lot of hassle for little gain.

1.3) use less precision for coords. store as 32-bit floats, or ints. Means using typed arrays so would want to avoid lots of separate 4-vecs, put together in array. Using ints might mean more hassle unpacking, but perhaps useful with 1.2, and if cache decompressed data. (Similar to 1.1, if did together could compress the tri verts, compute everything else at caching time). Say had 3 bits for which of 8 cells, could have 19 bits per cube axis, (0 to 524287), so total 19*3 + 3 = 60 bits per 4-vec, can store as 15 hex chars. Something like half size of ~6 decimal places decimals used currently, perhaps more if consider compression.

1.4) omit edges - these are only included because helpful for convex hull collisions with triangles before computing great-circle vs great-circle edge distances. Might need this for current sphere-triangle collision though. Stored edges aren't shared across triangles though. 

#### 2. 4vec sharing

2.1) share vertices between adjacent triangles. A closed mesh vert has ~6 triangles sharing each vert, so twice as many triangles as verts. By storing deduplicating verts, only need store index of vert in list for each tri, so perhaps 3x indices, 0.5 verts per tri. 

2.2) store 1 additional point per great circle. store this point 90 deg along great circle from existing triangle vertex.

2.3) share great-circles between triangles sharing an edge.

2.4) deduplicate across seams. Extension of basic implementation of 2.1, 2.2 - currently collision data generated using data loaded for drawing, so different verts for tris sharing sharp edge. However, collision data can share these verts, edges. Obj style data can contain separate vert position, norms so may make this easy to do. Only relevant to meshes with seams.

#### 3. ngons

3.1) combine neighbouring coplanar tris into convex n-gons (eg quads). Blender supports exporting quads. Would remove a great circle and face normal per triangle pair. 

### Deliberation

Edge check removal easy, gets from 13 to 10 4vecs per tri. 

Sharing data seems sensible. Also has benefit of making easy the reuse of distance check from vertex, edge gc for neighbouring candidate triangles, making collision testing faster. Doing this for (mostly) closed mesh without seams should mean only 0.5+1+1.5 = 3 4vecs per triangle.

Possible speed issues with disordered in big array of verts etc. Might wish to sort eg by hilber/morton, but only bother if slow. Would try sorting using position of verts, position of centre of edge, face etc.

Caching and just loading refs to vertex indices for all triangles seems like a good idea, and might greatly speed up loading (currently long pause while generating collision data). Some of this loading time is generating aabb tree - TODO check time spent for generating individual tri data.

Do ngons later, since requires more changes, ideally should be ngons when stored in obj file.

Using special compressed 4vec would be nice, and also seems like good idea for storage format. Currently just storing 3vecs anyway and projecting to 4D on load. Fairly involved task for maybe not much gain - reduced storage/download size, but main problem is RAM use, and just storing uncompressed but deduplicated verts is probably OK. Do later.
