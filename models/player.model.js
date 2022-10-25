const { Schema, model } = require("mongoose")

// model for players
const playerSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true })

// Player will be referenced in an array in the model Game.

const Player = model("Player", playerSchema)

module.exports = Player