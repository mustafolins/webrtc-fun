var localVideo;
var localStream;
var remoteVideo;
var gotRemote = false;
var sendingOffer = false;
var peerConnection;
var uuid;
var serverConnection;

function pageReady(isCaller) {
  uuid = createUUID();

  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');

  serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
  serverConnection.onmessage = gotMessageFromServer;

  if (isCaller) {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(getUserMediaSuccess).catch(errorHandler);
    } else {
      alert('Your browser does not support getUserMedia API');
    }
  } else {
    start(isCaller);
  }
}

function shareScreen() {
  if (navigator.mediaDevices.getDisplayMedia) {
    navigator.mediaDevices.getDisplayMedia({video: true, audio: true}).then(getUserMediaSuccess).catch(errorHandler);
  } else {
    alert('Your browser does not support getDisplayMedia API');
  }
}

function getUserMediaSuccess(stream) {
  localStream = stream;
  localVideo.srcObject = stream;

  startStreamAndSendOffer();
}

function startStreamAndSendOffer() {
  start(true);

  if (!sendingOffer) {
    sendingOffer = true;
    setInterval(() => {
      createOffer();
    }, 2000);
  }
}

function start(isCaller) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.ontrack = gotRemoteStream;
  }

  if (isCaller) {
    peerConnection.addStream(localStream);
    createOffer();
  }
}

function createOffer() {
  peerConnection.createOffer().then(createdDescription).catch(errorHandler);
}

function gotMessageFromServer(message) {
  if (!peerConnection) start(false);

  var signal = JSON.parse(message.data);

  // Ignore messages from ourself
  if (signal.uuid == uuid) return;

  if (signal.sdp && !gotRemote) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
      }
    }).catch(errorHandler);
  } else if (signal.ice && !gotRemote) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotIceCandidate(event) {
  if (event.candidate != null) {
    serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));
  }
}

function createdDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function () {
    serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  remoteVideo.srcObject = event.streams[0];

  gotRemote = true;
}

function errorHandler(error) {
  console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
