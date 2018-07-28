
var MySound = (function(){
	var audiocontext;
	//TODO some generalised sound function/constructor type thing, to allow new MySound(filename, instances);
	//then can do this for each type of sound.
	//don't know if that will be inefficient - whether play functions shared or not...

	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		audiocontext = new AudioContext();	//guess this is the bit that throws - can't do undefined()
		
		var gainNode = audiocontext.createGain();
		gainNode.connect(audiocontext.destination);

		//return a constructor instead, so can use this to make multiple sounds
		var mySound = function(soundAddress){
			this.soundAddress = soundAddress;
			this.soundbuffer = null;
			
			var that=this; //?? don't really understand, but makes setting the buffer work.
			
			var request = new XMLHttpRequest();
			request.open('GET', soundAddress, true);
			request.responseType = 'arraybuffer';
			request.onload = function() {
				console.log("request loaded...");
				audiocontext.decodeAudioData(request.response, function(buffer){
					console.log("set sound buffer");
					that.soundbuffer = buffer;
				}, function(err){
					console.log("oops! problem loading sound from : " + soundAddress);
				});
			}
			request.send();
		};
		
		//static variables
		mySound.usingAudioAPI= true; 
		mySound.prototype.play = function(delay){
			//console.log("will play sound, using web audio API, from: " + this.soundAddress + ", delay: " + delay);
			
			if (!this.soundbuffer){
				console.log("not loaded yet. returning");
				return;
			}

			var source = audiocontext.createBufferSource();
			source.buffer = this.soundbuffer;
			source.connect(gainNode);
			source.start(audiocontext.currentTime + delay);
		};
		mySound.prototype.setVolume = function(volume){
			gainNode.gain.value = volume;	//currently this affects all sounds, but happily we want all the same volume
		}
		
		return mySound;
		
	}
		catch(e) {
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
		//static variables
		mySound.usingAudioAPI= false; 
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
		return mySound;
		
		
	}

})();


var myAudioPlayer = (function(){
	//make a few sounds
	//var gunSound  = new MySound('audio/gunfire50k.mp3');
	//var bombSound = new MySound('sounds/bomb50k.mp3');
	var gunSound  = new MySound('audio/gun.wav');

	return {
		playGunSound: function(delay){
			gunSound.play(delay);
		},
		//playBombSound: function(delay){
		//	bombSound.play(delay);
		//},
		setGlobalVolume: function(volume){
			gunSound.setVolume(volume);
		//	bombSound.setVolume(volume);
		}
	}
})();
