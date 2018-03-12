function goFullscreen(elem){
	if (elem.requestFullscreen) {
	i.requestFullscreen();
	} else if (elem.webkitRequestFullscreen) {
		elem.webkitRequestFullscreen();
	} else if (elem.mozRequestFullScreen) {
		elem.mozRequestFullScreen();
	} else if (elem.msRequestFullscreen) {
		elem.msRequestFullscreen();
	}
	
//	elem.requestPointerLock();	//going fullscreen appears to disable pointer lock, and adding this here doesn't help the 1st time through. race condition?
								//hitting F again (while fullscreened) will cause pointer lock here to do something.
}