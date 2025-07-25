
var logMapStuff=false;
var drawMapScene = (function(){
	
	//create a camera view for viewing map from.
	var mapCameraView = mat4.create();

	var spunMapCamera = mat4.create();

	var mapCameraPMatrix = mat4.create();

	var playerI, playerJ, playerMapAngle, playerIWithDuocylinderSpin;

	return function(frameTime, glClearBits){
		//draw a map
		//initially just the current world 3-sphere unwrapped into a fat tetrahedron, so duocylinder terrains appear flat.
		//NOTE descent-alikes have a map view like paused god-mode with wireframe shader etc, otherwise like rest of game.
		//perhaps that's preferable to current unwrapped world idea. Perhaps can have smooth transition between mappings.
		//TODO option to scroll map such that player in middle
		//TODO ability to rotate map
		//TODO ortho option
		//TODO square stack option, perhaps scaling with current height (TODO show what's above/below neatly
		//TODO render terrain
		//TODO render actual meshes on map (not just point)

		mat4.identity(mapCameraView);
			//since this map view in regular 3d space, can use standard matrix methods instead of custom
		mat4.translate(mapCameraView, [0,0,-guiParams.map.viewDistance]);
		mat4.rotateX(mapCameraView, -Math.PI/4);	//elevate camera 45 deg

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);	//draw to screen (null)
		gl.viewport(0, 0, gl.viewportWidth,gl.viewportHeight);

		var worldToDrawMapFor = playerContainer.world;
        var settingsForWorld = guiSettingsForWorld[worldToDrawMapFor];

		updatePlayerIJ(
			playerContainer.matrix.slice(12),
			playerContainer.matrix.slice(8,12),
			settingsForWorld.spin
		);

		gl.clearColor.apply(gl,worldColorsPlain[worldToDrawMapFor]);
		gl.clear(glClearBits);

		mapCameraPMatrix = mat4.perspective(100, gl.viewportWidth/gl.viewportHeight, 0.01, 10);	//TODO only set this on viewport change.
		mat4.set(mapCameraPMatrix, pMatrix);

		
		mat4.set(mapCameraView, spunMapCamera);
		//var mapZRotation = (frameTime/5000) % (2*Math.PI);	//TODO rotate view with player.
		mat4.rotateZ(spunMapCamera, playerMapAngle);


		if (logMapStuff){console.log({"mssg":"pMatrix for map", pMatrix})}

		gl.cullFace(gl.BACK);
		gl.depthFunc(gl.LESS);

		var activeProg = shaderPrograms.threeSpaceColored;
		gl.useProgram(activeProg);
		enableDisableAttributes(activeProg);

		//draw some things mapped onto this space. initially just display coloured spheres for points. then do distortion in shader.
		
		ringCells.forEach(ring => 
			ring.mats.forEach(mat => 
				drawMapPointForFourVec(mat.slice(12), ring.color, 0.015)
		));

		//grid in middle
		var root2 = Math.sqrt(2);
		for (var ang1=0;ang1<360;ang1+=15){
			var angRadians = Math.PI*ang1/180;
			for (var ang2=0;ang2<360;ang2+=15){
				var ang2Radians = Math.PI*ang2/180;
				var fourPos = [Math.cos(angRadians),Math.sin(angRadians),Math.cos(ang2Radians),Math.sin(ang2Radians)].map(xx=>xx/root2);
				drawMapPointForFourVec(fourPos, colorArrs.darkGray, 0.015);
			}
		}
		
		//drawMapPointForFourVec(playerCamera.slice(12), colorArrs.white, 0.02);
		//drawMapPointForFourVec(buildingMatrix.slice(12), colorArrs.red, 0.04);
		
		var mapShaderChoice = {
				basicShader: shaderPrograms.mapShaderTwo,
				vertColorsShader: shaderPrograms.mapShaderTwoVertColors,
				shaderDrawFunc: drawMapObject2
			}

		var mapDrawShaderFunc;

		activeProg = mapShaderChoice.basicShader;
		gl.useProgram(activeProg);
		enableDisableAttributes(activeProg);
		mapDrawShaderFunc = mapShaderChoice.shaderDrawFunc;

		// ringCells.forEach(ring => 
		// 	ring.mats.forEach(mat => 
		// 		drawMapObject2(mat, ring.color, cubeBuffers, 0.1, false)
		// ));

		portalsForWorld[worldToDrawMapFor].forEach(portal => {
			var pColor = worldColors[portal.otherps.world];
			//var pPos = portal.matrix.slice(12);
			var pRad = portal.shared.radius;	//NOTE not necessarily to scale when rendered in map
			//drawMapPointForFourVec(pPos, pColor, pRad);
			mapDrawShaderFunc(portal.matrix, pColor, sphereBuffers, pRad, false);
		});
		//TODO maybe shop be sship matrix (not camera, and map should be centred on player not camera.)
		mapDrawShaderFunc(playerCamera, colorArrs.white, sphereBuffers, 0.05, false);


		activeProg = mapShaderChoice.vertColorsShader;
		gl.useProgram(activeProg);
		enableDisableAttributes(activeProg);
		mapDrawShaderFunc = mapShaderChoice.shaderDrawFunc;

		mapDrawShaderFunc(buildingMatrix, colorArrs.red, buildingBuffers, 0.01*guiParams.drawShapes.buildingScale, true);
		mapDrawShaderFunc(octoFractalMatrix, colorArrs.gray, octoFractalBuffers, 0.01*guiParams.drawShapes.octoFractalScale, true);

		bvhObjsForWorld[worldToDrawMapFor].objList.forEach(bvhObj => {
			//drawMapPointForFourVec(bvhObj.mat.slice(12), colorArrs.gray, 0.03);
			mapDrawShaderFunc(bvhObj.mat, colorArrs.gray, bvhObj.mesh, bvhObj.scale, false);
				//NOTE can't just use bvhObj.scale because depends on mesh data.
				//if bounding sphere rad were a property (or bvh mesh which contains bounding sphere) could use that.
		});

        
        //draw terrain.
        var terrainObj = duocylinderObjects[settingsForWorld.duocylinderModel];

        activeProg = terrainObj.vertexColorBuffer ?
                shaderPrograms.mapTerrainVertColors:
                shaderPrograms.mapTerrainShader;
        gl.useProgram(activeProg);
            enableDisableAttributes(activeProg);
            drawTerrainOnMapUsingTricoords(terrainObj);

		logMapStuff=false;

		function drawMapPointForFourVec(fourVec, color, rad){
			drawMapPointAtPosition(pos4ToMapPos3(fourVec, guiParams.map.tetrahedronism), color, rad);
		}

		//TODO instanced, or don't prep all uniforms when drawing many points of same colour etc.
		function drawMapPointAtPosition(threePos, color, rad){

			//set mvMatrix given the 3pos. would be simpler to just take 3pos into the shader?
			mat4.set(spunMapCamera, mvMatrix);

			mat4.translate(mvMatrix, threePos);


			//mat4.rotate(mvMatrix, 0,0,1, 10);//??	appears to not work. TODO find how to read the docs for whatever
									// version of glmatrix is being used!!!!
			//mat4.rotateZ(mvMatrix, 0.1);	//having here rotates to object itself, not the view.

			if (logMapStuff){console.log({"mssg":"map draw ", threePos, mvMatrix})}

			gl.uniform3fv(activeProg.uniforms.uModelScale, [rad,rad,rad]);
			uniform4fvSetter.setIfDifferent(activeProg, "uColor", color);
			drawObjectFromBuffers(cubeBuffers, activeProg)
		}

		//drawing object on map "properly"
		//1) simple but likely broken version - put player and object mats as input,
		//transform each point independently. expect to break on edge of map when verts on opposite sides.

		// (removed)

		//2) draw points relative to fixed object centre point on map. still a problem that whole object will jump 
		// across map when centre of object does. for small objects this is OK.

		function drawMapObject2(objMatrix, color, objBuffers, objScale, attachedToDuocylinder){
			var objCentreMapAngleCoords = mapAngleCoordsForFourVec(objMatrix.slice(12));
			var cameraMapAngleCoords = [attachedToDuocylinder?playerIWithDuocylinderSpin:playerI , playerJ];

			var relativeMapAngleCoords = [
				objCentreMapAngleCoords[0] - cameraMapAngleCoords[0],
				objCentreMapAngleCoords[1] - cameraMapAngleCoords[1]
			].map(xx=> minusPiToPiWrap(xx));
			//^^ could do this in vert shader.

			mat4.set(spunMapCamera, mvMatrix); //this is matrix of the map in camera viewing the map
			gl.uniform1f(activeProg.uniforms.uBendFactor, guiParams.map.bendFactor);
			gl.uniform1f(activeProg.uniforms.uTetrahedronism, guiParams.map.tetrahedronism);
			gl.uniform2fv(activeProg.uniforms.uObjCentreAngleCoords, objCentreMapAngleCoords);
			gl.uniform2fv(activeProg.uniforms.uObjCentreRelativeToCameraAngleCoords, relativeMapAngleCoords);

            if (activeProg.uniforms.uModelScale){
			    gl.uniform3fv(activeProg.uniforms.uModelScale, [objScale,objScale,objScale]);
            }
			uniform4fvSetter.setIfDifferent(activeProg, "uColor", color);
			mat4.set(objMatrix, mMatrix);	//this is matrix describing object pose in world. drawObjectFromBuffers will send it to v shader
			drawObjectFromBuffers(objBuffers, activeProg);
		}

		//3) draw 4 copies of object if necessary (close to map edge).
        // done this for terrain (actually (n+1)*(n+1) copies since terrains are repeated grids.
		// TODO also for regular objects

		//4) discard pixels outside the map shape.
		// done this for terrain
   		// TODO also for regular objects

		//5) draw 4 objects routinely, find position of object relative to player, 
		// modulo 2*PI (from 0 to 2*PI). draw shifted by (0 or -2*PI) each axis.
		// this way can draw a lot of same type of item using 4 instanced draw calls.

        function drawTerrainOnMap(terrainObj){
			uniform4fvSetter.setIfDifferent(activeProg, "uColor", colorArrs.cyan);
            var attachedToDuocylinder = true;

            //for now just draw 1 copy
            var terrainCoords = [0,0];  //TODO draw multiple tiles
			var cameraMapAngleCoords = [attachedToDuocylinder?playerIWithDuocylinderSpin:playerI , playerJ];
            var relativeMapAngleCoords = [
				-cameraMapAngleCoords[0],
				-cameraMapAngleCoords[1]
			].map(xx=> minusPiToPiWrap(xx));

            mat4.set(spunMapCamera, mvMatrix); //this is matrix of the map in camera viewing the map
            mat4.identity(mMatrix); //??
            
            //appears that tennisBallLoader creates duocylinders that have axes x=y=0, z=w=0
            //but this is as expect!!

            //xyzrotate4mat(mMatrix, [0,0,Math.PI]);  //???

            //rotate4mat(mMatrix, 2, 3, Math.PI/2);   //

			gl.uniform1f(activeProg.uniforms.uBendFactor, guiParams.map.bendFactor);
			gl.uniform1f(activeProg.uniforms.uTetrahedronism, guiParams.map.tetrahedronism);

            gl.uniform2fv(activeProg.uniforms.uObjCentreAngleCoords, terrainCoords);
			gl.uniform2fv(activeProg.uniforms.uObjCentreRelativeToCameraAngleCoords, relativeMapAngleCoords);

            if (logMapStuff){
                console.log({
                    terrainCoords, cameraMapAngleCoords, relativeMapAngleCoords
                });
            }

   			drawObjectFromBuffers(terrainObj, activeProg);
        }

        function drawTerrainOnMapUsingTricoords(terrainObj){
            gl.uniformMatrix4fv(activeProg.uniforms.uPMatrix, false, pMatrix);  
                //TODO set outside this method if reusing to draw multiple terrains    
		    gl.uniformMatrix4fv(activeProg.uniforms.uMVMatrix, false, mvMatrix);
		

            var attachedToDuocylinder = true;

            var terrainCoords = [0,0];  //TODO draw multiple tiles
            var cameraMapAngleCoords = [attachedToDuocylinder?playerIWithDuocylinderSpin:playerI , playerJ];

            var cornerInRads = terrainObj.minXY.map(xx=>xx*2*Math.PI);

            var relativeMapAngleCoords = [
				-cameraMapAngleCoords[0],
				-cameraMapAngleCoords[1]
			].map((xx,ii)=> terrainWrap(xx + cornerInRads[ii], terrainObj.step)-cornerInRads[ii]);

            //procTerrain map object has x,y range from 0 to step.
            //therefore, if tiling, starter square corner should be between -PI-step and -PI
            // other objects - vox terrain, grid etc, appear to have different extents.
            // TODO precalc extent/corner to do correct offset of corner tile to completely cover map with
            // (divs+1)x(divs+1) tiles


            mat4.set(spunMapCamera, mvMatrix); //this is matrix of the map in camera viewing the map

            gl.uniform1f(activeProg.uniforms.uBendFactor, guiParams.map.bendFactor);
			gl.uniform1f(activeProg.uniforms.uTetrahedronism, guiParams.map.tetrahedronism);

            if (logMapStuff){
                console.log({
                    terrainCoords, cameraMapAngleCoords, relativeMapAngleCoords
                });
            }

            var step = terrainObj.step;
            gl.uniform4fv(activeProg.uniforms.uColor, colorArrs.orange);
            for (var ii=0;ii<=terrainObj.divs;ii++){
                for (var jj=0;jj<=terrainObj.divs;jj++){
                    gl.uniform2fv(activeProg.uniforms.uObjCentreRelativeToCameraAngleCoords, 
                        [relativeMapAngleCoords[0]+ii*step , relativeMapAngleCoords[1]+jj*step]);
                    drawObjFromTricoordBuffers(terrainObj, activeProg);
                }
            }
        }

        //something similar to drawObjectFromBuffers. TODO generalise/ parameterise?
        function drawObjFromTricoordBuffers(duocylinderObj, shader){
		    gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexTriCoordBuffer);
		    gl.vertexAttribPointer(shader.attributes.aVertexPosition, duocylinderObj.vertexTriCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
            if (duocylinderObj.vertexColorBuffer && shader.attributes.aVertexColor){
                gl.bindBuffer(gl.ARRAY_BUFFER, duocylinderObj.vertexColorBuffer);
                gl.vertexAttribPointer(shader.attributes.aVertexColor, duocylinderObj.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, duocylinderObj.vertexIndexBuffer);

            gl.drawElements(duocylinderObj.isStrips? gl.TRIANGLE_STRIP : gl.TRIANGLES, duocylinderObj.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }

	}

/*
(x,y,z,w) world coords

middle of duocylinder at the top. x=y=0

plane in middle. x^2+y^2 = 0.5, z^2+w^2 = 0

middle of underworld duocylinder at bottom. z=w=0

Z - something like atan2( len(x,y), len(z,w))
X - something like atan2(x,y)*len(x,y)
Y - something like atan2(z,w)*len(z,w)

=>
at top, 	x=y=0, len(x,y)=0, len(z,w)=1 => X=0, Y from -PI to PI
in middle. len(x,y)=root(0.5), len(z,w)=root(0.5) => Z,Y from -PI/root2 to PI/root2
at bottom, 	z=w=0, len(x,y)=1, len(z,w)=0 => X from -PI to PI, Y=0

basically set of stack of rectangles forming bloated tetrahedron that looks like a circle viewed from above. 
can fit these inside a stubby cylinder with height equal to length. the corners of the rectangles form a helix.

mapping objects onto this shape is tricky, especially on the points along the duocylinder axes, unless store as a special object designed to unwrap like this, with points, edges along the duocylinder centreline, or just accept that objects will be displayed as surfaces rather than solid in this case.
for points horizontally wrapping on landscape, might acheive good display by having up to 4 copies of object/ landscape where crosses edges, and discarding pixels outside the cylinder.
small mobile objects like the player might be just displayed as simple points.
ideally should present texture mapping, lighting etc, but simple greybox/ position=colour shading should show example.
possible want to display as semitransparent. Perhaps good use of Order Independent Transparency.
NOTE that landscapes that actually wrap around without stitching would be a problem for map, but IIRC avoided this anyway because of how automatic ddx, ddy texture mapping works ( hope didn't solve this with custom sampling!!)
for initial version, don't scroll map, so only need 1 copy of landscape.
initial version with just landscape and player point, coloured portals sensible.
in order to draw stuff like boxes, guess scene object list/graph is sensible.
*/
	function minusPiToPiWrap(inputNumber){	//because javascript doesn't do mod! https://stackoverflow.com/a/4467559
		var tau = 2*Math.PI;
		return ((((inputNumber+Math.PI) % tau) + tau) % tau) - Math.PI;
	}

    function terrainWrap(inputNumber, step){
        //wraps to -PI-step to -PI
        return ((((inputNumber+Math.PI) % step) + step) % step) - step - Math.PI;
    }

	function updatePlayerIJ(playerPos, playerForward, duocylinderSpin){
		var squaredPos = playerPos.map(xx=>xx*xx);
		playerI = Math.atan2(playerPos[0],playerPos[1]);
		playerJ = Math.atan2(playerPos[2],playerPos[3]);

		//modify by duocylinderSpin. (TODO apply only to objects that move with duocylinder)
		playerIWithDuocylinderSpin=minusPiToPiWrap(playerI+duocylinderSpin);

		//calculation of player heading?
		//obvious way is to take player position, take player direction (halfway around world), add small amount of that to
		//player pos, put that on the map, and look at angle between
		
		// however may be a neat way to do this
		// according to https://www.wolframalpha.com/input?i=derivative+of+atan2%28y%2Cx%29,
		// there's a neater formulation though - want something like
		// d/dx(tan^(-1)(x, y)) = -y/(x^2 + y^2)
		// d/dy(tan^(-1)(x, y)) = x/(x^2 + y^2)

		var lenxy = Math.sqrt( squaredPos[0]+squaredPos[1]);
		var lenzw = Math.sqrt( squaredPos[2]+squaredPos[3]);

		//for playerI (X on map, but "I" to reduce confusion)
		// rate of change of playerI with respect to playerPos[0] is -playerPos[1]/(lenxy)
		// rate of change of playerI with respect to playerPos[1] is playerPos[0]/(lenxy)

		var playerIRateOfChange = (playerForward[1]*playerPos[0] - playerForward[0]*playerPos[1])/lenxy;
		var playerJRateOfChange = (playerForward[3]*playerPos[2] - playerForward[2]*playerPos[3])/lenzw;
			//this is rate of change of I,J, but suspect should scale by aspect of unwrapped duocylinder terrain at player's height
			//however, seems to work pretty well as is, even when not at height 0. perhaps correct!

		playerMapAngle = Math.atan2(playerIRateOfChange, playerJRateOfChange);
	}

	function pos4ToMapPos3(fourVec, tetrahedronism){
		var squaredPos = fourVec.map(xx=>xx*xx);
		var lenxy = Math.sqrt( squaredPos[0]+squaredPos[1]);
		var lenzw = Math.sqrt( squaredPos[2]+squaredPos[3]);
		var uvAngs = [minusPiToPiWrap(Math.atan2(fourVec[0],fourVec[1])-playerI), minusPiToPiWrap(Math.atan2(fourVec[2],fourVec[3])-playerJ)];

		var tetrahedronMultiplier = [lenxy*tetrahedronism + 0.707*(1-tetrahedronism), lenzw*tetrahedronism + 0.707*(1-tetrahedronism)];
		var xOut = uvAngs[0]* tetrahedronMultiplier[0];
		var yOut = uvAngs[1]* tetrahedronMultiplier[1];
		var zOut = Math.atan2( lenzw, lenxy);

		//retain some pringle curvature to reduce map distortion, make more readable.
		// perhaps circular curvature is better, but to first order, parabolic/cubic should be equivalent
		// perhaps can do better by different curvatures for different z. 

		var bendFactor = guiParams.map.bendFactor;
		var multiplier1 = bendFactor*bendFactor/2;
		var multiplier2 = bendFactor*multiplier1/3;	//could be about right amount would like terrain dots evenly spaced on map. would like corners to be 90deg
			//guess cos ~ 1 - (1/2)*(bx)^2. sin ~ x + (1/6)(bx)^3

		var bend = multiplier1*(xOut*xOut - yOut*yOut);
		zOut += bend;
		xOut -= multiplier2*xOut*bend;
		yOut += multiplier2*yOut*bend;

		return [xOut, yOut, zOut];
	}

	function mapAngleCoordsForFourVec(fourVec){
		return [Math.atan2(fourVec[0],fourVec[1]), Math.atan2(fourVec[2],fourVec[3])].map(xx=>minusPiToPiWrap(xx));
	}
})();
