const dbConnection = require("../config/mongoCollection");

const getCollectionFn = (collection) => {
    let _col = undefined;

    return async () => {
        if (!_col) {
            const db = await dbConnection.connectToDb();
            _col = await db.collection(collection);
        }

        return _col;
    };
};

module.exports = {
    user: getCollectionFn("users"),
    meet: getCollectionFn("meet"),
};
