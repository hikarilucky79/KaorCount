import re

SENHA_TAMANHO_MINIMO = 8

MENSAGEM_SENHA_FRACA = (
    "A senha deve ter pelo menos 8 caracteres, com letra maiúscula, "
    "letra minúscula, número e símbolo."
)

# Comparadas sem símbolos e em minúsculas, então "Senha@123" cai em "senha123".
_SENHAS_COMUNS = {
    "12345678", "123456789", "1234567890", "12341234", "11111111", "00000000",
    "senha123", "senha1234", "senha12345", "password1", "password12", "password123",
    "qwerty123", "qwertyui", "qwertyuiop", "abc12345", "abcd1234", "admin123",
    "admin1234", "mudar123", "brasil123", "brasil2024", "welcome1", "welcome123",
    "letmein123", "iloveyou1", "kaorcount", "kaorcount1", "kaorcount123",
}


# [F115] Normaliza senha.
def _normalizar(valor: str) -> str:
    return re.sub(r"[^a-z0-9]", "", valor.casefold())


# [F116] Verifica se a senha atende aos critérios mínimos de segurança.
def validar_forca_senha(senha: str, email: str | None = None, nome: str | None = None) -> str | None:
    """Devolve a mensagem do problema encontrado ou None se a senha é aceitável."""
    if (
        len(senha) < SENHA_TAMANHO_MINIMO
        or not re.search(r"[a-z]", senha)
        or not re.search(r"[A-Z]", senha)
        or not re.search(r"\d", senha)
        or not re.search(r"[^A-Za-z0-9]", senha)
    ):
        return MENSAGEM_SENHA_FRACA

    simples = _normalizar(senha)
    if simples in _SENHAS_COMUNS:
        return "Essa senha é muito comum. Escolha outra."

    # Senha derivada de dados da própria conta é a primeira que um atacante tenta.
    if email:
        parte_local = _normalizar(email.split("@", 1)[0])
        if len(parte_local) >= 4 and parte_local in simples:
            return "A senha não pode conter o seu e-mail."
    if nome:
        for palavra in re.split(r"\s+", nome.strip()):
            palavra = _normalizar(palavra)
            if len(palavra) >= 4 and palavra in simples:
                return "A senha não pode conter o seu nome."
    return None
