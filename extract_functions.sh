#!/bin/bash
python3 - <<'EOF'
import re
src = open('www/index.html', encoding='utf-8').read()
for name in ['reverseGeocodeAndFetchTimes','scheduleAdhanNotifications','syncRealAzanSounds']:
    m = re.search(r'function\s+'+name+r'\s*\([^)]*\)\s*{', src)
    if not m:
        print(f'--- {name}: NOT FOUND ---')
        continue
    start = m.start()
    i = m.end()
    depth = 1
    while depth > 0 and i < len(src):
        if src[i] == '{': depth += 1
        elif src[i] == '}': depth -= 1
        i += 1
    print(f'--- {name} ---')
    print(src[start:i])
    print()
EOF
