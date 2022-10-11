const app = require("./app")
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

    socket.on("game created", msg => {
        const { webGameId, invitedPlayers } = msg
        socket.broadcast.emit("invitation", { webGameId, invitedPlayers })
    })
})

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
    console.log("Server listening on port http://localhost:" + PORT);
})
