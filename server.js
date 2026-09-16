const crypto=require('crypto'); const http=require('http'); const fs=require('fs'); const path=require('path'); const WebSocket=require('ws');
const PORT=process.env.PORT||10000;
const publicDir=path.join(__dirname,'web');
const rooms=new Map();
const CASE={title:'Il Delitto di Villa Bellini',victim:'Alessandro Moretti',setting:'Villa Bellini. Una cena privata viene interrotta da un omicidio.',solution:{killer:'Elena Rossi',motive:'Alessandro aveva scoperto che Elena aveva sottratto denaro alla società.',weapon:'Il tagliacarte della biblioteca.',time:'23:17',place:'Biblioteca'},roles:[
{name:'Elena Rossi',secret:'Sei l’assassina. Alle 23:05 hai incontrato Alessandro in biblioteca. Alle 23:17 lo hai colpito con il tagliacarte. Hai poi cercato di mantenere un alibi in sala da pranzo.',goal:'Proteggi il tuo alibi e sposta i sospetti sugli altri.'},
{name:'Luca Bianchi',secret:'Alle 23:10 eri vicino alla biblioteca e hai sentito una discussione, ma non hai visto chiaramente chi parlava.',goal:'Scopri la verità senza rivelare subito tutto ciò che sai.'},
{name:'Sara Conti',secret:'Alle 23:00 hai visto Elena uscire dalla sala da pranzo e dirigersi verso il corridoio della biblioteca.',goal:'Capire cosa nasconde Elena.'},
{name:'Marco Ferri',secret:'Hai trovato un documento che mostra un ammanco di denaro collegato alla società.',goal:'Scoprire chi ha sottratto il denaro.'},
{name:'Giulia Neri',secret:'Alle 23:20 hai trovato un bicchiere rotto vicino alla biblioteca.',goal:'Ricostruire gli ultimi minuti della vittima.'},
{name:'Andrea Riva',secret:'Hai avuto un forte litigio con Alessandro in passato, ma alle 23:15 eri in terrazza.',goal:'Dimostrare che il tuo vecchio conflitto non basta a spiegare l’omicidio.'}],clues:[
{id:'c1',title:'Documento finanziario',text:'Il documento mostra un ammanco di denaro collegato alla gestione di Elena.'},
{id:'c2',title:'Fotografia delle 23:06',text:'Una fotografia mostra Elena nel corridoio che porta alla biblioteca.'},
{id:'c3',title:'Tagliacarte',text:'Il tagliacarte della biblioteca presenta tracce compatibili con l’omicidio.'},
{id:'c4',title:'Bicchiere rotto',text:'Un bicchiere è stato trovato vicino alla biblioteca alle 23:20.'},
{id:'c5',title:'Testimonianza',text:'Luca riferisce di aver sentito una discussione alle 23:10.'},
{id:'c6',title:'Alibi contraddittorio',text:'Elena sostiene di essere rimasta in sala da pranzo per tutta la fascia 23:00–23:20.'}]};
function code(){let c; do{c=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(c)); return c}
function send(ws,o){if(ws.readyState===1)ws.send(JSON.stringify(o))}
function state(r){return {code:r.code,started:r.started,phase:r.phase,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,ready:p.ready})),log:r.log.slice(-50),clues:[...r.clues].map(id=>CASE.clues.find(c=>c.id===id)),timeLeft:r.timeLeft}}
function broadcast(r){const s=JSON.stringify({type:'state',state:state(r)}); r.clients.forEach(c=>send(c.ws,JSON.parse(s)))}
function privateRole(r,p){if(r.started&&p.role)send(p.ws,{type:'role',role:p.role})}
function startGame(r,host){if(host!==r.host||r.started)return; const arr=[...r.players.values()]; if(arr.length<4)return send(host.ws,{type:'error',message:'Servono almeno 4 giocatori.'}); const roles=[...CASE.roles]; for(let i=roles.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[roles[i],roles[j]]=[roles[j],roles[i]]} arr.forEach((p,i)=>p.role=roles[i]); r.started=true;r.phase='indagine';r.timeLeft=60*60;r.log.push('JARVIS: La verità è stata stabilita. L’indagine ha inizio.'); broadcast(r);arr.forEach(p=>privateRole(r,p)); speakAll(r,'La verità è stata stabilita. L’indagine ha inizio.')}
function speakAll(r,text){r.clients.forEach(c=>send(c.ws,{type:'voice',text}))}
const server=http.createServer((req,res)=>{let u=req.url.split('?')[0]; let file=u==='/'?'/index.html':u; let p=path.join(publicDir,file); if(!p.startsWith(publicDir)||!fs.existsSync(p)){res.writeHead(404);return res.end('Not found')} const ext=path.extname(p); const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};res.writeHead(200,{'Content-Type':types[ext]||'text/plain'});res.end(fs.readFileSync(p))});
const wss=new WebSocket.Server({server});
wss.on('connection',ws=>{let r=null,p=null; ws.on('message',raw=>{let d;try{d=JSON.parse(raw)}catch{return};
if(d.action==='create'){let c=code();r={code:c,started:false,phase:'lobby',players:new Map(),clients:new Set(),clues:new Set(),log:['JARVIS: Sala creata.'],host:null,timeLeft:3600};rooms.set(c,r);p={id:crypto.randomUUID(),name:String(d.name||'Host').slice(0,24),ready:true,role:null,ws};r.players.set(p.id,p);r.host=p;r.clients.add(p);send(ws,{type:'created',code:c,id:p.id,host:true});broadcast(r)}
else if(d.action==='join'){r=rooms.get(String(d.code||'').toUpperCase());if(!r)return send(ws,{type:'error',message:'Codice non trovato.'}); if(r.started)return send(ws,{type:'error',message:'Partita già iniziata.'});p={id:crypto.randomUUID(),name:String(d.name||'Giocatore').slice(0,24),ready:true,role:null,ws};r.players.set(p.id,p);r.clients.add(p);send(ws,{type:'joined',code:r.code,id:p.id,host:false});broadcast(r)}
else if(d.action==='start'&&r&&p)startGame(r,p);
else if(d.action==='chat'&&r&&p){let t=String(d.text||'').trim().slice(0,500);if(t){r.log.push(p.name+': '+t);broadcast(r)}}
else if(d.action==='clue'&&r&&p&&r.started){let c=CASE.clues.find(x=>x.id===d.id);if(c){r.clues.add(c.id);r.log.push('JARVIS: Nuovo indizio scoperto — '+c.title);broadcast(r);speakAll(r,'Nuovo indizio scoperto: '+c.title)}}
else if(d.action==='announce'&&r&&p&&p===r.host&&r.started){let t=String(d.text||'').slice(0,500);r.log.push('JARVIS: '+t);broadcast(r);speakAll(r,t)}
else if(d.action==='final'&&r&&p&&r.started){r.log.push(p.name+' ha consegnato la sua accusa.');broadcast(r)}
});ws.on('close',()=>{if(r&&p){r.clients.delete(p); if(!r.started){r.players.delete(p.id); if(r.host===p)r.host=[...r.players.values()][0]||null} broadcast(r)}})});
server.listen(PORT,'0.0.0.0',()=>console.log('JARVIS running on '+PORT));
