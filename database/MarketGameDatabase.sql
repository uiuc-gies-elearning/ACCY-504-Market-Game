-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`Game`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Game` (
  `game_id` INT NOT NULL AUTO_INCREMENT,
  `game_name` VARCHAR(45) NULL,
  `price_low` DOUBLE NULL,
  `price_med` DOUBLE NULL,
  `price_high` DOUBLE NULL,
  `resale_low` DOUBLE NULL,
  `resale_med` DOUBLE NULL,
  `resale_high` DOUBLE NULL,
  PRIMARY KEY (`game_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Role`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Role` (
  `role_id` INT NOT NULL AUTO_INCREMENT,
  `Role` VARCHAR(45) NULL COMMENT 'Stores 3 available roles: Buyer, Seller, and Auditor. Subject to change, as well as an addition of role Admin',
  PRIMARY KEY (`role_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`User`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`User` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `teamname` VARCHAR(45) NULL,
  `role_id` INT NULL,
  `game_id` INT NULL,
  `profits` DOUBLE NULL,
  `audited` TINYINT NULL,
  PRIMARY KEY (`user_id`),
  INDEX `game_id_idx` (`game_id` ASC),
  INDEX `role_id_idx` (`role_id` ASC),
  CONSTRAINT `game_id_1`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`Game` (`game_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `role_id`
    FOREIGN KEY (`role_id`)
    REFERENCES `mydb`.`Role` (`role_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Seller List`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Seller List` (
  `seller_id` INT NOT NULL AUTO_INCREMENT,
  `seller_number` INT NULL,
  `user_id` INT NULL,
  PRIMARY KEY (`seller_id`),
  INDEX `user_id_idx` (`user_id` ASC),
  CONSTRAINT `user_id_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`User` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Buyer List`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Buyer List` (
  `buyer_id` INT NOT NULL AUTO_INCREMENT,
  `buyer_number` INT NULL,
  `user_id` INT NULL,
  PRIMARY KEY (`buyer_id`),
  INDEX `user_id_idx` (`user_id` ASC),
  CONSTRAINT `user_id_2`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`User` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Auditor Customer`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Auditor Customer` (
  `customer_id` INT NOT NULL AUTO_INCREMENT,
  `customer_type` VARCHAR(45) NULL COMMENT 'Holds two possible customer groups: Buyer and Seller',
  PRIMARY KEY (`customer_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Auditor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Auditor` (
  `auditor_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `customer_id` INT NULL,
  PRIMARY KEY (`auditor_id`),
  INDEX `customer_id_idx` (`customer_id` ASC),
  INDEX `user_id_idx` (`user_id` ASC),
  CONSTRAINT `user_id_3`
    FOREIGN KEY (`user_id`)
    REFERENCES `mydb`.`User` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `customer_id`
    FOREIGN KEY (`customer_id`)
    REFERENCES `mydb`.`Auditor Customer` (`customer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Quality Types`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Quality Types` (
  `quality_id` INT NOT NULL AUTO_INCREMENT,
  `quality` VARCHAR(45) NULL COMMENT 'Stores three quality types: high (HIGH), medium (MED), and low (LOW)',
  PRIMARY KEY (`quality_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Offers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Offers` (
  `offer_id` INT NOT NULL AUTO_INCREMENT,
  `seller_id` INT NULL,
  `quality_id` INT NULL,
  `price` DOUBLE NULL,
  `second_sale` TINYINT NULL,
  PRIMARY KEY (`offer_id`),
  INDEX `seller_id_idx` (`seller_id` ASC),
  INDEX `quality_id_idx` (`quality_id` ASC),
  CONSTRAINT `seller_id_1`
    FOREIGN KEY (`seller_id`)
    REFERENCES `mydb`.`Seller List` (`seller_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `quality_id_1`
    FOREIGN KEY (`quality_id`)
    REFERENCES `mydb`.`Quality Types` (`quality_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Bid`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Bid` (
  `bid_id` INT NOT NULL AUTO_INCREMENT,
  `offer_id` INT NULL COMMENT 'If NULL, indicates a no buy',
  `buyer_id` INT NULL,
  `choice` INT NULL COMMENT 'Indicates if the choice is the buyer\'s first, second, or third choice',
  `bid_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `bid_phase` INT NULL,
  `bid_period` INT NULL,
  PRIMARY KEY (`bid_id`),
  INDEX `offer_id_idx` (`offer_id` ASC),
  INDEX `buyer_id_idx` (`buyer_id` ASC),
  CONSTRAINT `offer_id`
    FOREIGN KEY (`offer_id`)
    REFERENCES `mydb`.`Offers` (`offer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `buyer_id_2`
    FOREIGN KEY (`buyer_id`)
    REFERENCES `mydb`.`Buyer List` (`buyer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`History`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`History` (
  `history_id` INT NOT NULL AUTO_INCREMENT,
  `game_id` INT NULL,
  `cur_phase` INT NULL,
  `cur_period` INT NULL,
  PRIMARY KEY (`history_id`),
  INDEX `game_id_idx` (`game_id` ASC),
  CONSTRAINT `game_id_2`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`Game` (`game_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Sale History`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Sale History` (
  `sale_id` INT NOT NULL,
  `history_id` INT NULL,
  `seller_id` INT NULL,
  `period_profit` DOUBLE NULL,
  `units_sold` INT NULL,
  `price_sold` DOUBLE NULL,
  `quality_id` INT NULL COMMENT 'Indicates quality sold',
  PRIMARY KEY (`sale_id`),
  INDEX `history_id_idx` (`history_id` ASC),
  INDEX `qiuality_id_idx` (`quality_id` ASC),
  INDEX `seller_id_idx` (`seller_id` ASC),
  CONSTRAINT `history_id_2`
    FOREIGN KEY (`history_id`)
    REFERENCES `mydb`.`History` (`history_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `quality_id_2`
    FOREIGN KEY (`quality_id`)
    REFERENCES `mydb`.`Quality Types` (`quality_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `seller_id_2`
    FOREIGN KEY (`seller_id`)
    REFERENCES `mydb`.`Seller List` (`seller_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Buy History`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Buy History` (
  `buy_id` INT NOT NULL AUTO_INCREMENT,
  `history_id` INT NULL,
  `buyer_id` INT NULL,
  PRIMARY KEY (`buy_id`),
  INDEX `history_id_idx` (`history_id` ASC),
  INDEX `buyer_id_idx` (`buyer_id` ASC),
  CONSTRAINT `history_id_1`
    FOREIGN KEY (`history_id`)
    REFERENCES `mydb`.`History` (`history_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `buyer_id_1`
    FOREIGN KEY (`buyer_id`)
    REFERENCES `mydb`.`Buyer List` (`buyer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
