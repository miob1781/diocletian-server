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

const createdGames = []

io.on("connection", socket => {
    console.log("a user connected");


    socket.on("disconnect", () => {
        console.log("a user disconnected");
    })

    socket.on("game created", msg => {
        const { webGameId, invitedPlayersIds, webGameData } = msg

        const invitedPlayers = invitedPlayersIds.map(id => ({
            id,
            hasAccepted: false
        }))
        
        createdGames.push({ webGameId, invitedPlayers })

        socket.join(webGameId)
        socket.broadcast.emit("invitation", { webGameId, invitedPlayersIds, webGameData })
    })

    socket.on("accept", msg => {
        const { webGameId, playerId } = msg

        const webGame = createdGames.find(game => game.webGameId === webGameId)

        webGame.invitedPlayers.find(player => player.id === playerId).hasAccepted = true
        socket.join(webGameId)

        if (webGame.invitedPlayers.every(player => player.hasAccepted)) {
            socket.to(webGameId).emit("ready")
        }
    })

    socket.on("decline", msg => {
        const { webGameId } = msg

        Game.findByIdAndDelete(webGameId)
            .then(() => {
                socket.broadcast.emit("game declined", { webGameId })
                createdGames.filter(game => game.webGameId !== webGameId)
            })
            .catch(err => {
                console.log(err)
            })
    })

    socket.on("start", msg => {
        const { webGameId, selectedPlayersColors, fieldData } = msg

        socket.broadcast.to(webGameId).emit("set game", { webGameId, selectedPlayersColors, fieldData })
    })

    socket.on("move", msg => {
        const { webGameId, move } = msg
        socket.broadcast.to(webGameId).emit("move", { move })
    })

    socket.on("game ended", msg => {
        const {winner, webGameId } = msg

        // Game.findByIdAndUpdate(webGameId, { })
    })
})

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
    console.log("Server listening on port http://localhost:" + PORT);
})
