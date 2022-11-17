const router = require("express").Router()
const Game = require("../models/game.model")
const Player = require("../models/player.model")

// gets games that have not started yet and specific game data for games of a user by playerId
router.get("/", (req, res, next) => {
    const { playerId } = req.query

    Game.find({ players: { $in: playerId } })
        .populate(["creator", "players"])
        .then(games => {
            const connectedPlayers = []
            const gamesCreated = []
            let numGamesFinished = 0
            let numGamesWon = 0

            games.forEach(game => {

                // gets all games of the user with the status "created"
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

                // gets the players the user used to play with, the number of finished games, and the number of games won
                } else if (game.status === "finished") {
                    numGamesFinished++

                    if (game.winner?.toString() === playerId) {
                        numGamesWon++
                    }

                    game.players.forEach(player => {
                        if (
                            player._id.toString() !== playerId &&
                            !connectedPlayers.map(p => p.id).includes(player._id.toString())
                        ) {
                            connectedPlayers.push({
                                id: player._id.toString(),
                                name: player.username
                            })
                        }
                    })
                }
            })

            res.send({ connectedPlayers, gamesCreated, numGamesFinished, numGamesWon })
        })
        .catch(err => {
            console.log("Error while loading games: ", err);
            next(err);
        })
})

// gets a specific game by id
router.get("/:id", (req, res, next) => {
    const { id } = req.params

    Game.findById(id)
        .populate(["players", "creator", "winner"])
        .then(game => {
            res.json({ game })
        })
        .catch(err => {
            console.log("Error while loading game: ", err);
            next(err);
        })
})

// creates a new web game
router.post("/", (req, res, next) => {
    const { numPlayers, size, density, playerIds, creatorId } = req.body

    // checks for required parameters
    if (!numPlayers || !size || !density || !playerIds) {
        return res.status(400).json({ errorMessage: "Please provide all required parameters." })
    }

    // checks that the creator participates in the game
    if (playerIds.length < 2 || !playerIds.includes(creatorId)) {
        return res.status(400).json({ errorMessage: "You must invite a player." })
    }

    // checks that not too many players are invited
    if (playerIds.length > numPlayers) {
        return res.status(400).json({ errorMessage: "You have invited too many players." })
    }

    // checks for duplicate players
    if (playerIds.some((el, index) => playerIds.slice(0, index).includes(el))) {
        return res.status(400).json({ errorMessage: "You can invite every player only once." })
    }

    Game.create({ status: "created", numPlayers, size, density, playerIds, creatorId })
        .then(createdGame => {
            res.status(201).send({ id: createdGame._id })
        })
        .catch(err => {
            console.log("Error while creating new game: ", err);
            next(err);
        })
})

// updates status and winner of a web game
router.put("/:id", (req, res, next) => {
    const { id } = req.params
    const { winner } = req.body
    const status = winner ? "finished" : "playing"

    if (winner && winner !== "computer") {
        Player.findOne({ username: winner })
            .then(playerFromDB => {
                const winnerId = playerFromDB._id
                return Game.findByIdAndUpdate(id, { status, winner: winnerId })
            })
            .then(() => {
                res.status(204).send()
            })
            .catch(err => {
                console.log("error: ", err)
                next(err)
            })

    } else {
        Game.findByIdAndUpdate(id, { status })
            .then(() => {
                res.status(204).send()
            })
            .catch(err => {
                console.log("Error while updating game: ", err)
                next(err)
            })
    }
})

// deletes a web game when an invited rejects or the creator revokes the invitation
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