const router = require("express").Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const isAuthenticated = require("../middleware/jwt.middleware")

const saltRounds = 10

const Player = require("../models/player.model")

router.post("/signup", (req, res, next) => {
    const { username, email, password } = req.body

    if (!username) {
        return res
            .status(400)
            .json({ errorMessage: "Please provide your username." });
    }

    if (password.length < 8) {
        return res.status(400).json({
            errorMessage: "Your password needs to be at least 8 characters long.",
        });
    }

    const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
  
    if (!regex.test(password)) {
      return res.status(400).json( {
        errorMessage:
          "Password needs to have at least 8 chars and must contain at least one number, one lowercase and one uppercase letter.",
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
                        email,
                        password: hashedPassword
                    })
                })
                .then(newPlayer => {
                    const payload = { username, email }
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
})

router.post("/login", (req, res, next) => {
    const { username, email, password } = req.body
    
})

router.get("/:id", isAuthenticated, (req, res, next) => {
    const { id } = req.params
})

router.put("/:id", isAuthenticated, (req, res, next) => {
    const { id } = req.params
    const { username, email, password } = req.body
    
})

router.delete("/:id", isAuthenticated, (req, res, next) => {
    const { id } = req.params

})

module.exports = router
