const videoEl = document.querySelector("#my-video");
let stream = null;
const constraints = {
  audio: true,
  video: true,
};

const getMicAndCamera = async (e) => {
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);

    changeButtons([
      "green",
      "blue",
      "blue",
      "blue",
      "blue",
      "grey",
      "grey",
      "blue",
    ]);
  } catch (error) {
    console.log(error);
  }
};

const showMyFeed = async () => {
  console.log(stream);
  videoEl.srcObject = stream; // this will set the MediaStream to the video tag
  const tracks = stream.getTracks(); // get individual tracks that came from the MediaStream
  // console.log(tracks)

  changeButtons([
    "green",
    "green",
    "blue",
    "blue",
    "blue",
    "grey",
    "grey",
    "blue",
  ]);
};

const stopMyFeed = () => {
  const tracks = stream.getTracks();
  tracks.forEach((track) => {
    console.log(track);
    track.stop();
  });
};

document
  .querySelector("#share")
  .addEventListener("click", (e) => getMicAndCamera(e));
document
  .querySelector("#show-video")
  .addEventListener("click", (e) => showMyFeed(e));
document
  .querySelector("#stop-video")
  .addEventListener("click", (e) => stopMyFeed(e));
document
  .querySelector("#change-size")
  .addEventListener("click", (e) => changeVideoSize(e));
document
  .querySelector("#start-record")
  .addEventListener("click", (e) => startRecording(e));
document
  .querySelector("#stop-record")
  .addEventListener("click", (e) => stopRecording(e));
document
  .querySelector("#play-record")
  .addEventListener("click", (e) => playRecording(e));
document
  .querySelector("#share-screen")
  .addEventListener("click", (e) => shareScreen(e));
