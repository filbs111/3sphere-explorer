quad view is where, for fisheye camera, render 4 rectilinear camera views, then fisheye map each to a quadrant of the screen.

This is done instead of mapping a single rectilinear render view to the screen by fisheye mapping is unable to acheive Field Of View (FOV) beyond 180 degrees, and approaching this maximum either requires a huge resolution in the rectilinear render, or that the central portion of the screen after mapping is undersampled. (magnified so blurry/blocky)

The quad view method allows FOV beyond 180 degrees, and is more efficient for moderate FOV. For very small FOV, the single intermediate view method may still be more efficient, since the premium in number of intermediate pixels to retain output detail is insignificant, and drawing the 4 views requires more draw calls.

task in branch feature/quadview included getting screen space portal rendering (used in guiParams.reflector.mappingType: "screen space", "screen space 2", "vertproj mix") working with quad view.

Shaders used
------------

mapping option                      vert shader     frag shader     vs defines              fs defines
"screen space"      specialCubemap:["cubemap-vs", "cubemap-fs",     ['VERTPROJ','SPECIAL'], ['SPECIAL'],    true],
"screen space 2"    specialCubemap2:["cubemap-vs", "cubemap-fs2",   ['SPECIAL'],            [],             true],
"vertproj mix"      vertprojMix:["cubemap-vs", "cubemap-fs",        ['VERTPROJ','SPECIAL'], ['VPROJ_MIX'],  true],

if "SPECIAL" is defined in vert shader, vScreenSpaceCoord varying is populated (which it is fo all these)
if "VERTPROJ" is defined in vert shader, vertices moved on sphere surface to be denser close to viewer. not currently enabled for screen space 2, but guess unimportant - shouldnt' be responsible for current problem.

In frag shaders, SPECIAL picks different code in specialCubemap, but specialCubemap2 actually hard codes this, so don't require it to be defined here.

Frag shaders have some simplePlanarPortalDir that kicks in when very close, but negligible effect far away.

further work
============

culling
-------

currently frustum culling just turned off for quad view, but adding back in (requires work to figure out equation) would improve performance, particularly because can skip portal drawing. 

Note that the frustum culling for regular fisheye only applies to the rectilinear render, rather than what ends up on screen after fisheye mapping, so this could be tightened slightly.

portal drawing
--------------

Could render portals to fisheye view bypassing the intermediate rectilinear render. The rectilinear render could be mapped on top of this, and portals already drawn still seen by use of transparency. To create the rectilinear cam views, draw blank spheres for portals, with depth write. Downside of this is that envisage wanting to copy the depth info to the fisheye view, which could use the alpha channel, but this technique uses it. Perhaps not a big deal. Benefit of mapping portals direct to fisheye view is avoiding sampling problems. Again, not really a big deal!

issues with cubemap portal cache
--------------------------------

### stereo rendering

currently reusing cubemap realtime renders for portals across both eye views, which helps performance but works poorly if portal is close. could just clear nearby portals from cache on start draw second eye. Even better might be to just render once and use reprojection, but big headache for gimmick feature, unless plan to use more generally eg for rendering of distant portals with infrequent cubemap update etc.

### deduplication of intermediate render
The intermediate render buffer IIRC pre transparency drawing could be shared. In practice there appears to be only a couple of cubemaps per level (because only close enough to a couple of portals at a time), so doubt would gain much perf.

further work also applying to fisheye view generally
====================================================

sampling
--------

sampling from rectilinear render can cause straight edges to be rendered choppily - see lines on the player ship displayed diagonally. perhaps FXAA and similar filters should operate on rectilinear renders.

Having more detail in the rectilinear renders that ends up on screen currently means that textures are undersampled resulting in pixel "swimming" - can see this in brock texture at distance. Ideally the output pixel size should be taken into account, which varies across image, but a simple mipmap level offset might work well enough, at expense of some texture muddiness where not wanted (in centre of screen for single view fisheye, or centre of each quadrant for quad view fisheye)

use of quad views of portal cubemaps
-------------------------------------------

4 renders instead of 6, and can have whatever resolution want. Big upheaval for little benefit. 

use of 2-view
-------------

for drawing to screen, drawing left and right cameras might be more efficient than quad view. Means vertical FOV can't approach 180, but perhaps enough. Unimportant unless perf a problem.

loose ends
----------

vZW shader vars should be tidied up

should revise drag to rotate code - getPointingDirectionFromScreenCoordinate probably still works right for the legacy fisheye view, but likely not quite right for regular fisheye 2 / quadview (which are scaled same). Unimportant since final game won't be drag to rotate.




