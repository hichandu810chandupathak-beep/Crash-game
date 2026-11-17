(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const levels = [
    {name:"WARM-UP",time:20,tickets:5,choices:3,delay:0},
    {name:"GLITCH SHIFT",time:16,tickets:6,choices:4,delay:350},
    {name:"CHAOS MODE",time:13,tickets:7,choices:5,delay:650}
  ];
  const actions = [
    {id:"charge",label:"Check charger",icon:"⚡",fix:"Check charger and cable",line:"My phone only charges when I compliment it.",face:"🥺",quip:"Try saying something nice to the charging port.",good:"The cable was loose. The phone accepts your apology.",bad:"That was not it. The charger is now emotionally unavailable."},
    {id:"restart",label:"Restart phone",icon:"🔄",fix:"Restart the phone",line:"It has 47 apps open and sounds like a tiny helicopter.",face:"🚁",quip:"A classic case of too many tabs. Just like my browser.",good:"A restart did the trick. The helicopter has landed.",bad:"You restarted your confidence, not the phone."},
    {id:"clean",label:"Clean port",icon:"🧹",fix:"Clean the charging port",line:"The charging cable only works at a 37-degree angle.",face:"🫠",quip:"Pocket lint. The natural enemy of modern civilisation.",good:"Pocket lint removed. Tiny dust bunnies defeated.",bad:"The port remains a lint museum. Interesting collection."},
    {id:"storage",label:"Free storage",icon:"🗂️",fix:"Free up storage",line:"The camera says storage full. I have 9,000 screenshots of lunch.",face:"📸",quip:"You cannot keep every screenshot. Some lunches must go.",good:"Storage cleared. Your lunch archive survives another day.",bad:"You opened the gallery and got distracted by 2022."},
    {id:"update",label:"Update software",icon:"⬆️",fix:"Update the software",line:"It keeps asking for an update, then forgets it asked.",face:"🧠",quip:"This phone has the memory of a goldfish in airplane mode.",good:"Update complete. The phone has learned one new trick.",bad:"Not an update issue. Even the progress bar is disappointed."},
    {id:"screen",label:"Check screen",icon:"📱",fix:"Check the screen connection",line:"The screen is black, but I can hear notifications partying.",face:"🎉",quip:"The display has left the group chat. Go investigate.",good:"Screen connection checked. Party lights are back.",bad:"Wrong department. The screen is still on vacation."},
    {id:"network",label:"Reset network",icon:"📡",fix:"Reset network settings",line:"Wi-Fi works everywhere except next to this router.",face:"🛜",quip:"The router is playing hide and seek. Check the network.",good:"Network reset. Wi-Fi has returned from its holiday.",bad:"Still offline. Even the router left you on read."}
  ];
  const quips = {
    win:["Fine. That was actually competent.","One point for the human. I demand a recount.","You fixed it. My circuits are mildly impressed.","I was about to do that. In another 3–5 business days."],
    lose:["Bold choice. Completely incorrect, but bold.","I have seen potatoes troubleshoot better. Respectfully.","CHIP wins this round. Please hold your applause.","That fix was sponsored by guesswork."],
    level:["New level unlocked. My sarcasm has received a software update.","The shop is getting weird. I am getting stronger.","Welcome to chaos mode. The warranty is fictional."],
    twist:["SYSTEM NOTICE: Your confidence has exceeded safe limits.","The customer has requested to speak to the motherboard.","A wild software update appeared. Nobody asked for it."]
  };
  let level=0, ticket=0, player=0, cpu=0, timeLeft=20, timerId=null, twistId=null, running=false, locked=false, sound=false, current=null, roundActions=[], audio=null, toastId=null;
  const random = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const shuffle = (arr) => [...arr].sort(()=>Math.random()-.5);
  function say(text){$("commentary").textContent='"'+text+'"';}
  function beep(freq=520,duration=.08){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type="sine";o.frequency.value=freq;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch(e){}}
  function toast(text){const el=$("toast");el.textContent=text;el.classList.add("show");clearTimeout(toastId);toastId=setTimeout(()=>el.classList.remove("show"),2100);}
  function updateScores(){$("playerScore").textContent=player;$("cpuScore").textContent=cpu;}
  function updateLevel(){const l=levels[level];$("levelName").textContent='LEVEL '+(level+1)+' / 3 · '+l.name;$("levelFill").style.width=(level/3*100)+'%';[1,2,3].forEach(n=>$("tab"+n).classList.toggle("active",n===level+1));}
  function start(){clearInterval(timerId);clearTimeout(twistId);level=0;ticket=0;player=0;cpu=0;running=true;locked=false;updateScores();updateLevel();$("resultModal").classList.add("hidden");$("startButton").textContent="RESTART SHIFT →";nextTicket();}
  function nextTicket(){
    if(!running)return;
    const l=levels[level];
    if(ticket>=l.tickets){if(level<2){level++;ticket=0;updateLevel();say(random(quips.level));toast('LEVEL '+(level+1)+' UNLOCKED');beep(720,.16);}else{finish();return;}}
    ticket++;locked=false;current=random(actions);roundActions=shuffle(actions.filter(a=>a.id!==current.id)).slice(0,levels[level].choices-1);roundActions.push(current);roundActions=shuffle(roundActions);
    $("ticketTitle").textContent=["The Phone Is Possessed","A Very Normal Repair","Customer Logic™","The Mystery Device"][Math.floor(Math.random()*4)];
    $("clientLine").textContent='"'+current.line+'"';$("phoneFace").textContent=current.face;$("quip").textContent="CHIP: "+current.quip;$("roundCount").textContent='TICKET '+ticket+' / '+l.tickets;
    $("feedback").className="feedback";$("feedback").textContent="Pick a fix before the customer starts a podcast about it.";
    renderActions();timeLeft=l.time;$("timer").innerHTML=timeLeft.toFixed(1)+'<span>s</span>';$("levelFill").style.width=((level+(ticket/l.tickets))/3*100)+'%';
    timerId=setInterval(tick,100);
    if(level>0) scheduleTwist();
  }
  function renderActions(){
    const grid=$("actionGrid");grid.innerHTML="";
    roundActions.forEach(a=>{const b=document.createElement("button");b.type="button";b.className="action-btn";b.dataset.action=a.id;b.innerHTML=a.icon+' <span>'+a.label+'</span>';b.addEventListener("click",()=>choose(a.id,b));grid.appendChild(b);});
  }
  function tick(){if(!running||locked)return;timeLeft-=.1;$("timer").innerHTML=Math.max(0,timeLeft).toFixed(1)+'<span>s</span>';$("timer").style.color=timeLeft<5?"var(--pink)":"var(--lime)";if(timeLeft<=0){clearInterval(timerId);resolve(null);}}
  function choose(id,button){if(!running||locked)return;const selected=actions.find(a=>a.id===id);resolve(selected,button);}
  function resolve(selected,button){
    if(locked)return;locked=true;clearInterval(timerId);clearTimeout(twistId);
    const correct=!!selected&&selected.id===current.id;
    if(correct){player+=10;$("feedback").className="feedback good";$("feedback").textContent="✓ "+current.good; if(button)button.classList.add("correct");say(random(quips.win));beep(740,.12);}
    else{cpu+=5;$("feedback").className="feedback bad";$("feedback").textContent=selected?"✕ "+current.bad:"⌛ Time's up. The customer has started a 14-part voice note.";if(button)button.classList.add("wrong");say(random(quips.lose));beep(180,.18);}
    updateScores();[...$("actionGrid").children].forEach(b=>b.disabled=true);
    setTimeout(nextTicket,850);
  }
  function scheduleTwist(){
    const delay=levels[level].delay+Math.random()*2500+1600;
    twistId=setTimeout(()=>{
      if(!running||locked)return;
      const kind=Math.floor(Math.random()*3);
      if(kind===0){document.body.classList.add("flipped");toast("GRAVITY UPDATE: shop orientation changed");setTimeout(()=>document.body.classList.remove("flipped"),1900);}
      else if(kind===1){$("gamePanel").classList.add("glitch");toast(random(quips.twist));setTimeout(()=>$("gamePanel").classList.remove("glitch"),700);}
      else{const buttons=[...$("actionGrid").children];const b=buttons[Math.floor(Math.random()*buttons.length)];if(b){b.classList.add("runaway");b.style.transform='translate('+(Math.random()*36-18)+'px,'+(Math.random()*18-9)+'px)';setTimeout(()=>{b.style.transform="";b.classList.remove("runaway");},1000);}toast("CHIP says one button is feeling shy.");}
      say(random(quips.twist));
    },delay);
  }
  function finish(){
    running=false;clearInterval(timerId);clearTimeout(twistId);$("finalPlayer").textContent=player;$("finalCpu").textContent=cpu;
    const won=player>cpu,tied=player===cpu;$("resultEmoji").textContent=won?"🏆":tied?"🤝":"🤖";$("resultTitle").textContent=won?"You survived the shift!":tied?"A perfectly chaotic tie!":"CHIP wins this time.";
    $("resultText").textContent=won?"The customers are impressed. CHIP has submitted a formal complaint.":tied?"Nobody won. The phone shop has somehow become a yoga studio.": "CHIP has won. It is being absolutely unbearable about it.";
    $("resultModal").classList.remove("hidden");$("startButton").textContent="PLAY AGAIN →";say(won?"I demand a rematch. Immediately.": "Excellent shift. For me. Not for you.");
  }
  function hint(){if(!running||locked)return;const name=current.fix;$("feedback").className="feedback";$("feedback").textContent="HINT: "+name+". CHIP insists this was obvious.";say("I am helping you because watching you guess is exhausting.");}
  $("startButton").addEventListener("click",start);$("playAgainButton").addEventListener("click",start);$("resetButton").addEventListener("click",()=>{clearInterval(timerId);clearTimeout(twistId);running=false;level=0;ticket=0;player=0;cpu=0;updateScores();updateLevel();$("timer").innerHTML='20.0<span>s</span>';$("ticketTitle").textContent="The Phone Is Possessed";$("clientLine").textContent='"My phone only charges when I compliment it."';$("quip").textContent="CHIP: Easy. Flatter the charging port. Obviously.";$("roundCount").textContent="TICKET 1 / 5";$("actionGrid").innerHTML="";$("feedback").className="feedback";$("feedback").textContent="Pick a fix before the customer starts a podcast about it.";$("resultModal").classList.add("hidden");$("startButton").textContent="START THE SHIFT →";say("Fresh shift. Same questionable management.");});
  $("hintButton").addEventListener("click",hint);
  $("soundToggle").addEventListener("click",()=>{sound=!sound;$("soundToggle").textContent=sound?"🔊 Sound on":"🔇 Sound off";$("soundToggle").setAttribute("aria-pressed",String(sound));if(sound)beep(600,.1);});
  updateScores();updateLevel();
})();