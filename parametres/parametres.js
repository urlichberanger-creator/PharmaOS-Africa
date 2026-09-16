// @ts-nocheck

let parametres = {};


function el(id) {
    return document.getElementById(id);
}


function charger() {

    try {

        parametres =
            JSON.parse(
                localStorage.getItem("parametres") || "{}"
            );

    } catch (e) {

        parametres = {};

    }


    el("nomPharmacie").value =
        parametres.nomPharmacie || "";

    el("telephone").value =
        parametres.telephone || "";

    el("adresse").value =
        parametres.adresse || "";

    el("ville").value =
        parametres.ville || "";

    el("devise").value =
        parametres.devise || "BIF";

    el("decimales").value =
        parametres.decimales ?? "0";

    el("stockMinimum").value =
        parametres.stockMinimum ?? "10";

    el("alerteExpiration").value =
        parametres.alerteExpiration || "30";

    el("prefixeFacture").value =
        parametres.prefixeFacture || "FACT";

    el("afficherPharmaOS").value =
        parametres.afficherPharmaOS || "oui";

    el("afficherTelephone").value =
        parametres.afficherTelephone || "oui";

    el("formatFacture").value =
        parametres.formatFacture || "A4";

}


function sauvegarder(event) {

    event.preventDefault();


    parametres = {

        nomPharmacie:
            el("nomPharmacie").value.trim(),

        telephone:
            el("telephone").value.trim(),

        adresse:
            el("adresse").value.trim(),

        ville:
            el("ville").value.trim(),

        devise:
            el("devise").value,

        decimales:
            Number(el("decimales").value),

        stockMinimum:
            Number(el("stockMinimum").value),

        alerteExpiration:
            Number(el("alerteExpiration").value),

        prefixeFacture:
            el("prefixeFacture").value
                .trim()
                .toUpperCase(),

        afficherPharmaOS:
            el("afficherPharmaOS").value,

        afficherTelephone:
            el("afficherTelephone").value,

        formatFacture:
            el("formatFacture").value

    };


    localStorage.setItem(
        "parametres",
        JSON.stringify(parametres)
    );


    afficherToast(
        "Paramètres enregistrés."
    );

}


function afficherToast(message) {

    let toast = el("toast");
    let texte = el("toastMessage");

    if (!toast || !texte) return;

    texte.textContent = message;

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


        el("formParametres")?.addEventListener(
            "submit",
            sauvegarder
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