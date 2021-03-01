"use strict";
var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var cors = require("cors");
var app = express();

var port = process.env.PORT || 3000;
let bodyParser = require("body-parser");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});

let urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: Number
});

let Url = mongoose.model("Url", urlSchema);

let responseObject = {};
app.post(
  "/api/shorturl/new",
  bodyParser.urlencoded({ extended: false }),
  (request, response) => {
    let inputUrl = request.body["url"];

    let urlRegex = new RegExp(
      /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
    );

    if (!inputUrl.match(urlRegex)) {
      response.json({ error: 'invalid url' });
      return;
    }

    responseObject["original_url"] = inputUrl;

    let inputShort = 1;

    Url.findOne({})
      .sort({ short: "desc" })
      .exec((error, result) => {
        if (!error && result != undefined) {
          inputShort = result.short + 1;
        }
        if (!error) {
          Url.findOneAndUpdate(
            { original: inputUrl },
            { original: inputUrl, short: inputShort },
            { new: true, upsert: true },
            (error, savedUrl) => {
              if (!error) {
                responseObject["short_url"] = savedUrl.short;
                response.json(responseObject);
              }
            }
          );
        }
      });
  }
);

app.get("/api/shorturl/:input", (request, response) => {
  let input = request.params.input;

  Url.findOne({ short: input }, (error, result) => {
    if (!error && result != undefined) {
      response.redirect(result.original);
    } else {
       response.json({ error: 'invalid url' });
    }
  });
});
