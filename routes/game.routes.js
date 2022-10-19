const router = require("express").Router()
const Game = require("../models/game.model")

router.get("/player/:playerId", (req, res, next) => {
    const { playerId } = req.params
    
    Game.find({
        players: {
            $in: playerId
        }
    })
        .then(games => {
            res.status(200).json({ games })
        })
        .catch(err => {
            console.log("Error while loading games: ", err);
            next(err);
        })
})

router.get("/:id", (req, res, next) => {
    const { id } = req.params

    Game.findById(id)
        .populate(["players", "creator", "winner"])
        .then(game => {
            res.status(200).json({ game })
        })
        .catch(err => {
            console.log("Error while loading game: ", err);
            next(err);
        })
})

router.post("/", (req, res, next) => {
    const { numPlayers, size, density, players, creator } = req.body

    if (!numPlayers || !size || !density || !players) {
        return res.status(400).json({ errorMessage: "Please provide all required parameters." })
    }

    Game.create({ status: "created", numPlayers, size, density, players, creator })
        .then(createdGame => {
            res.status(201).send({ id: createdGame._id })
        })
        .catch(err => {
            console.log("Error while creating new game: ", err);
            next(err);
        })
})

router.put("/:id", (req, res, next) => {
    const { id } = req.params
    const { status, winner } = req.body

    Game.findByIdAndUpdate(id, { status, winner }, { new: true })
        .then(updatedGame => {
            res.status(201).json({ game: updatedGame })
        })
        .catch(err => {
            console.log("Error while updating game: ", err);
            next(err);
        })
})


module.exports = router