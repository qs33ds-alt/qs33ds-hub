/* OAuth token stays in memory. No client secret or refresh token is used. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.AstroDBDrive=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCOPE='https://www.googleapis.com/auth/drive.file';
  const API='https://www.googleapis.com/drive/v3/files';
  const UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
  const FOLDER='application/vnd.google-apps.folder';
  const APP='qs33ds.astrodb.v1';
  class DriveError extends Error{
    constructor(message,status=0){super(message);this.name='DriveError';this.status=status;}
  }
  class Client{
    constructor({fetch=globalThis.fetch.bind(globalThis),storage=globalThis.localStorage,crypto=globalThis.crypto,clock=Date.now,onState=()=>{}}={}){
      this.fetch=fetch;this.storage=storage;this.crypto=crypto;this.clock=clock;this.onState=onState;
      this.session=null;this.generation=0;this.queues=new Map();this.connecting=false;
    }
    state(){return {connected:!!this.session&&this.session.expires>this.clock(),account:this.session?.account||null,expired:!!this.session&&this.session.expires<=this.clock()};}
    disconnect(){this.generation++;this.session=null;this.onState({state:'disconnected'});}
    async connect(clientId,google=globalThis.google){
      if(!/^[-\w.]+\.apps\.googleusercontent\.com$/.test(clientId||''))throw new DriveError('Falta configurar el identificador OAuth web de Google.');
      if(!google?.accounts?.oauth2)throw new DriveError('La conexión de Google no se ha cargado. Comprueba Internet.');
      if(this.connecting)throw new DriveError('La conexión con Google ya está en curso.');
      this.disconnect();this.connecting=true;
      const generation=this.generation;
      try{
        const token=await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new DriveError('La autorización de Google no se completó. Vuelve a conectar.')),120000);
          const done=(fn,value)=>{clearTimeout(timer);fn(value);};
          try{
            const auth=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPE,include_granted_scopes:false,
              callback:r=>r.error||!r.access_token?done(reject,new DriveError('Google no concedió acceso a Drive.')):done(resolve,r),
              error_callback:()=>done(reject,new DriveError('La ventana de Google se cerró o no pudo abrirse.'))});
            auth.requestAccessToken({prompt:'select_account'});
          }catch(error){done(reject,new DriveError('No se pudo abrir la autorización de Google.'));}
        });
        if(generation!==this.generation)throw new DriveError('La conexión fue cancelada.');
        if(!google.accounts.oauth2.hasGrantedAllScopes(token,SCOPE))throw new DriveError('No se concedió el permiso para los archivos de AstroDB.');
        const lifetime=Number(token.expires_in);
        if(!Number.isFinite(lifetime)||lifetime<=30)throw new DriveError('Google no devolvió una sesión válida. Vuelve a conectar.');
        this.session={token:token.access_token,expires:this.clock()+(lifetime-30)*1000,generation};
        const s=this.session;
        const about=await (await this.request('https://www.googleapis.com/drive/v3/about?fields=user(permissionId,emailAddress)',{},s)).json();
        if(!about.user?.permissionId)throw new DriveError('No se pudo identificar la cuenta de Drive.');
        s.account=String(about.user.permissionId);s.email=about.user.emailAddress||'';
        this.onState({state:'connected',email:s.email});return this.state();
      }catch(error){if(generation===this.generation)this.disconnect();throw error;}
      finally{this.connecting=false;}
    }
    assertSession(s){
      if(!s||this.session!==s||s.generation!==this.generation)throw new DriveError('Drive no está conectado.');
      if(s.expires<=this.clock()){this.disconnect();throw new DriveError('La sesión de Drive ha caducado. Pulsa Conectar Google Drive.',401);}
    }
    async request(url,options={},s=this.session){
      this.assertSession(s);
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000);
      try{
        const response=await this.fetch(url,{...options,headers:{...options.headers,Authorization:'Bearer '+s.token},signal:controller.signal});
        this.assertSession(s);
        if(response.status===401){this.disconnect();throw new DriveError('Google ha caducado o revocado el acceso. Vuelve a conectar Drive.',401);}
        if(!response.ok)throw new DriveError(response.status===403?'Drive no permite esta operación. Revisa el permiso y el espacio disponible.':'Drive no confirmó la operación ('+response.status+').',response.status);
        return response;
      }catch(error){if(error instanceof DriveError)throw error;throw new DriveError('No se pudo contactar con Drive. La copia queda pendiente; puedes reintentar.');}
      finally{clearTimeout(timer);}
    }
    async hash(value){
      const bytes=await this.crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
      return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    }
    serial(key,task){
      const prev=this.queues.get(key)||Promise.resolve();
      const next=prev.catch(()=>{}).then(()=>globalThis.navigator?.locks?globalThis.navigator.locks.request('astrodb-drive-'+key,task):task());this.queues.set(key,next);
      return next.finally(()=>{if(this.queues.get(key)===next)this.queues.delete(key);});
    }
    async find(stableKey,parent,s){
      const query="trashed = false and appProperties has { key='app' and value='"+APP+"' } and appProperties has { key='stable_key' and value='"+stableKey+"' }"+(parent?" and '"+parent+"' in parents":'');
      const params=new URLSearchParams({q:query,fields:'files(id),nextPageToken',pageSize:'2'});
      const data=await(await this.request(API+'?'+params,{},s)).json();
      if(data.nextPageToken||data.files?.length>1)throw new DriveError('Hay copias duplicadas en Drive para esta ficha. No se sobrescribirá ninguna.');
      return data.files?.[0]?.id||null;
    }
    async inspect(id,key,parent,mimeType,s){
      const meta=await(await this.request(API+'/'+encodeURIComponent(id)+'?fields=id,trashed,parents,mimeType,appProperties',{},s)).json();
      if(meta.trashed||meta.mimeType!==mimeType||meta.appProperties?.app!==APP||meta.appProperties?.stable_key!==key||(parent&&!meta.parents?.includes(parent)))throw new DriveError('La copia de Drive fue movida, eliminada o no corresponde a esta ficha.');
      return meta;
    }
    async upsert(kind,name,content,parent,s){
      const key=await this.hash(JSON.stringify([s.account,kind,parent||'',content===null?'folder':(content.chart_id??content.meta?.subject_id)]));
      const storageKey='astrodb.drive.id.'+key;
      const mimeType=content===null?FOLDER:'application/json';
      let id=this.storage.getItem(storageKey);let exists=false;
      if(id){try{await this.inspect(id,key,parent,mimeType,s);exists=true;}catch(error){if(error.status!==404)throw error;id=null;}}
      if(!id){
        id=await this.find(key,parent,s);
        if(id){await this.inspect(id,key,parent,mimeType,s);exists=true;}
        else{id=(await(await this.request(API+'/generateIds?count=1&space=drive',{},s)).json()).ids?.[0];if(!id)throw new DriveError('Drive no pudo reservar el identificador de la copia.');}
        this.storage.setItem(storageKey,id); // Reserve before writing, including retries after uncertain responses.
      }
      const text=content===null?null:JSON.stringify(content,null,2);
      const metadata={name,mimeType,appProperties:{app:APP,stable_key:key}};
      const write=async create=>{
        let body,headers;
        const meta=create?{...metadata,id,...(parent?{parents:[parent]}:{})}:metadata;
        if(text===null){body=JSON.stringify(meta);headers={'Content-Type':'application/json'};}
        else{
          const boundary='astrodb_'+this.crypto.randomUUID();
          body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+text+'\r\n--'+boundary+'--';
          headers={'Content-Type':'multipart/related; boundary='+boundary};
        }
        const base=text===null?API:UPLOAD;
        return this.request(base+(create?'':'/'+encodeURIComponent(id))+'?'+new URLSearchParams({...(text===null?{}:{uploadType:'multipart'}),fields:'id'}),{method:create?'POST':'PATCH',headers,body},s);
      };
      if(!exists){try{await write(true);}catch(error){if(error.status!==409)throw error;await this.inspect(id,key,parent,mimeType,s);exists=true;}}
      if(exists&&text!==null)await write(false);
      await this.inspect(id,key,parent,mimeType,s);
      if(text!==null){const read=await(await this.request(API+'/'+encodeURIComponent(id)+'?alt=media',{},s)).text();if(read!==text)throw new DriveError('La copia de Drive no coincide con el contenido enviado.');}
      return id;
    }
    // A readable label never determines identity; the stable chart ID does.
    filenameLabel(chart){
      const raw=String(chart?.nombre??chart?.name??'').normalize('NFC').trim();
      const safe=raw.replace(/[\/<>:"|?*\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').replace(/^\.+|\.+$/g,'').trim().slice(0,90);
      return safe||'Sin nombre';
    }
    fileBase(prefix,chart){
      const id=String(chart.id).replace(/[^\w.-]/g,'_');
      return prefix+'_'+this.filenameLabel(chart)+'_'+id+'.json';
    }
    async save(bundle){
      if(!bundle||bundle.format!=='qs33ds.astrodb.codigo-semilla.v1'||bundle.chart_id!==String(bundle.chart?.id)||bundle.natalcore?.meta?.subject_id!=='astrodb:'+bundle.chart_id)throw new DriveError('La ficha y NatalCore no tienen la misma identidad.');
      const snapshot=JSON.parse(JSON.stringify(bundle));const s=this.session;this.assertSession(s);
      const key=JSON.stringify([s.account,snapshot.chart_id]);
      return this.serial('root',async()=>{
        this.assertSession(s);
        const root=await this.upsert('root','Código Semilla · AstroDB automático',null,null,s);
        const folders={};
        for(const [kind,name] of [['natalcore','01 · NatalCore JSON'],['charts','02 · Exportaciones AstroDB'],['logs','03 · Registros de sincronización']])folders[kind]=await this.upsert(kind,name,null,root,s);
        return {root,folders};
      }).then(({root,folders})=>this.serial(key,async()=>{
        this.assertSession(s);
        const operation=async()=>{
          const outcomes={};
          const nc=snapshot.natalcore;
          const automatic={...snapshot,storage_destination:'google_drive_oauth'};
          const writes=await Promise.allSettled([
            this.upsert('chart',this.fileBase('AstroDB',snapshot.chart),automatic,folders.charts,s),
            this.upsert('natalcore',this.fileBase('NatalCore',snapshot.chart),nc,folders.natalcore,s)
          ]);
          ['chart','natalcore'].forEach((kind,i)=>{const r=writes[i];outcomes[kind]=r.status==='fulfilled'?{state:'success',id:r.value}:{state:'error',message:r.reason.message};});
          const log={format:'qs33ds.astrodb.sync.v1',chart_id:snapshot.chart_id,at:new Date(this.clock()).toISOString(),destinations:outcomes};
          try{outcomes.log={state:'success',id:await this.upsert('log',this.fileBase('Sincronizacion',snapshot.chart),log,folders.logs,s)};}
          catch(error){outcomes.log={state:'error',message:error.message};}
          return {ok:Object.values(outcomes).every(r=>r.state==='success'),root,outcomes};
        };
        return operation();
      }));
    }
  }
  return {Client,DriveError,SCOPE};
});
