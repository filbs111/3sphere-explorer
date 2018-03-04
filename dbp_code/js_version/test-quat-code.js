

//NEW PROGRAM - multiply matrix and quaternion by new one each time. see if result stays the same.#
//THIS VERSION FOR 4x4

var qa=random_quat_pair();
var mata = convert_quats_to_4matrix(qa);	//todo pass in as pair variable?

var qb=random_quat_pair();
var matb = convert_quats_to_4matrix(qb);	//todo pass in as pair variable?

//multiply together matrices
var matProduct = multiply_4matrices(mata, matb);
var qp= multiply_qpairs(qa,qb);


for (var it=0;it<500000;it++){
	var qnew=random_quat_pair();
	var newmat = convert_quats_to_4matrix(qnew);
	
	qp= multiply_qpairs(qp,qnew);
	matProduct = multiply_4matrices(matProduct, newmat);
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



function mylog(obj){
	console.log(JSON.stringify(obj));
}


function new_empty_matrix(){
	return [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
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

//function _convert_quat_to_matrix(q,m)

function convert_quats_to_4matrix(qpair){
	var q1=qpair[0], q2=qpair[1];
	
	var m = new_empty_matrix();
	
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

	m[0][0]=a1a2-b1b2-c1c2-d1d2;	m[0][1]=-a1b2-b1a2+c1d2-d1c2;	m[0][2]=-a1c2-b1d2-c1a2+d1b2;	m[0][3]=-a1d2+b1c2-c1b2-d1a2;
	m[1][0]=b1a2+a1b2-d1c2+c1d2;	m[1][1]=-b1b2+a1a2+d1d2+c1c2;	m[1][2]=-b1c2+a1d2-d1a2-c1b2;	m[1][3]=-b1d2-a1c2-d1b2+c1a2;
	m[2][0]=c1a2+d1b2+a1c2-b1d2;	m[2][1]=-c1b2+d1a2-a1d2-b1c2;	m[2][2]=-c1c2+d1d2+a1a2+b1b2;	m[2][3]=-c1d2-d1c2+a1b2-b1a2;
	m[3][0]=d1a2-c1b2+b1c2+a1d2;	m[3][1]=-d1b2-c1a2-b1d2+a1c2;	m[3][2]=-d1c2-c1d2+b1a2-a1b2;	m[3][3]=-d1d2+c1c2+b1b2+a1a2;
	
	//matrices(m,1,1)=asq+bsq-csq-dsq  :matrices(m,1,2)=2.0*(b*c-a*d)   :matrices(m,1,3)=2.0*(b*d+a*c)
	//matrices(m,2,1)=2.0*(b*c+a*d)    :matrices(m,2,2)=asq-bsq+csq-dsq :matrices(m,2,3)=2.0*(c*d-a*b)
	//matrices(m,3,1)=2.0*(b*d-a*c)    :matrices(m,3,2)=2.0*(c*d+a*b)   :matrices(m,3,3)=asq-bsq-csq+dsq
	
	return m;
}



function multiply_quaternions(a,b){
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

//function _multiply_matrices(prod,a,b)		//skipped since don't need 3matrix code.

function multiply_4matrices(a,b){
	var prod = [];
	for (var row=0;row<4;row++){
		prod[row]=[];
		for (var col=0;col<4;col++){
			prod[row][col]=0;
			for (var ii=0;ii<4;ii++){
				prod[row][col]+=a[row][ii]*b[ii][col];
			}
		}
	}
	return prod;
}

//function _copy_matrix(m_from,m_to)	//skipped since don't need 3matrix code.

//todo use matrix library for this. using this initially so minimal changes from dbp code.
//note also has matrix as array of arrays rather than flat.

function copy_4matrix(m_from,m_to){
	for (var ii=0;ii<4;ii++){
		for (var jj=0;jj<4;jj++){
			m_to[ii][jj] = m_from[ii][jj];
		}
	}
}

function copy_quaternion(q_from,q_to){
	for (var ii=0;ii<4;ii++){
		q_to[ii] = q_from[ii];
	}
}