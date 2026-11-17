import re


def normalizar_telefono(raw):
    """Deja solo los últimos 9 dígitos, para comparar '+56 9 1234 5678' con '912345678'."""
    digitos = re.sub(r'\D', '', raw or '')
    return digitos[-9:]