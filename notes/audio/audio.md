# Audio

## Bugs

### Delay

IIRC currently using a delaynode dependent on the distance from sound to observer, and altering sound speed based on speed of observed relative to sound source in order to get doppler shift and have correct speed of sound delay for free. However, there is a limit on delay which causes clamping.

```
Delay.delayTime.linearRampToValueAtTime value 2.8513 outside nominal range [0, 2]; value will be clamped.
IndivSound.setAll @ multisound.js:118
```

Expect can solve by delaying call to play sounds until almost should be played, then either use delayNode, or just not bother using delayNode and just play immediately. IIRC currently also just setting delayNode for doppler, but alternatively could just set sound speed manually. However, delayNode is a neat solution because easy to avoid desync if, say, playing ambient audio like clock ticks which is matched with something visual.

### Portals

IIRC, currently don't play positioned sounds (ie excluding player sounds like thruster, gun) "through" portals - just play it in current world. This means that delays don't match up, and probably playing sounds can sound odd when passing through portal (don't have good test case currently). 

Unclear exactly how sounds should behave through portals- 

### Bad audio when many sounds play at once

Happens when fire eg "canister" weapon which results in many explosions being heard about same time.

Maybe hack solution is to look for nearby sounds in time and space and just increase loudness of matched sound, but expect if total loudness is the problem, might not solve issue. 

Could be that sounds are being played at exactly same time, in which case amplitudes added not power. If this is occurring, perhaps should add amplitude in quadrature.

Expect can remedy "properly" using audio "compression", for which there is dedicated support/node in web audio api. TODO make a test project to play many sounds, test compression node params.

Maybe could still cap out if sound onset quick. Could try implementing lookahead compression. 

Since know what sounds will be playing, perhaps can precalculate envelopes and "compress" by manually scaling by only considering these envelope functions. 

## missing features

### audio from moving source

ideally should do properly and retain movement history of sound producing object

### reverb, environmental filtering

Unimportant