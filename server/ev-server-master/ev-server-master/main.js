'use strict';

/**********************************************************************
********************* Setup signaling channel *************************
**********************************************************************/
var host = 'localhost:2016'; //set socket server host
var reqSessionKey = {"method" : "createOrJoin" , "sessionId" : "1111", "params" : {"camId" : "4005", "uIDNo": "4C"}};
var sessionId = null;

//IO namespace scopes all code relevant to socket.io functionality
var IO = {
	//initialize and connect socket
	init: function (){
		IO.socket = io.connect(host, {'force new connection': true});
		IO.bindEvents();
	},

	//listen on following events emitted by server and call relevant function
	bindEvents: function() {
		IO.socket.on('connected', IO.onConnected);
		IO.socket.on('disconnect', IO.onDisconnected);
		IO.socket.on('message', onReceivedMessage);
		IO.socket.on('log', IO.onLog);
	},

	onConnected: function() {
		console.log('client has connected to the server!');
    initPeerConnection();      
	},

	onDisconnected: function() {
	      console.log('The client has disconnected!');
	},

	onLog: function(array) {
	      console.log.apply(console, array);
	},	

	disconnectSocket: function(){
		IO.socket.disconnect();
	},

	sendMessage: function(message){
		IO.socket.emit('message', message);
    	console.log('the client sent:', message);	
	}

};

function	onReceivedMessage(message) {
  console.log('Received a message from the server!', message);  
  console.log('switch: event ', message.event + ' type ' + message.type + ' default ' + message.candidate);
  switch(message.event || message.type){
  	case 'session created': //only initiator receives
  		initLocalMedia();
  		break;

		case 'joined session': //only joined party receives
			initLocalMedia();
			checkIsLocalMediaInit();
			break;

	  case 'offer': //received offer, need to reply with an answer - send sdp
			pc.setRemoteDescription(new RTCSessionDescription(message));
			createAnswer();
			//addRemoteSdp(message); can't call from here... race		
			break;

    case 'answer': //received answer, need to add remote sdp
		  addRemoteSdp(message);
		  break;

    case 'remote left':
      teardownAndDisconnect();
      break;

    default:
      if (message.candidate){
        console.log('im at candidate');
        console.log(message);
        addRemoteIceCandidate(message); //received candidate from remote
      }
      break;
      //	addIceCandidates();
  }

};

function checkIsLocalMediaInit() {
  if (!isLocalMediaInit) {
  		setTimeout("checkIsLocalMediaInit();", 1000);
  		return;
  } else {
  		createOffer(); //create offer
  }
  return;
}


window.onbeforeunload = function(e){
  IO.sendMessage({event: 'remote left'});
}
/**********************************************************************
*********************** Get Local User Media **************************
**********************************************************************/

//Support getUserMedia in different browsers (remove when using shim)
//navigator.getUserMedia = navigator.getUserMedia || 
//	navigator.webkitGetUserMedia || navigator.mozGetUserMedia; 


var localMediaStream; //local media stream object
var localConstraints = {audio: true, video: { width: 640, height: 360 }}; //local media params
var remoteMediaStream;
var isLocalMediaInit = false;
//var getLocalMedia = navigator.getUserMedia.bind(navigator);

function initLocalMedia() {
  	console.log("Initialize local video stream"); 
	// call getUserMedia method and request permissions to access devices
	var promiseUserMedia = navigator.mediaDevices.getUserMedia(localConstraints);
	// access to media devices succeeded 
	promiseUserMedia.then(function(localStream) {
		localMediaStream = localStream;
    pc.addStream(localMediaStream); //Add local Media Stream (after init PeerConnection factory )
		isLocalMediaInit = true;
		console.log("Local stream ready", localMediaStream);
    displayLocalPreview();
	},
	
// access to media devices failed 
	function localMediaError(error){
	  console.log("navigator.getUserMedia error: ", error);
	}
);
}

function displayLocalPreview() {
    // Provide local media stream as source for preview window
    var localMediaPreview = document.querySelector('#localMedia'); //insert local media to document element 
    localMediaPreview.src = window.URL.createObjectURL(localMediaStream);
    localMediaPreview.play(); //no need, element is on autoplay
    console.log('preview ready');
    //pc.addStream(localMediaStream); //Add local Media Stream (after init PeerConnection factory )
  }

/**********************************************************************
*************** initialise local peer connection factory **************
**********************************************************************/
//initiator

var pc;
var pcConfig = {'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]};
var pcConstraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};
// Set up audio and video regardless of what devices are present.
var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

function initPeerConnection() {
    pc = new RTCPeerConnection(pcConfig); //Create RTCPeerConnection Object
    pc.onicecandidate = sendIceCandidates; //add local Ice Candidate 
  	pc.onaddstream = addRemoteMediaStreams;
    pc.onremovestream = RemoveRemoteStream;
 //     pc.addStream(localMediaStream); //Add local Media Stream (after init PeerConnection factory )
    console.log('Created RTCPeerConnnection');
 // } catch (e) {
 //  console.log('Failed to create PeerConnection, exception: ' + e.message);
 //  alert('Cannot create RTCPeerConnection object.');
 //  return;
  //}
}

/**********************************************************************
********************* Create offer and send SDP ***********************
**********************************************************************/
function createOffer(){
	console.log('Creating and Sending offer to peer');
	pc.createOffer(function(offerSdp){		
	//create offer sdp obj with default params. to change defaults, change with  offerSdp.sdp = setSdp(offerSdp)
	pc.setLocalDescription(offerSdp);
	console.log('offer sdp: ', JSON.stringify(offerSdp));
	IO.sendMessage(offerSdp);
	},
	function(error){
		console.log('Error occured while creating an offer');
	});	
}

/**********************************************************************
************************ Sene Ice candidates **************************
**********************************************************************/
function sendIceCandidates(event) {
  
  if (event.candidate) {
    console.log('Send IceCandidate event: ', event);
    IO.sendMessage(event.candidate);
  } else {
    console.log('End of candidates.');
  }
}

/**********************************************************************
**************** On received offer -  create SDP Answer ***************
**********************************************************************/
function createAnswer(){
	console.log('Creating and Sending answer to peer')
	pc.createAnswer(function(answerSdp){		
	//sending default params. to change defaults, call answerSdp.sdp =  setSdp(offerSdp)
	pc.setLocalDescription(answerSdp);
  console.log('answer sdp: ', JSON.stringify(answerSdp));
	IO.sendMessage(answerSdp);
	},
	function(error){
		console.log('Error occured while creating an answer');
	});	
}

/**********************************************************************
***************** On received Answer -  add remote SDP ****************
**********************************************************************/
function addRemoteSdp(receivedSdp){
	console.log('received and creating new remote sdp: ', receivedSdp);
  //add new remote SDP
	pc.setRemoteDescription(new RTCSessionDescription(receivedSdp));
}

/**********************************************************************
**************** On received ICE -  add ice candidate ***************** 
**********************************************************************/
function addRemoteIceCandidate(receivedCandidate){
	console.log('received new ice candidate: ', receivedCandidate.candidate);
	var candidate = new RTCIceCandidate(receivedCandidate);
  //adding remote ice candidate to local peerConnection
  pc.addIceCandidate(candidate);
}

/**********************************************************************
************** add remote Media stream to browser display ************* 
**********************************************************************/
function addRemoteMediaStreams(anyRemoteStream){
  console.log('adding remote media stream: ', anyRemoteStream.stream);
  	remoteMediaStream = anyRemoteStream.stream;
    var remoteMediaDisplay = document.querySelector('#remoteMedia'); //insert local media to document element 
    remoteMediaDisplay.src = window.URL.createObjectURL(remoteMediaStream); //insert remote media to document element
    remoteMediaDisplay.play();
}

/**********************************************************************
*********************** Remote Stream Removed ************************* 
**********************************************************************/
function RemoveRemoteStream(event){
  console.log('Remote stream removed. Event: ', event);
  // check if last remote stream, then remove/unload local stream
}

/**********************************************************************
*********************** session teardown ****************************** 
**********************************************************************/
function teardownAndDisconnect(){
  pc.close();
  IO.socket.disconnect();
  localMediaStream.stop();
  console.log('disconnected and uloaded media');
}

