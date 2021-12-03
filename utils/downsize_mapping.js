var downsizeMapping = (function(size){
    downsizeMappingArr = new Array(2*size);

    downsizeMappingArr[0]=0;    //really undefined, but want some benign for use in shaders
                                //though shader should multiply by 0 anyway

    for (var step=2;step<=size;step*=2){
        var halfstep = step/2;
        for (var ii=0;ii<size*2;ii+=step){
            downsizeMappingArr[ii+halfstep] = ii;
        }
    }

    return downsizeMappingArr;
})(1024);

function downsizePair(ii,jj){
    var coordOr = ii | jj;
    var mappedOr = downsizeMapping[coordOr];
    var bitmask = ~(coordOr- mappedOr);
    var mappedx = bitmask&ii;
    var mappedy = bitmask&jj;
    // return {mappedx, mappedy}
    return mappedx*(1024+1) + mappedy;  //beware hardcoded grid size
}

function downsizePairPrint(ii,jj){
    var coordOr = ii | jj;
    var mappedOr = downsizeMapping[coordOr];
    var bitmask = ~(coordOr- mappedOr);

    console.log({coordOr, mappedOr, bitmask});

    var mappedx = bitmask&ii;
    var mappedy = bitmask&jj;
    return {mappedx, mappedy}
}

//note doing this way is hacky, maybe slow. TODO either generate 2d downsize mapping, or run through 
//multiple scales directly rather than generating mapping...