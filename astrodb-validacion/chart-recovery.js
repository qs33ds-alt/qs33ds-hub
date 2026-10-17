(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.AstroDBRecovery=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function merge(existing,incoming){
    const result=existing.slice();const ids=new Set(existing.filter(f=>f&&typeof f==='object'&&f.id!=null&&String(f.id)!=='').map(f=>String(f.id)));let added=0,skipped=0;
    for(const ficha of incoming){
      if(!ficha||typeof ficha!=='object'||Array.isArray(ficha)||ficha.id==null||String(ficha.id)===''){skipped++;continue;}
      const id=String(ficha.id);if(ids.has(id)){skipped++;continue;}
      result.push(JSON.parse(JSON.stringify(ficha)));ids.add(id);added++;
    }
    return {records:result,added,skipped};
  }
  function readLegacy(storage,keys){
    const records=[];const unreadable=[];
    for(const key of keys){
      const raw=storage.getItem(key);if(raw==null)continue;
      try{
        const data=JSON.parse(raw);if(!Array.isArray(data))throw Error('not an array');
        data.forEach((f,index)=>{if(f&&typeof f==='object'&&!Array.isArray(f))records.push({...f,id:f.id??('legacy:'+key+':'+index)});});
      }catch(error){unreadable.push(key);}
    }
    return {records,unreadable};
  }
  function fromSupabase(row){
    if(!row||typeof row!=='object')throw Error('Registro remoto inválido.');
    const input=row.input_data&&typeof row.input_data==='object'&&!Array.isArray(row.input_data)?row.input_data:{};
    const chart=row.chart_data||{};const birth=String(row.birth_date||'').split('-');
    const id=input.id??input.astrodb_local_id??row.chart_local_id??(row.id?'supabase:'+row.id:null);
    if(id==null||String(id)==='')throw Error('Ficha remota sin identificador.');
    const array=(primary,fallback)=>Array.isArray(primary)&&primary.length?primary:(Array.isArray(fallback)?fallback:[]);
    return {id,nombre:input.nombre??row.name??'Sin nombre',dia:input.dia??birth[2]??'',mes:input.mes??birth[1]??'',anio:input.anio??birth[0]??'',
      hora:input.hora??row.birth_time??'',ciudad:input.ciudad??row.birth_place??'',lat:input.lat??row.latitude??'',lon:input.lon??row.longitude??'',tz:input.tz??row.timezone??'',
      planetas:array(chart.planetas,input.planetas),casas:array(chart.casas,input.casas),ephemeris:input.ephemeris??row.natalcore?.ephemeris??null,interpretacion:input.interpretacion??row.notes??''};
  }
  async function readSupabase(client,userId,isCurrent=()=>true){
    const records=[];const pageSize=200;
    for(let offset=0;;offset+=pageSize){
      if(!isCurrent())throw Error('La cuenta cambió durante la recuperación.');
      const {data,error}=await client.from('astrodb_charts')
        .select('id,user_id,name,birth_date,birth_time,birth_place,latitude,longitude,timezone,input_data,chart_data,natalcore,notes,chart_local_id')
        .eq('user_id',userId).order('id').range(offset,offset+pageSize-1);
      if(!isCurrent())throw Error('La cuenta cambió durante la recuperación.');
      if(error)throw Error('No se pudieron recuperar las fichas de Supabase. Revisa la sesión y reintenta.');
      if(!Array.isArray(data)||data.length>pageSize||data.some(row=>row.user_id!==userId))throw Error('La respuesta no corresponde a la cuenta iniciada.');
      const page=data.map(fromSupabase);
      // Reject repeated rows across pages instead of silently treating partial pagination as complete.
      const seen=new Set(records.map(record=>String(record.id)));
      if(page.some(record=>seen.has(String(record.id)))||new Set(page.map(record=>String(record.id))).size!==page.length)throw Error('Supabase devolvió fichas duplicadas durante la paginación. Reintenta la recuperación.');
      records.push(...page);
      if(data.length<pageSize)return records;
    }
  }
  return {merge,readLegacy,fromSupabase,readSupabase};
});
