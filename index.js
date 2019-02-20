// Chargement des modules 
var express = require('express');
var app = express();
var server = app.listen(8080, function () {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});
// Ecoute sur les websockets
var io = require('socket.io').listen(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to 
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/chat.html');
});


/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket
var rooms = {};
var glyph = {};
var pas_dessinateur = [];
var pas_trouve = [];
var trouve = [];

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {

    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;
    var room = null;

    socket.on('joinRoom', function (roomToJoin) {
        room = roomToJoin;

        if (rooms[room] == null) {
            rooms[room] = {};
            console.log("create room: " + room);
            socket.emit('menu');
        } else {
            console.log("connection to room: " + room);
            socket.emit('dessin');
        }

        socket.join(room);
    });

    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function (id) {
        while (clients[id]) {
            id = id + "(1)";
        }

        if (isEmpty(pas_dessinateur[room])){
            pas_dessinateur[room] = [];
        }

        if (isEmpty(pas_trouve[room])){
            pas_trouve[room] = [];
        }

        if (isEmpty(trouve[room])){
            trouve[room] = [];
        }

        currentID = id;
        clients[currentID] = socket;
        rooms[room][currentID] = socket;
        pas_dessinateur[room].push(currentID);
        pas_trouve[room].push(currentID);

        console.log("Nouvel utilisateur : " + currentID);
        // envoi d'un message de bienvenue à ce client
        console.log(room);
        socket.in(room).emit("bienvenue", id);
        // envoi aux autres clients 
        socket.in(room).emit("message", {
            from: null,
            to: null,
            text: currentID + " a rejoint la discussion",
            date: Date.now()
        });
        // envoi de la nouvelle liste à tous les clients connectés 
        io.sockets.in(room).emit("liste", Object.keys(rooms[room]));
    });

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("message", function (msg) {
        console.log("Reçu message");
        // si jamais la date n'existe pas, on la rajoute
        msg.date = Date.now();
        // si message privé, envoi seulement au destinataire
        if (msg.to != null && clients[msg.to] !== undefined) {
            console.log(" --> message privé");
            clients[msg.to].emit("message", msg);
            if (msg.from != msg.to) {
                socket.emit("message", msg);
            }
        } else {
            console.log(" --> broadcast");
            io.sockets.in(room).emit("message", msg);
        }
    });


    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logout", function () {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                {from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now()});
            // suppression de l'entrée
            delete clients[currentID];
            delete rooms[room][currentID];
            if (isEmpty(rooms[room])) {
                console.log(room + ": deleted");
                delete rooms[room];
                delete glyph[room];
            }
            // envoi de la nouvelle liste pour mise à jour
            io.sockets.in(room).emit("liste", Object.keys(clients));
        }
    });

    // déconnexion de la socket
    socket.on("disconnect", function (reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                {
                    from: null,
                    to: null,
                    text: currentID + " vient de se déconnecter de l'application",
                    date: Date.now()
                });
            // suppression de l'entrée
            delete clients[currentID];
            delete rooms[room][currentID];
            if (isEmpty(rooms[room])) {
                console.log(room + ": deleted");
                delete rooms[room];
                delete glyph[room];
            }
            // envoi de la nouvelle liste pour mise à jour
            io.sockets.in(room).emit("liste", Object.keys(clients));
        }
        console.log("Client déconnecté");
    });

    // partage du dessin
    socket.on("drawing", function (data) {
        io.sockets.in(room).emit("draw", data)
    });

    // Efface la zone de dessin
    socket.on("erase", function () {
        io.sockets.in(room).emit("erase")
    });

    socket.on("find", function (data) {
        glyph[room] = data;
        console.log(glyph[room]);
        io.sockets.in(room).emit("printFind", glyph[room])
    });

    socket.on("trouvé", function (name) {
        clients[name].emit("message", {
            from: null,
            to: null,
            text: "FÉLICITATION, vous avez trouvé la bonne réponse",
            date: Date.now()
        });

        trouve[room].push(name);

        io.sockets.in(room).emit("message", {
            from: null,
            to: null,
            text: name + " à trouver la bonne réponse",
            date: Date.now()
        });
    });

    socket.on("start", function(){
        io.sockets.in(room).emit("next_turn");
        var dessinateur = pas_dessinateur[room].pop();
        console.log(dessinateur);
        console.log('ok');
        clients[dessinateur].emit('dessinateur');
        trouve[room].forEach(function (data) {
            pas_trouve[room].push(data);
        });
        trouve[room] = [];
    });
});