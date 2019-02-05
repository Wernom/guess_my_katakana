/****
 *  japonais.js
 *
 *  Programme d'entrainement aux hiragana et aux katakanas.
 */

/** Fonction auto-invoquée, permet d'éviter de polluer le scope global avec des variables globales */
(function () {

    /** Ensemble des glyphes */
    var objGlyphes = null;

    /** Dernier glyphe à faire deviner */
    var last = null;

    /**
     *  Objet simple permettant de gérer le score
     */
    var score = {
        // score de la session
        current: {ok: 0, total: 0},
        // score global lu dans le localstorage (clé : "score")
        global: (localStorage.getItem("score") ? JSON.parse(localStorage.getItem("score")) : {ok: 0, total: 0}),
        /** Quelques fonctions utiles pour gérer le score */
        reset: function () {
            this.current.ok = 0;
            this.current.total = 0;
            this.global.ok = 0;
            this.global.total = 0;
        },
        enregistrer: function () {
            localStorage.setItem("score", JSON.stringify(this.global));
        },
        afficher: function () {
            document.getElementById("scores").innerHTML =
                "Session : " + score.current.ok + " / " + score.current.total +
                " (" + ((score.current.total == 0) ? "0" : Math.round(score.current.ok * 100 / score.current.total)) + "%) | " +
                "Global : " + score.global.ok + " / " + score.global.total +
                " (" + ((score.global.total == 0) ? "0" : Math.round(score.global.ok * 100 / score.global.total)) + "%)";
        }
    };


    /**
     *  Initialisation de la zone de jeu (ne sera exécuté que lorsque le document sera chargé - événement DOMContentLoaded)
     */
    document.addEventListener("DOMContentLoaded", async function () {

        if (typeof fetch !== undefined) {
            // avec des promesses et l'instruction fetch
            var response = await
            fetch("./js/alphabet.json");
            if (response.status == 200) {
                var data = await
                response.json();
                objGlyphes = new Glyphes(data);
                change();
            }
        }
        else {
            // "à l'ancienne" avec un appel AJAX
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    objGlyphes = new Glyphes(JSON.parse(this.responseText));
                    change();
                }
            }
            xhttp.open("GET", "./js/alphabet.json", true);
            xhttp.send();
        }

        // association des écouteurs d'événements sur les éléments de formulaire des options
        var inputs = document.querySelectorAll("#options input:not([type=button])");
        inputs.forEach(function (input) {
            input.addEventListener("change", change, false);
        }, false);
        // événement sur le bouton de réinitialisation du score
        document.getElementById("btnReinit").addEventListener("click", function () {
            // demande de confirmation (évite les fausses manipulations)
            if (window.confirm("Voulez vous vraiment réinitialiser vos scores ?")) {
                score.reset();
                score.enregistrer();
                score.afficher();
            }
        }, true);
        // événement sur le corps du document 
        document.querySelector("main").addEventListener("click", function (e) {
            if (document.getElementById("choix").classList.length > 0) {
                change();
            }
        }, false);   // bubbling (capturing==false) --> ne capture l'événement qu'en tout dernier 

        // affichage préalable du score
        score.afficher();

    }

,
    true
)
    ;


    /**
     *  Change la lettre/syllabe à reconnaître.
     */
    function change() {
        // récupération de l'alphabet
        var alphabet = document.querySelector('#options input[name=radGlyphe]:checked').value;
        if (alphabet == "les2") {
            alphabet = (Math.random() < 0.5) ? 'hiragana' : 'katakana';
        }
        // sélection de 3 glyphes
        var aTrouver = objGlyphes.getThreeGlyphes(last, alphabet);
        // choix du glyphe à deviner parmi les 3
        var rand = Math.random() * 3 | 0;
        last = aTrouver[rand].key;
        // affichage du caractère/syllabe à trouver
        afficherTrucATrouver(aTrouver[rand]);
        // affichage des choix possibles (avec traduction)
        afficherChoix(last, aTrouver);
    }


    function afficherTrucATrouver(solution) {
        var afficheSyllabe = document.querySelector("#options input[name=radJeu]:checked").value == "syllabes";
        document.getElementById("affichage").innerHTML =
            (afficheSyllabe) ? solution.key : "&#" + solution.ascii + ";";
    }

    function afficherChoix(solution, tousChoix) {
        // récupération du bloc contenant les choix dans l'interface
        var bcChoix = document.getElementById("choix");
        // réinitialisation du contenu et des styles associés
        bcChoix.className = "";
        bcChoix.innerHTML = "";
        for (var i = 0; i < tousChoix.length; i++) {
            var choix = tousChoix[i];
            /** On génère le code HTML suivant pour remplir le bloc contenant les choix :
             *  <div data-correct=[true|false]>
             *      [syllabe|caractère] <br>
             *      <span class="solution">[caractère|syllabe]</span>
             *  </div>
             *  la solution sera cachée et ne sera visible que si le bloc choix mentionne une solution correcte ou incorrecte
             *  (tout ceci se fait via une classe CSS et le style associé)
             */
            var div = document.createElement("div");
            var isCorrect = (choix.key == solution);
            div.dataset.correct = isCorrect;    // on cache dans l'élément HTML si c'est la bonne solution ou pas
            div.innerHTML = (document.querySelector("#options input[name=radJeu]:checked").value == "syllabes") ?
                "&#" + choix.ascii + ";<br><span class='solution'>" + (isCorrect ? "" : choix.key) + "</span>" :
                choix.key + "<br><span class='solution'>" + (isCorrect ? "" : "&#" + choix.ascii + ";") + "</span>";
            bcChoix.appendChild(div);
            // on ajoute un écouteur sur chacun des blocs <div...> ainsi généré
            div.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                /*  on utilise le fait que le bloc choix présente ou pas une classe de style 
                 *  pour savoir si une réponse a déjà été donnée. 
                 */
                if (bcChoix.classList.length == 0) {
                    e.stopPropagation();
                    // pas encore de proposition faite
                    if (this.dataset.correct == "true") {
                        // bonne réponse --> on ajoute le style au bloc choix et on incrémente le score 
                        bcChoix.classList.add("correct");
                        score.current.ok++;
                        score.global.ok++;
                    }
                    else {
                        // mauvaise réponse --> même traitement, mais le score ne bouge pas
                        bcChoix.classList.add("incorrect");
                    }
                    // incrément du nombre de réponses et enregistrement du score
                    score.current.total++;
                    score.global.total++;
                    score.enregistrer();
                    score.afficher();
                }
                else {
                    change();
                }
            }, false);
        }
    }


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
        }


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

            return aTrouver;
        }
    }

})();