dust motes, speed lines etc can be used to give a sense of speed, and to show which direction travelling in.

currently showing a marker on screen in direction of travel, which is useful for lining spaceship up to fly to/through/around some obstacle. If environmental effects can indicate the direction, this might make the meaning of the HUD marker more obvious, or allow for it to be removed entirely. 

Idea is to show the movement relative to the player/camera of points of the atmosphere near to the player position/camera, static in the frame of the terrain/air. 

## What to draw?

These might be as simple points drawn with no motion blur. Referred to elsewhere as "dust motes". This is done in the game Zarch AKA Virus (when the player travels very high and loses sight of the ground). Here the distance of points from the camera should be such that movement between frames is not too large on screen.

Note that on a modern screen, displaying fast moving particles can be unpleasant due to frames being displayed for extended period, relative to CRT. Might be a reasonable effect though. 

Expect that the sense of speed, and of a vanishing point, might be improved by temporal blurring. This might be acheived by drawing lengthened objects, drawing multiple copies for different times, drawing many points using a texture. 

Might do something fancy in a volume shader! 

## Drawing simple dust motes

### Solid geometry particles

Just render say cubes or octahedra. 

Just render lots of small objects. Or objects containing large number of primitives. For object with 16 bit indices (65536 verts max), could have 20x20x20 8 verts cubes. Or 22x22x22 8=6 vert octohedra. combine this with instancing for performance, and cull objects that are not near to camera.

Maybe easy method - when move player/camera, any objects that fall outside sphere surrounding player/camera can be move to opposite position (like if moved through a portal surounding camera).

To avoid need to cull, could use a hack method - use a "treadmill" style object / set of objects around the camera, or player object, but further description will assume camera. This object would be positioned at the camera, and stays in place relative to the world when the camera rotates, and its "contents" would move in the frame of the player as the player moves. 

Could use a cube containing points. As the points scroll outside the cube, they come back in the opposite side. Could be done by modding the position. To do this with many points in a cube, could do by making a single point or cluster of points and object, and instanced render, where some scroll position is "global" uniform, and cube offset is a per instance uniform. subtract these in shader, mod to within cube, add mesh vertex position. 

This is hacky, not strictly correct for curved space, and a bit complex, but expect to work ok!

Problem - how to make dependent on atmos thickness? should it be? constantly fade out current cube and replace with another, make latest cube be scaled appropriate for atmos density? ...

### Variable density

Idea: array of per instance position data is larger than range drawn for sparse atmos.
For sparse atmos, cycle through this range. when drawing, be aware of current time, so can fade in/out partices entering/exiting the window. Means can have sparse atmos eg few particles visible at any one time, but without obvious repetition.

### Streaks, Billboards etc

TODO describe

## Volume rendering

### Fourier transform

Idea - represent volume as fourier series, with weaker terms discarded. Calculate the integral of a line through volume analytically, summing contribution from fourier components in shader. Could avoid texture sampling by just hard coding components into shader code. This might make a decent cloud effect. Perhaps not great for dust motes.