

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


function mylog(obj){
	console.log(obj);
}

function multiply_4matrices(a,b){
	var prod=mat4.create();
	mat4.set(a,prod);
	mat4.multiply(prod,b);
	return prod;
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
