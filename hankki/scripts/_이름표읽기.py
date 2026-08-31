import re,sys
def 이름표(src):
    """앱과 «같은» 우선순위로 이름을 만든다: EXTRA 를 규칙이 덮는다"""
    names={}
    e=src.find('EXTRA_NAMES = {')
    if e>0:
        for m in re.finditer(r"([\w]+)\s*:\s*'([^']+)'", src[e:src.index('\n}',e)]): names[m.group(1)]=m.group(2)
    r=src[src.index('const ICON_RULES = ['):]
    본=set()
    for m in re.finditer(r"\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]", r):
        if m.group(2) in 본: continue
        본.add(m.group(2)); names[m.group(2)]=m.group(1)
    return names
def 픽커(src):
    g=src[src.index('FOOD_ICON_GROUPS'):src.index('const ICON_RULES')]
    out={}
    for m in re.finditer(r"\{\s*label:\s*'([^']*)'((?:(?!items:).)*?)items:\s*\[([^\]]*)\]", g, re.S):
        if "kind: 'ing'" in m.group(2): continue
        for x in re.finditer(r"'([^']+)'", m.group(3)): out[x.group(1)]=m.group(1)
    return out
