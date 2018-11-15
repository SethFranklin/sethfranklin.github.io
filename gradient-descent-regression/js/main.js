
// super sloppy js prototype

var DataText;
var FunctionText;
var IterationNumber;
var Button;
var Output;

window.onload = function()
{

	DataText = document.getElementById("data");
	FunctionText = document.getElementById("function");
	Button = document.getElementById("button");
	Output = document.getElementById("output");
	IterationNumber = document.getElementById("iterations");

	button.onclick = function()
	{

		var split1 = DataText.value.split(/\r?\n/);

		var xarray = [];
		var yarray = [];

		for (var i = 0; i < split1.length; i++)
		{

			var split2 = split1[i].split(" ");

			xarray.push(parseFloat(split2[0]));
			yarray.push(parseFloat(split2[1]));

		}

		var n = xarray.length;

		var constants = {};
		var previous_constants = {};

		var fnx = FunctionText.value;

		for (var i = 0; i < fnx.length; i++) // finds constants in function
		{

			if (fnx[i] == "b")
			{

				var constring = "b";
				var j = i + 1;

				while (j < fnx.length && fnx.charCodeAt(j) >= 48 && fnx.charCodeAt(j) <= 57)
				{

					constring += fnx[j];
					j++;

				}

				if (j > i + 1)
				{

					constants[constring] = {};
					previous_constants[constring] = {};

				}

			}

		}

		var constant_array = [];

		for (var key in constants) // variables for each constant
		{

			constant_array.push(key);

		}

		for (var i = 0; i < constant_array.length; i++)
		{

			constants[constant_array[i]].value = 0;
			constants[constant_array[i]].partial = 0;

			previous_constants[constant_array[i]].value = 0;

		}

		var iters = 0;
		var max_iters = IterationNumber.value;

		var step_coef = 0.01;

		var previous_step = 1;

		var min_precision = 0.00001;

		var partial_distance = 0.005;

		while (iters < max_iters) // main loop
		{

			for (var i = 0; i < constant_array.length; i++)
			{

				previous_constants[constant_array[i]].value = constants[constant_array[i]].value;

			}

			for (var i = 0; i < constant_array.length; i++) // Find gradient
			{

				var result2 = 0;
				var result1 = 0;

				for (var j = 0; j < constant_array.length; j++) // Sets the constant variables
				{

					eval("var " + constant_array[j] + " = " + constants[constant_array[j]].value);

				}

				// Start 2

				eval("var " + constant_array[i] + " = " + (constants[constant_array[i]].value + partial_distance));

				for (var j = 0; j < n; j++) // Add squared residual to result
				{

					eval("var x = " + xarray[j]);
					var residual = yarray[j] - eval(fnx);

					result2 += (residual * residual);

				}

				// Start 1

				eval("var " + constant_array[i] + " = " + (constants[constant_array[i]].value - partial_distance));

				for (var j = 0; j < n; j++) // Add squared residual to result
				{

					eval("var x = " + xarray[j]);
					var residual = yarray[j] - eval(fnx);

					result1 += (residual * residual);

				}

				// Find partial

				constants[constant_array[i]].partial = (result2 - result1) / (2 * partial_distance);

			}

			var sum = 0;

			for (var i = 0; i < constant_array.length; i++)
			{

				var delta = -step_coef * constants[constant_array[i]].partial;
				constants[constant_array[i]].value += delta;
				sum += (delta * delta);

			}

			previous_step = Math.sqrt(sum);

			iters++;

		}

		var EditedFunction = fnx;

		for (var i = 0; i < constant_array.length; i++)
		{

			EditedFunction = EditedFunction.replace(constant_array[i], constants[constant_array[i]].value.toFixed(4));

		}

		Output.innerHTML = "f(x) = " + EditedFunction;

	}


}