var localVideo;
var localStream;
var remoteVideo;
var sendingOffer = false;
var peerConnection;
var uuid;
var serverConnection;
const HTTPS_PORT = 8443;

function start(isCaller) {
  uuid = createUUID();

  // get the local video element
  localVideo = document.getElementById('localVideo');
  // get the remote video element
  remoteVideo = document.getElementById('remoteVideo');

  // connect to the web socket server
  serverConnection = new WebSocket('wss://' + window.location.hostname + ':' + HTTPS_PORT);
  serverConnection.onmessage = gotMessageFromServer;

  // is the producer then get media device
  if (isCaller) {
    if (navigator.mediaDevices.getUserMedia) {
      // get a media device
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(getUserMediaSuccess).catch(errorHandler);
    } else {
      alert('Your browser does not support getUserMedia API');
    }
  } else {
    // not a producer so just initializePeerConnection
    initializePeerConnection(isCaller);
  }
}

function shareScreen() {
  // get screen share button
  var shareScreenBtn = document.getElementById('shareScreenBtn');

  // if share screen then start sharing stream
  if (shareScreenBtn.value == 'Share Screen') {
    // if getDisplayMedia function supported
    if (navigator.mediaDevices.getDisplayMedia) {
      // then get a display media
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(getUserMediaSuccess).catch(errorHandler);

      // update button text
      shareScreenBtn.value = 'Stop Sharing Screen';
    } else {
      alert('Your browser does not support getDisplayMedia API');
    }
  } // stop sharing screen by sharing a media device
  else {
    if (navigator.mediaDevices.getUserMedia) {
      // get a media device
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(getUserMediaSuccess).catch(errorHandler);

      // update button text
      shareScreenBtn.value = 'Share Screen';
    } else {
      alert('Your browser does not support getUserMedia API');
    }
  }
}

function getUserMediaSuccess(stream) {
  localStream = stream;
  // set local video source to obtained stream object
  localVideo.srcObject = stream;

  // initialize peer connection and send offer
  initializePeerConnectAndSendOffer();
}

function initializePeerConnectAndSendOffer() {
  initializePeerConnection(true);

  // if not sending offer already
  if (!sendingOffer) {
    sendingOffer = true;

    // send offer every 2 seconds so consumers that weren't running can still recieve an offer to connect to the stream
    setInterval(() => {
      sendOffer();
    }, 2000);
  }
}

function initializePeerConnection(isProducer) {
  // if peer connection isn't already initialized
  if (!peerConnection) {
    // initialize peer connection
    peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.ontrack = gotRemoteStream;
  }

  // if current client is a producer
  if (isProducer) {
    // then add the local stream to the peer connection
    peerConnection.addStream(localStream);
    sendOffer();
  }
}

function sendOffer() {
  peerConnection.createOffer().then(producerGotDescription).catch(errorHandler);
}

function gotMessageFromServer(message) {
  if (!peerConnection) initializePeerConnection(false);

  var signal = JSON.parse(message.data);

  // Ignore messages from ourself
  if (signal.uuid == uuid) return;

  if (signal.sdp) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        peerConnection.createAnswer().then(producerGotDescription).catch(errorHandler);
      }
    }).catch(errorHandler);
  } else if (signal.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotIceCandidate(event) {
  if (event.candidate != null) {
    serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid }));
  }
}

function producerGotDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(function () {
    serverConnection.send(JSON.stringify({ 'sdp': peerConnection.localDescription, 'uuid': uuid }));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  // got a remote stream so go ahead and add it to the video source
  console.log('got remote stream');
  remoteVideo.srcObject = event.streams[0];
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
