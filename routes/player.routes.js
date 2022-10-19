const router = require("express").Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const isAuthenticated = require("../middleware/jwt.middleware")

const saltRounds = 10
const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

const Player = require("../models/player.model")

router.post("/signup", (req, res, next) => {
    const { username, password } = req.body

    if (!username) {
        return res.status(400).json({ errorMessage: "Please provide your username." });
    }

    if (!password) {
        return res.status(400).json({ errorMessage: "Please provide your password." });
    }

    if (!regex.test(password)) {
        return res.status(400).json({
            errorMessage:
                "Password needs to have at least 8 characters and must contain at least one number, one lowercase and one uppercase letter.",
        });
    }

    Player.findOne({ username })
        .then(playerFromDB => {
            if (playerFromDB) {
                return res.status(400).json({ errorMessage: "Username already taken." })
            }
            return bcrypt.genSalt(saltRounds)
                .then(salt => bcrypt.hash(password, salt))
                .then(hashedPassword => {
                    return Player.create({
                        username,
                        password: hashedPassword
                    })
                })
        })
        .then(newPlayer => {
            const payload = {
                id: newPlayer._id,
                username: newPlayer.username
            }
            const authToken = jwt.sign(
                payload,
                process.env.TOKEN_SECRET,
                { algorithm: "HS256", expiresIn: "6h" }
            )
            return res.status(200).json({ authToken })
        })
        .catch(err => {
            if (err instanceof mongoose.Error.ValidationError) {
                return res.status(400).json({ errorMessage: err.message })
            }
            if (err.code === 11000) {
                return res.status(400).json({ errorMessage: "Username must be unique." })
            }
            return res.status(500).json({ errorMessage: err.message })
        })
})

router.post("/login", (req, res, next) => {
    const { username, password } = req.body

    if (!username) {
        return res.status(400).json({ errorMessage: "Please provide your username." });
    }

    if (!password) {
        return res.status(400).json({ errorMessage: "Please provide your password." });
    }

    if (!regex.test(password)) {
        return res.status(400).json({
            errorMessage:
                "Password needs to have at least 8 characters and must contain at least one number, one lowercase and one uppercase letter.",
        });
    }

    Player.findOne({ username })
        .then(playerFromDB => {
            if (!playerFromDB) {
                return res.status(400).json({ errorMessage: "Wrong credentials." })
            }
            bcrypt.compare(password, playerFromDB.password)
                .then(isSamePassword => {
                    if (!isSamePassword) {
                        return res.status(400).json({ errorMessage: "Wrong credentials." })
                    }
                    const payload = {
                        id: playerFromDB._id,
                        username: playerFromDB.username
                    }
                    const authToken = jwt.sign(
                        payload,
                        process.env.TOKEN_SECRET,
                        { algorithm: "HS256", expiresIn: "6h" }
                    )
                    return res.status(200).json({ authToken })
                })
        })
        .catch(err => {
            next(err)
        })
})

router.get("/verify", isAuthenticated, (req, res, next) => {
    res.json(req.payload)
})

router.get("/", isAuthenticated, (req, res, next) => {
    const { username } = req.query
    if (username) {
        Player.findOne({ username })
            .then(playerFromDB => {
                res.status(200).json({ id: playerFromDB._id })
            })
            .catch(err => {
                console.log("Error while loading player by username: ", err);
                next(err)
            })
    } else {
        res.status(400).json({ errorMessage: "No username has been submitted." })
    }
})

router.put("/:id", isAuthenticated, (req, res, next) => {
    const { id } = req.params
    const { username, password } = req.body

    if (!username) {
        return res.status(400).json({ errorMessage: "Please provide your username." });
    }

    if (!password) {
        return res.status(400).json({ errorMessage: "Please provide your password." });
    }

    if (!regex.test(password)) {
        return res.status(400).json({
            errorMessage:
                "Password needs to have at least 8 characters and must contain at least one number, one lowercase and one uppercase letter.",
        });
    }

    bcrypt.genSalt(saltRounds)
        .then(salt => bcrypt.hash(password, salt))
        .then(hashedPassword => {
            return Player.findByIdAndUpdate(id, {
                username,
                password: hashedPassword
            }, { new: true })
        })
        .then(newPlayer => {
            const playerData = {
                _id: newPlayer._id,
                username: newPlayer.username,
                connections: newPlayer.connections
            }
            return res.status(200).json({ playerData })
        })
        .catch(err => {
            if (err instanceof mongoose.Error.ValidationError) {
                return res.status(400).json({ errorMessage: err.message })
            }
            if (err.code === 11000) {
                return res.status(400).json({ errorMessage: "Username must be unique." })
            }
            return res.status(500).json({ errorMessage: err.message })
        })
})

router.delete("/:id", isAuthenticated, (req, res, next) => {
    const { id } = req.params
    Player.findByIdAndDelete(id)
        .then(() => {
            res.status(204).send()
        })
        .catch(err => {
            console.log("Error while deleting player: ", err);
            next(err);
        })
})

module.exports = router
