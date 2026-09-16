// @ts-nocheck

let mouvements = [];

const FORMES = {
    "comprimé": "Cp",
    "comprime": "Cp",
    "comprimés": "Cp",
    "gélule": "Gél",
    "gelule": "Gél",
    "sirop": "Sir",
    "solution injectable": "Sol inj",
    "solution buvable": "Sol buv",
    "suspension buvable": "Sp buv",
    "crème": "Cr",
    "creme": "Cr",
    "pommade": "Pomm",
    "gel": "Gel",
    "ovule": "Ov",
    "suppositoire": "Supp"
};


function el(id) {
    return document.getElementById(id);
}


function lire(cle) {

    try {

        if (window.PharmaDB) {
            return PharmaDB.lire(cle) || [];
        }

        return JSON.parse(
            localStorage.getItem(cle) || "[]"
        );

    } catch (e) {

        return [];

    }

}


function forme(f) {

    if (!f) return "";

    return FORMES[
        String(f).toLowerCase().trim()
    ] || f;

}


function nomMedic(m) {

    if (!m) return "Médicament";

    let dci =
        m.dci ||
        m.nom ||
        m.medicament ||
        "";

    let commercial =
        m.nomCommercial ||
        m.commercial ||
        "";

    let f =
        forme(
            m.forme ||
            m.formePharmaceutique
        );

    let dosage =
        m.dosage || "";

    let texte = dci;

    if (commercial) {
        texte +=
            (texte ? " " : "") +
            commercial +
            "®";
    }

    if (f) {
        texte +=
            (texte ? " " : "") +
            f;
    }

    if (dosage) {
        texte +=
            (f ? " " : " ") +
            dosage;
    }

    return texte || "Médicament";
}


function charger() {

    let achats =
        lire("achats");

    let ventes =
        lire("ventes");

    mouvements = [];


    /* ACHATS = ENTRÉES */

    achats.forEach(function (a) {

        mouvements.push({

            date:
                a.date ||
                a.dateAchat ||
                "",

            type: "ENTRÉE",

            medicament:
                a.medicament ||
                a.nomMedic ||
                "Médicament",

            lot:
                a.lot || "-",

            quantite:
                Number(
                    a.quantite ||
                    a.quantity ||
                    0
                ),

            prix:
                Number(
                    a.prixAchat ||
                    a.pau ||
                    0
                ),

            origine:
                a.fournisseur ||
                "Réception",

            reference:
                a.id ||
                a.reference ||
                "ACHAT"

        });

    });


    /* VENTES = SORTIES */

    ventes.forEach(function (v) {

        let lignes =
            v.lignes ||
            v.produits ||
            v.panier;


        if (Array.isArray(lignes)) {

            lignes.forEach(function (l) {

                mouvements.push({

                    date:
                        v.date ||
                        v.dateVente ||
                        "",

                    type: "SORTIE",

                    medicament:
                        l.medicament ||
                        l.nomMedic ||
                        "Médicament",

                    lot:
                        l.lot || "-",

                    quantite:
                        Number(
                            l.quantite ||
                            l.quantity ||
                            0
                        ),

                    prix:
                        Number(
                            l.prixVente ||
                            l.pvu ||
                            0
                        ),

                    origine:
                        v.patient ||
                        "Vente",

                    reference:
                        v.numeroFacture ||
                        v.reference ||
                        "VENTE"

                });

            });

        } else {

            mouvements.push({

                date:
                    v.date ||
                    v.dateVente ||
                    "",

                type: "SORTIE",

                medicament:
                    v.medicament ||
                    "Médicament",

                lot:
                    v.lot || "-",

                quantite:
                    Number(
                        v.quantite ||
                        v.quantity ||
                        0
                    ),

                prix:
                    Number(
                        v.prixVente ||
                        v.pvu ||
                        0
                    ),

                origine:
                    v.patient ||
                    "Vente",

                reference:
                    v.numeroFacture ||
                    v.reference ||
                    "VENTE"

            });

        }

    });


    mouvements.sort(function (a, b) {

        return String(b.date)
            .localeCompare(
                String(a.date)
            );

    });

}


function argent(n) {

    return Number(n || 0)
        .toLocaleString("fr-FR") +
        " BIF";

}


function afficher() {

    let recherche =
        String(
            el("recherche")?.value || ""
        )
        .toLowerCase()
        .trim();

    let type =
        el("filtreType")?.value || "";


    let liste =
        mouvements.filter(function (m) {

            let texte =
                (
                    m.medicament +
                    " " +
                    m.lot +
                    " " +
                    m.origine +
                    " " +
                    m.reference
                )
                .toLowerCase();


            return (
                (!recherche ||
                    texte.includes(recherche))

                &&

                (!type ||
                    m.type === type)
            );

        });


    let tbody =
        el("listeHistorique");

    if (!tbody) return;

    tbody.innerHTML = "";


    liste.forEach(function (m) {

        let tr =
            document.createElement("tr");


        let classe =
            m.type === "ENTRÉE"
                ? "type-entree"
                : "type-sortie";


        tr.innerHTML = `

            <td>${m.date || "-"}</td>

            <td class="${classe}">
                ${m.type}
            </td>

            <td class="medicament-cell">
                <strong>
                    ${m.medicament}
                </strong>
            </td>

            <td>
                ${m.lot}
            </td>

            <td>
                ${m.quantite}
            </td>

            <td>
                ${argent(m.prix)}
            </td>

            <td>
                ${m.origine}
            </td>

            <td>
                ${m.reference}
            </td>

        `;

        tbody.appendChild(tr);

    });


    el("compteur").textContent =
        liste.length +
        (
            liste.length > 1
                ? " mouvements"
                : " mouvement"
        );


    el("etatVide").style.display =
        liste.length
            ? "none"
            : "block";


    statistiques(liste);

}


function statistiques(liste) {

    let entrees =
        mouvements.filter(
            m => m.type === "ENTRÉE"
        );

    let sorties =
        mouvements.filter(
            m => m.type === "SORTIE"
        );


    el("totalEntrees").textContent =
        entrees.length;

    el("totalSorties").textContent =
        sorties.length;


    el("quantiteEntree").textContent =
        entrees.reduce(
            (s, m) =>
                s + Number(m.quantite || 0),
            0
        );


    el("quantiteSortie").textContent =
        sorties.reduce(
            (s, m) =>
                s + Number(m.quantite || 0),
            0
        );

}


function afficherToast(message) {

    let toast =
        el("toast");

    let texte =
        el("toastMessage");

    if (!toast || !texte) return;

    texte.textContent =
        message;

    toast.classList.add("show");

    setTimeout(function () {

        toast.classList.remove("show");

    }, 2200);

}


/* ================================
   MENU
================================ */

function ouvrirMenu() {

    el("sidebar")?.classList.add("open");
    el("overlay")?.classList.add("show");

}


function fermerMenu() {

    el("sidebar")?.classList.remove("open");
    el("overlay")?.classList.remove("show");

}


function deconnexion() {

    localStorage.removeItem(
        "utilisateurConnecte"
    );

    window.location.href =
        "../index.html";

}


/* ================================
   INITIALISATION
================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        charger();

        afficher();


        el("recherche")?.addEventListener(
            "input",
            afficher
        );


        el("filtreType")?.addEventListener(
            "change",
            afficher
        );


        el("btnReset")?.addEventListener(
            "click",
            function () {

                el("recherche").value = "";
                el("filtreType").value = "";

                afficher();

            }
        );


        el("btnActualiser")?.addEventListener(
            "click",
            function () {

                charger();

                afficher();

                afficherToast(
                    "Historique actualisé."
                );

            }
        );


        el("btnMenu")?.addEventListener(
            "click",
            ouvrirMenu
        );


        el("btnFermerMenu")?.addEventListener(
            "click",
            fermerMenu
        );


        el("overlay")?.addEventListener(
            "click",
            fermerMenu
        );


        el("btnDeconnexion")?.addEventListener(
            "click",
            function (e) {

                e.preventDefault();

                deconnexion();

            }
        );

    }
);