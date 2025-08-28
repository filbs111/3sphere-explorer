function findOrthoVecByDiags(inputVecs){
    //do 4d x-prod

    //apparently determinant is something like 
    //multiplying together diagonals... 
    // https://www.youtube.com/watch?v=z5Yf7QwrotE

    var results = [];

    for (var cc=0;cc<4;cc++){
        var sum = 0;
        for (var aa=0;aa<3;aa++){
            var positiveproduct=1;
            var negativeproduct=1;
            for (var bb=0;bb<3;bb++){
                positiveproduct *= inputVecs[bb][(cc+1+(aa+bb)%3)%4];
                negativeproduct *= inputVecs[bb][(cc+1+(aa+2-bb)%3)%4];
            }
            //console.log(positiveproduct, negativeproduct);
            sum+=positiveproduct-negativeproduct;
        }

        //console.log(sum);

        results.push(sum);
    }

    results[0]=-results[0]; //this apparently works. not sure why! guess could flip indices 1,3 instead
    results[2]=-results[2];
 
    return results;
}