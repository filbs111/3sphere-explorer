
q is -uVarOne. In index.html/index.js, called q "phi".

intention of fisheye implementation is to have the world view projected onto circle through circle centre. then to view this circle from the inside at some position offset from centre by q. if q=1, stereographic projection. if q=0, undistorted rectilinear render.

the current code that calculates the position on the fisheye view screen for a given direction, used for HUD marker drawing, works like this. However, now suspect that the code that maps the rectilinear render(s) onto the screen do not work like this, but rather take some other interpolation between correct mapping for q=0,1 cases.

Currently works around the projection/unprojection mismatch by only drawing HUD markers near the centre of the screen, where is not a problem.

TODO derive what kind of mapping should be from position on screen (- where red line crosses top line, and object direction indicated by purple line. This is the way to do fisheye distortion which will correctly match the current assumption. 

Basically want u=F(t)

p = us          (1)

s^2 + p^2 = 1       (2)     (pythagoras)

=> u = p / sqrt( 1 - pp)      (3)

(q+s) / p = (q+1) / t   (4)     (similar triangles)

t = (q+1)p / (q+s)

want to get rid of p,s

t = (q+1)p / (q+ p/u)

t= (q+1)/ (q/p + u)

---

p = us

(q+s) / p = (q+1) / t => p= (q+s) t / (q+1)

=>

us = (q+s) t / (q+1)


s = 1 / sqrt(1+uu)

=> 

u(1 / sqrt(1+uu) ) = (q+ (1 / sqrt(1+uu))) t /  (q+1)

square both sides

uu / (1+uu) =  (qq + 2q/sqrt(1+uu) + 1/(1+uu)) tt / (q+1)^2


uu (q+1)^2 = tt (qq(1+uu) + 2q sqrt(1+uu) + 1)
uu qq + 2uuq + uu = 
---
work from u 

u = p/s 

s = root(1-pp)

u = p/root(1-pp)    (1)

---

p = t*(s+q)/(1+q)
  = t*( root(1-pp) + q)/(1+q)

p(1+q)/t = root(1-pp) + q

(p(1+q)/t - q )^2 = 1-p^2

p^2(1+q)^2/t^2 -2pq(1+q)/t + q^2 = 1-p^2

p^2 ( 1+ (1+q)^2/t^2 ) -2pq(1+q)/t = 1 - q^2

let (1+q)/t = M

p^2 ( 1+ M^2 ) - 2pqM = 1 - q^2

p^2 - 2pqM/( 1+ M^2 ) = (1 - q^2)/( 1+ M^2 )

(p - qM/( 1+ M^2 ) )^2 = (1 - q^2)/( 1+ M^2 ) + (qM/( 1+ M^2 ))^2

p - qM/( 1+ M^2 ) = +/-sqrt ( (1 - q^2)/( 1+ M^2 ) + (qM/( 1+ M^2 ))^2 )

p = qM/( 1+ M^2 ) +/- sqrt ... 



sub in for q=0 

p = +/- sqrt( 1/ (1+M^2) )

where M = 1/t

p = sqrt( 1/ (1+1/tt) )
    = sqrt( tt/ (tt+1) ) 
    = t/sqrt(1+tt)


u = p/root(1-pp)

pp = tt/(1+tt)


u  = (t/sqrt(1+tt) )  / sqrt(1- tt/(1+tt))


sqrt(1- tt/(1+tt)) = ? 

 sqrt(1+tt-tt)/sqrt(1+tt) = 1/sqrt(1+tt)

=?
u = (t/sqrt(1+tt) )  * sqrt(1+tt) = t !
as expected.


try subbing in q=1

p = qM/( 1+ M^2 ) +/- sqrt ( (1 - q^2)/( 1+ M^2 ) + (qM/( 1+ M^2 ))^2 )

p = M/(1+MM) + sqrt ( (M/(1+MM)^2)

  = M/(1+MM) + M/(1+MM)

  = 2M/(1+MM)


  (1+q)/t = M , q=1

  2/t = M

=>

p= (4/t)/ ( 1+ 4/tt)
 = 4t / (tt + 4)


sub into 

u = p/root(1-pp) 


u = (4t / (tt + 4)) / root (1 - (4t / (tt + 4)^2)


... suspect will come out as stereographic proj formula
