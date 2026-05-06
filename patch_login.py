import re

with open("frontend/src/app/login/page.tsx", "r") as f:
    content = f.read()

search = r"\{loadingEmail \? t\('common\.connecting'\) : \(isRegister \? t\('login\.sign_up'\) : t\('login\.sign_in'\)\)\}"
replace = r"""{loadingEmail ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                    <span>{t('common.connecting')}</span>
                  </div>
                ) : (
                  isRegister ? t('login.sign_up') : t('login.sign_in')
                )}"""

if search in content:
    print("Found exact match!")
else:
    match = re.search(search, content)
    if match:
        print("Found regex match!")
        content = content[:match.start()] + replace + content[match.end():]
        with open("frontend/src/app/login/page.tsx", "w") as f:
            f.write(content)
    else:
        print("Not found!")
