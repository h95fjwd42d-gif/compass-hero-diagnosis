const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const hero=JSON.parse(fs.readFileSync(__dirname+'/heroes.json','utf8'));
const el=()=>({children:[],childElementCount:0,style:{},append(...x){this.children.push(...x);this.childElementCount=this.children.length},replaceChildren(...x){this.children=x;this.childElementCount=x.length},addEventListener(){},replaceWith(){}});
const app=el(),catalog=el();const document={getElementById(id){if(id==='app')return app;if(id==='hero-catalog')return el();if(id==='hero-grid')return catalog;if(id==='hero-data')return {textContent:JSON.stringify(hero)};if(id==='profile-data')return {textContent:fs.readFileSync(__dirname+'/profiles.json','utf8')};return null},createElement:el,createDocumentFragment:el,createTextNode:()=>el()};
const ctx=vm.createContext({document,console});vm.runInContext(js,ctx);const run=s=>vm.runInContext(s,ctx);
for(const mode of ['true','false','Math.random()>.5']){run('reset()');let n=0;while(run('history.length')<20){if(++n>40)throw Error('loop');if(run('specialStage')>=0){run('specialStage=-1;specialDismissed=true;render()');}else run(`answer(${mode})`);}assert.equal(run('history.length'),20);assert.equal(run('ranked().length'),51);run('back()');assert.equal(run('history.length'),19);}
console.log('PASS: 3 patterns x 20 answers, 51 hero ranking, back button');
