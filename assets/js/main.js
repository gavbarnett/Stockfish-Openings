var body = document.documentElement;
var stockfish = new Worker("assets/js/node_modules/stockfish/src/stockfish.js")
var walkdepth = 5
var API_request_queue = []
var SF_depth = 3
var treeData = {
	"name": "start_pos",
	"children": []
	}

function main() {
	var movetree = {}
	API_request_queue.push(["go depth " + SF_depth, "start_pos", []])
	movetree["start_pos"] = {}	
	stockfish.postMessage(API_request_queue[0][0])

	stockfish.onmessage = function(event) {
		//NOTE: Web Workers wrap the response in an object.
		data = event.data
		//console.log(event.data ? event.data : event)
		rtn_str = data.match(/info depth (\S+) seldepth (\S+) multipv (\S+) score cp (\S+) nodes (\S+) nps (\S+) time (\S+) pv (\S+).* bmc (\S+)/)
		completed = data.match(/bestmove\s+(\S+)/)
		if (rtn_str){
			new_move_found = true
			considered_move = rtn_str[8]
			depth = parseInt(rtn_str[1],10)
			score_cp = parseInt(rtn_str[4],10)



			if (considered_move in movetree[API_request_queue[0][1]]){
				new_move_found = false
			}
			movetree[API_request_queue[0][1]][considered_move] = {}
			movetree[API_request_queue[0][1]][considered_move]["data"] = {}
			movetree[API_request_queue[0][1]][considered_move]["data"]["depth"] = depth
			movetree[API_request_queue[0][1]][considered_move]["data"]["score_cp"] = score_cp
			
			if ((API_request_queue[0][2]).length<walkdepth && new_move_found){
				new_movelist = API_request_queue[0][2].concat(considered_move)
				new_movelist_str = new_movelist.join(" ")
				movetree["start_pos " + new_movelist_str] = {}		
				API_request_queue.push(["position startpos move" + " " + new_movelist_str, "start_pos " + new_movelist_str, new_movelist])
			}	
		} else if (completed){
			//console.log(movetree)
			API_request_queue.shift()

			if ((API_request_queue.length)>0){
				console.log(API_request_queue[0][0])
				stockfish.postMessage(API_request_queue[0][0])
				stockfish.postMessage("go depth " + SF_depth)
			} else {
				//TREE COMPLETE
				console.log(movetree)
				//tidy up
				treePruner(movetree)
			}
		}
	}
}

function treePruner(oldtree){
	newtree = {}
	twigs = []
	console.log(oldtree)
	for (branch in oldtree){
		twigs = branch.split(" ")
		//THIS IS DIRTY HACK YUK!
		switch (twigs.length){
			case 1:
				newtree[twigs[0]] = {...newtree[twigs[0]] , ...oldtree[branch]}
				break;
			case 2:
				newtree[twigs[0]][twigs[1]] = {...newtree[twigs[0]][twigs[1]] , ...oldtree[branch]}
				break;
			case 3:
				newtree[twigs[0]][twigs[1]][twigs[2]] = {...newtree[twigs[0]][twigs[1]][twigs[2]], ...oldtree[branch]}
				break;
			case 4:
				newtree[twigs[0]][twigs[1]][twigs[2]][twigs[3]] = {...newtree[twigs[0]][twigs[1]][twigs[2]][twigs[3]], ...oldtree[branch]}
				break;
			case 5:
				newtree[twigs[0]][twigs[1]][twigs[2]][twigs[3]][twigs[4]] = {...newtree[twigs[0]][twigs[1]][twigs[2]][twigs[3]][twigs[4]], ...oldtree[branch]}
				break;
			case 6:
				newtree[twigs[0]][twigs[1]][twigs[2]][twigs[3]][twigs[4]][twigs[5]] = {...newtree[twigs[0]][twigs[1]][twigs[2]][twigs[3]][twigs[4]][twigs[5]], ...oldtree[branch]}
				break;
		}
	}
	console.log(newtree)
	treeData = treeGraphics(newtree, "start_pos")
	console.log(treeData)
	root = d3.hierarchy(treeData, function(d) { return d.children; });
}

function treeGraphics(Chesstree, nodename){
	let temptree = {
		"name": nodename,
		"children": []
		}
	for (move in Chesstree[nodename]){
		if (move != "data"){
			temptree["children"].push(treeGraphics(Chesstree[nodename], move))
		}
	}
	return (temptree)

}
