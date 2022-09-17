const { Schema, model } = require("mongoose")

const playerSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true })

// Player will be referenced in an array in: Game.

const Player = model("Player", playerSchema)

module.exports = Player