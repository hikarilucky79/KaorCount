/*Cria e usa a database*/
CREATE DATABASE IF NOT EXISTS KaorCount;
USE KaorCount;

  /* CRIA AS TABELAS */

CREATE TABLE IF NOT EXISTS USUARIOS (
  id_user INT PRIMARY KEY AUTO_INCREMENT,

  nome VARCHAR(225) NOT NULL,
  sobrenome VARCHAR(225) NOT NULL,
  altura DECIMAL(3,2) NOT NULL, 
  data_nascimento DATE NOT NULL, 
  sexo CHAR(1) NOT NULL,
  peso DECIMAL(5,2) NOT NULL, /*peso em Kg*/
  objetivo CHAR(1) DEFAULT 'P',
  nivel_atv CHAR(1) NOT NULL,
  email VARCHAR(225) NOT NULL UNIQUE,
  senha VARCHAR(225) NOT NULL, 
  data_cadastro DATE NOT NULL,
  status_conta CHAR(1) DEFAULT 'D',

  CONSTRAINT chk_email CHECK (email LIKE '%@%'),
  CONSTRAINT chk_sexo CHECK (sexo IN ('F', 'M')), /*feminino, masculino*/
  CONSTRAINT chk_objetivo CHECK (objetivo IN ('P', 'M', 'G')), /*perder,manter, ganhar*/
  CONSTRAINT chk_nivel_atv CHECK (nivel_atv IN ('S', 'L', 'N', 'M')) /*sedentario, levemente_atv, moderadamente_atv, muito_atv*/
);

CREATE TABLE IF NOT EXISTS META_NUTRI (
  id_meta INT PRIMARY KEY AUTO_INCREMENT,

  caloria_diaria INT NOT NULL,
  carboidrato_g DECIMAL(5,2),
  proteina_g DECIMAL(5,2) ,
  gordura_g DECIMAL(5,2),
  data_inicio DATE NOT NULL,

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS REGISTRO_AGUA (
  id_registro INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATE NOT NULL,
  qtd_ml DECIMAL(7,2),

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HISTORICO_PROGRESSO (
  id_progresso INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATE NOT NULL,
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

