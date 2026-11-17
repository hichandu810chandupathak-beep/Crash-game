(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const rounds = [
    {title:"Monday Morning Resistance",tag:"ROUND 1 · WAKE-UP CALL",count:5,time:25},
    {title:"The Relative Interrogation",tag:"ROUND 2 · FAMILY GROUP CHAT",count:6,time:17},
    {title:"Brain Cell Meltdown",tag:"ROUND 3 · CHAOS MODE",count:7,time:14}
  ];
  const relatives=[
    {face:"👵",name:"SHARMA AUNTY",q:"Beta, aage ka kya plan hai?",answers:["Pehle chai, phir duniya dekhenge ☕","NASA is waiting for my call 🚀","Aunty, aapka Wi-Fi password? 📶","Plan confidential hai, aunty 🤫"],good:0},
    {face:"🧔",name:"UNCLE JI",q:"Salary kitni ho gayi ab?",answers:["Itni ki samose aa jaayein 🥟","Aapki duaon jitni unlimited 🙏","Pehle aap apna batao 😎","Salary? Main toh vibes kamata hoon ✨"],good:3},
    {face:"👩",name:"NOSY COUSIN",q:"Shaadi kab kar rahe ho?",answers:["Pehle biryani ki date fix karo 🍛","Jab calendar permission dega 📅","Main toh abhi loading mein hoon…","Aap RSVP bhejo, main sochta hoon 💌"],good:2},
    {face:"👴",name:"DOUBTFUL UNCLE",q:"Phone chhod do, kuch productive karo!",answers:["Ji, aapko reply kar raha hoon 😇","Phone mujhe chhodta hi nahi 📱","Aapka message save kar leta hoon 😂","Productivity ne mujhe block kiya"],good:1},
    {face:"👩‍🦳",name:"MUMMY KI FRIEND",q:"Mummy batati hain tum bahut busy ho?",answers:["Ji, important nap chal rahi thi 😴","Bas desh sambhal raha hoon 🇮🇳","Aunty, mummy ko mat batana 🤐","Busy nahi, premium unavailable"],good:3},
    {face:"🧑",name:"COUSIN BRO",q:"Koi good news hai life mein?",answers:["Haan, aaj network full hai 📶","Kal ka leftover pizza mila 🍕","Main khush hoon, breaking news!","Battery 100%, bas wahi 🎉"],good:2}
  ];
  const chaosChallenges=[
    {q:"Your last brain cell has called in sick. What now?",opts:["Promote the nearest potato 🥔","Open 47 tabs in my brain","Take a tiny vacation 🏖️","Ask the fridge for advice"],good:2},
    {q:"You opened your phone for one thing. It is now 2 hours later.",opts:["Remember the original mission 🧠","Blame the algorithm","Become one with the scroll 🌀","Put phone in timeout"],good:0},
    {q:"A flying banana challenges you to a dance battle.",opts:["Moonwalk into destiny 🕺","Request a banana permit","Challenge accepted 🍌","Pretend this is normal"],good:2},
    {q:"Your brain has 1% battery. Choose wisely.",opts:["Enable low-power thinking 🔋","Think in airplane mode","Borrow a brain cell","Restart the whole human"],good:0},
    {q:"A random thought at 3 AM says hello.",opts:["Tell it office hours are over 🌙","Invite it for chai","Schedule it for Monday","Throw a blanket at the thought"],good:0},
    {q:"You said 'just five more minutes' 9 times.",opts:["Time is a social construct","Accept the snooze championship 🏅","Blame time zones","Negotiate with the pillow"],good:1},
    {q:"The computer says it is funnier than you.",opts:["Show it your meme folder 📂","Let it have this one","Challenge it to dad jokes","Unplug its imaginary ego"],good:0}
  ];
  const jokes={
    win:["Okay, that was annoyingly good. 🙄","A point for you. I will recover emotionally.","You did it! Please remain humble for 0.4 seconds.","Your brain cell deserves a tiny medal. 🏅"],
    lose:["Interesting choice. The jury is confused.","I would explain, but the answer is doing a facepalm.","The computer would like to thank your confusion.","That move was sponsored by pure chaos."],
    levels:["New level! Your relatives have entered the chat. 📞","The nonsense has evolved. So has my ego.","CHAOS MODE. Even the rules need a holiday."]
  };
  let level=0,round=0,user=0,ai=0,time=25,interval=null,twist=null,running=false,locked=false,sound=false,audio=null,toastTimer=null,alarmX=0,alarmY=0,dragging=false,dragStart=null,currentRelative=null,currentChaos=null;
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const shuffle=a=>[...a].sort(()=>Math.random()-.5);
  function comment(t){$("trollLine").textContent='"'+t+'"';}
  function beep(f=540,d=.09){if(!sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;o.type="triangle";g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}catch(e){}}
  function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1900);}
  function scores(){$("userScore").textContent=user;$("aiScore").textContent=ai;}
  function progress(){const p=level===0?round/5:level===1?(1+round/6)/3*3:(2+round/7)/3*3;$("progress").style.width=(level===0?round/5*33.333:level===1?33.333+round/6*33.333:66.666+round/7*33.334)+"%";$("levelLabel").textContent="LEVEL "+(level+1)+" OF 3";[1,2,3].forEach(n=>$("levelTab"+n).classList.toggle("active",n===level+1));}
  function timerStart(){clearInterval(interval);time=rounds[level].time;$("timer").innerHTML=time.toFixed(1)+'<span>s</span>';$("timer").style.color="var(--yellow)";interval=setInterval(()=>{if(!running||locked)return;time-=.1;$("timer").innerHTML=Math.max(0,time).toFixed(1)+'<span>s</span>';if(time<5)$("timer").style.color="var(--pink)";if(time<=0){clearInterval(interval);resolve(false,null,"Time's up! The moment has passed. ⏳");}},100);}
  function start(){clearInterval(interval);clearTimeout(twist);level=0;round=0;user=0;ai=0;running=true;locked=false;$("resultModal").classList.add("hidden");$("startBtn").textContent="RESTART THE NONSENSE →";scores();progress();newRound();}
  function newRound(){
    if(!running)return;
    if(round>=rounds[level].count){if(level<2){level++;round=0;comment(pick(jokes.levels));toast("LEVEL "+(level+1)+" UNLOCKED!");beep(760,.15);}else{finish();return;}}
    round++;locked=false;progress();
    $("stageTitle").textContent=rounds[level].title;$("stageTag").textContent=rounds[level].tag;
    $("roundCounter").textContent=level===0?"WAKE UP, LEGEND · "+(round-1)+" / 5":level===1?"REPLIES SENT · "+(round-1)+" / 6":"BRAIN CELLS LEFT · "+Math.max(0,8-round)+" / 7";
    $("wakeScene").classList.toggle("hidden",level!==0);$("relativeScene").classList.toggle("hidden",level!==1);$("chaosScene").classList.toggle("hidden",level!==2);
    $("challengeLabel").textContent=level===0?"YOUR MISSION":level===1?"CHOOSE YOUR REPLY":"SAVE THE LAST BRAIN CELL";
    if(level===0)wakeRound();else if(level===1)relativeRound();else chaosRound();
    timerStart();if(level===2)scheduleChaos();
  }
  function actionButtons(items,goodIndex){
    const grid=$("replyGrid");grid.innerHTML="";
    items.forEach((item,i)=>{const b=document.createElement("button");b.type="button";b.className="reply-btn";b.textContent=item;b.addEventListener("click",()=>resolve(i===goodIndex,b));grid.appendChild(b);});
  }
  function wakeRound(){
    $("instruction").textContent=pick(["That alarm thinks it owns you. Drag it out of your peaceful existence!","The snooze button has filed a restraining order. Move the alarm!","Rise and shine? Counter-offer: absolutely not. Evict that alarm!"]);
    $("replyGrid").innerHTML='<button class="reply-btn" id="snoozeBtn" type="button">😴 SNOOZE FOREVER</button><button class="reply-btn" id="coffeeBtn" type="button">☕ NEGOTIATE WITH COFFEE</button>';
    $("snoozeBtn").addEventListener("click",()=>resolve(true,$("snoozeBtn")));
    $("coffeeBtn").addEventListener("click",()=>resolve(false,$("coffeeBtn")));
    $("alarm").style.transform="translate(0,0)";alarmX=0;alarmY=0;comment(pick(["I have been awake since 5 AM. I have no hobbies.","Morning people are suspicious. I said what I said.","Your pillow has requested an extension."]));
  }
  function relativeRound(){
    currentRelative=relatives[(round-1)%relatives.length];$("relativeAvatar").textContent=currentRelative.face;$("relativeQuestion").textContent='"'+currentRelative.q+'"';$("relativeName").textContent=currentRelative.name+" IS TYPING...";
    $("instruction").textContent="Choose a reply before they ask about your five-year plan.";
    actionButtons(shuffle(currentRelative.answers.map((a,i)=>({text:a,good:i===currentRelative.good}))).map(x=>x.text),null);
    const correctText=currentRelative.answers[currentRelative.good];
    [...$("replyGrid").children].forEach(b=>b.addEventListener("click",()=>{const ok=b.textContent===correctText;resolve(ok,b,ok?"Reply delivered. Aunty is typing... again.":"Seen-zoned by the family group. 😬");},{once:true}));
    comment(pick(["I have muted 14 family groups. Rookie numbers.","Your relatives have better follow-up questions than a detective.","Say something nice. Or say something confusing. Both work."]));
  }
  function chaosRound(){
    currentChaos=chaosChallenges[(round-1)%chaosChallenges.length];$("chaosCaption").textContent="BRAIN STATUS: "+pick(["BUFFERING...","ONE CELL ONLINE","VIBES ONLY","PLEASE DO NOT DISTURB"]);$("brain").textContent=pick(["🧠","🤯","🥴","🫠"]);
    $("instruction").textContent=currentChaos.q;actionButtons(shuffle(currentChaos.opts.map((t,i)=>({t,good:i===currentChaos.good}))),null);
    const correct=currentChaos.opts[currentChaos.good];
    [...$("replyGrid").children].forEach(b=>b.addEventListener("click",()=>resolve(b.textContent===correct,b),{once:true}));
    comment(pick(["I am not saying you are chaotic. The data is.","Your brain has left a voicemail. It sounds concerned.","I ran a simulation. The simulation asked for a snack."]));
  }
  function resolve(ok,button,custom){
    if(!running||locked)return;locked=true;clearInterval(interval);clearTimeout(twist);
    if(ok){user+=10;$("statusLine").className="status-line good";$("statusLine").textContent="✓ "+(custom||pick(["Excellent nonsense. +10 points!","Big brain energy! +10 laugh points.","That was smooth. The computer is jealous."]));if(button)button.classList.add("good");comment(pick(jokes.win));beep(740,.13);}
    else{ai+=5;$("statusLine").className="status-line bad";$("statusLine").textContent="✕ "+(custom||"The Troll gets +5 chaos points. Better luck next time!");if(button)button.classList.add("bad");comment(pick(jokes.lose));beep(180,.17);}
    scores();[...$("replyGrid").children].forEach(b=>b.disabled=true);setTimeout(newRound,780);
  }
  function scheduleChaos(){twist=setTimeout(()=>{if(!running||locked)return;const n=Math.floor(Math.random()*3);if(n===0){document.body.classList.add("flip");toast("THE WORLD IS UPSIDE DOWN. VERY RELATABLE.");setTimeout(()=>document.body.classList.remove("flip"),1700);}else if(n===1){$("gameCard").classList.add("wiggle");toast("BRAIN CELL HAS LEFT THE BUILDING!");setTimeout(()=>$("gameCard").classList.remove("wiggle"),800);}else{$("gameCard").classList.add("shuffle-chaos");toast("BUTTONS ARE HAVING A GROUP DISCUSSION.");setTimeout(()=>$("gameCard").classList.remove("shuffle-chaos"),900);}beep(320,.12);},2300+Math.random()*2400);}
  function finish(){running=false;clearInterval(interval);clearTimeout(twist);$("finalUser").textContent=user;$("finalAI").textContent=ai;const win=user>ai,tie=user===ai;$("resultEmoji").textContent=win?"🏆":tie?"🤝":"🤡";$("resultTitle").textContent=win?"Certified Laugh Legend!":tie?"A tie of legendary nonsense!":"The Troll has won... this time."; $("resultMessage").textContent=win?"You survived Monday, relatives AND your own brain. Iconic.":tie?"Nobody won. Everybody laughed. That is the actual win.":"The computer is celebrating with a tiny victory dance. You can absolutely get it next time.";$("resultModal").classList.remove("hidden");$("startBtn").textContent="PLAY AGAIN →";}
  function hint(){if(!running||locked)return;const msg=level===0?"Hint: the alarm is draggable. Give it the boot!":level===1?"Hint: pick the reply that makes the family group go quiet.": "Hint: trust your last brain cell. It has seen things."; $("statusLine").className="status-line";$("statusLine").textContent=msg;comment("I am helping you. Please do not make this a habit.");}
  function alarmMove(e){if(!running||level!==0||locked)return;const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;alarmX=Math.max(-115,Math.min(115,alarmX+dx));alarmY=Math.max(-65,Math.min(65,alarmY+dy));$("alarm").style.transform="translate("+alarmX+"px,"+alarmY+"px) rotate("+Math.max(-25,Math.min(25,alarmX/3))+"deg)";dragStart={x:e.clientX,y:e.clientY};if(Math.abs(alarmX)>75||Math.abs(alarmY)>42)resolve(true,null,"ALARM EVICTED! Sleep schedule restored (fictionally). 💤");}
  $("alarm").addEventListener("pointerdown",e=>{if(!running||level!==0||locked)return;dragStart={x:e.clientX,y:e.clientY};$("alarm").setPointerCapture(e.pointerId);});
  $("alarm").addEventListener("pointermove",e=>{if(dragStart)alarmMove(e);});
  $("alarm").addEventListener("pointerup",()=>{dragStart=null;});
  $("alarm").addEventListener("pointercancel",()=>{dragStart=null;});
  $("alarm").addEventListener("click",()=>{if(!running||level!==0||locked)return;alarmX+=45;$("alarm").style.transform="translate("+alarmX+"px,0) rotate(12deg)";if(alarmX>80)resolve(true,null,"ALARM YEETED! You are the snooze champion. 🏆");});
  $("startBtn").addEventListener("click",start);$("againBtn").addEventListener("click",start);$("hintBtn").addEventListener("click",hint);
  $("resetBtn").addEventListener("click",()=>{clearInterval(interval);clearTimeout(twist);running=false;level=0;round=0;user=0;ai=0;locked=false;scores();progress();$("timer").innerHTML='25.0<span>s</span>';$("stageTitle").textContent=rounds[0].title;$("stageTag").textContent=rounds[0].tag;$("roundCounter").textContent="WAKE UP, LEGEND · 0 / 5";$("wakeScene").classList.remove("hidden");$("relativeScene").classList.add("hidden");$("chaosScene").classList.add("hidden");$("replyGrid").innerHTML="";$("instruction").textContent="That alarm thinks it owns you. Show it who pays the electricity bill.";$("statusLine").className="status-line";$("statusLine").textContent="Waiting for your first move. The pillow believes in you.";$("resultModal").classList.add("hidden");$("startBtn").textContent="START THE NONSENSE →";comment("Fresh chaos. Same questionable decision-making.");});
  $("soundBtn").addEventListener("click",()=>{sound=!sound;$("soundBtn").innerHTML=(sound?"🔊 <span>Sound on</span>":"🔇 <span>Sound off</span>");$("soundBtn").setAttribute("aria-pressed",String(sound));if(sound)beep(620,.1);});
  scores();progress();
})();