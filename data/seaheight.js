//something to look up height of sea. equation should match sea shader.
//see index.html: <script id="shader-texmap-vs-duocylinder-sea" type="x-shader/x-vertex">
var seaHeight = (function(){
	var tau = 6.2831853;
	var someConstant = 0.4;	//affects speed of animation
	var wavePosAccum;
	var currentTime;
	var wavePosIn;
	var zeroLevel = 0;
	
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
	
	return {
		get:function(pos,tt){	//pos is [xx,yy]
			wavePosAccum = [pos[0],pos[1],zeroLevel];
			currentTime=tt;
			wavePosIn=pos;
		//	addWaveContribution(0.15, [4.0,0.0]);
		//	addWaveContribution(0.15, [0.0,2.0]);
		//	addWaveContribution(0.15, [3.0,0.0]);
		//	addWaveContribution(0.3, [0.0,5.0]);
		//	addWaveContribution(0.15, [9.0,0.0]);
		//	addWaveContribution(0.15, [1.0,1.0]);
		
			addWaveContribution(0.15, [1.0,9.0]);
			addWaveContribution(0.15, [-13.0,2.0]);
			addWaveContribution(0.15, [3.0,-7.0]);
			addWaveContribution(0.15, [-4.0,5.0]);
			
		//	console.log(wavePosAccum);
		
			//wavePosAccum[2]*=3;	//make waves more severe for testing
		
			return wavePosAccum;
		},
		setZeroLevel:function(lev){zeroLevel=lev;}	//TODO instance sea objects with own zero level, to have different level for multiple seas without calling setZeroLevel repeatedly
	}
})();
var getSeaHeight=seaHeight.get;
var testSeaData;

function seaHeightFor4VecPos(vec, tt){		//equivalent to procTerrain.js:terrainGetHeightFor4VecPos . not really height- returns object containing map coords abd height
	var tau = 2*Math.PI;
	var multiplier = 1/tau;
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	//TODO interpolation across polygon. initially just reuse equation used to generate terrain grid data.
	var aa=multiplier*decentMod(a,2*Math.PI);
	var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	
	if (vec[0]!=vec[0] || vec[1]!=vec[1] || vec[2]!=vec[2]){	//things can go wrong here with fast collision with boxes
		console.log("NaN vector input to seaHeightFor4VecPos");
		console.log(vec);
	}
	if (aa!=aa || bb!=bb){
		console.log("NaN ab in seaHeightFor4VecPos");
		console.log(aa, bb);
	}
		
	var seaHeight = getSeaHeight([bb,aa],tt);	//likely wrong - seaHeight map coords go from 0 to 1, so maybe should /tau
	
	testSeaData={aa:aa,bb:bb,tt:tt,seaHeight:seaHeight};	
	
	return {a:-a, b:Math.PI*1.5 -b , h:tau*seaHeight[2]};
}


function getHeightAboveSeaFor4VecPos(vec, tt){	//very similar function in procTerrain., and to above. TODO generalise?
			//note this ignores horizontal shift of surface points.
	var tau = 2*Math.PI;
	var multiplier = 1/tau;
	var a = Math.atan2(vec[2],vec[3]);
	var b = Math.atan2(vec[0],vec[1]);
	
	var c = -0.5*Math.asin( (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]));	//this height of 4vec that can be compared to landscape height
	//var c = -(1/Math.sqrt(2))*Math.asin( (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]));	//this height of 4vec that can be compared to landscape height
	//var c = -0.5*( (vec[0]*vec[0] + vec[1]*vec[1]) - (vec[2]*vec[2] + vec[3]*vec[3]));	//this height of 4vec that can be compared to landscape height
	
	
	var aa=multiplier*decentMod(a, 2*Math.PI);
	var bb=multiplier*decentMod(b + duocylinderSpin,2*Math.PI);
	var h =tau*getSeaHeight([bb,aa],tt)[2];
	
	return c-h;
}