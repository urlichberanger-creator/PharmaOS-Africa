// @ts-nocheck

let utilisateurs = [];
let editionId = null;


function el(id) {
    return document.getElementById(id);
}


function lire() {

    try {

        if (window.PharmaDB) {
            return PharmaDB.lire("utilisateurs") || [];
        }

        return JSON.parse(
            localStorage.getItem("utilisateurs") || "[]"
        );

    } catch (e) {

        return [];

    }

}


function enregistrer() {

    try {

        if (window.PharmaDB) {
            PharmaDB.enregistrer(
                "utilisateurs",
                utilisateurs
            );
            return;
        }

        localStorage.setItem(
            "utilisateurs",
            JSON.stringify(utilisateurs)
        );

    } catch (e) {

        console.warn(e);

    }

}


function charger() {

    utilisateurs = lire();

    afficher();

}


function afficher() {

    let recherche =
        String(el("recherche")?.value || "")
            .toLowerCase()
            .trim();

    let role =
        el("filtreRole")?.value || "";

    let statut =
        el("filtreStatut")?.value || "";


    let liste =
        utilisateurs.filter(function (u) {

            let texte =
                (
                    u.nom +
                    " " +
                    u.prenom +
                    " " +
                    u.identifiant +
                    " " +
                    u.role
                )
                .toLowerCase();


            return (
                (!recherche || texte.includes(recherche)) &&
                (!role || u.role === role) &&
                (!statut || u.statut === statut)
            );

        });


    let tbody =
        el("listeUtilisateurs");

    tbody.innerHTML = "";


    liste.forEach(function (u) {

        let tr =
            document.createElement("tr");


        let actif =
            u.statut !== "inactif";


        tr.innerHTML = `

            <td>
                <strong>
                    ${u.nom || ""} ${u.prenom || ""}
                </strong>
            </td>

            <td>
                ${u.identifiant || "-"}
            </td>

            <td>
                ${u.role || "-"}
            </td>

            <td class="${actif ? "status-actif" : "status-inactif"}">
                ${actif ? "Actif" : "Inactif"}
            </td>

            <td>

                <button
                    class="action"
                    onclick="modifierUtilisateur('${u.id}')">
                    Modifier
                </button>

                <button
                    class="action action-danger"
                    onclick="changerStatut('${u.id}')">
                    ${actif ? "Désactiver" : "Activer"}
                </button>

            </td>

        `;


        tbody.appendChild(tr);

    });


    el("compteur").textContent =
        liste.length +
        (liste.length > 1
            ? " utilisateurs"
            : " utilisateur");


    el("etatVide").style.display =
        liste.length ? "none" : "block";


    statistiques();

}


function statistiques() {

    let actifs =
        utilisateurs.filter(
            u => u.statut !== "inactif"
        ).length;


    el("totalUtilisateurs").textContent =
        utilisateurs.length;

    el("totalActifs").textContent =
        actifs;

    el("totalInactifs").textContent =
        utilisateurs.length - actifs;

}


function ouvrirFormulaire() {

    editionId = null;

    el("formulaire").classList.remove("hidden");

    el("formUtilisateur").reset();

    el("role").value = "pharmacien";
    el("statut").value = "actif";

}


function fermerFormulaire() {

    el("formulaire").classList.add("hidden");

    el("formUtilisateur").reset();

    editionId = null;

}


function modifierUtilisateur(id) {

    let u =
        utilisateurs.find(
            x => String(x.id) === String(id)
        );

    if (!u) return;


    editionId = id;

    el("formulaire").classList.remove("hidden");

    el("nom").value =
        u.nom || "";

    el("prenom").value =
        u.prenom || "";

    el("identifiant").value =
        u.identifiant || "";

    el("role").value =
        u.role || "pharmacien";

    el("motDePasse").value =
        u.motDePasse || "";

    el("statut").value =
        u.statut || "actif";

}


function changerStatut(id) {

    let u =
        utilisateurs.find(
            x => String(x.id) === String(id)
        );

    if (!u) return;


    u.statut =
        u.statut === "inactif"
            ? "actif"
            : "inactif";


    enregistrer();

    afficher();

    afficherToast(
        u.statut === "actif"
            ? "Utilisateur activé."
            : "Utilisateur désactivé."
    );

}


function sauvegarder(event) {

    event.preventDefault();


    let nom =
        el("nom").value.trim();

    let prenom =
        el("prenom").value.trim();

    let identifiant =
        el("identifiant").value.trim();

    let motDePasse =
        el("motDePasse").value;

    let role =
        el("role").value;

    let statut =
        el("statut").value;


    if (
        !nom ||
        !prenom ||
        !identifiant ||
        !motDePasse
    ) {

        afficherToast(
            "Veuillez remplir tous les champs."
        );

        return;

    }


    let doublon =
        utilisateurs.some(function (u) {

            return (
                u.identifiant.toLowerCase() ===
                identifiant.toLowerCase() &&

                String(u.id) !==
                String(editionId)
            );

        });


    if (doublon) {

        afficherToast(
            "Cet identifiant existe déjà."
        );

        return;

    }


    if (editionId) {

        let u =
            utilisateurs.find(
                x => String(x.id) === String(editionId)
            );

        if (u) {

            u.nom = nom;
            u.prenom = prenom;
            u.identifiant = identifiant;
            u.role = role;
            u.motDePasse = motDePasse;
            u.statut = statut;

        }

        afficherToast(
            "Utilisateur modifié."
        );

    } else {

        utilisateurs.push({

            id:
                Date.now().toString(),

            nom: nom,

            prenom: prenom,

            identifiant: identifiant,

            role: role,

            motDePasse: motDePasse,

            statut: statut,

            dateCreation:
                new Date().toISOString()

        });


        afficherToast(
            "Utilisateur enregistré."
        );

    }


    enregistrer();

    fermerFormulaire();

    afficher();

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


/* MENU */

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


/* INITIALISATION */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        charger();


        el("btnNouveau")?.addEventListener(
            "click",
            ouvrirFormulaire
        );


        el("btnFermerForm")?.addEventListener(
            "click",
            fermerFormulaire
        );


        el("btnAnnuler")?.addEventListener(
            "click",
            fermerFormulaire
        );


        el("formUtilisateur")?.addEventListener(
            "submit",
            sauvegarder
        );


        el("recherche")?.addEventListener(
            "input",
            afficher
        );


        el("filtreRole")?.addEventListener(
            "change",
            afficher
        );


        el("filtreStatut")?.addEventListener(
            "change",
            afficher
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