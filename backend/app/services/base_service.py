from uuid import UUID
from fastapi import HTTPException, status


class BaseService:
    """Base para services CRUD: busca por ID, cria, atualiza e deleta."""

    nao_encontrado_msg: str = "Registro não encontrado"

    # [F169] Inicializa a classe BaseService.
    def __init__(self, repo):
        self.repo = repo

    # [F170] Busca o registro e retorna erro HTTP 404 quando ele não existe.
    def _buscar_ou_404(self, id_registro: UUID | str):
        registro = self.repo.get_by_id(id_registro)
        if not registro:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=self.nao_encontrado_msg)
        return registro

    # [F171] Busca um registro pelo identificador e retorna erro 404 quando ele não existe.
    def buscar_por_id(self, id_registro: UUID | str):
        return self._buscar_ou_404(id_registro)

    # [F172] Cria um novo registro usando o repositório associado ao serviço.
    def criar(self, dados):
        return self.repo.create(dados.model_dump())

    # [F173] Atualiza um registro existente usando o repositório associado ao serviço.
    def atualizar(self, id_registro: UUID | str, dados):
        registro = self._buscar_ou_404(id_registro)
        return self.repo.update(registro, dados.model_dump(exclude_unset=True))

    # [F174] Remove um registro usando o repositório associado ao serviço.
    def deletar(self, id_registro: UUID | str) -> None:
        registro = self._buscar_ou_404(id_registro)
        self.repo.delete(registro)
