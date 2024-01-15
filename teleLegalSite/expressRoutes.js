const app = require("./server").app;
const jwt = require("jsonwebtoken");
const linkSecret = "thisisasecret";

app.get("/user-link", (req, res) => {
  const apptData = {
    professionalFullName: "Robert Bunch, J. D",
    apptDate: Date.now(),
  };

  // encode the data in a token
  const token = jwt.sign(apptData, linkSecret);
  res.send(`https://localhost:5173/join-video?token=${token}`)

  res.json("This is a test route");
});

app.post("/validate-link", (req, res) => {
    const token = req.body.token
    const decodedData = jwt.verify(token, linkSecret)
    res.json(decodedData)
})
