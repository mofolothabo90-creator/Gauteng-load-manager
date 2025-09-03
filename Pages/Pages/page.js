import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function dateYMD(iso){ return iso ? new Date(iso).toISOString().slice(0,10) : ''; }
function formatZAR(n){ try { return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(n); } catch { return 'R' + n; } }

export default function Home(){
  const [session, setSession] = useState(null);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', company:'', origin:'', destination:'', pickupDate:'', equipment:'', weightTons:'', rateZAR:'', sector:'general', commodityType:'' });

  // search web
  const [webQuery, setWebQuery] = useState('trucking contracts Gauteng');
  const [webResults, setWebResults] = useState({ mining:[], general:[] });
  const [webLoading, setWebLoading] = useState(false);

  useEffect(()=>{
    // auth session
    const s = supabase.auth.getSession().then(r => { setSession(r.data.session); });
    const sub = supabase.auth.onAuthStateChange((_event, s2) => setSession(s2?.session ?? null));
    // fetch loads
    fetchLoads();
    return () => { sub?.subscription?.unsubscribe?.(); };
  }, []);

  async function fetchLoads(){
    setLoading(true);
    const { data, error } = await supabase.from('loads').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) console.error(error);
    else setLoads(data || []);
    setLoading(false);
  }

  async function postLoad(){
    const payload = { ...form };
    const { data, error } = await supabase.from('loads').insert([{
      title: payload.title,
      company: payload.company,
      origin: payload.origin,
      destination: payload.destination,
      pickup_date: payload.pickupDate || null,
      equipment: payload.equipment,
      weight_tons: payload.weightTons ? Number(payload.weightTons) : null,
      rate_zar: payload.rateZAR ? Number(payload.rateZAR) : null,
      sector: payload.sector,
      commodity_type: payload.commodityType || null,
      status: 'open'
    }]).select().single();
    if (error) { alert('Error posting load: '+error.message); console.error(error); return; }
    setForm({ title:'', company:'', origin:'', destination:'', pickupDate:'', equipment:'', weightTons:'', rateZAR:'', sector:'general', commodityType:'' });
    setShowForm(false);
    fetchLoads();
  }

  async function signInWithGoogle(){
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) console.error(error);
  }

  async function logout(){ await supabase.auth.signOut(); setSession(null); }

  async function searchWeb(sector){
    setWebLoading(true);
    try{
      const res = await fetch(`/api/searchContracts?q=${encodeURIComponent(webQuery)}&sector=${sector}`);
      const json = await res.json();
      setWebResults(prev => ({ ...prev, [sector]: json.results || [] }));
    }catch(e){ console.error(e); alert('Web search failed'); }
    setWebLoading(false);
  }

  return (
    <div style={{fontFamily:'system-ui,Segoe UI,Roboto',margin:'18px'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h1>Gauteng Trucking Marketplace</h1>
          <div style={{color:'#555'}}>Shippers post loads. Carriers book. Mining & General supported.</div>
        </div>
        <div>
          {session?.user ? (
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div>{session.user.email}</div>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <button onClick={signInWithGoogle}>Sign in with Google</button>
          )}
        </div>
      </header>

      <main style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20,marginTop:16}}>
        <section>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <input placeholder="Search by title, origin, destination, commodity" style={{flex:1,padding:8}} onChange={()=>{}} />
            <button onClick={()=>setShowForm(true)}>Post Load</button>
          </div>

          <div>
            <h2>Available Loads</h2>
            {loading ? <div>Loading...</div> : (
              <div style={{display:'grid',gap:10}}>
                {loads.map(l => (
                  <div key={l.id} style={{padding:10,border:'1px solid #e6eef6',borderRadius:8}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><strong>{l.title}</strong><small>{l.sector}</small></div>
                    <div style={{color:'#666'}}>{l.company}</div>
                    <div>{l.origin} → {l.destination}</div>
                    <div>Pickup: {dateYMD(l.pickup_date)}</div>
                    <div>{l.equipment} • {l.weight_tons}T • {formatZAR(l.rate_zar)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showForm && (
            <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
              <div style={{background:'#fff',padding:16,width:480,borderRadius:8}}>
                <h3>Post Load / Contract</h3>
                <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
                <input placeholder="Company (optional)" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
                <div style={{display:'flex',gap:8}}><input placeholder="Origin" value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} style={{flex:1,padding:8}} /><input placeholder="Destination" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} style={{flex:1,padding:8}} /></div>
                <input type="date" value={form.pickupDate} onChange={e=>setForm({...form,pickupDate:e.target.value})} style={{width:'100%',padding:8,marginTop:8}} />
                <input placeholder="Equipment (e.g., Side Tipper 34T)" value={form.equipment} onChange={e=>setForm({...form,equipment:e.target.value})} style={{width:'100%',padding:8,marginTop:8}} />
                <div style={{display:'flex',gap:8,marginTop:8}}><input placeholder="Weight (Tons)" value={form.weightTons} onChange={e=>setForm({...form,weightTons:e.target.value})} style={{flex:1,padding:8}} /><input placeholder="Rate ZAR" value={form.rateZAR} onChange={e=>setForm({...form,rateZAR:e.target.value})} style={{flex:1,padding:8}} /></div>
                <div style={{marginTop:8}}><label>Sector </label><select value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})}><option value="general">General</option><option value="mining">Mining</option></select></div>
                {form.sector==='mining' && <input placeholder="Commodity (coal, chrome...)" value={form.commodityType} onChange={e=>setForm({...form,commodityType:e.target.value})} style={{width:'100%',padding:8,marginTop:8}} />}
                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}><button onClick={()=>setShowForm(false)}>Cancel</button><button onClick={postLoad}>Post</button></div>
              </div>
            </div>
          )}
        </section>

        <aside>
          <div style={{padding:12,background:'#fff',borderRadius:8}}>
            <h4>Search Web Contracts</h4>
            <input value={webQuery} onChange={e=>setWebQuery(e.target.value)} style={{width:'100%',padding:8,marginBottom:8}} />
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>searchWeb('general')} disabled={webLoading}>Search General</button>
              <button onClick={()=>searchWeb('mining')} disabled={webLoading}>Search Mining</button>
            </div>
            <div style={{marginTop:12}}>
              <h5>Mining Results</h5>
              {webResults.mining.map((r,i)=> <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{display:'block',padding:8}}>{r.title}</a>)}
              <h5>General Results</h5>
              {webResults.general.map((r,i)=> <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{display:'block',padding:8}}>{r.title}</a>)}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function dateYMD(iso){ return iso ? new Date(iso).toISOString().slice(0,10) : ''; }
function formatZAR(n){ try { return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(n); } catch { return 'R' + n; } }

export default function Home(){
  const [session, setSession] = useState(null);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', company:'', origin:'', destination:'', pickupDate:'', equipment:'', weightTons:'', rateZAR:'', sector:'general', commodityType:'' });

  // search web
  const [webQuery, setWebQuery] = useState('trucking contracts Gauteng');
  const [webResults, setWebResults] = useState({ mining:[], general:[] });
  const [webLoading, setWebLoading] = useState(false);

  useEffect(()=>{
    // auth session
    const s = supabase.auth.getSession().then(r => { setSession(r.data.session); });
    const sub = supabase.auth.onAuthStateChange((_event, s2) => setSession(s2?.session ?? null));
    // fetch loads
    fetchLoads();
    return () => { sub?.subscription?.unsubscribe?.(); };
  }, []);

  async function fetchLoads(){
    setLoading(true);
    const { data, error } = await supabase.from('loads').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) console.error(error);
    else setLoads(data || []);
    setLoading(false);
  }

  async function postLoad(){
    const payload = { ...form };
    const { data, error } = await supabase.from('loads').insert([{
      title: payload.title,
      company: payload.company,
      origin: payload.origin,
      destination: payload.destination,
      pickup_date: payload.pickupDate || null,
      equipment: payload.equipment,
      weight_tons: payload.weightTons ? Number(payload.weightTons) : null,
      rate_zar: payload.rateZAR ? Number(payload.rateZAR) : null,
      sector: payload.sector,
      commodity_type: payload.commodityType || null,
      status: 'open'
    }]).select().single();
    if (error) { alert('Error posting load: '+error.message); console.error(error); return; }
    setForm({ title:'', company:'', origin:'', destination:'', pickupDate:'', equipment:'', weightTons:'', rateZAR:'', sector:'general', commodityType:'' });
    setShowForm(false);
    fetchLoads();
  }

  async function signInWithGoogle(){
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) console.error(error);
  }

  async function logout(){ await supabase.auth.signOut(); setSession(null); }

  async function searchWeb(sector){
    setWebLoading(true);
    try{
      const res = await fetch(`/api/searchContracts?q=${encodeURIComponent(webQuery)}&sector=${sector}`);
      const json = await res.json();
      setWebResults(prev => ({ ...prev, [sector]: json.results || [] }));
    }catch(e){ console.error(e); alert('Web search failed'); }
    setWebLoading(false);
  }

  return (
    <div style={{fontFamily:'system-ui,Segoe UI,Roboto',margin:'18px'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h1>Gauteng Trucking Marketplace</h1>
          <div style={{color:'#555'}}>Shippers post loads. Carriers book. Mining & General supported.</div>
        </div>
        <div>
          {session?.user ? (
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div>{session.user.email}</div>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <button onClick={signInWithGoogle}>Sign in with Google</button>
          )}
        </div>
      </header>

      <main style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20,marginTop:16}}>
        <section>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <input placeholder="Search by title, origin, destination, commodity" style={{flex:1,padding:8}} onChange={()=>{}} />
            <button onClick={()=>setShowForm(true)}>Post Load</button>
          </div>

          <div>
            <h2>Available Loads</h2>
            {loading ? <div>Loading...</div> : (
              <div style={{display:'grid',gap:10}}>
                {loads.map(l => (
                  <div key={l.id} style={{padding:10,border:'1px solid #e6eef6',borderRadius:8}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><strong>{l.title}</strong><small>{l.sector}</small></div>
                    <div style={{color:'#666'}}>{l.company}</div>
                    <div>{l.origin} → {l.destination}</div>
                    <div>Pickup: {dateYMD(l.pickup_date)}</div>
                    <div>{l.equipment} • {l.weight_tons}T • {formatZAR(l.rate_zar)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showForm && (
            <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}>
              <div style={{background:'#fff',padding:16,width:480,borderRadius:8}}>
                <h3>Post Load / Contract</h3>
                <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
                <input placeholder="Company (optional)" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} style={{width:'100%',padding:8,marginBottom:8}} />
                <div style={{display:'flex',gap:8}}><input placeholder="Origin" value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} style={{flex:1,padding:8}} /><input placeholder="Destination" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} style={{flex:1,padding:8}} /></div>
                <input type="date" value={form.pickupDate} onChange={e=>setForm({...form,pickupDate:e.target.value})} style={{width:'100%',padding:8,marginTop:8}} />
                <input placeholder="Equipment (e.g., Side Tipper 34T)" value={form.equipment} onChange={e=>setForm({...form,equipment:e.target.value})} style={{width:'100%',padding:8,marginTop:8}} />
                <div style={{display:'flex',gap:8,marginTop:8}}><input placeholder="Weight (Tons)" value={form.weightTons} onChange={e=>setForm({...form,weightTons:e.target.value})} style={{flex:1,padding:8}} /><input placeholder="Rate ZAR" value={form.rateZAR} onChange={e=>setForm({...form,rateZAR:e.target.value})} style={{flex:1,padding:8}} /></div>
                <div style={{marginTop:8}}><label>Sector </label><select value={form.sector} onChange={e=>setForm({...form,sector:e.target.value})}><option value="general">General</option><option value="mining">Mining</option></select></div>
                {form.sector==='mining' && <input placeholder="Commodity (coal, chrome...)" value={form.commodityType} onChange={e=>setForm({...form,commodityType:e.target.value})} style={{width:'100%',padding:8,marginTop:8}} />}
                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}><button onClick={()=>setShowForm(false)}>Cancel</button><button onClick={postLoad}>Post</button></div>
              </div>
            </div>
          )}
        </section>

        <aside>
          <div style={{padding:12,background:'#fff',borderRadius:8}}>
            <h4>Search Web Contracts</h4>
            <input value={webQuery} onChange={e=>setWebQuery(e.target.value)} style={{width:'100%',padding:8,marginBottom:8}} />
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>searchWeb('general')} disabled={webLoading}>Search General</button>
              <button onClick={()=>searchWeb('mining')} disabled={webLoading}>Search Mining</button>
            </div>
            <div style={{marginTop:12}}>
              <h5>Mining Results</h5>
              {webResults.mining.map((r,i)=> <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{display:'block',padding:8}}>{r.title}</a>)}
              <h5>General Results</h5>
              {webResults.general.map((r,i)=> <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{display:'block',padding:8}}>{r.title}</a>)}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
