var peerConnection;

// Polyfill
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

// ICE Servers
var servers = {
	iceServers: [
		{url: 'stun:stun.services.mozilla.com'},
		{url: 'stun:stun.l.google.com:19302'}
	]
};

var constraints = {
	video: false,
	audio: true
};

navigator.getUserMedia(constraints, function(stream) {
	local = stream;
}, onerror);

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
		console.log('got message', signal, peer);
		if(!peer) {
			peer = peers[signal.from] = new RTCPeerConnection(servers);
			peer.id = signal.from;
			
			peer.onicecandidate = function(event) {
				if(event.candidate != null) {
					server.send(peer.id, { ice: event.candidate });
				}
			};
	
			peer.onaddstream = function(event) {
				console.log('starting remote stream');
				remote = new Audio(window.URL.createObjectURL(event.stream));
				remote.play();
			};
			
			peer.addStream(local);
		}
		
		if(signal.enter) {
			console.log('createOffer');
			peer.createOffer(function(description) {
				peer.setLocalDescription(description, function() {
					server.send(peer.id, { sdp: description });
				}, onerror);
			}, onerror);
		} else if(signal.sdp) {
			peer.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
				if(signal.sdp.type == 'offer') {
					peer.createAnswer(function(description) {
						peer.setLocalDescription(description, function() {
							server.send(peer.id, { sdp: description });
						});
					}, onerror);
				}
			}, onerror);
		} else if(signal.ice) {
			peer.addIceCandidate(new RTCIceCandidate(signal.ice));
		}
	};
	
	return {
		send: function(to, data) {
			data.from = id;
			data.to = to;
			console.log('sending', data);
			sock.send(JSON.stringify(data));
		},
		broadcast: function(data) {
			data.from = id;
			console.log('broadcasting', data);
			sock.send(JSON.stringify(data));
		}
	};
})();

function enter() {
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
