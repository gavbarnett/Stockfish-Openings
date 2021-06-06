function main() {
	var stockfish = new Worker("assets/js/node_modules/stockfish/src/stockfish.js");
	stockfish.postMessage("go depth 15");
	
	
	
	stockfish.onmessage = function(event) {
		//NOTE: Web Workers wrap the response in an object.
		console.log(event.data ? event.data : event);
	};
}
