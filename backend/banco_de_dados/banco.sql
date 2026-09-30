/*Cria e usa a database*/
CREATE DATABASE IF NOT EXISTS KaorCount;
USE KaorCount;

  /* CRIA AS TABELAS */

CREATE TABLE IF NOT EXISTS OBJETIVO (
  id_objetivo INT PRIMARY KEY,
  descricao_obj VARCHAR(50) NOT NULL,
)

CREATE TABLE IF NOT EXISTS NIVEL_ATIVIDADE (
  id_nivel_atividade INT PRIMARY KEY,
  descricao_nivel VARCHAR(50) NOT NULL,
)

CREATE TABLE IF NOT EXISTS USUARIOS (
  id_user VARCHAR(225) PRIMARY KEY,

  nome VARCHAR(225) NOT NULL,
  sobrenome VARCHAR(225) NOT NULL,
  altura DECIMAL(3,2) NOT NULL, 
  data_nascimento DATE NOT NULL, 
  sexo CHAR(1) NOT NULL,
  peso DECIMAL(5,2) NOT NULL, /*peso em Kg*/
  email VARCHAR(225) NOT NULL UNIQUE,
  senha VARCHAR(225) NOT NULL, 
  data_cadastro DATE NOT NULL,
  status_conta CHAR(1) DEFAULT 'D',

  id_objetivo INT,
  id_nivel_atividade INT,

  /*Vínculo com o Auth0 (ex.: "auth0|abc123"). Chave JIT de provisionamento.*/
  auth0_sub VARCHAR(255) UNIQUE,
  auth0_email_verified BOOLEAN NOT NULL DEFAULT 'FALSE',

  FOREIGN KEY(id_objetivo) REFERENCES OBJETIVO(id_objetivo) ON DELETE CASCADE,
  FOREIGN KEY(id_nivel_atividade) REFERENCES NIVEL_ATIVIDADE(id_nivel_atividade) ON DELETE CASCADE,

  CONSTRAINT chk_email CHECK (email LIKE '%@%'),
  CONSTRAINT chk_sexo CHECK (sexo IN ('F', 'M')) /*feminino, masculino*/
);

CREATE TABLE IF NOT EXISTS META_NUTRI (
  id_meta INT PRIMARY KEY AUTO_INCREMENT,

  caloria_diaria INT NOT NULL,
  carboidrato_g DECIMAL(5,2),
  proteina_g DECIMAL(5,2) ,
  gordura_g DECIMAL(5,2),
  inicio_meta DATETIME NOT NULL,
  agua_ml DECIMAL(6,2 ),

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS REGISTRO_AGUA (
  id_registro INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATETIME NOT NULL,
  qtd_ml DECIMAL(6,2),

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HISTORICO_PROGRESSO (
  id_progresso INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATETIME NOT NULL,
  peso_registrado DECIMAL(5,2) NOT NULL, /*Em kilos*/

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS REFEICOES (
  id_refeicao INT PRIMARY KEY AUTO_INCREMENT,

  data_refeicao DATE NOT NULL,
  tipo_refeicao CHAR(1) NOT NULL,

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user) ON DELETE CASCADE,

  CONSTRAINT chk_tipo_refeicao CHECK (tipo_refeicao IN ('C', 'A', 'L', 'J')) /* Café da manhã, Almoço, Lanche da tarde, Jantar*/
);

CREATE TABLE IF NOT EXISTS ALIMENTOS (
  id_alimento INT PRIMARY KEY AUTO_INCREMENT,

  nome_alimento VARCHAR(225) NOT NULL,
  porcao_padrao INT NOT NULL,
  calorias INT NOT NULL,
  carboidratos INT NOT NULL,
  proteinas INT NOT NULL,
  gorduras INT NOT NULL,
  origem_dados VARCHAR(225)
);

CREATE TABLE IF NOT EXISTS ITEM_REFEICAO (
  id_refeicao INT NOT NULL,
  id_alimento INT NOT NULL,
  PRIMARY KEY (id_refeicao, id_alimento),

  qtd_alimento INT NOT NULL, /*Em gramas(g)*/

  FOREIGN KEY(id_refeicao) REFERENCES REFEICOES(id_refeicao) ON DELETE CASCADE,
  FOREIGN KEY(id_alimento) REFERENCES ALIMENTOS(id_alimento) ON DELETE CASCADE
);

