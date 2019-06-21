//this is minimum required to make a few sensible options.
//TODO figure out sensible object model, functions vs simple value config...

var gamepadSettingsX360Joypad = {
	pitchAxis:3,
	pitchMultiplier:1,
	turnAxis:2,
	turnMultiplier:1,
	deadZone:0.15,
	roll:function(gp){return gp.buttons[15].value-gp.buttons[14].value;},	//dpad left/right
	moveEnabled:true,
	fireButton:5,	//R1
};

var gamepadSettingsPhantomHawkA = {	//more conventional joysticks controls (like joystick stuck to roof of spaceship)
	pitchAxis:1,
	pitchMultiplier:-1,
	turnAxis:4,
	turnMultiplier:1,
	deadZone:0.0,
	roll:function(gp){return gp.axes[0];},
	moveEnabled:false,
	fireButton:0,
};

var gamepadSettingsPhantomHawkB = {	//more intuitive? joy fwd = nose up, joy left = nose left, joy twist = roll
	pitchAxis:1,
	pitchMultiplier:1,
	turnAxis:0,
	turnMultiplier:1,
	deadZone:0.0,
	roll:function(gp){return Math.pow(gp.axes[4],3);},
	moveEnabled:false,
	fireButton:0,
};

var gpSettings = gamepadSettingsX360Joypad;