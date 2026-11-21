from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess, time
server=subprocess.Popen(['python','-m','http.server','18765','--bind','127.0.0.1','--directory',str(Path(__file__).parent)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(0.5)
url='http://127.0.0.1:18765/index.html'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for mode,viewport in [('desktop',{'width':1280,'height':900}),('mobile',{'width':390,'height':844})]:
  page=browser.new_page(viewport=viewport)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(Path(__file__).with_name('index.html').read_text(encoding='utf-8'),wait_until='load')
  assert page.get_by_text('質問 1 ／ 20').count()==1,(mode,page.locator('#app').inner_text())
  page.get_by_role('button',name='はい').click()
  assert page.get_by_text('質問 2 ／ 20').count()==1
  page.get_by_role('button',name='1問戻る').click()
  assert page.get_by_text('質問 1 ／ 20').count()==1
  for i in range(20):
   if page.locator('#app').get_by_text('追加の確認質問',exact=False).count():page.get_by_role('button',name='いいえ').click()
   page.get_by_role('button',name='いいえ').click()
  assert page.get_by_text('あなたに合いそうなヒーロー').count()==1,(mode,page.locator('#app').inner_text())
  assert page.locator('.hero-result').count()==3
  page.get_by_text('回答を振り返る').click()
  assert page.locator('.answer-review li').count()==20
  page.get_by_role('button',name='1問戻る').click()
  assert page.get_by_text('質問 20 ／ 20').count()==1
  page.get_by_role('button',name='はい').click()
  assert page.locator('.hero-result').count()==3
  page.get_by_role('button',name='もう一度診断する').click()
  assert page.get_by_text('質問 1 ／ 20').count()==1
  page.locator('#hero-catalog summary').click()
  page.wait_for_timeout(100);assert page.locator('.hero-tile').count()==51
  assert not errors,(mode,errors)
  print('PASS',mode,'20 questions, back, results, restart, 51 portraits, no JS errors')
  page.close()
 browser.close()
server.terminate()
