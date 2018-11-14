
var TextArea;
var Button;
var Output;

window.onload = function()
{

	TextArea = document.getElementById("text");
	Button = document.getElementById("button");
	Output = document.getElementById("output");

	button.onclick = function()
	{

		var split1 = TextArea.value.split(/\r?\n/);

		var xarray = [];
		var yarray = [];

		for (var i = 0; i < split1.length; i++)
		{

			var split2 = split1[i].split(" ");

			xarray.push(parseFloat(split2[0]));
			yarray.push(parseFloat(split2[1]));

		}

		var result = LSRL(xarray, yarray);

		Output.innerHTML = "y = " + result[0] + " + " + result[1] + " * x";

	}


}

function LSRL(xvals, yvals) // two arrays of numbers of same length n
{

	var b0 = 0;
	var b1 = 0;
	var xsum = 0;
	var ysum = 0;
	var xysum = 0;
	var xsqrdsum = 0;

	var n = xvals.length;

	for (var i = 0; i < n; i++)
	{

		xsum += xvals[i];
		ysum += yvals[i];
		xysum += (xvals[i] * yvals[i]);
		xsqrdsum += (xvals[i] * xvals[i]);

	}

	b1 = ((xsum * ysum) - (n * xysum)) / ((xsum * xsum) - (n * xsqrdsum));
	b0 = (ysum - (b1 * xsum)) / n;

	return [b0, b1];

}