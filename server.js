const app = require("./app")
const Game = require("./models/game.model")

// creates a new server using socket.io
const { createServer } = require("http")
const { Server } = require("socket.io")
const httpServer = createServer(app)
const io = new Server(httpServer, {
    serveClient: false,
    cors: {
        credentials: true,
        origin: process.env.ORIGIN
    }
})

// array with games currently played
let currentGames = []

// starts a connection to sockets
io.on("connection", socket => {

    // adds a player to an individual room to register them by their id
    socket.on("register", msg => {
        const { playerId } = msg
        socket.join(playerId)
    })

    // sends invitations after a creation of a web game
    socket.on("game created", msg => {
        const { webGameId, invitedPlayersIds, webGameData } = msg
        socket.join(webGameId)
        invitedPlayersIds.forEach(id => socket.to(id).emit("invitation", { webGameId, webGameData }))
    })
    
    // assigns invited players to a room for the web game
    socket.on("join room", msg => {
        const { webGameId } = msg
        socket.join(webGameId)
    })

    // checks if all players are ready when a player has accepted the invitation
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

    // sends the rejection to the creator when a player has declined the invitation
    socket.on("decline", msg => {
        const { webGameId, playerName } = msg
        socket.to(webGameId).emit("game declined", { webGameId, playerName })
    })

    // sends the information to invited users that the creator has revoked the invitation
    socket.on("revoke", msg => {
        const { webGameId } = msg
        socket.to(webGameId).emit("invitation revoked")
    })

    // sends the initial values of the board to invited players and adds new game to current games
    socket.on("start", msg => {
        const { webGameId, selectedPlayersColors, fieldData } = msg

        const newGame = {
            id: webGameId,
            moves: []
        }

        currentGames.push(newGame)

        socket.to(webGameId).emit("set game", { selectedPlayersColors, fieldData })
    })

    // sends the field id of a move to all players
    socket.on("move", msg => {
        const { webGameId, move } = msg
        socket.to(webGameId).emit("move", { move })
    })

    // sends missing moves in case a connection has been broken
    socket.on("request missing moves", msg => {
        const { webGameId, playerId, lastMoveNum } = msg

        const game = currentGames.find(game => game.id === webGameId)
        const missingMoves = game.moves.filter(move => move.moveNum > lastMoveNum)

        socket.to(playerId).emit("send missing moves", { missingMoves })
    })

    // removes game from current games when game has ended
    socket.on("end", msg => {
        const { webGameId } = msg
        currentGames = currentGames.filter(game => game.id !== webGameId)
    })
})

// runs the server
const PORT = process.env.PORT

httpServer.listen(PORT, () => {
    console.log("Server listening on port http://localhost:" + PORT);
})
