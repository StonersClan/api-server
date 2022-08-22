import cassandra from "cassandra-driver";

const client = new cassandra.Client({
  contactPoints: ["localhost"],
  localDataCenter: "datacenter1",
  keyspace: "sih",
  credentials: { username: process.env.DB_USER || "cassandra", password: process.env.DB_PASS || "cassandra" },
});

export default client;
