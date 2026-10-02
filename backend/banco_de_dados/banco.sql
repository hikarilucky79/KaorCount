/*Cria e usa a database*/
CREATE DATABASE IF NOT EXISTS kaorCount;
USE kaorCount;

  /* CRIA AS TABELAS */

CREATE TABLE IF NOT EXISTS objetivo (
  id_objetivo INT PRIMARY KEY,
  descricao_obj VARCHAR(50) NOT NULL,
)

CREATE TABLE IF NOT EXISTS nivel_atividade (
  id_nivel_atividade INT PRIMARY KEY,
  descricao_nivel VARCHAR(50) NOT NULL,
)

CREATE TABLE IF NOT EXISTS usuarios (
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

  FOREIGN KEY(id_objetivo) REFERENCES objetivo(id_objetivo) ON DELETE CASCADE,
  FOREIGN KEY(id_nivel_atividade) REFERENCES nivel_atividade(id_nivel_atividade) ON DELETE CASCADE,

  CONSTRAINT chk_email CHECK (email LIKE '%@%'),
  CONSTRAINT chk_sexo CHECK (sexo IN ('F', 'M')) /*feminino, masculino*/
);

CREATE TABLE IF NOT EXISTS meta_nutri (
  id_meta INT PRIMARY KEY AUTO_INCREMENT,

  caloria_diaria INT NOT NULL,
  carboidrato_g DECIMAL(5,2),
  proteina_g DECIMAL(5,2) ,
  gordura_g DECIMAL(5,2),
  inicio_meta DATETIME NOT NULL,
  agua_ml DECIMAL(6,2 ),

  id_user VARCHAR(225) NOT NULL,

  FOREIGN KEY(id_user) REFERENCES usuarios(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registro_agua (
  id_registro INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATETIME NOT NULL,
  qtd_ml DECIMAL(6,2),

  id_user VARCHAR(225) NOT NULL,

  FOREIGN KEY(id_user) REFERENCES usuarios(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historico_progresso (
  id_progresso INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATETIME NOT NULL,
  peso_registrado DECIMAL(5,2) NOT NULL, /*Em kilos*/

  id_user VARCHAR(225) NOT NULL,

  FOREIGN KEY(id_user) REFERENCES usuarios(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tipo_refeicao (
  id_tipo_refeicao INT PRIMARY KEY,
  descricao VARCHAR(50) NOT NULL
)

CREATE TABLE IF NOT EXISTS refeicoes (
  id_refeicao INT PRIMARY KEY AUTO_INCREMENT,

  data_refeicao DATE NOT NULL, /*Apenas a data é necessaria*/

  id_user VARCHAR(225) NOT NULL,
  id_tipo_refeicao INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES usuarios(id_user) ON DELETE CASCADE,
  FOREIGN KEY(id_tipo_refeicao) REFERENCES tipo_refeicao ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alimento (
  id_alimento INT PRIMARY KEY AUTO_INCREMENT,

  nome_alimento VARCHAR(225) NOT NULL,
  porcao_padrao INT NOT NULL,
  caloria INT NOT NULL,
  carboidrato INT NOT NULL,
  proteina INT NOT NULL,
  gordura INT NOT NULL,
  origem_dado VARCHAR(225)
);

CREATE TABLE IF NOT EXISTS item_refeicao (
  id_item_refeicao INT
  id_refeicao INT NOT NULL,
  id_alimento INT NOT NULL,
  PRIMARY KEY (id_item_refeicao),

  qtd_alimento INT NOT NULL, /*Em gramas(g)*/

  FOREIGN KEY(id_refeicao) REFERENCES refeicoes(id_refeicao) ON DELETE CASCADE,
  FOREIGN KEY(id_alimento) REFERENCES alimentos(id_alimento) ON DELETE CASCADE
);