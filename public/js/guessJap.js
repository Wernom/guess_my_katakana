// socket ouverte vers le client
let sock = io.connect();

// utilisateur courant
let currentUser = null;
var aTrouverChoix;
var aTrouver;
var essai = 0;
var estGagnant = false;
var room;
var isHelped = false;
var isDessinateur = false;
var score = 0;
var timeServer;
var score = null;
var ready = false;
var timer = false;
var roomJoin;
// on attache les événements que si le client est œcté.
sock.on("bienvenue", function (id) {
    if (currentUser === id) {
        document.querySelector("main").innerHTML = "";
        document.getElementById("monMessage").value = "";
    }
});

function speak(message) {
    var msg = new SpeechSynthesisUtterance(message);
    var voices = window.speechSynthesis.getVoices();
    msg.voice = voices[12];
    msg.lang = 'ja';
    window.speechSynthesis.speak(msg)
}


document.addEventListener("DOMContentLoaded", function (_e) {

    sock.on("message", function (msg) {
        if (currentUser) {
            afficherMessage(msg);
        }
    });

    sock.on("liste", function (liste) {
        if (currentUser) {
            updateListe(liste);
        }
    });

    /**
     *  Connexion de l'utilisateur au chat.
     */
    function connect() {
        let user = document.getElementById("pseudo").value.trim();
        if (user === "") {
            return;
        }
        document.getElementById("log_in").hidden = true;
        document.getElementById("timer").hidden = true;
        document.getElementById("room").hidden = false;
        document.getElementById("screen_score").hidden = true;
        if (!user) return;
        currentUser = user;
        console.log(user);

    }


    /**
     *  Affichage des messages
     */
    function afficherMessage(data) {
        console.log(data);

        if (!currentUser) {
            return;
        }

        // affichage des nouveaux messages 
        let bcMessages = document.querySelector("main");
        console.log(bcMessages.innerHTML);

        let classe = "";

        if (data.from === currentUser) {
            classe = "moi";
        } else if (data.from == null) {
            classe = "system";
        }

        if (data.to != null) {
            classe = classe || "mp";
            data.from += " (à " + data.to + ")";
        }

        let date = new Date(data.date);
        console.log(date);
        console.log(data.date);
        date = date.toISOString().substr(11, 8);
        if (data.from == null) {
            data.from = "[admin]";
        }

        data.text = traiterTexte(data.text);
        speak(data.text);
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
        // console.log(msg + aTrouverChoix.key);

        if (aTrouver == null) {
            sock.emit("message", {from: currentUser, to: to, text: msg, date: Date.now()});
            document.getElementById("monMessage").value = "";
            return;
        }

        if (msg === aTrouver.key && !estGagnant && !isDessinateur) {    //bonne réponse
            sock.emit("trouvé", essai);
            estGagnant = true;
        } else if (msg.length < 3) {
            essai++;
            help(msg);
            playRandomSond();

            if (essai >= 2) {
                afficherMessage({from: null, to: currentUser, text: "C'est perdu !!!!!!", date: Date.now()});
            }
            sock.emit("message", {from: currentUser, to: to, text: msg, date: Date.now()});
        } else {
            sock.emit("message", {from: currentUser, to: to, text: msg, date: Date.now()});
        }
        document.getElementById("monMessage").value = "";
    }

    function help(msg) {

        console.log("HELP");
        console.log(aTrouver.key.length);
        console.log(typeof aTrouver.key);
        for (let i = 0; i < aTrouver.key.length; ++i) {
            if (msg.indexOf(aTrouver.key.charAt(i))) {
                afficherMessage({from: null, to: currentUser, text: "La réponse est proche", date: Date.now()});
                break;
            }
        }
    }

    function playRandomSond() {
        var rand = Math.random();
        var audio = null;

        if (rand < 1 / 8) {
            //play age of empire 3
            audio = new Audio('./ressources/son_des_enfers/Tu_ferai_mieux_dy_croire_mon_petit.mp3');
            audio.play();
        } else if (rand >= 1 / 8 && rand < 2 / 8) {
            //play nein
            audio = new Audio('./ressources/son_des_enfers/Nein.mp3');
            audio.play();
        } else if (rand >= 2 / 8 && rand < 3 / 8) {
            //play Julien Lepers
            audio = new Audio('./ressources/son_des_enfers/Cest_non.mp3');
            audio.play();
        } else if (rand >= 3 / 8 && rand < 4 / 8) {
            //play GladOS
            audio = new Audio('./ressources/son_des_enfers/nulite.wav');
            audio.play();
        } else if (rand >= 4 / 8 && rand < 5 / 8) {
            audio = new Audio('./ressources/son_des_enfers/MOTUS_BOULE_NOIR.mp3');
            audio.play();
        }

    }


    /**
     *  Quitter le chat et revenir à la page d'accueil.
     */
    function quitter() {
        currentUser = null;
        document.getElementById("chat").hidden = true;
        document.getElementById("log_in").hidden = false;
        document.getElementById("timer").hidden = true;
        document.getElementById("listBloc").hidden = true;
        document.getElementById("screen_score").hidden = true;
        document.getElementById("menu").hidden = true;
        sock.emit("logout");
    }


    /**
     *  Fermer la zone de choix d'une image
     */
    function toggleImage() {
        if (document.getElementById("bcImage").style.display === "none") {
            document.getElementById("bcImage").style.display = "block";
            document.getElementById("recherche").focus();
        } else {
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
    document.getElementById("leave").addEventListener("click", quitter);
    document.getElementById("btnFermer").addEventListener("click", toggleImage);
    document.getElementById("btnImage").addEventListener("click", toggleImage);
    document.getElementById("btnEnvoyer").addEventListener("click", envoyer);
    document.getElementById("btnRechercher").addEventListener("click", rechercher);
    document.getElementById("btnInviter").addEventListener("click", inviter);
    document.getElementById("join").addEventListener("click", rejoindre);
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

    document.getElementById("btnRoom").addEventListener("click", function () {
        room = document.getElementById("roomName").value;
        if(room===null){
            return;
        }
        if(room===""){
            return;
        }
        document.getElementById("room").hidden = true;
        document.getElementById("chat").hidden = false;
        document.getElementById("timer").hidden = false;

        document.getElementById("listBloc").hidden = false;
        sock.emit("joinRoom", room);
        sock.emit("login", currentUser);
    });

    sock.on('dessin', function () {
        document.getElementById('drawing').hidden = false;
        document.getElementById('choix').hidden = false;
    });
    sock.on('menu', function () {
        document.getElementById('menu').hidden = false
    });

    // force l'affichage de l'écran de connexion
    quitter();


    function inviter() {
        var invitTarget = document.getElementById("InvitationSender").value;
        sock.emit("send_invit", [currentUser, invitTarget, room]);
    }

    sock.on("invitation", function (data) {

        if (currentUser == data[1]) {
            audio = new Audio('./ressources/son_des_enfers/zelaNotif.mp3');
            audio.play();
            roomJoin=data[2];
            document.getElementById("invitationBlock").hidden = false;

            document.getElementById("nomInvit").innerHTML+= "<span>" + data[0]+ "</span>";
        }
    });


    function rejoindre(){
        var name=currentUser;
        sock.emit("joinRoom", roomJoin);
        sock.emit("logout");
        sock.emit("login", name);
        document.getElementById("invitationBlock").hidden = true;
        document.getElementById("menu").hidden = true;

    }
    // **********************************
    //          Module de dessin
    //***********************************


    sock.on("draw", function (dataToDraw) {
        const e = {clientX: dataToDraw.clientX, clientY: dataToDraw.clientY};
        switch (dataToDraw.action) {
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

    sock.on("erase", function () {
        console.log("erase");
        ctxBG.clearRect(0, 0, ctxBG.width, ctxBG.height);
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
        if (isDessinateur) {
            sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mousemove"});
            act(currentCommand.move, e);
        }
    });
    overlay.addEventListener("mousedown", function (e) {
        if (isDessinateur) {
            sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mousedown"});
            act(currentCommand.down, e);
        }
    });
    overlay.addEventListener("mouseup", function (e) {
        if (isDessinateur) {
            sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mouseup"});
            act(currentCommand.up, e);
        }
    });
    overlay.addEventListener("mouseout", function (e) {
        if (isDessinateur) {
            sock.emit("drawing", {clientX: e.clientX, clientY: e.clientY, action: "mouseout"});
            act(currentCommand.out, e);
        }
    });


    var ctxBG = dessin.getContext("2d");
    var ctxFG = overlay.getContext("2d");

    document.getElementById("new").addEventListener("click", function (e) {
        console.log("send erase");
        sock.emit("erase");
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
        ctx.arc(x, y, 40 / 2, 0, 2 * Math.PI);
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
        ctxBG.clearRect(x - 40 / 2, y - 40 / 2, 40, 40);
    };
    gommer.move = function (x, y) {
        this.__proto__.move.call(this, x, y);
        ctxFG.lineWidth = 1;
        if (this.isDown) {
            this.effacer(x, y);
        }
        ctxFG.strokeRect(x - 40 / 2, y - 40 / 2, 40, 40);
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
        ctx.lineWidth = 40;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    ligne.move = function (x, y) {
        this.__proto__.move.call(this, x, y);
        ctxFG.lineWidth = 40;
        if (this.isDown) {
            this.dessiner(ctxFG, x, y);
        } else tracer.dessiner(ctxFG, x, y);
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


    sock.on("end", function (score) {
        document.getElementById("screen_score").hidden = false;

        document.getElementById("choix").hidden = true;
        document.getElementById("drawing").hidden = true;
        document.getElementById("chat").hidden = true;
        document.getElementById("log_in").hidden = true;
        document.getElementById("timer").hidden = true;
        document.getElementById("listBloc").hidden = true;

        var keysSorted = Object.keys(listeScore).sort(function (a, b) {
            return listeScore[b] - listeScore[a]
        });

        keysSorted.forEach(function (data) {
            document.getElementById("screen_score").innerHTML += data + ' - ' + listeScore[data] + '<br>';
        });

        document.getElementById("btnQuitter").addEventListener("click", quitter);


        sock.emit("logout");
        //afficher écran des cores.
    });

});

// **********************************
//               Menu
//***********************************
/** Ensemble des glyphes */
var objGlyphes = null;
/** Dernier glyphe à faire deviner */
var last = null;

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("close_menu").addEventListener("click", function () {
        document.getElementById("drawing").hidden = false;
        var round = document.getElementById("round").value;
        sock.emit('start', round);
        document.getElementById("menu").hidden = true;
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    if (typeof fetch !== undefined) {
        // avec des promesses et l'instruction fetch
        var response = await fetch("./ressources/alphabet.json");
        if (response.status === 200) {
            var data = await response.json();
            objGlyphes = new Glyphes(data);
        }
    } else {
        // "à l'ancienne" avec un appel AJAX
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                objGlyphes = new Glyphes(JSON.parse(this.responseText));
            }
        };
        xhttp.open("GET", "./ressources/alphabet.json", true);
        xhttp.send();
    }
    // association des écouteurs d'événements sur les éléments de formulaire des options
    var inputs = document.querySelectorAll("#options input:not([type=button])");
    inputs.forEach(function (input) {
        input.addEventListener("change", change, false);
    }, false);
}, true);

sock.on('next_turn2', function (data) {
    estGagnant = false;
    isHelped = false;
    isDessinateur = false;

    document.getElementById("choix").hidden = true;
});

sock.on('readyTurn', function (data) {
    ready = data;
    essai = 0;
});

sock.on('initGame', function (data) {
    timeServer = data;
    console.log("TIMESERVER:" + timeServer);
});

sock.on('dessinateur', function () {
    change();
    isDessinateur = true;
    console.log("dessinateur");
    document.getElementById("choix").hidden = false;
    afficherChoix();
});

/**
 *  Change la lettre/syllabe à reconnaître.
 */
function change() {
    // récupération de l'alphabet
    var alphabet = document.querySelector('#options input[name=radGlyphe]:checked').value;

    if (alphabet === "les2") {
        alphabet = (Math.random() < 0.5) ? 'hiragana' : 'katakana';
    }
    // sélection du glyphe
    aTrouverChoix = objGlyphes.getThreeGlyphes(last, alphabet);
    last = aTrouverChoix.key;
}


sock.on("printFind", function (data) {
    aTrouver = data;
    console.log("printFind : ");
    console.log(data);
    if (isDessinateur)
        afficherTrucATrouver(data);
});

function afficherChoix() {
    document.getElementById("glyph").innerHTML = "<span onclick=\"choix(0)\"> " + aTrouverChoix[0].key + " </span>";
    document.getElementById("glyph").innerHTML += "<span onclick=\"choix(1)\"> " + aTrouverChoix[1].key + " </span>";
    document.getElementById("glyph").innerHTML += "<span onclick=\"choix(2)\"> " + aTrouverChoix[2].key + " </span>";
}

function choix(key) {
    sock.emit("find", aTrouverChoix[key]);
}

function afficherTrucATrouver() {
    document.getElementById("glyph").innerHTML = aTrouver.key;
    document.getElementById("choix").innerHTML += "<p id='aide'>?</p>";
    document.getElementById('aide').addEventListener('click', function () {
        isHelped = true;
        document.getElementById("glyph").innerHTML = '&#' + aTrouver.ascii + ';';
    })
}

function updateListe(listeScore) {
    document.querySelector("aside").innerHTML = "";
    // var list = {"you": 100, "me": 75, "foo": 116, "bar": 15};
    var keysSorted = Object.keys(listeScore).sort(function (a, b) {
        return listeScore[b] - listeScore[a]
    });
    keysSorted.forEach(function (data) {
        console.log(data + "\t" + listeScore.data + '\t' + listeScore[data]);
        document.querySelector("aside").innerHTML += data + ' - ' + listeScore[data] + '<br>';
    });
}

sock.on('dessinateurPlusPoint', function (nbClient) {
    if (isDessinateur) {
        sock.emit('plusDessinateur');
    }
});

sock.on('score', function (data) {
    score = data;
    console.log("SCORE");
    console.log(score);
    updateListe(score);

});


/**
 *  Classe représentant l'ensemble des glyphes
 */
function Glyphes(glyphes) {

    /**
     *  Clés des glyphes éligibles par rapport aux options actuellement sélectionnées
     *  (fonction privée -- interne à la classe)
     */
    var getGlyphKeys = function () {
        var cbs = document.querySelectorAll("#options input[type=checkbox]:checked");
        return Object.keys(glyphes['hiragana']).filter(function (elem, _index, _array) {
            // closure qui s'appuie sur les checkbox qui ont été sélectionnées (cbs)
            for (var i = 0; i < cbs.length; i++) {
                // on vérifie si la clé (elem) matche la regex définie comme valeur de la checkbox
                var patt = new RegExp("\\b" + cbs[i].value + "\\b", "g");
                if (patt.test(elem)) {
                    return true;
                }
            }
            return false;
        });
    };

    /**
     * La clef désignant le glyphe à choisit
     */

    /**
     *  Choisit trois glyphes différents entre elles et différentes de celle dont la clé
     *  est passée en paramètre
     *  @param old          String  clé du glyphe
     *  @param alphabet     String  alphabet considéré
     */
    this.getThreeGlyphes = function (old, alphabet) {
        var eligible = getGlyphKeys();
        var aTrouver = [];
        var aEviter = [old];
        var key;
        for (var i = 0; i < 3; i++) {
            do {
                key = eligible[Math.random() * eligible.length | 0];
            }
            while (aEviter.indexOf(key) >= 0);
            aEviter.push(key);
            aTrouver[i] = {key: key, ascii: glyphes[alphabet][key]};
        }
        console.log(aTrouver);
        return aTrouver;
    }
}


// **********************************
//               Timer
//***********************************
function playRandomSondTime() {
    var rand = Math.random();
    var audio = null;

    if (rand < 1 / 8) {
        //play terminator
        audio = new Audio('./ressources/son_des_enfers/it_is_time.wav');
        audio.play();
    } else if (rand >= 1 / 8 && rand < 2 / 8) {
        //play été de tous les records
        audio = new Audio('./ressources/son_des_enfers/quand_vous_voulez.mp3');
        audio.play();
    } else if (rand >= 2 / 8 && rand < 3 / 8) {
        //play le 5e éléments
        audio = new Audio('./ressources/son_des_enfers/faut_qu_ca_pop.mp3');
        audio.play();
    } else if (rand >= 3 / 8 && rand < 4 / 8) {
        //play full metal jacket1
        audio = new Audio('./ressources/son_des_enfers/temps.mp3');
        audio.play();
    } else if (rand >= 4 / 8 && rand < 5 / 8) {
        audio = new Audio('./ressources/son_des_enfers/comique.mp3');
        audio.play();
    }

}

var timeLeft;

function StartTimer(length) {
    timer = true;
    timeLeft = timeServer;
    console.log("TIMER:" + timeLeft);
    console.log("TIMER2:" + timeServer);
    setInterval("Tick(length)", 1000);

    var seconds = timeLeft % 60;
    var secondsTens = Math.floor(seconds / 10);
    var secondsOnes = seconds % 10;
    var minutes = Math.floor(timeLeft / 60);

    document.getElementById("timer").innerHTML = "" + minutes + ":" + secondsTens + secondsOnes;
    //alert("" + minutes + ":" + secondsTens + secondsOnes);
}


function Tick(length) {
    if (timeLeft == 7) {
        playRandomSondTime();
    }
    if (timeLeft <= 0) {
        if (ready) {
            changeTurn(timeServer);
            timeLeft = 0;
        }
        return;
    } else {
        timeLeft--;
        var seconds = timeLeft % 60;
        var secondsTens = Math.floor(seconds / 10);
        var secondsOnes = seconds % 10;
        var minutes = Math.floor(timeLeft / 60);
        document.getElementById("timer").innerHTML = "" + minutes + ":" + secondsTens + secondsOnes;
        //alert("AAAAAAAA" + minutes + ":" + secondsTens + secondsOnes);

    }
}

function changeTurn(length) {
    if (isDessinateur) {
        sock.emit("next_turn", length);
    }
}

function beginTurn() {
    sock.emit("beginTurn", [timeServer, true]);

}

sock.on('launchTurn', function (data) {
    if (timer) {
        ready = data[1];
        console.log("READY?" + ready);
        timeLeft = data[0];
        timeServer = data[0];
    } else {
        ready = data[1];
        console.log("READY?" + ready);
        timeLeft = data[0];
        timeServer = data[0];
        StartTimer(timeServer);
    }
});

function sendTimer() {
    console.log('aaaaaaaaaaaa:' + parseInt((document.getElementById('roundLength').value)));
    sock.emit("beginGame", parseInt((document.getElementById('roundLength').value)));
}