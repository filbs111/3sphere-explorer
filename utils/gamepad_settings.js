//this is minimum required to make a few sensible options.
//TODO figure out sensible object model, functions vs simple value config...

var gamepadSettingsX360Joypad = (()=>{
	var deadZone = 0.15;

	return {
		pitch:(gp, fixedRotateAmount) => Math.abs(gp.axes[3])>deadZone ? fixedRotateAmount*gp.axes[3] : 0,
		turn:(gp, fixedRotateAmount) => Math.abs(gp.axes[2])>deadZone ? fixedRotateAmount*gp.axes[2] : 0,
		roll:(gp) => gp.buttons[15].value-gp.buttons[14].value,	//dpad left/right
		moveEnabled:true,
		fireButton:5,	//R1
		deadZone	//used in moveEnabled mode. TODO put move funcs here, just return 0 for move disabled
	}
})();

var gamepadSettingsPhantomHawkA = (()=>{
	var deadZone = 0;

	return {
		pitch:(gp, fixedRotateAmount) => Math.abs(gp.axes[1])>deadZone ? -fixedRotateAmount*gp.axes[1] : 0,
		turn:(gp, fixedRotateAmount) => Math.abs(gp.axes[4])>deadZone ? fixedRotateAmount*gp.axes[4] : 0,
		roll:(gp) => gp.axes[0],
		moveEnabled:false,
		fireButton:0
	}
})();

//more intuitive? joy fwd = nose up, joy left = nose left, joy twist = roll
var gamepadSettingsPhantomHawkB = (()=>{
	var deadZone = 0;

	return {
		pitch:(gp, fixedRotateAmount) => Math.abs(gp.axes[1])>deadZone ? fixedRotateAmount*gp.axes[1] : 0,
		turn:(gp, fixedRotateAmount) => Math.abs(gp.axes[0])>deadZone ? fixedRotateAmount*gp.axes[0] : 0,
		roll:(gp) => Math.pow(gp.axes[4],3),
		moveEnabled:false,
		fireButton:0
	}
})();

//same as gamepadSettingsPhantomHawkB but different fire button
var gamepadSettingsSolR = (()=>{
	var deadZone = 0;

	return {
		pitch:(gp, fixedRotateAmount) => Math.abs(gp.axes[1])>deadZone ? fixedRotateAmount*gp.axes[1] : 0,
		turn:(gp, fixedRotateAmount) => Math.abs(gp.axes[0])>deadZone ? fixedRotateAmount*gp.axes[0] : 0,
		roll:(gp) => Math.pow(gp.axes[4],3),
		moveEnabled:false,
		fireButton:25
	}
})();

//special version to avoid nasty onset restoring force at middle joystick position by using circle around halfway forward.
var gamepadSettingsSolR2 = (()=>{
	var deadZone = 0;
	var deadZonePitch = 0.05

	return {
		pitch:(gp, fixedRotateAmount) => {
			var adjustedInput = Math.max(-1,Math.min(1,1+gp.axes[1]*2));
				//push stick halfway forward for centre point
			return Math.abs(gp.axes[1])>deadZonePitch ? adjustedInput*fixedRotateAmount : 0;
		},
		turn:(gp, fixedRotateAmount) => {
			var adjustedInput = Math.max(-1,Math.min(1,gp.axes[0]*2));
			return Math.abs(gp.axes[0])>deadZone ? adjustedInput*fixedRotateAmount : 0;
		},
		roll:(gp) => {
			var hacked = Math.abs(gp.axes[5])<0.005 ? 0 :Math.min(2*gp.axes[5]+1, 1);	//deadzone around centre, zero around halfway twisted left
				//TODO ability to switch off? pull to the right to switch off? otherwise accidentlly going to physical 0 point unintentionally makes
				//roll input go to 0
			return Math.pow(hacked,3);
		},
		moveEnabled:false,
		fireButton:25
	}
})();

var gpSettings = gamepadSettingsX360Joypad;
//var gpSettings = gamepadSettingsSolR2;