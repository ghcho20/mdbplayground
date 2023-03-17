import { use, db } from "../mongocli.js";
import mgen from "mgeneratejs";

use("forum_db");

const metas = ["iot101", "iot202", "iot303"];

const sample = {
  timefield: { $date: {} },
  metafield: null,
  temp: { $integer: { min: 3, max: 40 } },
  hum: { $integer: { min: 10, max: 100 } },
  voltage: { $integer: { min: 2, max: 100 } },
};

function gen_data() {
  let docs = [];
  let doc;
  for (let i = 0; i < 60 * 3 * 100; i++) {
    doc = { ...mgen(sample), metafield: metas[i % 3] };
    docs.push(doc);
    console.log(doc);
  }
  return docs;
}

async function fillCollection() {
  const insmany = gen_data();
  await db.collection("TS").insertMany(insmany);
}
// await fillCollection();

async function query() {
  let doc = await db
    .collection("TS")
    .find()
    .sort({ timefield: 1 })
    .limit(1)
    .toArray();
  console.log(doc[0]);

  doc = await db
    .collection("TS")
    .find()
    .sort({ timefield: -1 })
    .limit(1)
    .toArray();
  console.log(doc[0]);

  let exp = await db.collection("TS").find({
    timefield: {
      $gte: new Date("1900-01-03T19:40:32.008Z"),
      $lte: new Date("2099-12-31T11:58:49.245Z"),
    },
  });
  console.log(exp);
}
await query();

process.exit();
