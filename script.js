const themeBtn=document.getElementById('themeBtn');
if(localStorage.getItem('pong-theme')==='light') document.documentElement.classList.add('light');
function updateThemeIcon(){if(themeBtn)themeBtn.textContent=document.documentElement.classList.contains('light')?'☀':'☾'}
updateThemeIcon();
if(themeBtn)themeBtn.onclick=()=>{document.documentElement.classList.toggle('light');localStorage.setItem('pong-theme',document.documentElement.classList.contains('light')?'light':'dark');updateThemeIcon()};

const canvas=document.getElementById('game');
if(canvas){
const ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height;
const scoreL=document.getElementById('leftScore'),scoreR=document.getElementById('rightScore');
const resetBtn=document.getElementById('resetBtn'),pauseBtn=document.getElementById('pauseBtn'),startBtn=document.getElementById('startBtn');
const soundBtn=document.getElementById('soundBtn'),countdownEl=document.getElementById('countdown');
const difficultyControl=document.getElementById('difficultyControl');
const difficultyTrigger=document.getElementById('difficultyTrigger');
const difficultyValue=document.getElementById('difficultyValue');
const difficultyMenu=document.getElementById('difficultyMenu');
const difficultyOptions=difficultyMenu?difficultyMenu.querySelectorAll('[data-difficulty]'):[];
const botBadge=document.getElementById('botBadge');
const statusText=document.getElementById('statusText'),roundFill=document.getElementById('roundFill'),rallyEl=document.getElementById('rallyCount');
const centerMessage=document.getElementById('centerMessage'),shell=document.getElementById('gameShell');
const overlay=document.getElementById('resultOverlay'),resultTitle=document.getElementById('resultTitle'),resultScore=document.getElementById('resultScore'),playAgainBtn=document.getElementById('playAgainBtn');

let leftScore=0,rightScore=0,paused=false,running=false,gameOver=false,soundOn=true,rally=0,last=0,flash=0,shake=0;
let difficulty='medium';
const BOT={
  easy:{speed:2.6,reaction:0.72,deadZone:34,noise:18,prediction:0.35},
  medium:{speed:4.7,reaction:0.88,deadZone:16,noise:7,prediction:0.58},
  hard:{speed:6.3,reaction:0.96,deadZone:7,noise:2,prediction:0.82},
  god:{speed:7.7,reaction:1,deadZone:0,prediction:1,noise:0}
};
let particles=[];
const keys={};
const paddleW=13,paddleH=112,paddleSpeed=7;
const left={x:28,y:H/2-paddleH/2,w:paddleW,h:paddleH,dy:0};
const right={x:W-41,y:H/2-paddleH/2,w:paddleW,h:paddleH,dy:0};
const ball={x:W/2,y:H/2,r:8,speed:6,vx:0,vy:0,stuck:true,trail:[]};

let audioCtx=null;
function beep(freq=450,duration=.045,type='sine',gain=.035){
 if(!soundOn)return;
 try{if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch(e){}
}
function status(t){if(statusText)statusText.textContent=t}
function updateHud(){scoreL.textContent=leftScore;scoreR.textContent=rightScore;rallyEl.textContent=rally;roundFill.style.width=Math.min(100,Math.max(leftScore,rightScore)/7*100)+'%'}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function resetBall(dir=1){ball.x=W/2;ball.y=H/2;ball.speed=6;const angle=Math.random()*(Math.PI/3)-Math.PI/6;ball.vx=dir*ball.speed*Math.cos(angle);ball.vy=ball.speed*Math.sin(angle);ball.stuck=false;ball.trail=[]}
function serve(dir){ball.stuck=true;ball.x=W/2;ball.y=H/2;centerMessage.classList.add('hidden');let n=3;countdownEl.textContent=n;status('READY');const timer=setInterval(()=>{if(paused||gameOver)return; n--; if(n>0){countdownEl.textContent=n;beep(280,.06)}else{clearInterval(timer);countdownEl.textContent='GO';beep(720,.08,'square');setTimeout(()=>countdownEl.textContent='',350);resetBall(dir);running=true;status('LIVE')}},650)}
function resetMatch(autoStart=false){leftScore=0;rightScore=0;rally=0;particles=[];gameOver=false;paused=false;running=false;left.y=H/2-paddleH/2;right.y=H/2-paddleH/2;updateHud();overlay.classList.remove('show');status('READY');centerMessage.textContent='CLICK START TO ENTER';centerMessage.classList.remove('hidden');if(autoStart)serve(Math.random()<.5?1:-1)}
function start(){if(gameOver){resetMatch(false)};if(running)return;paused=false;pauseBtn.textContent='Pause';centerMessage.classList.add('hidden');status(difficulty.toUpperCase()+' BOT');serve(Math.random()<.5?1:-1)}
function togglePause(){if(!running&&!paused)return;paused=!paused;pauseBtn.textContent=paused?'Resume':'Pause';status(paused?'PAUSED':'LIVE');if(paused)countdownEl.textContent='Ⅱ';else countdownEl.textContent=''}
function spawnBurst(x,y,color){for(let i=0;i<20;i++){particles.push({x,y,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,life:1,size:Math.random()*3+1,color})}}
function paddleHit(p,dir){
 const rel=(ball.y-(p.y+p.h/2))/(p.h/2),angle=rel*(Math.PI/3);ball.speed=Math.min(ball.speed*1.045,12);ball.vx=dir*ball.speed*Math.cos(angle);ball.vy=ball.speed*Math.sin(angle);ball.x=dir>0?p.x+p.w+ball.r+.5:p.x-ball.r-.5;rally++;updateHud();spawnBurst(ball.x,ball.y,dir>0?'#d7ff42':'#6ee7ff');beep(520+Math.abs(rel)*180,.035,'triangle');shake=3}
function score(side){
 if(side==='right')rightScore++;else leftScore++;
 rally=0;updateHud();flash=12;shake=10;spawnBurst(W/2,H/2,side==='right'?'#6ee7ff':'#d7ff42');beep(190,.11,'sawtooth',.05);
 if(leftScore>=7||rightScore>=7){gameOver=true;running=false;status(leftScore>rightScore?'VICTORY':'DEFEAT');resultTitle.textContent=leftScore>rightScore?'YOU WIN':'CPU WINS';resultScore.textContent=leftScore+' — '+rightScore;overlay.classList.add('show');return}
 serve(side==='left'?-1:1)
}
function update(dt){
 if(paused||!running)return;
 if(keys.ArrowUp||keys.w||keys.W)left.y-=paddleSpeed;
 if(keys.ArrowDown||keys.s||keys.S)left.y+=paddleSpeed;
 left.y=clamp(left.y,0,H-left.h);
 const bot=BOT[difficulty];
 let targetY=ball.y;
 // The bot predicts a little farther ahead on harder difficulties.
 if(ball.vx>0 && bot.prediction>0){
   const timeToPaddle=Math.max(0,(right.x-ball.x)/Math.max(1,ball.vx));
   targetY += ball.vy * timeToPaddle * bot.prediction * 0.55;
 }
 targetY += bot.noise ? (Math.sin(performance.now()/180)*bot.noise) : 0;
 const target=targetY-right.h/2;
 const diff=target-right.y;
 if(Math.abs(diff)>bot.deadZone){
   right.y += clamp(diff*bot.reaction,-bot.speed,bot.speed);
 }
 right.y=clamp(right.y,0,H-right.h);
 if(ball.stuck)return;
 ball.trail.push({x:ball.x,y:ball.y,a:.7});if(ball.trail.length>12)ball.trail.shift();
 ball.x+=ball.vx;ball.y+=ball.vy;
 if(ball.y-ball.r<=0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);beep(240,.025);spawnBurst(ball.x,ball.y,'#aab3c0')}
 if(ball.y+ball.r>=H){ball.y=H-ball.r;ball.vy=-Math.abs(ball.vy);beep(240,.025);spawnBurst(ball.x,ball.y,'#aab3c0')}
 if(ball.vx<0&&ball.x-ball.r<=left.x+left.w&&ball.x>left.x-10&&ball.y>=left.y&&ball.y<=left.y+left.h)paddleHit(left,1);
 if(ball.vx>0&&ball.x+ball.r>=right.x&&ball.x<right.x+right.w+10&&ball.y>=right.y&&ball.y<=right.y+right.h)paddleHit(right,-1);
 if(ball.x<-30)score('right'); if(ball.x>W+30)score('left');
 for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vx*=.98;p.vy*=.98;p.life-=dt*2.8}
 particles=particles.filter(p=>p.life>0);
 if(flash>0)flash-=1;if(shake>0)shake*=.86;
}
function draw(){
 const light=document.documentElement.classList.contains('light');
 ctx.save();
 if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 ctx.fillStyle=light?'#fafbfc':'#05080b';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle=light?'rgba(30,38,48,.08)':'rgba(255,255,255,.035)';ctx.lineWidth=1;
 for(let x=0;x<=W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<=H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 ctx.setLineDash([7,12]);ctx.strokeStyle=light?'#c9ced7':'#39424f';ctx.beginPath();ctx.moveTo(W/2,18);ctx.lineTo(W/2,H-18);ctx.stroke();ctx.setLineDash([]);
 ctx.strokeStyle=light?'rgba(20,25,30,.1)':'rgba(255,255,255,.06)';ctx.strokeRect(14,14,W-28,H-28);
 for(const t of ball.trail){ctx.globalAlpha=t.a*.35;ctx.fillStyle='#d7ff42';ctx.beginPath();ctx.arc(t.x,t.y,ball.r*.8,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;
 ctx.shadowBlur=24;ctx.shadowColor=light?'transparent':'#d7ff42';ctx.fillStyle=light?'#15181d':'#d7ff42';ctx.fillRect(left.x,left.y,left.w,left.h);
 ctx.shadowColor=light?'transparent':'#6ee7ff';ctx.fillStyle=light?'#555b66':'#6ee7ff';ctx.fillRect(right.x,right.y,right.w,right.h);ctx.shadowBlur=0;
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 ctx.shadowBlur=28;ctx.shadowColor=light?'transparent':'#ffffff';ctx.fillStyle=light?'#111318':'#ffffff';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 if(flash>0){ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(0,0,W,H)}
 ctx.restore();
}
function loop(t){const dt=Math.min(.03,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();const y=(e.clientY-r.top)*(H/r.height);left.y=clamp(y-left.h/2,0,H-left.h)});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();keys[e.key]=true;if(e.key===' ')togglePause()});
window.addEventListener('keyup',e=>keys[e.key]=false);
startBtn.onclick=start;
pauseBtn.onclick=togglePause;
resetBtn.onclick=()=>resetMatch(true);
playAgainBtn.onclick=()=>resetMatch(true);
soundBtn.onclick=()=>{soundOn=!soundOn;soundBtn.textContent='Sound: '+(soundOn?'On':'Off');if(soundOn)beep(600,.05)};
difficulty='medium';
if(botBadge) botBadge.textContent=difficulty.toUpperCase();

function setDifficulty(level){
  difficulty=level;
  if(difficultyValue) difficultyValue.textContent=level.charAt(0).toUpperCase()+level.slice(1);
  if(botBadge) botBadge.textContent=level.toUpperCase();
  difficultyOptions.forEach(btn=>btn.classList.toggle('selected',btn.dataset.difficulty===level));
  if(difficultyControl) difficultyControl.classList.remove('open');
  if(difficultyTrigger) difficultyTrigger.setAttribute('aria-expanded','false');
  if(running && !gameOver) status(level.toUpperCase()+' BOT');
}
if(difficultyTrigger){
  difficultyTrigger.addEventListener('click',e=>{
    e.stopPropagation();
    const open=difficultyControl.classList.toggle('open');
    difficultyTrigger.setAttribute('aria-expanded',open?'true':'false');
  });
}
difficultyOptions.forEach(btn=>btn.addEventListener('click',()=>setDifficulty(btn.dataset.difficulty)));
document.addEventListener('click',e=>{
  if(difficultyControl && !difficultyControl.contains(e.target)){
    difficultyControl.classList.remove('open');
    if(difficultyTrigger) difficultyTrigger.setAttribute('aria-expanded','false');
  }
});
setDifficulty('medium');

resetMatch(false);requestAnimationFrame(loop);
}
