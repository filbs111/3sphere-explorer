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

# working out scale in game

because have tested game to work currently with scale values from ~ 0.25 to 1, define some scale S so real size of world size 1 is S, world size 0.25 is 0.25S etc.

For example, s = 10km would give worlds from 2.5 km to 10km

How are objects moved in game? IIRC xyzmove4mat is in radians, and for full loop of world would need to rotate by 2PI radians.

Currently, drawing 8 cube frames at scale 1 to fill world with 8-cell. 

Drawing a cube frame at player position when enable debug playerDustMotesFrames with scale 0.0005 (when world size 1), which approximately encompasses player. say this cube represents 10 metres ( from -5m to 5m). Therefore suspect radius of this world size 1 is 5m/0.0005 = 10000m - 10km. (Or could consider this cube to be 20m so world size 20km)

when move player, do so by

            var moveAmount = subTimeStep * moveSpeed;
            var toMovePlayer = scalarvectorprod(moveAmount,playerVelVec);

where currently 

	var moveSpeed=0.000075;

therefore assuming timestep is in millis, move by 

playerVelVec * 0.000075 every millisecond, so playerVelVec * 0.075 every second.

if speed = |playerVelVec|

if radius of world is 10km, then speed in real units is speed * (10_000 * 0.075) m/s = speed * 750m/s


# sanity testing

360kph = 100 m/s - todo check covers 100m in 1s.

acceleration. s = ut + .5 a t^2 

if 1G = 9.81 m/s^2 acc, covers 100m in ...

100 = .5 9.81 t^2

20.4 = t^2 

ie covers 100m in root 20.4 ~ 4.5 seconds..