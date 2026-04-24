import os

REPLACEMENTS = {
    'evento_id': 'event_id',
    'eventoData': 'eventData',
    'eventoError': 'eventError',
    'eventos': 'events',
    'evento': 'event',
    'criador_id': 'creator_id',
    'vw_participantes': 'vw_participants',
    'participantes': 'participants',
    'usuario_id': 'user_id',
    'usuario_a_id': 'user_a_id',
    'usuario_b_id': 'user_b_id',
    'usuarios': 'users',
    'sorteado_id': 'drawn_id',
    'exclusoes': 'exclusions',
    'mensagens_privadas': 'private_messages',
    'mensagens': 'messages',
    'remetente_id': 'sender_id',
    'destinatario_id': 'recipient_id',
    'texto': 'text',
    'criado_at': 'created_at',
    'data_revelacao': 'reveal_date',
    'descricao': 'description',
    'lista_desejos': 'wishlist',
    'get_evento_publico': 'get_public_event',
    "'aberto'": "'open'",
    "'sorteado'": "'drawn'",
    "'finalizado'": "'finished'",
    '"aberto"': '"open"',
    '"sorteado"': '"drawn"',
    '"finalizado"': '"finished"',
    # capitalized variants
    'Evento': 'Event',
    'Eventos': 'Events'
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
        print(f"Updated {filepath}")

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
