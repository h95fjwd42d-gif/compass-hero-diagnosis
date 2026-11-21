const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const hero=JSON.parse(fs.readFileSync(__dirname+'/heroes.json','utf8'));
const questions=JSON.parse(fs.readFileSync(__dirname+'/questions.json','utf8'));
const el=()=>({children:[],textContent:'',className:'',append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},addEventListener(){},setAttribute(){}});
const app=el();const doc={getElementById(id){if(id==='app')return app;if(id==='hero-data')return {textContent:JSON.stringify(hero)};if(id==='question-data')return {textContent:JSON.stringify(questions)};return null},createElement:el};
const ctx=vm.createContext({document:doc,console});vm.runInContext(js,ctx);
function state(){return vm.runInContext('({current,specialStage,specialPassed,specialDismissed,adaptiveCount,historyLength:history.length})',ctx)}
function run(code){return vm.runInContext(code,ctx)}
const tests=[];function test(name,fn){try{fn();tests.push({name,ok:true})}catch(e){tests.push({name,ok:false,error:e.message})}}
function finish(){let steps=0;while(state().current!==null||state().specialStage>=0){if(++steps>45)throw Error('infinite loop');if(state().specialStage>=0)run('specialStage=-1;specialDismissed=true;render()');else if(state().current==='adaptive')run('history.push({id:"adaptive-"+adaptiveCount,tag:adaptiveTag,yes:false});adaptiveCount++;adaptiveTag=null;current=adaptiveCount>=4?null:"adaptive";render()');else run('answer(false)')}}
function pathToSpecial(){let result=null;const nodes=new Map(questions.map(x=>[x.id,x]));function dfs(id,path){if(result)return;if(id==='trap'){run('reset()');for(const b of [...path,true])run('answer('+b+')');if(state().specialStage===0)result=[...path,true];return;}const q=nodes.get(id);if(!q)return;dfs(q.yes,[...path,true]);dfs(q.no,[...path,false]);}dfs('start',[]);return result}
test('normal finish',()=>{run('reset()');finish();assert.equal(state().current,null)});
test('back',()=>{run('reset();answer(true);back()');assert.equal(state().current,'start');assert.equal(state().historyLength,0)});
let path;
test('Rinne route reachable',()=>{path=pathToSpecial();assert(path,'route unreachable')});
if(path){test('no returns to normal',()=>{run('reset()');path.forEach(b=>run('answer('+b+')'));run('specialStage=-1;specialPassed=false;specialDismissed=true;render()');assert.equal(state().specialStage,-1);assert.equal(state().specialDismissed,true);finish();assert.equal(state().current,null)});
test('four yes passes',()=>{run('reset()');path.forEach(b=>run('answer('+b+')'));assert.equal(state().specialStage,0);run('specialStage=4;specialPassed=true;specialStage=-1;render()');assert.equal(state().specialPassed,true);finish();assert.equal(state().current,null)});}
test('reset',()=>{run('reset()');assert.equal(state().current,'start');assert.equal(state().historyLength,0)});
const report={passed:tests.filter(t=>t.ok).length,total:tests.length,tests};fs.writeFileSync(__dirname+'/logic-test-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.passed!==report.total)process.exitCode=1;
