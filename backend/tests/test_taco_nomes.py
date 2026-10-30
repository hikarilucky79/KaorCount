from app.services.taco_service import _formatar_nome_amigavel


def test_nomes_taco_preservam_caracteristicas():
    assert _formatar_nome_amigavel('Milho, fubá, cru') == 'Fubá de milho'
    assert _formatar_nome_amigavel('Arroz, tipo 1, cozido') == 'Arroz tipo 1 cozido'
    assert _formatar_nome_amigavel('Aveia, flocos, crua') == 'Aveia flocos'
    assert _formatar_nome_amigavel('Carne, bovina, picanha, grelhada') == 'Carne bovina picanha grelhada'
    assert _formatar_nome_amigavel('') == ''
    assert _formatar_nome_amigavel('Macarrão, trigo, cru, com ovos') == 'Macarrão trigo com ovos'
    assert _formatar_nome_amigavel('Arroz, integral, cru') == 'Arroz integral'
    assert _formatar_nome_amigavel('Arroz, integral, cozido') == 'Arroz integral cozido'
    assert _formatar_nome_amigavel('Banana, da terra') == 'Banana da terra'
    assert _formatar_nome_amigavel('Frango, peito, sem pele, grelhado') == 'Peito de frango sem pele grelhado'
    assert _formatar_nome_amigavel('Frango, peito, com pele, assado') == 'Peito de frango com pele assado'
