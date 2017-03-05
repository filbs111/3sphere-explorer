
function xyzmove4mat(mat, movevector){
	//movevector is axis*angle
	//rotating x,y,z into w (3rd )
	
	//just make a fresh matrix, then multiply the input matrix by that.
	var newMatrix = mat4.create();
	var moveLength = Math.sqrt(movevector[0]*movevector[0] + movevector[1]*movevector[1] + movevector[2]*movevector[2]);
	var sAng = Math.sin(moveLength);
	var cAng = Math.cos(moveLength);


	//basically the matrix rows / columns (which way around )should be a vector for each of the 4 points x=1, y=1, z=1, w=1, rotated.
	//work these out, then insert into a matrix (try row, column), rotate
	var normFactor = sAng/moveLength;
	var newW= [ -normFactor*movevector[0], -normFactor*movevector[1], -normFactor*movevector[2], cAng];
	//x starts as [1,0,0,0]. if movevector is along x, becomes [cAng,0,0,sAng]. if movevector perpendicular to x, stays as [1,0,0,0]
	//let's guess... ( suspect there may be cross terms though)
	var reducedCircleRad = movevector[0]/moveLength;
	var reducedNormFactor = sAng*reducedCircleRad;
	//guess at signs - seems like a cross producty kind of thing
	var newX= [1.0- (1.0-cAng)*reducedCircleRad*reducedCircleRad,
								-(1.0-cAng)*reducedCircleRad*(movevector[1]/moveLength), 
													-(1.0-cAng)*reducedCircleRad*(movevector[2]/moveLength),
																				reducedNormFactor]; //*(movevector[0]/moveLength)];
	
	var reducedCircleRad = movevector[1]/moveLength;
	var reducedNormFactor = sAng*reducedCircleRad;
	//guess at signs - seems like a cross producty kind of thing
	var newY= [-(1.0-cAng)*reducedCircleRad*(movevector[0]/moveLength),
								1.0- (1.0-cAng)*reducedCircleRad*reducedCircleRad,
														-(1.0-cAng)*reducedCircleRad*(movevector[2]/moveLength),
																				reducedNormFactor];	//*(movevector[1]/moveLength)];
	
	var reducedCircleRad = movevector[2]/moveLength;
	var reducedNormFactor = sAng*reducedCircleRad;
	var newZ= [-(1.0-cAng)*reducedCircleRad*(movevector[0]/moveLength),
								-(1.0-cAng)*reducedCircleRad*(movevector[1]/moveLength),
														1.0- (1.0-cAng)*reducedCircleRad*reducedCircleRad,
																				reducedNormFactor];

	//calculate lengths - should be 1
	console.log("length squared newX : " + ( newX[0]*newX[0] + newX[1]*newX[1] + newX[2]*newX[2] + newX[3]*newX[3]));
	console.log("length squared newY : " + ( newY[0]*newY[0] + newY[1]*newY[1] + newY[2]*newY[2] + newY[3]*newY[3]));
	console.log("length squared newZ : " + ( newZ[0]*newZ[0] + newZ[1]*newZ[1] + newZ[2]*newZ[2] + newZ[3]*newZ[3]));
	console.log("length squared newW : " + ( newW[0]*newW[0] + newW[1]*newW[1] + newW[2]*newW[2] + newW[3]*newW[3]));
	console.log(newW);
	console.log(newX);
	
	//lengths of columns should also be 1
	console.log("length squared col0 : " + ( newX[0]*newX[0] + newY[0]*newY[0] + newZ[0]*newZ[0] + newW[0]*newW[0]));
	console.log("length squared col1 : " + ( newX[1]*newX[1] + newY[1]*newY[1] + newZ[1]*newZ[1] + newW[1]*newW[1]));
	console.log("length squared col2 : " + ( newX[2]*newX[2] + newY[2]*newY[2] + newZ[2]*newZ[2] + newW[2]*newW[2]));
	console.log("length squared col3 : " + ( newX[3]*newX[3] + newY[3]*newY[3] + newZ[3]*newZ[3] + newW[3]*newW[3]));

	
	//set matrix components (not sure if rows or columns better)
	newMatrix[0] = newX[0];		newMatrix[1] = newX[1];		newMatrix[2] = newX[2];		newMatrix[3] = newX[3];
	newMatrix[4] = newY[0];		newMatrix[5] = newY[1];		newMatrix[6] = newY[2];		newMatrix[7] = newY[3];
	newMatrix[8] = newZ[0];		newMatrix[9] = newZ[1];		newMatrix[10] = newZ[2];	newMatrix[11] = newZ[3];
	newMatrix[12] = newW[0];	newMatrix[13] = newW[1];	newMatrix[14] = newW[2];	newMatrix[15] = newW[3];


	
	mat4.multiply(mat, newMatrix);

}

function xmove4mat(mat, angle){
	rotate4mat(mat, 0, 3, angle);
	return mat;
}
function ymove4mat(mat, angle){
	rotate4mat(mat, 1, 3, angle);
	return mat;
}
function zmove4mat(mat, angle){
	rotate4mat(mat, 2, 3, angle);
	return mat;
}

function xyzrotate4mat(mat, rotatevector){
	//angle/axis rotation.
	//just make a fresh matrix, then multiply the input matrix by that.
	var newMatrix = mat4.identity();
	var rotationMag = Math.sqrt(rotatevector[0]*rotatevector[0] + rotatevector[1]*rotatevector[1] + rotatevector[2]*rotatevector[2]);
	mat4.rotate(newMatrix, rotationMag, [rotatevector[0]/rotationMag, rotatevector[1]/rotationMag, rotatevector[2]/rotationMag] );
	mat4.multiply(mat, newMatrix);
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