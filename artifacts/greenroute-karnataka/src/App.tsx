import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter, Link } from 'wouter';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Bus, CalendarDays, Car, Check, ChevronDown, CircleHelp, CloudRain, Compass, Copy, Footprints, Leaf, MapPin, Moon, Navigation, Plus, Printer, RotateCcw, Save, Search, Share2, SlidersHorizontal, Sparkles, Sun, Train, Trash2, TrendingDown, X, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { getGetPlaceMediaQueryKey, getGetWeatherQueryKey, useCreateItinerary, useGetGreenRouteHealth, useGetHubs, useGetPlaceMedia, useGetPlaces, useGetWeather, useHealthCheck, useReplanItinerary, useReplanItineraryInNaturalLanguage } from '@workspace/api-client-react';
import type { GetPlacesParams, Hub, Itinerary, Mode, Place, RankedPlace, ReplanRequest, Strategy, TripInput } from '@workspace/api-client-react';
import { modeColors, modeNames, RouteMap } from '@/components/route-map';

const queryClient = new QueryClient();
const interestNames: Record<string,string> = {history:'History',nature:'Nature',waterfalls:'Waterfalls',beaches:'Coast',temples:'Temples',adventure:'Adventure',food:'Food',wildlife:'Wildlife','hidden-gems':'Hidden gems'};
const strategyNames: Record<Strategy,string> = {balanced:'Balanced',greenest:'Lowest carbon',cheapest:'Lowest cost',fastest:'Fastest'};
const initialInput: TripInput = {startHub:'Bengaluru',days:3,budget:5000,interests:['history','nature'],pace:'balanced',priority:'greenest',walking:'medium',month:11,hiddenGems:true};
const presetList: {title:string;sub:string;input:TripInput;symbol:string}[] = [
  {title:'Heritage & Nature',sub:'Royal Mysuru, Hoysala stone and greener connections',symbol:'01',input:{...initialInput,startHub:'Bengaluru',days:3,budget:5000,interests:['history','nature'],pace:'balanced',priority:'greenest',walking:'medium'}},
  {title:'Coastal & Waterfalls',sub:'Sea air, falls and coastal kitchens',symbol:'02',input:{...initialInput,startHub:'Mangaluru',days:4,budget:8000,interests:['beaches','waterfalls','food'],pace:'balanced',priority:'balanced',walking:'medium'}},
  {title:'Bengaluru Green Weekend',sub:'A two-day city break with metro-friendly stops',symbol:'03',input:{...initialInput,startHub:'Bengaluru',days:2,budget:2000,interests:['nature','food','history'],pace:'balanced',priority:'greenest',walking:'low',mustVisit:['cubbon-vidhana','lalbagh','vv-puram-food']}}
];
type SavedTrip = {id:string;name:string;savedAt:string;itinerary:Itinerary};
type TripDiff = {removedStops:string[];addedStops:string[];modeChanges:string[];costDelta:number;timeDelta:number;co2Delta:number};
const getSaved = (): SavedTrip[] => { try { return JSON.parse(localStorage.getItem('greenroute-trips') || '[]') as SavedTrip[]; } catch { return []; } };
const getCurrentTrip = (): Itinerary|null => {
  try {
    const trip = JSON.parse(localStorage.getItem('greenroute-current-trip') || 'null') as Itinerary|null;
    return trip?.input && Array.isArray(trip.days) ? trip : null;
  } catch {
    return null;
  }
};
const money = (n:number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const hours = (n:number) => `${Math.floor(n/60)}h ${Math.round(n%60)}m`;
const arrivalTimes = (day:Itinerary['days'][number],strategy:Strategy) => {
  let cursor=8*60+30;
  return day.stops.map((stop,index)=>{
    const arrival=cursor+(day.legs[index]?.chosen[strategy].minutes??0);
    const scheduled=arrival>=13*60&&cursor<13*60?arrival+45:arrival;
    const time=`${String(Math.floor(scheduled/60)%24).padStart(2,'0')}:${String(Math.round(scheduled%60)).padStart(2,'0')}`;
    cursor=scheduled+stop.place.visitHrs*60;
    return time;
  });
};

function App() {
  const [location,setLocation] = useLocation();
  const [itinerary,setItinerary] = useState<Itinerary|null>(()=>getCurrentTrip());
  const [input,setInput] = useState<TripInput>(()=>getCurrentTrip()?.input ?? initialInput);
  const [step,setStep] = useState(1);
  const [strategy,setStrategy] = useState<Strategy>(()=>getCurrentTrip()?.input.priority ?? 'balanced');
  const [selectedDay,setSelectedDay] = useState(0);
  const [drawer,setDrawer] = useState(false);
  const [dark,setDark] = useState(()=>localStorage.getItem('greenroute-theme')==='dark');
  const [saved,setSaved] = useState<SavedTrip[]>(getSaved);
  const [activePlace,setActivePlace] = useState<RankedPlace|null>(null);
  const [query,setQuery] = useState('');
  const [exploreHub,setExploreHub] = useState('');
  const [notice,setNotice] = useState('');
  const [naturalText,setNaturalText] = useState('');
  const [replanDiff,setReplanDiff] = useState<TripDiff|null>(null);
  const [excludedStops,setExcludedStops] = useState<string[]>([]);
  const [mobilePane,setMobilePane] = useState<'list'|'map'>('list');
  const [replanChanges,setReplanChanges] = useState({budget:16000,days:4,walking:'medium' as TripInput['walking'],priority:'balanced' as Strategy});
  const [exploreInterests,setExploreInterests] = useState<TripInput['interests']>([]);
  const [exploreMaxFee,setExploreMaxFee] = useState<number|undefined>(undefined);
  const [exploreHiddenOnly,setExploreHiddenOnly] = useState(false);
  const placesParams: GetPlacesParams = {hub:exploreHub || undefined, interests:exploreInterests.length?exploreInterests.join(','):undefined, month:input.month, hidden:exploreHiddenOnly || undefined, maxFee:exploreMaxFee};
  const healthz = useHealthCheck();
  const health = useGetGreenRouteHealth();
  const hubsQuery = useGetHubs();
  const placesQuery = useGetPlaces(placesParams);
  const mediaQuery = useGetPlaceMedia(activePlace?.id ?? '', {query:{enabled:!!activePlace?.id,queryKey:getGetPlaceMediaQueryKey(activePlace?.id ?? '')}});
  const create = useCreateItinerary();
  const replan = useReplanItinerary();
  const naturalReplan = useReplanItineraryInNaturalLanguage();
  const hubs = hubsQuery.data ?? [];
  const activeTotals = itinerary?.totals[strategy];
  const explorePlaces = useMemo(()=> (placesQuery.data ?? []).filter(p=>!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.region.toLowerCase().includes(query.toLowerCase()) || p.tags.some(t=>interestNames[t].toLowerCase().includes(query.toLowerCase()))),[placesQuery.data,query]);

  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('greenroute-theme',dark?'dark':'light')},[dark]);
  useEffect(()=>{
    if (!itinerary) {
      localStorage.removeItem('greenroute-current-trip');
      return;
    }
    const currentTrip = {...itinerary,input:{...itinerary.input,priority:strategy}};
    localStorage.setItem('greenroute-current-trip',JSON.stringify(currentTrip));
  },[itinerary,strategy]);
  useEffect(()=>{if(location==='/plan') setStep(1)},[location]);
  useEffect(()=>{if(itinerary) setReplanChanges({budget:itinerary.input.budget,days:itinerary.input.days,walking:itinerary.input.walking,priority:strategy})},[itinerary,strategy]);
  const notify = (message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(''),2800)};
  const runPlan=(trip:TripInput)=>{setInput(trip);create.mutate({data:trip},{onSuccess:(data)=>{setItinerary(data);setStrategy(trip.priority);setSelectedDay(0);setLocation('/results')},onError:()=>notify('We could not build this route. Please try again.')})};
  const saveTrip=()=>{if(!itinerary)return;const savedItinerary={...itinerary,input:{...itinerary.input,priority:strategy}};const entry:SavedTrip={id:`${Date.now()}`,name:`${itinerary.input.startHub} · ${itinerary.input.days} days`,savedAt:new Date().toISOString(),itinerary:savedItinerary};const next=[entry,...saved];setSaved(next);localStorage.setItem('greenroute-trips',JSON.stringify(next));notify('Trip saved to your collection.')};
  const removeSaved=(id:string)=>{const next=saved.filter(t=>t.id!==id);setSaved(next);localStorage.setItem('greenroute-trips',JSON.stringify(next))};
  const duplicate=(t:SavedTrip)=>{const copy:SavedTrip={...t,id:`${Date.now()}`,name:`${t.name} (copy)`,savedAt:new Date().toISOString()};const next=[copy,...saved];setSaved(next);localStorage.setItem('greenroute-trips',JSON.stringify(next));notify('A copy is ready in your trips.')};
  const loadTrip=(t:SavedTrip)=>{setItinerary(t.itinerary);setInput(t.itinerary.input);setStrategy(t.itinerary.input.priority);setLocation('/results')};
  const applyReplanResult=(response:{itinerary:Itinerary;diff:TripDiff},message:string)=>{setItinerary(response.itinerary);setInput(response.itinerary.input);setStrategy(response.itinerary.input.priority);setSelectedDay(0);setReplanDiff(response.diff);const cost=response.diff.costDelta<0?`Saved ${money(Math.abs(response.diff.costDelta))}`:response.diff.costDelta>0?`Estimate +${money(response.diff.costDelta)}`:'Cost unchanged';const carbon=response.diff.co2Delta<0?`−${Math.abs(response.diff.co2Delta).toFixed(1)}`:`+${response.diff.co2Delta.toFixed(1)}`;notify(`${message} ${cost}, ${carbon} kg CO₂.`)};
  const submitReplan=()=>{if(!itinerary)return;const changes={budget:replanChanges.budget,days:replanChanges.days,walking:replanChanges.walking,priority:replanChanges.priority,exclude:excludedStops};setReplanDiff(null);replan.mutate({data:{input:{...itinerary.input,priority:strategy},changes} as ReplanRequest},{onSuccess:(response)=>applyReplanResult(response,'Your route has been replanned.'),onError:()=>notify('Replanning failed. Please try again.')})};
  const submitNatural=()=>{if(!itinerary||!naturalText.trim())return;setReplanDiff(null);naturalReplan.mutate({data:{input:{...itinerary.input,priority:strategy},text:naturalText.trim()}},{onSuccess:(response)=>{setNaturalText('');applyReplanResult(response,'Your note is on the map. Route updated.')},onError:()=>notify('We could not interpret that change. Try a more specific request.')})};
  const applySuggestion=(suggestion:Itinerary['suggestions'][number])=>{if(!itinerary)return;setReplanDiff(null);replan.mutate({data:{input:{...itinerary.input,priority:strategy},changes:suggestion.changes as ReplanRequest['changes']}},{onSuccess:(response)=>applyReplanResult(response,'Updated route.'),onError:()=>notify('We could not apply that route change.')})};
  const shareTrip=async()=>{if(!itinerary)return;const summary=[`GreenRoute Karnataka · ${itinerary.input.days} days from ${itinerary.input.startHub}`,`${strategyNames[strategy]} route · ${money(itinerary.totals[strategy].cost)} · ${itinerary.totals[strategy].co2Kg.toFixed(1)} kg CO₂ · Eco score ${itinerary.ecoScore}/100`,...itinerary.days.map(day=>`Day ${day.dayNo}: ${day.stops.map(stop=>`${stop.arrive} ${stop.place.name}`).join(' → ')}`)].join('\n');try{await navigator.clipboard.writeText(summary);notify('Shareable trip summary copied.')}catch{notify('Copy is unavailable in this browser.')}};
  const currentRoute=location.startsWith('/results')||location.startsWith('/compare');

  return <div className="route-shell">
    <header className="topbar no-print">
      <Link href="/" className="brand" aria-label="GreenRoute home"><span className="brand-mark"><Leaf size={18}/></span>greenroute<span style={{fontWeight:500,color:'hsl(var(--muted-foreground))'}}>/ KA</span></Link>
      <nav className="navlinks" aria-label="Main navigation">
        <Link className={`navlink ${location==='/plan'?'active':''}`} href="/plan">Plan a trip</Link><Link className={`navlink ${location==='/explore'?'active':''}`} href="/explore">Explore</Link><Link className={`navlink ${location==='/trips'?'active':''}`} href="/trips">My trips</Link>
      </nav>
      {currentRoute && <button className="btn-quiet hide-mobile" onClick={()=>setDrawer(true)} aria-label="Change itinerary"><RotateCcw size={15}/>Replan</button>}
      <button className="btn-quiet" style={{padding:10,borderRadius:99}} onClick={()=>setDark(!dark)} aria-label={dark?'Switch to light theme':'Switch to dark theme'} data-testid="button-theme">{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
    </header>
    <Switch>
      <Route path="/" component={()=> <Home healthText={health.data?.status ?? healthz.data?.status} hubs={hubs} placesCount={placesQuery.data?.length} onPlan={runPlan} loading={create.isPending} onPreset={(trip)=>runPlan(trip)} hubsLoading={hubsQuery.isLoading}/>} />
      <Route path="/plan" component={()=> <PlanPage input={input} setInput={setInput} step={step} setStep={setStep} hubs={hubs} loading={create.isPending} error={create.isError} onSubmit={runPlan} hubsLoading={hubsQuery.isLoading}/>} />
      <Route path="/results" component={()=> itinerary ? <Results itinerary={itinerary} strategy={strategy} setStrategy={setStrategy} day={selectedDay} setDay={setSelectedDay} onReplan={()=>{setReplanDiff(null);setExcludedStops([]);setDrawer(true)}} onSave={saveTrip} onShare={shareTrip} onQuickFix={applySuggestion} quickFixBusy={replan.isPending} onCompare={()=>setLocation('/compare')} mobilePane={mobilePane} setMobilePane={setMobilePane} hubs={hubs}/> : <EmptyResult onPlan={()=>setLocation('/plan')}/>} />
      <Route path="/compare" component={()=> itinerary ? <Compare itinerary={itinerary} strategy={strategy} setStrategy={setStrategy} onReplan={()=>setDrawer(true)}/> : <EmptyResult onPlan={()=>setLocation('/plan')}/>} />
      <Route path="/explore" component={()=> <Explore places={explorePlaces} loading={placesQuery.isLoading} error={placesQuery.isError} retry={()=>placesQuery.refetch()} query={query} setQuery={setQuery} hubs={hubs} hub={exploreHub} setHub={setExploreHub} activePlace={activePlace} setActive={setActivePlace} media={mediaQuery.data} mediaLoading={mediaQuery.isLoading} shortlist={input.mustVisit??[]} toggleShortlist={(id)=>setInput({...input,mustVisit:input.mustVisit?.includes(id)?input.mustVisit.filter(i=>i!==id):[...(input.mustVisit??[]),id]})} interests={exploreInterests} setInterests={setExploreInterests} maxFee={exploreMaxFee} setMaxFee={setExploreMaxFee} hiddenOnly={exploreHiddenOnly} setHiddenOnly={setExploreHiddenOnly} month={input.month} onPlan={()=>setLocation('/plan')}/>} />
      <Route path="/trips" component={()=> <Trips saved={saved} load={loadTrip} duplicate={duplicate} remove={removeSaved} onPlan={()=>setLocation('/plan')}/>} />
      <Route component={NotFound}/>
    </Switch>
    {drawer&&itinerary&&<ReplanDrawer close={()=>setDrawer(false)} values={replanChanges} setValues={setReplanChanges} busy={replan.isPending||naturalReplan.isPending} submit={submitReplan} text={naturalText} setText={setNaturalText} submitText={submitNatural} diff={replanDiff} stops={itinerary.days.flatMap(d=>d.stops.map(s=>s.place))} excluded={excludedStops} setExcluded={setExcludedStops}/>}
    {notice&&<div role="status" className="toast-note"><Check size={16}/>{notice}</div>}
    <footer className="footer"><span>GREENROUTE / KARNATAKA</span><span className="footer-note">Made for the long way round. <small>Travel details are estimates; check local operators before going.</small></span><button onClick={()=>notify(health.isError||healthz.isError?'Travel planner connection unavailable':'Planner services online')} className="service-status" aria-label="Check planner service status"><span className={`status-dot ${health.isError||healthz.isError?'offline':''}`}/> Local route intelligence</button></footer>
  </div>;
}

function Home({healthText,hubs,placesCount,onPlan,loading,onPreset,hubsLoading}:{healthText?:string;hubs: {id:string;name:string}[];placesCount?:number;onPlan:(i:TripInput)=>void;loading:boolean;onPreset:(i:TripInput)=>void;hubsLoading:boolean}) {
  return <main>
    <section className="hero-art"><div className="page-wrap hero-content">
      <div className="hero-copy reveal"><div className="hero-label"><span className="hero-dot"/>LOCAL KNOW-HOW, ROUTED BETTER</div><h1 className="display">Find your<br/>own Karnataka.</h1><p>Thoughtful routes through the places locals love — sequenced around your time, budget and the way you like to travel.</p><div className="hero-actions"><Link href="/plan" className="hero-cta">Plan my trip <ArrowRight size={17}/></Link><Link href="/explore" className="hero-secondary"><Compass size={16}/> Wander first</Link></div><div className="hero-proof"><span><span className="proof-icon"><Leaf size={13}/></span>Lower-carbon options</span><span><span className="proof-icon"><Navigation size={13}/></span>Real route choices</span></div></div>
      <div className="hero-stamp reveal-2"><div className="stamp-top">FIELD NOTES · 001</div><div className="stamp-map"><svg viewBox="0 0 260 210" aria-label="Illustrated Karnataka trip route"><path d="M85 16 124 24 143 45 179 51 184 83 211 107 190 135 197 169 169 188 135 183 118 202 91 186 75 159 52 150 61 122 37 101 51 75 45 52 68 38Z" fill="none" stroke="rgba(235,240,207,.42)" strokeWidth="1.5" strokeDasharray="4 5"/><path d="M64 155 C90 135 85 100 119 93 C151 86 148 52 178 56" fill="none" stroke="#dbe8a8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 6"/><circle cx="64" cy="155" r="5" fill="#ec9168"/><circle cx="119" cy="93" r="4" fill="#dbe8a8"/><circle cx="178" cy="56" r="5" fill="#dbe8a8"/><text x="46" y="175" fill="#eff0d9" fontSize="9">MYSURU</text><text x="96" y="82" fill="#eff0d9" fontSize="9">COORG</text><text x="164" y="44" fill="#eff0d9" fontSize="9">HASSAN</text></svg></div><div className="stamp-bottom"><span>WESTERN GHATS</span><span>12°N — 76°E</span></div></div>
    </div></section>
     <section className="intro-band"><div className="page-wrap intro-grid"><div><div className="eyebrow">A better kind of trip planner</div><h2 className="display">The route is part<br/>of the story.</h2></div><p>We bring the details together: what’s worth the detour, how each day should flow, what the journey costs, and the smaller-footprint way to get there.</p></div></section>
     <section className="page-wrap home-stats" aria-label="GreenRoute planner facts"><div><b>{hubsLoading?'—':hubs.length}</b><span>starting hubs</span></div><div><b>{placesCount??'40+'}</b><span>Karnataka places</span></div><div><b>7</b><span>transport modes</span></div><div><b>4</b><span>route strategies</span></div></section>
    <section className="page-wrap presets"><div className="section-head"><div><div className="eyebrow">Start with a local lead</div><h2 className="display">A few good ways in.</h2></div><Link className="text-link" href="/plan">Build your own <ArrowUpRight size={15}/></Link></div><div className="preset-grid">{presetList.map((preset,i)=><button className={`preset-card preset-${i}`} key={preset.symbol} onClick={()=>onPreset(preset.input)} disabled={loading}><span className="preset-number">{preset.symbol} / SUGGESTED ROUTE</span><span className="preset-art" aria-hidden="true"><span className="preset-orbit"/><span className="preset-blob"/></span><span className="preset-card-title">{preset.title}</span><span className="preset-sub">{preset.sub}</span><span className="preset-cta">{loading?'Building route':'Explore this route'} <ArrowRight size={15}/></span></button>)}</div></section>
    <section className="field-note"><div className="page-wrap field-note-inner"><div><span className="eyebrow">Not sure where to start?</span><h2 className="display">Tell us what moves you.<br/>We’ll make a route.</h2></div><Link href="/plan" className="btn-main">Set your bearings <ArrowRight size={16}/></Link><div className="note-ornament"><span>ಕ</span></div></div></section>
    <section className="page-wrap promise-row"><div className="promise"><span className="promise-icon"><RouteIcon/></span><div><b>Four ways to get there</b><p>Compare time, fare and CO₂ per leg.</p></div></div><div className="promise"><span className="promise-icon"><Leaf size={20}/></span><div><b>Less guesswork</b><p>Days sequenced around real distances.</p></div></div><div className="promise"><span className="promise-icon"><MapPin size={20}/></span><div><b>Good local detours</b><p>Find quieter places between the classics.</p></div></div></section>
    <div className="sr-only">{hubsLoading?'Loading hubs':`${hubs.length} supported hubs`}{healthText?` Services ${healthText}`:''}</div>
  </main>;
}

function RouteIcon(){return <Navigation size={19}/>}

function PlanPage({input,setInput,step,setStep,hubs,loading,error,onSubmit,hubsLoading}:{input:TripInput;setInput:(v:TripInput)=>void;step:number;setStep:(v:number)=>void;hubs:{id:string;name:string;railConnected?:boolean;metro?:boolean}[];loading:boolean;error:boolean;onSubmit:(v:TripInput)=>void;hubsLoading:boolean}) {
  const interestKeys=Object.keys(interestNames);
  const [loadingFrame,setLoadingFrame]=useState(0);
  useEffect(()=>{if(!loading){setLoadingFrame(0);return}const timer=window.setInterval(()=>setLoadingFrame(frame=>(frame+1)%3),1150);return()=>window.clearInterval(timer)},[loading]);
  const loadingMessages=['Finding places…','Sequencing your days…','Optimising routes…'];
  const toggleInterest=(key:string)=>setInput({...input,interests:input.interests.includes(key as TripInput['interests'][number])?input.interests.filter(i=>i!==key):[...input.interests,key as TripInput['interests'][number]]});
  const next=()=>{if(step<3)setStep(step+1);else onSubmit(input)};
  return <main className="page-wrap plan-layout"><aside className="plan-aside"><span className="eyebrow">Trip setup / 0{step}</span><h1 className="display">Let’s get<br/>your bearings.</h1><p>A handful of choices is all it takes. We’ll do the route thinking.</p><div className="step-list">{['Starting point','Your kind of day','Travel style'].map((s,i)=><button key={s} onClick={()=>setStep(i+1)} className={`step-indicator ${step===i+1?'on':''}`}><span>{i+1<step?<Check size={14}/>:`0${i+1}`}</span>{s}</button>)}</div><div className="plan-aside-note"><Sparkles size={16}/><span>Change any detail later. The route adjusts with you.</span></div></aside>
    <section className="plan-form soft-card"><div className="form-step-tag">STEP {step} OF 3 <span className="form-progress"><i style={{width:`${step*33.34}%`}}/></span></div>
       {step===1&&<div className="reveal"><h2 className="display form-title">When and where?</h2><p className="form-subtitle">Pick your arrival hub and give us a little time to work with.</p><label className="form-label">I’m starting from</label><select className="field" value={input.startHub} onChange={e=>setInput({...input,startHub:e.target.value})} disabled={hubsLoading}>{hubs.length?hubs.map(h=><option key={h.id} value={h.id}>{h.name}{h.railConnected?' · rail connection':''}</option>):<><option>Bengaluru</option><option>Mysuru</option><option>Mangaluru</option></>}</select>{hubsLoading&&<small>Finding supported starting points…</small>}<div className="form-two"><div><label className="form-label">How many days?</label><div className="stepper"><button aria-label="Fewer days" onClick={()=>setInput({...input,days:Math.max(1,input.days-1)})}>−</button><strong>{input.days}<small> days</small></strong><button aria-label="More days" onClick={()=>setInput({...input,days:Math.min(7,input.days+1)})}>+</button></div></div><div><label className="form-label">Travel month</label><select className="field" value={input.month} onChange={e=>setInput({...input,month:Number(e.target.value)})}>{['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></div></div></div>}
      {step===2&&<div className="reveal"><h2 className="display form-title">What draws you in?</h2><p className="form-subtitle">Choose a few things. We’ll look for the right places, not just the obvious ones.</p><div className="interest-grid">{interestKeys.map(key=><button key={key} className={`interest-choice ${input.interests.includes(key as TripInput['interests'][number])?'chosen':''}`} onClick={()=>toggleInterest(key)}><span className="interest-check">{input.interests.includes(key as TripInput['interests'][number])&&<Check size={13}/>}</span><span>{interestNames[key]}</span></button>)}</div><label className="toggle-row"><span><b>Leave room for hidden gems</b><small>Include the quieter places locals keep to themselves.</small></span><input type="checkbox" checked={input.hiddenGems} onChange={e=>setInput({...input,hiddenGems:e.target.checked})}/><span className="toggle-track"/></label><div className="mustvisit-info"><MapPin size={17}/> You can pin specific must-visits from Explore, any time.</div></div>}
       {step===3&&<div className="reveal"><h2 className="display form-title">Make it feel like yours.</h2><p className="form-subtitle">Choose a budget, pace and route trade-off that sound right.</p><div className="budget-label"><label className="form-label">Budget for the trip</label><b>{money(input.budget)}</b></div><div className="budget-input-row"><input aria-label="Trip budget" className="budget-range" type="range" min="1500" max="50000" step="500" value={input.budget} onChange={e=>setInput({...input,budget:Number(e.target.value)})}/><input aria-label="Budget amount in rupees" className="field budget-number" type="number" min="1500" max="50000" step="500" value={input.budget} onChange={e=>setInput({...input,budget:Math.min(50000,Math.max(1500,Number(e.target.value)||1500))})}/></div><div className="range-bounds"><span>₹1,500</span><span>₹50,000</span></div><label className="form-label">Day pace</label><div className="option-row">{(['relaxed','balanced','packed'] as const).map(v=><button key={v} className={`option-card ${input.pace===v?'selected':''}`} onClick={()=>setInput({...input,pace:v})}><b>{v==='relaxed'?'Take it slow':v==='balanced'?'A little of both':'Fit it in'}</b><small>{v==='relaxed'?'Fewer stops, more breathing room':v==='balanced'?'A considered day out':'See as much as the day allows'}</small></button>)}</div><label className="form-label">Prioritise</label><div className="priority-row">{(['balanced','greenest','cheapest','fastest'] as Strategy[]).map(v=><button key={v} className={`priority-chip ${input.priority===v?'selected':''}`} onClick={()=>setInput({...input,priority:v})}>{v==='greenest'?<Leaf size={14}/>:v==='cheapest'?<TrendingDown size={14}/>:v==='fastest'?<Train size={14}/>:<Compass size={14}/>} {strategyNames[v]}</button>)}</div><label className="form-label">Walking comfort</label><div className="priority-row">{(['low','medium','high'] as const).map(v=><button key={v} className={`priority-chip ${input.walking===v?'selected':''}`} onClick={()=>setInput({...input,walking:v})}>{v==='low'?'Easy walks':v==='medium'?'Some walking':'Happy on foot'}</button>)}</div></div>}
      {error&&<div role="alert" className="form-error">We couldn’t make a route just now. Check the connection and try again.</div>}
       <div className="form-footer">{step>1?<button className="btn-quiet" onClick={()=>setStep(step-1)}><ArrowLeft size={15}/> Back</button>:<span className="privacy-note"><CircleHelp size={14}/> No account needed</span>}<button className="btn-main" onClick={next} disabled={loading||step===2&&!input.interests.length}>{loading?loadingMessages[loadingFrame]:step===3?'Generate itinerary':'Continue'}{step===3&&!loading?<ArrowRight size={16}/>:null}</button></div>
    </section>
  </main>;
}

function ModeBadge({mode}:{mode:Mode}) {
  const icons:Record<Mode,typeof Navigation>={walk:Footprints,metro:Train,bus:Bus,train:Train,auto:Car,cab:Car,ecab:Zap};
  const Icon=icons[mode];
  return <span className="mode-badge" style={{"--mode-color":modeColors[mode]} as React.CSSProperties}><Icon size={14}/>{modeNames[mode]}</span>;
}

function PlaceThumb({placeId,name}:{placeId:string;name:string}) {
  const media=useGetPlaceMedia(placeId,{query:{enabled:true,queryKey:getGetPlaceMediaQueryKey(placeId)}});
  return media.data?.thumbnail
    ? <img className="stop-photo" src={media.data.thumbnail} alt={`View of ${name}`} loading="lazy"/>
    : <div className="stop-photo stop-photo-fallback" aria-label={`${name} photo unavailable`}><span className="visual-shape"/></div>;
}

function WeatherBadge({place}:{place:Place}) {
  const params={lat:place.lat,lng:place.lng};
  const weather=useGetWeather(params,{query:{enabled:true,queryKey:getGetWeatherQueryKey(params)}});
  if(weather.isLoading)return <div className="stop-weather weather-loading" aria-label="Loading forecast">···</div>;
  if(!weather.data?.available)return <div className="stop-weather weather-unavailable"><span>—</span><small>forecast offline</small></div>;
  const rainy=place.outdoor&&weather.data.rainMm>=15;
  return <div className={`stop-weather ${rainy?'weather-rain':''}`} title={rainy?'Heavy rain forecast; consider an indoor stop':'Forecast for this stop'}>
    {rainy?<CloudRain size={18}/>:<span>{weather.data.tMax}°</span>}
    <small>{weather.data.rainMm}mm rain</small>
    {rainy&&<Link className="weather-swap" href="/explore">Indoor ideas</Link>}
  </div>;
}

function EcoGauge({score}:{score:number}) {
  const circumference=2*Math.PI*25;
  return <div className="eco-gauge" role="img" aria-label={`Eco score ${score} out of 100`}>
    <svg viewBox="0 0 64 64" aria-hidden="true"><circle className="eco-gauge-track" cx="32" cy="32" r="25"/><circle className="eco-gauge-value" cx="32" cy="32" r="25" style={{strokeDasharray:circumference,strokeDashoffset:circumference*(1-score/100)}}/></svg>
    <span>{score}<small>/100</small></span>
  </div>;
}

function Results({itinerary,strategy,setStrategy,day,setDay,onReplan,onSave,onShare,onQuickFix,quickFixBusy,onCompare,mobilePane,setMobilePane,hubs}:{itinerary:Itinerary;strategy:Strategy;setStrategy:(s:Strategy)=>void;day:number;setDay:(n:number)=>void;onReplan:()=>void;onSave:()=>void;onShare:()=>void;onQuickFix:(suggestion:Itinerary['suggestions'][number])=>void;quickFixBusy:boolean;onCompare:()=>void;mobilePane:'list'|'map';setMobilePane:(v:'list'|'map')=>void;hubs:Hub[]}) {
  const totals=itinerary.totals[strategy];
  const active=itinerary.days[day];
  const [focusedPlace,setFocusedPlace]=useState<string>();
  const baseline=itinerary.baselineCo2Kg||0;
  const overBudgetBy=Math.max(0,totals.cost-itinerary.input.budget);
  const quickFixes=itinerary.suggestions.map((suggestion)=>suggestion.id==='switch-cheapest'
    ? {...suggestion,saving:Math.max(0,totals.cost-itinerary.totals.cheapest.cost)}
    : suggestion).filter((suggestion)=>suggestion.id!=='switch-cheapest'||suggestion.saving>0);
  const savedPercent=baseline?Math.max(0,Math.round(100*(1-totals.co2Kg/baseline))):0;
  const treeDays=Math.round(totals.co2Kg/0.058);
  const stopArrivals=active?arrivalTimes(active,strategy):[];
  return <main className="page-wrap results-page">
    <div className="results-heading"><div><Link href="/plan" className="backlink"><ArrowLeft size={14}/> Adjust trip setup</Link><div className="eyebrow">YOUR KARNATAKA ROUTE / {itinerary.input.startHub.toUpperCase()}</div><h1 className="display">A good way through.</h1><p>{itinerary.input.days} days, sequenced around what you love.</p></div><div className="result-actions no-print"><button className="btn-quiet" onClick={onSave}><Save size={15}/>Save</button><button className="btn-quiet" onClick={onShare}><Share2 size={15}/>Share summary</button><button className="btn-quiet" onClick={()=>window.print()}><Printer size={15}/>Print</button><button className="btn-main" onClick={onReplan}><RotateCcw size={15}/>Change my plan</button></div></div>
    <div className="metric-strip">
      <div className="metric"><span className="eyebrow">EST. TRIP TOTAL</span><strong>{money(totals.cost)}</strong><small>{overBudgetBy>0?`${money(overBudgetBy)} over budget`:`Within your ${money(itinerary.input.budget)} budget`}</small><div className="budget-progress"><i style={{width:`${Math.min(100,totals.cost/Math.max(1,itinerary.input.budget)*100)}%`}}/></div></div>
      <div className="metric"><span className="eyebrow">ON THE MOVE</span><strong>{hours(totals.minutes)}</strong><small>estimated journey time</small></div>
      <div className="metric metric-eco"><span className="eyebrow"><Leaf size={12}/> JOURNEY EMISSIONS</span><strong>{totals.co2Kg.toFixed(1)} <em>kg CO₂</em></strong><small>{savedPercent}% below the all-cab baseline</small></div>
      <div className="metric eco-score-metric"><span className="eyebrow">ECO SCORE</span><EcoGauge score={itinerary.ecoScore}/><small>≈ {treeDays} tree-days of absorption</small></div>
    </div>
    {overBudgetBy>0&&quickFixes.length>0&&<section className="saving-banner">
      <span className="saving-mark"><TrendingDown size={18}/></span><div className="saving-copy"><b>This plan is {money(overBudgetBy)} over budget.</b><p>Apply a quick change, or open the planner to adjust the details.</p></div>
      <div className="quick-fixes">{quickFixes.slice(0,3).map((suggestion)=><button key={suggestion.id} disabled={quickFixBusy} onClick={()=>onQuickFix(suggestion)}><span>{suggestion.label}</span><small>Save about {money(suggestion.saving)}</small></button>)}</div>
    </section>}
    <section className="strategy-select"><div><div className="eyebrow">PICK YOUR ROUTE MOOD</div><h2 className="display">Same places. Different way there.</h2></div><div className="strategy-cards">{(['cheapest','fastest','greenest','balanced'] as Strategy[]).map(s=><button className={`strategy-option ${strategy===s?'current':''}`} onClick={()=>setStrategy(s)} key={s}><span className="strategy-icon">{s==='greenest'?<Leaf size={16}/>:s==='cheapest'?<TrendingDown size={16}/>:s==='fastest'?<Train size={16}/>:<Compass size={16}/>}</span><b>{strategyNames[s]}</b><strong>{money(itinerary.totals[s].cost)}</strong><small>{itinerary.totals[s].co2Kg.toFixed(1)} kg CO₂ · {hours(itinerary.totals[s].minutes)}</small></button>)}</div><button className="compare-link" onClick={onCompare}>Compare all four <ArrowRight size={14}/></button></section>
    <div className="mobile-map-toggle no-print"><button className={mobilePane==='list'?'selected':''} onClick={()=>setMobilePane('list')}>List</button><button className={mobilePane==='map'?'selected':''} onClick={()=>setMobilePane('map')}>Map</button></div>
    <div className={`results-columns ${mobilePane==='map'?'map-only':''}`}>
      <div className="day-column"><div className="day-tabs">{itinerary.days.map((d,i)=><button key={d.dayNo} className={`day-tab ${day===i?'active':''}`} onClick={()=>{setDay(i);setFocusedPlace(undefined);setMobilePane('list')}}><span>DAY {String(d.dayNo).padStart(2,'0')}</span><b>{d.stops[0]?.place.region||'On the road'}</b></button>)}</div>
        {active&&<section className="day-detail soft-card"><div className="day-story"><div><div className="eyebrow">DAY {String(active.dayNo).padStart(2,'0')} · {active.stops.length} STOPS</div><h2 className="display">{active.stops[0]?.place.region||'The day ahead'}</h2></div><div className="day-cost"><span>DAY ESTIMATE</span><b>{money(active.entryCost+active.foodCost+active.stayCost)}</b></div><p>{active.narrative}</p></div>
          <div className="stop-list">{active.stops.map((stop,index)=>{const leg=active.legs[index];return <div className="timeline-item" key={`${stop.place.id}-${index}`}>
            <article id={`stop-${stop.place.id}`} className="stop-card">
              <div className="stop-time"><span>{stopArrivals[index]??stop.arrive}</span><i/></div>
              <div className="stop-main"><div className="stop-titleline"><PlaceThumb placeId={stop.place.id} name={stop.place.name}/><button className="stop-focus" onClick={()=>setFocusedPlace(stop.place.id)}><h3>{stop.place.name}</h3></button>{stop.place.hiddenGem&&<span className="tag-chip gem-chip"><Sparkles size={11}/>Local find</span>}</div>
                <span className="stop-region"><MapPin size={12}/>{stop.place.region} · {stop.place.visitHrs}h visit</span><p>{stop.why}</p><div className="stop-meta">{stop.place.tags.slice(0,3).map(tag=><span key={tag}>{interestNames[tag]??tag}</span>)}<span>{stop.place.fee?`${money(stop.place.fee)} entry`:'Free entry'}</span>{stop.place.bestMonths.includes(itinerary.input.month)&&<span className="season-chip">Best this month</span>}</div>
              </div><WeatherBadge place={stop.place}/>
            </article>
            {leg&&<details className="leg-alternatives"><summary><ModeBadge mode={leg.chosen[strategy].mode}/><span>{leg.fromName} → {leg.toName}</span><b>{hours(leg.chosen[strategy].minutes)} · {money(leg.chosen[strategy].cost)}</b><small>{leg.options.length} route options</small></summary><div className="leg-option-list">{leg.options.map((option)=><div className={`leg-option ${option.mode===leg.chosen[strategy].mode?'chosen':''}`} key={`${option.mode}-${option.label}`}><ModeBadge mode={option.mode}/><span>{option.label}</span><span>{hours(option.minutes)}</span><span>{money(option.cost)}</span><span>{option.co2Kg.toFixed(1)} kg CO₂</span></div>)}</div></details>}
          </div>})}</div>
          <div className="day-cost-breakdown"><span>Entry <b>{money(active.entryCost)}</b></span><span>Food <b>{money(active.foodCost)}</b></span><span>Stay <b>{money(active.stayCost)}</b></span></div></section>}
      </div>
      <aside className="route-column"><div className="map-title"><div><div className="eyebrow">ON THE GROUND</div><h3 className="display">{strategyNames[strategy]} route</h3></div><span className="tag-chip"><span className="status-dot"/>Live map</span></div>
        <RouteMap days={itinerary.days} selectedDay={day} strategy={strategy} startHub={itinerary.input.startHub} hubs={hubs} focusedPlace={focusedPlace} onFocusPlace={setFocusedPlace} onSelectDay={setDay}/>
        <div className="route-legend"><span>Modes</span>{(['walk','metro','bus','train','ecab','auto','cab'] as Mode[]).map(mode=><span className="mode-legend" key={mode}><i style={{background:modeColors[mode]}}/>{modeNames[mode]}</span>)}</div>
        <div className="route-legs">{active?.legs.map((leg,i)=>{const choice=leg.chosen[strategy];return <div className="leg-row" key={`${leg.fromId}-${leg.toId}`}><div className="leg-index">{String(i+1).padStart(2,'0')}</div><div className="leg-names"><b>{leg.fromName}</b><span>{leg.toName}</span><small><ModeBadge mode={choice.mode}/></small></div><div className="leg-data"><b>{choice.distanceKm} km</b><span>{choice.minutes} min · {money(choice.cost)}</span></div></div>})}</div>
        <Link href="/compare" className="full-link">Compare every route option <ArrowRight size={14}/></Link>
      </aside>
    </div>
  </main>;
}

function modeMixGradient(mix:Record<string,number>) {
  const entries=Object.entries(mix).filter(([,count])=>count>0) as [Mode,number][];
  const total=entries.reduce((sum,[,count])=>sum+count,0);
  if(!total)return 'conic-gradient(#d7dfd9 0 100%)';
  let cursor=0;
  const slices=entries.map(([mode,count])=>{const start=cursor;cursor+=count/total*100;return `${modeColors[mode]} ${start}% ${cursor}%`});
  return `conic-gradient(${slices.join(',')})`;
}

function Compare({itinerary,strategy,setStrategy,onReplan}:{itinerary:Itinerary;strategy:Strategy;setStrategy:(s:Strategy)=>void;onReplan:()=>void}) {
  const strategies:Strategy[]=['cheapest','fastest','greenest','balanced'];
  const winner=(key:'cost'|'minutes'|'co2Kg')=>strategies.reduce((best,current)=>itinerary.totals[current][key]<itinerary.totals[best][key]?current:best,strategies[0]!);
  const winners={cost:winner('cost'),time:winner('minutes'),co2:winner('co2Kg')};
  const maxCost=Math.max(...strategies.map(s=>itinerary.totals[s].cost),1);
  const maxTime=Math.max(...strategies.map(s=>itinerary.totals[s].minutes),1);
  const maxCo2=Math.max(...strategies.map(s=>itinerary.totals[s].co2Kg),1);
  const chartData=[
    {metric:'Total cost',...Object.fromEntries(strategies.map(s=>[s,Math.round(itinerary.totals[s].cost/maxCost*100)]))},
    {metric:'Travel time',...Object.fromEntries(strategies.map(s=>[s,Math.round(itinerary.totals[s].minutes/maxTime*100)]))},
    {metric:'CO₂ emissions',...Object.fromEntries(strategies.map(s=>[s,Math.round(itinerary.totals[s].co2Kg/maxCo2*100)]))},
  ];
  const baselineSaving=Math.max(0,itinerary.baselineCo2Kg-itinerary.totals.greenest.co2Kg);
  const strategyColors:Record<Strategy,string>={cheapest:'#f59e0b',fastest:'#0ea5e9',greenest:'#10b981',balanced:'#475569'};
  return <main className="page-wrap compare-page"><Link href="/results" className="backlink"><ArrowLeft size={14}/> Back to itinerary</Link><div className="compare-head"><div><div className="eyebrow">ROUTE LAB / FOUR WAYS THROUGH</div><h1 className="display">Choose your trade-off.</h1><p>Same itinerary, different priorities. Nothing hidden in the fine print.</p></div><button className="btn-main no-print" onClick={onReplan}><RotateCcw size={15}/>Change my route</button></div>
    <div className="compare-table-wrap soft-card"><div className="compare-table-head"><div className="eyebrow">{itinerary.input.startHub} · {itinerary.input.days} DAYS</div><div className="eyebrow">TOTAL COST</div><div className="eyebrow">TRAVEL TIME</div><div className="eyebrow">CO₂</div><div className="eyebrow">MODE MIX</div></div>{strategies.map(s=>{const t=itinerary.totals[s];return <button className={`compare-row ${strategy===s?'selected':''}`} key={s} onClick={()=>setStrategy(s)}><div className="compare-name"><span className={`strategy-icon ${s}`} >{s==='greenest'?<Leaf size={17}/>:s==='cheapest'?<TrendingDown size={17}/>:s==='fastest'?<Train size={17}/>:<Compass size={17}/>}</span><span><b>{strategyNames[s]}</b><small>{s==='greenest'?'Smaller footprint':s==='cheapest'?'Fare-conscious':s==='fastest'?'Less time moving':'A little of everything'}</small></span></div><strong>{money(t.cost)}{winners.cost===s&&<small className="winner-badge">Lowest fare</small>}</strong><strong>{hours(t.minutes)}{winners.time===s&&<small className="winner-badge">Quickest</small>}</strong><strong>{t.co2Kg.toFixed(1)} kg{winners.co2===s&&<small className="winner-badge">Lowest CO₂</small>}</strong><span className="mode-mix" title={Object.entries(t.modeMix).map(([m,n])=>`${m}: ${n}`).join(', ')}><i className="mode-donut" style={{background:modeMixGradient(t.modeMix)}}/><span>{Object.entries(t.modeMix).map(([mode,count])=><i key={mode}>{mode.slice(0,2).toUpperCase()} <b>{count}</b></i>)}</span></span></button>})}</div>
    <div className="compare-actions no-print"><Link href="/results" className="btn-main"><Check size={15}/>Use {strategyNames[strategy]} for this trip</Link></div>
    <section className="compare-chart-section soft-card"><div><div className="eyebrow">AT A GLANCE / LOWER IS BETTER</div><h2 className="display">What each route gives up.</h2><p>Each measure is indexed against its highest value, so the shorter bar is the lower-cost, faster or lower-carbon option.</p></div>
      <div className="compare-chart"><ResponsiveContainer width="100%" height={300}><BarChart data={chartData} margin={{top:16,right:16,left:0,bottom:6}}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#d8e0da"/><XAxis dataKey="metric" tickLine={false} axisLine={false} tick={{fontSize:11}}/><YAxis domain={[0,100]} tickFormatter={v=>`${v}`} tickLine={false} axisLine={false} tick={{fontSize:10}}/><ChartTooltip formatter={(value)=>[`${value}% of metric maximum`,'Indexed value']}/><Legend/><Bar dataKey="cheapest" name="Cheapest" fill={strategyColors.cheapest} radius={[5,5,0,0]}/><Bar dataKey="fastest" name="Fastest" fill={strategyColors.fastest} radius={[5,5,0,0]}/><Bar dataKey="greenest" name="Greenest" fill={strategyColors.greenest} radius={[5,5,0,0]}/><Bar dataKey="balanced" name="Balanced" fill={strategyColors.balanced} radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
    </section>
    <div className="carbon-saving soft-card"><span className="saving-mark"><Leaf size={19}/></span><div><b>{baselineSaving.toFixed(1)} kg CO₂ below an all-cab trip</b><p>Greenest strategy estimate compared with taking a cab for every route leg.</p></div><span className="carbon-baseline">{itinerary.baselineCo2Kg.toFixed(1)} kg baseline</span></div>
    <section className="leg-breakdown"><div className="section-head"><div><div className="eyebrow">THE JOURNEY, LEG BY LEG</div><h2 className="display">Little choices add up.</h2></div><span className="tag-chip">{strategyNames[strategy]} selected</span></div>{itinerary.days.map(d=><div className="compare-day" key={d.dayNo}><div className="compare-day-label"><span>DAY {String(d.dayNo).padStart(2,'0')}</span><b>{d.stops[0]?.place.region??'On the road'}</b></div>{d.legs.map(l=>{const selected=l.chosen[strategy];return <article className="leg-detail soft-card" key={`${l.fromId}${l.toId}`}><div className="leg-detail-title"><div><b>{l.fromName}</b><ArrowRight size={13}/><b>{l.toName}</b></div><ModeBadge mode={selected.mode}/></div><div className="leg-option-list">{l.options.map(o=><div key={`${o.mode}-${o.label}`} className={`leg-option ${o.mode===selected.mode?'chosen':''}`}><ModeBadge mode={o.mode}/><span>{o.label}</span><span>{o.distanceKm} km</span><span>{hours(o.minutes)}</span><span>{money(o.cost)}</span><span>{o.co2Kg.toFixed(1)} kg CO₂</span>{o.mode===selected.mode&&<Check size={14}/>}</div>)}</div></article>})}</div>)}</section>
  </main>;
}

function Explore({places,loading,error,retry,query,setQuery,hubs,hub,setHub,activePlace,setActive,media,mediaLoading,shortlist,toggleShortlist,interests,setInterests,maxFee,setMaxFee,hiddenOnly,setHiddenOnly,month,onPlan}:{places:RankedPlace[];loading:boolean;error:boolean;retry:()=>void;query:string;setQuery:(s:string)=>void;hubs:{id:string;name:string}[];hub:string;setHub:(s:string)=>void;activePlace:RankedPlace|null;setActive:(p:RankedPlace|null)=>void;media?:{thumbnail:string|null;extract:string|null};mediaLoading:boolean;shortlist:string[];toggleShortlist:(id:string)=>void;interests:TripInput['interests'];setInterests:(v:TripInput['interests'])=>void;maxFee:number|undefined;setMaxFee:(v:number|undefined)=>void;hiddenOnly:boolean;setHiddenOnly:(v:boolean)=>void;month:number;onPlan:()=>void}) {
  const toggleFilterInterest=(interest:TripInput['interests'][number])=>setInterests(interests.includes(interest)?interests.filter(value=>value!==interest):[...interests,interest]);
  return <main className="page-wrap explore-page"><div className="explore-head"><div><div className="eyebrow">FIELD GUIDE / KARNATAKA</div><h1 className="display">Find the places<br/>between the plans.</h1><p>Local favourites, iconic stops and the worthwhile detours. Sorted for your kind of trip.</p></div><div className="shortlist-box"><span className="eyebrow">YOUR MUST-VISITS</span><strong>{shortlist.length.toString().padStart(2,'0')}</strong><span>{shortlist.length?'saved for your plan':'pin places as you browse'}</span><button onClick={onPlan}>Plan around these <ArrowRight size={14}/></button></div></div>
    <div className="explore-controls"><label className="search-wrap"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search places, regions, interests" aria-label="Search attractions"/></label><label className="hub-filter"><SlidersHorizontal size={15}/><select value={hub} onChange={e=>setHub(e.target.value)} aria-label="Filter by hub"><option value="">Everywhere</option>{hubs.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select><ChevronDown size={14}/></label><label className="fee-filter"><span>Entry fee</span><select value={maxFee??''} onChange={e=>setMaxFee(e.target.value===''?undefined:Number(e.target.value))} aria-label="Maximum entry fee"><option value="">Any</option><option value="0">Free</option><option value="100">Up to ₹100</option><option value="300">Up to ₹300</option><option value="1000">Up to ₹1,000</option></select></label><button className={`hidden-filter ${hiddenOnly?'selected':''}`} aria-pressed={hiddenOnly} onClick={()=>setHiddenOnly(!hiddenOnly)}><Sparkles size={14}/>Hidden gems</button><span className="result-count">{loading?'Finding places…':`${places.length} places to wander`}</span></div>
    <div className="interest-filters" aria-label="Filter by interest">{Object.entries(interestNames).filter(([key])=>key!=='hidden-gems').map(([key,label])=>{const interest=key as TripInput['interests'][number];return <button key={key} className={interests.includes(interest)?'selected':''} aria-pressed={interests.includes(interest)} onClick={()=>toggleFilterInterest(interest)}>{label}</button>})}<span className="season-note">Season matched to {new Date(2020,month-1).toLocaleString('en',{month:'long'})}</span></div>
    {error?<div className="error-state soft-card"><MapPin size={24}/><h2>Our field notes aren’t loading.</h2><p>Give the place finder another try.</p><button className="btn-main" onClick={retry}>Try again</button></div>:loading?<div className="place-grid">{[1,2,3].map(n=><div className="place-skeleton soft-card" key={n}><div className="skeleton skeleton-pic"/><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line short"/></div>)}</div>:places.length===0?<div className="empty-state soft-card"><Compass size={27}/><h2>Nothing on that trail yet.</h2><p>Try another search or open the whole map of possibilities.</p><button className="btn-quiet" onClick={()=>{setQuery('');setHub('');setInterests([]);setMaxFee(undefined);setHiddenOnly(false)}}>Clear filters</button></div>:<div className="place-grid">{places.map((place,i)=><article className="place-card soft-card" key={place.id}><button className={`place-visual visual-${i%5}`} onClick={()=>setActive(place)} aria-label={`Open details for ${place.name}`}><span className="place-index">{String(i+1).padStart(2,'0')}</span><span className="visual-shape"/><span className="place-tagline">{place.region.toUpperCase()} / KARNATAKA</span>{place.hiddenGem&&<span className="visual-gem"><Sparkles size={12}/>HIDDEN GEM</span>}{place.bestMonths.includes(month)&&<span className="season-badge">BEST THIS MONTH</span>}</button><div className="place-content"><div className="place-card-top"><span className="match-score"><Sparkles size={12}/>{place.matchScore}% match</span><button className={`bookmark-button ${shortlist.includes(place.id)?'bookmarked':''}`} onClick={()=>toggleShortlist(place.id)} aria-label={shortlist.includes(place.id)?'Remove from must-visits':'Add to must-visits'}>{shortlist.includes(place.id)?<Check size={17}/>:<Bookmark size={17}/>}</button></div><button className="place-name-button" onClick={()=>setActive(place)}><h2>{place.name}</h2><ArrowUpRight size={15}/></button><p>{place.why}</p><div className="place-tags">{place.tags.slice(0,3).map(t=><span key={t}>{interestNames[t]??t}</span>)}</div><div className="place-foot"><span>{place.fee?`${money(place.fee)} entry`:'No entry fee'}</span><span>{place.visitHrs}h visit</span><button onClick={()=>setActive(place)}>Details <ArrowRight size={13}/></button></div></div></article>)}</div>}
    {activePlace&&<div className="modal-scrim" role="presentation" onClick={()=>setActive(null)}><section className="place-modal soft-card" role="dialog" aria-modal="true" aria-labelledby="modal-place-title" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setActive(null)} aria-label="Close place details"><X size={19}/></button>{media?.thumbnail?<img className="modal-place-photo" src={media.thumbnail} alt={`View of ${activePlace.name}`}/>:<div className="modal-place-art visual-1"><span className="visual-shape"/></div>}<div className="modal-place-body"><div className="eyebrow">{activePlace.region} / {activePlace.matchScore}% MATCH</div><h2 id="modal-place-title" className="display">{activePlace.name}</h2><p>{activePlace.desc}</p>{mediaLoading?<div className="skeleton modal-media"/>:media?.extract&&<blockquote>{media.extract}</blockquote>}<div className="modal-place-facts"><span><MapPin size={15}/>{activePlace.hub}</span><span><CalendarDays size={15}/>Best in {activePlace.bestMonths.map(m=>new Date(2020,m-1).toLocaleString('en',{month:'short'})).join(', ')}</span><span>{activePlace.fee?`${money(activePlace.fee)} entry`:'Free entry'}</span></div><div className="modal-actions"><button className="btn-quiet" onClick={()=>toggleShortlist(activePlace.id)}>{shortlist.includes(activePlace.id)?<Check size={15}/>:<Bookmark size={15}/>} {shortlist.includes(activePlace.id)?'Added to must-visits':'Add to must-visits'}</button><button className="btn-main" onClick={()=>{onPlan();setActive(null)}}>Plan a trip <ArrowRight size={15}/></button></div></div></section></div>}
  </main>;
}

function Trips({saved,load,duplicate,remove,onPlan}:{saved:SavedTrip[];load:(t:SavedTrip)=>void;duplicate:(t:SavedTrip)=>void;remove:(id:string)=>void;onPlan:()=>void}) {
  return <main className="page-wrap trips-page"><div className="trips-head"><div><div className="eyebrow">YOUR COLLECTION / {String(saved.length).padStart(2,'0')} SAVED</div><h1 className="display">Keep the good routes.</h1><p>Your Karnataka plans live here, ready to pick up or rethink.</p></div><button className="btn-main" onClick={onPlan}><Plus size={16}/>Plan something new</button></div>
    {!saved.length?<div className="trips-empty soft-card"><div className="empty-landscape"><span/><span/><span/></div><div className="eyebrow">NOTHING SAVED JUST YET</div><h2 className="display">A good trip starts<br/>with a first draft.</h2><p>Build a route, save the one you like, and it’ll be here when you come back.</p><button className="btn-main" onClick={onPlan}>Start planning <ArrowRight size={15}/></button></div>:<div className="saved-list">{saved.map((t,i)=><article className="saved-trip soft-card" key={t.id}><div className={`saved-trip-art art-${i%3}`}><span>{String(i+1).padStart(2,'0')}</span><RouteIcon/></div><div className="saved-trip-body"><span className="eyebrow">SAVED {new Date(t.savedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span><h2>{t.name}</h2><p>{t.itinerary.days.length} days · {t.itinerary.days.reduce((n,d)=>n+d.stops.length,0)} stops · {strategyNames[t.itinerary.input.priority]}</p><div className="saved-trip-stats"><span>{money(t.itinerary.totals[t.itinerary.input.priority].cost)}</span><span>{t.itinerary.totals[t.itinerary.input.priority].co2Kg.toFixed(1)} kg CO₂</span><span>Eco score {t.itinerary.ecoScore}</span></div></div><div className="saved-trip-actions"><button className="btn-main" onClick={()=>load(t)}>Open route <ArrowRight size={14}/></button><button className="btn-quiet" aria-label={`Duplicate ${t.name}`} onClick={()=>duplicate(t)}><Copy size={15}/></button><button className="btn-quiet delete-button" aria-label={`Delete ${t.name}`} onClick={()=>{if(window.confirm(`Delete "${t.name}" from your saved trips?`))remove(t.id)}}><Trash2 size={15}/></button></div></article>)}</div>}
  </main>;
}

function EmptyResult({onPlan}:{onPlan:()=>void}){return <main className="page-wrap trips-empty soft-card"><div className="empty-landscape"><span/><span/><span/></div><div className="eyebrow">YOUR NEXT ROUTE IS WAITING</div><h1 className="display">Start with a place.</h1><p>Tell us where you’re going and what you love. We’ll shape the days around it.</p><button className="btn-main" onClick={onPlan}>Build an itinerary <ArrowRight size={15}/></button></main>}

function ReplanDrawer({close,values,setValues,busy,submit,text,setText,submitText,diff,stops,excluded,setExcluded}:{close:()=>void;values:{budget:number;days:number;walking:TripInput['walking'];priority:Strategy};setValues:(v:{budget:number;days:number;walking:TripInput['walking'];priority:Strategy})=>void;busy:boolean;submit:()=>void;text:string;setText:(s:string)=>void;submitText:()=>void;diff:TripDiff|null;stops:Place[];excluded:string[];setExcluded:(ids:string[])=>void}) {
  const toggleExcluded=(id:string)=>setExcluded(excluded.includes(id)?excluded.filter(value=>value!==id):[...excluded,id]);
  const stopName=(id:string)=>stops.find(stop=>stop.id===id)?.name??id.replaceAll('-',' ').replace(/\b\w/g,letter=>letter.toUpperCase());
  return <div className="drawer-overlay" role="presentation" onClick={close}><aside className="replan-drawer" role="dialog" aria-modal="true" aria-labelledby="replan-title" onClick={e=>e.stopPropagation()}>
    <div className="drawer-head"><span className="eyebrow">CHANGE THE JOURNEY</span><button className="modal-close" onClick={close} aria-label="Close replanning"><X size={19}/></button></div>
    <h2 className="display" id="replan-title">Plans move.<br/>So can this one.</h2><p className="drawer-intro">Adjust the constraints or tell us what changed. We’ll make the route fit.</p>
    <div className="drawer-fields">
      <div className="budget-label"><label className="form-label">Trip budget</label><b>{money(values.budget)}</b></div><input className="budget-range" type="range" min="1500" max="50000" step="500" value={values.budget} aria-label="Revised trip budget" onChange={e=>setValues({...values,budget:Number(e.target.value)})}/>
      <label className="form-label">Days away</label><div className="stepper"><button onClick={()=>setValues({...values,days:Math.max(1,values.days-1)})} aria-label="Reduce number of days">−</button><strong>{values.days}<small> days</small></strong><button onClick={()=>setValues({...values,days:Math.min(7,values.days+1)})} aria-label="Add a day">+</button></div>
      <label className="form-label">Walking comfort</label><div className="priority-row">{(['low','medium','high'] as const).map(level=><button className={`priority-chip ${values.walking===level?'selected':''}`} key={level} onClick={()=>setValues({...values,walking:level})}>{level==='low'?'Low':level==='medium'?'Medium':'High'}</button>)}</div>
      <label className="form-label">Route priority</label><div className="priority-row">{(['balanced','greenest','cheapest','fastest'] as Strategy[]).map(s=><button className={`priority-chip ${values.priority===s?'selected':''}`} key={s} onClick={()=>setValues({...values,priority:s})}>{strategyNames[s]}</button>)}</div>
      <label className="form-label">Skip a place</label><div className="exclude-chips">{stops.map(stop=><button key={stop.id} className={excluded.includes(stop.id)?'selected':''} aria-pressed={excluded.includes(stop.id)} onClick={()=>toggleExcluded(stop.id)}>{excluded.includes(stop.id)?<Check size={12}/>:<Plus size={12}/>} {stop.name}</button>)}</div>
      <label className="form-label">Or tell us in plain language</label><textarea className="field natural-input" value={text} onChange={e=>setText(e.target.value)} maxLength={1000} placeholder="I only have ₹3,000 and want to walk less…"/>
      <div className="prompt-chips">{['I only have ₹3,000','Less walking','Make it greener'].map(example=><button key={example} onClick={()=>setText(example)}>{example}</button>)}</div><small className="character-count">{text.length}/1000</small>
    </div>
    {diff&&<section className="replan-diff" role="status" aria-live="polite"><div className="diff-heading"><Check size={17}/><div><b>Route updated</b><small>{diff.costDelta<0?`Saved ${money(Math.abs(diff.costDelta))}`:diff.costDelta>0?`Added ${money(diff.costDelta)} to the estimate`:'Trip cost unchanged'} · {diff.co2Delta>0?'+':''}{diff.co2Delta.toFixed(1)} kg CO₂</small></div></div>
      {diff.removedStops.map(id=><div className="diff-row removed" key={`removed-${id}`}><span>− Removed</span><b>{stopName(id)}</b></div>)}
      {diff.addedStops.map(id=><div className="diff-row added" key={`added-${id}`}><span>+ Added</span><b>{stopName(id)}</b></div>)}
      {diff.modeChanges.map(change=><div className="diff-row changed" key={change}><span>Route switch</span><b>{change}</b></div>)}
      {!diff.removedStops.length&&!diff.addedStops.length&&!diff.modeChanges.length&&<small>Stop order and route modes stayed the same; trip constraints were updated.</small>}
    </section>}
    <div className="drawer-footer"><button className="btn-quiet" onClick={submitText} disabled={busy||!text.trim()}><Sparkles size={15}/>Use my note</button><button className="btn-main" onClick={submit} disabled={busy}>{busy?'Reworking…':'Replan route'} <ArrowRight size={15}/></button></div>
  </aside></div>;
}

function RoutedErrorBoundary({children}:{children:React.ReactNode}) {const [location]=useLocation();return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>}
function Root(){return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><RoutedErrorBoundary><App/></RoutedErrorBoundary></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>}
export default Root;
