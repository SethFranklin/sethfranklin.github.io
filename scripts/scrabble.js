
var ScrabbleScores =
{

	a: 1,
	b: 3,
	c: 3,
	d: 2,
	e: 1,
	f: 4,
	g: 2,
	h: 4,
	i: 1,
	j: 8,
	k: 5,
	l: 1,
	m: 3,
	n: 1,
	o: 1,
	p: 3,
	q: 10,
	r: 1,
	s: 1,
	t: 1,
	u: 1,
	v: 4,
	w: 4,
	x: 8,
	y: 4,
	z: 10

};

function ScrabbleSort()
{

	var InputText = document.getElementById("Input").value;

	var FilteredArray = InputText.trim().replace(/\r?\n|\r/g, " ").replace(/[.,\/#!$%\^&\*;:'"?0123456789{}=\-_`~()]/g, "").split(" ");

	var ScoredArray = {};

	FilteredArray.forEach(function(Word)
	{

		var CaseAdjustedWord = Word.toLowerCase();

		if (!(CaseAdjustedWord in ScoredArray) && CaseAdjustedWord != "")
		{

			ScoredArray[CaseAdjustedWord] = 0;

			for (CharIndex = 0; CharIndex < CaseAdjustedWord.length; CharIndex++)
			{

				ScoredArray[CaseAdjustedWord] += ScrabbleScores[CaseAdjustedWord.charAt(CharIndex)];

			}

		}

	});

	SortedArray = Object.keys(ScoredArray).sort(function(a,b){return ScoredArray[a]-ScoredArray[b]});

	document.getElementById("Output").innerHTML = SortedArray;
	
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
