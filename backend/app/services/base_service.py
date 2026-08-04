from uuid import UUID
from fastapi import HTTPException, status


class BaseService:
    """Base para services CRUD: busca por ID, cria, atualiza e deleta."""

    nao_encontrado_msg: str = "Registro não encontrado"

    def __init__(self, repo):
        self.repo = repo

    def _buscar_ou_404(self, id_registro: UUID | str):
        registro = self.repo.get_by_id(id_registro)
        if not registro:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=self.nao_encontrado_msg)
        return registro

    def buscar_por_id(self, id_registro: UUID | str):
        return self._buscar_ou_404(id_registro)

    def criar(self, dados):
        return self.repo.create(dados.model_dump())

    def atualizar(self, id_registro: UUID | str, dados):
        registro = self._buscar_ou_404(id_registro)
        return self.repo.update(registro, dados.model_dump(exclude_unset=True))

    def deletar(self, id_registro: UUID | str) -> None:
        registro = self._buscar_ou_404(id_registro)
        self.repo.delete(registro)
