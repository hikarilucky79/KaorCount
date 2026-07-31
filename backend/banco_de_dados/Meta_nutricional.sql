CREATE TABLE IF NOT EXISTS META_NUTRI (
  id_meta INT PRIMARY KEY AUTO_INCREMENT,

  caloria_diaria INT NOT NULL,
  carboidrato_g DECIMAL(5,2),
  proteina_g DECIMAL(5,2) ,
  gordura_g DECIMAL(5,2),
  data_inicio DATE NOT NULL,

  id_user INT NOT NULL,

  FOREIGN KEY(id_user) REFERENCES USUARIOS
);