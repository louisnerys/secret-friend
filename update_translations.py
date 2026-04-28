import json
import os

locales = {
    'en': 'frontend/src/locales/en.json',
    'pt': 'frontend/src/locales/pt.json',
    'es': 'frontend/src/locales/es.json'
}

new_keys = {
    'en': {
        "event": {
            "wishlist_limit_reached": "You have reached the limit of {{max}} items.",
            "wishlist_delete_error": "Error deleting wishlist item"
        }
    },
    'pt': {
        "event": {
            "wishlist_limit_reached": "Você atingiu o limite de {{max}} itens.",
            "wishlist_delete_error": "Erro ao excluir item da lista de desejos"
        }
    },
    'es': {
        "event": {
            "wishlist_limit_reached": "Has alcanzado el límite de {{max}} artículos.",
            "wishlist_delete_error": "Error al eliminar artículo de la lista de deseos"
        }
    }
}

for lang, path in locales.items():
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for new_key, new_val in new_keys[lang]['event'].items():
            if 'event' in data:
                data['event'][new_key] = new_val

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Updated {lang}.json")
