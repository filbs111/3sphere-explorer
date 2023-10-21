var text_util = (function(font_file){
    var returnObject = {
        isLoaded: false
    };
        
    var xhr = new XMLHttpRequest();
    xhr.open('GET', font_file);
    xhr.onreadystatechange = function() {
        //alert(req.responseText);
        const status = xhr.status;
        if (xhr.readyState == 4 && (status === 0 || (status >= 200 && status < 400))) { 

            console.log("loaded. status =" + xhr.status + ", readyState: " + xhr.readyState);
            console.log("font file is loaded!");

            returnObject.charInfo = (function(text){

                //committed to git unix style (with \n separators)
                //but it's possible that the user has checked out and hosted locally with line ending conversions on windows
                // (like I was doing!)
                //assume have a newline at end of the file. if penultimate char is \r, assume windows style newlines
                var newline = "\n";
                if (text.charAt(text.length - 2) == "\r".charAt(0)){
                    newline = "\r\n";
                    console.log("detected windows style line endings in font file.")
                }

                var lines = text.split(newline);
                console.log("number of lines : " + lines.length);
                var charInfo = {};

                for (var line of lines){
                    var parts = line.split(/\s+/);
                    if (parts[0] == "char"){
                        var dict = {};
                        for (var part of parts.slice(1)){
                            var keyValue = part.split("=");
                            if (keyValue.length == 2){
                                dict[keyValue[0]]=parseInt(keyValue[1]);
                            }
                        }
                        charInfo[dict.id] = dict;   //assume has id
                    }else{
                        //console.log("skipping non 'char ' line");
                    }
                }
                return charInfo;

            })(xhr.responseText);
            returnObject.isLoaded=true;
        }
    }
    xhr.send();
    return returnObject;
})('img/fonts/player1up.fnt');


