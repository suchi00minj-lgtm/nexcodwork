#!/usr/bin/env python3
"""Validate a cinematic ad script against CONTRACT.md and estimate its duration.
usage: python3 validate_script.py scripts/day-01.json [more.json ...]"""
import json, sys, re
SETS = {'store_interior':['counter_left','counter_mid','counter_right','cust_left','cust_right'],
 'store_front':['walk_left','door','walk_right'],'counter_closeup':['hands'],'godown':['desk','left','right'],
 'home':['sofa_left','sofa_right','stand'],'ca_office':['ca_desk','visitor'],'street':['left','mid','right'],
 'clinic':['doctor','patient'],'news_studio':['anchor'],'abstract_white':['center','left','right']}
VOICE = {'rakesh':'madhur','aman':'brian','papa':'madhur_old','sunita':'swara','raju':'giuseppe','pooja':'ava','aunty':'swara_old',
 'uncle':'florian','inspector':'andrew','ca':'emma','mr':'giuseppe','doctor':'madhur_deep','young_mom':'vivienne','kid':'ava_kid',
 'anchor':'emma','narrator':'narrator'}
GEST = set('idle point wave hands_on_head thumbs_up hold_phone show_phone shrug arms_crossed nod shake_head give type facepalm clap think namaste count_cash'.split())
EMO = set('neutral happy worried angry surprised sad relieved thinking confident'.split())
SCREENS = {'dashboard':(['dash_qa','dash_alert','dash_cards'],['new_bill','expiry_tile','lowstock_tile','outofstock_tile','dues_tile']),
 'billing-search':(['search_list','search_list_r'],['search_box','salt','batch_col','stock_col']),
 'billing-items':(['bill_lines','bill_lines_r','bill_total','bill_print'],['batch','qty_pack','qty_loose','above_mrp','total','print_btn']),
 'rate-desk':(['rate_full','rate_quote'],['flat_rate','you_make','break_even']),'payment':(['pay'],['cash','upi','credit','amount']),
 'keys':(['keys','keys_r'],['f2','f9','f1']),'inventory':(['inv_tabs','inv_table'],['search','tabs','import','add_product','stock']),
 'near-expiry':(['near','near_r'],['batch','days_left','value_at_risk']),'purchase-entry':(['pe_import','pe_scheme'],['import','rate_on_bill','scheme','free_qty','bill_total']),
 'po-new':(['po_sugg','po_sugg_r'],['suggest','why','order_qty']),'low-stock':(['lowstock'],[]),'schedule-check':(['sched'],['untagged','apply']),
 'reports-registers':(['registers'],[]),'reports-gst':(['gst_grid','gst_grid_r'],['gstr1','before_file','gstr3b']),
 'gst-filecheck':(['gst_check','gst_check_r'],['fix_this','what_to_do']),'reports-sales':(['sales_rep','zrep'],['pick_report','z_cash','z_credit']),
 'books-pl':(['pl'],['net_profit']),'daybook':(['daybook'],['tally_export']),'invoices':(['inv_list','inv_list_r'],['invoice_list','whatsapp_btn','sent']),
 'customers':(['cust','cust_r'],['due_amount','collect']),'customer-add':(['cust_add'],['credit_limit']),'outstanding':(['outst'],['since_when','supplier_dues']),
 'staff-roles':(['roles'],['make_bill','hide_cost']),'rules':(['rules_top'],['block_expired']),'find-my-bills':(['fmb'],['email_code']),'whatsapp':(['wa'],['own_number'])}
CARDS = set('title kinetic stat split news chat quiz checklist countdown price'.split())
MOODS = set('tension emotional comedy upbeat news festival inspiring suspense calm'.split())
SFX = set('door_bell cash_register phone_ding notification clock_tick rain thunder crowd whoosh keyboard paper heartbeat camera_click car_door bike_horn scooter applause printer swoosh_up gasp_hit'.split())
def secs(text): return len(re.sub(r'\s+',' ',text))/11.0
def check(path):
    errs=[]; warn=[]
    d=json.load(open(path))
    for k in ['id','slug','style','title','problem','audience','store','music','cast','shots','ads']:
        if k not in d: errs.append(f'missing top-level {k}')
    cast=d.get('cast',[])
    for c in cast:
        if c not in VOICE: errs.append(f'unknown cast {c}')
    onscreen=set()
    total=0.0
    for i,s in enumerate(d.get('shots',[])):
        t=s.get('type'); dur=0.4
        if t not in ('scene','screen','card','endcard'): errs.append(f'shot {i}: bad type {t}')
        lines=s.get('lines',[])
        for j,l in enumerate(lines):
            w=l.get('who')
            if w not in VOICE: errs.append(f'shot {i} line {j}: unknown speaker {w}')
            if not l.get('hi'): errs.append(f'shot {i} line {j}: missing hi')
            if not l.get('sub'): errs.append(f'shot {i} line {j}: missing sub')
            elif len(l['sub'])>70: warn.append(f'shot {i} line {j}: sub > 70 chars ({len(l["sub"])})')
            if l.get('hi') and len(l['hi'].split())>18: warn.append(f'shot {i} line {j}: line long ({len(l["hi"].split())} words)')
            if re.search(r'[A-Za-z]',l.get('hi','')): warn.append(f'shot {i} line {j}: Latin letters inside hi (write in Devanagari)')
            if l.get('gesture') and l['gesture'] not in GEST: errs.append(f'shot {i} line {j}: bad gesture {l["gesture"]}')
            if l.get('emotion') and l['emotion'] not in EMO: errs.append(f'shot {i} line {j}: bad emotion {l["emotion"]}')
            dur+=secs(l.get('hi',''))+0.35
        dur+=float(s.get('hold',0))
        if not lines and float(s.get('hold',0))<1.5 and t!='endcard': errs.append(f'shot {i}: no lines and hold < 1.5')
        if t=='scene':
            st=s.get('set')
            if st not in SETS: errs.append(f'shot {i}: unknown set {st}')
            for p in s.get('place',[]):
                if p.get('who') not in VOICE or p.get('who')=='narrator': errs.append(f'shot {i}: bad place who {p.get("who")}')
                if st in SETS and p.get('spot') not in SETS[st]: errs.append(f'shot {i}: spot {p.get("spot")} not in {st}')
                onscreen.add(p.get('who'))
            spk={l.get('who') for l in lines}-{'narrator'}
            placed={p.get('who') for p in s.get('place',[])}
            for w in spk-placed: errs.append(f'shot {i}: speaker {w} not placed in scene')
            fr=s.get('camera',{}).get('frame','wide')
            m=re.match(r'^(wide|insert|medium:(\w+)|close:(\w+)|two:(\w+),(\w+))$',fr)
            if not m: errs.append(f'shot {i}: bad camera frame {fr}')
            else:
                for g in m.groups()[1:]:
                    if g and g not in placed: errs.append(f'shot {i}: camera subject {g} not placed')
            mv=s.get('camera',{}).get('move','static')
            if mv not in ('static','push_in','pull_out','pan_left','pan_right','handheld','shake'): errs.append(f'shot {i}: bad move {mv}')
            for a in s.get('actions',[]):
                do=a.get('do','')
                if not re.match(r'^(enter_left|enter_right|exit_left|exit_right|walk_to:\w+)$',do): errs.append(f'shot {i}: bad action {do}')
                if do.startswith('walk_to:') and st in SETS and do.split(':')[1] not in SETS[st]: errs.append(f'shot {i}: walk_to unknown spot')
            for x in s.get('sfx',[]):
                if x.get('name') not in SFX: errs.append(f'shot {i}: unknown sfx {x.get("name")}')
            if s.get('time','day') not in ('day','night'): errs.append(f'shot {i}: bad time')
        if t=='screen':
            img=s.get('img')
            if img not in SCREENS: errs.append(f'shot {i}: unknown screen {img}')
            else:
                for z in s.get('zoom',[]):
                    if z not in SCREENS[img][0]: errs.append(f'shot {i}: zoom {z} not valid for {img}')
                if len(s.get('zoom',[]))>2: errs.append(f'shot {i}: max 2 zoom regions')
                for n in s.get('notes',[]):
                    if n.get('target') not in SCREENS[img][1]: errs.append(f'shot {i}: note target {n.get("target")} not valid for {img}')
                    if len(n.get('text',''))>24: warn.append(f'shot {i}: note text > 24 chars')
        if t=='card' and s.get('card') not in CARDS: errs.append(f'shot {i}: unknown card {s.get("card")}')
        if t=='endcard': dur=max(dur,5.5)
        total+=dur
    for m in d.get('music',[]):
        if m.get('mood') not in MOODS: errs.append(f'music mood {m.get("mood")} unknown')
    vs={}
    for c in onscreen:
        v=VOICE.get(c); vs.setdefault(v,[]).append(c)
    for v,cs in vs.items():
        if len(cs)>1: errs.append(f'voice clash {v}: {cs}')
    if not d.get('shots') or d['shots'][-1].get('type')!='endcard': errs.append('last shot must be endcard')
    a=d.get('ads',{})
    for h in a.get('google_headlines',[]):
        if len(h)>30: errs.append(f'google headline > 30: {h}')
    for h in a.get('google_descriptions',[]):
        if len(h)>90: errs.append(f'google description > 90: {h}')
    if len(a.get('meta_headline',''))>40: errs.append('meta headline > 40')
    if len(a.get('meta_primary_text',''))>280: warn.append('meta primary text > 280')
    if total<25: errs.append(f'estimated duration {total:.1f}s < 25s')
    return errs,warn,total
ok=True
for p in sys.argv[1:]:
    e,w,t=check(p)
    print(f'{p}: estimated {t:.1f}s, {len(e)} errors, {len(w)} warnings')
    for x in e: print('  ERROR',x)
    for x in w: print('  warn ',x)
    ok = ok and not e
sys.exit(0 if ok else 1)
