#!/bin/bash
# CF Pagesの20,000ファイル上限対策: RSCプリフェッチ用.txtを除去(クライアント遷移はフルロードにフォールバック=静的サイトでは実害なし)
# robots.txt等の正規txtは保護
find out -name "*.txt" ! -name "robots.txt" -type f -delete
echo "pruned: $(find out -type f | wc -l) files remain"
