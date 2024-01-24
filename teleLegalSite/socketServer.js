const io = require("./server").io;
const app = require("./server").app;
const jwt = require("jsonwebtoken");
const linkSecret = "thisisasecret";

const connectedProfessionals = [];

const allKnownOffers = {
  // uniqueId - key
  //offer
  //professionalsFullName
  //clientName
  //apptDate
  //offererIceCandidates
  //answer
  //answerIceCandidates
};

io.on("connection", (socket) => {
  console.log(socket.id, "has connected");

  const handshakeData = socket.handshake.auth.jwt;

  let decodedData;
  try {
    decodedData = jwt.verify(handshakeData, linkSecret);
  } catch (err) {
    console.log(err);
    socket.disconnect();

    return;
  }

  const { fullName, proId } = decodedData;

  if (proId) {
    const connectedPro = connectedProfessionals.find(
      (cp) => cp.proId === proId
    );

    if (connectedPro) {
      connectedPro.socketId = socket.id;
    } else {
      connectedProfessionals.push({
        socketId: socket.id,
        fullName,
        proId,
      });
    }

    const professionalAppointments = app.get("professionalAppointments");

    // professionalAppointments.push(apptData);
    socket.emit(
      "apptData",
      professionalAppointments.filter(
        (pa) => pa.professionalsFullName === fullName
      )
    );

    for (key in allKnownOffers) {
      if (allKnownOffers[key].professionalsFullName === fullName) {
        io.to(socket.id).emit("newOfferWaiting", allKnownOffers[key]);
      }
    }
  } else {
    //
  }

  //   console.log(connectedProfessionals);

  socket.on("newOffer", ({ offer, apptInfo }) => {
    // console.log(offer);
    // console.log("==============");
    // console.log(apptInfo);

    allKnownOffers[apptInfo.uuid] = {
      ...apptInfo,
      offer,
      offererIceCandidates: [],
      answer: null,
      answerIceCandidates: [],
    };

    const professionalAppointments = app.get("professionalAppointments");
    const pa = professionalAppointments.find((pa) => pa.uuid === apptInfo.uuid);
    console.log("prof", apptInfo);

    if (pa) {
      pa.waiting = true;
    }

    const p = connectedProfessionals.find(
      (cp) => cp.fullName === apptInfo.professionalsFullName
    );
    if (p) {
      // only emit if professional is connected
      const socketId = p.socketId;
      socket
        .to(socketId)
        .emit("newOfferWaiting", allKnownOffers[apptInfo.uuid]);

      socket.to(socketId).emit(
        "apptData",
        professionalAppointments.filter(
          (pa) => pa.professionalsFullName === apptInfo.professionalsFullName
        )
      );
    }
  });
});
