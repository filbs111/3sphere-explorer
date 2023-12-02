Browser performace profiler suggests significant CPU time spent on gl. 

13.1%	uniform4fv
9%		uniform3fv

Some ideas to reduce this: 

1) omit calls where would be re-setting existing value.
turns out that uniform values set are retained for a given shader program even if switch to another program and back.
therefore can cache the last value set, and before set next time, check new value vs existing, skip gl call if same. 

2) more shader programs.
since uniforms are retained for a program, perhaps can have multiple programs - eg one for each world, so portal uniforms don't need to be changed when 
drawing worlds seen through portals. unknown what memory overhead is of this.

3) combo uniforms into larger "primitives" - eg 4 1-vecs into a 4-vec. Maybe pointless if moving to uniform buffer objects anyway. Could also combox multiple 4-vecs into a matrix, but maybe too confusing.

4) avoid separate MMatrix, MVMatrix - just have one, calc other by multiplication by VMatrix (which is same for a frame). note measured impact of setting matrices is small relative to 3,4vecs (guess because fewer calls)

5) use drawarrays instanced drawing more - make uniforms into instanced attributes. If still want to use culling (unclear whether has much effect) can do :
	a) pre-prepare culled object lists - eg for cubemap views in a fixed portal, cull any thing not within any frusta for camera inside portal. will cull almost as much as dedicated (for exact camera position). NOTE doing this would speed up existing culling system (but not currently a performance problem)
	b) update arrays containing these per-object attributes.

6) use "uniform buffer object".

plan: 
do 1, see what perf gained. if still significant gains to be had (perhaps will happen if start rendering lots of stuff), look at other #s. 


links that may be relevant
https://stackoverflow.com/questions/38841124/updating-uniform-buffer-data-in-webgl-2
