
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

		var result = log_reg(xarray, yarray);

		Output.innerHTML = "y = " + result[0].toFixed(4) + " + " + result[1].toFixed(4) + " * ln(x)";

	}


}

function log_reg(xvals, yvals) // two arrays of numbers of same length n
{

	var b0 = 0;
	var b1 = 0;

	var A = 0;
	var C = 0;
	
	var ysum = 0;
	var lnxsum = 0;
	var ln2xsum = 0;
	var ylnxsum = 0;

	var n = xvals.length;

	for (var i = 0; i < n; i++)
	{

		var ln = Math.log(xvals[i]);
		ysum += yvals[i];
		lnxsum += ln;
		ln2xsum += (ln * ln);
		ylnxsum += (yvals[i] * ln);

	}

	A = ((ysum * ln2xsum) - (lnxsum * ylnxsum)) / ((n * ylnxsum) - (ysum * lnxsum));
	C = ysum / ((n * A) + lnxsum);

	b0 = A * C
	b1 = C;

	return [b0, b1];

}