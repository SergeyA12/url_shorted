const express = require("express");
const body_parser = require("body-parser");
const redis = require("redis");
const { MongoClient } = require("mongodb");
const validUrl = require("valid-url");

const PORT = 3062;

const app = express();
app.use(body_parser.json());

const redisClient = redis.createClient({ url: "redis://localhost:6379" });
const client = new MongoClient("mongodb://127.0.0.1:27017");
client.connect();
const db = client.db("URL");
const collection = db.collection("URL_SHORTED");

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});
redisClient.connect();

const shortedUrl = () => {
  return Math.random().toString(36).slice(2, 8);
};

app.post("/shorten", async (req, res) => {
  const { url } = req.body;
  if (!validUrl.isUri(url)) {
    return res.status(400).json({ message: "Invalid URL" });
  }
  const myUrl = shortedUrl();
  const test = await collection.findOne({ url });

  if (!url) {
    return res.status(400).json({ message: "Incorrect data" });
  } else if (test) {
    return res.status(409).json({ message: "URL already declared" });
  } else {
    await collection.insertOne({ url, myUrl });
  }

  res
    .status(201)
    .json({ message: "URL shortened successfully", shortedUrl: myUrl });
});

app.get("/:xaryUrl", async (req, res) => {
  const url = req.params.xaryUrl;
  console.log(url);

  const cachedUrl = await redisClient.get(`url:${url}`);

  if (cachedUrl) {
    return res.redirect(JSON.parse(cachedUrl));
  }
  const ourl = await collection.findOne({ myUrl: url });
  console.log(ourl);

  if (!ourl) {
    return res.status(404).json({ message: "URL not found" });
  }
  await redisClient.set(`url:${url}`, JSON.stringify(ourl.url));

  res.redirect(ourl.url);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
