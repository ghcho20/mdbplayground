import { use, db } from "../mongocli.js";

use("search");

const docs = [
  { name: "simpleStay simpleStay", likes: 1 },
  { name: "simpleStay simplyStay simpleStay", likes: 6 },
  { name: "simpleStay", likes: 4 },
  { name: "simpleStay", likes: 3 },
  { name: "simpleStay in Jong-ro", likes: 4 },
  { name: "simpleStay is simpleStay", likes: 2 },
  { name: "simpleStay is simply affordable", likes: 3 },
];

async function fillCollection() {
  const col = db.collection("sort");
  await col.deleteMany();
  await col.insertMany(docs);
}
await fillCollection();

process.exit();
