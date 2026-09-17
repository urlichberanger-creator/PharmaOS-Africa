// @ts-nocheck
"use strict";

/* =========================================================
   PharmaOS Africa
   DASHBOARD.JS V2.0
   Tableau de bord réel
========================================================= */


/* =========================================================
   OUTILS
========================================================= */

function el(id) {
    return document.getElementById(id);
}


function lire(nom) {

    try {

        if (
            window.PharmaDB &&
            typeof PharmaDB.lire === "function"
        ) {
            var data = PharmaDB.lire(nom);

            return Array.isArray(data) ? data : [];
        }

        var brut = localStorage.getItem(nom);

        if (!brut) {
            return [];
        }

        var data2 = JSON.parse(brut);

        return Array.isArray(data2) ? data2 : [];

    } catch (e) {

        console.warn("Lecture impossible :", nom);

        return [];
    }
}


function nombre(v) {

    var n = Number(v);

    return isFinite(n) ? n : 0;
}


function parametres() {

    try {

        var p = localStorage.getItem("parametres");

        if (!p) {
            return {};
        }

        var data = JSON.parse(p);

        return data && typeof data === "object"
            ? data
            : {};

    } catch (e) {

        return {};
    }
}


function devise() {

    var p = parametres();

    return p.devise || "BIF";
}


function argent(v) {

    var p = parametres();

    var decimales =
        nombre(p.decimales);


    return (
        nombre(v)
            .toLocaleString(
                "fr-FR",
                {
                    minimumFractionDigits: decimales,
                    maximumFractionDigits: decimales
                }
            )
            .replace(/\u202f/g, " ")
        + " "
        + devise()
    );
}


/* =========================================================
   MÉDICAMENT
========================================================= */

function abrevForme(forme) {

    var f =
        String(forme || "")
            .trim()
            .toLowerCase();


    var map = {

        "comprimé": "Cp",
        "comprime": "Cp",
        "comprimés": "Cp",
        "comprimés pelliculés": "Cp pellic",
        "comprime pellicule": "Cp pellic",

        "comprimé lp": "Cp LP",
        "comprime lp": "Cp LP",
        "comprimé à libération prolongée": "Cp LP",

        "gélule": "Gél",
        "gelule": "Gél",
        "gélules": "Gél",

        "sirop": "Sir",

        "solution buvable": "Sol buv",
        "sol buv": "Sol buv",

        "suspension buvable": "Sp buv",
        "sp buv": "Sp buv",

        "solution injectable": "Sol inj",
        "sol inj": "Sol inj",

        "suspension injectable": "Sp inj",
        "sp inj": "Sp inj",

        "crème": "Cr",
        "creme": "Cr",

        "pommade": "Pomm",

        "gel": "Gel",

        "poudre": "Pdre",

        "suppositoire": "Supp",

        "ovule": "Ov",

        "collyre": "Collyre",

        "aérosol": "Aérosol",
        "aerosol": "Aérosol"
    };


    return map[f] || String(forme || "");
}


function trouverMedicament(id, medicaments) {

    if (!id) {
        return null;
    }


    for (var i = 0; i < medicaments.length; i++) {

        if (
            String(medicaments[i].id) ===
            String(id)
        ) {
            return medicaments[i];
        }
    }


    return null;
}


function nomMedicament(m, secours) {

    if (!m) {
        return secours || "Médicament";
    }


    var dci =
        m.dci ||
        m.nomDCI ||
        m.nom ||
        "";


    var commercial =
        m.nomCommercial ||
        m.commercial ||
        "";


    var forme =
        abrevForme(
            m.forme ||
            m.formePharmaceutique ||
            ""
        );


    var dosage =
        m.dosage ||
        "";


    var resultat =
        dci.trim();


    if (commercial.trim()) {

        resultat +=
            (resultat ? "\n" : "") +
            commercial.trim() +
            "®";
    }


    var details = [];


    if (forme) {
        details.push(forme);
    }


    if (dosage) {
        details.push(dosage);
    }


    if (details.length) {

        resultat +=
            (resultat ? "\n" : "") +
            details.join(" ");
    }


    return resultat ||
        secours ||
        "Médicament";
}


/* =========================================================
   DATE
========================================================= */

function afficherDate() {

    var cible =
        el("dateActuelle");


    if (!cible) {
        return;
    }


    var date =
        new Date();


    var texte =
        date.toLocaleDateString(
            "fr-FR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );


    cible.textContent =
        texte.charAt(0).toUpperCase() +
        texte.slice(1);
}


/* =========================================================
   VENTES
========================================================= */

function lignesVente(vente) {

    if (!vente) {
        return [];
    }


    if (Array.isArray(vente.lignes)) {
        return vente.lignes;
    }


    if (Array.isArray(vente.panier)) {
        return vente.panier;
    }


    if (Array.isArray(vente.produits)) {
        return vente.produits;
    }


    return [];
}


function totalVente(vente) {

    if (!vente) {
        return 0;
    }


    if (vente.total !== undefined) {
        return nombre(vente.total);
    }


    if (vente.montant !== undefined) {
        return nombre(vente.montant);
    }


    if (vente.totalVente !== undefined) {
        return nombre(vente.totalVente);
    }


    var lignes =
        lignesVente(vente);


    var total = 0;


    for (var i = 0; i < lignes.length; i++) {

        var ligne =
            lignes[i];


        total +=
            nombre(
                ligne.total !== undefined
                    ? ligne.total
                    : nombre(ligne.quantite) *
                      nombre(
                          ligne.prixVente ||
                          ligne.pvu ||
                          ligne.prix
                      )
            );
    }


    return total;
}


function calculerCA(ventes) {

    var total = 0;


    for (var i = 0; i < ventes.length; i++) {

        total +=
            totalVente(ventes[i]);
    }


    return total;
}


/* =========================================================
   BÉNÉFICE
========================================================= */

function calculerBenefice(ventes, stocks) {

    var total = 0;


    for (var i = 0; i < ventes.length; i++) {

        var vente =
            ventes[i];


        if (vente.benefice !== undefined) {

            total +=
                nombre(vente.benefice);

            continue;
        }


        if (vente.marge !== undefined) {

            total +=
                nombre(vente.marge);

            continue;
        }


        if (vente.profit !== undefined) {

            total +=
                nombre(vente.profit);

            continue;
        }


        var lignes =
            lignesVente(vente);


        for (var j = 0; j < lignes.length; j++) {

            var ligne =
                lignes[j];


            var qte =
                nombre(ligne.quantite);


            var pvu =
                nombre(
                    ligne.prixVente ||
                    ligne.pvu ||
                    ligne.prix
                );


            var pau =
                nombre(
                    ligne.prixAchat ||
                    ligne.pau ||
                    ligne.prixAchatUnitaire
                );


            if (
                pau === 0 &&
                stocks.length
            ) {

                for (var k = 0; k < stocks.length; k++) {

                    var s =
                        stocks[k];


                    var memeMedicament =
                        ligne.medicamentId &&
                        s.medicamentId &&
                        String(ligne.medicamentId) ===
                        String(s.medicamentId);


                    var memeLot =
                        ligne.lot &&
                        s.lot &&
                        String(ligne.lot) ===
                        String(s.lot);


                    if (
                        memeMedicament &&
                        memeLot
                    ) {

                        pau =
                            nombre(
                                s.prixAchat ||
                                s.pau
                            );

                        break;
                    }
                }
            }


            if (pvu > 0 && pau > 0) {

                total +=
                    (pvu - pau) * qte;
            }
        }
    }


    return total;
}


/* =========================================================
   STOCK
========================================================= */

function quantiteStock(s) {

    return nombre(
        s.quantite !== undefined
            ? s.quantite
            : (
                s.quantiteDisponible !== undefined
                    ? s.quantiteDisponible
                    : s.stock
            )
    );
}


function totalStock(stocks) {

    var total = 0;


    for (var i = 0; i < stocks.length; i++) {

        total +=
            quantiteStock(stocks[i]);
    }


    return total;
}


function minimumStock(s) {

    return nombre(
        s.stockMinimum !== undefined
            ? s.stockMinimum
            : (
                s.minimum !== undefined
                    ? s.minimum
                    : s.seuilMinimum
            )
    );
}


/* =========================================================
   EXPIRATION
========================================================= */

function dateValide(date) {

    if (!date) {
        return null;
    }


    var d =
        new Date(date);


    return isNaN(d.getTime())
        ? null
        : d;
}


function joursAvantExpiration(date) {

    var d =
        dateValide(date);


    if (!d) {
        return null;
    }


    var maintenant =
        new Date();


    var diff =
        d.getTime() -
        maintenant.getTime();


    return Math.ceil(
        diff /
        86400000
    );
}


/* =========================================================
   ALERTES
========================================================= */

function obtenirAlertes(stocks, medicaments) {

    var alertes = [];


    var p =
        parametres();


    var seuilExpiration =
        nombre(
            p.alerteExpiration || 30
        );


    for (var i = 0; i < stocks.length; i++) {

        var stock =
            stocks[i];


        var qte =
            quantiteStock(stock);


        var minimum =
            minimumStock(stock);


        var medicament =
            trouverMedicament(
                stock.medicamentId,
                medicaments
            );


        var nom =
            nomMedicament(
                medicament,
                stock.medicament
            );


        /* STOCK ÉPUISÉ */

        if (qte <= 0) {

            alertes.push({
                niveau: "danger",
                titre: "Stock épuisé",
                texte:
                    nom +
                    " — quantité : 0"
            });

            continue;
        }


        /* STOCK FAIBLE */

        if (
            minimum > 0 &&
            qte <= minimum
        ) {

            alertes.push({
                niveau: "warning",
                titre: "Stock faible",
                texte:
                    nom +
                    " — " +
                    qte +
                    " unité(s), minimum " +
                    minimum
            });
        }


        /* EXPIRATION */

        var expiration =
            stock.dateExpiration ||
            stock.expiration;


        var jours =
            joursAvantExpiration(
                expiration
            );


        if (
            jours !== null &&
            jours < 0
        ) {

            alertes.push({
                niveau: "danger",
                titre: "Lot expiré",
                texte:
                    nom +
                    " — lot " +
                    (stock.lot || "sans lot")
            });

        } else if (
            jours !== null &&
            jours <= seuilExpiration
        ) {

            alertes.push({
                niveau: "warning",
                titre: "Expiration proche",
                texte:
                    nom +
                    " — expiration dans " +
                    jours +
                    " jour(s)"
            });
        }
    }


    return alertes;
}


/* =========================================================
   AFFICHAGE ALERTES
========================================================= */

function afficherAlertes() {

    var stocks =
        lire("stock");


    if (!stocks.length) {
        stocks = lire("stocks");
    }


    var medicaments =
        lire("medicaments");


    var alertes =
        obtenirAlertes(
            stocks,
            medicaments
        );


    var liste =
        el("listeAlertes");


    var compteur =
        el("nombreAlertes");


    var resume =
        el("nombreAlertesResume");


    var badge =
        el("notificationBadge");


    if (compteur) {
        compteur.textContent =
            alertes.length;
    }


    if (resume) {
        resume.textContent =
            alertes.length;
    }


    if (badge) {

        if (alertes.length > 0) {

            badge.textContent =
                alertes.length;

            badge.style.display =
                "flex";

        } else {

            badge.style.display =
                "none";
        }
    }


    if (!liste) {
        return;
    }


    if (!alertes.length) {

        liste.innerHTML =
            '<div class="empty-state">' +
                '<div class="empty-icon">✓</div>' +
                '<strong>Aucune alerte</strong>' +
                '<span>Aucun problème détecté.</span>' +
            '</div>';

        return;
    }


    liste.innerHTML = "";


    var limite =
        Math.min(
            alertes.length,
            8
        );


    for (var i = 0; i < limite; i++) {

        var a =
            alertes[i];


        var item =
            document.createElement("div");


        item.className =
            "alert-item";


        item.innerHTML =
            '<div class="alert-icon">!</div>' +
            '<div class="alert-content">' +
                '<div class="alert-title">' +
                    a.titre +
                '</div>' +
                '<div class="alert-text">' +
                    a.texte +
                '</div>' +
            '</div>';


        liste.appendChild(item);
    }
}


/* =========================================================
   OPÉRATIONS RÉCENTES
========================================================= */

function dateOperation(obj) {

    return (
        obj.dateHeure ||
        obj.date ||
        obj.createdAt ||
        obj.created_at ||
        ""
    );
}


function afficherOperations() {

    var liste =
        el("listeOperations");


    if (!liste) {
        return;
    }


    var ventes =
        lire("ventes");


    var achats =
        lire("achats");


    var journal =
        lire("journal");


    var operations = [];


    for (var i = 0; i < ventes.length; i++) {

        operations.push({
            type: "Vente",
            description:
                ventes[i].numero ||
                ventes[i].reference ||
                ventes[i].facture ||
                "Vente enregistrée",
            valeur:
                totalVente(ventes[i]),
            date:
                dateOperation(ventes[i])
        });
    }


    for (var j = 0; j < achats.length; j++) {

        operations.push({
            type: "Réception",
            description:
                achats[j].reference ||
                achats[j].numero ||
                "Réception enregistrée",
            valeur:
                nombre(
                    achats[j].total ||
                    achats[j].montant
                ),
            date:
                dateOperation(achats[j])
        });
    }


    for (var k = 0; k < journal.length; k++) {

        operations.push({
            type:
                journal[k].type ||
                "Journal",
            description:
                journal[k].description ||
                journal[k].action ||
                "Opération",
            valeur:
                nombre(
                    journal[k].montant
                ),
            date:
                dateOperation(journal[k])
        });
    }


    operations.sort(
        function(a, b) {

            return (
                new Date(b.date).getTime() -
                new Date(a.date).getTime()
            );
        }
    );


    operations =
        operations.slice(0, 6);


    if (!operations.length) {

        liste.innerHTML =
            '<div class="empty-state">' +
                '<div class="empty-icon">—</div>' +
                '<strong>Aucune opération</strong>' +
                '<span>Les opérations apparaîtront ici.</span>' +
            '</div>';

        return;
    }


    liste.innerHTML = "";


    for (var x = 0; x < operations.length; x++) {

        var op =
            operations[x];


        var item =
            document.createElement("div");


        item.className =
            "operation-item";


        var valeur =
            nombre(op.valeur);


        item.innerHTML =
            '<div class="operation-main">' +
                '<div class="operation-title">' +
                    op.type +
                '</div>' +
                '<div class="operation-description">' +
                    op.description +
                '</div>' +
            '</div>' +
            '<div class="operation-value">' +
                (
                    valeur
                        ? argent(valeur)
                        : ""
                ) +
            '</div>';


        liste.appendChild(item);
    }
}


/* =========================================================
   KPI
========================================================= */

function afficherKPI() {

    var medicaments =
        lire("medicaments");


    var stocks =
        lire("stock");


    if (!stocks.length) {
        stocks = lire("stocks");
    }


    var ventes =
        lire("ventes");


    var achats =
        lire("achats");


    var patients =
        lire("patients");


    var ca =
        calculerCA(
            ventes
        );


    var benefice =
        calculerBenefice(
            ventes,
            stocks
        );


    var stockTotal =
        totalStock(
            stocks
        );


    var eCA =
        el("chiffreAffaires");


    var eBenefice =
        el("benefice");


    var eStock =
        el("stockDisponible");


    var eMedicaments =
        el("medicamentsActifs");


    if (eCA) {
        eCA.textContent =
            argent(ca);
    }


    if (eBenefice) {

        eBenefice.textContent =
            argent(benefice);

        eBenefice.classList.toggle(
            "positive",
            benefice >= 0
        );
    }


    if (eStock) {

        eStock.textContent =
            stockTotal.toLocaleString(
                "fr-FR"
            );
    }


    if (eMedicaments) {

        eMedicaments.textContent =
            medicaments.length;
    }


    var ePatients =
        el("nombrePatients");


    var eVentes =
        el("nombreVentes");


    var eAchats =
        el("nombreAchats");


    if (ePatients) {
        ePatients.textContent =
            patients.length;
   }


    if (eAchats) {
        eAchats.textContent =
            achats.length;
    }
}


/* =========================================================
   TOAST
========================================================= */

var toastTimer = null;


function toast(message) {

    var t =
        el("toast");


    var m =
        el("toastMessage");


    if (!t || !m) {
        return;
    }


    m.textContent =
        message;


    t.classList.add(
        "visible"
    );


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );
    }


    toastTimer =
        setTimeout(
            function() {

                t.classList.remove(
                    "visible"
                );

            },
            2500
        );
}


/* =========================================================
   MENU
========================================================= */

function initialiserMenu() {

    var bouton =
        el("btnMenu");


    var sidebar =
        el("sidebar");


    var overlay =
        el("sidebarOverlay");


    if (
        !bouton ||
        !sidebar ||
        !overlay
    ) {
        return;
    }


    bouton.addEventListener(
        "click",
        function() {

            sidebar.classList.toggle(
                "open"
            );

            overlay.classList.toggle(
                "visible"
            );
        }
    );


    overlay.addEventListener(
        "click",
        function() {

            sidebar.classList.remove(
                "open"
            );

            overlay.classList.remove(
                "visible"
            );
        }
    );


    var liens =
        sidebar.querySelectorAll(
            ".menu-item"
        );


    for (var i = 0; i < liens.length; i++) {

        liens[i].addEventListener(
            "click",
            function() {

                sidebar.classList.remove(
                    "open"
                );

                overlay.classList.remove(
                    "visible"
                );
            }
        );
    }
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function initialiserNotifications() {

    var bouton =
        el("btnNotification");


    if (!bouton) {
        return;
    }


    bouton.addEventListener(
        "click",
        function() {

            var stocks =
                lire("stock");


            if (!stocks.length) {
                stocks = lire("stocks");
            }


            var medicaments =
                lire("medicaments");


            var alertes =
                obtenirAlertes(
                    stocks,
                    medicaments
                );


            if (!alertes.length) {

                toast(
                    "Aucune alerte."
                );

            } else {

                toast(
                    alertes.length +
                    " alerte(s) nécessitent votre attention."
                );
            }
        }
    );
}


/* =========================================================
   DÉCONNEXION
========================================================= */

function initialiserDeconnexion() {

    var bouton =
        el("btnDeconnexion");


    if (!bouton) {
        return;
    }


    bouton.addEventListener(
        "click",
        function() {

            try {

                localStorage.removeItem(
                    "utilisateurConnecte"
                );

            } catch (e) {}


            window.location.href =
                "../index.html";
        }
    );
}


/* =========================================================
   ACTUALISATION AUTOMATIQUE
========================================================= */

function actualiserDashboard() {

    afficherDate();

    afficherKPI();

    afficherAlertes();

    afficherOperations();
}


/* =========================================================
   INITIALISATION
========================================================= */

function initialiserDashboard() {

    actualiserDashboard();

    initialiserMenu();

    initialiserNotifications();

    initialiserDeconnexion();


    /* Actualisation légère */

    window.setInterval(
        actualiserDashboard,
        30000
    );
}


/* =========================================================
   DÉMARRAGE
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    initialiserDashboard
);
