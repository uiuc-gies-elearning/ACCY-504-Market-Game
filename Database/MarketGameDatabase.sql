-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET latin1 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`stage`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`stage` (
  `stage_id` INT(11) NOT NULL,
  `stage_meaning` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`stage_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`game`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`game` (
  `game_id` INT(11) NOT NULL AUTO_INCREMENT,
  `game_name` VARCHAR(45) NULL DEFAULT NULL,
  `price_low` DOUBLE NULL DEFAULT NULL,
  `price_med` DOUBLE NULL DEFAULT NULL,
  `price_high` DOUBLE NULL DEFAULT NULL,
  `resale_low` DOUBLE NULL DEFAULT NULL,
  `resale_med` DOUBLE NULL DEFAULT NULL,
  `resale_high` DOUBLE NULL DEFAULT NULL,
  `stage_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`game_id`),
  INDEX `stage_id_idx` (`stage_id` ASC) VISIBLE,
  CONSTRAINT `stage_id`
    FOREIGN KEY (`stage_id`)
    REFERENCES `mydb`.`stage` (`stage_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 10
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`role`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`role` (
  `role_id` INT(11) NOT NULL AUTO_INCREMENT,
  `role_type` VARCHAR(45) NULL DEFAULT NULL COMMENT 'Stores 3 available roles: Buyer, Seller, and Auditor. Subject to change, as well as an addition of role Admin',
  PRIMARY KEY (`role_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`user` (
  `user_id` INT(11) NOT NULL AUTO_INCREMENT,
  `teamname` VARCHAR(45) NULL DEFAULT NULL,
  `password` VARCHAR(60) NULL DEFAULT NULL,
  `role_id` INT(11) NULL DEFAULT NULL,
  `game_id` INT(11) NULL DEFAULT NULL,
  `profits` DOUBLE NULL DEFAULT NULL,
  `audited` TINYINT(4) NULL DEFAULT NULL,
  `buy_pos` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  INDEX `game_id_idx` (`game_id` ASC) VISIBLE,
  INDEX `role_id_idx` (`role_id` ASC) VISIBLE,
  CONSTRAINT `game_id`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`game` (`game_id`),
  CONSTRAINT `role_id`
    FOREIGN KEY (`role_id`)
    REFERENCES `mydb`.`role` (`role_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 838
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`auditor bid`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`auditor bid` (
  `bid_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NULL DEFAULT NULL,
  `bid_amount` DOUBLE NULL DEFAULT NULL,
  PRIMARY KEY (`bid_id`),
  INDEX `user_id_4_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT `user_id_4`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 15
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`buyer list`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`buyer list` (
  `buyer_id` INT(11) NOT NULL AUTO_INCREMENT,
  `buyer_number` INT(11) NULL DEFAULT NULL,
  `user_id` INT(11) NULL DEFAULT NULL,
  `game_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`buyer_id`),
  INDEX `user_id_idx` (`user_id` ASC) VISIBLE,
  INDEX `game_id_2_idx` (`game_id` ASC) VISIBLE,
  CONSTRAINT `game_id_4`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`game` (`game_id`),
  CONSTRAINT `user_id_2`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 33
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`seller list`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`seller list` (
  `seller_id` INT(11) NOT NULL AUTO_INCREMENT,
  `seller_number` INT(11) NULL DEFAULT NULL,
  `user_id` INT(11) NOT NULL,
  `game_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`seller_id`),
  INDEX `user_id_idx` (`user_id` ASC) VISIBLE,
  INDEX `game_id_idx` (`game_id` ASC) VISIBLE,
  CONSTRAINT `game_id_1`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`game` (`game_id`),
  CONSTRAINT `user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 25
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`bid`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`bid` (
  `bid_id` INT(11) NOT NULL AUTO_INCREMENT,
  `seller_id` INT(11) NULL DEFAULT NULL COMMENT 'If NULL, indicates a no buy',
  `buyer_id` INT(11) NULL DEFAULT NULL,
  `bid_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bid_id`),
  INDEX `buyer_id_idx` (`buyer_id` ASC) VISIBLE,
  INDEX `seller_id_idx` (`seller_id` ASC) VISIBLE,
  CONSTRAINT `buyer_id`
    FOREIGN KEY (`buyer_id`)
    REFERENCES `mydb`.`buyer list` (`buyer_id`),
  CONSTRAINT `seller_id1`
    FOREIGN KEY (`seller_id`)
    REFERENCES `mydb`.`seller list` (`seller_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 41
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`history` (
  `history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `game_id` INT(11) NULL DEFAULT NULL,
  `cur_phase` INT(11) NULL DEFAULT NULL,
  `cur_period` INT(11) NULL DEFAULT NULL,
  `audit_winner` VARCHAR(45) NULL DEFAULT NULL,
  `audit_amount` DECIMAL(10,2) NULL DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  INDEX `game_id_idx` (`game_id` ASC) VISIBLE,
  CONSTRAINT `game_id_2`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`game` (`game_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 17
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`buy history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`buy history` (
  `buy_id` INT(11) NOT NULL AUTO_INCREMENT,
  `history_id` INT(11) NULL DEFAULT NULL,
  `buyer_id` INT(11) NULL DEFAULT NULL,
  `buy_quality` INT(11) NULL DEFAULT NULL,
  `buy_price` DOUBLE NULL DEFAULT NULL,
  `seller_number` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`buy_id`),
  INDEX `history_id_idx` (`history_id` ASC) VISIBLE,
  INDEX `buyer_id_idx` (`buyer_id` ASC) VISIBLE,
  CONSTRAINT `buyer_id_1`
    FOREIGN KEY (`buyer_id`)
    REFERENCES `mydb`.`buyer list` (`buyer_id`),
  CONSTRAINT `history_id_1`
    FOREIGN KEY (`history_id`)
    REFERENCES `mydb`.`history` (`history_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 41
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`game owner`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`game owner` (
  `owner_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NULL DEFAULT NULL,
  `game_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`owner_id`),
  INDEX `gameOwnerGame_idx` (`game_id` ASC) VISIBLE,
  INDEX `gameOwnerOwner_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT `gameOwnerGame`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`game` (`game_id`),
  CONSTRAINT `gameOwnerOwner`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`user` (`user_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 10
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`quality types`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`quality types` (
  `quality_id` INT(11) NOT NULL AUTO_INCREMENT,
  `quality` VARCHAR(45) NULL DEFAULT NULL COMMENT 'Stores three quality types: high (HIGH), medium (MED), and low (LOW)',
  PRIMARY KEY (`quality_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`offers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`offers` (
  `offer_id` INT(11) NOT NULL AUTO_INCREMENT,
  `seller_id` INT(11) NULL DEFAULT NULL,
  `quality_id` INT(11) NULL DEFAULT NULL,
  `price` DOUBLE NULL DEFAULT NULL,
  `second_sale` TINYINT(4) NULL DEFAULT NULL,
  PRIMARY KEY (`offer_id`),
  UNIQUE INDEX `seller_id` (`seller_id` ASC) VISIBLE,
  INDEX `seller_id_idx` (`seller_id` ASC) VISIBLE,
  INDEX `quality_id_idx` (`quality_id` ASC) VISIBLE,
  CONSTRAINT `quality_id`
    FOREIGN KEY (`quality_id`)
    REFERENCES `mydb`.`quality types` (`quality_id`),
  CONSTRAINT `seller_id`
    FOREIGN KEY (`seller_id`)
    REFERENCES `mydb`.`seller list` (`seller_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 34
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mydb`.`sale history`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`sale history` (
  `sale_id` INT(11) NOT NULL AUTO_INCREMENT,
  `history_id` INT(11) NULL DEFAULT NULL,
  `seller_id` INT(11) NULL DEFAULT NULL,
  `units_sold` INT(11) NULL DEFAULT NULL,
  `price_sold` DOUBLE NULL DEFAULT NULL,
  `quality_id` INT(11) NULL DEFAULT NULL COMMENT 'Indicates quality sold',
  PRIMARY KEY (`sale_id`),
  INDEX `history_id_idx` (`history_id` ASC) VISIBLE,
  INDEX `qiuality_id_idx` (`quality_id` ASC) VISIBLE,
  INDEX `seller_id_idx` (`seller_id` ASC) VISIBLE,
  CONSTRAINT `history_id`
    FOREIGN KEY (`history_id`)
    REFERENCES `mydb`.`history` (`history_id`),
  CONSTRAINT `quality_id_2`
    FOREIGN KEY (`quality_id`)
    REFERENCES `mydb`.`quality types` (`quality_id`),
  CONSTRAINT `seller_id_2`
    FOREIGN KEY (`seller_id`)
    REFERENCES `mydb`.`seller list` (`seller_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
