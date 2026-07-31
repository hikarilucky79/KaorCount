/*Cria e usa a database*/

CREATE DATABASE IF NOT EXISTS KaourCount;
USE KaourCount;

  /* CRIA AS TABELAS */

CREATE TABLE IF NOT EXISTS USUARIOS (
  id_user SMALLINT PRIMARY KEY AUTO_INCREMENT,

  nome VARCHAR(225) NOT NULL,
  sobrenome VARCHAR(225) NOT NULL,
  altura DECIMAL(3,2) NOT NULL, 
  data_nascimento DATE NOT NULL, 
  sexo CHAR NOT NULL,
  objetivo CHAR DEFAULT('P'),
  nivel_atv CHAR NOT NULL,
  email VARCHAR(225) NOT NULL UNIQUE,
  senha VARCHAR(225) NOT NULL, 
  data_cadastro DATE NOT NULL,
  status_conta CHAR DEFAULT('D') ,

  CONSTRAINT chk_email CHECK (email LIKE '%@%'),
  CONSTRAINT chk_sexo CHECK (sexo LIKE 'F', 'M'), /*feminino, masculino*/
  CONSTRAINT chk_objetivo CHECK (objetivo LIKE 'P', 'M', 'G'), /*perder,manter, ganhar*/
  CONSTRAINT chk_nivel_atv CHECK (nivel_atv LIKE 'S', 'L', 'N', 'M') /*perder,manter, ganhar*/
);