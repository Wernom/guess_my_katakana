document.addEventListener("DOMContentLoaded", function(_e) {

    // socket ouverte vers le client
    var sock = io.connect();

    // utilisateur courant 
    var currentUser = null;

    // on attache les événements que si le client est connecté.
    sock.on("bienvenue", function(id) {
        if (currentUser) {
            document.querySelector("#content main").innerHTML = "";
            document.getElementById("monMessage").value = "";
        }
    });
    sock.on("message", function(msg) {
        if (currentUser) {
            afficherMessage(msg);
        }
    });
    sock.on("liste", function(liste) {
        if (currentUser) {
            afficherListe(liste);
        }
    });

    /**
     *  Connexion de l'utilisateur au chat.
     */
    function connect() {
        var user = document.getElementById("pseudo").value.trim();
        document.getElementById("log_in").hidden = true;
        document.getElementById("chat").hidden = false;
        if (! user) return;
        currentUser = user;
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
        var bcMessages = document.querySelector("#content main");

        var classe = "";

        if (data.from == currentUser) {
            classe = "moi";
        }
        else if (data.from == null) {
            classe = "system";
        }

        if (data.to != null) {
            classe = classe || "mp";
            data.from += " (à " + data.to + ")";
        }

        var date = new Date(data.date);
        date = date.toISOString().substr(11,8);
        if (data.from == null) {
            data.from = "[admin]";
        }

        data.text = traiterTexte(data.text);

        bcMessages.innerHTML += "<p class='" + classe + "'>" + date + " - " + data.from + " : " + data.text + "</p>";
        document.querySelector("main > p:last-child").scrollIntoView();
    };

    // traitement des emojis
    function traiterTexte(txt) {
        var ind = txt.indexOf("[img:");
        while (ind >= 0) {
            console.log(txt);
            txt = txt.replace("\[img:",'<img src="');
            txt = txt.replace('\]','">');
            ind = txt.indexOf("[img:");
        }
        txt = txt.replace(/:[-]?\)/g,'<span class="emoji sourire"></span>');
        txt = txt.replace(/:[-]?D/g,'<span class="emoji banane"></span>');
        txt = txt.replace(/:[-]?[oO]/g,'<span class="emoji grrr"></span>');
        txt = txt.replace(/<3/g,'<span class="emoji love"></span>');
        txt = txt.replace(/:[-]?[Ss]/g,'<span class="emoji malade"></span>');
        return txt;
    }



    function afficherListe(newList) {
        document.querySelector("#content aside").innerHTML = newList.join("<br>");
    }


    /**
     *  Envoyer un message
     */
    function envoyer() {

        var msg = document.getElementById("monMessage").value.trim();
        if (!msg) return;

        // message privé
        var to = null;
        if (msg.startsWith("@")) {
            var i = msg.indexOf(" ");
            to = msg.substring(1, i);
            msg = msg.substring(i);
        }
        // envoi
        sock.emit("message", { from: currentUser, to: to, text: msg });

        document.getElementById("monMessage").value = "";
    }


    /**
     *  Quitter le chat et revenir à la page d'accueil.
     */
    function quitter() {
        currentUser = null;
        sock.emit("logout");
    };


    /**
     *  Fermer la zone de choix d'une image
     */
    function toggleImage() {
        if (document.getElementById("bcImage").style.display == "none") {
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
        var queryString = document.getElementById("recherche").value;
        queryString = queryString.replace(/\s/g,'+');
        // appel AJAX
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(_e) {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 200) {
                    var data = JSON.parse(this.responseText).data;
                    var html = "";
                    for (var i in data) {
                        var url = data[i].images.fixed_height.url;
                        html += "<img src='"+url+"'>";
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

    console.log("xtcyfuvbiojpibuvgc yfguvbihojhubgyvcf0");

    /**
     *  Mapping des boutons de l'interface avec des fonctions du client.
     */
    document.getElementById("btnConnecter").addEventListener("click", connect);
    // document.getElementById("btnQuitter").addEventListener("click", quitter);
    // document.getElementById("btnFermer").addEventListener("click", toggleImage);
    // document.getElementById("btnImage").addEventListener("click", toggleImage);
    // document.getElementById("btnEnvoyer").addEventListener("click", envoyer);
    // document.getElementById("btnRechercher").addEventListener("click", rechercher);
    // document.getElementById("recherche").addEventListener("keydown", function(e) {
    //     if (e.keyCode == 13) {
    //         rechercher();
    //     }
    // });
    // document.getElementById("bcResults").addEventListener("click", choixImage);
    // document.getElementById("monMessage").addEventListener("keydown", function(e) {
    //     if (e.keyCode == 13) {
    //         envoyer();
    //     }
    // });

    // force l'affichage de l'écran de connexion
    quitter();

});
    