const router = require("express").Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const isAuthenticated = require("../middleware/jwt.middleware")
const Player = require("../models/player.model")

// number of salt rounds used for encryption
const saltRounds = 10

// regex pattern used for password
const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;

// signs up a new player
router.post("/signup", (req, res, next) => {
    const { username, password } = req.body

    // checks if username is provided
    if (!username) {
        return res.status(400).json({ errorMessage: "Please provide your username." });
    }

    // checks if password is provided
    if (!password) {
        return res.status(400).json({ errorMessage: "Please provide your password." });
    }

    // checks if password matches regex
    if (!regex.test(password)) {
        return res.status(400).json({
            errorMessage:
                "Password needs to have at least 8 characters and must contain at least one number, one lowercase and one uppercase letter.",
        });
    }

    Player.findOne({ username })
        .then(playerFromDB => {

            // checks if username already exists
            if (playerFromDB) {
                return res.status(400).json({ errorMessage: "Username already taken." })
            }

            // generates password and creates player id
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

            // creates auth token
            const payload = {
                id: newPlayer._id,
                username: newPlayer.username
            }

            const authToken = jwt.sign(
                payload,
                process.env.TOKEN_SECRET,
                { algorithm: "HS256", expiresIn: "6h" }
            )

            return res.json({ authToken })
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

// logs a user in
router.post("/login", (req, res, next) => {
    const { username, password } = req.body

    // checks if username is provided
    if (!username) {
        return res.status(400).json({ errorMessage: "Please provide your username." });
    }

    // checks if password is provided
    if (!password) {
        return res.status(400).json({ errorMessage: "Please provide your password." });
    }

    // checks if password matches regex
    if (!regex.test(password)) {
        return res.status(400).json({
            errorMessage:
                "Password needs to have at least 8 characters and must contain at least one number, one lowercase and one uppercase letter.",
        });
    }

    Player.findOne({ username })
        .then(playerFromDB => {

            // if no player is returned, the username does not exist
            if (!playerFromDB) {
                return res.status(400).json({ errorMessage: "Wrong credentials." })
            }

            // hashes and compares password
            bcrypt.compare(password, playerFromDB.password)
                .then(isSamePassword => {

                    // checks if password is correct
                    if (!isSamePassword) {
                        return res.status(400).json({ errorMessage: "Wrong credentials." })
                    }

                    // creates auth token
                    const payload = {
                        id: playerFromDB._id,
                        username: playerFromDB.username
                    }

                    const authToken = jwt.sign(
                        payload,
                        process.env.TOKEN_SECRET,
                        { algorithm: "HS256", expiresIn: "6h" }
                    )

                    return res.json({ authToken })
                })
        })
        .catch(err => {
            next(err)
        })
})

// verifies auth token and sends the payload
router.get("/verify", isAuthenticated, (req, res, next) => {
    res.json(req.payload)
})

// gets a player to invite by username and sends the id
router.get("/", isAuthenticated, (req, res, next) => {
    const { username } = req.query

    if (username) {
        Player.findOne({ username })
            .then(playerFromDB => {
                res.json({ id: playerFromDB._id })
            })
            .catch(err => {
                console.log("Error while loading player by username: ", err);
                next(err)
            })
            
    } else {
        res.status(400).json({ errorMessage: "No username has been submitted." })
    }
})

module.exports = router
