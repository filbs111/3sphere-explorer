var controlsTexts = (()=>{

    var zPos=1.5;
    var textSize = 0.4;
    var y= -1.5;

    var xTitle = 4.2;
    var xIndent = 4;

    var texts = [];

    addText("DISPLAY:", xTitle);
    [
        "C: TOGGLE CONTROL DISPLAY",
        "F: FULL SCREEN",
        "ESC: EXIT FULL SCREEN",
        "H: TOGGLE DEBUG MENU", 
    ].forEach(xx=>addText(xx, xIndent));

    y+=0.05;

    addText("ROCKET CONTROLS:", xTitle);
    [
        "ARROWS, MOUSE MOVE WHEN FULLSCREENED: PITCH/YAW",
        "Q,E: ROLL",
        "SPACE BAR: THRUST",
        "W,A,S,D: SIDE THRUST",
        "LEFT CLICK: FIRE GUN",
        "RIGHT CLICK, M: FIRE SPECIAL WEAPON",
        "NUM KEYS: SELECT SPECIAL WEAPON",
        "MOUSE WHEEL: CYCLE SPECIAL WEAPON",
    ].forEach(xx=>addText(xx, xIndent));

    function addText(text, x){
        texts.push({
            text, x,y,z:zPos,size:textSize
        });
        y+=0.15;
    }

    return texts;
})();