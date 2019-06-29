function goFullscreen(elem){
	if (elem.requestFullscreen) {
		elem.requestFullscreen();
	} else if (elem.webkitRequestFullscreen) {
		elem.webkitRequestFullscreen();
	} else if (elem.mozRequestFullScreen) {
		elem.mozRequestFullScreen();
	} else if (elem.msRequestFullscreen) {
		elem.msRequestFullscreen();
	}
	
//	elem.requestPointerLock();	//going fullscreen appears to disable pointer lock, and adding this here doesn't help the 1st time through. race condition?
								//hitting F again (while fullscreened) will cause pointer lock here to do something.
	
	setTimeout(function(){elem.requestPointerLock();},1000);	//works in testing on Firefox, my I5 machine. seems if delay too short, wont work.
																//TODO try continually attempt pointer lock in fullscreen mode if
																// document.pointerLockElement is null. maybe more reliable/faster
}