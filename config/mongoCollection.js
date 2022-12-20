const mongoClient = require("mongodb").MongoClient;
const settings = {
    mongoConfig: {
        serverUrl: "mongodb://127.0.0.1:27017/",
        database: "boom",
    },
};
const mongoConfig = settings.mongoConfig;

let _connection = undefined;
let _db = undefined;

module.exports = {
    connectToDb: async () => {
        if (!_connection) {
            _connection = await mongoClient.connect(mongoConfig.serverUrl);
            _db = await _connection.db(mongoConfig.database);
        }

        return _db;
    },
    closeConnection: () => {
        _connection.close();
    },
};
