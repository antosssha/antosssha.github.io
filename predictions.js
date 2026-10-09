(() => {
  "use strict";

  const root = document.querySelector("[data-prediction-journey]");
  if (!root) return;

  const english = document.documentElement.lang === "en";
  const lang = english ? {
    eyebrow: "AI STAVIT / PUBLIC EXPERIMENT",
    title: "Journey to 100 predictions",
    subtitle: "Every publicly recorded pick and its result. No hindsight edits.",
    picks: "Picks", wins: "Won", losses: "Lost", pending: "Awaiting result",
    remaining: "Remaining", matchesTitle: "Selected matches",
    gridTitle: "100-pick progress",
    hint: "Choose a number to open its public match review.",
    emptyCell: "No pick recorded", noMatches: "No picks have been recorded yet.",
    pick: "Prediction", score: "Final score", source: "Record",
    win: "Won", loss: "Lost", wait: "Pending",
    invalid: "Live update unavailable; the last saved cards remain visible.",
    archive: "Earlier validation / separate series",
    archivedNote: "Earlier validation picks are separate from the public 100.",
    archiveWins: "won", archiveLosses: "lost",
    note: "9 Oct: eight pre-match experimental picks were added to the public count after the results on 10 Oct; quoted odds are indicative, not verified wagers.",
    published: "As of 10 Oct 2026",
    review: "PUBLIC MATCH REVIEW", open: "Read match review:",
    view: "Read match review", close: "Close review",
    why: "Why this scenario", risk: "Main risk",
    happened: "What happened", next: "What we will check",
    lesson: "What we learned", sourceLink: "Source post",
    noReview: "A public summary has not been added yet. Only the original pick and outcome are shown.",
    pendingOutcome: "This match is awaiting a final result.",
    experimental: "This pick was published before kick-off as an experiment and added to the public 100 only after the result. It was not an originally confirmed PLAY bet.",
    watch: "Preliminary / WATCH. No placed bet has been verified.",
    publicOnly: "Public summary only — no private weights, formulas or internal model settings.",
    odds: "Pre-match odds", oddsCaveat: "Indicative quote; not a verified bet price.",
    outcome: "Outcome"
  } : {
    eyebrow: "ИИ СТАВИТ / ПУБЛИЧНЫЙ ЭКСПЕРИМЕНТ",
    title: "Путь к 100 прогнозам",
    subtitle: "Каждый опубликованный прогноз и его исход. Без исправлений задним числом.",
    picks: "Прогнозов", wins: "Прошло", losses: "Не прошло", pending: "Ожидает",
    remaining: "Осталось", matchesTitle: "Выбранные матчи",
    gridTitle: "Прогресс — 100 прогнозов",
    hint: "Нажмите на номер, чтобы открыть публичный разбор матча.",
    emptyCell: "Прогноз не зафиксирован", noMatches: "Пока нет опубликованных прогнозов.",
    pick: "Прогноз", score: "Итоговый счёт", source: "Запись",
    win: "Прошла", loss: "Не прошла", wait: "Ожидается",
    invalid: "Не удалось обновить данные; последние сохранённые карточки доступны.",
    archive: "Предыдущая проверка / отдельно от серии",
    archivedNote: "Предыдущие проверочные прогнозы не входят в публичную серию 100.",
    archiveWins: "прошло", archiveLosses: "не прошло",
    note: "9 октября: восемь предматчевых экспериментальных прогнозов включены в публичную серию 10 октября после результатов; коэффициенты ориентировочные, реальные ставки не подтверждены.",
    published: "Актуально на 10 октября 2026",
    review: "ПУБЛИЧНЫЙ РАЗБОР", open: "Открыть разбор:",
    view: "Разбор матча", close: "Закрыть разбор",
    why: "Почему выбрали", risk: "Что могло помешать",
    happened: "Что произошло", next: "Что проверим после матча",
    lesson: "Какой вывод сделали", sourceLink: "Исходный пост",
    noReview: "Публичный разбор ещё не подготовлен. Доступны только прогноз и итог.",
    pendingOutcome: "Ожидается завершение матча.",
    experimental: "Прогноз опубликован до начала игры как экспериментальный и включён в публичную сотню после результата. Изначально он не был подтверждён как PLAY.",
    watch: "Предварительно / WATCH. Фактическая ставка не подтверждена.",
    publicOnly: "Показаны только публичные аргументы — без весов, формул и внутренних настроек модели.",
    odds: "Предматчевый кф.", oddsCaveat: "Ориентир, не подтверждённый коэффициент принятой ставки.",
    outcome: "Результат"
  };

  const $ = key => root.querySelector('[data-journey="' + key + '"]');
  const set = (key,value) => { const item=$(key); if(item)item.textContent=String(value); };
  const text = (tag,value,cls) => {
    const node=document.createElement(tag);
    node.textContent=value === undefined || value === null ? "" : String(value);
    if(cls)node.className=cls;
    return node;
  };
  const translated=(record,field)=>english?(record[field+"_en"]||record[field]||""):(record[field]||"");
  const formatDate=raw=> {
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw||"");
    return match ? match[3]+"."+match[2]+"."+match[1] : (raw||"");
  };
  const stateLabel=state=>state==="win"?lang.win:state==="loss"?lang.loss:lang.wait;
  const hasOdds=r=>r.odds!==null && r.odds!==undefined && String(r.odds)!=="";
  const oddsValue=r=>hasOdds(r)?String(r.odds):translated(r,"odds_reference");
  const reducedMotion=()=>window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  async function getData(url){
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)throw new Error("Cannot load "+url);
    const data=await response.json();
    if(!Array.isArray(data))throw new TypeError("Expected a list of records");
    return data;
  }

  let ordered=[];
  let activeIndex=0;
  let scrollFrame=0;
  const viewport=$("carousel-viewport");
  const track=$("match-cards");
  const modal=$("review-dialog");
  let returnFocus=null;

  function updateCarouselNav(){
    const total=ordered.length;
    const index=total?activeIndex+1:0;
    set("carousel-counter",String(index).padStart(2,"0")+" / "+String(total).padStart(2,"0"));
    const prev=$("carousel-prev"),next=$("carousel-next");
    if(prev)prev.disabled=index<=1;
    if(next)next.disabled=index>=total;
    const fill=$("carousel-progress");
    if(fill)fill.style.width=(total?Math.round(index*100/total):0)+"%";
    const current=ordered[activeIndex];
    root.querySelectorAll(".journey-cell[aria-pressed]").forEach(button=>{
      button.setAttribute("aria-pressed",current && Number(button.textContent)===current.number?"true":"false");
    });
    if(track){
      track.querySelectorAll(".journey-match-card").forEach((card,i)=>{
        card.classList.toggle("is-selected",!!current&&i===activeIndex);
      });
    }
  }

  function goToIndex(index,animate=true){
    if(!viewport||!track||!ordered.length)return;
    activeIndex=Math.max(0,Math.min(ordered.length-1,index));
    updateCarouselNav();
    const target=track.querySelectorAll(".journey-match-card")[activeIndex];
    if(!target)return;
    const newLeft=viewport.scrollLeft+target.getBoundingClientRect().left-viewport.getBoundingClientRect().left;
    if(typeof viewport.scrollTo==="function"){
      viewport.scrollTo({left:newLeft,behavior:animate&&!reducedMotion()?"smooth":"instant"});
    }else viewport.scrollLeft=newLeft;
  }

  if(viewport){
    viewport.addEventListener("scroll",()=>{
      if(scrollFrame)cancelAnimationFrame(scrollFrame);
      scrollFrame=requestAnimationFrame(()=>{
        const candidates=[...track.querySelectorAll(".journey-match-card")];
        if(!candidates.length)return;
        const edge=viewport.getBoundingClientRect().left;
        let nearest=0,best=Infinity;
        candidates.forEach((card,i)=>{
          const difference=Math.abs(card.getBoundingClientRect().left-edge);
          if(difference<best){best=difference;nearest=i;}
        });
        if(nearest!==activeIndex){activeIndex=nearest;updateCarouselNav();}
      });
    },{passive:true});
    viewport.addEventListener("keydown",event=>{
      if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
      if(event.altKey||event.ctrlKey||event.metaKey)return;
      event.preventDefault();
      goToIndex(activeIndex+(event.key==="ArrowRight"?1:-1));
    });
  }
  $("carousel-prev")?.addEventListener("click",()=>goToIndex(activeIndex-1));
  $("carousel-next")?.addEventListener("click",()=>goToIndex(activeIndex+1));

  function appendFact(container,label,value){
    if(value===undefined||value===null||value==="")return;
    const node=document.createElement("div");
    node.className="journey-review-fact";
    node.append(text("span",label),text("strong",value));
    container.append(node);
  }
  function appendSection(container,heading,body){
    if(!body)return;
    const section=document.createElement("section");
    section.className="journey-review-section";
    section.append(text("h3",heading),text("p",body));
    container.append(section);
  }
  function safeSourceUrl(value){
    if(typeof value!=="string")return "";
    try{
      const parsed=new URL(value);
      return parsed.protocol==="https:" && (parsed.hostname==="t.me" || parsed.hostname==="www.t.me")?parsed.href:"";
    }catch(e){return "";}
  }
  function openReview(record){
    if(!modal)return;
    const body=$("review-body");
    if(!body)return;
    body.replaceChildren();
    returnFocus=document.activeElement;

    const header=document.createElement("div");
    header.className="journey-review-header";
    header.append(text("span",lang.review+" / #"+String(record.number).padStart(2,"0"),"journey-review-kicker"));
    header.append(text("div",formatDate(record.date)+" · "+translated(record,"competition"),"journey-review-date"));
    header.append(text("h2",translated(record,"match"),"journey-review-title"));
    header.append(text("span",stateLabel(record.status),"journey-match-card-status journey-match-card-status--"+record.status));
    body.append(header);

    const facts=document.createElement("div");
    facts.className="journey-review-facts";
    appendFact(facts,lang.pick,translated(record,"pick"));
    appendFact(facts,lang.score,record.score||"—");
    if(oddsValue(record))appendFact(facts,lang.odds,oddsValue(record));
    body.append(facts);
    if(oddsValue(record)&&!hasOdds(record))body.append(text("p",lang.oddsCaveat,"journey-review-odds-note"));

    if(record.original_category==="experimental_prematch"){
      body.append(text("p",lang.experimental,"journey-review-disclosure"));
    }else if(record.no_verified_placed_bet || String(record.bet_value_status||"").startsWith("watch")){
      body.append(text("p",lang.watch,"journey-review-disclosure"));
    }

    const review=record.public_review && (english?record.public_review.en:record.public_review.ru);
    if(review){
      appendSection(body,lang.why,review.reason);
      appendSection(body,lang.risk,review.risk);
      appendSection(body,record.status==="pending"?lang.next:lang.happened,record.status==="pending"?review.outcome:review.outcome);
      appendSection(body,lang.lesson,review.lesson);
    }else{
      appendSection(body,lang.happened,record.status==="pending"?lang.pendingOutcome:lang.noReview);
    }

    const origin=safeSourceUrl(record.odds_source_url);
    if(origin){
      const link=document.createElement("a");
      link.href=origin;
      link.target="_blank";
      link.rel="noopener noreferrer";
      link.className="journey-review-original";
      link.textContent=lang.sourceLink+" ↗";
      body.append(link);
    }
    body.append(text("p",lang.publicOnly,"journey-review-privacy"));
    if(typeof modal.showModal==="function" && !modal.open)modal.showModal();
    else modal.setAttribute("open","");
    $("review-close")?.focus();
  }
  function closeReview(){
    if(!modal)return;
    if(typeof modal.close==="function" && modal.open)modal.close();
    else {modal.removeAttribute("open");returnFocus?.focus();}
  }
  $("review-close")?.addEventListener("click",closeReview);
  if(modal){
    modal.addEventListener("close",()=>{
      if(returnFocus && document.contains(returnFocus))returnFocus.focus({preventScroll:true});
      returnFocus=null;
    });
    modal.addEventListener("click",event=>{
      if(event.target!==modal)return;
      const r=modal.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeReview();
    });
    modal.addEventListener("keydown",event=>{
      if(event.key==="Escape" && typeof modal.close!=="function"){
        event.preventDefault();closeReview();
      }
    });
  }

  function makeMatchCard(record){
    const n=record.number;
    const card=document.createElement("article");
    card.className="journey-match-card journey-match-card--"+record.status;
    card.id="prediction-match-"+n;

    const head=document.createElement("div");
    head.className="journey-match-card-header";
    head.append(text("span","#"+String(n).padStart(2,"0")+" · "+formatDate(record.date),"journey-match-card-date"));
    head.append(text("span",stateLabel(record.status),"journey-match-card-status journey-match-card-status--"+record.status));
    card.append(head);
    const main=document.createElement("div");main.className="journey-match-card-main";
    main.append(text("h4",translated(record,"match"),"journey-match-card-name"));
    if(translated(record,"competition"))main.append(text("p",translated(record,"competition"),"journey-match-card-league"));
    card.append(main);
    const facts=document.createElement("div");facts.className="journey-match-card-facts";
    const prediction=document.createElement("div");prediction.className="journey-match-card-pick";
    prediction.append(text("span",lang.pick),text("strong",translated(record,"pick")));
    const score=document.createElement("div");score.className="journey-match-card-score";
    score.append(text("span",lang.score),text("strong",record.score||"—"));
    facts.append(prediction,score);card.append(facts);
    if(oddsValue(record)){
      const odds=document.createElement("div");odds.className="journey-match-card-odds";
      odds.append(text("span",lang.odds),text("strong",oddsValue(record)));
      card.append(odds);
    }
    card.append(text("span",lang.view+" →","journey-match-card-cta"));
    const open=document.createElement("button");
    open.type="button";
    open.className="journey-match-card-open";
    open.setAttribute("aria-label",lang.open+" "+translated(record,"match")+" (#"+n+")");
    open.addEventListener("click",()=>openReview(record));
    card.append(open);
    return card;
  }

  function renderOfficial(items){
    const valid=items.filter(x=>x && x.official===true && Number.isInteger(x.number) && x.number>=1 && x.number<=100 && ["win","loss","pending"].includes(x.status));
    const by=new Map(valid.map(x=>[x.number,x]));
    ordered=[...by.values()].sort((a,b)=>b.number-a.number);
    activeIndex=0;
    const n=by.size;
    const wins=ordered.filter(x=>x.status==="win").length;
    const losses=ordered.filter(x=>x.status==="loss").length;
    const pending=ordered.filter(x=>x.status==="pending").length;
    set("eyebrow",lang.eyebrow);set("title",lang.title);set("subtitle",lang.subtitle);
    set("picks-title",lang.picks);set("wins-title",lang.wins);set("losses-title",lang.losses);
    set("pending-title",lang.pending);set("pending-count",pending);
    set("n",n);set("picks-metric",n+" / 100");set("wins",wins);set("losses",losses);set("remaining",100-n);
    set("matches-title",lang.matchesTitle);set("matches-count",n);
    set("grid-title",lang.gridTitle);set("hint",lang.hint);set("note",lang.note);set("updated",lang.published);
    const progress=$("track");if(progress)progress.style.width=n+"%";
    $("track-container")?.setAttribute("aria-valuenow",String(n));
    $("track-container")?.setAttribute("aria-label",lang.picks+": "+n+" / 100");

    if(track){
      track.replaceChildren();
      for(const item of ordered)track.append(makeMatchCard(item));
      if(!ordered.length)track.append(text("p",lang.noMatches,"journey-match-loading"));
    }
    if(viewport)viewport.scrollLeft=0;
    updateCarouselNav();

    const grid=$("grid");
    if(!grid)return;
    grid.replaceChildren();
    for(let i=1;i<=100;i++){
      const record=by.get(i);
      const cell=document.createElement("button");
      cell.type="button";
      cell.textContent=i;
      cell.className="journey-cell journey-cell--"+(record?record.status:"future");
      cell.setAttribute("aria-label","#"+i+": "+(record?translated(record,"match")+" · "+translated(record,"pick")+" · "+stateLabel(record.status):lang.emptyCell));
      cell.title=record?translated(record,"match")+" · "+stateLabel(record.status):lang.emptyCell;
      cell.disabled=!record;
      if(record){
        cell.setAttribute("aria-pressed",record.number===ordered[0]?.number?"true":"false");
        cell.addEventListener("click",()=>{
          const index=ordered.findIndex(x=>x.number===record.number);
          if(index>=0)goToIndex(index,false);
          openReview(record);
        });
      }
      grid.append(cell);
    }
    updateCarouselNav();
  }

  function renderArchive(data){
    const valid=data.filter(x=>x&&x.official===false&&["win","loss"].includes(x.status));
    const wins=valid.filter(x=>x.status==="win").length;
    const losses=valid.filter(x=>x.status==="loss").length;
    set("archive-title",lang.archive);
    set("archive-count",valid.length+" · "+wins+" "+lang.archiveWins+" / "+losses+" "+lang.archiveLosses);
    set("archive-note",lang.archivedNote);
    const list=$("archive-list");if(!list)return;
    list.replaceChildren();
    for(const row of valid){
      const item=document.createElement("article");item.className="journey-archive-card";
      const left=document.createElement("div");
      left.append(text("strong",translated(row,"match")));
      left.append(text("span",formatDate(row.date)+" · "+translated(row,"pick")));
      const right=document.createElement("div");right.className="journey-archive-result";
      right.append(text("strong",row.score));
      right.append(text("small",stateLabel(row.status),"journey-result--"+row.status));
      item.append(left,right);list.append(item);
    }
    if(!valid.length)$("archive").hidden=true;
  }

  getData("predictions.json").then(renderOfficial).catch(error=>{
    console.warn("Football journey data:",error);
    set("hint",lang.invalid);
  });
  getData("predictions-archive.json").then(renderArchive).catch(error=>{
    console.warn("Football archive:",error);
    if($("archive"))$("archive").hidden=true;
  });
})();