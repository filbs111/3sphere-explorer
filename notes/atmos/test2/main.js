//2025 starting afresh to test some things. 
// start by finding approximate solutions for simple case - atmos density of exp(x^2)
// to make easier, map the single circle to a double loop - ie half circuit of original circle is full circuit of new circle.

var atmosContrast = 50;

function atmosDensityNewCircle(angle, bodgeScale=1){
    return Math.exp(bodgeScale*logAtmosDensityNewCircle(angle));
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

    //var bodgeScale = 1/Math.sqrt(Math.cos(angleStep/2));
    //var bodgeScale = 2/(1+Math.cos(angleStep/2));   //about same but no sqrt
    var bodgeScale = 1+Math.pow(angleStep/4,2);   //~same, small angle approx
        //try scaling polygon up so ~half in, out of circle

    for (var ii=0, angle = startAngle;ii<numSteps;ii++, angle+=angleStep){

        var sectionEndAngle = angle+angleStep;

        //total atmos in section from angle A to B is.
        // exp(c*sin(a)) * integral 0 to 1 ( exp(ckt) dt)
        // where k = sin(b)-sin(a)
        // = 1/(c(sin(b)-sin(a))) *  (exp(c sin(a)) ( exp(c sin(b)- c sin(a)) - exp(0) ) ???
        // = 1/(c(sin(b)-sin(a))) *  ( exp(c sin(b)) - exp(c sin(a)) ) ???
        // therefore to sum up, sample point not on ends contributes 

        var startDensity = atmosDensityNewCircle(angle, bodgeScale);
        var endDensity = atmosDensityNewCircle(sectionEndAngle, bodgeScale);

        //sines are calculated twice - below and in the calls made to calculate atmos density. TODO reuse?
        // consecutive sections also could reuse
        //differences in sines might be expressed as cosine? 
        var contribution = (endDensity-startDensity)/(Math.sin(sectionEndAngle) - Math.sin(angle));

        sum+=contribution;
    }

    return sum*angleStep/atmosContrast;
}


//expSectionsIntegral2 dedupes sin, exp calls to make ~2x faster than expSectionsIntegral
function expSectionsIntegral2(startAngle, endAngle, numSteps){
    var angleDifference = endAngle-startAngle;
    var angleStep = angleDifference/numSteps;

    //each linear section is exp(x)
    //FWIW we eventually want to do exp(sum)
    
    var sum = 0;

    var sectionStartAngle = startAngle;
    var sinSectionStartAngle = Math.sin(startAngle);
    var startDensity = atmosDensityNewCircle(sectionStartAngle);

    for (var ii=0, sectionEndAngle = startAngle+angleStep;ii<numSteps;ii++, sectionEndAngle+=angleStep){

        var sinSectionEndAngle = Math.sin(sectionEndAngle);
       

        //total atmos in section from angle A to B is.
        // exp(c*sin(a)) * integral 0 to 1 ( exp(ckt) dt)
        // where k = sin(b)-sin(a)
        // = 1/(c(sin(b)-sin(a))) *  (exp(c sin(a)) ( exp(c sin(b)- c sin(a)) - exp(0) ) ???
        // = 1/(c(sin(b)-sin(a))) *  ( exp(c sin(b)) - exp(c sin(a)) ) ???
        // therefore to sum up, sample point not on ends contributes 

        //var endDensity = atmosDensityNewCircle(sectionEndAngle);
        var endDensity = Math.exp(atmosContrast*sinSectionEndAngle);

        var contribution = (endDensity-startDensity)/(sinSectionEndAngle - sinSectionStartAngle);

        sum+=contribution;

        sectionStartAngle = sinSectionEndAngle;
        sinSectionStartAngle = sinSectionEndAngle;
        startDensity = endDensity;
    }

    return sum*angleStep/atmosContrast;
        //TODO scale polygonal circle so half within/without circle?
        //TODO multiply together transmission at each increment, because eventually want to do exp(-totalatmos) for
        //transmission anyway, and avoids sums going out of number range.
        //TODO compare ratio of total absorption for approximations
        //TODO importance sampling - put more samples at densest point. 
        // NOTE importance sampling with just simpleNumericalIntegral might work OK

        //this is more accurate than simpleNumericalIntegral for same numSteps, but steps are more expensive.
        // seems maybe doubling simple method steps gets similar accuracy at atmosContrast=20
        //with higher atmos contrast, seems more worthwhile to use the complex method.

        //edit - was more accurate for eg from 0.1 to 1, but less accurate for from 0.2 to 3 ! 
        //maybe the big issue is with passing PI/2 (max sin(x), atmos density)
}



function runTest(fromAngle, toAngle){
    if (isNaN(fromAngle) || isNaN(toAngle)){return "should specify angles!";}

    var result1 = simpleNumericalIntegral(fromAngle, toAngle, 4);
    var result2 = simpleNumericalIntegral(fromAngle, toAngle, 100);
    var result3 = simpleNumericalIntegral(fromAngle, toAngle, 100_000);

    var result1_a = expSectionsIntegral(fromAngle, toAngle, 4);
    var result2_a = expSectionsIntegral(fromAngle, toAngle, 100);
    var result3_a = expSectionsIntegral(fromAngle, toAngle, 100_000);

    var result1_a2 = expSectionsIntegral2(fromAngle, toAngle, 4);
    var result2_a2 = expSectionsIntegral2(fromAngle, toAngle, 100);
    var result3_a2 = expSectionsIntegral2(fromAngle, toAngle, 100_000);


    return {
        result1,
        result2,
        result3,
        ratio:result1/result3,
        result1_a,
        result2_a,
        result3_a,
        ratio_a:result1_a/result3_a,
        result1_a2,
        result2_a2,
        result3_a2,
        ratio_a2:result1_a2/result3_a2
    }
}

function runSpeedTest(fromAngle, toAngle, numIts){
    //TODO randomise inputs to rule out effect of cache?

    var startTime, finishTime;

    startTime=performance.now();

    for(var ii=0;ii<numIts;ii++){
        //fromAngle=Math.random()*0.1+0.1;
        simpleNumericalIntegral(fromAngle, toAngle, 20);
    }
    
    finishTime = performance.now();

    var simpleTime = finishTime-startTime;

    startTime = finishTime;

    for(var ii=0;ii<numIts;ii++){
        //fromAngle=Math.random()*0.1+0.1;
        expSectionsIntegral(fromAngle, toAngle, 20);
    }

    finishTime = performance.now();

    var expSectionsTime = finishTime-startTime;


    startTime = finishTime;

    for(var ii=0;ii<numIts;ii++){
        //fromAngle=Math.random()*0.1+0.1;
        expSectionsIntegral2(fromAngle, toAngle, 20);
    }

    finishTime = performance.now();

    var expSectionsTime2 = finishTime-startTime;


    console.log({
        simpleTime,
        expSectionsTime,
        expSectionsTime2
    })
}