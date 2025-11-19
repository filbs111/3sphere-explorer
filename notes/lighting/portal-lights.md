At time of writing, portal lighting is buggy, especially when portal is darker than world, which is treated as a negative light.

Some comments in shaders eg "//this is just bodged/guessed to achieve correct behaviour at/across portal. TODO check/correct!"

# Diffuse light

Want portal light to act like a regular point light when distant, but at surface/crossing portal, should act like a hemispherical skylight.

Basically lighting is from a sphere with emmissive surface. 4d doesn't matter - just the view from the surface. 

Have thought about this, will describe roughly here, confident correct enough... 

Portal light and sky light. Separate into isotropic light from current world - later might improve this to treat this as eg hemispherical skylight near to ground etc. Considering a simplified view from the surface where just the world/fog colour can be seen, and flat coloured portals. Each portal's light contribution is of colour that is the difference between its colour (ie the colour of the world beyond the portal), and the current world (that the receiving surface is in).  No consideration of casting a light through another portal. (ie the surface seeing a portal within a portal). Also ignore impact of one portal blocking another's light, though this could result in net negative light being cast for portals into two dark worlds next door to eachother.

Consider a light of angular radius alpha, centred at angle theta from straight above the surface. If we consider the sphere/hemisphere at distance 1 from the surface point, and project the view onto this surface, AFAICT the diffuse contribution from here is like the area of the disc of light on this hemisphere projected along surface normal onto the surface plane. ie radius sin(theta), so fraction of circle viewed in surface normal direction is (sin(theta))^2. (total circle area = PI, area of disc viewed from above = PI*(sin(theta)^2)).

Similarly, for portal with centre at angle phi from directly above the surface, 


However, when the disc of light viewed from the surface is not entirely above the horizon, this calculation is incorect, because it counts a negative contribution of light from below the horizon. However, this contibution should be ignored.

Full calculation appears to be quite complicated. Consider 2d case instead. Suspect that results same for phi < PI/2 - theta (disc completely above horizon), phi > PI/2 + theta (disc completely below horizon), and for case on surface of lit object where theta = PI/2. Results for partly above, below horizon - don't know whether will match, but should be continuous, expect results plausible.

Contribution of lighting (fraction of total hemispere projected area) 

Extent of simple 2d case (TODO explain by diagram)

sin(min (PI/2, phi+theta)) - sin( min (PI/2, phi-theta))   (1)

width of this area when viewed from above = 2*sin(theta)

to get total area divided by whole circle area, for circle of radius 1, multiply these terms, divide by 4.

( sin(min (PI/2, phi+theta) - sin( min (PI/2, phi-theta)) ) ) * sin(theta) /2

seems like could use compound angle to simplify this but min, max complicates.

check this reduces to simple dot product lighting when theta = PI/2

sin(min (PI/2, phi+PI/2)) - sin( min (PI/2, phi-PI/2))

since 0<=phi<=PI, (1) becomes

sin(phi+PI/2) - sin(phi-PI/2)

use compound angle 

sin(A + B) = sinAcosB + cosAsinB

=> ( sin(phi)cos(PI/2) - cos(phi)sin(PI/2) )  - ( sin(phi)cos(-PI/2) - cos(phi)sin(-PI/2) )

=> - cos(phi)sin(PI/2) + cos(phi)sin(-PI/2) = 2cos(phi)

combine with width term 2sin(PI/2) = 2. divide by 4, result is cos(phi)

in summary, for diffuse use 

( sin(min (PI/2, phi+theta) - sin( min (PI/2, phi-theta)) ) ) * sin(theta) /2   (2)

ie total lighting = background colour * difference colour* equation 2



# How to code this  - what are current shader inputs, how is colour scaled etc.

code from current shader:

float posCosDiff = dot(normalize(transformedCoord),uReflectorPos) - uReflectorCos;

vPortalLightPosTangentSpace, posCosDiff
 
Can calculate the size of portal (reflector) circle when seen from surface from surface space (using vPortalLightPosTangentSpace) or transformed space (in frame of camera). Expect get same result. Perhaps one is more efficient given other calcs required. Seems that transformed surface point and portal position (in frame of camera), is normalise(transformedCoord) and uReflectorPos. The size of portal can get by projecting the portal onto the 3d plane that touches the 3-sphere at normalise(transformedCoord). 

TODO transcribe paper notes, diagrams.

For a portal/reflector of angular size in world alpha, at angular distance from the surface/viewer gamma, apparent angular size theta related by equation 3:

tan(theta) = tan(alpha)/sqrt(sin^2gamma - tan^2alpha cos^2 gamma) (3)

Here alpha = acos(uReflectorCos), so tan(alpha) = sqrt(1-uReflectorCos^2)/uReflectorCos = sqrt(uReflectorCos^-2 -1)

gamma is angle between normalize(transformedCoord) and uReflectorPos

Should also take into account visibility factor - is blocked from view by fog or landscape. perhaps a per vertex calc (as is done currently for fog), or per object calculation for small objects. 

For the angle of elevation above the surface, phi, this is hopefully asin(vPortalLightPosTangentSpace.w)

This should give enough info to calculate diffuse lighting.

# Specular

Want specular lighting too. "PBR" usually takes into account that specular becomes stronger when view at glancing angle, but don't bother yet. TODO update existing specular code with portal size as viewed from surface, falloff, consistent with used for specular.

