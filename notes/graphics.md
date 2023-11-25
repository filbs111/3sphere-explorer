## gradient light

In current version of this, 4 channel texture contains the result of baking diffusive surface colour ( or incident light, by dividing by albedo)for 4 light distributions: isotropic light, and 3 gradient lights along each axis (x,y,z) - eg a light that runs from 100% at north pole, through 50% at equator, to 0% at south pole. These textures can be created using Blender Cycles. At runtime, the lighting from a gradient light from one rgb colour to another, along an aribitrary direction vector, can be calculated as a sum of these components. The radiosity calculation is for some surface albedo, and the result for zero albedo is trivial (zero), so the result for primary colours. Eg for albedo 0.4, can calculate result for rgb albedo (0.4,0.4,0.4), (0.4,0,0), ...

This works perfectly where object is en environment with a linear gradient skylight, where r,g,b can have different gradient vectors. For other lighting, a best approximation can be found - eg for a 2-tone skybox (eg blue sky above, green below), or a sky with a circular sun light in. 

Possible improvements.

* Instead of encoding linear result of gradient light from 0%-100% creating a light value from 0 to 1, encode result of light from -100% to 100%, stored nonlinearly, by mapping -1 to 1 as 0 to 1, so can dedicate more precision to darker parts (like sRGB does).

* Bake extra terms - like x^2 term.
	
	Currently - x,y,z,1

	could do x,y,z, x^2, y^2, z^2, xy, yz, xx. Note 1 available automatically since 1=x^2+y^2+z^2
 
	then could calcualte quadratic gradient light in arbitrary direction, allowing better approximation of a sun light.
	
* Account for some non diffuse light - convolve radiosity channels by some gradient sampling distribution. 

* Tangent space maps, perhaps for detail texture, that can be multiplied by macro light distribution.

* Generate 3D distributions of gradient light, so object can move about within envirionment and look up lighting.

## Efficient portal and fisheye rendering.

Currently, the rendering of fisheye and portals is quite inefficient, resulting on low framerate.

###Fisheye

For fisheye view, a large surface is rendered to, larger than the final screen. 

#### 1. Render to more rectilinear projections.

4 panels, or 5-6 using cubemap. Done this in test project, works OK.

#### 2. render directly to fisheye camera. 

Problem that triangle rasterisation is with straight lines. Can work with sufficient tesselation.

#### 3. deferred rendering

Initial rasterisation is in rectilinear projection view(s) (can combine with #1), but more rendering tasks are deferred to after the fisheye/portal mapping. Standard rendering techniques Deferred Rendering, Deferred Lighting are relevant.

Render to g-buffers (depth, normal, specular power(?), albedo), the same size as intermediate screen, then either map those to distorted views, and use to sample in deferred rendering, OR sample from the rectilinear projections directly in deferred rendering step. Guess should pre-distort stuff needed for lighting calc, since will be read from for each light, but albedo/diffuse will only be sampled from once, so pointless to pre-distort. (though might reduce cost of depth of field)

Some choice to make whether to accumulate total light, or accumulate diffuse and specular separately, then later look up material properties. Look up "deferred lighting"/"light pre-pass - could do that either with 2 renders (would mean less g-buffer space required, later pass could benefit from z-buffer discard), or g-buffers with albedo, specular texture. 

When doing lighting passes, can only update pixels within range of light. 

When adding light contributions, let v = e^-x where x = light. therefore v1v2 = e^-x1.e^-x2 = e^-(x1+x2) 
ie can sum lights by multiplying terms, which is useful because avoids saturation problem. maybe still want to choose how best to use range, and could make whatever adjustment already (takesrc, dst, apply custom logic), but allows use of standard blending modes.

When accumulating light, don't look at albedo - multiply by that later in single go.

#### 4. mixing deferred, direct

If some items are sufficiently well tesselated, and others not, might do some triangle drawing before, and some after distortion - for example, explosions, other transparencies might be moved to after - current explosions are spheres approximated by triangulation anyway, sea is well tesselated, and a curved surface approximated by polys.

The spherical portals are approximated anyway (curved surfaces), so should be drawn to final view (rather than rednered to rectilinear projection then distorted), to reduce pixels drawn, better sampling.

#### 5. z-buffer/reprojection techniques

For static scenes (applies to whole scene at fixed time - eg stereo rendering, or different times for unmoving scene), might use this, or when approximately true (similar times), or with some extension to handle moving objects, using velocity map, or two passes for 2 parts of scene (eg multiple rotating duocylinders))

Main use case proposed is to render fewer cubemaps.

ray step across z-buffer, to reproject view from position offset from cubemap centre.

could render cubemaps from centre, create mips, no need to re-render cubemaps.

or, for portals visible from other portals, render from position ideal for view from within the other portal, will be nearly correct for any position within portal, minimum (or no) reprojection required. Could generate simple texture (not cubemap).

or, for eg stereo rendering, render every frame, use ray stepping for stereo views.

For terrain, can represent as simple wrapping texture with heightmap (or just assume is constant height), instead of cubemap. 

#### 6. simple portal rendering, camera always from centre of portal

variation of 5 but no reprojection. Can represent scene as cubemap view from portal centre, or for terrain, as simple wrapping texture.

Get the view direction right, so for a portal much smaller than height above terrain, the terrain looks about right. Also, the point of view being at centre is correct when portal on oppoiste side of world (where it looks big). Therefore hope to get away with this simple technique beyond some distance from user. Won't work well for objects through portal close to the portal. 

Might be good for a combined technique - render terrain using this, render other objects (eg near portal) by some other method (eg dynamic cubemap)

Benefit that can render with mipmaps since just creating views at start (not continuously)

#### 6a

special case for portals viewed through portals - possible positions are for viewing from a hemisphere of the intermediate portal. Render for some point there.

#### 7. infrequently updated cubemaps

Basically reuse last cubemap if camera position is sufficiently close to that desired. Optionally include reprojection (see 5.)

#### 8. draw less stuff, draw stuff more efficiently.

Use LOD system to draw less terrain.

Pre-prepare culled terrain - what sections can possibly be seen for cubemap frustum from any point within portal.

Exclude small objects less than a pixel.

Try VAO (vertex attribute object) to do fewer gl calls.

#### 9. 4D? baked view

for some point on on portal surface, in some direction, what colour is seen. Might get something like 32^4 = 1024x1024. Perhaps some clever sceme like plenoptic camera with more effective resolution at some distance.

### selection for initial work

try #6 fixed centre cubemap. should be simple - modify existing code, but render from centre point. include some toggle to check results are ok, if ok, use for portals within some range, given the portal size.

Try some #7, including VAO.

## Texture size

can use texture offset to sample from appropriate tex sizes ? 

use texture compression to help memory caching?