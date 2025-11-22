//2025 starting afresh to test some things. 
// start by finding approximate solutions for simple case - atmos density of exp(x^2)
// to make easier, map the single circle to a double loop - ie half circuit of original circle is full circuit of new circle.

var atmosContrast = 50;

function atmosDensityNewCircle(angle){
    return Math.exp(logAtmosDensityNewCircle(angle));
}

function logAtmosDensityNewCircle(angle){
    return atmosContrast*Math.sin(angle);
}

function simpleNumericalIntegral(startAngle, endAngle, numSteps){
    var angleDifference = endAngle-startAngle;
    var angleStep = angleDifference/numSteps;
    var sum=0;
    
    for (var ii=0, angle = startAngle+angleStep/2;ii<numSteps;ii++, angle+=angleStep){
        var density = atmosDensityNewCircle(angle);
        sum+=density;
    }

    //debug
    // console.log({
    //     angleDifference,
    //     angleStep,
    //     sum
    // });

    return sum*angleStep;
}

function expSectionsIntegral(startAngle, endAngle, numSteps){
    var angleDifference = endAngle-startAngle;
    var angleStep = angleDifference/numSteps;

    //each linear section is exp(x)
    //FWIW we eventually want to do exp(sum)
    
    var sum = 0;

    for (var ii=0, angle = startAngle;ii<numSteps;ii++, angle+=angleStep){

        var sectionEndAngle = angle+angleStep;

        //total atmos in section from angle A to B is.
        // exp(c*sin(a)) * integral 0 to 1 ( exp(ckt) dt)
        // where k = sin(b)-sin(a)
        // = 1/(c(sin(b)-sin(a))) *  (exp(c sin(a)) ( exp(c sin(b)- c sin(a)) - exp(0) ) ???
        // = 1/(c(sin(b)-sin(a))) *  ( exp(c sin(b)) - exp(c sin(a)) ) ???
        // therefore to sum up, sample point not on ends contributes 

        var startDensity = atmosDensityNewCircle(angle);
        var endDensity = atmosDensityNewCircle(sectionEndAngle);

        //sines are calculated twice - below and in the calls made to calculate atmos density. TODO reuse?
        // consecutive sections also could reuse
        //differences in sines might be expressed as cosine? 
        var contribution = (endDensity-startDensity)/(atmosContrast*(Math.sin(sectionEndAngle) - Math.sin(angle)));

        sum+=contribution;
    }

    return sum*angleStep;
        //TODO reuse calculations to make faster
        //TODO scale polygonal circle so half within/without circle?
        //TODO put division by atmosContrast out of loop
        //TODO multiply together transmission at each increment, because eventually want to do exp(-totalatmos) for
        //transmission anyway, and avoids sums going out of number range.
        //TODO compare ratio of total absorption for approximations

        //this is more accurate than simpleNumericalIntegral for same numSteps, but steps are more expensive.
        // seems maybe doubling simple method steps gets similar accuracy at atmosContrast=20
        //with higher atmos contrast, seems more worthwhile to use the complex method.
}



function runTest(fromAngle, toAngle){
    if (isNaN(fromAngle) || isNaN(toAngle)){return "should specify angles!";}

    var result1 = simpleNumericalIntegral(fromAngle, toAngle, 18);
    var result2 = simpleNumericalIntegral(fromAngle, toAngle, 100);
    var result3 = simpleNumericalIntegral(fromAngle, toAngle, 100_000);

    var result1_a = expSectionsIntegral(fromAngle, toAngle, 5);
    var result2_a = expSectionsIntegral(fromAngle, toAngle, 100);
    var result3_a = expSectionsIntegral(fromAngle, toAngle, 100_000);

    return {
        result1,
        result2,
        result3,
        ratio:result1/result3,
        result1_a,
        result2_a,
        result3_a,
        ratio_a:result1_a/result3_a
    }
}

function runSpeedTest(fromAngle, toAngle, numIts){
    //TODO randomise inputs to rule out effect of cache?

    var startTime, finishTime;

    startTime=performance.now();

    for(var ii=0;ii<numIts;ii++){
        simpleNumericalIntegral(fromAngle, toAngle, 100);
    }
    
    finishTime = performance.now();

    var simpleTime = finishTime-startTime;

    startTime = finishTime;

    for(var ii=0;ii<numIts;ii++){
        expSectionsIntegral(fromAngle, toAngle, 100);
    }

    finishTime = performance.now();

    var expSectionsTime = finishTime-startTime;

    console.log({
        simpleTime,
        expSectionsTime
    })
}