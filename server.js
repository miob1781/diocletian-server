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

    const createdGames = []

    socket.on("disconnect", () => {
        console.log("a user disconnected");
    })

    socket.on("game created", msg => {
        const { webGameId, invitedPlayers } = msg

        const playersAwaited = invitedPlayers.map(player => ({
            playerId: player[0],
            playerName: player[1],
            hasAccepted: false
        }))
        
        createdGames.push({ webGameId, playersAwaited })
        socket.join(webGameId)
        socket.broadcast.emit("invitation", { webGameId, invitedPlayers: playersAwaited })
    })

    socket.on("accept", msg => {
        const { webGameId, playerId } = msg

        const webGame = createdGames.find(game => game.webGameId === webGameId)
        webGame.invitedPlayers.find(player => player.playerId === playerId).hasAccepted = true

        socket.join(webGameId)

        if (!webGame.invitedPlayers.find(player => player.hasAccepted === false)) {
            socket.to(webGameId).emit("start game")
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

    socket.on("move", msg => {

    })

    socket.on("game ended", msg => {

    })
})

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
    console.log("Server listening on port http://localhost:" + PORT);
})
