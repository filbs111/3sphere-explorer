# ignoring screen position 

Choose a cubemap size dependent on how large the cubemap will be rendered on screen. For simplicity, just make as function of distance from portal. This isn't perfect since portal appears larger for fixed distance from camera when off-centre.

Attempt to calculate size for portal in centre of screen for given distance from camera.

# rough expectation

high value at portal surface, goes to minimum value halfway around world, back to high value on side of world opposite portal.

# calculation of cubemap size on screen

point in sphereical portal radius 1 from which portal cubemap is rendered relates to position viewing portal from by hyperbola. 

$$
a = \frac{b}{2b-1}
$$

This is explained/derived in other notes.

Want to calculate ratio of angles of a patch of portal surface viewed from the cubemap camera and the camera outside the portal. 

Consider 3-sphere world scaled to radius 1. 

Consider coords where z=0. Described herafter (x,y,w)

Consider portal at position (0,0,1), with radius projected onto w=1 of R.

Express camera position using dot(campos, portalpos) = q , p = sqrt(1-q*q)

Camera outside portal at (p,0,q)

For a portal with projected radius (onto w=1) relative to world R

Camera position projected onto w=1 is (p/q,0,1)

Scale this for reflection in unit circle : p/qR

Get reflected position on projected plane w=1 by plugging p/qR into hyperbola equation :

$$
a = \frac{b}{2b-1}
$$

$$
a = \frac{p/qR}{2p/qR-1}
$$

$$
a = \frac{p}{2p-qR}
$$

The size of a patch on portal surface goes as inverse of cros product of portal surface position and camera position.

Portal surface position is normalize(R,0,1)

Call magnitude of this m, ie mm = 1+RR

Camera position is (p,0,q)

cross product = (pR-q) / m.

Reflected position is normalise(s,0,1) 

where 

$$
s = R\frac{p}{2p-qR}
$$

Magnitude of this is n, where nn = root(1+ss)

so cross product = ( sp - q )/mn

take ratio of these cross prods: 

n (pR-q) / ( sp - q )

