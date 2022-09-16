const { Schema, model } = require("mongoose")

const fieldSchema = new Schema({
    fieldId: Number,
    value: {
        type: Number,
        enum: [0, 1, 2, 3, 4],
        required: true
    },
    player: {
        type: Schema.Types.ObjectId,
        ref: "Player"
    }
})

const boardSchema = new Schema({
    fields: [fieldSchema]
})

const moveSchema = new Schema({
    player: {
        type: Schema.Types.ObjectId,
        ref: "Player"
    },
    selectedField: fieldSchema,
    boardBeforeMove: boardSchema
})

const gameModel = new Schema({
    status: {
        type: String,
        enum: ["created, finished"],
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
        enum: ["sparse, medium, dense"],
        required: true
    },
    players: [{
        type: Schema.Types.ObjectId,
        ref: "Player"
    }],
    moves: [moveSchema],
    winner: {
        type: Schema.Types.ObjectId,
        ref: "Player"
    }
}, { timestamps: true })

const Game = model("Game", gameModel)

module.exports = Game
