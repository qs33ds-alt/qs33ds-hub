import {invoke} from "@tauri-apps/api/core";
import {listen} from "@tauri-apps/api/event";
import "./style.css";
const app=document.getElementById("app");
const state={profile:"equilibrado",model:"qwen3:1.7b",busy:false,requestId:"",streamTarget:null,connected:false,demo:false};
app.innerHTML=`
<div class="shell">
  <aside class="sidebar">
    <div class="brand"><div class="brand-icon">Q</div><div><strong>QS33DS</strong><span>LOCAL AI · PREVIEW</span></div></div>
    <div class="section-label">ESPACIO DE TRABAJO</div>
    <button class="nav selected" data-view="chat"><span>◈</span> Conversación</button>
    <button class="nav" data-view="models"><span>▤</span> Modelos locales</button>
    <button class="nav" data-view="monitor"><span>▥</span> Rendimiento</button>
    <div class="section-label lower">PRÓXIMAS INTEGRACIONES</div>
    <div class="nav locked"><span>▦</span> Agenda <small>próximo</small></div>
    <div class="nav locked"><span>◇</span> Memoria SQLite <small>próximo</small></div>
    <div class="nav locked"><span>▧</span> Documentos <small>próximo</small></div>
    <div class="sidebar-bottom"><span class="status-dot" id="side-dot"></span><span id="side-status">Comprobando motor…</span><small>Tauri 2 · Windows</small></div>
  </aside>
  <main class="main">
    <header class="topbar"><div class="breadcrumbs">QS33DS / <b id="crumb">Conversación</b></div><div class="top-actions"><span class="chip">100% LOCAL</span><span class="avatar">QS</span></div></header>
    <div class="workspace">
      <div class="intro"><div><span class="eyebrow">ASISTENTE PERSONAL</span><h1 id="view-title">Conversación</h1><p id="view-subtitle">Tu inteligencia local, bajo tu control.</p></div><span class="version">V1 · VISTA PREVIA</span></div>
      <div class="layout">
        <section class="chat-panel">
          <div class="chat-header"><span class="tiny-orb"></span><div><b>Asistente QS33DS</b><small id="chat-status">Esperando conexión con Ollama</small></div><button class="ghost" id="demo-btn">Vista de muestra</button></div>
          <div class="messages" id="messages"><div class="welcome" id="welcome"><div class="welcome-icon">Q</div><h2>Hola, soy QS33DS Local.</h2><p>Un espacio privado para conversar con tus modelos de Ollama. Puedes probar la interfaz sin instalar modelos usando la vista de muestra.</p><div class="suggestions"><button data-prompt="Resume las ventajas de trabajar con una IA local.">¿Por qué IA local?</button><button data-prompt="Dame tres ideas de actividades educativas.">Ideas para el aula</button><button data-prompt="¿Cómo puedo reducir el consumo de RAM?">Optimizar recursos</button></div></div></div>
          <form class="composer" id="form"><textarea id="prompt" placeholder="Escribe aquí...  Intro para enviar" rows="2" maxlength="8000"></textarea><div class="composer-footer"><span>Procesamiento en tu equipo · sin nube</span><button class="send" id="send" type="submit">Enviar <span>↗</span></button></div></form>
        </section>
        <aside class="inspector">
          <div class="inspector-title">ESTADO DEL SISTEMA <span>EN DIRECTO</span></div>
          <div class="data-card"><div class="data-label">Modelo seleccionado</div><strong id="model-label">Qwen3 1.7B</strong><small>Ollama · ejecución local</small></div>
          <div class="two-up"><div class="data-card compact"><div class="data-label">Velocidad</div><strong id="speed">—</strong><small>tokens/seg</small></div><div class="data-card compact"><div class="data-label">Primer token</div><strong id="latency">—</strong><small>segundos</small></div></div>
          <div class="inspector-title extra">MODO DE INTELIGENCIA</div>
          <div class="mode-switch" id="modes"><button data-profile="rapido">Rápido</button><button data-profile="equilibrado" class="active">Equilibrado</button><button data-profile="profundo">Profundo</button></div>
          <p class="helper" id="profile-note">Contexto de 2048 tokens. Respuestas concisas y consumo equilibrado.</p>
          <div class="inspector-title extra">MODELO LOCAL</div>
          <select id="model-select"><option value="qwen3:1.7b">Qwen3 1.7B · ligero</option><option value="qwen3:4b">Qwen3 4B · avanzado</option></select>
          <div class="inspector-title extra">DIAGNÓSTICO</div>
          <div class="diagnostic"><span>Motor Ollama</span><b id="ollama-status">Comprobando…</b></div>
          <div class="diagnostic"><span>Perfil</span><b id="profile-readout">Equilibrado</b></div>
          <div class="notice">Esta compilación es una vista previa: el motor Python, la agenda y la memoria de la versión original se integrarán después.</div>
        </aside>
      </div>
    </div>
  </main>
</div>`;
const $=s=>document.querySelector(s);
const names={rapido:"Rápido",equilibrado:"Equilibrado",profundo:"Profundo"};
const notes={rapido:"Contexto de 1536 tokens y respuestas breves. Prioridad: velocidad.",equilibrado:"Contexto de 2048 tokens. Respuestas concisas y consumo equilibrado.",profundo:"Contexto de 3072 tokens. Respuestas más amplias y mayor uso de memoria."};
const samples=["Esta es una demostración de la interfaz. Cuando Ollama esté activo, podrás usar Qwen3 para responder de verdad.","QS33DS Local prioriza la privacidad: la conversación se procesa en tu ordenador sin enviar mensajes a servicios en la nube.","Para un equipo con 8 GB de RAM, utiliza Qwen3 1.7B y el perfil rápido o equilibrado. El modo profundo puede necesitar más memoria."];
function message(role,content){$("#welcome")?.remove();const el=document.createElement("div");el.className="message "+role;const label=document.createElement("div");label.className="message-role";label.textContent=role==="user"?"TÚ":"QS33DS";const body=document.createElement("div");body.className="message-body";body.textContent=content;el.append(label,body);$("#messages").append(el);$("#messages").scrollTop=$("#messages").scrollHeight;return body;}
function setProfile(profile){state.profile=profile;$("#profile-readout").textContent=names[profile];$("#profile-note").textContent=notes[profile];document.querySelectorAll("[data-profile]").forEach(b=>b.classList.toggle("active",b.dataset.profile===profile));}
function setBusy(on){state.busy=on;$("#send").disabled=on;$("#prompt").disabled=on;}
function view(v){document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("selected",b.dataset.view===v));if(v==="chat"){$("#view-title").textContent="Conversación";$("#view-subtitle").textContent="Tu inteligencia local, bajo tu control.";}if(v==="models"){$("#view-title").textContent="Modelos locales";$("#view-subtitle").textContent="Selecciona Qwen3 1.7B o Qwen3 4B en el panel derecho.";}if(v==="monitor"){$("#view-title").textContent="Rendimiento";$("#view-subtitle").textContent="Comprueba la latencia y la velocidad después de una respuesta real.";}$("#crumb").textContent=$("#view-title").textContent;}
async function status(){try{const s=await invoke("ollama_status");state.connected=true;$("#ollama-status").textContent="Conectado";$("#side-status").textContent="Ollama disponible";$("#chat-status").textContent=(s.models||[]).length+" modelos instalados";$("#side-dot").classList.add("online");}catch(err){state.connected=false;$("#ollama-status").textContent="Sin conexión";$("#side-status").textContent="Ollama desconectado";$("#chat-status").textContent="Usa Vista de muestra para explorar";$("#side-dot").classList.remove("online");}}
document.querySelectorAll("[data-profile]").forEach(b=>b.addEventListener("click",()=>setProfile(b.dataset.profile)));
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>view(b.dataset.view)));
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{$("#prompt").value=b.dataset.prompt;$("#prompt").focus();}));
$("#model-select").addEventListener("change",e=>{state.model=e.target.value;$("#model-label").textContent=state.model.replace("qwen3:","Qwen3 ");});
$("#demo-btn").addEventListener("click",()=>{state.demo=!state.demo;$("#demo-btn").textContent=state.demo?"Salir de la muestra":"Vista de muestra";$("#chat-status").textContent=state.demo?"Muestra de interfaz · respuestas simuladas":state.connected?"Ollama listo":"Ollama no disponible";});
$("#prompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#form").requestSubmit();}});
let counter=0;
$("#form").addEventListener("submit",async e=>{
 e.preventDefault();if(state.busy)return;
 const prompt=$("#prompt").value.trim();if(!prompt)return;
 $("#prompt").value="";message("user",prompt);const body=message("assistant","");setBusy(true);
 if(state.demo){body.textContent="Vista de muestra: "+samples[counter++%samples.length];setBusy(false);return;}
 if(!state.connected){body.textContent="Ollama no está conectado. Inícialo y comprueba el modelo, o activa «Vista de muestra».";setBusy(false);return;}
 const requestId=Date.now().toString()+"-"+Math.round(Math.random()*1e6);state.requestId=requestId;state.streamTarget=body;
 try{
  const result=await invoke("chat",{requestId,message:prompt,model:state.model,profile:state.profile});
  body.textContent=result.answer||body.textContent||"No se recibió respuesta.";
  $("#speed").textContent=result.tokens_sec!=null?Number(result.tokens_sec).toFixed(1):"—";
  $("#latency").textContent=result.first_token_ms!=null?(Number(result.first_token_ms)/1000).toFixed(2):"—";
 }catch(error){body.textContent="Error de Ollama: "+String(error);}
 finally{state.streamTarget=null;state.requestId="";setBusy(false);$("#prompt").focus();status();}
});
listen("qs33ds:delta",event=>{const {requestId,text}=event.payload;if(requestId!==state.requestId||!state.streamTarget)return;state.streamTarget.textContent+=text;$("#messages").scrollTop=$("#messages").scrollHeight;}).catch(console.error);
setProfile("equilibrado");status();
