import { use, db } from "../mongocli.js";

let pipe = [
  {
    $vectorSearch: {
      index: "vector_index",
      path: "vector",
      limit: 10,
      numCandidates: 100,
      queryVector: null,
      //   filter: {expression}
    },
  },
  {
    $project: {
      _id: 0,
      url: 1,
      sha: 1,
      title: 1,
      score: { $meta: "vectorSearchScore" },
    },
  },
];

use("gen");
const docs = db.collection("thousand").find().limit(300);

let acur, exp, vqt, qrt, qst, qet, i;
i = 0;
let vqmx, vqmn, rtmx, rtmn;
let vqsum, rtsum;
vqsum = rtsum = 0;
rtmx = vqmx = Number.NEGATIVE_INFINITY;
rtmn = vqmn = Number.POSITIVE_INFINITY;

// use pre-filter
pipe[0].$vectorSearch.filter = {
  type: "e",
};

for await (const d of docs) {
  pipe[0].$vectorSearch.queryVector = d.vector;
  acur = db.collection("million").aggregate(pipe);
  qst = Date.now();
  exp = await acur.explain("executionStats");
  qet = Date.now();

  vqt = exp.stages[2].executionTimeMillisEstimate;
  qrt = qet - qst;
  console.log(`${i}(_id:${d._id})\t: vqt[${vqt}]\tqrt[${qrt}]`);
  vqsum += vqt;
  vqmn = Math.min(vqmn, vqt);
  vqmx = Math.max(vqmx, vqt);
  rtsum += qrt;
  rtmn = Math.min(rtmn, qrt);
  rtmx = Math.max(rtmx, qrt);
  i++;
}
console.log(`vector query    min:max:avg =\t${vqmn} | ${vqmx} | ${vqsum / i}`);
console.log(`query rounttrip min:max:avg =\t${rtmn} | ${rtmx} | ${rtsum / i}`);

process.exit();

// test result for 300 rounds
//
// without filter
// vector query    min:max:avg =   81 | 221 | 145.81
// query rounttrip min:max:avg =   94 | 271 | 159.27666666666667
//
// with filter { type: 'e' }
// vector query    min:max:avg =   1195 | 2179 | 1765.71
// query rounttrip min:max:avg =   1216 | 2236 | 1808.2133333333334
