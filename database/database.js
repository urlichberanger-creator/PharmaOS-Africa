// @ts-nocheck
/* =====================================================
   PharmaOS Africa — database.js
   Petite couche de stockage local (basée sur localStorage)
   Fournit l'objet global PharmaDB utilisé par les autres
   scripts : dashboard.js, achats.js, factures.js,
   historique.js, medicaments.js, parametres.js
===================================================== */
(function (global) {
    "use strict";
    var PREFIX = "pharmaos_";
    function cleComplete(cle) {
        return PREFIX + cle;
    }
    /**
     * Lit une entrée depuis le stockage.
     * @param {string} cle - nom de la collection (ex: "medicaments", "achats"...)
     * @returns {*} le contenu désérialisé, ou null si absent / illisible
     */
    function lire(cle) {
        try {
            var brut = localStorage.getItem(cleComplete(cle));
            if (brut === null) return null;
            return JSON.parse(brut);
        } catch (e) {
            console.error("PharmaDB.lire — erreur sur la clé:", cle, e);
            return null;
        }
    }
    /**
     * Enregistre une entrée dans le stockage.
     * @param {string} cle - nom de la collection
     * @param {*} valeur - donnée à sauvegarder (sera sérialisée en JSON)
     * @returns {boolean} true si l'enregistrement a réussi
     */
    function enregistrer(cle, valeur) {
        try {
            localStorage.setItem(cleComplete(cle), JSON.stringify(valeur));
            return true;
        } catch (e) {
            console.error("PharmaDB.enregistrer — erreur sur la clé:", cle, e);
            return false;
        }
    }
    /**
     * Supprime une entrée du stockage.
     * @param {string} cle
     */
    function supprimer(cle) {
        try {
            localStorage.removeItem(cleComplete(cle));
            return true;
        } catch (e) {
            console.error("PharmaDB.supprimer — erreur sur la clé:", cle, e);
            return false;
        }
    }
    /**
     * Liste toutes les clés PharmaOS actuellement stockées
     * (utile pour un export global ou un debug).
     */
    function listerCles() {
        var cles = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf(PREFIX) === 0) {
                cles.push(k.slice(PREFIX.length));
            }
        }
        return cles;
    }
    /**
     * Exporte toutes les données PharmaOS sous forme d'objet
     * { cle: valeur, ... } — pratique pour une sauvegarde/export JSON.
     */
    function exporterTout() {
        var resultat = {};
        listerCles().forEach(function (cle) {
            resultat[cle] = lire(cle);
        });
        return resultat;
    }
    /**
     * Réimporte un objet { cle: valeur, ... } précédemment exporté.
     */
    function importerTout(donnees) {
        if (!donnees || typeof donnees !== "object") return false;
        Object.keys(donnees).forEach(function (cle) {
            enregistrer(cle, donnees[cle]);
        });
        return true;
    }

    /**
     * Efface TOUTES les données PharmaOS (remise à zéro complète).
     * À utiliser avec précaution (ex: bouton "réinitialiser" dans Paramètres).
     */
    function reinitialiser() {
        listerCles().forEach(function (cle) {
            supprimer(cle);
        });
        return true;
    }
    global.PharmaDB = {
        lire: lire,
        enregistrer: enregistrer,
        supprimer: supprimer,
        listerCles: listerCles,
        exporterTout: exporterTout,
        importerTout: importerTout,
        reinitialiser: reinitialiser
    };
})(window);