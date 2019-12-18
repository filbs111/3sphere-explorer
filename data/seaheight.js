//something to look up height of sea. equation should match sea shader.
//see index.html: <script id="shader-texmap-vs-duocylinder-sea" type="x-shader/x-vertex">
var getSeaHeight = (function(){
	var tau = 6.2831853;
	var someConstant = 0.4;	//affects speed of animation
	var wavePosAccum;
	var currentTime;
	var wavePosIn;
	
	function addWaveContribution(peakiness, waveCycles){	
		var invWavelength = Math.sqrt(waveCycles[0]*waveCycles[0] + waveCycles[1]*waveCycles[1]);	//TODO "hardcode" invWavelenth, freq, ampl as input function call - can calculate at startup and return function(pos,tt) that includes addWaveContribution with relevant parameters
		var freq = someConstant*Math.sqrt(invWavelength);
		freq=Math.ceil(freq);
		
		var dotProd = waveCycles[0]*wavePosIn[0] + waveCycles[1]*wavePosIn[1];
		var phase = tau* (currentTime*freq + dotProd);	
		
		var ampl = peakiness/(invWavelength*tau);
		var multiplier = ampl*Math.cos(phase)/invWavelength;
		
		wavePosAccum[0]+= multiplier*waveCycles[0];
		wavePosAccum[1]+= multiplier*waveCycles[1];
		wavePosAccum[2]+= ampl*Math.sin(phase);
	}
	
	return function(pos,tt){	//pos is [xx,yy]
		wavePosAccum = [pos[0],pos[1],0.02];
		currentTime=tt;
		wavePosIn=pos;
	//	addWaveContribution(0.15, [4.0,0.0]);
	//	addWaveContribution(0.15, [0.0,2.0]);
	//	addWaveContribution(0.15, [3.0,0.0]);
	//	addWaveContribution(0.15, [7.0,0.0]);
	//	addWaveContribution(0.15, [0.0,6.0]);
	//	addWaveContribution(0.15, [1.0,1.0]);
		
		addWaveContribution(0.15, [1.0,9.0]);
		addWaveContribution(0.15, [-13.0,2.0]);
		addWaveContribution(0.15, [3.0,-7.0]);
		addWaveContribution(0.15, [-4.0,5.0]);
		console.log(wavePosAccum);
		return wavePosAccum;
	}
})();