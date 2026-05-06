with open("frontend/src/app/novo-evento/page.tsx", "r") as f:
    content = f.read()

import re

search = r"\{loading \? t\('common\.loading'\) : t\('newEvent\.create_button'\)\}"
replace = r"""{loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  <span>{t('common.loading')}</span>
                </div>
              ) : (
                t('newEvent.create_button')
              )}"""

if search in content:
    print("Found exact match!")
else:
    match = re.search(search, content)
    if match:
        print("Found regex match!")
        content = content[:match.start()] + replace + content[match.end():]
        with open("frontend/src/app/novo-evento/page.tsx", "w") as f:
            f.write(content)
    else:
        print("Not found!")
