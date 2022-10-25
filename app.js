require("dotenv/config")
require("./db")
const logger = require("morgan")
const cors = require("cors")
const express = require("express")
const app = express()

// configuration
app.set("trust proxy", 1)

app.use(cors({
    credentials: true,
    origin: "http://127.0.0.1:5500" // remember to add specific origin in production
}))

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// routes
app.use("/player", require("./routes/player.routes"))
app.use("/game", require("./routes/game.routes"))

// error-handling
app.use((req, res, next) => {

    // this middleware runs whenever requested page is not available
    res.status(404).json({ errorMessage: "This route is not available." });
});

app.use((err, req, res, next) => {
    
    // whenever you call next(err), this middleware will handle the error
    // always logs the error
    console.error("ERROR", req.method, req.path, err);

    // if a token is not valid, send a 401 error
    if (err.name === "UnauthorizedError") {
        res.status(401).json({ message: "invalid token..." });
    }

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
        res.status(500).json({
            errorMessage: "Internal server error. Check the server console",
        });
    }
});

module.exports = app