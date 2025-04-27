const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gandi-hub-474d2-default-rtdb.firebaseio.com"
});

module.exports = admin;
