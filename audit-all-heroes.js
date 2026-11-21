const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const heroes=JSON.parse(fs.readFileSync(__dirname+'/heroes.json'));
const questions=JSON.parse(fs.readFileSync(__dirname+'/questions.json'));
const ctx={document:{getElementById:()=>({textContent:''})},console};
vm.createContext(ctx);
vm.runInContext(script.slice(0,script.indexOf('try{heroes=JSON.parse')),ctx);
vm.runInContext('heroes='+JSON.stringify(heroes)+';questions='+JSON.stringify(questions)+';for(const h of heroes){for(const t of new Set([...(roleTags[h.role]||[]),...(h.tags||[])])){tagFrequency[t]=(tagFrequency[t]||0)+1}}',ctx);
const report=vm.runInContext(`(()=>{
 const map=new Map(questions.map(q=>[q.id,q])),paths=[];
 function walk(id,a){if(id===null){paths.push(a);return;}const q=map.get(id);for(const yes of [true,false])walk(yes?q.yes:q.no,[...a,{id:q.id,tag:q.tag,yes}]);}
 walk('start',[]);
 const targets=heroes.map(h=>h.name);
 const found={};for(const name of targets)found[name]=null;
 let total=0;
 for(const path of paths.filter((_,i)=>i%56===0)){
  for(const target of targets){if(found[target])continue;
   const hero=heroes.find(h=>h.name===target);history=path.slice();
   // Choose adaptive answers to favor the target's documented tags, without modifying scoring.
   const targetTags=new Set([...(roleTags[hero.role]||[]),...(hero.tags||[])]);
   const adaptive=[];
   for(let i=0;i<4;i++){
    const tag=chooseAdaptiveTag();if(!tag)break;
    const yes=targetTags.has(tag);history.push({id:'adaptive-'+i,tag,yes});adaptive.push({tag,yes});
   }
   total++;
   const ranked=heroes.map(h=>({id:h.id,name:h.name,score:scoreHero(h)})).sort(compareRank);
   if(ranked[0].id===hero.id)found[target]={normal:path.map(a=>({id:a.id,yes:a.yes})),adaptive,top3:ranked.slice(0,3)};
  }
  if(Object.values(found).every(Boolean))break;
 }
 return {normalPathsAvailable:paths.length,targetedTrials:total,witnesses:found,allHeroesConfirmed:Object.values(found).every(Boolean)};
})()`,ctx,{timeout:120000});
fs.writeFileSync(__dirname+'/diagnosis-audit-all-heroes.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({normalPathsAvailable:report.normalPathsAvailable,targetedTrials:report.targetedTrials,confirmed:Object.fromEntries(Object.entries(report.witnesses).map(([k,v])=>[k,!!v]))},null,2));
