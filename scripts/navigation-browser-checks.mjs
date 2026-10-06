export async function checkNavigationStates(page,check){
 await page.setViewportSize({width:1440,height:1000});
 for(const theme of ['light','dark']){
  await page.locator('.app').evaluate((el,dark)=>el.classList.toggle('dark',dark),theme==='dark');
  const buttons=page.locator('.sidebar .side-item');
  for(let i=0;i<await buttons.count();i++){
   const button=buttons.nth(i);await button.scrollIntoViewIfNeeded();const before=await button.boundingBox();await button.hover();await page.waitForTimeout(180);
   const state=await button.evaluate(el=>{const s=getComputedStyle(el),a=getComputedStyle(el.closest('.app'));return {color:s.color,expected:a.getPropertyValue('--foreground').trim(),background:s.backgroundColor,opacity:s.opacity,visible:s.visibility,icon:el.querySelector('svg')?getComputedStyle(el.querySelector('svg')).color:s.color};});
   const after=await button.boundingBox();
   check(`${theme} navigation hover stays visible: ${await button.innerText()}`,state.color!==state.background&&state.icon===state.color&&state.opacity==='1'&&state.visible==='visible'&&Math.abs(before.width-after.width)<1&&Math.abs(before.height-after.height)<1,state);
  }
  await page.keyboard.press('Tab');const focus=await page.locator('.sidebar .side-item').first();await focus.focus();check(theme+' navigation keyboard focus is visible',await focus.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'));
 }
 await page.locator('.app').evaluate(el=>el.classList.remove('dark'));
 await page.locator('.sidebar .side-item').filter({hasText:'Back to workspace'}).hover();await page.waitForTimeout(180);await page.screenshot({path:'test-audit/browser-artifacts/navigation-hover-after.png',fullPage:true});
}
export async function checkTimeHeader(page,check){
 await page.setViewportSize({width:1440,height:1000});
 const weekly=()=>page.getByRole('tab',{name:'Weekly time sheets',exact:true});const payroll=()=>page.getByRole('tab',{name:'Review payroll',exact:true});
 await weekly().waitFor();
 for(const mode of ['weekly','payroll']){
  await (mode==='weekly'?weekly():payroll()).click();await page.getByRole('heading',{name:mode==='weekly'?'Time Sheets':'Payroll review',exact:true}).waitFor();
  check(mode+' mode switch is right aligned with separated title',await page.locator('.time-register-heading').evaluate(el=>{const h=el.getBoundingClientRect(),a=el.querySelector('.time-register-actions').getBoundingClientRect(),t=el.firstElementChild.getBoundingClientRect();return Math.abs(h.right-a.right)<2&&a.left-t.right>=20;}));
  await page.screenshot({path:`test-audit/browser-artifacts/time-header-${mode}-desktop.png`,fullPage:true});
 }
 await payroll().focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Time Sheets',exact:true}).waitFor();check('time view supports keyboard switching',await weekly().getAttribute('aria-selected')==='true');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 for(const mode of ['weekly','payroll']){
  await (mode==='weekly'?weekly():payroll()).click();await page.getByRole('heading',{name:mode==='weekly'?'Time Sheets':'Payroll review',exact:true}).waitFor();
  check(mode+' mobile header stacks without overflow',await page.locator('.time-register-heading').evaluate(el=>{const t=el.firstElementChild.getBoundingClientRect(),a=el.querySelector('.time-register-actions').getBoundingClientRect();return a.top>=t.bottom+15&&a.right<=innerWidth&&el.scrollWidth<=el.clientWidth;}));
  await page.screenshot({path:`test-audit/browser-artifacts/time-header-${mode}-mobile.png`,fullPage:true});
 }
 await weekly().click();await page.setViewportSize({width:1280,height:900});
}

export async function checkDashboardAccents(page,check){
 for(const dark of [false,true]){
  await page.locator('.app').evaluate((el,dark)=>el.classList.toggle('dark',dark),dark);
  const state=await page.locator('.dashboard-status-ribbon .stat').evaluateAll(tiles=>tiles.map(el=>{const heading=el.querySelector(':scope > span'),mark=getComputedStyle(heading,':before');return {label:heading.textContent,width:mark.width,height:mark.height,radius:mark.borderRadius,margin:mark.marginRight,background:getComputedStyle(el).backgroundColor,color:mark.backgroundColor};}));
  check((dark?'dark':'light')+' dashboard title marks are vertical on neutral cards',state.length===4&&state.every(t=>t.width==='4px'&&t.height==='18px'&&t.margin==='0px'&&t.background===state[0].background)&&state.map(t=>t.label).join('|')==='Active|On hold|Closed|Archived',state);
  check((dark?'dark':'light')+' Archived remains a neutral non-error status',state[3].color!==(dark?'rgb(255, 138, 130)':'rgb(225, 75, 67)'));
  await page.screenshot({path:`test-audit/browser-artifacts/dashboard-accents-${dark?'dark':'light'}.png`,fullPage:true});
 }
 await page.locator('.app').evaluate(el=>el.classList.remove('dark'));
}
