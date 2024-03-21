
function makeTexture(src, imgformat=gl.RGBA, imgtype=gl.UNSIGNED_BYTE, yFlip = true, withMips = true) {	//to do OO
	var internalFormat = imgformat == gl.RED ? gl.R8 : imgformat;

	var texture = gl.createTexture();
		
	bind2dTextureIfRequired(texture);
	//dummy 1 pixel image to avoid error logs. https://stackoverflow.com/questions/21954036/dartweb-gl-render-warning-texture-bound-to-texture-unit-0-is-not-renderable
		//(TODO better to wait for load, or use single shared 1pix texture (bind2dTextureIfRequired to check that texture loaded, by flag on texture? if not loaded, bind the shared summy image?
		//TODO progressive detail load?
	texImage2DWithLogs("after binding texture", gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		//new Uint8Array([255, 0, 255, 255])); // magenta. should be obvious when tex not loaded.
		new Uint8Array([255, 150, 255, 255]));
	
	texture.image = new Image();
	texture.image.onload = function(){
		console.table({"mssg":"make texture - loaded texture","info":{imgformat, imgformat, imgtype}});
		bind2dTextureIfRequired(texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, yFlip);

		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);	//linear colorspace grad light texture (TODO handle other texture differently?)
		
		//gl.texImage2D(gl.TEXTURE_2D, 0, imgformat, imgformat, imgtype, texture.image);
		texImage2DWithLogs("after loading, binding texture", 
			gl.TEXTURE_2D, 0, 
			internalFormat, texture.image.width, texture.image.height, 0,
			imgformat, imgtype, texture.image
		);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
			withMips? gl.LINEAR_MIPMAP_LINEAR: gl.LINEAR);

		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		bind2dTextureIfRequired(null);	//AFAIK this is just good practice to unwanted side effect bugs

		havePrerenderedCentredCubemaps=false;	//hack, results in some unnecessary redrawing (not all images affect all cubemaps)
	};	
	texture.image.src = src;
	return texture;
}