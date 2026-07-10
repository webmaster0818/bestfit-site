#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# データ整合性ガード: 破損データのデプロイを未然に防ぐ(CMS抽出バグの再発検知)
# 検出したらexit 1でビルドを止める
import json, sys
from collections import defaultdict
try:
    stores=json.load(open('data/stores.json'))
except Exception as e:
    print(f'[check-data] stores.json読込失敗: {e}'); sys.exit(1)
errors=[]
# (1) パス末尾slug != レコードslug (西宮/国分寺型の誤マッピング破損)
for p,s in stores.items():
    rs=s.get('slug','')
    if rs and p.split('/')[-1]!=rs:
        errors.append(f'slug不一致: {p} (record slug={rs})')
# (2) 同一(brand+name+address)を3パス以上が共有 (レコード丸コピー破損)
dup=defaultdict(list)
for p,s in stores.items():
    dup[(s.get('brandId'),s.get('name',''),s.get('address',''))].append(p)
for (bid,nm,ad),ps in dup.items():
    if len(ps)>=3 and nm and ad:
        errors.append(f'重複データ: 「{nm}」{ad[:20]} を{len(ps)}パスが共有 {ps[:3]}')
if errors:
    print(f'[check-data] ❌ データ破損を{len(errors)}件検出。デプロイを中止します:')
    for e in errors[:20]: print('   -',e)
    sys.exit(1)
print(f'[check-data] ✓ 整合性OK ({len(stores)}店・破損なし)')
