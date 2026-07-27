const {MongoClient} = require('mongodb');

const url = "mongodb://127.0.0.1:27017";

const client = new MongoClient(url);

async function connect() {
    try{
        await client.connect();
        console.log("connected to mongodb");
    } catch (err) {
        console.error("`connection failed");
        console.error(err);
        process.exit(1);
    }
}

module.exports = {
    connect,
    client
};