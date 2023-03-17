import { use, db } from "../mongocli.js";
import mgen from "mgeneratejs";

use("bigdb");

const sample = {
  name: "$name",
  age: "$age",
  sex: { $pick: { array: ["male", "female", "it"] } },
  emails: { $array: { of: "$email", number: 10 } },
  born_in: { $date: { min: "1980-01-01", max: "2023-12-31" } },
  country: { $country: { full: true } },
};

function gen_data(nIns) {
  let docs = [];
  let doc;
  while (nIns-- > 0) {
    doc = mgen(sample);
    docs.push(doc);
    // console.log(doc);
  }
  return docs;
}

async function fillCollection() {
  const insmany = gen_data(2);
  // await db.collection("users").insertMany(insmany, { writeConcern: { w: 1 } });
}
await fillCollection();

process.exit();
