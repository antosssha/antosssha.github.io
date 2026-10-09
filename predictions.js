(() => {
  "use strict";
  const root = document.querySelector('[data-prediction-journey]');
  if (!root) return;
  const english = document.documentElement.lang === "en";
  const lang = english ? {
    eyebrow: "AI STAVIT / PUBLIC EXPERIMENT", title: "Journey to 100 predictions",
    subtitle: "Every officially recorded pick and its actual result. No hindsight edits.",
    picks: "Picks", wins: "Won", losses: "Lost", pending: "Awaiting result",
    remaining: "Remaining", hint: "Select a highlighted cell to view the prediction.",
    emptyCell: "Not recorded yet", pick: "Prediction", score: "Final score",
    source: "Recorded in", win: "Won", loss: "Lost", wait: "Pending",
    advance: "Official series", invalid: "Verified records are temporarily unavailable",
    archive: "Prior validation / separate series", archivedNote: "Historical analysis from 6 October. These nine picks are not counted toward the public 100.",
    archiveWins: "won", archiveLosses: "lost", archivalProbability: "Model estimate",
    note: "8 Oct: no new officially recorded picks. Unselected and observational matches are excluded.",
    published: "As of 9 Oct 2026", noOdds: "Odds are shown only where recorded."
  } : {
    eyebrow: "ИИ СТАВИТ / ПУБЛИЧНЫЙ ЭКСПЕРИМЕНТ", title: "Путь к 100 прогнозам",
    subtitle: "Каждый официальный прогноз и его фактический исход. Без исправлений задним числом.",
    picks: "Прогнозов", wins: "Прошло", losses: "Не прошло", pending: "Ожидают результата",
    remaining: "Осталось", hint: "Нажмите на цветную ячейку, чтобы увидеть прогноз.",
    emptyCell: "Прогноз ещё не зафиксирован", pick: "Ставка", score: "Итоговый счёт",
    source: "Зафиксировано в", win: "Прошла", loss: "Не прошла", wait: "Ожидает результата",
    advance: "Официальная серия", invalid: "Подтверждённые данные временно недоступны",
    archive: "Предыдущая проверка / отдельно от серии", archivedNote: "Историческая проверка за 6 октября. Эти девять прогнозов не входят в публичную серию 100.",
    archiveWins: "прошло", archiveLosses: "не прошло", archivalProbability: "Оценка модели",
    note: "8 октября: новых зачётных прогнозов не было. Наблюдения и пропущенные матчи не учитываются.",
    published: "Актуально на 9 октября 2026", noOdds: "Коэффициенты показаны только там, где подтверждены."
  };
  const $ = name => root.querySelector('[data-journey="' + name + '"]');
  const set = (name, value) => { const node=$(name); if(node)node.textContent=value; };
  const text = (tag, content, cls) => {
    const el=document.createElement(tag);
    el.textContent=content;
    if(cls)el.className=cls;
    return el;
  };
  const formatDate = date => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date||"")) return date||"";
    const [y,m,d]=date.split("-");
    return english?d+"."+m+"."+y:d+"."+m+"."+y;
  };
  const translated = (record,field) => english?(record[field+"_en"]||record[field]||""):(record[field]||"");
  const statusText = status => status==="win"?lang.win:status==="loss"?lang.loss:lang.wait;
  async function getData(url) {
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)throw Error("Could not retrieve "+url);
    const data=await response.json();
    if(!Array.isArray(data))throw Error("Invalid predictions format");
    return data;
  }
  function detailCard(record,index) {
    const pane=$("detail");
    pane.replaceChildren();
    pane.append(text("span",lang.advance+" · #"+index,"journey-detail-index"));
    pane.append(text("div",formatDate(record.date)+(record.competition?" · "+translated(record,"competition"):""),"journey-detail-date"));
    pane.append(text("h3",translated(record,"match"),"journey-detail-match"));
    const pill=text("span",statusText(record.status),"journey-pill journey-pill--"+record.status);
    pane.append(pill);
    const grid=document.createElement("div");grid.className="journey-detail-facts";
    const addFact=(label,value)=>{
      if(!value)return;
      const item=document.createElement("div");item.className="journey-fact";
      item.append(text("span",label),text("strong",value));grid.append(item);
    };
    addFact(lang.pick,translated(record,"pick"));
    addFact(lang.score,record.score);
    if(record.odds)addFact(english?"Odds":"Коэффициент",String(record.odds));
    if(record.probability)addFact(lang.archivalProbability,record.probability);
    pane.append(grid);
    if(record.source)pane.append(text("div",lang.source+": "+translated(record,"source"),"journey-source"));
  }
  function renderOfficial(items) {
    const verified=items.filter(x=>x && x.official===true && Number.isInteger(x.number) && x.number>=1 && x.number<=100 && ["win","loss","pending"].includes(x.status));
    const by=new Map(verified.map(x=>[x.number,x]));
    const wins=[...by.values()].filter(x=>x.status==="win").length;
    const losses=[...by.values()].filter(x=>x.status==="loss").length;
    const pending=[...by.values()].filter(x=>x.status==="pending").length;
    const n=by.size;
    set("eyebrow",lang.eyebrow);set("title",lang.title);set("subtitle",lang.subtitle);
    set("picks-title",lang.picks);set("wins-title",lang.wins);set("losses-title",lang.losses);
    set("n",String(n));set("wins",String(wins));set("losses",String(losses));set("remaining",String(100-n));
    set("hint",lang.hint);set("note",lang.note);set("updated",lang.published);
    const track=$("track");track.style.width=n+"%";
    $("track-container").setAttribute("aria-label",lang.picks+": "+n+" / 100");
    if(pending)set("note",lang.note+" · "+lang.pending+": "+pending);
    const grid=$("grid");grid.replaceChildren();
    const buttons=new Map();
    for(let i=1;i<=100;i++){
      const record=by.get(i);
      const button=document.createElement("button");
      button.type="button";button.textContent=i;
      button.className="journey-cell journey-cell--"+(record?record.status:"future");
      button.setAttribute("aria-label","#"+i+": "+(record?translated(record,"match")+" · "+translated(record,"pick")+" · "+statusText(record.status):lang.emptyCell));
      button.title=record?translated(record,"match")+" · "+statusText(record.status):lang.emptyCell;
      button.disabled=!record;
      if(record)button.addEventListener("click",()=>{
        for(const b of buttons.values())b.setAttribute("aria-pressed","false");
        button.setAttribute("aria-pressed","true");
        detailCard(record,i);
      });
      if(record)button.setAttribute("aria-pressed","false");
      buttons.set(i,button);grid.append(button);
    }
    if(by.size){
      const latest=[...by.keys()].sort((a,b)=>b-a)[0];
      buttons.get(latest).click();
    }else{
      $("detail").replaceChildren(text("p",lang.invalid));
    }
  }
  function renderArchive(records){
    const valid=records.filter(x=>x && x.official===false && ["win","loss"].includes(x.status));
    const wins=valid.filter(x=>x.status==="win").length;
    const losses=valid.filter(x=>x.status==="loss").length;
    set("archive-title",lang.archive);
    set("archive-count",valid.length+" · "+wins+" "+lang.archiveWins+" / "+losses+" "+lang.archiveLosses);
    set("archive-note",lang.archivedNote);
    const list=$("archive-list");list.replaceChildren();
    for(const p of valid){
      const item=document.createElement("article");
      item.className="journey-archive-card";
      const main=document.createElement("div");
      main.append(text("strong",translated(p,"match")));
      main.append(text("span",formatDate(p.date)+" · "+translated(p,"pick")));
      const side=document.createElement("div");side.className="journey-archive-result";
      side.append(text("strong",p.score));
      side.append(text("small",statusText(p.status),"journey-result--"+p.status));
      item.append(main,side);list.append(item);
    }
    if(!valid.length){$("archive").hidden=true}
  }
  getData("predictions.json").then(renderOfficial).catch(err=>{
    console.warn("Journey data:",err);
    set("hint",lang.invalid);
    $("grid").replaceChildren();
    $("detail").textContent=lang.invalid;
  });
  getData("predictions-archive.json").then(renderArchive).catch(err=>{
    console.warn("Archive data:",err);
    $("archive").hidden=true;
  });
})();