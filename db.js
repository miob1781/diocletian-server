const mongoose = require("mongoose")
const MONGODB_URI = process.env.MONGODB_URI

mongoose.connect(MONGODB_URI)
    .then(x => {
        console.log("Connected to MongoDB! Database name: ", x.connections[0].name);
    })
    .catch(err => {
        console.log("Error while connecting to MongoDB: ", err);
    })
