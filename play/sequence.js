import { use, db } from "../mongocli.js";
import mgen from "mgeneratejs";

use("clusterdb");

const sample = {
  name: "$name",
  age: "$age",
  sex: { $pick: { array: ["male", "female", "it"] } },
  emails: "$email",
  born_in: { $date: { min: "1980-01-01", max: "2023-12-31" } },
  country: { $country: { full: true } },
};

async function insert() {
  try {
    const doc = mgen(sample);
    const pipeline = [
      {
        $sort: { seq: -1 },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          as: "newdoc",
          let: { seq: "$seq" },
          pipeline: [
            {
              $documents: [
                {
                  ...doc,
                  seq: { $add: ["$$seq", 1] },
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
          on: "seq",
          whenMatched: "fail",
        },
      },
    ];
    const agRes = await db.collection("seq").aggregate(pipeline).toArray();
    console.log(agRes[0]);
    return true;
  } catch (e) {
    return false;
  }
}

function fallback() {
  const rand = Math.round((Math.random() * 1000) / 2);
  return new Promise((res) => setTimeout(res, rand));
}

while (false === (await insert())) {
  console.log("FAIL");
  await fallback();
}

process.exit();
