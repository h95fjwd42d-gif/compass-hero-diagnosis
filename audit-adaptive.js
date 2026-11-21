const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const heroes=JSON.parse(fs.readFileSync(__dirname+'/heroes.json'));
const questions=JSON.parse(fs.readFileSync(__dirname+'/questions.json'));
const ctx={document:{getElementById:()=>({textContent:''})},console};
vm.createContext(ctx);
vm.runInContext(script.slice(0,script.indexOf('try{heroes=JSON.parse')),ctx);
vm.runInContext('heroes='+JSON.stringify(heroes)+';questions='+JSON.stringify(questions)+';for(const h of heroes){for(const t of new Set([...(roleTags[h.role]||[]),...(h.tags||[])])){tagFrequency[t]=(tagFrequency[t]||0)+1}}',ctx);
const report=vm.runInContext(`(()=>{
 const qmap=new Map(questions.map(q=>[q.id,q]));const paths=[];
 function walk(id,ans){if(id===null){paths.push(ans);return}const q=qmap.get(id);if(!q)throw Error('missing '+id);for(const yes of [true,false])walk(yes?q.yes:q.no,[...ans,{id:q.id,tag:q.tag,yes}])}
 walk('start',[]);
 const before=new Set(),after=new Set(),afterTop3=new Set(),never=new Set(heroes.map(h=>h.id));
 let trials=0,adaptiveQuestions=0,changedWinner=0,duplicateAdaptive=0,adaptiveTie=0,normalTie=0,rinneCandidate=0;
 for(const path of paths.filter((_,i)=>i%56===0)){
  history=path.slice();let ranked=heroes.map(h=>({id:h.id,score:scoreHero(h)})).sort(compareRank);before.add(ranked[0].id);const baselineWinner=ranked[0].id;
  if(ranked[0].score===ranked[1].score)normalTie++;
  if(path.some(a=>a.id==='trap'&&a.yes)&&ranked.slice(0,5).some(h=>h.id==='h37'))rinneCandidate++;
  // 16 possible answer sequences through up to four adaptively chosen questions.
  for(let mask=0;mask<16;mask++){
   history=path.slice();const used=new Set(path.map(a=>a.tag));let count=0;
   for(let i=0;i<4;i++){
    const tag=chooseAdaptiveTag();if(!tag)break;
    if(used.has(tag))duplicateAdaptive++;
    used.add(tag);history.push({id:'adaptive-'+i,tag,yes:!!(mask&(1<<i))});count++;
   }
   adaptiveQuestions+=count;trials++;
   ranked=heroes.map(h=>({id:h.id,score:scoreHero(h)})).sort(compareRank);
   after.add(ranked[0].id);ranked.slice(0,3).forEach(h=>afterTop3.add(h.id));never.delete(ranked[0].id);
   if(ranked[0].id!==baselineWinner)changedWinner++;
   if(ranked[0].score===ranked[1].score)adaptiveTie++;
   const ev=heroes.map(h=>({id:h.id,score:evaluate(h).score})).sort(compareRank);
   if(ev[0].id!==ranked[0].id)throw Error('score mismatch');
  }
 }
 if(duplicateAdaptive)throw Error('duplicate adaptive question');
 return {normalPaths:paths.length,sampledNormalPaths:Math.ceil(paths.length/56),adaptiveAnswerTrials:trials,adaptiveQuestionsAsked:adaptiveQuestions,uniqueFirstBefore:before.size,uniqueFirstAfter:after.size,uniqueTop3After:afterTop3.size,normalTies:normalTie,adaptiveTies:adaptiveTie,rinneCandidatePaths:rinneCandidate,neverFirstAfter:[...never].map(id=>heroes.find(h=>h.id===id).name),duplicateAdaptiveQuestions:duplicateAdaptive};
})()`,ctx,{timeout:120000});
fs.writeFileSync(__dirname+'/diagnosis-audit-adaptive.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
