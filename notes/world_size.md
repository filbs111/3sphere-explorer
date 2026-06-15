for a 3sphere world of radius 1

full loop of world $2\pi$

for a ridge/duocylinder separating world

xx + yy = zz + ww

for example, in middle of world

xx + yy = zz + ww = 0.5

diagonal on this surface (AFAIK also for cylinders above, below this too) is a full loop of world, ie of length $2\pi$

The dimensions of unwrapped duocylinder surface splitting world in two is then $\sqrt 2\pi$

the height of line x=y=0 above this surface is $\pi/4$ : an eighth of a loop of world.

other levels like 

xx + yy = cos(theta)

ww + zz = sin(theta)

theta = $\pi/2$ at "top" of world x=y=0, theta = 0 at "bottom" of world w=z=0, theta = $\pi/4$ at duocylinder surface separating world in 2

centripetal acceleration/gravity, IIRC proportional to $\sin(2\theta)$

centripetal acc/gravity for flat space goes like $r\omega^2$

suppose then that gravity goes like $\omega^2\sin(2\theta)/2$

which gives expected behaviour for small $\omega$.

for duocylinder evently dividing world, $\sin(2\theta) = \sin(\pi/2) = 1$

so gravity $\omega^2/2$

as scale whole 3-sphere by factor R, effectively items in the world are scaled relative to world by factor $1/R$, so gravity in scaled frame scales as R.

For 1G centripetal artificial gravity for duocylinder surface splitting world in two, for a range of 3-sphere sizes, calculate spin rates, surface velocity, surface dimensions.

calculation: 

R = 3-sphere size

circuit = $2\pi R$

square edge = $ \sqrt 2 \pi R$

$ 1G = 9.81ms^{-2} = R \omega^2/2$

$\omega = \sqrt{19.62m / R} s^{-1}$

freq = $ \frac{\omega}{2\pi}$

RPM = 60 * freq

spin speed = square edge * freq

basically omega for 1g goes as 1/ root of dimensions, spin speed goes as root of dimensions.

| R | circuit | sq edge | $\omega$ | freq ($s^{-1}$)| RPM | spin speed | 1 rev |
|---|---------|---------|----------|----------------|-----|------------| ----------------|
| 1km| 6.28 km| 4.44km  | 0.14     | 0.0223         | 1.338 | 99.0m/s = 221.5mph | 45s |
| 10km| 62.8km| 44.4km  | 0.0443   | 0.00704        | 0.422 | 313m/s = 700.1mph | 142s |
| 100km | 628km | 444km | 0.014    | 0.00223        | 0.1338| 999m/s = 2215mph | 7.5 mins |
| 1000km | 6280km | 4440km | 0.00443 | 0.000704     | 0.0422| 3130m/s = 7001mph| 24 mins |
| 10000km | 62800km | 44400km | 0.0014 | 0.000223   | 0.01338| 9990m/s = 22150mph | 75 mins |

travelling along surface with or against spin affects gravity. since gravity experienced goes with square of spin speed, moving back at ~30% of spin speed reduces gravity experienced by half, which is appreciable.

last in table is comparable to earth, though has more surface area, spin vel bit less than earth orbital speed! 

TODO put real units in game - what kind of speeds feel right, and therefore what spin speed is acceptable (significantly greater than this speed). Include some objects with known scales, check can drop objects known height and fall as expected...