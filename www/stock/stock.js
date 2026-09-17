// @ts-nocheck

let medicaments=[],stocks=[],filtre="tous",toastTimer;

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

function n(v){
    v=Number(String(v??"").replace(/\s/g,"").replace(",","."));
    return Number.isFinite(v)?v:0;
}

function fr(v){return n(v).toLocaleString("fr-FR")}
function norm(v){
    return String(v??"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function esc(v){
    return String(v??"").replace(/&/g,"&amp;")
    .replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function med(id){
    return medicaments.find(m=>String(m.id||m.code||m.article)==String(id));
}

function forme(v){
    const x=norm(v);
    const f={
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
    return f[x]||v||"—";
}

function nom(m){
    if(!m)return"—";
    let x=m.dci||"";
    if(m.nomCommercial)x+=(x?" — ":"")+m.nomCommercial+"®";
    let p=[forme(m.forme),m.dosage].filter(Boolean).join(" ");
    return x+(p?" — "+p:"");
}

function article(m){
    return m?(m.article||m.codeArticle||m.code||m.id||"—"):"—";
}

function charger(){
    medicaments=lire("medicaments");
    stocks=lire("stock");
    if(!stocks.length)stocks=lire("stocks");
}

function expiration(v){
    if(!v)return"";
    let d=/^\d{4}-\d{2}$/.test(v)
        ?new Date(+v.slice(0,4),+v.slice(5),0,23,59,59)
        :new Date(v);
    if(isNaN(d))return"";
    let j=(d-new Date())/86400000;
    return j<0?"expired":j<=90?"soon":"ok";
}

function etat(s){
    if(expiration(s.dateExpiration)=="expired")
        return["expired","Expiré"];
    if(n(s.quantite)<=n(s.stockMinimum))
        return["low","Stock faible"];
    if(expiration(s.dateExpiration)=="soon")
        return["soon","Expire bientôt"];
    return["ok","Normal"];
}

function afficher(){

    let q=norm($("recherche")?.value),rows=$("listeStock");
    if(!rows)return;

    rows.innerHTML="";

    let result=stocks.filter(s=>{
        let m=med(s.medicamentId);
        let texte=norm(
            (m?nom(m):s.medicament)+" "+
            (s.article||article(m))+" "+(s.lot||"")
        );
        return texte.includes(q) &&
            (filtre=="tous"||etat(s)[0]==filtre);
    });

    result.forEach(s=>{
        let m=med(s.medicamentId),e=etat(s);
        let d=s.dateExpiration||"—";

        if(/^\d{4}-\d{2}$/.test(d))
            d=d.slice(5)+"/"+d.slice(0,4);

        rows.innerHTML+=`
        <tr>
        <td>${esc(s.article||article(m))}</td>
        <td>${esc(m?nom(m):s.medicament)}</td>
        <td>${esc(s.lot||"—")}</td>
        <td>${esc(d)}</td>
        <td><strong>${fr(s.quantite)}</strong></td>
        <td>${fr(s.prixAchatUnitaire??s.prixAchat)} BIF</td>
        <td>${fr(s.prixVenteUnitaire??s.prixVente)} BIF</td>
        <td><span class="status ${e[0]}">${e[1]}</span></td>
        </tr>`;
    });

    $("compteur").textContent=
        result.length+" "+(result.length>1?"lignes":"ligne");

    $("etatVide").classList.toggle("hidden",result.length>0);

    statistiques();
    mouvements();
}

function statistiques(){

    let articles=new Set(),q=0,low=0,exp=0;

    stocks.forEach(s=>{
        let m=med(s.medicamentId);
        articles.add(s.article||article(m));
        q+=n(s.quantite);

        let e=etat(s)[0];
        if(e=="low")low++;
        if(e=="soon"||e=="expired")exp++;
    });

    $("statArticles").textContent=fr(articles.size);
    $("statQuantite").textContent=fr(q);
    $("statFaible").textContent=fr(low);
    $("statExpiration").textContent=fr(exp);
}

function mouvements(){

    let achats=lire("achats"),ventes=lire("ventes");
    $("totalEntrees").textContent=fr(
        achats.reduce((a,x)=>a+n(x.quantite),0)
    );
    $("totalSorties").textContent=fr(
        ventes.reduce((a,x)=>a+n(x.quantite),0)
    );

    $("totalLots").textContent=fr(
        new Set(stocks.map(s=>s.lot).filter(Boolean)).size
    );
}

function suggestions(){

    let input=$("rechercheMedicament"),box=$("suggestionsMedicaments");
    if(!input||!box)return;

    let q=norm(input.value);
    box.innerHTML="";

    if(!q){
        box.classList.remove("show");
        return;
    }

    let r=medicaments.filter(m=>
        norm([
            m.dci,m.nomCommercial,m.forme,m.dosage,
            m.article,m.code
        ].join(" ")).includes(q)
    ).slice(0,10);

    r.forEach(m=>{
        let b=document.createElement("button");
        b.type="button";
        b.className="suggestion-item";
        b.innerHTML=
            `<span class="suggestion-main">${esc(nom(m))}</span>
             <span class="suggestion-detail">Article : ${esc(article(m))}</span>`;
        b.onclick=()=>{
            input.value=nom(m);
            $("medicamentId").value=m.id||m.code||m.article;
            box.classList.remove("show");
        };
        box.appendChild(b);
    });

    box.classList.toggle("show",r.length>0);
}

function enregistrer(e){

    e.preventDefault();

    let m=med($("medicamentId").value);

    if(!m){
        toast("Sélectionnez un médicament.");
        return;
    }

    let q=n($("quantite").value);
    if(q<=0){
        toast("Quantité invalide.");
        return;
    }

    let lot=$("lot").value.trim();
    if(!lot){
        toast("Indiquez le numéro de lot.");
        return;
    }

    let s={
        id:"STK-"+Date.now(),
        article:article(m),
        medicament:nom(m),
        medicamentId:m.id||m.code||m.article,
        lot:lot,
        quantite:q,
        stockMinimum:n($("stockMinimum").value),
        prixAchat:n($("prixAchat").value),
        prixAchatUnitaire:n($("prixAchat").value),
        prixVente:n($("prixVente").value),
        prixVenteUnitaire:n($("prixVente").value),
        dateExpiration:$("dateExpiration").value,
        fournisseur:$("fournisseur").value.trim(),
        dateEntree:new Date().toISOString()
    };

    stocks.push(s);
    save("stock",stocks);

    let j=lire("journal");
    j.push({
        id:"JRN-"+Date.now(),
        type:"ENTREE_STOCK",
        module:"stock",
        medicament:s.medicament,
        medicamentId:s.medicamentId,
        lot:s.lot,
        quantite:s.quantite,
        prixAchat:s.prixAchatUnitaire,
        prixVente:s.prixVenteUnitaire,
        date:new Date().toISOString()
    });
    save("journal",j);

    $("formStock").reset();
    $("stockMinimum").value="10";
    $("medicamentId").value="";
    $("formulaireStock").classList.add("hidden");

    charger();
    afficher();
    toast("Entrée stock enregistrée.");
}

function toast(msg){
    $("toastMessage").textContent=msg;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2500);
}

function menu(open){
    $("sidebar").classList.toggle("open",open);
    $("overlay").classList.toggle("show",open);
}

function deconnexion(){
    localStorage.removeItem("utilisateurConnecte");
    location.href="../index.html";
}

document.addEventListener("DOMContentLoaded",()=>{

    charger();
    afficher();

    $("btnNouveau").onclick=()=>$("formulaireStock").classList.remove("hidden");
    $("btnFermerForm").onclick=()=>$("formulaireStock").classList.add("hidden");
    $("btnAnnuler").onclick=()=>$("formulaireStock").classList.add("hidden");

    $("formStock").onsubmit=enregistrer;

    $("rechercheMedicament").oninput=suggestions;
    $("recherche").oninput=afficher;

    $("filtreEtat").onchange=()=>{
        filtre=$("filtreEtat").value;
        afficher();
    };

    $("btnActualiser").onclick=()=>{
        charger();
        afficher();
        toast("Stock actualisé.");
    };

    $("btnMenu").onclick=()=>menu(true);
    $("btnFermerMenu").onclick=()=>menu(false);
    $("overlay").onclick=()=>menu(false);
    $("btnDeconnexion").onclick=deconnexion;
});