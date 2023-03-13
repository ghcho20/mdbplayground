import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const mcli = await (async function () {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: "../.env" });
  const connURI = process.env.ATLAS_CONN_URI ?? "";
  const cli = new MongoClient(connURI);
  await cli.connect();
  return cli;
})();

let db = mcli.db("test");

function use(DB) {
  db = mcli.db(DB);
}

export { use, db };
