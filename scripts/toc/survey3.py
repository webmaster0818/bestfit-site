import re,glob,sys,html
import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from toclib import toc
def sections(s,start):
    secs=[]
    for m in re.finditer(r'<(h[23])([^>]*)>(.*?)</\1>',s[start:],re.S):
        idm=re.search(r'id="([^"]*)"',m.group(2))
        if not idm: continue
        lvl=m.group(1); hid=idm.group(1); txt=m.group(3)
        if lvl=='h2': secs.append([hid,txt,[]])
        elif secs: secs[-1][2].append((hid,txt))
    return secs
if __name__=='__main__':
    tot=0
    for f in sorted(glob.glob(sys.argv[1]+'/*.html')):
        if '__brand__' in f: continue
        s=open(f).read(); t=toc(s)
        if not t: continue
        j,k,links=t
        secs=sections(s,k)
        first=secs[0][2]
        tl=[html.unescape(x) for x in links][1:]
        odd=[h for h,_ in first if re.fullmatch(r'[a-z0-9-]+',h)]
        short = len(first)-len(odd) > len(tl)
        tot+=short
        if odd or not short: print(f.split('/')[-1],'toc',len(tl),'gyms',len(first)-len(odd),'odd',odd)
    print('short',tot)
