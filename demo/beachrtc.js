/*
peer = new RTCPeerConnection(servers);
.onicecandidate
	send to other
.oniceconnectionstatechange
.onaddstream
.addStream(localStream);
.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
pc1.onCreateOffer
	pc1.setLocalDescription
	pc2.setRemoteDescription
	pc2.createAnswer
		pc1.setRemoteDescription
		pc2.setLocalDescription
*/

// ICE Servers
var servers = {
	iceServers: [
		{url: 'stun:stun.services.mozilla.com'},
		{url: 'stun:stun.l.google.com:19302'}
	]
};

// Audio only
var constraints = {
	video: false,
	audio: true
};

// Fetch local stream
navigator.getUserMedia(constraints, function(stream) {
	local = stream;
}, onerror);

// Hold local stream and peers
var local;
var peers = {};

var server = (function() {
	var id = (Date.now() + Math.random()).toString(36);
	var sock = new WebSocket('ws://52.38.106.219:3434');
	
	sock.onmessage = function(message) {
		var signal = JSON.parse(message.data);
		
		// Ignore self and messages addressed to others
		if(signal.from == id || signal.to && signal.to != id) {
			return;
		}
		
		var peer = peers[signal.from];
		console.log('recv', signal, peer);
		if(!peer) {
			peer = peers[signal.from] = new RTCPeerConnection(servers);
			peer.id = signal.from;
			
			peer.onicecandidate = function(event) {
				if(event.candidate) {
					server.send(peer.id, { ice: event.candidate });
				}
			};
			
			peer.oniceconnectionstatechange = function(event) {
				console.log('ice status change', event.target.iceConnectionState);
			};
			
			peer.onaddstream = function(event) {
				console.log('starting remote stream');
				peer.audio = new Audio(window.URL.createObjectURL(event.stream));
				peer.audio.play();
			};
			
			peer.addStream(local);
		}
/*
pc1.onCreateOffer
	pc1.setLocalDescription
	pc2.setRemoteDescription
	pc2.createAnswer
		pc1.setRemoteDescription
		pc2.setLocalDescription
*/
		if(signal.enter) {
			console.log('createOffer');
			peer.createOffer(function(offer) {
				console.log('setLocalDescription', offer);
				peer.setLocalDescription(offer, function() {
					server.send(peer.id, { sdp: offer });
				}, onerror);
			}, onerror);
		} else if(signal.sdp) {
			if(signal.sdp.type == 'offer') {
				peer.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
					console.log('setRemoteDescription');
					peer.createAnswer(function(answer) {
						console.log('setLocalDescription', answer);
						peer.setLocalDescription(answer, function() {
							server.send(peer.id, { sdp: answer });
						});
					}, onerror);
				}, onerror);
			} else {
				console.log(signal.sdp);
				peer.setLocalDescription(new RTCSessionDescription(signal.sdp), function() {
					console.log('setLocalDescription done');
				}, onerror);
			}
		} else if(signal.ice) {
			peer.addIceCandidate(new RTCIceCandidate(signal.ice));
		}
	};
	
	return {
		send: function(to, data) {
			data.from = id;
			data.to = to;
			console.log('send', data);
			sock.send(JSON.stringify(data));
		},
		broadcast: function(data) {
			data.from = id;
			console.log('send', data);
			sock.send(JSON.stringify(data));
		}
	};
})();

function start() {
	server.broadcast({
		enter: true
	});
}

function onerror(error) {
	console.error(error || 'An unexpected error occured');
}

//peer.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
/*

















// API to send messages to all or one client
var server = (function() {
	var id = (Date.now() + Math.random()).toString(36);
	var sock = new WebSocket('ws://52.38.106.219:3434');
	
	sock.onmessage = function(message) {
		var signal = JSON.parse(message.data);
		
		// Ignore self and messages addressed to others
		if(signal.from == id || signal.to && signal.to != id) {
			return;
		}
		
		var peer = peers[signal.from];
		if(!peer) {
			peer = peers[signal.from] = new RTCPeerConnection(servers);
			peer.id = signal.from;
			
			peer.onicecandidate = function(event) {
				if(event.candidate) {
					server.send(peer.id, { ice: event.candidate });
				}
			};
			
			peer.oniceconnectionstatechange = function(event) {
				console.log('ice changed!', event.target.iceConnectionState);
			};
	
			peer.onaddstream = function(event) {
				console.log('starting remote stream');
				peer.audio = new Audio(window.URL.createObjectURL(event.stream));
				peer.audio.play();
			};
			
			peer.addStream(local);
		}
		
		if(signal.enter) {
			console.log('createOffer');
			peer.createOffer(function(description) {
				console.log('setLocalDescription');
				peer.setLocalDescription(description, function() {
					server.send(peer.id, { sdp: description });
				}, onerror);
			}, onerror);
		} else if(signal.sdp) {
			console.log('setRemoteDescription');
			peer.sdp = signal.sdp;
			peer.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
				if(signal.sdp.type == 'offer') {
					console.log('createAnswer');
					peer.createAnswer(function(description) {
						console.log('setLocalDescription');
						peer.setLocalDescription(description, function() {
							server.send(peer.id, { sdp: description });
						});
					}, onerror);
				}
			}, onerror);
		} else if(signal.ice) {
			console.log('addIceCandidate');
			peer.addIceCandidate(new RTCIceCandidate(signal.ice));
		}
	};
	
	return {
		send: function(to, data) {
			data.from = id;
			data.to = to;
			sock.send(JSON.stringify(data));
		},
		broadcast: function(data) {
			data.from = id;
			sock.send(JSON.stringify(data));
		}
	};
})();

function start() {
	server.broadcast({
		enter: true
	});
}

function leave() {
	//for(var p in peers) {
	//	peers[p].close();
	//	delete peers[p];
	//}
}

function onerror(error) {
	console.error(error || 'An unexpected error occured');
}
*/
