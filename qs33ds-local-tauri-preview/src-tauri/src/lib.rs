use futures_util::StreamExt;
use serde_json::{json, Value};
use std::time::{Duration, Instant};
use tauri::Emitter;

#[tauri::command]
async fn ollama_status() -> Result<Value, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(4)).build().map_err(|e|e.to_string())?;
    let resp = client.get("http://127.0.0.1:11434/api/tags").send().await
        .map_err(|e|format!("Ollama no disponible: {e}"))?
        .error_for_status().map_err(|e|e.to_string())?;
    let body: Value = resp.json().await.map_err(|e|e.to_string())?;
    let models = body["models"].as_array().map(|m|m.iter().filter_map(|v|v["name"].as_str().map(String::from)).collect::<Vec<_>>()).unwrap_or_default();
    Ok(json!({"connected":true,"models":models}))
}

#[tauri::command]
async fn chat(window: tauri::Window, request_id: String, message: String, model: String, profile: String) -> Result<Value, String> {
    if message.trim().is_empty() || message.chars().count() > 8000 { return Err("Mensaje vacío o demasiado largo".into()); }
    if !["qwen3:1.7b","qwen3:4b"].contains(&model.as_str()) { return Err("Modelo no admitido".into()); }
    if !["rapido","equilibrado","profundo"].contains(&profile.as_str()) { return Err("Perfil no admitido".into()); }
    if request_id.len()>80 || !request_id.chars().all(|c|c.is_ascii_alphanumeric() || c=='-') {return Err("Id de petición incorrecto".into());}
    let (ctx,predict,alive) = match profile.as_str() {
        "rapido" => (1536,160,"45s"),
        "profundo" => (3072,480,"90s"),
        _ => (2048,280,"120s")
    };
    let payload = json!({"model":model,"stream":true,"think":false,"messages":[
        {"role":"system","content":"Eres QS33DS Local. Responde en el idioma del usuario, con claridad y concisión. No afirmes tener memoria persistente ni acceso a documentos en esta vista previa."},
        {"role":"user","content":message}
    ],"options":{"temperature":0.35,"num_ctx":ctx,"num_predict":predict},"keep_alive":alive});
    let client = reqwest::Client::builder().timeout(Duration::from_secs(180)).build().map_err(|e|e.to_string())?;
    let response = client.post("http://127.0.0.1:11434/api/chat").json(&payload)
        .send().await.map_err(|e|format!("Ollama no responde: {e}"))?
        .error_for_status().map_err(|e|e.to_string())?;
    let start=Instant::now();
    let mut first:Option<u128>=None;
    let mut stream=response.bytes_stream();
    let mut buf=Vec::<u8>::new();
    let mut answer=String::new();
    let mut eval_count=0u64;
    let mut eval_duration=0u64;
    while let Some(chunk)=stream.next().await {
        let bytes=chunk.map_err(|e|e.to_string())?;
        buf.extend_from_slice(&bytes);
        while let Some(pos)=buf.iter().position(|b|*b==b'\n') {
            let line:Vec<u8>=buf.drain(..=pos).collect();
            if line.iter().all(|b|b.is_ascii_whitespace()) {continue;}
            let item:Value=serde_json::from_slice(&line).map_err(|e|e.to_string())?;
            if let Some(err)=item["error"].as_str(){return Err(err.into());}
            if let Some(fragment)=item["message"]["content"].as_str(){
                if !fragment.is_empty(){
                    if first.is_none(){first=Some(start.elapsed().as_millis());}
                    answer.push_str(fragment);
                    let _=window.emit("qs33ds:delta",json!({"requestId":request_id,"text":fragment}));
                }
            }
            if item["done"].as_bool().unwrap_or(false){
                eval_count=item["eval_count"].as_u64().unwrap_or(0);
                eval_duration=item["eval_duration"].as_u64().unwrap_or(0);
            }
        }
    }
    let speed=if eval_duration>0 {Some((eval_count as f64)*1_000_000_000.0/(eval_duration as f64))} else {None};
    Ok(json!({"answer":answer,"first_token_ms":first,"tokens_sec":speed,"elapsed_ms":start.elapsed().as_millis()}))
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ollama_status,chat])
        .run(tauri::generate_context!())
        .expect("No se ha podido iniciar QS33DS Local");
}
