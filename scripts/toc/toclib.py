import re,glob,sys,html
def heads(s,start):
    out=[]
    for m in re.finditer(r'<(h[23])([^>]*)>(.*?)</\1>',s[start:],re.S):
        idm=re.search(r'id="([^"]*)"',m.group(2))
        out.append((m.group(1), idm.group(1) if idm else None))
    return out
def toc(s):
    i=s.find('>Contents</span>')
    if i<0: return None
    j=s.find('<ol',i); 
    # find matching end of outer ol
    depth=0;k=j
    for m in re.finditer(r'<(/?)ol\b',s[j:]):
        depth+= -1 if m.group(1) else 1
        if depth==0: k=j+m.end(); break
    blk=s[j:k+1]
    return j,k,re.findall(r'href="#([^"]*)"',blk)
