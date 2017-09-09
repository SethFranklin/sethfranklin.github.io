
function ScrabbleSort()
{

	var InputText = document.getElementById("Input").value;

	results = [];

	function doPermute(input, output, used, size, level) {        
            
        if (size == level) {
            var word = output.join(' ');
            results.push(word);
            return;
        } 
        
        level++;
        
        for (var i = 0; i < input.length; i++) {
            
            if (used[i]) {
                continue;
            }            
            
            used[i] = true;

            output.push(input[i]);
            
            doPermute(input, output, used, size, level);
            
            used[i] = false;
            
            output.pop();
        }
    }

    var chars = InputText.split(' ');
    var output = [];
    var used = new Array(chars.length);      

    doPermute(chars, output, used, chars.length, 0);

    var HTMLString = "";

    for (var index in results)
    {

    	HTMLString += results[index] + "<br>";

    }

	document.getElementById("Output").innerHTML = HTMLString;
	
}

function SelectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection
    ;    
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}