"""目次（Contents）を本文の h2/h3 見出しどおりに作り直す。
対象: h3 を含む形式の目次で、本文の見出しと一致しない記事（旧CMS移植時に約15項目で切れていた）。
h2 だけの目次（ブランド記事の一部）は設計どおりのため触らない。"""
import re,glob,sys,html
import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from toclib import toc
from survey3 import sections
A2='class="leading-1.6 w-fit text-[14px] font-bold tracking-[0.08em] hover:underline md:text-[16px]"'
A3='class="leading-1.6 w-fit text-[12px] tracking-[0.08em] hover:underline md:text-[14px]"'
def plain(t): return re.sub(r'<[^>]+>','',t).strip()
write='--write' in sys.argv
changed=[]
for f in sorted(glob.glob(sys.argv[1]+'/*.html')):
    s=open(f).read(); t=toc(s)
    if not t: continue
    j,k,links=t
    old=s[j:k+1]
    secs=sections(s,k)
    body=[]
    for h2,_,h3s in secs: body.append(h2); body+= [h for h,_ in h3s]
    if links==body: continue
    if not re.search(r'pl-\[16px\]',old):  # h2だけの目次
        continue
    parts=['<ol class="grid gap-[8px]">']
    for n,(h2,t2,h3s) in enumerate(secs,1):
        parts.append(f'<li class="grid gap-[8px]"><a href="#{h2}" {A2}>{n}<!-- -->｜<!-- -->{plain(t2)}</a>')
        if h3s:
            parts.append('<ol class="grid gap-[8px] pl-[16px] md:pl-[32px]">')
            for h3,t3 in h3s: parts.append(f'<li><a href="#{h3}" {A3}>{plain(t3)}</a></li>')
            parts.append('</ol>')
        parts.append('</li>')
    parts.append('</ol>')
    new=''.join(parts)
    assert old.endswith('</ol>'), (f, old[-20:])
    changed.append((f.split('/')[-1],len(links),len(body)))
    if write:
        open(f,'w').write(s[:j]+new+s[k+1:])
for c in changed: print(*c)
print('changed',len(changed))
