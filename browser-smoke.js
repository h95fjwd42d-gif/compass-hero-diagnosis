(function(){
 const tests=[];
 const record=(name,ok,detail='')=>tests.push({name,ok,detail});
 const click=(label)=>{const b=[...app.querySelectorAll('button')].find(x=>x.textContent===label);if(!b)throw Error('button '+label+' missing');b.click()};
 function normalFinish(){let n=0;while(current!==null||specialStage>=0||app.querySelector('button')?.textContent==='はい'){if(++n>45)throw Error('quiz did not finish');if(specialStage>=0)click('いいえ');else if(app.querySelector('button')?.textContent==='はい')click('いいえ');else break;}}
 try{reset();normalFinish();record('通常診断の完了',app.textContent.includes('あなたに合いそうなヒーロー'));}catch(e){record('通常診断の完了',false,String(e))}
 try{reset();click('はい');click('1問戻る');record('戻る操作',current==='start'&&history.length===0);}catch(e){record('戻る操作',false,String(e))}
 // Find a real normal question answer path which makes Rin'ne likely at trap.
 function findSpecial(){const qmap=new Map(questions.map(q=>[q.id,q]));let found=null;function dfs(id,path){if(found)return;if(id==='trap'){for(const yn of [true]){reset();for(const x of [...path,yn])click(x?'はい':'いいえ');if(specialStage===0){found=[...path,yn];return}}return;}const q=qmap.get(id);if(!q)return;for(const yn of [true,false])dfs(yn?q.yes:q.no,[...path,yn])}dfs('start',[]);return found}
 let path=null;try{path=findSpecial();record('輪廻ルートへの到達',!!path,path?path.map(x=>x?1:0).join(''):'not reachable')}catch(e){record('輪廻ルートへの到達',false,String(e))}
 if(path){
 try{reset();path.forEach(x=>click(x?'はい':'いいえ'));click('はい');click('1問戻る');record('隠し質問から1問戻る',specialStage===0);click('1問戻る');record('隠し質問の先頭から通常質問に戻る',specialStage===-1&&current==='trap');}catch(e){record('隠し質問の戻る操作',false,String(e))}
 try{reset();path.forEach(x=>click(x?'はい':'いいえ'));click('いいえ');record('輪廻ルートいいえで復帰',specialStage===-1&&specialDismissed===true&&specialPassed===false&&current!=='start');normalFinish();record('復帰後に通常結果まで完走',app.textContent.includes('あなたに合いそうなヒーロー'));}catch(e){record('輪廻ルートいいえで復帰',false,String(e))}
 try{reset();path.forEach(x=>click(x?'はい':'いいえ'));for(let i=0;i<4;i++)click('はい');record('輪廻ルート4問はい',specialPassed===true&&specialStage===-1);normalFinish();record('輪廻ルート完走後の結果',app.textContent.includes('あなたに合いそうなヒーロー'));}catch(e){record('輪廻ルート4問はい',false,String(e))}
 }
 try{reset();record('リセット',current==='start'&&history.length===0&&specialStage===-1)}catch(e){record('リセット',false,String(e))}
 document.body.innerHTML='<pre id="test-report">'+JSON.stringify({tests,passed:tests.filter(x=>x.ok).length,total:tests.length})+'</pre>';
})();