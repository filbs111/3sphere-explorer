

//NEW PROGRAM - multiply matrix and quaternion by new one each time. see if result stays the same.#
//THIS VERSION FOR 4x4

var qa=random_quat_pair();
var mata = convert_quats_to_4matrix(qa);	//todo pass in as pair variable?

var qb=random_quat_pair();
var matb = convert_quats_to_4matrix(qb);	//todo pass in as pair variable?

//multiply together matrices
var matProduct = multiply_4matrices(mata, matb);
var qp= multiply_qpairs(qa,qb);

var qnew=random_quat_pair();

for (var it=0;it<10000;it++){
	//var qnew=random_quat_pair();	//get better results (more orthogonal matrix) if randomise here!
	var newmat = convert_quats_to_4matrix(qnew);
	
	qp= multiply_qpairs(qp,qnew);
	matProduct = multiply_4matrices(matProduct, newmat);
	//matProduct = multiply_4matrices(newmat, matProduct);
}


mylog("a:");
mylog(qa);
mylog(mata);

mylog("b:");
mylog(qb);
mylog(matb);

mylog("product:");
mylog(matProduct);
//mylog(qp);
mylog(convert_quats_to_4matrix(qp));


check4mat(matProduct);
check4mat(convert_quats_to_4matrix(qp));
normalise_qpair(qp);
check4mat(convert_quats_to_4matrix(qp));



//check that can find pair of quaternions representing a matrix inverse, where the pair representing the matrix to invert are known.

//what quaternion pair represents the identity matrix?
mylog("identity:");
var qid_1=[[1,0,0,0],[1,0,0,0]];		//this works
mylog(convert_quats_to_4matrix(qid_1));

var qid_2=[[-1,0,0,0],[-1,0,0,0]];		//this also works
mylog(convert_quats_to_4matrix(qid_2));

//multiplication of q pairs is multiply_quaternions(qa[0],qb[0]), multiply_quaternions(qb[1],qa[1])];
//ie [1,0,0,0],[1,0,0,0] = q[0]*qinv[0] , q[1]*qinv[1]
//ie [1,0,0,0] = q[0]*qinv[0] = q[1]*qinv[1]
//ie qinv = [1,0,0,0]/q[0] , [1,0,0,0]/q[1]
//quaternion division is IIRC multiplication by conjugate. something like the 1st term is *-1

var testqpair = random_quat_pair();

var candidate_inverse_qpair_1 = [[testqpair[0][0],-testqpair[0][1],-testqpair[0][2],-testqpair[0][3]], 
			[testqpair[1][0],-testqpair[1][1],-testqpair[1][2],-testqpair[1][3]]];	//this works, producing [[1,0,0,0],[1,0,0,0]] (qid_1)

var candidate_inverse_qpair_2 = [[-testqpair[0][0],testqpair[0][1],testqpair[0][2],testqpair[0][3]],
			[-testqpair[1][0],testqpair[1][1],testqpair[1][2],testqpair[1][3]]];	//this works, producing [[1,0,0,0],[1,0,0,0]] (qid_2)
								
mylog(multiply_qpairs(testqpair, candidate_inverse_qpair_1));
mylog(multiply_qpairs(testqpair, candidate_inverse_qpair_2));

//check that the matrices produce identity when multiplied together
mylog(multiply_4matrices(convert_quats_to_4matrix(candidate_inverse_qpair_1), convert_quats_to_4matrix(testqpair)));
mylog(multiply_4matrices(convert_quats_to_4matrix(candidate_inverse_qpair_2), convert_quats_to_4matrix(testqpair)));


//"movement" matrix.	------------------------------------------------
var testmovevector = [0.1,0.2,0.3];
var halftestmovevector = scalarvectorprod(0.5,testmovevector);

var moveqp = makemovequatpair(halftestmovevector);
var movem = convert_quats_to_4matrix(moveqp);
mylog(movem);
//check4matB(movem);

//find equivalent to what using currently in 3-sphere explorer project to transform so4 mats.

var glmat=mat4.create();
mat4.identity(glmat);
//console.log(glmat);
xyzmove4mat(glmat, testmovevector);
console.log(glmat);

console.log(movem);	


//"rotation" matrix ---------------------------------------------------
var testrotatevector = [0.1,0.2,0.3];
var halftestrotatevector = scalarvectorprod(0.5,testrotatevector);

var rotqp = makerotatequatpair(halftestrotatevector);
var rotm = convert_quats_to_4matrix(rotqp);
mylog(rotm);
//check4mat(rotm);

mat4.identity(glmat);
//console.log(glmat);
xyzrotate4mat(glmat, testrotatevector);
console.log(glmat);

console.log(rotm);



function scalarvectorprod(sca,vec){
	return vec.map(function(val){return sca*val;});
}

function makemovequatpair(move){
	//work out direction, length. move is a 3-vector
	var lengthsq = move[0]*move[0] + move[1]*move[1] + move[2]*move[2];
	var length = Math.sqrt(lengthsq);
	var mult = Math.sin(length)/length;
	var q = [Math.cos(length), mult*move[0], mult*move[1], mult*move[2]];
	return [q,q];
}

function makerotatequatpair(rot){
	//work out direction, length. move is a 3-vector
	var lengthsq = rot[0]*rot[0] + rot[1]*rot[1] + rot[2]*rot[2];
	var length = Math.sqrt(lengthsq);
	var mult = Math.sin(length)/length;
	var q = [Math.cos(length), -mult*rot[0], -mult*rot[1], -mult*rot[2]];
	var qc = [Math.cos(length), mult*rot[0], mult*rot[1], mult*rot[2]];
	return [q,qc];
}


function mylog(obj){
	console.log(obj);
}

function random_quat_pair(){
	var qp=[];
	qp.push(random_quaternion());
	qp.push(random_quaternion());
	return qp;
}

function random_quaternion(){
	var q = [];
	var sumsq=0;
	for (var ii=0;ii<4;ii++){	//not an even distribution
		q[ii] = Math.random()-0.5;
	}
    normalise_quat(q);
	return q;
}

function normalise_qpair(qp){
	normalise_quat(qp[0]);
	normalise_quat(qp[1]);
}

function normalise_quat(q){
	var sumsq=0;
	for (var ii=0;ii<4;ii++){
		sumsq+=q[ii]*q[ii];
	}
	var sum = Math.sqrt(sumsq);
	for (var ii=0;ii<4;ii++){
		q[ii]/=sum;
	}
}

function convert_quats_to_4matrix(qpair){
	var q1=qpair[0], q2=qpair[1];
	
	var m = mat4.create();
	
	var a1=q1[0];
    var b1=q1[1];
	var c1=q1[2];
	var d1=q1[3];
	var a2=q2[0];
	var b2=q2[1];
	var c2=q2[2];
	var d2=q2[3];
	
	var a1a2=a1*a2, a1b2=a1*b2, a1c2=a1*c2, a1d2=a1*d2;
	var b1a2=b1*a2, b1b2=b1*b2, b1c2=b1*c2, b1d2=b1*d2;
	var c1a2=c1*a2, c1b2=c1*b2, c1c2=c1*c2, c1d2=c1*d2;
	var d1a2=d1*a2, d1b2=d1*b2, d1c2=d1*c2, d1d2=d1*d2;

	m[15]=a1a2-b1b2-c1c2-d1d2;	m[12]=-a1b2-b1a2+c1d2-d1c2;	m[13]=-a1c2-b1d2-c1a2+d1b2;	m[14]=-a1d2+b1c2-c1b2-d1a2;
	m[3]=b1a2+a1b2-d1c2+c1d2;	m[0]=-b1b2+a1a2+d1d2+c1c2;	m[1]=-b1c2+a1d2-d1a2-c1b2;	m[2]=-b1d2-a1c2-d1b2+c1a2;
	m[7]=c1a2+d1b2+a1c2-b1d2;	m[4]=-c1b2+d1a2-a1d2-b1c2;	m[5]=-c1c2+d1d2+a1a2+b1b2;	m[6]=-c1d2-d1c2+a1b2-b1a2;
	m[11]=d1a2-c1b2+b1c2+a1d2;	m[8]=-d1b2-c1a2-b1d2+a1c2;	m[9]=-d1c2-c1d2+b1a2-a1b2;	m[10]=-d1d2+c1c2+b1b2+a1a2;
	
	//matrices(m,1,1)=asq+bsq-csq-dsq  :matrices(m,1,2)=2.0*(b*c-a*d)   :matrices(m,1,3)=2.0*(b*d+a*c)
	//matrices(m,2,1)=2.0*(b*c+a*d)    :matrices(m,2,2)=asq-bsq+csq-dsq :matrices(m,2,3)=2.0*(c*d-a*b)
	//matrices(m,3,1)=2.0*(b*d-a*c)    :matrices(m,3,2)=2.0*(c*d+a*b)   :matrices(m,3,3)=asq-bsq-csq+dsq
	
	return m;
}



function multiply_quaternions(b,a){	//note switched input order for consistency with matrix multiplication
	var prod=[];
	prod[0]=a[0]*b[0]-(a[1]*b[1]+a[2]*b[2]+a[3]*b[3]);       //s1s2 - v1.v2
    //vector part of product= s1v2+s2v1+s3v3 +v1 x v2
	prod[1]=a[0]*b[1]+b[0]*a[1]+ a[2]*b[3]-a[3]*b[2];
	prod[2]=a[0]*b[2]+b[0]*a[2]+ a[3]*b[1]-a[1]*b[3];
	prod[3]=a[0]*b[3]+b[0]*a[3]+ a[1]*b[2]-a[2]*b[1];
	return prod;
}

function multiply_qpairs(qa,qb){
	return [multiply_quaternions(qa[0],qb[0]), multiply_quaternions(qb[1],qa[1])];
}

function multiply_4matrices(a,b){
	var prod=mat4.create();
	mat4.set(a,prod);
	mat4.multiply(prod,b);
	return prod;
}


function copy_quaternion(q_from,q_to){
	for (var ii=0;ii<4;ii++){
		q_to[ii] = q_from[ii];
	}
}


//designed for glmatrix style flat arrays.
function check4mat(mat){
	//see whether becoming not normalised/orthogonal
	//var resultsarrRow=[];
	
	var resultsarrRowSq=[];
	for (var aa=0;aa<4;aa++){
		for (var bb=0;bb<4;bb++){
			//var total=0;
			var totalsq=0;
			for (var cc=0;cc<4;cc++){
				var vala=mat[4*aa + cc];
				var valb=mat[4*bb + cc];
				totalsq+=vala*valb;
			}
			//resultsarrRow.push(total);
			resultsarrRowSq.push(totalsq);
		}
	}
	console.log(resultsarrRowSq);

	var logResults = resultsarrRowSq.map(function(val){return Math.log(val);});
	//console.log(logResults);
}
