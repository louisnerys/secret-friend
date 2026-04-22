import os

REPLACEMENTS = {
    '/evento': '/event',
    '/novo-evento': '/new-event'
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return

    original_content = content
    for old, new in REPLACEMENTS.items():
        content = content.replace(old, new)
        
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated routes in {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.next' in dirs:
        dirs.remove('.next')
    if '.git' in dirs:
        dirs.remove('.git')
        
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json')):
            replace_in_file(os.path.join(root, file))

