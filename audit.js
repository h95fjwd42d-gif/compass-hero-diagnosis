const fs=require('fs'),vm=require('vm'),assert=require('assert');
const dir=__dirname,html=fs.readFileSync(dir+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const heroes=JSON.parse(fs.readFileSync(dir+'/heroes.json'));
const questions=JSON.parse(fs.readFileSync(dir+'/questions.json'));
const context={document:{getElementById:()=>({textContent:''})},navigator:{},console};
vm.createContext(context);
vm.runInContext(script.slice(0,script.indexOf('try{heroes=JSON.parse')),context);
vm.runInContext('heroes='+JSON.stringify(heroes)+';questions='+JSON.stringify(questions)+';for(const h of heroes){for(const t of new Set([...(roleTags[h.role]||[]),...(h.tags||[])])){tagFrequency[t]=(tagFrequency[t]||0)+1}}',context);
const report=vm.runInContext(`(()=>{
 const qmap=new Map(questions.map(q=>[q.id,q]));
 const paths=[];
 function traverse(id,answers){if(id===null){paths.push(answers);return;}const q=qmap.get(id);if(!q)throw Error('missing question '+id);for(const yes of [true,false])traverse(yes?q.yes:q.no,[...answers,{id:q.id,tag:q.tag,yes}]);}
 traverse('start',[]);
 const top1=new Set(),top3=new Set(),neverTop1=new Set(heroes.map(h=>h.id));let ties=0,adaptiveOffered=0,rinneTriggers=0,duplicateTagPaths=0;
 for(const answers of paths.filter((_,i)=>i%7===0)){history=answers;
  const ranked=heroes.map(h=>({id:h.id,score:scoreHero(h)})).sort(compareRank);
  top1.add(ranked[0].id);neverTop1.delete(ranked[0].id);ranked.slice(0,3).forEach(h=>top3.add(h.id));
  if(ranked[0].score===ranked[1].score)ties++;
  if(chooseAdaptiveTag())adaptiveOffered++;
  if(new Set(answers.map(a=>a.tag)).size<answers.length)duplicateTagPaths++;
  if(answers.some(a=>a.id==='trap'&&a.yes)&&ranked.slice(0,5).some(x=>x.id==='h37'))rinneTriggers++;
  const rankedEval=heroes.map(h=>({id:h.id,score:evaluate(h).score})).sort(compareRank);
  if(rankedEval[0].id!==ranked[0].id)throw Error('evaluate/score mismatch');
 }
 history=[{id:'a',tag:'攻撃',yes:true},{id:'b',tag:'攻撃',yes:true}];const twice=scoreHero(heroes[0]);
 history=[{id:'b',tag:'攻撃',yes:true}];const once=scoreHero(heroes[0]);
 if(twice!==once)throw Error('duplicate tag inflated score');
 const specialBranch=String(renderSpecial).includes('specialDismissed=true')&&String(renderSpecial).includes('specialPassed=true');
 if(!specialBranch)throw Error('special branch missing');
 return {version:'2.9',normalAnswerPaths:paths.length,sampledPaths:Math.ceil(paths.length/7),uniqueFirstPlaceHeroes:top1.size,heroesAppearingTop3:top3.size,topScoreTies:ties,adaptiveQuestionAvailable:adaptiveOffered,pathsWithRepeatedTags:duplicateTagPaths,rinnePotentialPaths:rinneTriggers,neverFirstPlace:[...neverTop1].map(id=>heroes.find(h=>h.id===id).name),duplicateTagScoreTest:'passed',specialBranchSourceCheck:'passed',notes:'512 sampled normal paths scored with real scoring; special route source-checked; browser interaction not yet tested.'};
})()`,context,{timeout:30000});
assert.equal(heroes.length,51);assert.equal(new Set(heroes.map(h=>h.id)).size,51);
fs.writeFileSync(dir+'/diagnosis-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
