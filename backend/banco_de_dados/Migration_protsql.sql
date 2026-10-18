/* CRIA AS TABELAS NO SUPABASE (POSTGRESQL) */

CREATE TABLE IF NOT EXISTS objetivo (
  id_objetivo INT PRIMARY KEY,
  descricao_obj VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS nivel_atividade (
  id_nivel_atividade INT PRIMARY KEY,
  descricao_nivel VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_user VARCHAR(225) PRIMARY KEY,
  nome VARCHAR(225) NOT NULL,
  sobrenome VARCHAR(225) NOT NULL,
  altura DECIMAL(3,2) NOT NULL, 
  data_nascimento DATE NOT NULL, 
  sexo CHAR(1) NOT NULL CHECK (sexo IN ('F', 'M')),
  email VARCHAR(225) NOT NULL UNIQUE CHECK (email LIKE '%@%'),
  senha VARCHAR(225) NOT NULL, 
  data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
  status_conta CHAR(1) DEFAULT 'D',
  id_objetivo INT REFERENCES objetivo(id_objetivo) ON DELETE CASCADE,
  id_nivel_atividade INT REFERENCES nivel_atividade(id_nivel_atividade) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meta_nutri (
  id_meta INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  caloria_diaria INT NOT NULL,
  carboidrato_g DECIMAL(5,2),
  proteina_g DECIMAL(5,2),
  gordura_g DECIMAL(5,2),
  inicio_meta TIMESTAMP NOT NULL,
  agua_ml DECIMAL(6,2),
  id_user VARCHAR(225) NOT NULL REFERENCES usuarios(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registro_agua (
  id_registro INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_registro TIMESTAMP NOT NULL,
  qtd_ml DECIMAL(6,2),
  id_user VARCHAR(225) NOT NULL REFERENCES usuarios(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historico_progresso (
  id_progresso INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_registro TIMESTAMP NOT NULL,
  peso_registrado DECIMAL(5,2) NOT NULL,
  id_user VARCHAR(225) NOT NULL REFERENCES usuarios(id_user) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tipo_refeicao (
  id_tipo_refeicao INT PRIMARY KEY,
  descricao VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS refeicoes (
  id_refeicao INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_refeicao DATE NOT NULL,
  id_user VARCHAR(225) NOT NULL REFERENCES usuarios(id_user) ON DELETE CASCADE,
  id_tipo_refeicao INT NOT NULL REFERENCES tipo_refeicao(id_tipo_refeicao) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alimento (
  id_alimento INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome_alimento VARCHAR(225) NOT NULL,
  porcao_padrao INT NOT NULL,
  caloria INT NOT NULL,
  carboidrato INT NOT NULL,
  proteina INT NOT NULL,
  gordura INT NOT NULL,
  origem_dado VARCHAR(225)
);

CREATE TABLE IF NOT EXISTS item_refeicao (
  id_item_refeicao INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_refeicao INT NOT NULL REFERENCES refeicoes(id_refeicao) ON DELETE CASCADE,
  id_alimento INT NOT NULL REFERENCES alimento(id_alimento) ON DELETE CASCADE,
  qtd_alimento INT NOT NULL
);
