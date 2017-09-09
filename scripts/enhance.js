

function Enhance()
{

	var InputText = document.getElementById("Input").value;
	var EnhanceText = document.getElementById("Input2").value;
	var Spaces = document.getElementById("spaces").checked;
	var Capitals = document.getElementById("capitals").checked;
	var WordArray = InputText.split(" ");
	var EnhanceArray = EnhanceText.split(",");

	HTMLString = "";

	for (var Index = 0; Index < WordArray.length; Index++)
	{

		if (Capitals) HTMLString += WordArray[Index].toUpperCase();
		else HTMLString += WordArray[Index];

		if (Index != WordArray.length - 1)
		{

			if (Spaces) HTMLString += " " + EnhanceArray[Math.floor(Math.random() * EnhanceArray.length)] + " ";
			else HTMLString += EnhanceArray[Math.floor(Math.random() * EnhanceArray.length)];

		}

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