const app = require("./server").app;
const jwt = require("jsonwebtoken");
const linkSecret = "thisisasecret";
const { v4: uuidv4 } = require("uuid");

// normally this comes from the db
const professionalAppointments = [
  {
    professionalsFullName: "Peter Chan, J.D",
    apptDate: Date.now() + 500000,
    uuid: 1,
    clientName: "Jim Jones",
  },
  {
    professionalsFullName: "Peter Chan, J.D",
    apptDate: Date.now() - 2000000,
    uuid: 2, // uuid:uuidv4(),
    clientName: "Akash Patel",
  },
  {
    professionalsFullName: "Peter Chan, J.D",
    apptDate: Date.now() + 10000000,
    uuid: 3, //uuid:uuidv4(),
    clientName: "Mike Williams",
  },
];

app.set("professionalAppointments", professionalAppointments);

app.get("/user-link", (req, res) => {
  const uuid = uuidv4(); // standing in for uniques id or primary key in the database

  const apptData = professionalAppointments[0]

  // professionalAppointments.push(apptData);

  // encode the data in a token
  const token = jwt.sign(apptData, linkSecret);
  res.send(`https://localhost:5173/dashboard/inbox?token=${token}`);
  // console.log(token);

  res.json("This is a test route");
});

app.post("/validate-link", (req, res) => {
  const token = req.body.token;
  const decodedData = jwt.verify(token, linkSecret);
  // console.log(professionalAppointments)
  res.json(decodedData);
});

app.get("/pro-link", (req, res) => {
  const userData = {
    fullName: "Peter Chan, J.D",
    proId: 1234,
  };
  const token = jwt.sign(userData, linkSecret);
  res.send(
    `<a href="https://localhost:5173/dashboard/join-video?token=${token}" target="_blank">Link here</a>`
  );
});
