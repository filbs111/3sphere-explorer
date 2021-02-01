
var colorArrs = (function () {
	var typedArrColors = [];
	var arrColors = {
		white:[1.0, 1.0, 1.0, 1.0],
		gray:[0.6,0.6,0.6,1.0],
		darkGray:[0.4, 0.4, 0.4, 1.0],
		veryDarkGray:[0.2, 0.2, 0.2, 1.0],
		superDarkGray:[0.05, 0.05, 0.05, 1.0],
		black:[0, 0, 0, 1.0],
		red:[1.0, 0.1, 0.1, 1.0],
		green:[0.1, 1.0, 0.1, 1.0],
		blue:[0.1, 0.1, 1.0, 1.0],
		yellow:[1.0, 1.0, 0.1, 1.0],
		magenta:[1.0, 0.1, 1.0, 1.0],
		cyan:[0.1, 1.0, 1.0, 1.0],
		randBoxes:[0.9, 0.9, 1.0, 0.9],
		teapot:[0.4, 0.4, 0.8, 1.0],
		hudFlightDir:[0.0, 0.5, 1.0, 0.5],
		hudBox:[1, 0.1, 0, 0.5],
		hudYellow:[1.0, 1.0, 0.0, 0.5],
		guns:[0.3, 0.3, 0.3, 1.0],
		target:[1, 0.2, 0.2, 1],
	}
	for (key of Object.keys(arrColors) ){
		typedArrColors[key]=new Float32Array(arrColors[key]);
	}
	return typedArrColors;
})();