const router = require("express").Router()
const Game = require("../models/game.model")
const Player = require("../models/player.model")

router.get("/", (req, res, next) => {
    const { playerId } = req.query

    Game.find({
        players: {
            $in: playerId
        }
    })
        .populate(["creator", "players"])
        .then(games => {
            const players = []
            const gamesCreated = []
            let numGamesFinished = 0
            let numGamesWon = 0

            games.forEach(game => {
                if (game.status === "created") {
                    const playersData = game.players.map(player => {
                        return {
                            id: player._id,
                            name: player.username
                        }
                    })

                    const creatorData = {
                        id: game.creator._id,
                        name: game.creator.username
                    }

                    gamesCreated.push({
                        id: game._id,
                        numPlayers: game.numPlayers,
                        size: game.size,
                        density: game.density,
                        players: playersData,
                        creator: creatorData
                    })

                } else if (game.status === "finished") {
                    numGamesFinished++

                    if (game.winner === playerId) {
                        numGamesWon++
                    }

                    game.players.forEach(player => {
                        if (player._id !== playerId && players.includes(player._id)) {
                            players.push({
                                id: player._id,
                                name: player.username
                            })
                        }
                    })
                }
            })

            res.send({ players, gamesCreated, numGamesFinished, numGamesWon })
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
    const { winner } = req.body

    if (winner !== "computer") {
        Player.findOne({ username: winner })
            .then(playerFromDB => {
                const winnerId = playerFromDB._id
                return Game.findByIdAndUpdate(id, { status: "finished", winner: winnerId })
            })
            .then(() => {
                res.status(204).send()
            })
            .catch(err => {
                console.log("error: ", err)
                next(err)
            })
    } else {
        Game.findByIdAndUpdate(id, { status: "finished" })
            .then(() => {
                res.status(204).send()
            })
            .catch(err => {
                console.log("Error while updating game: ", err)
                next(err)
            })
    }
})

router.delete("/:id", (req, res, next) => {
    const { id } = req.params

    Game.findByIdAndDelete(id)
        .then(() => {
            res.status(204).send()
        })
        .catch(err => {
            console.log(err)
            next(err)
        })
})

module.exports = router