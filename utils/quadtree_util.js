const MIN_SIZE = 32;
const MULTIPLIER = 2.5;

//one of many options from terrainTest project
function quadtreeShouldSplitFuncEffectiveArea(x,y,z,size){
    //NOTE this may be inefficient!

    //ensure x, y between -512, 512 ( below code assumes that )
    x-=512;
    y-=512;
    x = x - 1024*(Math.floor(x/1024));
    y = y - 1024*(Math.floor(y/1024));
    x-=512;
    y-=512;

    var alpha = Math.PI/4 + z/500;
    var cosa = Math.cos(alpha);
    var sina = Math.sin(alpha);

    var halfSquareShift = size/2;
    var xstart = x-halfSquareShift;
    var xend = x+halfSquareShift;
    var ystart = y-halfSquareShift;
    var yend = y+halfSquareShift;

    xstart = Math.abs(xstart);
    xend = Math.abs(xend);
    ystart = Math.abs(ystart);
    yend = Math.abs(yend);

    var cosumax = Math.cos(2*Math.PI * Math.min(xstart, xend)/1024);
    var cosvmax = Math.cos(2*Math.PI * Math.min(ystart, yend)/1024);

    var cosumin = Math.cos(2*Math.PI * Math.max(xstart, xend)/1024);
    var cosvmin = Math.cos(2*Math.PI * Math.max(ystart, yend)/1024);

    //TODO are these necessary? is similar needed for x,y ~ half grid size? , so cosine = -1?
    if (Math.abs(x)<size/2){
        cosumax=1;
    }
    if (Math.abs(y)<size/2){
        cosvmax=1;
    }

    if (Math.abs(x)> (1024-size)/2){
        cosumin=-1;
    }
    if (Math.abs(y)> (1024-size)/2){
        cosvmin=-1;
    }

    //find which combo produces the largest square?
    var square1 = Math.pow( cosa*cosumax +sina*cosvmax ,2);
    var square2 = Math.pow( cosa*cosumax +sina*cosvmin ,2);
    var square3 = Math.pow( cosa*cosumin +sina*cosvmax ,2);
    var square4 = Math.pow( cosa*cosumin +sina*cosvmin ,2);
    var best = Math.max(square1, square2, square3, square4);

    return 220 * Math.sqrt(1-0.5*best) < MULTIPLIER*size;
}

function calculateQuadtree(viewpointPos, thisPart){
    //TODO put to obj so can extract quadtree for rendering, or provide some render() function

    thisPart.totalLeafs=1;  //if no subdivision

    var halfSize = thisPart.size/2;

    //decide if should split. various options for equation..
    var centrex = thisPart.xpos + halfSize;
    var centrey = thisPart.ypos + halfSize;
    var xdisplacement = viewpointPos.x - centrex;
    var ydisplacement = viewpointPos.y - centrey;

    var shouldSplit = quadtreeShouldSplitFuncEffectiveArea(xdisplacement, ydisplacement, viewpointPos.z, thisPart.size);

    // shouldSplit = true;  //4096 nodes as expect ( (2048/32)^2 )

    shouldSplit = shouldSplit && (thisPart.size>MIN_SIZE);

    if (shouldSplit){
        var children = [];
        
        children.push(calculateQuadtree(viewpointPos, {xpos:thisPart.xpos, ypos:thisPart.ypos, size:halfSize}));
        children.push(calculateQuadtree(viewpointPos, {xpos:thisPart.xpos+halfSize, ypos:thisPart.ypos, size:halfSize}));
        children.push(calculateQuadtree(viewpointPos, {xpos:thisPart.xpos, ypos:thisPart.ypos+halfSize, size:halfSize}));
        children.push(calculateQuadtree(viewpointPos, {xpos:thisPart.xpos+halfSize, ypos:thisPart.ypos+halfSize, size:halfSize}));
        thisPart.children = children;
        thisPart.totalLeafs = children.reduce(function(result, item){return result + item.totalLeafs},0);
    }

    return thisPart;
}

function renderQuadtree(quadTree, drawBlock){
    if (!quadTree){
        return; //inefficient. TODO ensure always defined
    }

    if (quadTree.totalLeafs == 1){
        drawBlock(quadTree.xpos, quadTree.ypos, quadTree.size);
    }else{
        quadTree.children.forEach(function(item){renderQuadtree(item, drawBlock);});
    }
}

// function getCanvasDrawBlockFunc(ctx){
//     return function(xpos,ypos,size){
//         ctx.fillRect(xpos, ypos, size, size);
//         ctx.strokeRect(xpos, ypos, size, size);
//     }
// };