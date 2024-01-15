let mediaRecorder
let recordedBlobs

const startRecording = () => {
  console.log("recording");
  recordedBlobs = []
  mediaRecorder = new MediaRecorder(stream)

  mediaRecorder.ondataavailable = e => {
    console.log("data is available for the media recorder")
    recordedBlobs.push(e.data)
  }

  mediaRecorder.start()
};

const stopRecording = () => {
  console.log("stoping");
  mediaRecorder.stop()
};

const playRecording = () => {
  console.log("playing");
  const superBuffer = new Blob(recordedBlobs)
  const recordedVideoEl = document.querySelector("#other-video")
  recordedVideoEl.src = window.URL.createObjectURL(superBuffer)
  recordedVideoEl.controls = true
};
