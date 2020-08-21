function getGamepad(){
    var activeGamepad = false;
    //basic gamepad support

    //oculus touch controllers are recognised as controllers.
    //to work around, abuse fact that these don't have 10th button.
    //find the 1st gamepad with button 10.

    var gpads=navigator.getGamepads();
    if (gpads){
        for (gpad of gpads){
            if (gpad && gpad.buttons && gpad.buttons[10] && gpad.axes){
                activeGamepad = gpad;
                break;
            }
        }
    }
    //TODO handle choosing one of multiple gamepads and keeping that gamepad selected.	
    return activeGamepad;
}