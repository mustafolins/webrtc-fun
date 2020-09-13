
// get remote video element
const video = document.getElementById('remoteVideo')

Promise.all([
  // load all models
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
]).then(startFaceDetection)


function startFaceDetection() {
  // add event listener for when the video starts playing
  video.addEventListener('play', () => {
    // create a canvas element from the video
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    // match the canvas size to the video's size
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    
    // set an interval every 50 milliseconds
    setInterval(async () => {
      // detect face expressions
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      // clear canvas element
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      // draw detected face and draw predicted expression
      faceapi.draw.drawDetections(canvas, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    }, 50)
  })
}