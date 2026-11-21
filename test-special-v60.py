from pathlib import Path
from playwright.sync_api import sync_playwright
html=Path(__file__).with_name('index.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 # Exercise the special question UI from the condition-triggered state; this is not a reachability test.
 page.evaluate('specialStage=0;render()')
 assert '追加の確認質問 1／4' in page.locator('#app').inner_text()
 for i in range(4):
  page.get_by_role('button',name='はい').click()
 assert page.evaluate('specialPassed') is True
 assert page.evaluate('specialStage') == -1
 page.evaluate('reset();specialStage=0;render()')
 page.get_by_role('button',name='いいえ').click()
 assert page.evaluate('specialDismissed') is True
 assert page.evaluate('specialPassed') is False
 page.evaluate('reset();specialStage=0;render()')
 page.get_by_role('button',name='はい').click()
 page.get_by_role('button',name='1問戻る').count() == 0
 page.evaluate('back()')
 assert page.evaluate('specialStage') == 0
 assert not errors,errors
 print('PASS special UI: 4 yes, no dismiss, back state, no page errors (forced entry)')
 browser.close()
