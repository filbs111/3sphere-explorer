
var explosionParticleArrs = (function(numworlds){
    var blockLen = 128;	//number of particles in an explosion.
    var numBlocks = 64;
    var arrayLen = blockLen*numBlocks;	// = 8192
    //initial implementation - start all particles. later should store larger number of particles, update subset for new explosion
    //initially just use random direction/speed. should be able to make a particle explosion with a velocity, direction too though, with speeds that loop.

    var dirn=new Array(4);
    var newPosn=new Array(4);
    var newDirn=new Array(4);
    //var dirvec3;

    var ExplosionParticleArr = function(){
        //something containing set of position and direction of particles that will draw using shader.
        //each particle has 2 orthogonal 4-vectors, position at time t = position*cos(t) + direction*sin(t)
        
        this.blockStartTimes = new Array(numBlocks);
        this.nextBlock = 0;
        
        this.posnDirnsI16 = new Int16Array(blockLen*8);
        this.colrsUI8 = new Uint8ClampedArray(blockLen*4);
        //var posnDirnsGlBuffer;	//TODO can gl be got before get to this IIFE? 
        //var colrsGlBuffer;
            //ideally buffers should be position, direction, positon, direction .... to reduce calls to buffer sub data.
        //var blockOffs;
        
        
    };
    ExplosionParticleArr.prototype.makeExplosion = function(posn, time, colr, normalness){
        this.blockOffs = this.nextBlock*blockLen;
        this.blockStartTimes[this.nextBlock] = time;
        
        this.nextBlock = (this.nextBlock+1)%numBlocks;
        
        var mat = matForPos(posn);
        var time_angle = time*0.0005;	//matches number in shader simple-moving-billboard-vs.glsl
        var ct = Math.cos(time_angle);
        var st = Math.sin(time_angle);
        
        var ui8color = colr.map(elem=>Math.floor(elem*255));

        for (var pp=0;pp<blockLen;pp++){
            dirvec3 = randomNormalised3vec(normalness);	//get direction vector for time = 0
            //do a matrix multiplication. TODO use matrix methods to reduce code length!
            for (var bb=0;bb<4;bb++){
                dirn[bb]=0;
                for (var aa=0;aa<3;aa++){
                    dirn[bb]+=dirvec3[aa]*mat[aa*4+bb];
                }
                
                //rotate position and direction such that newposn*cos(time_angle) + newdirn*sin(time_angle) = posn
                // newposn = posn*cos(time_angle) - dirn*sin(time_angle)
                // newdirn = dirn*cos(time_angle) + posn*sin(time_angle)
                newPosn[bb]=posn[bb]*ct - dirn[bb]*st;
                newDirn[bb]=dirn[bb]*ct + posn[bb]*st;
                
                //convert from float to int16. int16 runs from -32768 to 32767. TODO find out exactly how shader "normalisation" maps this back to -1 to 1. for other uses eg static objects this may matter much more. note "Due to OpenGL ES 2.0 / WebGL 1.0 platform differences, some implementations may decode signed normalized integers to floating-point values differently" https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization 
                
                newPosn[bb] = Math.min(32767,Math.max(-32768,Math.floor(newPosn[bb]*32767)));	//alternatively use Math.round. unsure which is more correct. https://www.khronos.org/opengl/wiki/Normalized_Integer "Alternate mapping". unclear whether applies. using uint and 2x-1 in vert shader would resolve uncertainty, or do some experiment to discern whether MIN, -MAX are equivalent etc
                newDirn[bb] = Math.min(32767,Math.max(-32768,Math.floor(newDirn[bb]*32767)));
            }
            this.posnDirnsI16.set(newPosn, 8*pp);
            this.posnDirnsI16.set(newDirn, 8*pp+4);
            this.colrsUI8.set(ui8color, 4*pp);
        }
        bufferArraySubDataGeneral(this.posnDirnsGlBuffer, this.blockOffs*16, this.posnDirnsI16);
        bufferArraySubDataGeneral(this.colrsGlBuffer, this.blockOffs*4, this.colrsUI8);
    };
    ExplosionParticleArr.prototype.getBuffers = function(){
        return {posns:this.posnDirnsGlBuffer, colrs:this.colrsGlBuffer}
    };
    ExplosionParticleArr.prototype.getRangesToDraw = function(time){
        //since particle lifetimes fixed, and created in array, should be 0,1 or 2 contiguous ranges of particles that should draw.]
        //this is simple/easy method.
        // note: alternate method :set expiry time as shader variable, shrink vertices to point if expired. (could also use for hiding when will hit terrain))
        var activeRange = false;
        var ranges = [];
        for (var bb=0;bb<numBlocks;bb++){
            if ( (time - this.blockStartTimes[bb]) < 1000 ){	//block should be drawn
                if (!activeRange){
                    activeRange = {start:bb*blockLen,number:0};
                    ranges.push(activeRange);
                }
                activeRange.number+=blockLen;
            }else{
                activeRange=false;
            }
        }
        return ranges;
    };
    ExplosionParticleArr.prototype.init = function(){
        this.posnDirnsGlBuffer = gl.createBuffer();
        this.colrsGlBuffer = gl.createBuffer();
        //some initial data
        
        //seems like have to initialise GL buffer in entirety first. (is this necessary?).
        bufferArrayDataGeneral(this.posnDirnsGlBuffer, new Int16Array(arrayLen*8), 4);
        bufferArrayDataGeneral(this.colrsGlBuffer, new Uint8Array(arrayLen*4), 4);
        
        for (var bb=0;bb<numBlocks;bb++){
            this.makeExplosion([1,0,0,0],-10000,[1,1,1,1],0);	//fill arrays with some dummy data (is this necessary?) TODO stop this dummy data from rendering (disable depth write, make transparent? only draw active particles?
        }
    }

    var arrToReturn = [];
    for (var ww=0;ww<numworlds;ww++){
        arrToReturn.push(new ExplosionParticleArr());
    }

    return arrToReturn;
})(6);