use mydb;
DELETE FROM `bid`;
DELETE FROM `auditor bid`;
DELETE FROM `buy history`;
DELETE FROM `sale history`;
DELETE FROM `history`;
DELETE FROM `offers`;
DELETE FROM `seller list`;
DELETE FROM `buyer list`;
DELETE FROM `game owner`;
DELETE FROM `user`;
DELETE FROM `game`;

# Professor account is the only one that needs to exist; player accounts are created with game.
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`) VALUES ('professor', '1234', '3');
