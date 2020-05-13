
//some stuff to augment perlin library.
//TODO own perlin funcs, or modify perlin lib to wrap in desired way.

function sumPerlin(ii,jj,kk,amplscale){
	//seems perlin lib doesn't have many options. want something with discernable texture over more length scales.
	var total=0;
	var colorScale=6;
	var amplitude=1.5;
	for (var iter=0;iter<1;iter++){
		colorScale/=2;
		amplitude/=amplscale;	//TODO sum series to normalise sum of amplitudes
		total+=amplitude*noise.perlin3(ii/colorScale,jj/colorScale,kk/colorScale);	//TODO consistent random offsets for levels (so doesn't spike at 0)
	}
	return total;
}

function sumPerlinWrap(ii,jj,kk,amplscale){
	//seems perlin lib doesn't have many options. want something with discernable texture over more length scales.
	var total=0;
	var colorScale=1;
	var amplitude=1.5;
	for (var iter=0;iter<1;iter++){
		colorScale/=2;
		amplitude/=amplscale;	//TODO sum series to normalise sum of amplitudes
		total+=amplitude*wrapPerlin(ii/colorScale,jj/colorScale,kk/colorScale,4);	//TODO consistent random offsets for levels (so doesn't spike at 0)
	}
	return total;
}

//seems like perlin library using does not wrap. TODO for cleanliness write own perlin (wrapping should be fairly easy) 
//for now bodge averaging 8 samples
function wrapPerlin(ii,jj,kk,wrapscale){
	//fudge to handle some -ve values
	ii+=wrapscale;
	jj+=wrapscale;
	kk+=wrapscale;
	
	ii%=wrapscale;
	jj%=wrapscale;
	kk%=wrapscale;
	
	var ii_fract = ii/wrapscale;
	var jj_fract = jj/wrapscale;
	var kk_fract = kk/wrapscale;
	
	var ii_otherfract = 1-ii_fract;
	var jj_otherfract = 1-jj_fract;
	var kk_otherfract = 1-kk_fract;
	
	var sum=0;
	
	sum+=noise.perlin3(ii, jj, kk)* ii_fract*jj_fract*kk_fract;
	sum+=noise.perlin3(ii, jj, kk+wrapscale)* ii_fract*jj_fract*kk_otherfract;
	sum+=noise.perlin3(ii, jj+wrapscale, kk)* ii_fract*jj_otherfract*kk_fract;
	sum+=noise.perlin3(ii, jj+wrapscale, kk+wrapscale)* ii_fract*jj_otherfract*kk_otherfract;
	sum+=noise.perlin3(ii+wrapscale, jj, kk)* ii_otherfract*jj_fract*kk_fract;
	sum+=noise.perlin3(ii+wrapscale, jj, kk+wrapscale)* ii_otherfract*jj_fract*kk_otherfract;
	sum+=noise.perlin3(ii+wrapscale, jj+wrapscale, kk)* ii_otherfract*jj_otherfract*kk_fract;
	sum+=noise.perlin3(ii+wrapscale, jj+wrapscale, kk+wrapscale)* ii_otherfract*jj_otherfract*kk_otherfract;
	
	return sum/8;	//not equivalent to wrapping perlin - generally result will be smaller.
}