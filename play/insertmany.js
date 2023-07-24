import { use, db } from "../mongocli.js";
import mgen from "mgeneratejs";

use("sample");

const sample = {
  _id: 1,
  name: "$name",
  age: "$age",
  sex: { $pick: { array: ["male", "female", "it"] } },
  emails: { $array: { of: "$email", number: 10 } },
  born_in: { $date: { min: "1980-01-01", max: "2023-12-31" } },
  country: { $country: { full: true } },
};

function gen_data(lastId, nIns) {
  let docs = [];
  let doc;
  while (nIns-- > 0) {
    doc = mgen(sample);
    doc._id = ++lastId;
    docs.push(doc);
    // console.log(doc);
  }
  return docs;
}

async function fillCollection() {
  const lastDoc = await db
    .collection("users")
    .find()
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  const lastId = lastDoc[0] ? lastDoc[0]._id : 0;
  console.log("lastId: ", lastId);
  const insmany = gen_data(lastId, 200000);
  await db.collection("users").insertMany(insmany, { writeConcern: { w: 1 } });
}
await fillCollection();

process.exit();
