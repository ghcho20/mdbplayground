import { use, db } from "../mongocli.js";
import mgen from "mgeneratejs";
import { Long } from "mongodb";

use("clusterdb");

await (async () => {
  await db.collection("seq").drop();
  await db.createCollection("seq");
  await db.collection("seq").insertOne({ _id: { seq: new Long("0") } });
})();

const sample = {
  name: "$name",
  age: "$age",
  sex: { $pick: { array: ["male", "female", "it"] } },
  emails: "$email",
  born_in: { $date: { min: "1980-01-01", max: "2023-12-31" } },
  country: { $country: { full: true } },
};

async function insert(workerID) {
  try {
    const doc = mgen(sample);
    const pipeline = [
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          as: "newdoc",
          let: { seq: "$_id.seq" },
          pipeline: [
            {
              $documents: [
                {
                  ...doc,
                  _id: { seq: { $add: ["$$seq", 1] } },
                },
              ],
            },
          ],
        },
      },
      {
        $replaceRoot: { newRoot: { $arrayElemAt: ["$newdoc", 0] } },
      },
      {
        $merge: {
          into: "seq",
          on: "_id",
          whenMatched: "fail",
        },
      },
    ];
    await db.collection("seq").aggregate(pipeline).toArray();
    return true;
  } catch (e) {
    return false;
  }
}

function backoff() {
  const rand = Math.round((Math.random() * 1000) / 6);
  return new Promise((res) => setTimeout(res, rand));
}

let seqExpect = await db
  .collection("seq")
  .find()
  .sort({ _id: -1 })
  .limit(1)
  .toArray();
seqExpect = seqExpect[0]._id.seq + 1;

const startTime = Date.now();

const workers = Array.from({ length: 10000 }, (v, i) => i + 1);
let nCollision = 0;
console.log(`start total [${workers.length}] workers`);
workers.forEach(async (wid) => {
  while (!(await insert(wid))) {
    // console.log(`worker[${wid}] collision: back off`);
    nCollision++;
    // await backoff();
  }
});

console.log("check duplicates");
async function verify() {
  let seqRead = seqExpect - 1;
  let nretry = 0;
  let read;
  while (seqRead < seqExpect) {
    await backoff();
    // console.log("check seqs:", ++nretry);
    read = await db
      .collection("seq")
      .find({ "_id.seq": { $gte: seqExpect } }, { _id: 1 })
      .toArray();
    if (read.length === workers.length) {
      seqRead = read[0]._id.seq;
    }
  }

  let hist = {};
  read.forEach((d) => (hist[d._id.seq] = 0));
  read.reduce((redu, d) => {
    redu[d._id.seq] += 1;
    return redu;
  }, hist);
  console.log(`total collisions: ${nCollision}`);
  if (Object.values(hist).every((d) => d === 1)) {
    console.log("no dupulicates found: OK");
  } else {
    console.log("dupulicates found: FAIL");
  }
}
await verify();

const endTime = Date.now();

console.log(`Elapsed: ${endTime - startTime}`);

process.exit();
