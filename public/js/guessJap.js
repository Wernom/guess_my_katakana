document.addEventListener("DOMContentLoaded", function (_e) {

    // socket ouverte vers le client
    let sock = io.connect();

    // utilisateur courant 
    let currentUser = null;

    // on attache les événements que si le client est connecté.
    sock.on("bienvenue", function (id) {
        if (currentUser) {
            document.querySelector("main").innerHTML = "";
            document.getElementById("monMessage").value = "";
        }
    });
    sock.on("message", function (msg) {
        if (currentUser) {
            afficherMessage(msg);
        }
    });
    sock.on("liste", function (liste) {
        if (currentUser) {
            afficherListe(liste);
        }
    });

    /**
     *  Connexion de l'utilisateur au chat.
     */
    function connect() {
        let user = document.getElementById("pseudo").value.trim();
        if (user === ""){
            return;
        }
        document.getElementById("log_in").hidden = true;
        document.getElementById("chat").hidden = false;
        document.getElementById("drawing").hidden = false;
        if (!user) return;
        currentUser = user;
        console.log(user);
        sock.emit("login", user);
    }


    /**
     *  Affichage des messages
     */
    function afficherMessage(data) {

        if (!currentUser) {
            return;
        }

        // affichage des nouveaux messages 
        let bcMessages = document.querySelector("main");

        let classe = "";

        if (data.from == currentUser) {
            classe = "moi";
        }
        else if (data.from == null) {
            classe = "system";
        }

        if (data.to != null) {
            classe = classe || "mp";
            data.from += " (à " + data.to + ")";
        }

        let date = new Date(data.date);
        date = date.toISOString().substr(11, 8);
        if (data.from == null) {
            data.from = "[admin]";
        }

        data.text = traiterTexte(data.text);

        bcMessages.innerHTML += "<p class='" + classe + "'>" + date + " - " + data.from + " : " + data.text + "</p>";
        document.querySelector("main > p:last-child").scrollIntoView();
    }

    // traitement des emojis
    function traiterTexte(txt) {
        let ind = txt.indexOf("[img:");
        while (ind >= 0) {
            console.log(txt);
            txt = txt.replace("\[img:", '<img src="');
            txt = txt.replace('\]', '">');
            ind = txt.indexOf("[img:");
        }
        txt = txt.replace(/:[-]?\)/g, '<span class="emoji sourire"></span>');
        txt = txt.replace(/:[-]?D/g, '<span class="emoji banane"></span>');
        txt = txt.replace(/:[-]?[oO]/g, '<span class="emoji grrr"></span>');
        txt = txt.replace(/<3/g, '<span class="emoji love"></span>');
        txt = txt.replace(/:[-]?[Ss]/g, '<span class="emoji malade"></span>');
        return txt;
    }


    function afficherListe(newList) {
        document.querySelector("aside").innerHTML = newList.join("<br>");
    }


    /**
     *  Envoyer un message
     */
    function envoyer() {

        let msg = document.getElementById("monMessage").value.trim();
        if (!msg) return;

        // message privé
        let to = null;
        if (msg.startsWith("@")) {
            const i = msg.indexOf(" ");
            to = msg.substring(1, i);
            msg = msg.substring(i);
        }
        // envoi
        sock.emit("message", {from: currentUser, to: to, text: msg});

        document.getElementById("monMessage").value = "";
    }


    /**
     *  Quitter le chat et revenir à la page d'accueil.
     */
    function quitter() {
        currentUser = null;
        document.getElementById("chat").hidden = true;
        document.getElementById("log_in").hidden = false;
        sock.emit("logout");
    }


    /**
     *  Fermer la zone de choix d'une image
     */
    function toggleImage() {
        if (document.getElementById("bcImage").style.display === "none") {
            document.getElementById("bcImage").style.display = "block";
            document.getElementById("recherche").focus();
        }
        else {
            document.getElementById("bcImage").style.display = "none";
            document.getElementById("recherche").value = "";
            document.getElementById("bcResults").innerHTML = "";
        }
    }

    /**
     *  Recherche d'une image
     */
    function rechercher(e) {
        let queryString = document.getElementById("recherche").value;
        queryString = queryString.replace(/\s/g, '+');
        // appel AJAX
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function (_e) {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 200) {
                    const data = JSON.parse(this.responseText).data;
                    let html = "";
                    for (const i in data) {
                        let url = data[i].images.fixed_height.url;
                        html += "<img src='" + url + "'>";
                    }
                    document.getElementById("bcResults").innerHTML = html;
                }
            }
        };
        xhttp.open('GET', 'http://api.giphy.com/v1/gifs/search?q=' + queryString + '&limit=20&api_key=0X5obvHJHTxBVi92jfblPqrFbwtf1xig', true);
        xhttp.send(null);
    }


    function choixImage(e) {
        if (e.target instanceof HTMLImageElement) {
            sock.emit("message", {from: currentUser, to: null, text: "[img:" + e.target.src + "]"});
            toggleImage();
        }

    }

    /**
     *  Mapping des boutons de l'interface avec des fonctions du client.
     */
    document.getElementById("btnConnecter").addEventListener("click", connect);
    document.getElementById("btnQuitter").addEventListener("click", quitter);
    document.getElementById("btnFermer").addEventListener("click", toggleImage);
    document.getElementById("btnImage").addEventListener("click", toggleImage);
    document.getElementById("btnEnvoyer").addEventListener("click", envoyer);
    document.getElementById("btnRechercher").addEventListener("click", rechercher);
    document.getElementById("recherche").addEventListener("keydown", function (e) {
        if (e.keyCode === 13) {
            rechercher();
        }
    });
    document.getElementById("bcResults").addEventListener("click", choixImage);
    document.getElementById("monMessage").addEventListener("keydown", function (e) {
        if (e.keyCode === 13) {
            envoyer();
        }
    });

    // force l'affichage de l'écran de connexion
    quitter();




    // Module de dessin

    sock.on("draw", function (dataToDraw) {
        const e = {clientX: dataToDraw.clientX, clientY: dataToDraw.clientY};
        switch (dataToDraw.action){
            case "mousemove":

                act(currentCommand.move, e);
                break;
            case "mousedown":
                act(currentCommand.down, e);
                break;
            case "mouseup":
                act(currentCommand.up, e);
                break;
            case "mouseout":
                act(currentCommand.out, e);

        }
    });


    var dessin = document.getElementById("dessin");
    var overlay = document.getElementById("overlay");

    var act = function (f, e) {
        var rect = dessin.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        f.call(currentCommand, x, y);
    };

    overlay.addEventListener("mousemove", function (e) {
        sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mousemove"});
        act(currentCommand.move, e);
    });
    overlay.addEventListener("mousedown", function (e) {
        sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mousedown"});
        act(currentCommand.down, e);
    });
    overlay.addEventListener("mouseup", function (e) {
        sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mouseup"});
        act(currentCommand.up, e);
    });
    overlay.addEventListener("mouseout", function (e) {
        sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mouseout"});
        act(currentCommand.out, e);
    });


    var ctxBG = dessin.getContext("2d");
    var ctxFG = overlay.getContext("2d");

    document.getElementById("new").addEventListener("click", function (e) {
        ctxBG.clearRect(0, 0, ctxBG.width, ctxBG.height);
    });

    // Tailles des zones
    overlay.width = dessin.width = ctxBG.width = ctxFG.width = 500;
    overlay.height = dessin.height = ctxBG.height = ctxFG.height = 500;
    // Taille du crayon
    ctxBG.lineCap = ctxFG.lineCap = "round";


    /**
     *  Prototype de commande (classe abstraite)
     */
    function Commande() {
        // bouton cliqué
        this.isDown = false;
        // fillStyle pour le dessin
        this.fsBG = "white",
            // fillStyle pour le calque
            this.fsFG = "white";
        // strokeStyle pour le dessin
        this.ssBG = "white";
        // strokeStyle pour le calque
        this.ssFG = "white";
    }

    // selection (paramétrage des styles)
    Commande.prototype.select = function () {
        ctxBG.fillStyle = this.fsBG;
        ctxFG.fillStyle = this.fsFG;
        ctxBG.strokeStyle = this.ssBG;
        ctxFG.strokeStyle = this.ssFG;
        currentCommand = this;
    };
    // action liée au déplacement de la souris
    Commande.prototype.move = function (x, y) {
        ctxFG.clearRect(0, 0, ctxFG.width, ctxFG.height);
    };
    // action liée au relâchement du bouton de la souris
    Commande.prototype.up = function (x, y) {
        this.isDown = false;
    };
    // action liée à l'appui sur le bouton de la souris
    Commande.prototype.down = function (x, y) {
        this.isDown = true;
    };
    // action liée à la sortie de la souris de la zone
    Commande.prototype.out = function () {
        this.isDown = false;
        ctxFG.clearRect(0, 0, ctxFG.width, ctxFG.height);
    };


    /**
     *  Commande pour tracer (dessine un point)
     *      au survol : affichage d'un point
     *      au clic : dessin du point
     */
    var tracer = new Commande();
    tracer.dessiner = function (ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, size.value / 2, 0, 2 * Math.PI);
        ctx.fill();
    };
    tracer.move = function (x, y) {
        // appel classe mère
        this.__proto__.move.call(this, x, y);
        // affichage sur le calque
        this.dessiner(ctxFG, x, y);
        // si bouton cliqué : impression sur la zone de dessin
        if (this.isDown) {
            this.dessiner(ctxBG, x, y);
        }
    };
    tracer.down = function (x, y) {
        // appel classe mère
        this.__proto__.down.call(this, x, y);
        // impression sur la zone de dessin
        this.dessiner(ctxBG, x, y);
    };


    /**
     *  Commande pour gommer (effacer une zone)
     *      au survol : affichage d'un rectangle représentant la zone à effacer
     *      au clic : effacement de la zone
     */
    var gommer = new Commande();
    gommer.ssFG = "black";
    gommer.effacer = function (x, y) {
        ctxBG.clearRect(x - size.value / 2, y - size.value / 2, size.value, size.value);
    };
    gommer.move = function (x, y) {
        this.__proto__.move.call(this, x, y);
        ctxFG.lineWidth = 1;
        if (this.isDown) {
            this.effacer(x, y);
        }
        ctxFG.strokeRect(x - size.value / 2, y - size.value / 2, size.value, size.value);
    };
    gommer.down = function (x, y) {
        this.__proto__.down.call(this, x, y);
        gommer.effacer(x, y);
    };


    /**
     *  Commande pour tracer une ligne
     *      au survol si clic appuyé : ombrage de la ligne entre le point de départ et le point courant.
     *      au relâchement du clic : tracé de la ligne sur la zone de dessin
     */
    var ligne = new Commande();
    ligne.ssFG = "white";
    ligne.dessiner = function (ctx, x, y) {
        ctx.lineWidth = size.value;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    ligne.move = function (x, y) {
        this.__proto__.move.call(this, x, y);
        ctxFG.lineWidth = size.value;
        if (this.isDown) {
            this.dessiner(ctxFG, x, y);
        }
        else tracer.dessiner(ctxFG, x, y);
    };
    ligne.down = function (x, y) {
        this.__proto__.down.call(this, x, y);
        this.startX = x;
        this.startY = y;
    };
    ligne.up = function (x, y) {
        this.__proto__.up.call(this, x, y);
        this.dessiner(ctxBG, x, y);
    };


    /**
     *  Affectation des événements sur les boutons radios
     *  et detection du bouton radio en cours de sélection.
     */
    var radios = document.getElementsByName("radCommande");
    for (var i = 0; i < radios.length; i++) {
        var selection = function () {
            if (this.checked) {
                currentCommand = eval(this.id);
                currentCommand.select();
            }
        };
        selection.apply(radios.item(i));
        radios.item(i).addEventListener("change", selection);
    }


});


document.addEventListener("DOMContentLoaded", function (e) {

});


