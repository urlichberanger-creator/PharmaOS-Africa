// @ts-nocheck
"use strict";

/* =========================================================
   PHARMAOS AFRICA — MEDICAMENTS.JS
   Version courte — recherche + suggestions + filtres + tri
========================================================= */

const CLE_SUGGESTIONS = "pharmaos_suggestions_medicaments_v3";

const REFERENTIEL = {
    dci: [
        "Paracétamol","Ibuprofène","Acide acétylsalicylique",
        "Diclofénac","Amoxicilline","Amoxicilline + acide clavulanique",
        "Céftriaxone","Azithromycine","Métronidazole","Acyclovir",
        "Artéméther","Luméfantrine","Metformine","Amlodipine",
        "Losartan","Oméprazole","Salbutamol","Prednisolone",
        "Doxycycline","Ciprofloxacine","Fluconazole","Fer",
        "Acide folique","Vitamine C","Vitamine D","Zinc","Calcium"
    ],

    forme: [
        "Comprimé","Comprimé pelliculé","Comprimé LP",
        "Gélule","Capsule","Poudre orale",
        "Solution buvable","Suspension buvable","Sirop",
        "Gouttes buvables","Solution injectable","Suspension injectable",
        "Solution pour perfusion","Crème","Pommade","Gel","Lotion",
        "Collyre","Solution ophtalmique","Gouttes auriculaires",
        "Spray nasal","Aérosol-doseur","Solution pour inhalation",
        "Suppositoire","Ovule","Patch transdermique","Autre"
    ],

    dosage: [
        "1 mg","2 mg","2,5 mg","5 mg","10 mg","20 mg","25 mg",
        "50 mg","75 mg","100 mg","150 mg","200 mg","250 mg",
        "300 mg","400 mg","500 mg","600 mg","750 mg","800 mg",
        "1000 mg","1 g","2 g","50 mg/5 mL","100 mg/5 mL",
        "125 mg/5 mL","200 mg/5 mL","250 mg/5 mL","400 mg/5 mL",
        "500 mg/5 mL","1 %","2 %","5 %","10 %"
    ],

    voie: [
        "Voie orale","Voie sublinguale","Voie buccale",
        "Voie intraveineuse","Voie intramusculaire",
        "Voie sous-cutanée","Voie intradermique",
        "Voie cutanée","Voie ophtalmique","Voie auriculaire",
        "Voie nasale","Voie inhalée","Voie rectale","Voie vaginale",
        "Autre"
    ],

    conditionnement: [
        "B/1×10 Cp","B/2×10 Cp","B/3×10 Cp","B/5×10 Cp",
        "B/10×10 Cp","B/1×14 Cp","B/1×20 Cp","B/1×30 Cp",
        "B/1×50 Cp","B/1×100 Cp","B/1×10 Gél","B/2×10 Gél",
        "B/10×10 Gél","B/1fl/60 mL","B/1fl/100 mL",
        "B/1fl/120 mL","B/5 Amp/2 mL","B/10 Amp/2 mL",
        "B/100 Amp/2 mL","B/1 Tube/10 g","B/1 Tube/30 g",
        "B/1 Tube/50 g","B/10 Sachets","B/1 Spray","B/1 Patch",
        "Vrac","Autre"
    ],

    classe: [
        "Antalgique","Antipyrétique","Anti-inflammatoire",
        "Antibiotique","Antipaludique","Antiparasitaire",
        "Antifongique","Antiviral","Antiseptique",
        "Antihypertenseur","Antidiabétique","Hypolipémiant",
        "Diurétique","Antiulcéreux","Antiémétique",
        "Antihistaminique","Bronchodilatateur","Corticoïde",
        "Anticoagulant","Antiépileptique","Vitamine","Minéral","Autre"
    ]
};

const ALIAS = {
    cp:"Comprimé",
    cpr:"Comprimé",
    comp:"Comprimé",
    gel:"Gélule",
    gél:"Gélule",
    inj:"Solution injectable",
    sol:"Solution buvable",
    susp:"Suspension buvable",
    sir:"Sirop",
    crm:"Crème",
    pomm:"Pommade",
    col:"Collyre",
    supp:"Suppositoire",
    ov:"Ovule",
    iv:"Voie intraveineuse",
    im:"Voie intramusculaire",
    sc:"Voie sous-cutanée",
    po:"Voie orale",
    oral:"Voie orale"
};

function el(id) {
    return document.getElementById(id);
}

function normaliser(v) {
    return String(v || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .replace(/[’']/g," ")
        .replace(/[-_/]+/g," ")
        .replace(/\s+/g," ")
        .trim();
}

function propre(v) {
    return String(v || "").replace(/\s+/g," ").trim();
}

function unique(arr) {
    const r = [];
    const vu = {};
    arr.forEach(function(v) {
        v = propre(v);
        const k = normaliser(v);
        if (v && !vu[k]) {
            vu[k] = true;
            r.push(v);
        }
    });
    return r;
}

function escapeHTML(v) {
    return String(v || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;");
}

function suggestionsPerso() {
    try {
        return JSON.parse(
            localStorage.getItem(CLE_SUGGESTIONS) || "{}"
        );
    } catch(e) {
        return {};
    }
}

function ajouterSuggestion(type,valeur) {
    valeur = propre(valeur);
    if (!valeur) return;

    const s = suggestionsPerso();
    s[type] = Array.isArray(s[type]) ? s[type] : [];

    if (!s[type].some(function(v) {
        return normaliser(v) === normaliser(valeur);
    })) {
        s[type].push(valeur);
        localStorage.setItem(
            CLE_SUGGESTIONS,
            JSON.stringify(s)
        );
    }
}

function referentiel(type) {
    const s = suggestionsPerso();
    return unique(
        (REFERENTIEL[type] || []).concat(
            Array.isArray(s[type]) ? s[type] : []
        )
    );
}

/* =========================================================
   SUGGESTIONS STRICTES
========================================================= */

function correspondances(type,recherche) {
    const q = normaliser(recherche);
    if (!q) return referentiel(type).slice(0,12);

    const alias = [];
    Object.keys(ALIAS).forEach(function(a) {
        if (normaliser(a).startsWith(q)) {
            alias.push(ALIAS[a]);
        }
    });

    const resultats = referentiel(type).filter(function(v) {
        const n = normaliser(v);
        return n.startsWith(q) ||
            n.split(" ").some(function(m) {
                return m.startsWith(q);
            });
    });

    return unique(alias.concat(resultats))
        .sort(function(a,b) {
            const na = normaliser(a);
            const nb = normaliser(b);
            return (
                (na.startsWith(q) ? 0 : 1) -
                (nb.startsWith(q) ? 0 : 1)
            ) || na.localeCompare(nb);
        })
        .slice(0,12);
}

function afficherSuggestions(type,input,box) {
    if (!input || !box) return;

    const q = propre(input.value);
    const resultats = correspondances(type,q);

    box.innerHTML = "";

    resultats.forEach(function(v) {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.innerHTML =
            '<div class="suggestion-main">' +
            escapeHTML(v) +
            '</div>';

        item.addEventListener("mousedown",function(e) {
            e.preventDefault();
            input.value = v;
            ajouterSuggestion(type,v);
            box.classList.remove("show");
        });

        box.appendChild(item);
    });

    if (q && !resultats.some(function(v) {
        return normaliser(v) === normaliser(q);
    })) {
        const item = document.createElement("div");
        item.className =
            "suggestion-item suggestion-custom";
        item.innerHTML =
            '<div class="suggestion-main">Utiliser : "' +
            escapeHTML(q) +
            '"</div>' +
            '<div class="suggestion-meta">Nouvelle valeur</div>';

        item.addEventListener("mousedown",function(e) {
            e.preventDefault();
            input.value = q;
            ajouterSuggestion(type,q);
            box.classList.remove("show");
        });

        box.appendChild(item);
    }

    box.classList.toggle("show",box.children.length > 0);
}

function champIntelligent(inputId,boxId,type) {
    const input = el(inputId);
    const box = el(boxId);
    if (!input || !box) return;

    input.addEventListener("input",function() {
        afficherSuggestions(type,input,box);
    });

    input.addEventListener("focus",function() {
        afficherSuggestions(type,input,box);
    });

    input.addEventListener("blur",function() {
        setTimeout(function() {
            box.classList.remove("show");
        },150);

        if (input.value.trim()) {
            ajouterSuggestion(type,input.value);
        }
    });
}

/* =========================================================
   BASE MÉDICAMENTS
========================================================= */

function lireMedicaments() {
    try {
        if (window.PharmaDB &&
            typeof PharmaDB.lire === "function") {
            const d = PharmaDB.lire("medicaments");
            if (Array.isArray(d)) return d;
        }
    } catch(e) {}

    try {
        return JSON.parse(
            localStorage.getItem("medicaments") || "[]"
        );
    } catch(e) {
        return [];
    }
}

function enregistrerMedicaments(data) {
    try {
        if (window.PharmaDB &&
            typeof PharmaDB.enregistrer === "function") {
            PharmaDB.enregistrer("medicaments",data);
            return;
        }
    } catch(e) {}

    localStorage.setItem(
        "medicaments",
        JSON.stringify(data)
    );
}

function genererCodeArticle() {
    let max = 0;

    lireMedicaments().forEach(function(m) {
        const x = String(m.codeArticle || "")
            .match(/^ART(\d+)$/i);

        if (x) max = Math.max(max,parseInt(x[1],10));
    });

    return "ART" +
        String(max + 1).padStart(5,"0");
}

/* =========================================================
   FILTRES PROFESSIONNELS
========================================================= */

let tri = {
    champ:"dci",
    ordre:1
};

function creerFiltres() {
    const table = document.querySelector(".table-container");
    const recherche = el("recherche");

    if (!table || !recherche || el("filtresMedicaments")) return;

    const zone = document.createElement("div");
    zone.id = "filtresMedicaments";
    zone.className = "search-box";

    zone.innerHTML =
        '<select id="filtreForme">' +
        '<option value="">Toutes les formes</option>' +
        '</select>' +

        '<select id="filtreLaboratoire">' +
        '<option value="">Tous les laboratoires</option>' +
        '</select>' +

        '<select id="filtreClasse">' +
        '<option value="">Toutes les classes</option>' +
        '</select>' +

        '<button type="button" id="btnResetFiltres">' +
        'Réinitialiser</button>';

    table.parentNode.insertBefore(zone, table);

    remplirFiltre("filtreForme", "forme");
    remplirFiltre("filtreLaboratoire", "laboratoire");
    remplirFiltre("filtreClasse", "classeTherapeutique");

    recherche.addEventListener(
        "input",
        afficherMedicaments
    );

    ["filtreForme", "filtreLaboratoire", "filtreClasse"]
        .forEach(function(id) {
            const champ = el(id);
            if (champ) {
                champ.addEventListener(
                    "change",
                    afficherMedicaments
                );
            }
        });

    const reset = el("btnResetFiltres");

    if (reset) {
        reset.addEventListener("click", function() {

            recherche.value = "";

            el("filtreForme").value = "";
            el("filtreLaboratoire").value = "";
            el("filtreClasse").value = "";

            afficherMedicaments();
        });
    }
}

function remplirFiltre(id, champ) {

    const select = el(id);

    if (!select) return;

    const ancienneValeur = select.value;

    select.innerHTML = "";

    const option = document.createElement("option");

    option.value = "";
    option.textContent =
        champ === "forme"
            ? "Toutes les formes"
            : champ === "laboratoire"
                ? "Tous les laboratoires"
                : "Toutes les classes";

    select.appendChild(option);

    const valeurs = unique(
        lireMedicaments().map(function(medicament) {
            return medicament[champ];
        })
    ).sort(function(a, b) {
        return normaliser(a).localeCompare(
            normaliser(b),
            "fr"
        );
    });

    valeurs.forEach(function(valeur) {

        const option = document.createElement("option");

        option.value = valeur;
        option.textContent = valeur;

        select.appendChild(option);
    });

    if (
        ancienneValeur &&
        valeurs.some(function(valeur) {
            return normaliser(valeur) ===
                   normaliser(ancienneValeur);
        })
    ) {
        select.value = ancienneValeur;
    }
}
/* =========================================================
   AFFICHAGE + TRI
========================================================= */

function afficherMedicaments() {
    const liste = el("listeMedicaments");
    if (!liste) return;

    let data = lireMedicaments();

    const q = normaliser(
        el("recherche") ? el("recherche").value : ""
    );

    const forme = el("filtreForme")
        ? normaliser(el("filtreForme").value) : "";

    const labo = el("filtreLaboratoire")
        ? normaliser(el("filtreLaboratoire").value) : "";

    const classe = el("filtreClasse")
        ? normaliser(el("filtreClasse").value) : "";

    data = data.filter(function(m) {
        const texte = normaliser([
            m.codeArticle,m.dci,m.nomCommercial,m.forme,
            m.dosage,m.voie,m.conditionnement,
            m.laboratoire,m.classeTherapeutique
        ].join(" "));

        return (!q || texte.includes(q)) &&
            (!forme || normaliser(m.forme) === forme) &&
            (!labo || normaliser(m.laboratoire) === labo) &&
            (!classe || normaliser(m.classeTherapeutique) === classe);
    });

    data.sort(function(a,b) {
        let va = a[tri.champ] || "";
        let vb = b[tri.champ] || "";

        return tri.ordre *
            String(va).localeCompare(String(vb),"fr",{
                numeric:true,
                sensitivity:"base"
            });
    });

    liste.innerHTML = "";

    data.forEach(function(m) {
        const tr = document.createElement("tr");

        const dci = escapeHTML(m.dci || "—");
        const commercial = m.nomCommercial
            ? "<br><small>" +
              escapeHTML(m.nomCommercial) +
              "®</small>"
            : "";

        tr.innerHTML =
            "<td><span class=\"article-code\">" +
            escapeHTML(m.codeArticle || "—") +
            "</span></td>" +

            "<td><div class=\"medicine-name\">" +
            dci + commercial +
            "</div></td>" +

            "<td>" +escapeHTML(formeProfessionnelle(m.forme))+ "</td>" +
            "<td>" + escapeHTML(m.dosage || "—") + "</td>" +
            "<td>" + escapeHTML(m.conditionnement || "—") + "</td>" +
            "<td>" + escapeHTML(m.laboratoire || "—") + "</td>";

        liste.appendChild(tr);
    });

    const compteur = el("compteurMedicaments");
    if (compteur) {
        compteur.textContent =
            data.length +
            (data.length > 1 ? " médicaments" : " médicament");
    }

    const vide = el("etatVide");
    if (vide) vide.classList.toggle("show",data.length === 0);
}

function activerTri() {
    document.querySelectorAll("thead th").forEach(function(th,i) {
        th.style.cursor = "pointer";
        th.title = "Trier";

        th.addEventListener("click",function() {
            const champs = [
                "codeArticle",
                "dci",
                "forme",
                "dosage",
                "conditionnement",
                "laboratoire"
            ];

            if (tri.champ === champs[i]) {
                tri.ordre *= -1;
            } else {
                tri.champ = champs[i];
                tri.ordre = 1;
            }

            afficherMedicaments();
        });
    });
}

/* =========================================================
   FORMULAIRE
========================================================= */

function ouvrirFormulaire() {
    const f = el("formSection");
    if (f) {
        f.classList.remove("hidden");
        window.scrollTo({top:0,behavior:"smooth"});
    }
}

function fermerFormulaire() {
    const f = el("formSection");
    const form = el("formMedicament");

    if (form) form.reset();
    if (f) f.classList.add("hidden");

    document.querySelectorAll(".suggestions")
        .forEach(function(x) {
            x.classList.remove("show");
        });
}

function enregistrerMedicament(e) {
    e.preventDefault();

    const get = function(id) {
        const x = el(id);
        return x ? propre(x.value) : "";
    };

    const dci = get("dci");
    const commercial = get("nomCommercial");

    if (!dci && !commercial) {
        afficherToast("Saisissez la DCI ou le nom commercial.");
        return;
    }

    const data = lireMedicaments();

    const codeBarre = get("codeBarre");

    if (codeBarre && data.some(function(m) {
        return String(m.codeBarre || "") === codeBarre;
    })) {
        afficherToast("Ce code-barres existe déjà.");
        return;
    }

    const nouveau = {
        id:Date.now().toString(),
        codeArticle:genererCodeArticle(),
        codeBarre:codeBarre,
        dci:dci,
        nomCommercial:commercial,
        forme:get("forme"),
        dosage:get("dosage"),
        voie:get("voie"),
        conditionnement:get("conditionnement"),
        laboratoire:get("laboratoire"),
        classeTherapeutique:get("classeTherapeutique"),
        informations:get("informations"),
        actif:true,
        dateCreation:new Date().toISOString()
    };

    data.push(nouveau);
    enregistrerMedicaments(data);

remplirFiltre("filtreForme", "forme");
remplirFiltre("filtreLaboratoire", "laboratoire");
remplirFiltre("filtreClasse", "classeTherapeutique");

afficherMedicaments();

    fermerFormulaire();
    afficherToast("Médicament enregistré.");
}

/* =========================================================
   TOAST + MENU
========================================================= */

let toastTimer = null;

function afficherToast(message) {
    const toast = el("toast");
    const texte = el("toastMessage");

    if (!toast || !texte) return;

    texte.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function() {
        toast.classList.remove("show");
    },2500);
}

function ouvrirMenu() {
    if (el("sidebar")) el("sidebar").classList.add("open");
    if (el("overlay")) el("overlay").classList.add("show");
}

function fermerMenu() {
    if (el("sidebar")) el("sidebar").classList.remove("open");
    if (el("overlay")) el("overlay").classList.remove("show");
}

function deconnexion() {
    localStorage.removeItem("utilisateurConnecte");
    window.location.href = "../index.html";
}

/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded",function() {

    creerFiltres();

    champIntelligent("dci","suggestionsDci","dci");
    champIntelligent("forme","suggestionsForme","forme");
    champIntelligent("dosage","suggestionsDosage","dosage");
    champIntelligent("voie","suggestionsVoie","voie");
    champIntelligent(
        "conditionnement",
        "suggestionsConditionnement",
        "conditionnement"
    );
    champIntelligent(
        "classeTherapeutique",
        "suggestionsClasse",
        "classe"
    );

    const form = el("formMedicament");
    if (form) form.addEventListener("submit",enregistrerMedicament);

    const nouveau = el("btnNouveau");
    if (nouveau) nouveau.addEventListener("click",ouvrirFormulaire);

    const annuler = el("btnAnnuler");
    if (annuler) annuler.addEventListener("click",fermerFormulaire);

    const menu = el("btnMenu");
    if (menu) menu.addEventListener("click",ouvrirMenu);

    const fermer = el("btnFermerMenu");
    if (fermer) fermer.addEventListener("click",fermerMenu);

    const overlay = el("overlay");
    if (overlay) overlay.addEventListener("click",fermerMenu);

    const logout = el("btnDeconnexion");
    if (logout) logout.addEventListener("click",deconnexion);

    activerTri();
    afficherMedicaments();
});
/* =========================================================
   FORMES PHARMACEUTIQUES — AFFICHAGE PROFESSIONNEL
========================================================= */

function formeProfessionnelle(forme) {

    const n = normaliser(forme);

    const formes = {
        "comprime": "Cp",
        "comprime non enrobe": "Cp",
        "comprime pellicule": "Cp",
        "comprime enrobe": "Cp",
        "comprime gastro resistant": "Cp gastro-rés",
        "comprime effervescent": "Cp eff",
        "comprime dispersible": "Cp disp",
        "comprime orodispersible": "Cp orodisp",
        "comprime a croquer": "Cp à croquer",
        "comprime a sucer": "Cp à sucer",
        "comprime sublingual": "Cp subling",
        "comprime buccal": "Cp bucc",
        "comprime soluble": "Cp sol",
        "comprime a liberation prolongee": "Cp LP",
        "comprime a liberation modifiee": "Cp LM",
        "comprime a liberation retardee": "Cp LR",

        "gelule": "Gél",
        "gelule gastro resistante": "Gél gastro-rés",
        "gelule a liberation prolongee": "Gél LP",

        "capsule": "Caps",
        "capsule molle": "Caps molle",
        "capsule dure": "Caps dure",

        "solution buvable": "Sol buv",
        "solution orale": "Sol orale",
        "suspension buvable": "Sp buv",
        "suspension orale": "Sp orale",
        "sirop": "Sir",
        "gouttes buvables": "Gtt buv",

        "solution injectable": "Sol inj",
        "suspension injectable": "Sp inj",
        "emulsion injectable": "Émuls inj",
        "solution pour perfusion": "Sol perf",

        "creme": "Cr",
        "pommade": "Pomm",
        "gel": "Gel",
        "lotion": "Lot",
        "collyre": "Collyre",

        "spray nasal": "Spr nasal",
        "aerosol doseur": "Aérosol-doseur",

        "suppositoire": "Supp",
        "ovule": "Ov",

        "solution vaginale": "Sol vag",
        "creme vaginale": "Cr vag",
        "gel vaginal": "Gel vag",

        "patch transdermique": "Patch"
    };

    return formes[n] || forme || "—";
}
