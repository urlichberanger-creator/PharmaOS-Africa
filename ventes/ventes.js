// @ts-nocheck

var medicaments=[];
var stocks=[];
var panier=[];
var medicamentChoisi=null;
var lotChoisi=null;
var toastTimer=null;

function el(id){
    return document.getElementById(id);
}

function lire(cle){
    try{
        return JSON.parse(localStorage.getItem(cle)) || [];
    }catch(e){
        return [];
    }
}

function sauver(cle,data){
    localStorage.setItem(cle,JSON.stringify(data));
}

function argent(n){
    var p=lire("parametres");
    return Number(n||0).toLocaleString("fr-FR")+" "+(p.devise||"BIF");
}

function toast(txt){
    el("toastMessage").textContent=txt;
    el("toast").classList.add("show");

    clearTimeout(toastTimer);

    toastTimer=setTimeout(function(){
        el("toast").classList.remove("show");
    },2500);
}

function forme(f){

    var x=String(f||"").toLowerCase();

    var r={
        "comprimé":"Cp",
        "comprime":"Cp",
        "gélule":"Gél",
        "gelule":"Gél",
        "sirop":"Sir",
        "solution injectable":"Sol inj",
        "solution buvable":"Sol buv",
        "suspension buvable":"Sp buv",
        "crème":"Cr",
        "creme":"Cr",
        "pommade":"Pomm"
    };

    return r[x]||f||"";
}

function nom(m){

    var s=m.dci||m.nom||m.medicament||"";
    var c=m.nomCommercial||m.commercial||"";

    if(c)s+=" "+c+"®";
    if(m.forme)s+=" "+forme(m.forme);
    if(m.dosage)s+=" "+m.dosage;

    return s;
}

function qte(s){
    return Number(
        s.quantite ??
        s.stock ??
        0
    );
}

function pvu(s){
    return Number(
        s.prixVenteUnitaire ??
        s.prixVente ??
        s.pvu ??
        0
    );
}

function pau(s){
    return Number(
        s.prixAchatUnitaire ??
        s.prixAchat ??
        s.pau ??
        0
    );
}


/* RECHERCHE */

function rechercher(){

    var zone=el("suggestions");
    var texte=el("medicament").value.toLowerCase().trim();

    zone.innerHTML="";

    if(!texte){
        zone.classList.remove("show");
        return;
    }

    medicaments
    .filter(function(m){

        var t=[
            nom(m),
            m.article,
            m.codeBarre,
            m.dci,
            m.nomCommercial
        ].join(" ").toLowerCase();

        return t.includes(texte);

    })
    .slice(0,8)
    .forEach(function(m){

        var div=document.createElement("button");

        div.type="button";
        div.className="suggestion";

        var lots=stocks.filter(function(s){

            var id=m.id||m.article;

            return String(s.medicamentId)===String(id)
                && qte(s)>0;

        });

        var stockTotal=lots.reduce(
            function(a,s){
                return a+qte(s);
            },0
        );

        div.innerHTML=
            "<strong>"+nom(m)+"</strong>"+
            "<small>Stock restant : "+
            stockTotal+
            " | Lots disponibles : "+
            lots.length+
            "</small>";

        div.onclick=function(){

            medicamentChoisi=m;

            el("medicament").value=nom(m);
            el("medicamentId").value=m.id||m.article;

            zone.classList.remove("show");

            afficherLots();
        };

        zone.appendChild(div);
    });

    zone.classList.add("show");
}


/* LOTS */

function afficherLots(){

    var zone=el("lotsDisponibles");

    zone.innerHTML="";
    lotChoisi=null;

    var id=
        medicamentChoisi.id||
        medicamentChoisi.article;

    stocks
    .filter(function(s){

        return String(s.medicamentId)===String(id)
            && qte(s)>0;

    })
    .forEach(function(s){

        var b=document.createElement("button");

        b.type="button";
        b.className="lot";

        b.innerHTML=
            "<strong>Lot : "+
            (s.lot||"-")+
            "</strong>"+
            "<small>Stock restant : "+
            qte(s)+
            " | PVU : "+
            argent(pvu(s))+
            "</small>";

        b.onclick=function(){

            lotChoisi=s;

            el("lot").value=s.lot||"";
            el("stockDisponible").value=qte(s);
            el("prixVente").value=argent(pvu(s));

            toast("Lot sélectionné.");
        };

        zone.appendChild(b);
    });
}


/* PANIER */

function ajouter(){

    if(!medicamentChoisi){
        toast("Choisissez un médicament.");
        return;
    }

    if(!lotChoisi){
        toast("Choisissez un lot.");
        return;
    }

    var q=Number(el("quantite").value);

    if(q<1){
        toast("Quantité invalide.");
        return;
    }

    if(q>qte(lotChoisi)){
        toast("Stock insuffisant.");
        return;
    }

    panier.push({

        medicament:nom(medicamentChoisi),

        medicamentId:
            medicamentChoisi.id||
            medicamentChoisi.article,

        article:
            medicamentChoisi.article||"",

        lot:lotChoisi.lot||"",

        quantite:q,

        prixAchat:pau(lotChoisi),

        prixVente:pvu(lotChoisi),

        total:q*pvu(lotChoisi),

        benefice:
            (pvu(lotChoisi)-pau(lotChoisi))*q
    });

    afficherPanier();
    resetProduit();

    toast("Médicament ajouté.");
}

function afficherPanier(){

    var zone=el("listePanier");

    zone.innerHTML="";

    var total=0;

    panier.forEach(function(l,i){

        total+=l.total;

        var d=document.createElement("div");

        d.className="ligne-panier";

        d.innerHTML=
            "<span><strong>"+
            l.medicament+
            "</strong><br>"+
            l.quantite+
            " × "+
            argent(l.prixVente)+
            "</span>"+
            "<strong>"+
            argent(l.total)+
            "</strong>"+
            "<button type='button'>×</button>";

        d.querySelector("button").onclick=function(){

            panier.splice(i,1);
            afficherPanier();
        };

        zone.appendChild(d);
    });

    el("totalPanier").textContent=argent(total);
    el("compteurPanier").textContent=panier.length;
}


/* VALIDATION */

function validerVente(){

    if(!panier.length){
        toast("Le panier est vide.");
        return;
    }

    var stock=lire("stock");
    var ventes=lire("ventes");
    var journal=lire("journal");

    var patient=
        el("patient").value.trim()||
        "Patient anonyme";

    var mode=
        el("modePaiement").value;

    var numero=
        "FACT-"+new Date().getFullYear()+
        "-"+String(ventes.length+1).padStart(6,"0");

    var total=0;
    var benefice=0;

    panier.forEach(function(l){

        total+=l.total;
        benefice+=l.benefice;

        var s=stock.find(function(x){

            return String(x.medicamentId)===
                String(l.medicamentId)
                &&
                String(x.lot||"")===
                String(l.lot||"");
        });

        if(s){
            s.quantite=qte(s)-l.quantite;
        }
    });

    var vente={

        id:Date.now(),

        facture:numero,

        patient:patient,

        lignes:panier.slice(),

        total:total,

        benefice:benefice,

        modePaiement:mode,

        utilisateur:utilisateur(),

        date:new Date().toISOString()
    };

    sauver("stock",stock);

    ventes.push(vente);
    sauver("ventes",ventes);

    journal.push({

        id:Date.now(),

        type:"SORTIE",

        origine:"VENTE",

        reference:numero,

        patient:patient,

        utilisateur:vente.utilisateur,

        montant:total,

        benefice:benefice,

        date:vente.date
    });

    sauver("journal",journal);

    ouvrirFacture(vente);

    panier=[];
    afficherPanier();
    resetProduit();
}


/* FACTURE */

function ouvrirFacture(v){

    el("numeroFacture").textContent=
        "Facture : "+v.facture;

    el("dateFacture").textContent=
        "Date : "+
        new Date(v.date).toLocaleString("fr-FR");

    el("patientFacture").textContent=
        "Patient : "+v.patient;

    var zone=el("contenuFacture");

    zone.innerHTML="";

    v.lignes.forEach(function(l){

        var d=document.createElement("div");

        d.className="article";

        d.innerHTML=
            "<strong>"+l.medicament+"</strong>"+
            "<span>"+
            l.quantite+
            " × "+
            argent(l.prixVente)+
            " = "+
            argent(l.total)+
            "</span>";

        zone.appendChild(d);
    });

    el("totalFacture").textContent=
        "TOTAL : "+argent(v.total);

    el("facture").classList.add("show");
}

function fermerFacture(){

    el("facture").classList.remove("show");
}

function utilisateur(){

    try{

        var u=JSON.parse(
            localStorage.getItem(
                "utilisateurConnecte"
            )
        );

        if(!u)return"Utilisateur";

        return(
            u.nomComplet||
            ((u.prenom||"")+" "+(u.nom||"")).trim()||
            u.identifiant||
            "Utilisateur"
        );

    }catch(e){

        return"Utilisateur";
    }
}

function resetProduit(){

    medicamentChoisi=null;
    lotChoisi=null;

    el("medicament").value="";
    el("medicamentId").value="";
    el("lot").value="";
    el("stockDisponible").value="";
    el("prixVente").value="";
    el("quantite").value=1;
    el("lotsDisponibles").innerHTML="";
}


/* MENU */

function ouvrirMenu(){

    el("sidebar").classList.add("open");
    el("overlay").classList.add("show");
}

function fermerMenu(){

    el("sidebar").classList.remove("open");
    el("overlay").classList.remove("show");
}


/* INITIALISATION */

document.addEventListener(
"DOMContentLoaded",
function(){

    medicaments=lire("medicaments");
    stocks=lire("stock");

    if(!stocks.length)
        stocks=lire("stocks");

    el("medicament").addEventListener(
        "input",
        rechercher
    );

    el("btnAjouterPanier").onclick=
        ajouter;

    el("btnValiderVente").onclick=
        validerVente;

    el("btnImprimer").onclick=
        function(){
            window.print();
        };

    el("btnFermerFacture").onclick=
        fermerFacture;

    el("btnFermerFacture2").onclick=
        fermerFacture;

    el("btnMenu").onclick=
        ouvrirMenu;

    el("btnFermerMenu").onclick=
        fermerMenu;

    el("overlay").onclick=
        fermerMenu;

    el("btnPanier").onclick=
        function(){
            el("resumePanier").scrollIntoView({
                behavior:"smooth"
            });
        };

    el("btnDeconnexion").onclick=
        function(){

            localStorage.removeItem(
                "utilisateurConnecte"
            );

            location.href="../index.html";
        };

    afficherPanier();
});