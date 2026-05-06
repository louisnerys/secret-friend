import re

def fix_file(filename):
    with open(filename, "r") as f:
        content = f.read()

    # regex to remove the origin/main part of the conflict, and the conflict markers
    # We want to keep our HEAD changes which have the spinner.
    # The conflict looks like:
    # <<<<<<< HEAD
    # OUR CODE
    # =======
    # THEIR CODE
    # >>>>>>> origin/main

    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> origin/main\n', re.DOTALL)

    new_content = pattern.sub(r'\1\n', content)

    with open(filename, "w") as f:
        f.write(new_content)

    print(f"Fixed {filename}")

fix_file("frontend/src/app/login/page.tsx")
fix_file("frontend/src/app/novo-evento/page.tsx")
