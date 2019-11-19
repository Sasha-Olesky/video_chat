var static = require('node-static');
var http = require('http');
var uuid = require('node-uuid');
var file = new(static.Server)();

var server = http.createServer(function (req, res) {
	file.serve(req, res);
});
server.listen(2016, 'localhost');
var io = require ('socket.io').listen(server);;
//var sockets = io.sockets.

io.sockets.on('connection', function (clientSocket){
	//function to log allerts on client side
	function log(){
		var array = [">>> Message from server: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    clientSocket.emit('log', array);
	}

	clientSocket.emit('connected', 'connected');
	log( 'User ' + clientSocket.id + ' is connected' );

    clientSocket.on('message', function(receivedMsg){ 
	    log('i sent this message: ', receivedMsg);

	    if (receivedMsg.method === 'createOrJoin'){
	    	log('receivedMsg.method: ', receivedMsg.method);
	    	log('Request to create or join session: ', receivedMsg.sessionId);
	      	//var sessionId = uuid.v4(); // optional - generate sessionId
	    	var memberIdsInRoom = io.sockets.adapter.rooms[receivedMsg.sessionId]; //assign sessionId to socket room 
			var numMembers = (typeof memberIdsInRoom !== 'undefined') ? Object.keys(memberIdsInRoom).length : 0; //members in room
			console.log(memberIdsInRoom);
			log('Session ' + receivedMsg.sessionId + ' has ' + numMembers + ' member(s)');
			//check in db camId+ aptId and push notification
			if (numMembers == 0){
				var eventCreated = {event: 'session created'};
				clientSocket.join(receivedMsg.sessionId);
				io.sockets.to(receivedMsg.sessionId).emit('message', eventCreated);
				//io.sockets.to(receivedMsg.sessionId).emit('message', JSON.stringify(eventCreated));
				log('Created session: ' + receivedMsg.sessionId + ' Waiting for remote parties to join.');
				log('numMembers = ', numMembers);

			}else if (numMembers > 0){
				var eventJoined = {event: 'joined session'};
				clientSocket.join(receivedMsg.sessionId);
	      		io.sockets.to(clientSocket.id).emit('message', eventJoined);
	      		//io.sockets.to(clientSocket.id).emit('message', JSON.stringify(eventJoined));
	      		log('joined session: ' + receivedMsg.sessionId);
	      		console.log(memberIdsInRoom);
	      	}else {
	      		log('num of members in session can not be negative!');
	      	}

		}else{
			clientSocket.broadcast.emit('message', receivedMsg);
	      	//clientSocket.broadcast.emit('message', JSON.stringify(data));
      		//io.sockets.to(receivedMsg.sessionId).broadcast.emit( 'message', receivedMsg);
      		//clientSocket.to(receivedMsg.sessionId).emit('message', receivedMsg);
	      	
	    }
	     
	     console.log (JSON.stringify(receivedMsg) + ' completed.');
	});
 });
