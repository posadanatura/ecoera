const { chromium } = require('playwright'); const fs=require('fs');
const PAGES=[['home',null],['species','Wildlife'],['science','Science'],['posada','Visit'],['about','About'],['support','Donate'],['funders','__funders']];
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1360,height:900}});
 await p.goto('http://localhost:8767/'); await p.waitForTimeout(2500);
 const out={pages:[]};
 for(const [id,label] of PAGES){
   await p.evaluate(([id,label])=>{
     const navBtns=[...document.querySelectorAll('nav a, nav button')];
     const byText=t=>navBtns.find(e=>e.textContent.trim()===t);
     if(id==='home') navBtns[0].click();
     else if(label==='__funders'){ byText('Donate').click(); }
     else byText(label).click();
   },[id,label]);
   await p.waitForTimeout(900);
   if(label==='__funders'){ await p.evaluate(()=>{const e=[...document.querySelectorAll('a,button')].find(e=>/funder/i.test(e.textContent)); e&&e.click();}); await p.waitForTimeout(900); }
   // scroll through to trigger reveals
   const h=await p.evaluate(()=>document.body.scrollHeight);
   for(let y=0;y<h+900;y+=500){ await p.evaluate(y=>window.scrollTo(0,y),y); await p.waitForTimeout(70); }
   await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(600);
   const snap=await p.evaluate(()=>{
     const root=document.querySelector('x-dc')||document.body;
     const c=root.cloneNode(true);
     c.querySelectorAll('script,template,helmet,noscript').forEach(e=>e.remove());
     const hidden=[...c.querySelectorAll('[style]')].filter(e=>/opacity:\s*0(\D|$)/.test(e.getAttribute('style'))).length;
     const imgs=[...c.querySelectorAll('img')].map(i=>i.getAttribute('src')).slice(0,5);
     return {html:c.innerHTML, hidden, imgs, first:[...document.querySelectorAll('main > section')].slice(0,2).map(s=>s.getAttribute('data-screen-label'))};
   });
   out.pages.push({id, html:snap.html});
   console.log(id, 'kb', Math.round(snap.html.length/1024), 'opacity0', snap.hidden, snap.first, snap.imgs.slice(0,3));
 }
 out.styles=await p.evaluate(()=>[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n'));
 console.log('styles kb', Math.round(out.styles.length/1024));
 fs.writeFileSync(process.argv[2]+'/pages-raw.json', JSON.stringify(out));
 await b.close();
})();
