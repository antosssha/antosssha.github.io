(() => {
  "use strict";
  const node=document.querySelector("[data-ninety-preview]");
  if(!node)return;
  const english=document.documentElement.lang==="en";
  const set=(key,value)=>{
    const el=node.querySelector('[data-ninety="'+key+'"]');
    if(el)el.textContent=value;
  };
  fetch("predictions.json",{cache:"no-store"}).then(response=>{
    if(!response.ok)throw Error("Prediction journal unavailable");
    return response.json();
  }).then(rows=>{
    if(!Array.isArray(rows))return;
    const used=rows.filter(item=>item&&item.official===true&&Number.isInteger(item.number)&&item.number>=1&&item.number<=100&&["win","loss","pending","void"].includes(item.status));
    const by=new Map(used.map(item=>[item.number,item]));
    const list=[...by.values()],count=list.length;
    const wins=list.filter(x=>x.status==="win").length;
    const losses=list.filter(x=>x.status==="loss").length;
    const voids=list.filter(x=>x.status==="void").length;
    const pending=list.filter(x=>x.status==="pending").length;
    const graded=wins+losses;
    const pct=graded?new Intl.NumberFormat(english?"en-US":"ru-RU",{maximumFractionDigits:2}).format(100*wins/graded)+"%":"—";
    const summary=english
      ?wins+" won · "+losses+" lost"+(voids?" · "+voids+" void":"")+(pending?" · "+pending+" pending":"")
      :wins+" верно · "+losses+" ошибок"+(voids?" · "+voids+" прерван":"")+(pending?" · "+pending+" ожидают":"");
    set("counter",String(count));
    set("meta",count+"/100");
    set("summary",summary);
    set("accuracy",pct);
    const bar=node.querySelector('[data-ninety="progress"]');
    if(bar)bar.style.width=count+"%";
    node.setAttribute("aria-label",(english?"Public series: ":"Публичная серия: ")+count+" / 100. "+summary);
  }).catch(error=>console.warn("Public prediction preview:",error));
})();