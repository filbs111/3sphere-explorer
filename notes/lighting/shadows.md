# shadows

would like both sharpish shadows from point/directional lights (for 4d system basically equivalent), and very soft shadows.

## very soft shadows

shadows for soft lighting - simplest is shadow cast from object onto neighbouring objects in presence of an isotropic light. here, correct amount of shadow considers the amount of hemisphere as viewed from the surface the shadow is cast onto, weighted by the cosine of the angle in the sky away from straight up - the shadow catching surface normal. This is the area of the view projected onto the hemisphere as viewed from above. This construction is described in portal-lights.md.

This can be calculated analytically, which may be practical to perform at runtime for simple convex objects. From seeing a diagram, think this is what "the last of us" game does for "contact shadows". TODO describe calculation.

Something reasonable might be precalculated and stored in a volumetric texture, similar to "gradient light" used in this project (TODO reference existing docs ). Simplest approach is just to consider unweighted fraction of sky occluded by the object (and optionally take into account its darkness in different colour channels). Or could assume that objects that the shadow will be cast onto are likely to have a surface normal facing the object, and calculate weighted hemi coverage for this. 

Could use gradient light approach, and do for x,y,z gradient, in addition to iso term. Look up the 4d tex val for 3d position, and weight terms using the receiver surface normal.

A more advanced scheme could also consider the level lighting at the point of the shadow caster. Therefore could, for example, handle shadow projection for player object as pass through portal. Or look up the gradient light from another baked GI level map (or for nearby mobile large objects). Expect requires 16-vec 3d field, maybe not worth it! Perhaps choose to consider the grad light at the caster position OR the surface normal of the receiving surface and keep to just 4-vec 3d field. Or perhaps can use analytic convex simple object scheme only for small mobile objects that pass through portals (like player), and use baked version for larger, more complex, less mobile objects. Perhaps 16-vec field is fine for baking textures onto uv maps on level generation/load, but not runtime...

rendering of these shadows might be good fit for deferred - can render using an object around shadow caster so don't do tex lookup for all pixels of possible receivers.

## sharper shadows

shadow mapping. PCSS? variance soft shadows etc? prerendering? of the shadow depth maps, or of baked textures on level objects? deferred?


## calculations

### the area of a triangle on a sphere

To get fraction of sphere blocked by a triangle in view of a camera.

see tri-coverage-test.js

### area of triangle on sphere weighted by value of axis (eg x)


see diagram

tri and its opposite each
         have area a+b+c-PI.
6 other tris.
        2 with area PI -a +b -c 
        2 with area PI +a -b -c
        2 with area PI -a -b +c

doubt this helps...



consider triangle pqr where p,q,r are unit vectors on the sphere. 
for each point s = p + (q-p)u + (r-p)v
what find the coverage of the sky for a patch of dudv, and integrate over the triangle

check can reproduce simple coverage result.

then do weighted by |s| . (1,0,0), etc for shadow from gradient skylight

simple result: 

coverage = 

$$\int_{v=0}^1 \int_{u=0}^{1-v} f(u,v) du dv$$

where

f(u,v) = coverage of patch * impact of patch (0 in simple version, s.(1,0,0)...)


take patch unprojected area (flat triangle), divide by distance from origin squared, and multiply by dot of patch normal and direction from origin, (vector from origin, normalised).

unprojected area = du|q-p| * dv |r-p| * |cross(q-p, r-p)/(|q-p|*|r-p|)| = |cross(q-p, r-p)| dudv

t = position on flat triangle =  p + u(q-p) + v (r-p) 

distance from origin squared = t.t

flat patch normal =  cross(q-p, r-p) / |cross(q-p, r-p)| 

and direction from origin = t / |t|

dot of flat patch normal with direction from origin = (cross(q-p, r-p) . t ) / (|cross(q-p, r-p)|  * |t|) 

put this all together: 

|cross(q-p, r-p)| dudv  *   (1/ t.t ) *  (cross(q-p, r-p) . t ) / (|cross(q-p, r-p)|  * |t|) 

cancel out terms ...

$$ |t|^{-3} ( ( (\vec{q-p}) \times (\vec{r-p}) ) \cdot t ) dudv $$

here q-p, r-p are just constants. let

$$ k = (\vec{q-p}) \times (\vec{r-p}) $$

$$ |t|^{-3} ( k \cdot t ) dudv $$

now expand t and integrate


$$ |p + u(q-p) + v (r-p) |^{-3} ( k \cdot (p + u(q-p) + v (r-p) ) ) dudv $$

$$\int_{v=0}^1 \int_{u=0}^{1-v} |t|^{-3} ( k \cdot t ) du dv$$


This seems a little complicated, and not confident is right! it is not important to do this for next steps, since want to use a volume texture lookup table. Existing result for iso shading can be used to confirm volume texture method produces the same result. 

For "correct" results for non-convex object, volume texture baking could involve rendering image from each point in volume and summing pixels. If choose this method, unnecessary to solve this integral. 

However, if can accept incorrect results for non-convex objects, might opt to use analytic integral method for baking for speed, and run bake on end user's machine at page/level load time. In that case, each triangle (or fixed size group of tris?) could be drawn to the volume texture as a texture filling quad. In this case, would want analytic solution (or decent approximation)

## plan /TODOs 

implement shader for, say, landscape, to so sky coverage calc for an explicit polygon list eg 6 tris for square base pyramid shaped spaceship.

bake volume texture containing this info, check produces consistent result.

bake for larger objects eg teapots, see if looks decent. 

baker that renders cubemap for each point and sums pixels, or that uses raytracing (maybe tri bvh is sensible)

deferred lighting so can render large number of shadows using bounding objects with reasonable performance.





