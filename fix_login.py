with open("frontend/src/app/login/page.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
in_conflict = False
for line in lines:
    if line.startswith("<<<<<<< HEAD"):
        in_conflict = True
    elif line.startswith("======="):
        pass
    elif line.startswith(">>>>>>> origin/main"):
        in_conflict = False
    elif in_conflict:
        if 't("common.connecting")' in line or 'isRegister' in line or 't("login.sign_up")' in line or 't("login.sign_in")' in line:
            # We want to keep the HEAD version which is the nice spinner, so we will filter out the origin/main version which is just text.
            # Actually, let's just write exactly what we want.
            pass
        else:
             new_lines.append(line)
    else:
        new_lines.append(line)

# Let's be simpler and just overwrite the file since we know exactly what we want to replace the conflict with.
