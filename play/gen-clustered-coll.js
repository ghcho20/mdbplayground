import { use, db } from "../mongocli.js";
import mgen from "mgeneratejs";

use("clusterdb");

const sample = {
  name: "$name",
  age: "$age",
  sex: { $pick: { array: ["male", "female", "it"] } },
  emails: { $array: { of: "$email", number: 10 } },
  born_in: { $date: { min: "1980-01-01", max: "2023-12-31" } },
  country: { $country: { full: true } },
};

function inc(init) {
  let i = init;
  return function () {
    return i++;
  };
}

function gen_data(nIns) {
  let docs = [];
  let doc, seq;
  inc = inc(1);
  while (nIns-- > 0) {
    seq = inc();
    doc = mgen(sample);
    doc._id = { name: doc.name, age: doc.age, seq: seq };
    docs.push(doc);
    console.log(doc);
  }
  return docs;
}

async function fillCollection() {
  const insmany = gen_data(100000);
  const res = await db
    .collection("users")
    .insertMany(insmany, { writeConcern: { w: 1 } });
  // console.log(res);
}
await fillCollection();

process.exit();
