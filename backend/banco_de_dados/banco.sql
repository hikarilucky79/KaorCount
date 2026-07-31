/*Cria e usa a database*/

CREATE DATABASE IF NOT EXISTS KaourCount;
USE KaourCount;

  /* CRIA AS TABELAS */

CREATE TABLE IF NOT EXISTS USUARIOS (
  id_user INT PRIMARY KEY AUTO_INCREMENT,

  nome VARCHAR(225) NOT NULL,
  sobrenome VARCHAR(225) NOT NULL,
  altura DECIMAL(3,2) NOT NULL, 
  data_nascimento DATE NOT NULL, 
  sexo CHAR(1) NOT NULL,
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

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user)
);

CREATE TABLE IF NOT EXISTS REGISTRO_AGUA (
  id_registro INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATE NOT NULL,
  qtd_ml DECIMAL(7,2),

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user)
);

CREATE TABLE IF NOT EXISTS HISTORICO_PROGRESSO (
  id_progresso INT PRIMARY KEY AUTO_INCREMENT,

  data_registro DATE NOT NULL,
  peso_atual DECIMAL(5,2) NOT NULL, /*Em kilos*/
  altura_atual DECIMAL(3,2) NOT NULL, /*Em METROS*/

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS(id_user)
);