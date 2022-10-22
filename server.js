const app = require("./app")
const Game = require("./models/game.model")

const { createServer } = require("http")
const { Server } = require("socket.io")

const httpServer = createServer(app)
const io = new Server(httpServer, {
    serveClient: false,
    cors: {
        credentials: true,
        origin: "http://127.0.0.1:5500" // remember to add specific origin in production
    }
})

io.on("connection", socket => {
    console.log("a user connected");

    socket.on("disconnect", () => {
        console.log("a user disconnected");
    })

    socket.on("register", msg => {
        const { playerId } = msg

        socket.join(playerId)
    })

    socket.on("game created", msg => {
        const { webGameId, invitedPlayersIds, webGameData } = msg
        
        socket.join(webGameId)
        invitedPlayersIds.forEach(id => socket.to(id).emit("invitation", { webGameId, webGameData }))
    })
    
    socket.on("join room", msg => {
        const { webGameId } = msg

        socket.join(webGameId)
    })

    socket.on("accept", msg => {
        const { webGameId, playerId } = msg
        
        Game.findByIdAndUpdate(webGameId, {
            $addToSet: {
                playersHavingAccepted: playerId
            }
        }, { new: true })
            .then(updatedGame => {
                if (updatedGame.playersHavingAccepted.every(player => updatedGame.players.includes(player))) {
                    socket.to(webGameId).emit("ready")
                }
            })
            .catch(err => console.log("Error while pushing player to array in DB: ", err))
    })

    socket.on("decline", msg => {
        const { webGameId, playerName } = msg
        
        socket.to(webGameId).emit("game declined", { webGameId, playerName })
    })

    socket.on("revoke", msg => {
        const { webGameId } = msg

        socket.to(webGameId).emit("invitation revoked")
    })

    socket.on("start", msg => {
        const { webGameId, selectedPlayersColors, fieldData } = msg

        socket.to(webGameId).emit("set game", { selectedPlayersColors, fieldData })
    })

    socket.on("move", msg => {
        const { webGameId, move } = msg
        socket.to(webGameId).emit("move", { move })
    })
})

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
    console.log("Server listening on port http://localhost:" + PORT);
})
