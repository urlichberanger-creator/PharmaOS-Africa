// @ts-nocheck

/* =========================================================
   PHARMAOS AFRICA
   FACTURES V2
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let factures = [];

let factureActuelle = null;

let toastTimer = null;


/* =========================================================
   OUTILS
========================================================= */

function el(id) {

    return document.getElementById(id);

}


function lire(cle) {

    try {

        if (
            window.PharmaDB &&
            typeof PharmaDB.lire === "function"
        ) {

            const data =
                PharmaDB.lire(cle);

            return Array.isArray(data)
                ? data
                : data || [];

        }

    } catch (e) {

        console.warn(e);

    }


    try {

        const data =
            localStorage.getItem(cle);

        if (!data) {
            return [];
        }

        return JSON.parse(data);

    } catch (e) {

        return [];

    }

}


function lireObjet(cle) {

    try {

        const data =
            localStorage.getItem(cle);

        return data
            ? JSON.parse(data)
            : {};

    } catch (e) {

        return {};

    }

}


function afficherToast(message) {

    const toast =
        el("toast");

    const texte =
        el("toastMessage");


    if (!toast || !texte) {
        return;
    }


    texte.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   MONNAIE
========================================================= */

function parametres() {

    const p =
        lireObjet("parametres");

    return {

        nomPharmacie:
            p.nomPharmacie || "Pharmacie",

        telephone:
            p.telephone || "",

        adresse:
            p.adresse || "",

        ville:
            p.ville || "",

        devise:
            p.devise || "BIF",

        decimales:
            Number.isFinite(
                Number(p.decimales)
            )
                ? Number(p.decimales)
                : 0,

        affichageMedicament:
            p.affichageMedicament ||
            "both"

    };

}


function argent(value) {

    const p =
        parametres();


    const nombre =
        Number(value) || 0;


    return nombre.toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits:
                p.decimales,

            maximumFractionDigits:
                p.decimales
        }
    )
    + " "
    + p.devise;

}


/* =========================================================
   FORME PHARMACEUTIQUE
========================================================= */

function formeCourte(forme) {

    const f =
        String(forme || "")
            .trim()
            .toLowerCase();


    const map = {

        "comprimé": "Cp",
        "comprimés": "Cp",

        "tablet": "Cp",
        "tablette": "Cp",

        "gélule": "Gél",
        "gélules": "Gél",

        "solution injectable": "Sol inj",
        "solution inj": "Sol inj",
        "injectable": "Sol inj",

        "solution buvable": "Sol buv",
        "solution orale": "Sol buv",

        "suspension buvable": "Sp buv",
        "suspension orale": "Sp buv",

        "sirop": "Sir",

        "crème": "Cr",

        "pommade": "Pomm",

        "gel": "Gel",

        "ovule": "Ov",

        "suppositoire": "Supp",

        "sachet": "Sachet",

        "ampoule": "Amp",

        "flacon": "Fl"

    };


    return map[f] || forme || "";

}


/* =========================================================
   NOM DU MÉDICAMENT
========================================================= */

function nomMedicament(medicament) {

    if (!medicament) {
        return "Médicament";
    }


    const p =
        parametres();


    const dci =
        String(
            medicament.dci ||
            medicament.medicament ||
            medicament.nom ||
            ""
        ).trim();


    const commercial =
        String(
            medicament.nomCommercial ||
            medicament.commercial ||
            ""
        ).trim();


    const forme =
        formeCourte(
            medicament.forme
        );


    const dosage =
        String(
            medicament.dosage || ""
        ).trim();


    let principal = "";


    /*
     * DCI
     */

    if (
        p.affichageMedicament === "dci"
    ) {

        principal =
            dci ||
            commercial;

    }


    /*
     * COMMERCIAL
     */

    else if (
        p.affichageMedicament === "commercial"
    ) {

        principal =
            commercial ||
            dci;

    }


    /*
     * DCI + COMMERCIAL
     */

    else {

        if (dci && commercial) {

            principal =
                dci
                + " — "
                + commercial
                + "®";

        } else {

            principal =
                dci ||
                (
                    commercial
                    ? commercial + "®"
                    : ""
                );

        }

    }


    /*
     * Si seul le commercial
     */

    if (
        p.affichageMedicament === "commercial"
        &&
        commercial
    ) {

        principal =
            commercial + "®";

    }


    const sousLigne =
        [forme, dosage]
            .filter(Boolean)
            .join(" ");


    return {

        principal:
            principal || "Médicament",

        sousLigne

    };

}


/* =========================================================
   LIGNES DE VENTE
========================================================= */

function lignesVente(vente) {

    if (!vente) {
        return [];
    }


    if (
        Array.isArray(
            vente.lignes
        )
    ) {

        return vente.lignes;

    }


    if (
        Array.isArray(
            vente.panier
        )
    ) {

        return vente.panier;

    }


    if (
        Array.isArray(
            vente.produits
        )
    ) {

        return vente.produits;

    }


    return [];

}


/* =========================================================
   TOTAL
========================================================= */

function totalVente(vente) {

    if (!vente) {
        return 0;
    }


    const total =
        Number(
            vente.total ??
            vente.montant ??
            vente.totalVente
        );


    if (
        Number.isFinite(total)
        &&
        total >= 0
    ) {

        return total;

    }


    return lignesVente(vente)
        .reduce(
            function (
                somme,
                ligne
            ) {

                const qte =
                    Number(
                        ligne.quantite ??
                        ligne.qte ??
                        ligne.quantity ??
                        0
                    );


                const prix =
                    Number(
                        ligne.prixVente ??
                        ligne.pvu ??
                        ligne.prix ??
                        0
                    );


                return somme +
                    (
                        qte * prix
                    );

            },
            0
        );

}


/* =========================================================
   DATE
========================================================= */

function dateLisible(date) {

    if (!date) {
        return "—";
    }


    const d =
        new Date(date);


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {

        return String(date);

    }


    return d.toLocaleString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   CHARGEMENT
========================================================= */

function chargerFactures() {

    factures =
        lire("ventes");


    if (!Array.isArray(factures)) {
        factures = [];
    }


    factures.sort(
        function (a, b) {

            return new Date(
                b.date || 0
            ) - new Date(
                a.date || 0
            );

        }
    );


    afficherFactures();

}


/* =========================================================
   FILTRAGE
========================================================= */

function obtenirFacturesFiltrees() {

    const recherche =
        String(
            el("recherche")?.value || ""
        )
        .trim()
        .toLowerCase();


    const paiement =
        String(
            el("filtrePaiement")?.value || ""
        )
        .trim()
        .toLowerCase();


    const date =
        String(
            el("filtreDate")?.value || ""
        )
        .trim();


    return factures.filter(
        function (facture) {

            const numero =
                String(
                    facture.facture ||
                    facture.numeroFacture ||
                    facture.numero ||
                    ""
                )
                .toLowerCase();


            const patient =
                String(
                    facture.patient ||
                    ""
                )
                .toLowerCase();


            const mode =
                String(
                    facture.modePaiement ||
                    ""
                )
                .toLowerCase();


            const dateFacture =
                String(
                    facture.date || ""
                );


            if (
                recherche
                &&
                !numero.includes(recherche)
                &&
                !patient.includes(recherche)
            ) {

                return false;

            }


            if (
                paiement
                &&
                mode !== paiement
            ) {

                return false;

            }


            if (
                date
                &&
                !dateFacture.startsWith(date)
            ) {

                return false;

            }


            return true;

        }
    );

}


/* =========================================================
   AFFICHER FACTURES
========================================================= */

function afficherFactures() {

    const tbody =
        el("listeFactures");

    const vide =
        el("etatVide");

    const compteur =
        el("compteur");

    const total =
        el("totalFactures");


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const liste =
        obtenirFacturesFiltrees();


    let montantTotal = 0;


    liste.forEach(
        function (
            facture,
            index
        ) {

            const tr =
                document.createElement(
                    "tr"
                );


            const numero =
                facture.facture ||
                facture.numeroFacture ||
                facture.numero ||
                "FACT-" + (
                    index + 1
                );


            const patient =
                facture.patient ||
                "Client comptant";


            const mode =
                facture.modePaiement ||
                "—";


            const montant =
                totalVente(
                    facture
                );


            montantTotal +=
                montant;


            tr.innerHTML = `

                <td>
                    <strong class="invoice-number">
                        ${echapper(numero)}
                    </strong>
                </td>

                <td>
                    ${echapper(
                        dateLisible(
                            facture.date
                        )
                    )}
                </td>

                <td>
                    ${echapper(patient)}
                </td>

                <td>
                    ${echapper(mode)}
                </td>

                <td class="align-right">
                    <strong>
                        ${argent(montant)}
                    </strong>
                </td>

                <td class="align-center">

                    <button
                        type="button"
                        class="action-btn"
                        data-index="${factures.indexOf(facture)}"
                    >
                        Voir
                    </button>

                </td>

            `;


            const bouton =
                tr.querySelector(
                    ".action-btn"
                );


            if (bouton) {

                bouton.addEventListener(
                    "click",
                    function () {

                        voirFacture(
                            factures.indexOf(
                                facture
                            )
                        );

                    }
                );

            }


            tbody.appendChild(tr);

        }
    );


    if (compteur) {

        compteur.textContent =
            liste.length;

    }


    if (total) {

        total.textContent =
            argent(
                montantTotal
            );

    }


    if (vide) {

        vide.style.display =
            liste.length
                ? "none"
                : "block";

    }

}


/* =========================================================
   ÉCHAPPER HTML
========================================================= */

function echapper(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   AFFICHER UNE FACTURE
========================================================= */

function voirFacture(index) {

    const facture =
        factures[index];


    if (!facture) {
        return;
    }


    factureActuelle =
        facture;


    const p =
        parametres();


    /*
     * Informations pharmacie
     */

    const adresse =
        el("pharmacieAdresse");

    const telephone =
        el("pharmacieTelephone");


    if (adresse) {

        const texteAdresse =
            [
                p.adresse,
                p.ville
            ]
            .filter(Boolean)
            .join(" • ");


        adresse.textContent =
            texteAdresse;

    }


    if (telephone) {

        telephone.textContent =
            p.telephone
                ? "Tél. : " + p.telephone
                : "";

    }


    /*
     * Numéro
     */

    const numero =
        facture.facture ||
        facture.numeroFacture ||
        facture.numero ||
        "FACT-000000";


    el("numeroFacture").textContent =
        numero;


    /*
     * Date
     */

    el("dateFacture").textContent =
        dateLisible(
            facture.date
        );


    /*
     * Patient
     */

    el("patientFacture").textContent =
        facture.patient ||
        "Client comptant";


    /*
     * Paiement
     */

    el("modeFacture").textContent =
        facture.modePaiement ||
        "—";


    /*
     * Utilisateur
     */

    el("utilisateurFacture").textContent =
        facture.utilisateur ||
        facture.pharmacien ||
        "—";


    /*
     * Lignes
     */

    const contenu =
        el("contenuFacture");


    contenu.innerHTML = "";


    const lignes =
        lignesVente(
            facture
        );


    let sousTotal = 0;


    lignes.forEach(
        function (ligne) {

            const quantite =
                Number(
                    ligne.quantite ??
                    ligne.qte ??
                    ligne.quantity ??
                    0
                );


            const prix =
                Number(
                    ligne.prixVente ??
                    ligne.pvu ??
                    ligne.prix ??
                    0
                );


            const total =
                Number(
                    ligne.total ??
                    (
                        quantite * prix
                    )
                );


            sousTotal +=
                total;


            const info =
                nomMedicament(
                    ligne
                );


            const article =
                ligne.article ||
                "";


            const ligneHTML =
                document.createElement(
                    "div"
                );


            ligneHTML.className =
                "invoice-line";


            ligneHTML.innerHTML = `

                <div class="designation">

                    <span class="designation-main">
                        ${echapper(
                            info.principal
                        )}
                    </span>

                    ${
                        info.sousLigne
                        ?
                        `
                        <span class="designation-sub">
                            ${echapper(
                                info.sousLigne
                            )}
                        </span>
                        `
                        :
                        ""
                    }

                    ${
                        article
                        ?
                        `
                        <span class="designation-sub">
                            ${echapper(article)}
                        </span>
                        `
                        :
                        ""
                    }

                </div>


                <div class="center">
                    ${echapper(quantite)}
                </div>


                <div class="right money">
                    ${argent(prix)}
                </div>


                <div class="right money">
                    <strong>
                        ${argent(total)}
                    </strong>
                </div>

            `;


            contenu.appendChild(
                ligneHTML
            );

        }
    );


    const totalFacture =
        totalVente(
            facture
        );


    /*
     * Si le total enregistré existe,
     * il reste prioritaire.
     */

    el("sousTotalFacture").textContent =
        argent(
            sousTotal || totalFacture
        );


    el("totalFacture").textContent =
        argent(
            totalFacture
        );


    /*
     * Ouverture
     */

    const modal =
        el("facture");


    modal.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   FERMER FACTURE
========================================================= */

function fermerFacture() {

    const modal =
        el("facture");


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   IMPRESSION
========================================================= */

function imprimerFacture() {

    if (!factureActuelle) {

        afficherToast(
            "Aucune facture sélectionnée."
        );
return;

    }


    window.print();

}


/* =========================================================
   MENU
========================================================= */

function ouvrirMenu() {

    const sidebar =
        el("sidebar");

    const overlay =
        el("overlay");


    if (sidebar) {

        sidebar.classList.add(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "show"
        );

    }

}


function fermerMenu() {

    const sidebar =
        el("sidebar");

    const overlay =
        el("overlay");


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   DÉCONNEXION
========================================================= */

function deconnexion() {

    try {

        localStorage.removeItem(
            "utilisateurConnecte"
        );

    } catch (e) {

        console.warn(e);

    }


    window.location.href =
        "../index.html";

}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        chargerFactures();


        /*
         * Recherche
         */

        const recherche =
            el("recherche");


        if (recherche) {

            recherche.addEventListener(
                "input",
                afficherFactures
            );

        }


        /*
         * Paiement
         */

        const filtrePaiement =
            el("filtrePaiement");


        if (filtrePaiement) {

            filtrePaiement.addEventListener(
                "change",
                afficherFactures
            );

        }


        /*
         * Date
         */

        const filtreDate =
            el("filtreDate");


        if (filtreDate) {

            filtreDate.addEventListener(
                "change",
                afficherFactures
            );

        }


        /*
         * Actualiser
         */

        const actualiser =
            el("btnActualiser");


        if (actualiser) {

            actualiser.addEventListener(
                "click",
                function () {

                    chargerFactures();

                    afficherToast(
                        "Factures actualisées."
                    );

                }
            );

        }


        /*
         * Fermer facture
         */

        const fermer =
            el("btnFermerFacture");


        if (fermer) {

            fermer.addEventListener(
                "click",
                fermerFacture
            );

        }


        const fermer2 =
            el("btnFermerFacture2");


        if (fermer2) {

            fermer2.addEventListener(
                "click",
                fermerFacture
            );

        }


        /*
         * Imprimer
         */

        const imprimer =
            el("btnImprimer");


        if (imprimer) {

            imprimer.addEventListener(
                "click",
                imprimerFacture
            );

        }


        const imprimer2 =
            el("btnImprimer2");


        if (imprimer2) {

            imprimer2.addEventListener(
                "click",
                imprimerFacture
            );

        }


        /*
         * Menu
         */

        const menu =
            el("btnMenu");


        if (menu) {

            menu.addEventListener(
                "click",
                ouvrirMenu
            );

        }


        const fermerMenuBtn =
            el("btnFermerMenu");


        if (fermerMenuBtn) {

            fermerMenuBtn.addEventListener(
                "click",
                fermerMenu
            );

        }


        const overlay =
            el("overlay");


        if (overlay) {

            overlay.addEventListener(
                "click",
                fermerMenu
            );

        }


        /*
         * Déconnexion
         */

        const logout =
            el("btnDeconnexion");


        if (logout) {

            logout.addEventListener(
                "click",
                deconnexion
            );

        }

    }
);
