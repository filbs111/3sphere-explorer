//demo projection of fisheye camera, check reversible

//TODO also find what implemented in game currently - simple interpolation between rectilinear, stereographic cases, which appears 
// to be only approximation of correct mapping.
// Find the reverse mapping for this, use to make HUD mapping consistent.

//TODO express view direction in game using unit vector, not u, because also interested in directions in rear hemisphere

var canvas = document.getElementById("mycanvas");
var ctx = canvas.getContext("2d");
ctx.font = "30px Arial";
//draw a circle.

var scale = 300;
var circleCentre = [2,2];
var circleRad = 1;

let rangesliderUAng = document.getElementById("sliderRangeUAng");
let outputUAng = document.getElementById("showValUAng");
outputUAng.innerHTML = rangesliderUAng.value;
let rangesliderPhi = document.getElementById("sliderRangePhi");
let outputPhi = document.getElementById("showValPhi");
outputPhi.innerHTML = rangesliderPhi.value;

var uAng = parseFloat(rangesliderUAng.value);
var phi = parseFloat(rangesliderPhi.value);
renderCanvas(uAng,phi);

rangesliderUAng.oninput = function () {
    outputUAng.innerHTML = this.value;
    uAng = parseFloat(this.value);
    renderCanvas(uAng,phi);
}

rangesliderPhi.oninput = function () {
    outputPhi.innerHTML = this.value;
    phi = parseFloat(this.value);
    renderCanvas(uAng,phi);
}


function renderCanvas(uAng, phi){

    var p = Math.sin(uAng);
    var s = Math.cos(uAng);
    var u = p/s;

    //u is position on initial rectilinear render. (1,u) represents position of thing in world

    //phi is projection point. phi=0 for rectilinear (maps input to output), phi=1 for stereographic projection
        // -uVarOne is intended to represent this in current code

    ctx.clearRect(0,0,canvas.width, canvas.height);


    ctx.beginPath();
    ctx.arc(circleCentre[0]*scale, circleCentre[1]*scale, circleRad*scale, 0, 2 * Math.PI);
    ctx.stroke(); 

    //top line
    drawLineScaled([0,1],[4,1]);

    //top to bottom
    drawLineScaled([2,0],[2,4]);
   
    //centre of circle
    drawMarker([2,2], 0.02);

    //moved down by phi
    drawMarker([2,2+phi], 0.02);

    drawLineScaled([2,2], [2+p,2-s]);

    //this crosses circle at (u,1) scaled by 1/sqry(1+usq)
    drawMarker([2+p,2-s], 0.02);

    //horizontal line to this point
    drawLineScaled([2,2-s], [2+p,2-s]);
    drawAnnotation([2 + p/2, 2-s],"p");

    drawAnnotation([2,2+phi/2],"φ");

    //getting t from u is relatively straightforward
    var t = p * (1 + phi)/(s+phi);
    drawLineScaled([2,2+phi], [2+t,1]);

    //calculation of u from t
    var dirFromTResult = dirVecFromT(t);
    var uAngFromT = Math.atan2(dirFromTResult[1],dirFromTResult[0]);
        //works unless direction too far back (so t does not project onto top line)
    
    var dirFromStereographic = dirVecFromTStereographic(t, phi);
    var uAngFromTStereographic = Math.atan2(dirFromStereographic[1],dirFromStereographic[0]);

    var uFromTResult = uFromT(t);

    //this is reasonable approximation for small uAng. blows up close to 90 deg. perhaps what's used in game
    var approxUFromT2 = uFromTApprox(t,phi);
    var discrepencyPercent2= 100*(approxUFromT2-uFromTResult)/uFromTResult
    
    var reversedApprox = tFromUApproxReverse(approxUFromT2, phi);

    console.log({
        uAng,
        t,
        uAngFromT,
        uAngFromTStereographic,
        uFromTResult,
        approxUFromT2,
        discrepencyPercent2,
        reversedApprox
    });
}

function drawLineScaled(from, to){
    ctx.beginPath();
    ctx.moveTo(from[0]*scale,from[1]*scale);
    ctx.lineTo(to[0]*scale,to[1]*scale);
    ctx.stroke();
}

function drawMarker(pos, size){
    ctx.beginPath();
    ctx.arc(pos[0]*scale, pos[1]*scale, size*scale, 0, 2 * Math.PI);
    ctx.fill(); 
}

function drawAnnotation(pos, text){
    ctx.fillText(text,pos[0]*scale,pos[1]*scale);
}

function uFromT(t){
    var dirVec = dirVecFromT(t);
    var u = dirVec[1]/dirVec[0];

    return u;
}

function dirVecFromT(t){
    //from notes.
    var M = (1+phi)/t;
    var onePlusMSq = 1 + M*M;
    var phiMOverOnePlusMSq = phi*M/onePlusMSq;

    var p = phiMOverOnePlusMSq + Math.sqrt( (1-phi*phi)/onePlusMSq + phiMOverOnePlusMSq*phiMOverOnePlusMSq);
    var s = Math.sqrt(1-p*p);   //but how to do for reverse direction with -s?

        //inelegant test. TODO better way to calculate s?
    var critical_t = 1+ 1/phi;
    if (t>critical_t){s=-s}

    return [s,p];
}

function uFromTStereographic(t){ //phi=1
    // var M = 2/t;
    // var onePlusMSq = 1 + M*M;
    // var phiMOverOnePlusMSq = M/onePlusMSq;
    // var p = 2*phiMOverOnePlusMSq;
    // var s = Math.sqrt(1-p*p);
    // var u = p/s;
    // return u;

    //multiply top and bottom (p,s) by 1+M^2
    //p/s =   2phiM / sqrt( (1+M^2)^2 - 4*phi*phi*M*M) ) 
    // and phi=1
    //p/s = 2M / sqrt ( 1 +2M^2+ M^4 -4M^2 ) = 2M/sqrt(1-2M^2+M^4) = 2M/(MM-1)
    //return 2*M/(M*M-1);

    //console.log([u, 2*M/(M*M-1), 4*t/(4-t*t)]);

    //express just with t.
    // 2*M/(M*M-1)   = (4/t) / (4/tt -1)  = 4t/(4-tt)
    return 4*t/(4-t*t);
}

function dirVecFromTStereographic(t, phi){    
    // var M = 2/t;
    // var onePlusMSq = 1 + M*M;
    // var phiMOverOnePlusMSq = M/onePlusMSq;
    // var p = 2*phiMOverOnePlusMSq;
    // var s = Math.sqrt(1-p*p);

    //express in t

    //var phiMOverOnePlusMSq = (2/t)/(1 + 4/tt)    = 2t / (tt+4)
    var p = 4*t / (t*t + 4);
    var s = Math.sqrt(1-p*p);

    if (t>2){
        s=-s;
    }

    return [s,p];
}


function uFromTApprox(t, phi){
    return 4*t/(4-phi*t*t);
}


function tFromUApproxReverse(u, phi){
    // u = 4*t/(4-phi*t*t)
    //  u4-uphi*t*t = 4t
    // 4/phi - tt = 4t/(uphi)
    // tt + 4t/(uphi) = 4/phi
    // ( t + 2/(uphi) )^2  = (2/(uphi))^2 + 4/phi
    //   t + 2/(uphi)      = (2/uphi) ( sqrt( 1 + (4/phi) (uphi/2)^2 )
    // t = 2/(uphi) ( sqrt( 1 + u^2 phi) )  -1 )

    var twoOverUPhi = 2/(u*phi);
    return twoOverUPhi * ( Math.sqrt(1+ u*u*phi) -1);
}
//NOTE t is output position on screen, u is like direction in world.
// how to formulate this to include directions in world behind camera?