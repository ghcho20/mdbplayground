import { use, db } from "../mongocli.js";
import mgen from "mgeneratejs";
import { Long } from "mongodb";

use("dummy");

const sample = {
  dev: "iot101",
  timestamp: Date.now(),
  temp: 10,
};

async function run(docs) {
  const pipeline = [
    {
      $documents: docs,
    },
    {
      $setWindowFields: {
        partitionBy: "$dev",
        sortBy: { timestamp: 1 },
        output: {
          prev: {
            $first: "$temp",
            window: {
              documents: [-1, "current"],
            },
          },
        },
      },
    },
    {
      $set: {
        diff: { $subtract: ["$temp", "$prev"] },
      },
    },
    {
      $project: {
        dev: 1,
        timestamp: 1,
        temp: 1,
        diff: { $cond: [{ $gte: ["$diff", 0] }, "$diff", null] },
      },
    },
  ];
  const res = await db.aggregate(pipeline).toArray();
  res.forEach((d) => console.log(d));
}

function wait(wms) {
  return new Promise((res) => setTimeout(res, wms));
}

async function genDocs(dev, nDocs) {
  let ts = Date.now();
  let docs = [],
    temp,
    doc;
  while (nDocs-- > 0) {
    doc = mgen(sample);
    doc.timestamp = ts;
    temp = Date.now();
    temp = temp - Math.floor(temp / 100) * 100;
    doc.temp = temp;
    doc.dev = dev;
    docs.push(doc);
    ts += 1000;
    await wait(70);
  }
  return docs;
}

async function main() {
  let docs = await genDocs("iot101", 10);
  docs = docs.concat(await genDocs("iot102", 10));
  console.log(docs);
  await run(docs);
}

await main();

process.exit();
