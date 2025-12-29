//TODO 
// buttons to play sounds.
// oscillators. basic wave forms, distortions. try synthesizing useful sounds eg warning alarms, lock on, typewriter, harp...
// keyboard
// play samples (eg explosion sound)
// test playing delayed, doppler shifted sounds.
// test playing many sounds at once and avoiding issues when total volume becomes very large.


var button = document.getElementById("mybutton");
button.addEventListener("click", playSound);
var button1 = document.getElementById("mybutton1");
button1.addEventListener("click", playSoundSquare);
var button2 = document.getElementById("mybutton2");
button2.addEventListener("click", playSoundBeats);

var bombbutton = document.getElementById("bombbutton");
bombbutton.addEventListener("click", playBombSound);

var bombbutton2 = document.getElementById("bombbutton2");
bombbutton2.addEventListener("click", playBombSounds);

var bombbutton3 = document.getElementById("bombbutton3");
bombbutton3.addEventListener("click", playBombSounds2);


//TODO 
//use mouse position on canvas as audio listening point, compare implementation of doppler, delay using delaynode (already doing this in game code), 
// with version using delayed sound starting, manual adjustment of audio speed


//load sound buffer.
var bombSoundBuffer = null;
var bombAudioCtx = new AudioContext();
loadSound('bomb50k.mp3', buffer => bombSoundBuffer=buffer);


function playSound(evt){
    console.log("playing triangle");

    var actx = new AudioContext();
    var oscillator = myCreateOscillator('triangle', actx);
    oscillator.connect(actx.destination);
    oscillator.start();

    oscillator.stop(actx.currentTime + 1);
}

function playSoundSquare(evt){
    console.log("playing square");

    var actx = new AudioContext();
    var oscillator = myCreateOscillator('square', actx);
    oscillator.connect(actx.destination);
    oscillator.start();

    oscillator.stop(actx.currentTime + 1);
}

function playSoundBeats(evt){
    console.log("play beats!");

    var actx = new AudioContext();

    var oscillator = myCreateOscillator('triangle', actx);
    var oscillator2 = myCreateOscillator('triangle', actx);

    oscillator.frequency.value = 440;
    oscillator2.frequency.value = 442;

    oscillator.connect(actx.destination);
    oscillator.start();
    oscillator.stop(actx.currentTime + 3);

    oscillator2.connect(actx.destination);
    oscillator2.start();
    oscillator2.stop(actx.currentTime + 3);
}


function playBombSound(evt){

    if (!bombSoundBuffer){
        console.log("haven't loaded bomb sound yet.");
        return;
    }

    var source = bombAudioCtx.createBufferSource();	//TODO pool of sounds? is creating a new buffersource each play. unknown if expensive
	source.buffer = bombSoundBuffer;

    var gainNode = bombAudioCtx.createGain();
    gainNode.gain.value = 0.2;

    source.connect(gainNode);
    gainNode.connect(bombAudioCtx.destination);

    source.start();
}


function playBombSounds(evt){

    if (!bombSoundBuffer){
        console.log("haven't loaded bomb sound yet.");
        return;
    }

    //get number of bombs and spread from sliders. (, volume?)
    var numBombs = document.getElementById("numBombs").value
    var spread = document.getElementById("bombSpreadMs").value;    //TODO from slider

    console.log("playing " + numBombs + " bomb sounds");

    var now = bombAudioCtx.currentTime;

    var gainNode = bombAudioCtx.createGain();
    gainNode.gain.value = 0.2;
    
    var compressor = bombAudioCtx.createDynamicsCompressor();

    gainNode.connect(compressor);
    compressor.connect(bombAudioCtx.destination);


    for (var ii=0;ii<numBombs;ii++){
        //var thisDelay = 0.01*Math.random()*spread;   //appears to be in seconds!
        var thisDelay = 0.01*spread*ii/numBombs;

        var source = bombAudioCtx.createBufferSource();	//TODO pool of sounds? is creating a new buffersource each play. unknown if expensive
        source.buffer = bombSoundBuffer;

        source.connect(gainNode);
        source.start(now + thisDelay);
    }
}


function playBombSounds2(evt){

    /*same thing but using delayNodes - seems doesn't work very well!*/

    if (!bombSoundBuffer){
        console.log("haven't loaded bomb sound yet.");
        return;
    }

    //get number of bombs and spread from sliders. (, volume?)
    var numBombs = document.getElementById("numBombs").value
    var spread = document.getElementById("bombSpreadMs").value;    //TODO from slider

    console.log("playing " + numBombs + " bomb sounds");

    var now = bombAudioCtx.currentTime;

    var gainNode = bombAudioCtx.createGain();
    gainNode.gain.value = 0.2;
    
    var compressor = bombAudioCtx.createDynamicsCompressor();

    gainNode.connect(compressor);
    compressor.connect(bombAudioCtx.destination);


    for (var ii=0;ii<numBombs;ii++){
        //var thisDelay = 0.01*Math.random()*spread;   //appears to be in seconds!

        var thisDelay = 0.01*spread*ii/numBombs;

        var source = bombAudioCtx.createBufferSource();	//TODO pool of sounds? is creating a new buffersource each play. unknown if expensive
        source.buffer = bombSoundBuffer;

        var delayNode = bombAudioCtx.createDelay(1);
        delayNode.delayTime.value = thisDelay;

        source.connect(delayNode).connect(gainNode);

        source.start(now);
    }
}

function myCreateOscillator(waveTypeString, actx){
    var oscillator = actx.createOscillator();
    oscillator.type = waveTypeString;   //crazy that this is string not enum! sine, triangle, square, sawtooth
                                    //TODO try others? superpositions? cycloid? 
    return oscillator;
}

function loadSound(soundAddress, cb){
    var request = new XMLHttpRequest();
    request.open('GET', soundAddress);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        console.log("request loaded..." + soundAddress);
        bombAudioCtx.decodeAudioData(request.response, cb, function(err){
            console.log("oops! problem loading sound from : " + soundAddress);
        });
    }
    request.send();
}