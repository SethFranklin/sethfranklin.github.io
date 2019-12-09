var game;
var element;
var page;

window.onload = function () {
	element = document.getElementById("page");
	httpGetRequest(window.location.href.replace(window.location.hash, "") + "/game.json").then(function(gameText) {
		game = JSON.parse(gameText);
		page = window.location.hash ? window.location.hash.substring(1) : "start";
		updatePage();
	}, function (reject) {
		console.error(reject);
	});
};

window.onhashchange = function() {
	if (page && window.location.hash && page != window.location.hash.substring(1)){
		page = window.location.hash.substring(1);
		updatePage();
	}
}

function httpGetRequest(url) {
	return new Promise(function (resolve, reject) {
		var request = new XMLHttpRequest();
		request.open("GET", url);
		request.send();
		request.onload = function() {
			if (request.status == 200) resolve(request.response);
			else reject(request.statusText);
		}
	});
}

function updatePage() {
	var output = game[page];
	var i;
	while ((i = output.indexOf("|")) != -1) {
		var first = output.substring(0, i);
		var second = output.substring(i + 1);
		var j = second.indexOf("|");
		var mid = second.substring(0, j);
		var split = mid.split(",");
		output = first + "<a href='#" + split[1] + "'>" + split[0] + "</a>" + second.substring(j + 1);
	}
	var b = true;
	while ((i = output.indexOf("**")) != -1) {
		output = output.substring(0, i) + (b ? "<b>" : "</b>") + output.substring(i + 2);
		b = !b;
	}
	b = true;
	while ((i = output.indexOf("*")) != -1) {
		output = output.substring(0, i) + (b ? "<i>" : "</i>") + output.substring(i + 1);
		b = !b;
	}
	element.innerHTML = "<p class='firstp'>" + output.replace(/\n/g, "</p><p>") + "</p>";
	window.location.hash = page;
}

