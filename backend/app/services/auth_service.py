from sqlalchemy.orm import Session

from app.core.security import hash_senha, verificar_senha, criar_token_acesso
from app.repositories.usuario_repo import UsuarioRepository
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioAuth0Response
from app.schemas.token import Token
from fastapi import HTTPException, status


from datetime import date
import uuid
from app.models.meta_nutri import MetaNutri
from app.models.perfil_nutri import PerfilNutri

class AuthService:
    def __init__(self, db: Session):
        self.repo = UsuarioRepository(db)

    def registrar(self, dados: UsuarioCreate):
        if self.repo.get_by_email(dados.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")
        novo_usuario = self.repo.create({
            "nome": dados.nome,
            "email": dados.email,
            "senha_hash": hash_senha(dados.senha),
        })
        try:
            meta = MetaNutri(
                id_meta=str(uuid.uuid4()),
                id_usuario=novo_usuario.id_usuario,
                calorias_diarias=1800.0,
                proteina_g=140.0,
                carboidrato_g=180.0,
                gordura_g=55.0,
                data_inicio=date.today(),
            )
            self.repo.db.add(meta)

            perfil = PerfilNutri(
                id_perfil=str(uuid.uuid4()),
                id_usuario=novo_usuario.id_usuario,
                data_nascimento=date(1998, 8, 15),
                genero="masculino",
                objetivo_nutricional="manter_peso",
                nivel_atividade="moderado",
                tmb_calculo=1750.0,
            )
            self.repo.db.add(perfil)
            self.repo.db.commit()
        except Exception:
            pass
        return novo_usuario

    def login(self, dados: UsuarioLogin) -> Token:
        usuario = self.repo.get_by_email(dados.email)
        if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if usuario.status_conta != "ativo":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta inativa")
        return Token(access_token=criar_token_acesso(usuario.id_usuario))

    # ─── Auth0 (Custom Database Connection) ────────────────────────────
    # O script "Login" da conexão customizada chama estes endpoints para
    # validar as credenciais contra o BANCO LOCAL. Auth0 apenas emite os
    # tokens; os usuários continuam sendo a fonte de verdade local.

    def validar_credenciais_auth0(self, email: str, senha: str) -> UsuarioAuth0Response:
        usuario = self.repo.get_by_email(email)
        if not usuario or not verificar_senha(senha, usuario.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
            )
        if usuario.status_conta != "ativo":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta inativa")
        return UsuarioAuth0Response(
            user_id=str(usuario.id_usuario),
            email=usuario.email,
            name=usuario.nome,
        )

    def consultar_usuario_auth0(self, email: str) -> UsuarioAuth0Response | None:
        usuario = self.repo.get_by_email(email)
        if not usuario:
            return None
        return UsuarioAuth0Response(
            user_id=str(usuario.id_usuario),
            email=usuario.email,
            name=usuario.nome,
        )
