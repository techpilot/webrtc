const userName = "Steve-" + Math.floor(Math.random() * 100000);
const password = "X";
document.querySelector("#user-name").innerHTML = userName;

const socket = io.connect("https://192.168.1.37:8181/", {
  auth: {
    userName,
    password,
  },
});

const localVideoEl = document.querySelector("#local-video");
const remoteVideoEl = document.querySelector("#remote-video");

let peerConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

let localStream; //a var to hold the local video stream
let remoteStream; //a var to hold the remote video stream
let peerConnection; //the peerConnection that the two clients use to talk
let didIOffer = false;

const call = async (e) => {
  await fetchUserMedia();

  // peer connection all setw with stun servers sent over
  await createPeerConnection();

  // create offer
  try {
    console.log("creating offer...");

    const offer = await peerConnection.createOffer();
    console.log(offer);
    peerConnection.setLocalDescription(offer);
    didIOffer = true;
    socket.emit("newOffer", offer); // send offer to signaling server
  } catch (error) {
    console.log(error);
  }
};

const answerOffer = async (offerObj) => {
  await fetchUserMedia();
  await createPeerConnection(offerObj);
  const answer = await peerConnection.createAnswer({});
  await peerConnection.setLocalDescription(answer);
  console.log(offerObj);
  console.log(answer);
  // console.log(peerConnection.signalingState)

  // add the answer to the offerObj so the server know which answer this is related to
  offerObj.answer = answer;
  // emit the answer to signaling server so that it can emit to client one
  // expect a response from the server wit the already existing ICE candidate
  const offerIceCandidates = await socket.emitWithAck("newAnswer", offerObj);
  offerIceCandidates.forEach((c) => {
    peerConnection.addIceCandidate(c);
    console.log("=======Added Ice Candidate=====");
  });
  console.log(offerIceCandidates);
};

const addAnswer = async (offerObj) => {
  //addAnswer is called in socketListeners when an answerResponse is emitted.
  //at this point, the offer and answer have been exchanged!
  //now CLIENT1 needs to set the remote
  await peerConnection.setRemoteDescription(offerObj.answer);
  console.log(peerConnection.signalingState);
};

const fetchUserMedia = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoEl.srcObject = stream;
      localStream = stream;
      resolve();
    } catch (error) {
      console.log(error);
      reject();
    }
  });
};

const createPeerConnection = (offerObj) => {
  return new Promise(async (resolve, reject) => {
    peerConnection = await new RTCPeerConnection(peerConfiguration);
    remoteStream = new MediaStream();
    remoteVideoEl.srcObject = remoteStream;

    localStream.getTracks().forEach((track) => {
      // add local tracks so that they can be sent once the connection is established
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.addEventListener("signalingstatechange", (e) => {
      console.log(e);
      console.log(peerConnection.signalingState);
    });

    peerConnection.addEventListener("icecandidate", (e) => {
      console.log(".....Ice candidate found.....");
      console.log(e);

      if (e.candidate) {
        socket.emit("sendIceCandidateToSignalingServer", {
          iceCandidate: e.candidate,
          iceUserName: userName,
          didIOffer,
        });
      }
    });

    peerConnection.addEventListener("track", (e) => {
      console.log("Got a track from the other peer!! How excting");
      console.log(e);
      e.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track, remoteStream);
        console.log("Here's an exciting moment...");
      });
    });

    if (offerObj) {
      // won't be set when called from call()
      // console.log(peerConnection.signalingState) // should be stable because no setDesc has been run yet
      await peerConnection.setRemoteDescription(offerObj.offer);
      // console.log(peerConnection.signalingState) // should be have-remote-offer, because client2 has setRemoteDesc on the offer
    }

    resolve();
  });
};

const addNewIceCandidate = (iceCandidate) => {
  peerConnection.addIceCandidate(iceCandidate);
  console.log("======Added Ice Candidate======");
};

document.querySelector("#call").addEventListener("click", call);
