# Dynamic camera

Initial spaceship camera is locked in pose relative to spaceship with some constant offset in frame of spaceship - for 3rd person, "cockpit" camera.

Some spaceship and racing games have a more dynamic camera, typically for 3rd person camera view.

Racing games tend to have the car turn first before the camera, so that if turning to the left, the left hand side of the car becomes visible to the camera. Also, there is some tendency to point the camera in the direction of travel, which tends to work to the same end when drifting. Also, high frequency suspension movement is not transmitted to the camera. People complain about Gran Turismo's third person camera because they believe it to be too rigidly connected to the car! Also, moving the car forwards under acceleration and towards the camera under braking might be implemented. Largely these systems have the camera lag behind the car motion, or act like a suspension system for the camera. 

Some spaceship games have an opposite effect - a cursor is controlled by the mouse, and the spaceship's pointing direction then aligns with the cursor direction. 

For a car game, having the viewpoint point towards the steering direction seems like might be a good idea - easier to see apex. Tilting headlights are like this.

Provisional idea is to have rocket camera operate like a common 3rd person car game, try implementing the following features/ideas

1) lag/smooth linear movement, so spaceship moves in screen in acceleration direction. simplest approach is to shift camera by overall acceleration, which might work OK provided acceleration smoothed (so position of camera doesn't jump). Perhaps better to have more like camera acts like a (light) mass on a spring/damper, so acceleration from standstill initially has camera accelerate smoothly.

2) lag/smooth rotation. similar story to linear

3) tilt camera in airspeed (assume air/aether static relative to nearby large structures) direction. helpful for high angle of attack.

4) some combination of 1, 2 - eg lag position, and rotate towards spaceship position somewhat, thereby tilting camera in acceleration direction

5) things that help landing. perhaps influence by gravity direction, or camera collision/force away from ground

6) dedicated transition to landing camera for landing pad. perhaps just button to tilt camera forwards

7) picture in picture for landing pad - can ensure camera won't contain portals in view so can be relatively low cost.

8) manual camera control - car games etc do this. on controller, practical to do this for landing - right thumb can use camera for eg landing, otherwise be pressing buttons.
