// @ts-nocheck

let achats=[],stocks=[],medicaments=[],selection=null,timer;

const $=id=>document.getElementById(id);

function lire(k){
    try{
        if(window.PharmaDB)return PharmaDB.lire(k)||[];
    }catch(e){}
    try{return JSON.parse(localStorage.getItem(k)||"[]")}catch(e){return[]}
}

function save(k,v){
    try{
        if(window.PharmaDB){PharmaDB.enregistrer(k,v);return}
    }catch(e){}
    localStorage.setItem(k,JSON.stringify(v));
}

function norm(v){
    return String(v||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function argent(v){
    return Number(v||0).toLocaleString("fr-FR")+" BIF";
}

function forme(v){
    let x=norm(v);
    let f={
        "comprime":"Cp",
        "comprime pellicule":"Cp",
        "comprime a liberation prolongee":"Cp LP",
        "gelule":"Gél",
        "solution buvable":"Sol buv",
        "suspension buvable":"Sp buv",
        "sirop":"Sir",
        "solution injectable":"Sol inj",
        "creme":"Cr",
        "pommade":"Pomm",
        "suppositoire":"Supp",
        "ovule":"Ov"
    };
    return f[x]||v||"";
}

function nom(m){
    if(!m)return"";
    let x=m.dci||"";
    if(m.nomCommercial)x+=(x?" — ":"")+m.nomCommercial+"®";
    let p=[forme(m.forme),m.dosage].filter(Boolean).join(" ");
    return x+(p?" — "+p:"");
}

function article(m){
    return m?(m.article||m.codeArticle||m.code||m.id||"—"):"—";
}

function chercher(){

    let q=norm($("medicament").value),zone=$("suggestions");
    zone.innerHTML="";

    if(!q){
        zone.classList.remove("show");
        selection=null;
        return;
    }

    let r=medicaments.filter(m=>
        norm([
            m.dci,m.nomCommercial,m.forme,
            m.dosage,m.article,m.code
        ].join(" ")).includes(q)
    ).slice(0,8);

    r.forEach(m=>{
        let b=document.createElement("button");
        b.type="button";
        b.innerHTML=
            `<span class="suggestion-nom">${nom(m)}</span>
             <span class="suggestion-details">DCI : ${m.dci||"—"}</span>`;
        b.onclick=()=>{
            selection=m;
            $("medicament").value=nom(m);
            zone.innerHTML="";
            zone.classList.remove("show");
        };
        zone.appendChild(b);
    });

    zone.classList.toggle("show",r.length>0);
}

function total(){
    $("totalAchat").textContent=
        argent(Number($("quantite").value||0)*
        Number($("prixAchat").value||0));
}

function enregistrer(e){

    e.preventDefault();

    if(!selection){
        toast("Sélectionnez un médicament dans les suggestions.");
        return;
    }

    let q=Number($("quantite").value||0),
        pa=Number($("prixAchat").value||0),
        pv=Number($("prixVente").value||0),
        lot=$("lot").value.trim();

    if(q<=0)return toast("Quantité invalide.");
    if(pa<0||pv<0)return toast("Prix invalide.");
    if(!lot)return toast("Indiquez le numéro de lot.");

    let id=selection.id||selection.code||selection.article;

    let achat={
        id:"ACH-"+Date.now(),
        article:article(selection),
        medicament:nom(selection),
        medicamentId:id,
        quantite:q,
        prixAchat:pa,
        prixAchatUnitaire:pa,
        prixVente:pv,
        prixVenteUnitaire:pv,
        total:q*pa,
        lot:lot,
        dateExpiration:$("dateExpiration").value,
        fournisseur:$("fournisseur").value.trim(),
        date:new Date().toISOString()
    };

    achats.push(achat);
    save("achats",achats);
    stock(achat);
    afficher();

    $("formAchat").reset();
    $("totalAchat").textContent="0 BIF";
    selection=null;

    toast("Réception enregistrée.");
}

function stock(a){

    let i=stocks.findIndex(s=>
        String(s.medicamentId)==String(a.medicamentId)&&
        norm(s.lot)==norm(a.lot)
    );

    if(i<0){
        stocks.push({
            id:"STK-"+Date.now(),
            article:a.article,
            medicament:a.medicament,
            medicamentId:a.medicamentId,
            lot:a.lot,
            quantite:a.quantite,
            stockMinimum:10,
            prixAchat:a.prixAchat,
            prixAchatUnitaire:a.prixAchat,
            prixVente:a.prixVente,
            prixVenteUnitaire:a.prixVente,
            dateExpiration:a.dateExpiration,
            fournisseur:a.fournisseur,
            dateEntree:new Date().toISOString()
        });
    }else{
        let s=stocks[i];
        s.quantite=Number(s.quantite||0)+a.quantite;
        s.prixAchat=s.prixAchatUnitaire=a.prixAchat;
        s.prixVente=s.prixVenteUnitaire=a.prixVente;
        s.dateExpiration=a.dateExpiration;
        s.fournisseur=a.fournisseur;
    }

    save("stock",stocks);
}

function afficher(){

    let zone=$("listeAchats");
    zone.innerHTML="";

    $("compteurAchats").textContent=achats.length;

    if(!achats.length){
        zone.innerHTML=
        `<tr><td colspan="8" class="etat-vide">
        Aucun achat enregistré.</td></tr>`;
        return;
    }

    achats.slice().reverse().forEach(a=>{
        let tr=document.createElement("tr");
        tr.innerHTML=`
        <td>${a.date?new Date(a.date).toLocaleDateString("fr-FR"):"—"}</td>
        <td><strong>${a.medicament||"—"}</strong></td>
        <td>${a.lot||"—"}</td>
        <td>${Number(a.quantite||0).toLocaleString("fr-FR")}</td>
        <td>${argent(a.prixAchatUnitaire||a.prixAchat)}</td>
        <td>${argent(a.prixVenteUnitaire||a.prixVente)}</td>
        <td>${a.fournisseur||"—"}</td>
        <td><strong>${argent(a.total)}</strong></td>`;
        zone.appendChild(tr);
    });
}

function toast(msg){
    let z=$("toast");
    z.textContent=msg;
    z.classList.add("show");
    clearTimeout(timer);
    timer=setTimeout(()=>z.classList.remove("show"),2200);
}

function menu(v){
    $("sidebar").classList.toggle("open",v);
    $("overlay").classList.toggle("show",v);
}

function deconnexion(){
    localStorage.removeItem("utilisateurConnecte");
    location.href="../index.html";
}

document.addEventListener("DOMContentLoaded",()=>{

    achats=lire("achats");
    stocks=lire("stock");
    medicaments=lire("medicaments");

    afficher();

    $("medicament").oninput=chercher;
    $("quantite").oninput=total;
    $("prixAchat").oninput=total;
    $("formAchat").onsubmit=enregistrer;

    $("btnMenu").onclick=()=>menu(true);
    $("btnFermerMenu").onclick=()=>menu(false);
    $("overlay").onclick=()=>menu(false);
    $("btnDeconnexion").onclick=deconnexion;
});