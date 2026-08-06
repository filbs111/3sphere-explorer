Began replacing int23 depth buffer with float32 but gave up/shelved work.

Thought float32 a good fit if symmetric about 0 = "equator= halfway to opposite side of world from camera, and could then use linear depth (not custom) thereby benefiting from early z testing.

However, appears depth vals are clamped from 0 to 1, wasting 2 bits ie 3/4 of possible values, and throwing away symmetry. Still maybe possible to use float depth in clever way to avoid custom depth and avoid z-fighting, but less neat, trivial, so give up for now (performance isn't a huge problem, and if move to deferred rendering, early z test is less important)

In code committed with this note, seems that by default, without custom depth, 0 is mapped to 0.5 somehow. 