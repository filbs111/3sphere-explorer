//something to generate voxel mesh.
//intial implementation will be voxels wrapped onto duocylinder. 1st implementation - keep axis aligned, wrap in shader. alternative would require more complex texture projection in shader - though this is how do regular grid terrain currently.
//TODO separate out SDF for collision detection calls.

//var voxlog = console.log;	//if enable logging, be sure to stop calling test2VoxABC in the main game loop!
var voxlog = function(log){};

var voxCollisionFunction; //something that can be used for collision detection. 
						  //for consistency with basic 2d terrain stuff, for input 4vector, provide: penetration depth, normal vector.
						  //maybe want simple version that just returns whether collided. ( eg for bullet collisions)
						  
						  //suppose with normal vector in two duocylinder "surface" directions and radial. should be careful to get conversion right - basic assumptions might get correct close to halfway duocylinder ( dividing 3sphere in two exactly), but may go wrong away from this.
						  //maybe better to have normal direction returned as 4vec.
var voxClosestPoint;						  
var voxABCFor4vec;

function testVoxABC(){	//WORKS!!
	var inputVec = playerCamera.slice(12);
	voxlog(inputVec);
	
	var abc = voxABCFor4vec(inputVec);
	voxlog("abc");
	voxlog(abc);
	
	var result = get4vecForABCDCCoords(abc.a,abc.b,abc.c);
	voxlog(result);
	
	var matresult = getMatForABCDCCoords(abc.a,abc.b,abc.c);
	voxlog(matresult.slice(12));
}
function test2VoxABC(){
	var inputVec = playerCamera.slice(12);
	voxlog(inputVec);
	var voxResult = voxClosestPoint(inputVec);
	var abcResult = voxResult.abc;
	voxlog("abcResult:");
	voxlog(abcResult);
	
	voxCollisionCentralLevel = voxResult.centralLevel;
	
	var matResult = getMatForABCDCCoords(abcResult.a,abcResult.b,abcResult.c);
	
	voxlog(matResult.slice(12));
	
	mat4.set(matResult, closestPointTestMat);
}


function getMatForABCDCCoords(a,b,c){
	voxlog("getMatForABCDCCoords input:");
	voxlog({a:a,b:b,c:c});
	
	//don't neg a because though voxCollisionFunction, (terrainGetHeightFor4VecPos, getHeightAboveTerrainFor4VecPos) use different sign, latter return negates it again!
	a = a;
	//see terrainGetHeightFor4VecPos , absent in  getHeightAboveTerrainFor4VecPos ?!
	b = Math.PI*1.5 -b;
	
	//switch a, b because drawPreppedBufferOnDuocylinder call switches them
	var tmp =a;
	a=b;
	b=tmp;
	
	//see moveToDuocylinderAB (called from drawPreppedBufferOnDuocylinder without further shenanigans)

	mat4.identity(tmpRelativeMatForVox);
	xyzrotate4mat(tmpRelativeMatForVox, [0,0,a]);
	zmove4mat(tmpRelativeMatForVox, b);
	xmove4mat(tmpRelativeMatForVox, Math.PI/4 - c );	//or ymove - should check what way up want models to be. PI/4 is onto surface of duocylinder
			//even this doesn't work!! suspect maybe something to do with mvMatrix
	
	voxlog("getMatForABCDCCoords");
	voxlog(tmpRelativeMatForVox.slice(12));
			
	return tmpRelativeMatForVox;
}
function get4vecForABCDCCoords(a,b,c){	//simple version first!
	voxlog("get4vecForABCDCCoords");
	voxlog({a:a,b:b,c:c});
	return getMatForABCDCCoords(a,b,c).slice(12);
}

var voxTerrainData = (function generateVoxTerrainData(){
	
	var voxdata = [];
	var blocksize = 64;
	
	for (var ii=0;ii<blocksize;ii++){
		var slicedata=[];
		voxdata.push(slicedata);
		for (var jj=0;jj<blocksize;jj++){
			slicedata.push([]);	//could push new Array(blocksize). use empty array if fill with sparse data. unimportant for small blocksize 
		}
	}

	//var voxFunction = sinesfunctionthree;
	//var voxFunction = perlinfunctionTwoSided;
	//var voxFunction = perlinfunctionTwoLevel;
	//var voxFunction = perlinfunctionSpiral;
	//var voxFunction = balls;
	//var voxFunction = oddBalls;	//this is not continuous so does not play nicely with collision. useful for testing
	//var voxFunction = wierdBeans;
	//var voxFunction = brejao;
	var voxFunction = shiftedbrejao;
	//var voxFunction = longHolesTwo;
	makeVoxdataForFunc(voxFunction);
	
	voxCollisionFunction = function(vec){
		//convert into duocylinder "space", and lookup voxFunction
		//initial implementation - just change some test value, use to set spaceship colour to test can check whether inside voxTerrain
		//function tennisBallLoader.js:get4vecfrom3vec  - want a reverse translation. already have example of this for 2d duocylinder "procTerrain" - proceduralTerrain.js:getHeightAboveTerrainFor4VecPos.  TODO generalise? this function very similar to that.
		
		var multiplier = 64/(Math.PI);
		
		var a = -Math.atan2(vec[2],vec[3]);	//note the - here, not used in procTerrain
		var b = Math.atan2(vec[0],vec[1]);
		
		var sineVal = (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]);
		sineVal = Math.max(Math.min(sineVal,1),-1);
		var c = -0.5*Math.asin(sineVal);	//this height of 4vec that can be compared to landscape height
	
		var aa=multiplier*decentMod(a,Math.PI);		//vox terrain currently repeated 2x2 squares
		var bb=multiplier*decentMod(b + duocylinderSpin,Math.PI);
		//var cc=(0.5+c*2/Math.PI)*64;
		var cc=(0.5+c*Math.sqrt(2)/Math.PI)*64;
	
		return voxFunction(aa,bb,cc);
	}
	voxABCFor4vec = function(vec){	//just testing
		var a = -Math.atan2(vec[2],vec[3]);	//note the - here, not used in procTerrain
		var b = Math.atan2(vec[0],vec[1]);
		var sineVal = (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]);
		sineVal = Math.max(Math.min(sineVal,1),-1);
		var c = -0.5*Math.asin(sineVal);	//this height of 4vec that can be compared to landscape height
		return {a:a,b:b,c:c}
	}
	voxClosestPoint = function(vec){	//return a 4vec position of (approximate) closest point on surface to the input point.
		//do this by finding the downhill slope, assuming is constant.
		//to get best result, should do in 4vec space, but for simplicity, do in aa,bb,cc space - result should be same close to duocylinder 0-level, since aa,bb,cc axes are equal scale here. away from this. imagine an ellipsoid about input point, scaled in proportion to these axes.
		//this code assumes are close to duocylinder 0-level, and therefore voxel boxes are approximately cubic
		//if use voxels away from 0-level, should correct for this, possibly by using 4vector space formulation. expect can just put corrective multipliers in this somewhere
		
		//note duplicates code from voxCollisionFunction
		
		var multiplier = 64/(Math.PI);
		
		var abc = voxABCFor4vec(vec);
		
		var a = abc.a;
		var b = abc.b;
		var c = abc.c;	//this height of 4vec that can be compared to landscape height
	
		voxlog("abc");
		voxlog(abc);
	
		//simple test - check can get back 4vec position
		//return get4vecForABCDCCoords(a,b,c);
		//return getMatForABCDCCoords(a,b,c);
		//return abc;
	
		var aa=multiplier*decentMod(a,Math.PI);		//vox terrain currently repeated 2x2 squares
		var bb=multiplier*decentMod(b + duocylinderSpin,Math.PI);
		//var cc= 32 +c*2*multiplier;
		var cc= 32 +c*Math.sqrt(2)*multiplier;
		
		//next test, attempt to convert back to 4vector input from aa,bb,cc
		//return get4vecForABCDCCoords(aa/multiplier, bb/multiplier-duocylinderSpin , (cc-32)/(2*multiplier));
		//return {a:aa/multiplier, b:bb/multiplier-duocylinderSpin, c:(cc-32)/(2*multiplier)};
		
		//find gradient in aa,bb,cc space, 1 step gradient descent to find approximate closest point on surface
		var smallAmount = 0.01;
		var centralLevel = voxFunction(aa,bb,cc);
		var aaGradient = (voxFunction(aa+smallAmount,bb,cc)-centralLevel)/smallAmount;	//could cancel out smallAmount in below calc for small perf but confusing to read
		var bbGradient = (voxFunction(aa,bb+smallAmount,cc)-centralLevel)/smallAmount;
		var ccGradient = (voxFunction(aa,bb,cc+smallAmount)-centralLevel)/smallAmount;
		
		//totalgradient is hypot of these.
		//move in direction of gradient. (gradientvec/gradientmag) by -centralLevel/gradientmag - ie by -centralLevel*gradientvec/gradientmagsq.
		var gradMagSq = aaGradient*aaGradient + bbGradient*bbGradient + ccGradient*ccGradient;
		voxlog({gradMagSq:gradMagSq});
		
		var multiplier2 = centralLevel/gradMagSq;

		/*
		aa-= multiplier2*aaGradient;
		bb-= multiplier2*bbGradient;
		cc-= multiplier2*ccGradient;
		
		//return get4vecForABCDCCoords(aa/multiplier,bb/multiplier -duocylinderSpin, (cc-32)/(2*multiplier));
		//return {a:aa/multiplier, b:bb/multiplier -duocylinderSpin, c:(cc-32)/(2*multiplier)};
				//ends up in odd place because vox terrain repeats. instead, return a,b,c with delta aa added...
				*/
		multiplier2/=multiplier;
		return {
			abc:{a:a-multiplier2*aaGradient, b:b-multiplier2*bbGradient, c:c - multiplier2*ccGradient/2},
			centralLevel:centralLevel
		};
			//TODO see whether assuming that gradient =1 makes this smoother.
	}	
	
	var mattoinvert = mat3.create();
	var myvec3 = vec3.create();
	
	//taken from webgl-voxels project (TODO make into a library!) TODO trim unused parts here - currently generates many vertex options for different smoothing methods
	var sparseVoxData = (function(){
		//stupid implementation. a vertex for every grid point, regardless of whether occupied.
		//can only do part of 64x64x64 this way
		var vertices = [];
		var smoothVertices = [];
	//	var basicAvgVertices = [];
		var dcVertices = [];
		var normals = [];
		var dcNormals = [];
		var colors = [];
		var dcColors = [];
		var delta = 0.01;
		var badVertCount=0;
		
		//sparse version - no unused vertices.
		var indexForGridPoint = [];
		var currentPoint = 0;
		var numNeighbours;
		var occNeighbours;
		for (var ii=0;ii<=64;ii++){
			for (var jj=0;jj<=64;jj++){
				for (var kk=0;kk<=64;kk++){
					numNeighbours=1;
					occNeighbours=0;
					if (ii>0){numNeighbours*=2;};
					if (jj>0){numNeighbours*=2;};
					if (kk>0){numNeighbours*=2;};
					
					if (voxdata[ii%64][jj%64][kk%64]){
						occNeighbours++;
					}
					if (kk>0 && voxdata[ii%64][jj%64][kk-1]){
						occNeighbours++;
					}
					if (jj>0 && voxdata[ii%64][jj-1][kk%64]){
						occNeighbours++;
					}
					if (jj>0 && kk>0 && voxdata[ii%64][jj-1][kk-1]){
						occNeighbours++;
					}
					if (ii>0 && voxdata[ii-1][jj%64][kk%64]){
						occNeighbours++;
					}
					if (ii>0 && kk>0 && voxdata[ii-1][jj%64][kk-1]){
						occNeighbours++;
					}
					if (ii>0 && jj>0 && voxdata[ii-1][jj-1][kk%64]){
						occNeighbours++;
					}
					if (ii>0 && jj>0 && kk>0 && voxdata[ii-1][jj-1][kk-1]){
						occNeighbours++;
					}
					if (occNeighbours%numNeighbours){	// ( !=0 )
						indexForGridPoint[getNumberOfGridPoint(ii,jj,kk)] = currentPoint;
						addVertData(ii,jj,kk);
						currentPoint++;
					}	
				}
			}
		}
		/*
		console.log(currentPoint);
		console.log(indexForGridPoint);
		*/	
		function addVertData(ii,jj,kk){
			
			//info for dual contouring. TODO more efficient to put this with vertex creation, ie looking up voxdata[ii][jj][kk] etc...
			var ii_lo = ii-1;
			var jj_lo = jj-1;
			var kk_lo = kk-1;
			//TODO store evaluated function vals - already done this to determine whether each point is in/out
			var vfunc = voxFunction;	//to make more readable
			var vdata = [ vfunc(ii_lo,jj_lo,kk_lo), vfunc(ii_lo,jj_lo,kk), vfunc(ii_lo,jj,kk_lo), vfunc(ii_lo,jj,kk),
						vfunc(ii,jj_lo,kk_lo), vfunc(ii,jj_lo,kk), vfunc(ii,jj,kk_lo), vfunc(ii,jj,kk)];
						
			ii-=0.5;	//???
			jj-=0.5;
			kk-=0.5;
			
			
			vertices.push(ii/32, jj/32, kk/32);
			
			
			//normals.push(0,0,0);
				//^^ little faster for doing O(3) slow teapot thing

			//smooth vertices (TODO make 2 vert buffers and UI to switch between) 
			//just look at gradient between surrounding points, move downhill. or take analytic gradient from something function used to generate vox data
			//to make this work generally without needing to calculate analytic derivatives, just use numerical differences.
			
			var fudgeFactor = 0.5;	//less than 1 to avoid overshoot
			var centralPoint,gradX,gradY,gradZ,totalGradSq,sharedPart;
			
			//comment out creation of smoothVertices, currently unused
		/*	
			for (var iter=0;iter<10;iter++){
				centralPoint = voxFunction(ii,jj,kk);
							
				gradX = (voxFunction(ii+delta,jj,kk)- centralPoint)/delta;
				gradY = (voxFunction(ii,jj+delta,kk)- centralPoint)/delta;
				gradZ = (voxFunction(ii,jj,kk+delta)- centralPoint)/delta;
				
				totalGradSq = gradX*gradX + gradY*gradY + gradZ*gradZ;
				
				//have some sort of hill normal. should move downhill
				//move by something like (discrepancy / totalGradent)*(gradientVector/totalGradient)
				//to avoid /0 error add something to totalGradient
			
				sharedPart = centralPoint / ( totalGradSq + 0.001);
				ii = ii-sharedPart*gradX*fudgeFactor;
				jj = jj-sharedPart*gradY*fudgeFactor;
				kk = kk-sharedPart*gradZ*fudgeFactor;
			}
			
			smoothVertices.push(ii/32, jj/32, kk/32);
		*/	
			
			var invLengthSq = 1/( totalGradSq + 0.001)
			var invLength = Math.sqrt(invLengthSq);
			var normal = [invLength*gradX, invLength*gradY, invLength*gradZ];
			var normalOverLength = [invLengthSq*gradX, invLengthSq*gradY, invLengthSq*gradZ];
			normals.push(normal[0], normal[1], normal[2]);
			
		//comment out creation of colours because currently unused
		//	var grayColor = grayColorForPointAndNormal(ii,jj,kk,normal, invLength);	
		//	colors.push(grayColor, grayColor, grayColor,1.0);	//TODO separate surf color for directional lighting from ambient response
			
			
			//"dual contouring" ? 
			//AFAIK this is where find vertex positions by... find intersection of isosurface between neighbouring voxel centres of different polarity, for the 8 voxels around vertex position - 12 possible pairs. at these points, find surface normal. suppose that vertex position lies near to plane defined by this position and vertex. for gauss distribution about this point/plane, can multiply gaussian probabilities and find maximum/centre. equivalent to adding exponents. add some extra term to prefer points nerer centre of 8 nearby voxel centres (ie where vertex for simple minecraft style boxel would be).
			//p = point (should find p that minimises this func)
			//c = centre of given intersection point (plane centre)
			//n = plane normal
			//ie something like, minimise sum{( (p - c).n)^2 + const1*(p-c)*(p-c)} + const2*p*p (where origin at boxel vert pos)
			//don't need both const1 and const2 to be nonzero
			
			//for working see paper (todo scan/write up)
			// maximum where derivative is 0. for each component...
			
			//a step towards this - find each of 12 possible intersection points, average point and normals.
			//TODO note - maybe by storing unperturbed points, can use sharp shading across sharp creases?
			
			//TODO intersection points can be calculated up to 4 times. should calculate once, reuse.
			
			var sumx=0;
			var sumy=0;
			var sumz=0;
			
			var sumnx=0;
			var sumny=0;
			var sumnz=0;
			
			var sumnxx=0;
			var sumnxy=0;
			var sumnxz=0;
			var sumnyy=0;
			var sumnyz=0;
			var sumnzz=0;
			
			var centrebias = 0.001;	//k2 from paper working. play with this value. guess should scale with number of points averaged.
			var nk1 = 0.05;
			var sumnxx=centrebias + nk1;
			var sumnyy=centrebias + nk1;
			var sumnzz=centrebias + nk1;
			var sumnxy=0;
			var sumnxz=0;
			var sumnyz=0;
			
			var sumnxxcx=0;
			var sumnxycy=0;
			var sumnxzcz=0;
			var sumnyycy=0;
			var sumnxycx=0;
			var sumnyzcz=0;
			var sumnzzcz=0;
			var sumnxzcx=0;
			var sumnyzcy=0;
			
			var sumnum=0;
			//do sumx from lo,lo,lo point
			//todo iterative root funding
			//to calc normals (initially just check position finding
			//switch along z
			var intersect;
			var thisnorm;
			
			function addToSums(ii_rel,jj_rel,kk_rel){	//inputs are relative to lo corner
				if (isNaN(ii_rel) || isNaN(jj_rel) || isNaN(kk_rel)){
					console.log("nan input to addToSums!" + ii_rel + "," + jj_rel + "," + kk_rel);
				}
			
				var ii_fromcentre = ii_rel-0.5;
				var jj_fromcentre = jj_rel-0.5;
				var kk_fromcentre = kk_rel-0.5;
				var ii_world = ii_lo + ii_rel;
				var jj_world = jj_lo + jj_rel;
				var kk_world = kk_lo + kk_rel;
				
				//bodge?
				//ii_world+=0.5;
				//jj_world+=0.5;
				//kk_world+=0.5;
				
				//calculate normal for this position
				centralPoint = voxFunction(ii_world,jj_world,kk_world);
							
				gradX = (voxFunction(ii_world+delta,jj_world,kk_world)- centralPoint)/delta;
				gradY = (voxFunction(ii_world,jj_world+delta,kk_world)- centralPoint)/delta;
				gradZ = (voxFunction(ii_world,jj_world,kk_world+delta)- centralPoint)/delta;
				
				totalGradSq = gradX*gradX + gradY*gradY + gradZ*gradZ;
				
				//have some sort of hill normal. should move downhill
				//move by something like (discrepancy / totalGradent)*(gradientVector/totalGradient)
				//to avoid /0 error add something to totalGradient
			
				var totalgrad = Math.sqrt( totalGradSq + 0.000001);
				
				thisnorm = [ gradX/totalgrad , gradY/totalgrad , gradZ/totalgrad ];
				
				sumnx+=thisnorm[0];
				sumny+=thisnorm[1];
				sumnz+=thisnorm[2];
				
				sumnxx+=thisnorm[0]*thisnorm[0];
				sumnyy+=thisnorm[1]*thisnorm[1];
				sumnzz+=thisnorm[2]*thisnorm[2];
				sumnxy+=thisnorm[0]*thisnorm[1];
				sumnxz+=thisnorm[0]*thisnorm[2];
				sumnyz+=thisnorm[1]*thisnorm[2];
				
				sumnxxcx+=thisnorm[0]*thisnorm[0]*ii_fromcentre;	//TODO formulate using loop/matrix etc
				sumnxycy+=thisnorm[0]*thisnorm[1]*jj_fromcentre;
				sumnxzcz+=thisnorm[0]*thisnorm[2]*kk_fromcentre;
				sumnxycx+=thisnorm[0]*thisnorm[1]*ii_fromcentre;
				sumnyycy+=thisnorm[1]*thisnorm[1]*jj_fromcentre;
				sumnyzcz+=thisnorm[1]*thisnorm[2]*kk_fromcentre;
				sumnxzcx+=thisnorm[0]*thisnorm[2]*ii_fromcentre;
				sumnyzcy+=thisnorm[1]*thisnorm[2]*jj_fromcentre;
				sumnzzcz+=thisnorm[2]*thisnorm[2]*kk_fromcentre;
			}
			
			var valAtIntersect;
			
			if ( (vdata[0]-vdata[1]) && vdata[0]*vdata[1]<=0){	//sign switch from lo,lo,lo to lo,lo,hi
				sumnum++;
				intersect = vdata[0]/(vdata[0]-vdata[1]);
				intersect=modifyIntersect(intersect,ii_lo,jj_lo,kk_lo+intersect,0,1);
				sumz+= intersect;
				addToSums(0,0,intersect);
			}
			if ( (vdata[2]-vdata[3]) && vdata[2]*vdata[3]<=0){	//sign switch from lo,hi,lo to lo,hi,hi
				sumnum++;
				sumy++;
				intersect = vdata[2]/(vdata[2]-vdata[3]);
				intersect=modifyIntersect(intersect,ii_lo,jj_lo+1,kk_lo+intersect,2,3);
				sumz+= intersect;
				addToSums(0,1,intersect);
			}
			if ( (vdata[4]-vdata[5]) && vdata[4]*vdata[5]<=0){	//sign switch from hi,lo,lo to hi,lo,hi
				sumnum++;
				sumx++;
				intersect = vdata[4]/(vdata[4]-vdata[5]);
				intersect=modifyIntersect(intersect,ii_lo+1,jj_lo,kk_lo+intersect,4,5);
				sumz+= intersect;
				addToSums(1,0,intersect);
			}
			if ( (vdata[6]-vdata[7]) && vdata[6]*vdata[7]<=0){	//sign switch from hi,hi,lo to hi,hi,hi
				sumnum++;
				sumx++;
				sumy++;
				intersect = vdata[6]/(vdata[6]-vdata[7]);
				intersect=modifyIntersect(intersect,ii_lo+1,jj_lo+1,kk_lo+intersect,6,7);
				sumz+= intersect;
				addToSums(1,1,intersect);
			}
			//switch along y
			if ( (vdata[0]-vdata[2]) && vdata[0]*vdata[2]<=0){	//sign switch from lo,lo,lo to lo,hi,lo
				sumnum++;
				intersect = vdata[0]/(vdata[0]-vdata[2]);
				intersect=modifyIntersect(intersect,ii_lo,jj_lo+intersect,kk_lo,0,2);
				sumy+= intersect;
				addToSums(0,intersect,0);
			}
			if ( (vdata[1]-vdata[3]) && vdata[1]*vdata[3]<=0){	//sign switch from lo,lo,hi to lo,hi,hi
				sumnum++;
				sumz++;
				intersect = vdata[1]/(vdata[1]-vdata[3]);
				intersect=modifyIntersect(intersect,ii_lo,jj_lo+intersect,kk_lo+1,1,3);
				sumy+= intersect;
				addToSums(0,intersect,1);
			}
			if ( (vdata[4]-vdata[6]) && vdata[4]*vdata[6]<=0){	//sign switch from hi,lo,lo to hi,hi,lo
				sumnum++;
				sumx++;
				intersect =  vdata[4]/(vdata[4]-vdata[6]);
				intersect=modifyIntersect(intersect,ii_lo+1,jj_lo+intersect,kk_lo,4,6);
				sumy+= intersect;
				addToSums(1,intersect,0);
			}
			if ( (vdata[5]-vdata[7]) && vdata[5]*vdata[7]<=0){	//sign switch from hi,lo,hi to hi,hi,hi
				sumnum++;
				sumx++;
				sumz++;
				intersect =  vdata[5]/(vdata[5]-vdata[7]);
				intersect=modifyIntersect(intersect,ii_lo+1,jj_lo+intersect,kk_lo+1,5,7);
				sumy+= intersect;
				addToSums(1,intersect,1);
			}
			//switch along x
			if ( (vdata[0]-vdata[4]) && vdata[0]*vdata[4]<0){	//sign switch from lo,lo,lo to hi,lo,lo
				sumnum++;
				intersect = vdata[0]/(vdata[0]-vdata[4]);
				intersect=modifyIntersect(intersect,ii_lo+intersect,jj_lo,kk_lo,0,4);
				sumx+= intersect;
				addToSums(intersect,0,0);
			}
			if ( (vdata[1]-vdata[5]) && vdata[1]*vdata[5]<0){	//sign switch from lo,lo,hi to hi,lo,hi
				sumnum++;
				sumz++;
				intersect = vdata[1]/(vdata[1]-vdata[5]);
				intersect=modifyIntersect(intersect,ii_lo+intersect,jj_lo,kk_lo+1,1,5);
				sumx+= intersect;
				addToSums(intersect,0,1);
			}
			if ( (vdata[2]-vdata[6]) && vdata[2]*vdata[6]<0){	//sign switch from lo,hi,lo to hi,hi,lo
				sumnum++;
				sumy++;
				intersect = vdata[2]/(vdata[2]-vdata[6]);
				intersect=modifyIntersect(intersect,ii_lo+intersect,jj_lo+1,kk_lo,2,6);
				sumx+= intersect;
				addToSums(intersect,1,0);
			}
			if ( (vdata[3]-vdata[7]) && vdata[3]*vdata[7]<0){	//sign switch from lo,lo,hi to hi,lo,hi
				sumnum++;
				sumy++;
				sumz++;
				intersect = vdata[3]/(vdata[3]-vdata[7]);
				intersect=modifyIntersect(intersect,ii_lo+intersect,jj_lo+1,kk_lo+1,3,7);
				sumx+= intersect;
				addToSums(intersect,1,1);
			}
			
			function modifyIntersect(intersect,xx,yy,zz,idx_a,idx_b){	//try to smooth off artifacts along sharp edges. if not having any sharp edges, this is unnecessary perf drain
				//return intersect;	//turn off
				valAtIntersect = vfunc(xx,yy,zz);
				if (valAtIntersect==0){return intersect;}
				
				if (valAtIntersect*vdata[idx_a]<0){
					intersect*= vdata[idx_a]/(vdata[idx_a]-valAtIntersect);
					if (isNaN(intersect)){console.log("intersect is nan - if!!");}
				}else{
					intersect=intersect+(1-intersect)*valAtIntersect/(valAtIntersect-vdata[idx_b]);
				}
				if (isNaN(intersect)){console.log("intersect is nan!!");}
				return intersect;
			}
			
			//do matrix calculation using sums
			//glmatrix library provides a function to invert a matrix. can't find a func to multiply a vector by a matrix though, but simple to write func
				centrebias=0.1;	//to stop adding here
					//adding this back in fixes black spots (bad normals?)
			mattoinvert[0]=sumnxx + centrebias*sumnum;	mattoinvert[1]=sumnxy;						mattoinvert[2]=sumnxz;	
			mattoinvert[3]=sumnxy;						mattoinvert[4]=sumnyy + centrebias*sumnum;	mattoinvert[5]=sumnyz;
			mattoinvert[6]=sumnxz;						mattoinvert[7]=sumnyz;						mattoinvert[8]=sumnzz + centrebias*sumnum;
			
			for (var cc=0;cc<9;cc++){
				if (isNaN(mattoinvert[cc])){
					console.log("NaN!!" + mattoinvert);
				}
			}
			
			mattoinvert = mat3.inverse(mattoinvert);	//since matrix is symmetric, can inversion be done more efficiently?
			
			myvec3[0] = sumnxxcx + sumnxycy + sumnxzcz + nk1*(sumx/sumnum - 0.5);
			myvec3[1] = sumnxycx + sumnyycy + sumnyzcz + nk1*(sumy/sumnum - 0.5);
			myvec3[2] = sumnxzcx + sumnyzcy + sumnzzcz + nk1*(sumz/sumnum - 0.5);
			
			if (mattoinvert==null){console.log("null matrix!!!!");};	//else{console.log("matrix is not null");}
			mat3.multiplyVec3(mattoinvert, myvec3);
			
			var dcPos = [ii_lo+myvec3[0], jj_lo+myvec3[1], kk_lo+myvec3[2]];
			dcPos = dcPos.map(function(elem){return elem+0.5;});	//shift to match up with smoothVertices
			//dcPos = dcPos.map(function(elem){return elem-10;});	//???
			//dcPos = dcPos.map(function(elem){return elem+0.0;});	//experiment - maybe not correct at the mo - appears to make shading more accurate, but impacts vert pos so messes up current collision detection. seems like shouldn't impact shading because shading should be determined by normals, which aren't impacted. but how is shading done? ie calculation of light direction in shader, that will dot with normal???
			dcVertices.push(dcPos[0]/32, dcPos[1]/32, dcPos[2]/32);
			//dcVertices.push(((dcPos[0]+32)%32)/32, ((dcPos[1]+32)%32)/32, ((dcPos[2]+32)%32)/32);	//?????
			
			//normalise average normals
			var sumNorm = Math.sqrt(sumnx*sumnx + sumny*sumny + sumnz*sumnz + 0.1);
			var dcNorm = [sumnx/sumNorm, sumny/sumNorm, sumnz/sumNorm];
			dcNormals.push( dcNorm[0], dcNorm[1], dcNorm[2]);
			
			/*
			//basic average points method
			if (sumnum>0){	//AFAIK this should not happen
				ii_lo+=sumx/sumnum;
				jj_lo+=sumy/sumnum;
				kk_lo+=sumz/sumnum;
			}
			*/
			
			//comment out basicAvgVertices because currently unused
			/*
			var sums;
			
			//override basic average vertex if have intersection data from poly->vox (todo skip preceding code in this case)
			if (typeof globalAxisCollisionData =="undefined"){
				basicAvgVertices.push(ii_lo/32, jj_lo/32, kk_lo/32);
			}else{
				
				var ii_adj = ii_lo+0;	//adjust to guess fix
				var jj_adj = jj_lo+0;
				var kk_adj = kk_lo+0;
				
				var idxToLookup = 64*64*ii_adj + 64*jj_adj + kk_adj;			//todo check out by ones
				sums = {x:0,y:0,z:0,n:0};
	
				addCollisionData(globalAxisCollisionData.x[idxToLookup]);
				addCollisionData(globalAxisCollisionData.x[idxToLookup + 64]);
				addCollisionData(globalAxisCollisionData.x[idxToLookup + 1]);
				addCollisionData(globalAxisCollisionData.x[idxToLookup + 64+1]);
				
				addCollisionData(globalAxisCollisionData.y[idxToLookup]);
				addCollisionData(globalAxisCollisionData.y[idxToLookup + 64*64]);
				addCollisionData(globalAxisCollisionData.y[idxToLookup + 1]);
				addCollisionData(globalAxisCollisionData.y[idxToLookup + 64*64+1]);
				
				addCollisionData(globalAxisCollisionData.z[idxToLookup]);
				addCollisionData(globalAxisCollisionData.z[idxToLookup + 64*64]);
				addCollisionData(globalAxisCollisionData.z[idxToLookup + 64]);
				addCollisionData(globalAxisCollisionData.z[idxToLookup + 64*64+64]);
				
				if (sums.n ==0){
					alert("sums.n = 0 !!");
					//basicAvgVertices.push(0, 0, 0);	//THIS SHOULD NOT HAPPEN!!!
					basicAvgVertices.push(1, 1, 1);	//THIS SHOULD NOT HAPPEN!!!
					badVertCount++;
				}
				//console.log(sums);
				//basicAvgVertices.push(sums.x/sums.n, sums.y/sums.n, sums.z/sums.n);
				basicAvgVertices.push((sums.x/sums.n)/32, (sums.y/sums.n)/32, (sums.z/sums.n)/32);
			}
				//TODO move function outside loop!!!
			function addCollisionData(cdata){
				if (typeof cdata == "undefined"){return;}
				sums.x+= cdata.x;
				sums.y+= cdata.y;
				sums.z+= cdata.z;
				sums.n++;
			}
			*/
			//grayColor = grayColorForPointAndNormal(dcPos[0],dcPos[1],dcPos[2],dcNorm,1/sumNorm);	//wierd result since average normal is not the normal at this point! 
			grayColor = grayColorForPointAndNormal(dcPos[0],dcPos[1],dcPos[2]);	//don't pass in normal info, calc inside function
						
			dcColors.push(grayColor, grayColor, grayColor, 1.0);	//TODO separate surf color for directional lighting from ambient response
		}

		
		function grayColorForPointAndNormal(ii,jj,kk, normal, invLength){	//note can just calculate normal at point, but saves some calculation if already have it
		
			//guess
			var fudgeOffset = 0.5;	//TODO work out correct value!
			
			ii+=fudgeOffset;
			jj+=fudgeOffset;
			kk+=fudgeOffset;
		
			//colors.push(Math.random(),Math.random(),Math.random(),1.0);
			var colorScale = 6;	//scale of noise (smaller = finer)
			//var grayColor = 0.5+0.5*noise.perlin3(ii/colorScale,jj/colorScale,kk/colorScale);	// mapt -1 to 1 -> 0 to 1
			//var grayColor = 1.5+0.5*noise.perlin3(ii/colorScale,jj/colorScale,kk/colorScale);
			var grayColor = 1+1*sumPerlin(ii/colorScale,jj/colorScale,kk/colorScale,1.8);
			grayColor*=0.5;
			//colors.push(grayColor, grayColor, grayColor, 1.0);
			//normals.push(0,0,0); 
			
			//colour by local curvature. guess an equation for this.
			//really a saddle should be more shady than a flat plane, and direction of lighting could be used, but simple version may provide ok effect 
			var twiceCentralPoint = 2*voxFunction(ii,jj,kk);
			var fwdX = voxFunction(ii+delta,jj,kk);
			var bwdX = voxFunction(ii-delta,jj,kk);
			var fwdY = voxFunction(ii,jj+delta,kk);
			var bwdY = voxFunction(ii,jj-delta,kk);
			var fwdZ = voxFunction(ii,jj,kk+delta);
			var bwdZ = voxFunction(ii,jj,kk-delta);
			
			var shiftX = fwdX + bwdX - twiceCentralPoint;
			var shiftY = fwdY + bwdY - twiceCentralPoint;
			var shiftZ = fwdZ + bwdZ - twiceCentralPoint;
			
			if (!normal){	//override input normal/invLength (if works, remove inputs)
				normal = [(fwdX-bwdX)/delta, (fwdY-bwdY)/delta, (fwdZ-bwdZ)/delta];	//over delta avoids numerical error afaik
				invLength = 1/Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2] + 0.00001);
				normal = normal.map(function(elem){return elem*invLength;});	
			}
			
			//try laplacian. suspect should use with second derivative in direction of normal
			var curveColor = shiftX + shiftY + shiftZ;
			var shiftGrad = voxFunction(ii+delta*normal[0],jj+delta*normal[1],kk+delta*normal[2]) + voxFunction(ii-delta*normal[0],jj-delta*normal[1],kk-delta*normal[2]) - twiceCentralPoint;	//TODO formulate this using the existing samples?
			curveColor -= shiftGrad;
			
			//positive curvature doesn't increase lighting (unless saddle-like). TODO nonlinear shading(curve)
			curveColor = Math.max(curveColor,0.0);
			
			//divide by steepness of scalar field func
			curveColor*=invLength;
			curveColor/=delta*delta;
			
			curveColor = Math.max(Math.atan(curveColor)*(2/Math.PI),0.0);
			
			//grayColor*=0.5-curveColor;	//using *= to retain perlin	//TODO wrap vert colours (0,64)
			grayColor=0.5-curveColor;	//using *= to retain perlin
			return grayColor;
		}

		function getNumberOfGridPoint(ii,jj,kk){
			return ii*65*65 + jj*65 + kk;
		}
		function pushIndexForNumber(indexarr,nii,njj,nkk){
			indexarr.push(indexForGridPoint[nii],indexForGridPoint[njj],indexForGridPoint[nkk]);
		}
		
		var oneVertIdx;
		var directionalIndices = [[],[],[],[],[],[]];
		for (var ii=0;ii<64;ii++){
			for (var jj=0;jj<64;jj++){
				for (var kk=0;kk<64;kk++){
					var difference=voxdata[ii][jj][(kk+1)%64]-voxdata[ii][jj][kk];
					if (difference!=0){
						oneVertIdx = getNumberOfGridPoint(ii,jj,kk+1);
						if ( difference>0 ){
							pushIndexForNumber(directionalIndices[0], oneVertIdx , oneVertIdx+65 , oneVertIdx+65+65*65 );	//bottom faces
							pushIndexForNumber(directionalIndices[0],  oneVertIdx , oneVertIdx+65+65*65, oneVertIdx+65*65);
						}else{
							pushIndexForNumber(directionalIndices[1], oneVertIdx, oneVertIdx+65+65*65, oneVertIdx+65 );		//top faces
							pushIndexForNumber(directionalIndices[1], oneVertIdx, oneVertIdx+65*65, oneVertIdx+65+65*65);
						}
					}
				}
			}
		}
		
		for (var ii=0;ii<64;ii++){
			for (var jj=0;jj<64;jj++){
				for (var kk=0;kk<64;kk++){
					var difference=voxdata[ii][(jj+1)%64][kk]-voxdata[ii][jj][kk];
					if (difference!=0){
						oneVertIdx = getNumberOfGridPoint(ii,jj+1,kk);
						if ( difference<0 ){
							pushIndexForNumber(directionalIndices[2], oneVertIdx, oneVertIdx+1, oneVertIdx+1+65*65 );
							pushIndexForNumber(directionalIndices[2], oneVertIdx, oneVertIdx+1+65*65, oneVertIdx+65*65);
						}else{
							pushIndexForNumber(directionalIndices[3], oneVertIdx, oneVertIdx+1+65*65, oneVertIdx+1 );
							pushIndexForNumber(directionalIndices[3], oneVertIdx, oneVertIdx+65*65, oneVertIdx+1+65*65);
						}
					}
				}
			}
		}
		
		for (var ii=0;ii<64;ii++){
			for (var jj=0;jj<64;jj++){
				for (var kk=0;kk<64;kk++){
					var difference=voxdata[(ii+1)%64][jj][kk]-voxdata[ii][jj][kk];
					if ( difference!=0 ){
						oneVertIdx = getNumberOfGridPoint(ii+1,jj,kk);					
						if ( difference>0 ){
							pushIndexForNumber(directionalIndices[4], oneVertIdx, oneVertIdx+1, oneVertIdx+1+65);
							pushIndexForNumber(directionalIndices[4], oneVertIdx, oneVertIdx+1+65, oneVertIdx+65);
						}else{
							pushIndexForNumber(directionalIndices[5], oneVertIdx, oneVertIdx+1+65, oneVertIdx+1);
							pushIndexForNumber(directionalIndices[5], oneVertIdx, oneVertIdx+65, oneVertIdx+1+65);
						}
					}
				}
			}
		}
		/*
		console.log("indices info:");
		console.log(directionalIndices[0].length);
		console.log(directionalIndices[1].length);
		console.log(directionalIndices[2].length);
		console.log(directionalIndices[3].length);
		console.log(directionalIndices[4].length);
		console.log(directionalIndices[5].length);
		console.log("badVertCount: " + badVertCount);
		*/
		return {
			vertices:vertices,
		//	smoothVertices:smoothVertices,
		//	basicAvgVertices:basicAvgVertices,
			dcVertices:dcVertices,
			normals:normals,
			dcNormals:dcNormals,
		//	colors:colors,
			dcColors:dcColors,
		//	directionalIndices:directionalIndices,	//can be used to draw faces in 6 cube directions with separate draw calls (can use for square terrain culling, shading)
			indices:Array.prototype.concat.apply([],directionalIndices)
		};
	})();
		
	//make vert positions consistent with other models mapped onto duocylinder?
	//sparseVoxData.smoothVertices = sparseVoxData.smoothVertices.map(function(elem){return elem/2;});
	
	//swizzle data. just vertices initially - should do normals too.
	//var myverts = sparseVoxData.smoothVertices;	//good for smooth surfaces
	//var myverts = sparseVoxData.basicAvgVertices;	//actually currently these are hard boxel verts?!
	//var myverts = sparseVoxData.vertices;
	var myverts = sparseVoxData.dcVertices;	//better for objects with sharp corners, but surface grows for convex objects (eg spheres)
	var mynorms = sparseVoxData.dcNormals;	//sometimes have problems with these
	//var mynorms = sparseVoxData.normals;	//also problems with these!
	var tmp;
	for (var ii=0;ii<myverts.length;ii+=3){
		//switch y/z
		tmp = myverts[ii+1];
		myverts[ii+1] = myverts[ii+2] - 1;
		myverts[ii+2] = tmp;
		myverts[ii]=-myverts[ii];	//mirror x so correct winding order
		
		//same for normals. also reverse direction vs webgl-voxels project
		tmp = mynorms[ii+1];
		mynorms[ii+1] = -mynorms[ii+2];
		mynorms[ii+2] = -tmp;
	}
	
	return {
		vertices:myverts,
		tricoords:myverts,	//retained when loadGridData() maps 3vec vertices to 4vec verts (mapping onto duocylinder)
		normals:mynorms,	//note that normals with unperterbed grid voxels makes little sense
		trinormals:mynorms,		//as with tricoords.
		faces:sparseVoxData.indices,
		colors:sparseVoxData.dcColors,
		//colors:sparseVoxData.colors
		//directionalIndices:sparseVoxData.directionalIndices
	}
	
	function makeVoxdataForFunc(thefunction){
		for (var ii=0;ii<blocksize;ii++){
			var slicedata = voxdata[ii];
			for (var jj=0;jj<blocksize;jj++){
				var stripdata = slicedata[jj];
				for (var kk=0;kk<blocksize;kk++){
					stripdata[kk] = (thefunction(ii,jj,kk) > 0 );	//if know starting from empty array, can use push. if want sparse array, should use conditional. 
				}											//note some functions may benefit from currying eg functionForXY= thefunction(ii,jj), 
			}
		}
	}
	
	//copied from webgl-voxels project
	function sinesfunctionthree(ii,jj,kk){
		ii%=64;
		jj%=64;
		kk%=64;
		var sinscale=4/Math.PI;
		//return Math.sin(ii/sinscale)+Math.sin(jj/sinscale)+Math.sin(kk/sinscale);
		//return Math.sin(ii/sinscale)+Math.sin(jj/sinscale)- 0.1*(kk-32)*(kk-32) + 1;
		return -3*Math.sin(ii/sinscale)*Math.sin(jj/sinscale)*Math.sin(ii/sinscale)*Math.sin(jj/sinscale) - 0.2*(kk-32)*(kk-32) +0.6 ;
	}
	function perlinfunctionTwoSided(ii,jj,kk){
		//return 10*noise.perlin3(ii/64,jj/64,kk/64) - 0.02*(kk-32)*(kk-32);	//landscape with 3d perlin surface
		return 10*wrapPerlin(ii/12,jj/12,kk/12,64/12) +0.2 - 0.002*(kk-32)*(kk-32);	//landscape with 3d perlin surface
	}
	function perlinfunctionTwoLevel(ii,jj,kk){
		//return perlinfunctionTwoSided(ii,jj,Math.abs(kk-32) + 10 + 32);
		return sinesfunctionthree(ii,jj,Math.abs(kk-32) - 5 + 32);
	}
	/*
	function perlinfunctionCrazy(ii,jj,kk){	//happy accident
		ii%=64;
		jj%=64;
		kk%=64;
		var sinscale=4/Math.PI;
		
		var kkAdj = kk;	//+ii/16;
		var kkNearest = kkAdj%8 - 4;
		
		return -3*Math.sin(ii/sinscale)*Math.sin(jj/sinscale)*Math.sin(ii/sinscale)*Math.sin(jj/sinscale) - 0.2*kkNearest*kkNearest +0.6 ;
	}
	*/
	function perlinfunctionSpiral(ii,jj,kk){
		ii%=64;
		jj%=64;
		kk%=64;
		var sinscale=4/Math.PI;
		
		//var kkAdj = kk+ii/8 + jj/8;	//mismatched wrap, looks good though
		var kkAdj = kk+ii/4 + jj/4;
		var kkNearest = kkAdj%16 - 8;
		
		return -3*Math.sin(ii/sinscale)*Math.sin(jj/sinscale)*Math.sin(ii/sinscale)*Math.sin(jj/sinscale) - 0.5*kkNearest*kkNearest +0.6 ;	//holey
		//return - 0.5*kkNearest*kkNearest +0.6 ;
	}
	function balls(ii,jj,kk){
		ii%=64;
		jj%=64;
		kk%=64;
		
		kk-=32;
		ii = ii%8 -4;
		jj = jj%8 -4;
		
		//return - 0.5*ii*ii - 0.5*jj*jj - kk*kk/Math.PI + 4;
		return - 0.5*ii*ii - 0.5*jj*jj - 0.5*kk*kk + 4;
	}
	
	function oddBalls(ii,jj,kk){
		ii%=64;
		jj%=64;
		kk%=64;
		
		ballSize = 1+jj*0.1;
		
		kk-=32;
		ii = ii%8 -4;
		jj = jj%8 -4;
		
		//return - 0.5*ii*ii - 0.5*jj*jj - kk*kk/Math.PI + 4;
		return - 0.5*ii*ii - 0.5*jj*jj - 0.5*kk*kk + ballSize;
	}
	
	function wierdBeans(ii,jj,kk){
		ii%=32;
		jj%=32;
		kk%=32;
		
		var rad = Math.hypot(ii-16,jj-16);
		var secondRad = Math.hypot( rad - 5, kk-16);
		
		return 10-secondRad;
	}
	
	function shiftedbrejao(ii,jj,kk){
		//return brejao(ii,jj,kk-6);
		return earlyExitBrejao(ii,jj,kk-4);
	}
	function earlyExitBrejao(ii,jj,kk){	//attempt to speed up by fast return outside region of interest
		var distThreshold =15;
		var roughDist = Math.abs(kk-32) - 1.2;
		if (roughDist>distThreshold){	//dist is -ve
			return -roughDist;
		}else{
			var preciseDist = brejao(ii,jj,kk);
			return -roughDist*(roughDist/distThreshold) + (1-(roughDist/distThreshold)) * preciseDist;
		}
	}
	function brejao(ii,jj,kk){
		ii+=128;
		jj+=128;
		
		kk+=64;
		kk%=64;
		kk-=32;
		
		var ringSize = 12;
		var ringShift = 6;
		var ringTilt = 0.35;
		//var ringTilt = 0;
		
		var x = ii%32 - 16;
		var xplus = (ii+ringShift)%32 - 16;
		var xminus = (ii-ringShift)%32 - 16;
		var y = jj%32 - 16;
		var yplus = (jj+ringShift)%32 - 16;
		var yminus = (jj-ringShift)%32 - 16;
		
		var roundingPower = 8;	//even number
		var x = x* ( 1 - Math.pow(x/16, roundingPower));	//make sawtooth rounded (make field continuous so direction of closest point estimation using gradient works better.)
		var y = y* ( 1 - Math.pow(y/16, roundingPower));
		
		//var xwave=x;	//turn off adjustments
		//var ywave=y;
		
		var rad = Math.hypot(x,yplus);
		var ringOneRad = Math.hypot( rad - ringSize, kk - ringTilt*x);	//+/-x shears ring instead of rotating it. approx but simple
		
		rad = Math.hypot(x,yminus);
		var ringTwoRad = Math.hypot( rad - ringSize, kk + ringTilt*x);
				
		rad = Math.hypot(xplus,y);
		var ringThreeRad = Math.hypot( rad - ringSize, kk + ringTilt*y);
		
		rad = Math.hypot(xminus,y);
		var ringFourRad = Math.hypot( rad - ringSize, kk - ringTilt*y);
		
		/*
		//cap rads to discontinuity on repeat? this changes dark glitches, so guess on right track.
		var radMax = 6;
		ringOneRad = Math.min(radMax, ringOneRad);
		ringTwoRad = Math.min(radMax, ringTwoRad);
		ringThreeRad = Math.min(radMax, ringThreeRad);
		ringFourRad = Math.min(radMax, ringFourRad);
		*/
		//return 1.8-Math.min(Math.min(ringOneRad,ringTwoRad), Math.min(ringThreeRad,ringFourRad));
		//return 1.8-Math.min(Math.min(ringOneRad,ringTwoRad), ringThreeRad);	// 3 rings. wierd spots
		//return 1.8-Math.min(ringOneRad,ringTwoRad);	// 2 rings. wierd spots
		
		
		
		return 1.2-smoothMin(smoothMin(ringOneRad,ringTwoRad), smoothMin(ringThreeRad,ringFourRad));	//thin
		
		
		//return 1.8-smoothMin(smoothMin(ringOneRad,ringTwoRad), smoothMin(ringThreeRad,ringFourRad));
		//return 1.8-smoothMin(smoothMin(ringOneRad,ringTwoRad), ringThreeRad);	//3 rings. wierd spots
		//return 1.8-smoothMin(ringOneRad,ringTwoRad);	//2 rings only. no wierd spots
		
		//some funtion that goes near flat at long range, so less kink on repeat? (sine maybe better)
		//still has black spot vertices problem
		//return -1.8+(1.8*1.8)/smoothMin(smoothMin(ringOneRad,ringTwoRad), smoothMin(ringThreeRad,ringFourRad));
		//return -1.8+(1.8*1.8)/Math.min(Math.min(ringOneRad,ringTwoRad), Math.min(ringThreeRad,ringFourRad));

		
	}
	
	function longHoles(ii,jj,kk){
		var height = (kk-32);
		//var envelope = height*height;
		//return 20-envelope;		//simple flat ground - two sided but can't get from one side to the other.
		
		var groundHeight = 4;
		var aboveGround = Math.max(0,Math.abs(height)-groundHeight);
		
		var holestep = 16;
		var holerad = 7;
		var halfholestep = holestep/2;
		var xx = (ii+holestep)%holestep - halfholestep;
		var yy = (jj+holestep)%holestep - halfholestep;
		var rad = Math.hypot(xx,yy);	//
		var distanceInside = Math.max( holerad - rad , 0);
		
		var curvature = 4;	//how much surface is "inflated" over sharp version. note if curvature=0... 		
		
		var distFromSurf=curvature - Math.hypot(distanceInside,aboveGround);	// <-- this function just goes to zero inside surface, presumably breaking surface extraction. could implement a hypot which treats +ve/-ve different - basically SDF for a cube corner.
		
		//return distFromSurf;	//simple
		
		return distFromSurf-1;	//simple

		
		//abs this surface for 2-sided. (player will be locked on one side unless poke a hole through though
		//var skinThickness = 0.5;
		//return -Math.min(-1, Math.abs(distFromSurf-skinThickness));	//note -ve number again to ensure crosses 0.
		
	}
	
	function longHolesTwo(ii,jj,kk){
		var holerad = 7;
		var holerad2 = 5;
		var holestep = 32;
		var halfholestep = holestep/2;
		var groundHeight = 2;
		var curvature = 5;	//how much surface is "inflated" over sharp version. 	
		var skinThickness = 0.1;	//too small and surface extraction goes bad. not really well suited to this unless have more voxels
		var curvature2 = 0.9;
		
		var height = (kk-32);
		//var envelope = height*height;
		//return 20-envelope;		//simple flat ground - two sided but can't get from one side to the other.
		
		var aboveGround = Math.abs(height)-groundHeight;
		
		
		var xx = (ii+holestep)%holestep - halfholestep;
		var yy = (jj+holestep)%holestep - halfholestep;
		var rad = Math.hypot(xx,yy);	//
		var distanceInside = holerad - rad;
		
		var distFromSurf= sdfCornerDist(distanceInside,aboveGround) - curvature;	
		
		//return -distFromSurf;
				
		//abs this surface for 2-sided. (player will be locked on one side unless poke holes through (could do by portal!)	
		distFromSurf = skinThickness-Math.abs(distFromSurf);
		//return distFromSurf;
		
		//some more holes to cut through, allowing player to get from one side to the other.
		var xx2 = (ii+halfholestep)%holestep - halfholestep;
		var yy2 = (jj+halfholestep)%holestep - halfholestep;
		var rad2 = Math.hypot(xx2,yy2);	//
		var distanceInside2 = holerad2 - rad2;
		distFromSurf= curvature2 -sdfCornerDist(-distFromSurf,distanceInside2);	//-ve signs because returned value should be +ve inside solid things (!)
		return distFromSurf;
	}
	
})();

function sdfCornerDistSlow(){	//basically SDF for a square/cube corner.
	var inside = Math.min(Math.max.apply(null, arguments), 0);
	var outside = Math.hypot.apply(null, Array.from(arguments).map(function(elem){return Math.max(elem,0);}));
	return outside + inside;
}

function sdfCornerDist(aa,bb){	//basically SDF for a square/cube corner. assume 2 variable input
	var inside = Math.min(Math.max(aa, bb), 0);
	var outside = Math.hypot(Math.max(aa,0),Math.max(bb,0));
	return outside + inside;
}

function smoothMin(x,y){	//introduces black spot normals. unknown why
	var smoothness=2.5;
	return 0.5*( (x+y) - Math.hypot( x-y , smoothness));	//AFAIK reproduces min for smoothness = 0
	
	/*
	//reduce discontinuities due to effect of one field switching? 
	var max = 10;
	var fudge = 1.4;
	x = max* (1- Math.exp(-fudge*x/max));
	y = max* (1- Math.exp(-fudge*y/max));
	return 0.5*( (x+y) - Math.hypot( x-y , smoothness));
	
	*/
}


var tmpRelativeMatForVox = mat4.create();	//does same job as tmpRelativeMat but use new variable to avoid trouble with changing file order etc

//put a load of particles on voxel surface
//gradient descent. maybe quite slow, uneven distribution 
//faster method might : look at created mesh (triangles). can do equal are probability
var voxSurfaceParticleMats = (function(){
	var mats=[];
	var nummats = 8192;
	for (nn=0;nn<nummats;nn++){
		var this4vec = random_quaternion();
		var thisABC;
		for (var step=0;step<10;step++){	//only 1 step leads to nice accidental randomness effect
			estSurfPoint = voxClosestPoint(this4vec);
			thisABC = estSurfPoint.abc;
			this4vec = get4vecForABCDCCoords(thisABC.a,thisABC.b,thisABC.c)
		}
		
		//get a matrix for this position. TODO align to surface
		//use something very similar to main.js:moveToDuocylinderAB, but signs, offsets differ
		var thisMat = mat4.identity();
		xyzrotate4mat(thisMat, [0,0, Math.PI/2-thisABC.b]);
		zmove4mat(thisMat, thisABC.a);
		xmove4mat(thisMat, Math.PI/4 - thisABC.c);	//or ymove - should check what way up want models to be. PI/4 is onto surface of duocylinder
		mats.push(thisMat);
	}
	return mats;
})();