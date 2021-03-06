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
var pasEncoreDessinateur = [];
var pas_trouve = [];
var trouve = [];
var nbRound = [];
var currRound = [];
var baseScore = 7;
var score = [];
var nbClientInRoom = [];
var isDessinateur = [];

function isEmpty(obj) {

    if (obj == null) return true;

    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    if (typeof obj !== "object") return true;

    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}


function nextTurn(room, timer) {
    console.log("new game");
    io.sockets.in(room).emit("next_turn2", timer);
    var dessinateur = pasEncoreDessinateur[room].pop();


    trouve[room].forEach(function (data) {
        pas_trouve[room].push(data);
    });

    if (dessinateur == null) {
        currRound[room]++;
        console.log(currRound[room]);
        console.log(nbRound[room]);
        if (nbRound[room] <= currRound[room]) {
            console.log('FIN PARTIE');
            io.sockets.in(room).emit("end", score[room]);
            return;
        } else {
            pas_trouve[room].forEach(function (data) {
                pasEncoreDessinateur[room].push(data);
            });
            dessinateur = pasEncoreDessinateur[room].pop();
        }
        io.sockets.in(room).emit("message", {
            from: null,
            to: null,
            text: "Nouveau round !!!",
            date: Date.now()
        });
    } else {
        io.sockets.in(room).emit("message", {
            from: null,
            to: null,
            text: "Début de la partie.",
            date: Date.now()
        });
    }
    io.sockets.in(room).emit('readyTurn', false);
    console.log("dessinateur: " + dessinateur);
    isDessinateur[room] = dessinateur;
    if(clients[dessinateur]){
        clients[dessinateur].emit('dessinateur');
    }
    io.sockets.in(room).emit('erase');
    trouve[room] = [];
}

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {

    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;
    var room = null;
    socket.on('joinRoomInvite', function (data) {

        if (currentID && rooms[room]) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            io.sockets.in(room).emit("message",
                {from: null, to: null, text: currentID + " a quitté la partie", date: Date.now()});
            // suppression de l'entrée
            delete rooms[room][currentID];
            delete pasEncoreDessinateur[room][currentID];
            delete pas_trouve[room][currentID];
            delete score[room][currentID];
            delete trouve[room][currentID];
            delete nbClientInRoom[room][currentID];

            //on suprime le salon quand plus personne n'est dedans
            if (isEmpty(rooms[room])) {
                console.log(room + ": deleted");
                delete rooms[room];
                delete glyph[room];
                delete nbRound[room];
                delete currRound[room];
                delete pasEncoreDessinateur[room];
                delete pas_trouve[room];
                delete score[room];
                delete trouve[room];
                delete nbClientInRoom[room];
                delete isDessinateur[room];
            }

            if (isDessinateur[room] = currentID && rooms[room]){
                nextTurn(room);
            }

            // envoi de la nouvelle liste pour mise à jour
            io.sockets.in(room).emit("liste", score[room]);
            socket.leave(room);
        }

        room = data.room;

        if (rooms[room] == null) {// si la room à été détruite entre temps
            rooms[room] = {};
            console.log("create room: " + room);
            socket.emit('menu');
        } else {
            console.log("connection to room: " + room);
            socket.emit('dessin');
        }

        if (isEmpty(pasEncoreDessinateur[room])) {
            pasEncoreDessinateur[room] = [];
        }

        if (isEmpty(pas_trouve[room])) {
            pas_trouve[room] = [];
        }

        if (isEmpty(trouve[room])) {
            trouve[room] = [];
        }

        if (isEmpty(score[room])) {
            score[room] = {};
        }

        if (isEmpty(nbClientInRoom[room])) {
            nbClientInRoom[room] = 0;
        }

        rooms[room][currentID] = socket;
        score[room][currentID] = 0;
        pasEncoreDessinateur[room].push(currentID);
        pas_trouve[room].push(currentID);
        console.log("INIT SCORE");
        console.log(score);
        nbClientInRoom[room]++;


        socket.join(room);

        console.log("Nouvel utilisateur : " + currentID);
        // envoi d'un message de bienvenue à ce client
        console.log(room);
        socket.in(room).emit("bienvenue", currentID);
        // envoi aux autres clients
        socket.in(room).emit("message", {
            from: null,
            to: null,
            text: currentID + " a rejoint la partie",
            date: Date.now()
        });

        io.sockets.in(room).emit("liste", score[room]);
    });

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

        if (isEmpty(pasEncoreDessinateur[room])) {
            pasEncoreDessinateur[room] = [];
        }

        if (isEmpty(pas_trouve[room])) {
            pas_trouve[room] = [];
        }

        if (isEmpty(trouve[room])) {
            trouve[room] = [];
        }



        if (isEmpty(score[room])) {
            score[room] = {};
        }

        if (isEmpty(nbClientInRoom[room])) {
            nbClientInRoom[room] = 0;
        }

        rooms[room][currentID] = socket;
        score[room][currentID] = 0;
        pasEncoreDessinateur[room].push(currentID);
        pas_trouve[room].push(currentID);
        console.log("INIT SCORE");
        console.log(score);
        nbClientInRoom[room]++;


        socket.join(room);

        console.log("Nouvel utilisateur : " + currentID);
        // envoi d'un message de bienvenue à ce client
        console.log(room);
        socket.in(room).emit("bienvenue", currentID);
        // envoi aux autres clients
        socket.in(room).emit("message", {
            from: null,
            to: null,
            text: currentID + " a rejoint la partie",
            date: Date.now()
        });

        console.log("SOCORE");
        io.sockets.in(room).emit("liste", score[room]);
    });


    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function (id) {
        while (clients[id]) {
            id = id + "(1)";
        }

        console.log(glyph[room]);
        if (!isEmpty(glyph[room])) {
            socket.emit("printFind", glyph[room]);
        }

        currentID = id;
        clients[currentID] = socket;

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
            console.log(clients[msg.to]);
            clients[msg.to].emit("message", msg);
            if (msg.from != msg.to) {
                io.sockets.in(room).emit("message", msg);
            }
        } else {
            console.log(" --> broadcast");
            io.sockets.in(room).emit("message", msg);
        }
    });

    socket.on('beginTurn', function (data) {
        io.sockets.in(room).emit('launchTurn', data);
    });

    socket.on('next_turn', function (data) {
        nextTurn(room, data);
    });

    socket.on('beginGame', function (data) {
        io.sockets.in(room).emit('initGame', data);
    });

    socket.on('send_invit', function (data) {
        var target = data[1];
        if(clients[target]){
            clients[target].emit('invitation', data);
        }
    });

    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logout", function () {
        // si client était identifié (devrait toujours être le cas)
        if (currentID && rooms[room]) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            io.sockets.in(room).emit("message",
                {from: null, to: null, text: currentID + " a quitté la partie", date: Date.now()});
            // suppression de l'entrée



            delete clients[currentID];
            delete rooms[room][currentID];
            delete pasEncoreDessinateur[room][currentID];
            delete pas_trouve[room][currentID];
            delete score[room][currentID];
            delete trouve[room][currentID];
            delete nbClientInRoom[room][currentID];

            //on suprime le salon quand plus personne n'est dedans
            if (isEmpty(rooms[room])) {
                console.log(room + ": deleted");
                delete rooms[room];
                delete glyph[room];
                delete nbRound[room];
                delete currRound[room];
                delete pasEncoreDessinateur[room];
                delete pas_trouve[room];
                delete score[room];
                delete trouve[room];
                delete nbClientInRoom[room];
            }
            if (isDessinateur[room] = currentID && rooms[room] && nbRound[room] > currRound[room]){
                nextTurn(room);
            }
            // envoi de la nouvelle liste pour mise à jour
            io.sockets.in(room).emit("liste", score[room]);
            socket.leave(room);
        }
    });

    // déconnexion de la socket
    socket.on("disconnect", function () {
        // si client était identifié
        if (currentID && rooms[room]) {
            // envoi de l'information de déconnexion
            io.sockets.in(room).emit("message",
                {
                    from: null,
                    to: null,
                    text: currentID + " vient de se déconnecter de l'application",
                    date: Date.now()
                });
            // suppression de l'entrée
            // suppression de l'entrée
            delete clients[currentID];
            delete rooms[room][currentID];
            delete pasEncoreDessinateur[room][currentID];
            delete pas_trouve[room][currentID];
            delete score[room][currentID];
            delete trouve[room][currentID];
            delete nbClientInRoom[room][currentID];

            //on suprime le salon quand plus personne n'est dedans
            if (isEmpty(rooms[room])) {
                console.log(room + ": deleted");
                delete rooms[room];
                delete glyph[room];
                delete nbRound[room];
                delete currRound[room];
                delete pasEncoreDessinateur[room];
                delete pas_trouve[room];
                delete score[room];
                delete trouve[room];
                delete nbClientInRoom[room];
            }

            if (isDessinateur[room] = currentID && rooms[room] && nbRound[room] > currRound[room]){
                nextTurn(room);
            }
            // envoi de la nouvelle liste pour mise à jour
            io.sockets.in(room).emit("liste", score[room]);
            socket.leave(room);

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

    socket.on("trouvé", function (data) {
        score[room][currentID] += Math.round(baseScore/(data.essai+1) + data.point);
        console.log("SCORE");
        console.log(score[room]);
        console.log(score[room][currentID]);


        clients[currentID].emit("message", {
            from: null,
            to: null,
            text: "FÉLICITATION, vous avez trouvé la bonne réponse",
            date: Date.now()
        });

        io.sockets.in(room).emit("message", {
            from: null,
            to: null,
            text: currentID + " à trouver la bonne réponse",
            date: Date.now()
        });
        trouve[room].push(currentID);

        var index = pas_trouve[room].indexOf(currentID);
        if (index > -1) {
            pas_trouve[room].splice(index, 1);
        }

        console.log("pasTrouve: " + pas_trouve[room].length);
        if (pas_trouve[room].length === 1) {
            io.sockets.in(room).emit("dessinateurPlusPoint", nbClientInRoom[room]);

            nextTurn(room, data[1]);
        }
        io.sockets.in(room).emit("score", score[room]);

    });

    socket.on('plusDessinateur', function (isHelped) {
        if (isHelped) {
            score[room][currentID] += (baseScore + nbClientInRoom[room]) / 2;
            io.sockets.in(room).emit("score", score[room]);
        } else {
            score[room][currentID] += baseScore + nbClientInRoom[room];
            io.sockets.in(room).emit("score", score[room]);
        }
    });


    socket.on("start", function (round) {
        if (isEmpty(nbRound[room])) {
            nbRound[room] = Number(round);
        }
        currRound[room] = 0;
        nextTurn(room);
    });
});