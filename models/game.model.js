const { Schema, model } = require("mongoose")

const gameModel = new Schema({
    status: {
        type: String,
        enum: ["created", "finished"],
        required: true
    },
    numPlayers: {
        type: Number,
        enum: [2, 3, 4, 5, 6],
        required: true
    },
    size: {
        type: Number,
        enum: [4, 5, 6, 7, 8, 9, 10],
        required: true
    },
    density: {
        type: String,
        enum: ["sparse", "medium", "dense"],
        required: true
    },
    players: [{
        type: Schema.Types.ObjectId,
        ref: "Player",
        required: true
    }],
    creator: {
        type: Schema.Types.ObjectId,
        ref: "Player",
        required: true
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref: "Player"
    }
}, { timestamps: true })

const Game = model("Game", gameModel)

module.exports = Game
