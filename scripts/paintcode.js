

function ScrabbleSort()
{

	var InputText = document.getElementById("Input").value;

	var Output = "";

	if (InputText.length % 3 != 0) Output = "Length of string must be a multiple of three. Simply adding spaces can fix this.";
	else
	{

		for (var i = 0; i < InputText.length / 3; i++)
		{

			Output += "Color " + (i + 1) + ": (";

			Output += parseInt(InputText[(i * 3) + 2].charCodeAt(0).toString()) + ", ";
			Output += InputText[(i * 3) + 1].charCodeAt(0).toString() + ", ";
			Output += InputText[i * 3].charCodeAt(0).toString();

			Output += ")<br>";

		}

	}

	document.getElementById("Output").innerHTML = Output;
	
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