var usingAudioAPI=false;
var audiocontext;

try {
		// Fix up for prefixing
	window.AudioContext = window.AudioContext||window.webkitAudioContext;
	audiocontext = new AudioContext();	//guess this is the bit that throws - can't do undefined()
	usingAudioAPI = true;
} catch(e) {
	alert('Web Audio API is not supported in this browser.\n sounds will not play');
}

	
var MySound = (function(){
	
	audiocontext.resume();	//??
	var globalGainNode = audiocontext.createGain();
	var globalDistortionNode = audiocontext.createWaveShaper();
	globalDistortionNode.curve = makeDistortionCurve(80);
	globalDistortionNode.oversample = '4x';
	globalDistortionNode.connect(globalGainNode).connect(audiocontext.destination);	//maybe inefficient - TODO bin globalGainNode?

	//return a constructor instead, so can use this to make multiple sounds
	var mySound = function(soundAddress, cb){
		this.gainNode = audiocontext.createGain();
		this.gainNode.connect(globalDistortionNode);
		
		this.soundAddress = soundAddress;
		
		this.buffer = null;
		var that=this;		//??!!!
		var request = new XMLHttpRequest();
		request.open('GET', this.soundAddress);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			console.log("request loaded..." + that.soundAddress);
			audiocontext.decodeAudioData(request.response, function(buffer){
				console.log("set sound buffer");
				that.buffer = buffer;
				cb && cb();
			}, function(err){
				console.log("oops! problem loading sound from : " + this.soundAddress);
			});
		}
		request.send();
		
	};
	
	mySound.prototype.play = function(delay, vol, loop){
		//console.log("will play sound, using web audio API, from: " + this.soundAddress + ", delay: " + delay);
		if (typeof vol == 'undefined'){ vol = 1;};
		delay = delay || 0;
		
		if (!this.buffer){
			console.log("not loaded yet. returning");
			return;
		}
		var source = audiocontext.createBufferSource();	//TODO pool of sounds? is creating a new buffersource each play. unknown if expensive
		source.buffer = this.buffer	
		if (loop){source.loop = true;}
		
		var indivGainNode = audiocontext.createGain();	
		indivGainNode.gain.setValueAtTime(vol, audiocontext.currentTime);
		
		var indivDelayNode = audiocontext.createDelay(2.0);	//param is max delay. for fudge distance, opposite side of 3sph is distance 2 away
		indivDelayNode.delayTime.setValueAtTime(delay, audiocontext.currentTime);
		
		var indivPannerNode = audiocontext.createStereoPanner();
		
		source.connect(indivDelayNode).connect(indivGainNode).connect(indivPannerNode).connect(this.gainNode);
		
		//audiocontext.resume();	//??
		source.start(audiocontext.currentTime);
		
		return new IndivSound(indivGainNode, indivDelayNode, indivPannerNode);
	};
	mySound.prototype.setVolume = function(volume){
		this.gainNode.gain.value = volume;
	}
	mySound.setGlobalVolume = function(volume){
		console.log("SETTING GLOBAL VOLUME: " + volume);
		globalGainNode.gain.setValueAtTime(volume, audiocontext.currentTime);
	};
	
	return mySound;
})();

function IndivSound(gainNode, delayNode, pannerNode){
	this.gainNode = gainNode;
	this.delayNode = delayNode;
	this.pannerNode = pannerNode;
	this.lastSet = 0;		//set less frequently for smoother playback (may notice with smoother sounds)
}
IndivSound.prototype.setAll = function(settings){
	try{
		var thisScheduledAudioRampTime = audiocontext.currentTime + 0.1;
		if (thisScheduledAudioRampTime > this.lastSet + 0.05){  //workaround for inability to cancel cancelScheduledValues due to buggy firefox
			this.lastSet =  thisScheduledAudioRampTime;
			this.delayNode.delayTime.linearRampToValueAtTime(settings.delay, thisScheduledAudioRampTime);
			this.gainNode.gain.linearRampToValueAtTime(settings.gain, thisScheduledAudioRampTime);
			this.pannerNode.pan.linearRampToValueAtTime(settings.pan, thisScheduledAudioRampTime);
		}
	} catch(err){	//linearRampToValueAtTime fails if input value is "non finite". should know more when this happens again 
//		alert("caught an error in IndivSound.setAll , see logs");
//		console.log({error:err, settings:settings});
	}
}

var myAudioPlayer = (function(){
	//make a few sounds
	//var gunSound  = new MySound('audio/gunfire50k.mp3');
	//var gunSound  = new MySound('audio/gunmix.wav');
	var bombSound = new MySound('audio/bomb50k.mp3');
	var gunSound  = new MySound('audio/gun.wav');
	
	var clockSound;
	var clockSoundInstance;
	var playClockSound= function(){
		console.log("attempting to play clock sound");
		clockSoundInstance=clockSound.play(0,1,true);
	}
	clockSound = new MySound('audio/Freesound - ClockTickSound_01.wav by abyeditsound.mp3', playClockSound);

	//TODO rewrite/generalise (looping) sound code. 
	var whooshSound;
	var whooshSoundInstance;
	var whooshSoundBoxInstance;
	var playWhooshSound= function(){
		console.log("attempting to play whoosh sound");
		whooshSoundInstance=whooshSound.play(0,0,true);
		whooshSoundBoxInstance=whooshSound.play(0,0,true);
	}
	whooshSound = new MySound('audio/blowtorch_50k.mp3', playWhooshSound);
	
	gunSound.setVolume(0.2);
	bombSound.setVolume(0.2);
	clockSound.setVolume(0);	//disabled
	whooshSound.setVolume(1);
	
	return {
		playGunSound: function(delay, vol){
			gunSound.play(delay);
		},
		playBombSound: function(delay, vol){
			return bombSound.play(delay, vol);
		},
		//playClockSound: playClockSound,
		setClockSound: function(settings){
			if (clockSoundInstance){clockSoundInstance.setAll(settings);}
		},
		setWhooshSound: function(settings){
			if (whooshSoundInstance){whooshSoundInstance.setAll(settings);}
		},
		setWhooshSoundBox: function(settings){
			if (whooshSoundBoxInstance){whooshSoundBoxInstance.setAll(settings);}
		},
	}
})();

//copied from https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};

