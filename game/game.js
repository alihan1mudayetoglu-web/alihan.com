(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const panelTitle = document.getElementById('panelTitle');
  const panelText = document.getElementById('panelText');
  const heroBird = document.getElementById('heroBird');
  const startButton = document.getElementById('startButton');
  const resumeButton = document.getElementById('resumeButton');
  const subview = document.getElementById('subview');
  const menuActions = document.getElementById('menuActions');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('bestScore');
  const pauseButton = document.getElementById('pauseButton');
  const touchHint = document.getElementById('touchHint');
  const skins = [
    {name:'Altın', src:'img/1.png'}, {name:'Bulut', src:'img/2.png'},
    {name:'456', src:'img/3..png'}, {name:'Cadı', src:'img/4..png'}, {name:'Düdük', src:'img/5..png'}
  ];
  const loaded = skins.map(s => { const im = new Image(); im.src = s.src; return im; });
  let state = 'menu', selectedSkin = 0, score = 0, best = Number(localStorage.getItem('kanatBest') || 0);
  let bird, pipes, particles, lastTime = 0, spawnTimer = 0, audioCtx = null, muted = false;
  let width = 0, height = 0, dpr = 1, world = {ground:0};
  bestEl.textContent = best;

  function resize(){
    const rect = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height; canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0); world.ground = height - Math.max(54, height*.105);
    if (!bird || state === 'menu') resetBird(); draw();
  }
  function resetBird(){bird={x:width*.28,y:height*.44,vy:0,rotation:0};pipes=[];particles=[];score=0;spawnTimer=.7;scoreEl.textContent='0'}
  function showMenu(mode='main'){
    state='menu'; overlay.classList.remove('hidden'); menuActions.hidden=false; subview.hidden=true;
    touchHint.style.display='none'; resumeButton.hidden=mode!=='pause'; startButton.hidden=mode==='pause';
    if(mode==='pause'){panelTitle.innerHTML='Bir mola<br><em>verelim!</em>';panelText.textContent='Gökyüzü seni bekliyor. Hazır olduğunda devam et.'}
    else if(mode==='over'){panelTitle.innerHTML='Uçuş sona<br><em>erdi!</em>';panelText.textContent=`Harika deneme! ${score} boruyu geçtin. Bir tur daha?`}
    else {panelTitle.innerHTML='Kanatlarını<br><em>aç!</em>';panelText.innerHTML='Boruların arasından süzül, rekorunu kır.<br>Her dokunuşta bir kanat çırpışı!'}
    heroBird.src=skins[selectedSkin].src; draw();
  }
  function begin(){resetBird();state='playing';overlay.classList.add('hidden');touchHint.style.display='block';lastTime=performance.now();requestAnimationFrame(loop);sound(620,.07)}
  function flap(){if(state!=='playing')return;bird.vy=-height*.64;bird.rotation=-.35;sound(500,.055);for(let i=0;i<3;i++)particles.push({x:bird.x-14,y:bird.y+5,vx:-30-Math.random()*30,vy:(Math.random()-.5)*50,life:.3})}
  function pause(){if(state==='playing')showMenu('pause')}
  function sound(freq,duration){if(muted)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch{}}
  function addPipe(){const gap=Math.max(145,height*.29),margin=75,top=margin+Math.random()*(world.ground-gap-margin*2);pipes.push({x:width+30,top,gap,scored:false})}
  function gameOver(){if(state!=='playing')return;state='over';sound(180,.25);if(score>best){best=score;localStorage.setItem('kanatBest',best);bestEl.textContent=best}setTimeout(()=>showMenu('over'),450)}
  function loop(now){if(state!=='playing')return;const dt=Math.min((now-lastTime)/1000,.035);lastTime=now;update(dt);draw();if(state==='playing')requestAnimationFrame(loop)}
  function update(dt){
    bird.vy+=height*1.75*dt;bird.y+=bird.vy*dt;bird.rotation=Math.min(.9,Math.max(-.45,bird.vy/(height*.9)));
    spawnTimer-=dt;if(spawnTimer<=0){addPipe();spawnTimer=1.65}
    const speed=width*.38; for(const p of pipes){p.x-=speed*dt;if(!p.scored&&p.x+58<bird.x){p.scored=true;score++;scoreEl.textContent=score;sound(850,.09)}}
    pipes=pipes.filter(p=>p.x>-80);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);
    const r=15, bx=bird.x, by=bird.y;
    if(by+r>=world.ground||by-r<=0){gameOver();return}
    for(const p of pipes){if(bx+r>p.x&&bx-r<p.x+58&&(by-r<p.top||by+r>p.top+p.gap)){gameOver();return}}
  }
  function draw(){
    if(!width||!height)return;
    const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#84d1ed');sky.addColorStop(.68,'#c4e9ee');sky.addColorStop(1,'#f5e8b4');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    // Distant layered hills
    ctx.fillStyle='#b6dfc8';ctx.beginPath();ctx.moveTo(0,world.ground);for(let x=0;x<=width+40;x+=40)ctx.lineTo(x,world.ground-38-Math.sin(x*.012+performance.now()*.00008)*19);ctx.lineTo(width,world.ground);ctx.fill();
    ctx.fillStyle='#d4e5a8';ctx.beginPath();ctx.moveTo(0,world.ground);for(let x=0;x<=width+35;x+=35)ctx.lineTo(x,world.ground-20-Math.sin(x*.018+1)*11);ctx.lineTo(width,world.ground);ctx.fill();
    drawCloud(width*.17,height*.17,1);drawCloud(width*.73,height*.28,.75);drawCloud(width*.55,height*.1,.48);
    for(const p of pipes)drawPipe(p);
    // Ground strip
    ctx.fillStyle='#dfbd70';ctx.fillRect(0,world.ground,width,height-world.ground);ctx.fillStyle='#82c783';ctx.fillRect(0,world.ground,width,10);
    ctx.fillStyle='#f1d28a';for(let x=-20;x<width+30;x+=26)ctx.fillRect(x,world.ground+17,13,5);
    for(const q of particles){ctx.globalAlpha=Math.max(0,q.life/.3);ctx.fillStyle='#fff3b0';ctx.fillRect(q.x,q.y,4,4)}ctx.globalAlpha=1;
    if(bird){ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(bird.rotation||0);const im=loaded[selectedSkin];if(im.complete&&im.naturalWidth){const size=selectedSkin>=3?66:58;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,-size/2,-size/2,size,size)}else{ctx.fillStyle='#ffd34c';ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fill()}ctx.restore()}
  }
  function drawCloud(x,y,s){ctx.fillStyle='#ffffff85';ctx.beginPath();ctx.arc(x,y,19*s,0,Math.PI*2);ctx.arc(x+19*s,y-7*s,23*s,0,Math.PI*2);ctx.arc(x+43*s,y,17*s,0,Math.PI*2);ctx.fill()}
  function drawPipe(p){const w=58,cap=9;const grad=ctx.createLinearGradient(p.x,0,p.x+w,0);grad.addColorStop(0,'#198e7b');grad.addColorStop(.22,'#43c6a0');grad.addColorStop(.8,'#32aa8e');grad.addColorStop(1,'#168370');ctx.fillStyle=grad;ctx.strokeStyle='#116e66';ctx.lineWidth=2;
    ctx.fillRect(p.x,0,w,p.top-cap);ctx.strokeRect(p.x+1,0,w-2,p.top-cap);ctx.fillRect(p.x-5,p.top-cap-13,w+10,13);ctx.strokeRect(p.x-5,p.top-cap-13,w+10,13);
    const y=p.top+p.gap;ctx.fillRect(p.x,y+cap,w,world.ground-y-cap);ctx.strokeRect(p.x+1,y+cap,w-2,world.ground-y-cap);ctx.fillRect(p.x-5,y,w+10,13);ctx.strokeRect(p.x-5,y,w+10,13);
  }
  function showSub(which){menuActions.hidden=true;subview.hidden=false;heroBird.style.display='none';panelText.style.display='none';panelTitle.style.display='none';
    if(which==='skins'){subview.innerHTML=`<button class="back-button" data-back>← MENÜYE DÖN</button><h2>Kostümünü seç</h2><p>Gökyüzüne hangi görünüşle çıkıyorsun?</p><div class="skin-grid">${skins.map((s,i)=>`<button class="skin-card ${i===selectedSkin?'selected':''}" data-skin="${i}"><img src="${s.src}" alt="${s.name}"><span>${s.name}</span></button>`).join('')}</div>`}
    else{subview.innerHTML='<button class="back-button" data-back>← MENÜYE DÖN</button><h2>Nasıl oynanır?</h2><p><b>Dokun</b> ya da <b>Space / ↑</b> tuşuna basarak kanat çırp. Borulara ve yere çarpmadan aralıklardan geç; geçtiğin her boru sana bir puan kazandırır.</p><p>Duraklatmak için <b>Esc</b> tuşunu veya sol üstteki durdur düğmesini kullan.</p><p><b>Geliştirici:</b> Alihan</p>'}
    panelTitle.style.display='none';heroBird.style.display='none';
  }
  function backToMain(){panelTitle.style.display='';panelText.style.display='';heroBird.style.display='';subview.hidden=true;menuActions.hidden=false}
  document.getElementById('startButton').addEventListener('click',begin);resumeButton.addEventListener('click',()=>{state='playing';overlay.classList.add('hidden');touchHint.style.display='block';lastTime=performance.now();requestAnimationFrame(loop)});
  document.getElementById('costumesButton').addEventListener('click',()=>showSub('skins'));document.getElementById('aboutButton').addEventListener('click',()=>showSub('about'));
  subview.addEventListener('click',e=>{if(e.target.closest('[data-back]')){backToMain();return}const b=e.target.closest('[data-skin]');if(b){selectedSkin=Number(b.dataset.skin);heroBird.src=skins[selectedSkin].src;showSub('skins')}});
  pauseButton.addEventListener('click',pause);document.getElementById('brandHome').addEventListener('click',e=>{e.preventDefault();if(state==='playing')pause();else showMenu('main')});
  document.getElementById('soundButton').addEventListener('click',e=>{muted=!muted;e.currentTarget.textContent=muted?'×':'♫';e.currentTarget.setAttribute('aria-label',muted?'Sesi aç':'Sesi kapat')});
  window.addEventListener('keydown',e=>{if(['Space','ArrowUp'].includes(e.code)){e.preventDefault();if(state==='playing')flap();else if(state==='menu'&&!overlay.classList.contains('hidden')&&subview.hidden)begin()}if(e.code==='Escape'){e.preventDefault();if(state==='playing')pause();else if(state==='menu'){if(!subview.hidden)backToMain();else showMenu('main')}}});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(state==='playing')flap()});window.addEventListener('resize',resize);resize();showMenu('main');
})();
