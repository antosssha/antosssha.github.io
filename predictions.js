(() => {
  "use strict";
  const root = document.querySelector('[data-prediction-journey]');
  if (!root) return;
  const english = document.documentElement.lang === "en";
  const lang = english ? {
    eyebrow: "AI STAVIT / PUBLIC EXPERIMENT", title: "Journey to 100 predictions",
    subtitle: "Every officially recorded pick and its actual result. No hindsight edits.",
    picks: "Picks", wins: "Won", losses: "Lost", pending: "Awaiting result",
    remaining: "Remaining", hint: "Choose a highlighted number to focus its match card.",
    matchesTitle: "All selected matches", gridTitle: "100-pick progress", noMatches: "No official predictions recorded yet.",
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
    remaining: "Осталось", hint: "Нажмите на номер прогноза, чтобы выделить его карточку.",
    matchesTitle: "Все выбранные матчи", gridTitle: "Прогресс — 100 прогнозов", noMatches: "Официальных прогнозов пока нет.",
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
  function makeMatchCard(record,index) {
    const card = document.createElement("article");
    card.className = "journey-match-card journey-match-card--" + record.status;
    card.id = "prediction-match-" + index;
    card.tabIndex = -1;
    card.setAttribute("aria-label",lang.advance+" #"+index+": "+translated(record,"match")+" — "+statusText(record.status));

    const header = document.createElement("div");
    header.className = "journey-match-card-header";
    header.append(text("span","#"+String(index).padStart(2,"0")+" · "+formatDate(record.date),"journey-match-card-date"));
    header.append(text("span",statusText(record.status),"journey-match-card-status journey-match-card-status--"+record.status));
    card.append(header);

    const matchup = document.createElement("div");
    matchup.className = "journey-match-card-main";
    matchup.append(text("h4",translated(record,"match"),"journey-match-card-name"));
    const competition = translated(record,"competition");
    if(competition)matchup.append(text("p",competition,"journey-match-card-league"));
    card.append(matchup);

    const result = document.createElement("div");
    result.className = "journey-match-card-facts";
    const prediction = document.createElement("div");
    prediction.className = "journey-match-card-pick";
    prediction.append(text("span",lang.pick),text("strong",translated(record,"pick")));
    result.append(prediction);
    const score = document.createElement("div");
    score.className = "journey-match-card-score";
    score.append(text("span",lang.score),text("strong",record.score || "—"));
    result.append(score);
    card.append(result);

    if(record.odds || record.probability) {
      const more = document.createElement("div");
      more.className = "journey-match-card-more";
      if(record.odds)more.append(text("span",(english?"Odds ":"Коэффициент ")+record.odds));
      if(record.probability)more.append(text("span",lang.archivalProbability+": "+record.probability));
      card.append(more);
    }
    if(record.source)card.append(text("p",lang.source+": "+translated(record,"source"),"journey-match-card-source"));
    return card;
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
    set("n",String(n));set("picks-metric",n+" / 100");set("wins",String(wins));set("losses",String(losses));set("remaining",String(100-n));
    set("hint",lang.hint);set("grid-title",lang.gridTitle);set("matches-title",lang.matchesTitle);set("matches-count",String(n));set("note",lang.note);set("updated",lang.published);
    const track=$("track");track.style.width=n+"%";$("track-container").setAttribute("aria-valuenow",String(n));
    $("track-container").setAttribute("aria-label",lang.picks+": "+n+" / 100");
    if(pending)set("note",lang.note+" · "+lang.pending+": "+pending);
    const sorted=[...by.entries()].sort((a,b)=>a[0]-b[0]);
    const cards=new Map();
    const cardContainer=$("match-cards");
    cardContainer.replaceChildren();
    for(const [index,record] of sorted) {
      const card=makeMatchCard(record,index);
      cardContainer.append(card);
      cards.set(index,card);
    }
    if(!sorted.length)cardContainer.append(text("p",lang.noMatches,"journey-match-loading"));
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
      if(record)button.addEventListener("click",()=>selectPrediction(i,true));
      if(record)button.setAttribute("aria-pressed","false");
      buttons.set(i,button);grid.append(button);
    }
    function selectPrediction(index,scroll) {
      for(const button of buttons.values())button.setAttribute("aria-pressed","false");
      for(const card of cards.values())card.classList.remove("is-selected");
      buttons.get(index)?.setAttribute("aria-pressed","true");
      const card=cards.get(index);
      if(card) {
        card.classList.add("is-selected");
        if(scroll) {
          const reduced=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          card.scrollIntoView({behavior:reduced?"auto":"smooth",block:"nearest"});
        }
      }
    }
    if(by.size){
      const latest=sorted[sorted.length-1][0];
      selectPrediction(latest,false);
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
    $("match-cards").replaceChildren(text("p",lang.invalid,"journey-match-loading"));
  });
  getData("predictions-archive.json").then(renderArchive).catch(err=>{
    console.warn("Archive data:",err);
    $("archive").hidden=true;
  });
})();