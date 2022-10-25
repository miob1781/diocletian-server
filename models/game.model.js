const { Schema, model } = require("mongoose")

// model for web games
const gameModel = new Schema({

    // the process of creating and playing a web game has three states:
    // - "created" is the phase when a player has posted a new web game, but the game has not started yet
    // - "playing" is the phase when the game has started, but not ended yet
    // - "finished" is when the game has ended and the winner has been added to the DB
    status: {
        type: String,
        enum: ["created", "playing", "finished"],
        required: true
    },

    // the number of players participating in the game
    numPlayers: {
        type: Number,
        enum: [2, 3, 4, 5, 6],
        required: true
    },

    // the size (number of rows and columns) of the board
    size: {
        type: Number,
        enum: [4, 5, 6, 7, 8, 9, 10],
        required: true
    },

    // the density of the board, i.e., how populated the board is at the beginning
    density: {
        type: String,
        enum: ["sparse", "medium", "dense"],
        required: true
    },

    // the participating players
    players: [{
        type: Schema.Types.ObjectId,
        ref: "Player",
        required: true
    }],

    // the creator of the web game
    creator: {
        type: Schema.Types.ObjectId,
        ref: "Player",
        required: true
    },

    // the invited players having accepted the invitation
    playersHavingAccepted: [{
        type: Schema.Types.ObjectId,
        ref: "Player"
    }],

    // the winner of the game
    winner: {
        type: Schema.Types.ObjectId,
        ref: "Player"
    }
}, { timestamps: true })

const Game = model("Game", gameModel)

module.exports = Game
