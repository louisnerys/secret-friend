import os
import re

def fix_file(filename):
    if not os.path.exists(filename):
        return

    with open(filename, "r") as f:
        content = f.read()

    # We want to keep our HEAD changes
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> [a-f0-9]{7}(?: \(.*?\))?\n', re.DOTALL)

    if '<<<<<<<' in content:
        new_content = pattern.sub(r'\1\n', content)
        with open(filename, "w") as f:
            f.write(new_content)
        print(f"Fixed {filename}")

files_to_check = [
    "frontend/src/app/PwaRegister.tsx",
    "frontend/src/app/dashboard/page.test.tsx",
    "frontend/src/app/evento/[id]/page.test.tsx",
    "frontend/src/app/login/page.tsx",
    "frontend/src/app/novo-evento/page.tsx",
    "frontend/src/core/application/usecases/AdminUseCase.test.ts"
]

for f in files_to_check:
    fix_file(f)
