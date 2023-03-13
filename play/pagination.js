import { ObjectId } from "mongodb";
import { use, db } from "../mongocli.js";

use("sample_restaurants");

function paginator(col, proj) {
  let oid = new ObjectId("000000000000");
  let cur;
  if (undefined === proj) {
    proj = { _id: 1 };
  }
  return {
    next: async function (lim) {
      if (undefined === lim) {
        lim = 5;
      }
      cur = await col
        .find(
          {
            _id: { $gt: oid },
          },
          proj,
        )
        .limit(lim);
      const arrPg = await cur.toArray();
      oid = arrPg[arrPg.length - 1]._id;
      return arrPg;
    },
    hasNext: async function () {
      cur = await col.findOne(
        {
          _id: { $gt: oid },
        },
        proj,
      );
      return cur !== null;
    },
  };
}

const co = db.collection("restaurants");
const ptor = paginator(co);
let pmax = 3;
while ((await ptor.hasNext()) && pmax-- > 0) {
  console.log("------------------------------");
  const arpg = await ptor.next();
  console.log(arpg);
}

process.exit();
