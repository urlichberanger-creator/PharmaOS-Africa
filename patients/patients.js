// @ts-nocheck

/* =========================================================
   PharmaOS Africa
   PATIENTS.JS
   Gestion simple et professionnelle des patients
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let patients = [];

let patientEnEdition = null;

let toastTimer = null;


/* =========================================================
   OUTILS
========================================================= */

function el(id) {

    return document.getElementById(id);

}


function lirePatients() {

    try {

        if (
            window.PharmaDB &&
            typeof PharmaDB.lire === "function"
        ) {

            const donnees =
                PharmaDB.lire("patients");

            return Array.isArray(donnees)
                ? donnees
                : [];

        }

    } catch (erreur) {

        console.warn(
            "PharmaDB patients:",
            erreur
        );

    }


    try {

        const donnees =
            JSON.parse(
                localStorage.getItem(
                    "patients"
                ) || "[]"
            );

        return Array.isArray(donnees)
            ? donnees
            : [];

    } catch (erreur) {

        console.warn(
            erreur
        );

        return [];

    }

}


function enregistrerPatients() {

    try {

        if (
            window.PharmaDB &&
            typeof PharmaDB.enregistrer === "function"
        ) {

            PharmaDB.enregistrer(
                "patients",
                patients
            );

            return true;

        }

    } catch (erreur) {

        console.warn(
            "PharmaDB patients:",
            erreur
        );

    }


    try {

        localStorage.setItem(
            "patients",
            JSON.stringify(
                patients
            )
        );

        return true;

    } catch (erreur) {

        console.warn(
            erreur
        );

        return false;

    }

}


function escapeHTML(texte) {

    return String(
        texte ?? ""
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
   CODE PATIENT
========================================================= */

function genererCodePatient() {

    let maximum = 0;


    patients.forEach(
        function (patient) {

            const code =
                String(
                    patient.code ||
                    patient.id ||
                    ""
                );


            const resultat =
                code.match(
                    /(\d+)$/
                );


            if (resultat) {

                maximum =
                    Math.max(
                        maximum,
                        Number(
                            resultat[1]
                        )
                    );

            }

        }
    );


    return (
        "PAT" +
        String(
            maximum + 1
        ).padStart(
            5,
            "0"
        )
    );

}


/* =========================================================
   NOM COMPLET
========================================================= */

function nomComplet(patient) {

    return [

        patient.nom,

        patient.prenom

    ]
        .filter(
            Boolean
        )
        .join(" ")
        .trim();

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formaterDate(date) {

    if (!date) {

        return "—";

    }


    const valeur =
        String(
            date
        );


    const morceaux =
        valeur.split("-");


    if (
        morceaux.length === 3
    ) {

        return (
            morceaux[2] +
            "/" +
            morceaux[1] +
            "/" +
            morceaux[0]
        );

    }


    return valeur;

}


/* =========================================================
   TOAST
========================================================= */

function afficherToast(message) {

    const toast =
        el("toast");

    const texte =
        el("toastMessage");


    if (
        !toast ||
        !texte
    ) {

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
   CHARGER PATIENTS
========================================================= */

function chargerPatients() {

    patients =
        lirePatients();

}


/* =========================================================
   AFFICHER PATIENTS
========================================================= */

function afficherPatients() {

    const liste =
        el("listePatients");


    if (!liste) {

        return;

    }


    liste.innerHTML = "";


    const recherche =
        String(
            el("recherchePatient")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const patientsFiltres =
        patients.filter(
            function (patient) {

                if (!recherche) {

                    return true;

                }


                const texte =
                    [

                        patient.code,

                        patient.nom,

                        patient.prenom,

                        patient.telephone,

                        patient.adresse

                    ]
                        .join(" ")
                        .toLowerCase();


                return texte.includes(
                    recherche
                );

            }
        );


    patientsFiltres.forEach(
        function (patient) {

            const ligne =
                document.createElement(
                    "tr"
                );


            ligne.innerHTML =

                "<td>" +

                    escapeHTML(
                        patient.code ||
                        patient.id ||
                        "—"
                    ) +

                "</td>" +


                "<td>" +

                    "<strong>" +

                    escapeHTML(
                        nomComplet(
                            patient
                        ) ||
                        "Patient"
                    ) +

                    "</strong>" +

                "</td>" +


                "<td>" +

                    escapeHTML(
                        patient.sexe ||
                        "—"
                    ) +

                "</td>" +


                "<td>" +

                    escapeHTML(
                        patient.telephone ||
                        "—"
                    ) +

                "</td>" +


                "<td>" +

                    escapeHTML(
                        formaterDate(
                            patient.dateNaissance
                        )
                    ) +

                "</td>" +


                "<td>" +

                    escapeHTML(
                        formaterDate(
                            patient.derniereVisite
                        )
                    ) +

                "</td>";


            liste.appendChild(
                ligne
            );

        }
    );


    const compteur =
        el("compteur");


    if (compteur) {

        compteur.textContent =

            patientsFiltres.length +

            (
                patientsFiltres.length > 1
                    ? " patients"
                    : " patient"
            );

    }


    const etatVide =
        el("etatVide");


    if (etatVide) {

        if (
            patientsFiltres.length === 0
        ) {

            etatVide.classList.add(
                "show"
            );

        }

        else {

            etatVide.classList.remove(
                "show"
            );

        }

    }

}


/* =========================================================
   OUVRIR FORMULAIRE
========================================================= */

function ouvrirFormulaire() {

    const formulaire =
        el("formulairePatient");


    if (!formulaire) {

        return;

    }


    formulaire.classList.add(
        "show"
    );


    const titre =
        formulaire.querySelector(
            "h2"
        );


    if (titre) {

        titre.textContent =
            patientEnEdition
                ? "Modifier le patient"
                : "Nouveau patient";

    }


    el("nom")?.focus();

}


/* =========================================================
   FERMER FORMULAIRE
========================================================= */

function fermerFormulaire() {

    const formulaire =
        el("formulairePatient");


    if (formulaire) {

        formulaire.classList.remove(
            "show"
        );

    }


    patientEnEdition =
        null;


    const form =
        el("formPatient");


    if (form) {

        form.reset();

    }


    const titre =
        formulaire?.querySelector(
            "h2"
        );


    if (titre) {

        titre.textContent =
            "Nouveau patient";

    }

}


/* =========================================================
   ENREGISTRER PATIENT
========================================================= */

function enregistrerPatient(event) {

    event.preventDefault();


    const nom =
        el("nom")?.value
            .trim();


    const prenom =
        el("prenom")?.value
            .trim();


    if (
        !nom ||
        !prenom
    ) {

        afficherToast(
            "Veuillez saisir le nom et le prénom."
        );

        return;

    }


    const donnees = {

        nom: nom,

        prenom: prenom,

        sexe:
            el("sexe")?.value ||
            "",

        dateNaissance:
            el("dateNaissance")?.value ||
            "",

        telephone:
            el("telephone")?.value
                .trim() ||
            "",

        adresse:
            el("adresse")?.value
                .trim() ||
            "",

        allergies:
            el("allergies")?.value
                .trim() ||
            "",

        antecedents:
            el("antecedents")?.value
                .trim() ||
            ""

    };


    /* =====================================================
       MODIFICATION
    ===================================================== */

    if (
        patientEnEdition
    ) {

        const index =
            patients.findIndex(
                function (patient) {

                    return (
                        patient.id ===
                        patientEnEdition
                    );

                }
            );


        if (
            index !== -1
        ) {

            patients[index] = {

                ...patients[index],

                ...donnees,

                dateModification:
                    new Date()
                        .toISOString()

            };

        }

    }


    /* =====================================================
       NOUVEAU PATIENT
    ===================================================== */

    else {

        const maintenant =
            new Date()
                .toISOString();


        patients.push({

            id:
                "PAT-" +
                Date.now(),

            code:
                genererCodePatient(),

            ...donnees,

            derniereVisite: "",

            dateCreation:
                maintenant,

            dateModification:
                maintenant

        });

    }


    if (
        !enregistrerPatients()
    ) {

        afficherToast(
            "Impossible d'enregistrer le patient."
        );

        return;

    }


    afficherPatients();


    fermerFormulaire();


    afficherToast(
        patientEnEdition
            ? "Patient modifié."
            : "Patient enregistré."
    );

}


/* =========================================================
   MENU MOBILE
========================================================= */

function ouvrirMenu() {

    el("sidebar")?.classList.add(
        "open"
    );

    el("overlay")?.classList.add(
        "show"
    );

}


function fermerMenu() {

    el("sidebar")?.classList.remove(
        "open"
    );

    el("overlay")?.classList.remove(
        "show"
    );

}


/* =========================================================
   DÉCONNEXION
========================================================= */

function deconnexion() {

    try {

        localStorage.removeItem(
            "utilisateurConnecte"
        );

    } catch (erreur) {

        console.warn(
            erreur
        );

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

        chargerPatients();


        /* ================================================
           NOUVEAU
        ================================================= */

        el("btnNouveau")
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    patientEnEdition =
                        null;

                    ouvrirFormulaire();

                }
            );


        /* ================================================
           FERMER
        ================================================= */

        el("btnFermerForm")
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    fermerFormulaire();

                }
            );


        el("btnAnnuler")
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    fermerFormulaire();

                }
            );


        /* ================================================
           FORMULAIRE
        ================================================= */

        el("formPatient")
            ?.addEventListener(
                "submit",
                enregistrerPatient
            );


        /* ================================================
           RECHERCHE
        ================================================= */

        el("recherchePatient")
            ?.addEventListener(
                "input",
                function () {

                    afficherPatients();

                }
            );


        /* ================================================
           MENU
        ================================================= */

        el("btnMenu")
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    ouvrirMenu();

                }
            );


        el("btnFermerMenu")
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    fermerMenu();

                }
            );


        el("overlay")
            ?.addEventListener(
                "click",
                function () {

                    fermerMenu();

                }
            );


        /* ================================================
           DÉCONNEXION
        ================================================= */

        el("btnDeconnexion")
            ?.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    deconnexion();

                }
            );


        /* ================================================
           AFFICHAGE INITIAL
        ================================================= */

        afficherPatients();

    }
);