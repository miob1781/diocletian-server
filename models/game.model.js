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
    players: [{
        type: Schema.Types.ObjectId,
        ref: "Player", required: true
    }],
    numPlayers: {
        type: Number,
        required: true
    },
    moves: [moveSchema],
    winner: {
        type: Schema.Types.ObjectId,
        ref: "Player"
    }
}, { timestamps: true })

const Game = model("Game", gameModel)

module.exports = Game
