const fs = require("fs");
const https = require("https");
const express = require("express");
const app = express();
const socketio = require("socket.io");
app.use(express.static(__dirname));

//we need a key and cert to run https
//we generated them with mkcert
// $ mkcert create-ca
// $ mkcert create-cert
const key = fs.readFileSync("cert.key");
const cert = fs.readFileSync("cert.crt");

//we changed our express setup so we can use https
//pass the key and cert to createServer on https
const expressServer = https.createServer({ key, cert }, app);
//create our socket.io server... it will listen to our express port
const io = socketio(expressServer);

const offers = [
  // offererUserName
  // offer
  // offerIceCandidates
  // answererUserName
  // answer
  // answererIceCandidates
];

const connectedSockets = [
  //username, socketId
];

expressServer.listen(8181);
io.on("connection", (socket) => {
  // console.log('Someone has connected')

  const userName = socket.handshake.auth.userName;
  const password = socket.handshake.auth.password;
  //   console.log(password);

  if (password !== "X") {
    socket.disconnect(true);
    return;
  }

  connectedSockets.push({
    socketId: socket.id,
    userName,
  });

  if (offers.length) {
    socket.emit("availableOffers", offers);
  }

  socket.on("newOffer", (newOffer) => {
    offers.push({
      offererUserName: userName,
      offer: newOffer,
      offerIceCandidates: [],
      answererUserName: null,
      answer: null,
      answererIceCandidates: [],
    });
    // console.log("sdp", newOffer.sdp.slice(50));
    //send out to all connected sockets EXCEPT the caller
    socket.broadcast.emit("newOfferAwaiting", offers.slice(-1));
  });

  socket.on("newAnswer", (offerObj, ackFunction) => {
    // console.log(offerObj)

    // emit the answer(offerObj) back to CLIENT1
    // in order to do that, we need CLIENT1's socketid

    const socketToAnswer = connectedSockets.find(
      (s) => s.userName === offerObj.offererUserName
    );
    if (!socketToAnswer) {
      console.log("no matching sockets");
      return;
    }

    // we find a matching socket so we can emit to it
    const socketIdToAnswer = socketToAnswer.socketId;

    // find the offer to update so we can emit it
    const offerToUpdate = offers.find(
      (o) => o.offererUserName === offerObj.offererUserName
    );
    if (!offerToUpdate) {
      console.log("no offer to update");
      return;
    }
    // send back to the answerer the ICE candidates we have already collected
    ackFunction(offerToUpdate.offerIceCandidates);
    offerToUpdate.answer = offerObj.answer;
    offerToUpdate.answererUserName = userName;

    // socket has a .to() which allows emitting to a room
    // every socket has its own room
    socket.to(socketIdToAnswer).emit("answerResponse", offerToUpdate);
  });

  socket.on("sendIceCandidateToSignalingServer", (iceCandidateObj) => {
    const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
    // console.log(iceCandidate);
    if (didIOffer) {
      //this ice is coming from the offerer. Send to the answerer
      const offerInOffers = offers.find(
        (o) => o.offererUserName === iceUserName
      );
      if (offerInOffers) {
        offerInOffers.offerIceCandidates.push(iceCandidate);
        // 1. When the answerer answers, all existing ice candidates are sent
        // 2. Any candidates that come in after the offer has been answered, will be passed through
        if (offerInOffers.answererUserName) {
          //pass it through to the other socket
          const socketToSendTo = connectedSockets.find(
            (s) => s.userName === offerInOffers.answererUserName
          );
          if (socketToSendTo) {
            socket
              .to(socketToSendTo.socketId)
              .emit("receivedIceCandidateFromServer", iceCandidate);
          } else {
            console.log("Ice candidate recieved but could not find answere");
          }
        }
      }
    } else {
      //this ice is coming from the answerer. Send to the offerer
      //pass it through to the other socket
      const offerInOffers = offers.find(
        (o) => o.answererUserName === iceUserName
      );
      const socketToSendTo = connectedSockets.find(
        (s) => s.userName === offerInOffers.offererUserName
      );
      if (socketToSendTo) {
        socket
          .to(socketToSendTo.socketId)
          .emit("receivedIceCandidateFromServer", iceCandidate);
      } else {
        console.log("Ice candidate recieved but could not find offerer");
      }
    }
    // console.log(offers)
  });
});
