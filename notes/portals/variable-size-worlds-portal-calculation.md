2026-05 variable size worlds implementation

TODO adjust portal calculations - physics and rendering

for portal sphere with radius r in flat space, currently projecting onto world with radius 1.

when have different size worlds, should ensure that both sides of portal have same surface area - same size before projection won't work for different size worlds.

describe portal size by angular radius. equivalent angular radius is like atan(r)

worlds 1,2 radii R1, R2.

for portal occupying half of world with radius R, with maximum size surface area in that world, has angular radius PI/2, and "true" radius R. For general angular radius a, "true" portal radius is Rsin(a)

Store "true" radius for portal, can easily ensure that it's less than or equal to the world size radius of each world a portal side is in.

True radius T, T<=R1, R2

Angular radius in worlds 1,2 = a1,a2

R1 sin(a1) = R2 sin(a2) =  T 