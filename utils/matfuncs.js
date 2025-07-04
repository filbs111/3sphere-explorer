
//pool for matrices
var matPool = (function makeMatPool(){
	var thePool = [];
	var numSpare = 0;
	return {
		create:function(){
			if (numSpare>0){
				numSpare--;
				return thePool[numSpare];
			}else{
				var newMat = mat4.create();
				thePool.push(newMat);
				return newMat;
			}
		},
		destroy:function(toBeDestroyed){	//might be bug prone since can keep using a matrix after "destroying" it!
			var theIndex = thePool.indexOf(toBeDestroyed);
			//if (theIndex!=-1){
			if (theIndex>=numSpare){
				var swap = thePool[theIndex];
				thePool[theIndex] = thePool[numSpare];
				thePool[numSpare] = swap;
				numSpare++;
				return true;
			}else{
				if (theIndex!=-1){
					console.log("attempting to delete a matrix from pool that has already been freed!");
					return false;
				}
				alert("whoops! attempting to delete matrix, not found in pool");
				return false;
			}
		},
		getMats:function(){	//just to test
			return {pool:thePool,numSpare:numSpare};
		}
	}
})();


var xyzmove4mat = (function generateXyzMove4mat(){
	
	var newMatrix = mat4.create();
	var movevector = new Array(3);

	return function xyzmove4mat(mat, movevectorin){
		//TODO take separate values input to save creating arrays.

	//TODO use a separate function and call as appropriate (otherwise wastes cycles checking here)
	if (mat.qPair){
		mat.qPair = multiply_qpairs( mat.qPair, makemovequatpair(scalarvectorprod(0.5,movevectorin)) );
		convert_quats_to_4matrix(mat.qPair, mat);	//this func now sets a matrix passed in to be equivalent to qpair
		return;
	}
	
	//movevector is axis*angle
	//rotating x,y,z into w (3rd )
	
	var moveLength = Math.sqrt(movevectorin[0]*movevectorin[0] + movevectorin[1]*movevectorin[1] + movevectorin[2]*movevectorin[2]);
	var sAng = Math.sin(moveLength);
	var cAng = Math.cos(moveLength);
	var cAngMinusOne = cAng-1;
	
	//basically the matrix rows / columns (which way around )should be a vector for each of the 4 points x=1, y=1, z=1, w=1, rotated.
	//work these out, then insert into a matrix (try row, column), rotate
	if (moveLength == 0){return;}	//avoid division by zero
	
	//unknown if changing passed in movevector will cause problems, so make new one
	for (var ii=0;ii<3;ii++){
		movevector[ii]=movevectorin[ii]/moveLength;
	}
	
	
	//newX
	newMatrix[0] = 1.0 + cAngMinusOne*movevector[0]*movevector[0];
	newMatrix[1] = cAngMinusOne*movevector[0]*movevector[1];
	newMatrix[2] = cAngMinusOne*movevector[0]*movevector[2];
	newMatrix[3] = sAng*movevector[0];
	
	//newY
	newMatrix[4] = cAngMinusOne*movevector[1]*movevector[0];
	newMatrix[5] = 1.0 + cAngMinusOne*movevector[1]*movevector[1];
	newMatrix[6] = cAngMinusOne*movevector[1]*movevector[2];
	newMatrix[7] = sAng*movevector[1];
	
	//newZ
	newMatrix[8] = cAngMinusOne*movevector[2]*movevector[0];
	newMatrix[9] = cAngMinusOne*movevector[2]*movevector[1];
	newMatrix[10] = 1.0 + cAngMinusOne*movevector[2]*movevector[2];
	newMatrix[11] = sAng*movevector[2];

	//newW:
	newMatrix[12] = -sAng*movevector[0];
	newMatrix[13] = -sAng*movevector[1];
	newMatrix[14] = -sAng*movevector[2];
	newMatrix[15] = cAng;

	mat4.multiply(mat, newMatrix);
}
})();

function xmove4mat(mat, angle){
	xyzmove4mat(mat, [angle,0,0]);
	return mat;
}
function ymove4mat(mat, angle){
	xyzmove4mat(mat, [0,angle,0]);
	return mat;
}
function zmove4mat(mat, angle){
	xyzmove4mat(mat, [0,0,angle]);
	return mat;
}

function xyzrotate4mat(mat, rotatevector){
	if (mat.qPair){
		mat.qPair = multiply_qpairs( mat.qPair , makerotatequatpair(scalarvectorprod(0.5,rotatevector)));
	}
	
	//angle/axis rotation.
	//just make a fresh matrix, then multiply the input matrix by that.
	var newMatrix = matPool.create();
	mat4.identity(newMatrix);
	var rotationMag = Math.sqrt(rotatevector[0]*rotatevector[0] + rotatevector[1]*rotatevector[1] + rotatevector[2]*rotatevector[2]);
	mat4.rotate(newMatrix, rotationMag, [rotatevector[0]/rotationMag, rotatevector[1]/rotationMag, rotatevector[2]/rotationMag] );
	mat4.multiply(mat, newMatrix);
	matPool.destroy(newMatrix);
}

function rotate4mat(mat, col1, col2, angle){
	rotate4matRows(mat, col1, col2, angle);	//convenient to switch between trying rows and columns
	return mat;
}

function rotate4matCols(mat, col1, col2, angle){
	//"rotate" the 4matrix about principal axes. unsure whether rows or columns consistent with other gl stuff
	//for the time being, just pick one and go with it. (going with columns)
	//maybe better to use angle/axis type rotation, but explicitly doing different rotations is easier to understand
	
	//4matrix is SO4, rotating col 0-2 into column 3 is a "translation" on the 3-sphere, rotating 0-2 into another column of 0-2 is like a rotation about a fixed point on the 3-sphere
	
	//todo how to add scaling into this.
	
	//the matrix is arraylike. mat[0] is top left c0r0, mat[1] is c1r0 etc
	var tempVal;
	var sAng = Math.sin(angle);
	var cAng = Math.cos(angle);
	for ( ;col1<16;col1+=4, col2+=4){
		tempVal = sAng*mat[col2] + cAng*mat[col1];
		mat[col2] = cAng*mat[col2] - sAng*mat[col1];
		mat[col1] = tempVal;
	}
}

function rotate4matRows(mat, row1, row2, angle){

	var tempVal;
	var sAng = Math.sin(angle);
	var cAng = Math.cos(angle);
	var idx1 = row1*4;
	var idx2 = row2*4;
	
	for (var idx =0;idx<4;idx++,idx1++, idx2++){
		tempVal = sAng*mat[idx2] + cAng*mat[idx1];
		mat[idx2] = cAng*mat[idx2] - sAng*mat[idx1];
		mat[idx1] = tempVal;
	}
}




function scalarvectorprod(sca,vec){
	return vec.map(function(val){return sca*val;});
}

function newIdMatWithQuats(){
	var newMat = mat4.identity();
	newMat.qPair = [[1,0,0,0],[1,0,0,0]];
	return newMat;
}

function makemovequatpair(move){
	//work out direction, length. move is a 3-vector
	var lengthsq = move[0]*move[0] + move[1]*move[1] + move[2]*move[2];
	if (lengthsq==0){return [[1,0,0,0],[1,0,0,0]];}	//handle no movement
	var length = Math.sqrt(lengthsq);
	var mult = Math.sin(length)/length;
	var q = [Math.cos(length), mult*move[0], mult*move[1], mult*move[2]];
	return [q,q];
}

function makerotatequatpair(rot){
	//work out direction, length. move is a 3-vector
	//var lengthsq = rot[0]*rot[0] + rot[1]*rot[1] + rot[2]*rot[2];
	//if (lengthsq==0){return [[1,0,0,0],[1,0,0,0]];}	//handle no movement
	//var length = Math.sqrt(lengthsq);
	
	var length = Math.hypot.apply(null, rot);
	if (length==0){return [[1,0,0,0],[1,0,0,0]];}	//handle no movement
	
	var mult = Math.sin(length)/length;
	var q = [Math.cos(length), -mult*rot[0], -mult*rot[1], -mult*rot[2]];
	var qc = [Math.cos(length), mult*rot[0], mult*rot[1], mult*rot[2]];
	return [q,qc];
}

function rotatequat_byquatpair(quat,qpair){
	return multiply_quaternions(multiply_quaternions(qpair[0],quat),qpair[1]);
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

function cleanupMat(mat){	//might do nothing
	normalise_qpair(mat.qPair);
	convert_quats_to_4matrix(mat.qPair,mat);
}

function convert_quats_to_4matrix(qpair, m){
	var q1=qpair[0], q2=qpair[1];
		
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

function transpose_mat_with_qpair(mat){
		//this might be invert, but matrices in question are SO4 so same thing.
	var qpair=mat.qPair;
	qpair[0][0]*=-1;
	qpair[1][0]*=-1;

	//should change code to not require keeping track of matrix part, maybe faster, but may as well
	mat4.transpose(mat);
}
function multiply_mat_with_qpair(matrix,tomultiplyby){
	var mqp=  tomultiplyby.qPair;
	matrix.qPair = multiply_qpairs(matrix.qPair,mqp);
	mat4.multiply(matrix, tomultiplyby);	//should be redundant.
}
function multiply_mat_with_qpair_transp(matrix, tomultiplyby){
	//bodge! very similar to above. - tomultiplyby is transposed
	var mqp=  tomultiplyby.qPair;
	matrix.qPair = multiply_qpairs(matrix.qPair,[[-mqp[0][0],mqp[0][1],mqp[0][2],mqp[0][3]],
		[-mqp[1][0],mqp[1][1],mqp[1][2],mqp[1][3]]]);
	
	var tmpTranspMat = mat4.create(tomultiplyby);
	mat4.transpose(tmpTranspMat);
	mat4.multiply(matrix, tmpTranspMat);	//should be redundant.
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


function copy_quaternion(q_from,q_to){
	for (var ii=0;ii<4;ii++){
		q_to[ii] = q_from[ii];
	}
}


function distBetween4mats(mat1,mat2){
	var p1 = mat1.slice(12);
	var p2 = mat2.slice(12);
	var disp = p1.map(function(elem,ii){return elem - p2[ii];});
	return Math.hypot.apply(null, disp);
}

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
	var logResults = resultsarrRowSq.map(function(val){return Math.log(val);});
	console.log(logResults);
}

function setMat4FromToWithQuats(fromMat, toMat){
	mat4.set(fromMat, toMat);
	for (var qq=0;qq<2;qq++){
		for (var ii=0;ii<4;ii++){
			toMat.qPair[qq,ii] = fromMat.qPair[qq,ii]
		}
	}
}

function halfAngleBetween4Vecs(vec1, vec2){
	var difflensq = 0;
	var sumlensq = 0;
	for (var ii=0;ii<4;ii++){
		var diff = vec1[ii] - vec2[ii];
		var sum = vec1[ii] + vec2[ii];
		difflensq+=diff*diff;
		sumlensq+=sum*sum;
	}
	return Math.atan2(Math.sqrt(difflensq), Math.sqrt(sumlensq));
}

function logMatInTable(mat){
	var matArr = Array.from(mat);
	var toLog = [...Array(4).keys()].map(ii => matArr.slice(ii*4, ii*4+4));
	console.table(toLog);
}

function makeTransposedMat(mat){
	var transposedMat = mat4.create(mat);
	mat4.transpose(transposedMat);
	return transposedMat;
}
