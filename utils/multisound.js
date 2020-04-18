var usingAudioAPI=false;
var audiocontext;

try {
		// Fix up for prefixing
	window.AudioContext = window.AudioContext||window.webkitAudioContext;
	audiocontext = new AudioContext();	//guess this is the bit that throws - can't do undefined()
	usingAudioAPI = true;
} catch(e) {
}

	
var MySound = (function(){
	
	//TODO some generalised sound function/constructor type thing, to allow new MySound(filename, instances);
	//then can do this for each type of sound.
	//don't know if that will be inefficient - whether play functions shared or not...

	if (usingAudioAPI) {
		audiocontext.resume();	//??
		var globalGainNode = audiocontext.createGain();
		globalGainNode.connect(audiocontext.destination);

		//return a constructor instead, so can use this to make multiple sounds
		var mySound = function(soundAddress){
			this.gainNode = audiocontext.createGain();
			this.gainNode.connect(globalGainNode);
			
			this.soundAddress = soundAddress;
			
			this.buffer = null;
			var that=this;		//??!!!
			var request = new XMLHttpRequest();
			request.open('GET', this.soundAddress, true);
			request.responseType = 'arraybuffer';
			request.onload = function() {
				console.log("request loaded..." + that.soundAddress);
				audiocontext.decodeAudioData(request.response, function(buffer){
					console.log("set sound buffer");
					that.buffer = buffer;
				}, function(err){
					console.log("oops! problem loading sound from : " + this.soundAddress);
				});
			}
			request.send();
			
		};
		
		mySound.prototype.play = function(delay){
			//console.log("will play sound, using web audio API, from: " + this.soundAddress + ", delay: " + delay);
			
			if (!this.buffer){
				console.log("not loaded yet. returning");
				return;
			}
			console.log("will play sound " + this.soundAddress);
			var source = audiocontext.createBufferSource();	//TODO pool of sounds? is creating a new buffersource each play. unknown if expensive
			source.buffer = this.buffer				
			source.connect(this.gainNode);

			//audiocontext.resume();	//??
			source.start(audiocontext.currentTime + delay);
		};
		mySound.prototype.setVolume = function(volume){
			this.gainNode.gain.value = volume;
		}		
	} else {
		//alert('Web Audio API is not supported in this browser.\nFalling back to audio elements.\nA modern web browser is recommended.');
		
		//return a constructor instead, so can use this to make multiple sounds
		var mySound = function(soundAddress){
			this.soundAddress = soundAddress;
			this.audios = [];
			this.nextAudio = 0;
			this.NUM_AUDIOS = 25;	//for audio element fallback only.
			for (var ii=0;ii<this.NUM_AUDIOS;ii++){
				this.audios.push( new Audio(this.soundAddress) );
			}
		}
		mySound.prototype.play = function(delay){	//note that delay is not used at this time - seems fine in IE without
			console.log("will play sound, using fallback audio tags, from: " + this.soundAddress);
			this.audios[this.nextAudio].play();
			this.nextAudio = (this.nextAudio+1)%this.NUM_AUDIOS;
		};
		mySound.prototype.setVolume = function(volume){
			for (var ii=0;ii<this.NUM_AUDIOS;ii++){
				this.audios[ii].volume = volume;
			}
		}
	}
	return mySound;
})();


var myAudioPlayer = (function(){
	//make a few sounds
	//var gunSound  = new MySound('audio/gunfire50k.mp3');
	//var gunSound  = new MySound('audio/gunmix.wav');
	var bombSound = new MySound('audio/bomb50k.mp3');
	var gunSound  = new MySound('audio/gun.wav');
	
	return {
		playGunSound: function(delay){
			gunSound.play(delay);
		},
		playBombSound: function(delay){
			bombSound.play(delay);
		},
		setGlobalVolume: function(volume){	//todo actually use globalGainNode
			console.log("SETTING GLOBAL VOLUME");
			gunSound.setVolume(volume);
			bombSound.setVolume(volume*0.01);
		}
	}
})();
myAudioPlayer.setGlobalVolume(1);	//if set above 1, fallback html media element will throw exception!!!
