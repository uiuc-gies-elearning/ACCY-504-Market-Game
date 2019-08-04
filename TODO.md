# TODO

## Easy
- [ ]	Professor needs to know audit amounts (3 Hours) Needs to show per round -> remove delete from auditor_bid.js
- [x]	Show auditor winner in history/professor dashboard (3 Hours)
- [x]	Highlight which buy each buyer did (database change?) (5 Hours)
- [x]	Fix professor history showing on results (admin_control.ejs:224) (1 Hour)
- [x]	Fix num bids on no buy (admin_control.js:58) (1 Hour)
- [x]	Make profits update for professor at end of period (1 Hour)
- [x]	Color for Qualities (2 Hours)
- [x]	Change Seller Number in Sale History to show names (2 Hours)
- [x]	Adding some instructions (pop up) (4 Hours)
- [x]	Force button (way to get around a team not inputting decisions) (2 Hours)
  - UNTESTED (TEST ON LAST BUYER), NEED TO ADD TO ADMIN CONTROL SCREEN (check buyer_selection line 206, buyOverride
    and seller_selection line 106 sellerOverride, and put those into admin_control.ejs)
- [x]	Salting & hashing passwords (2 Hours)
- [x]	Removing the professor radio button from the create user screen
- [ ]	Protecting URLs
- [x]	Fixing U of I logo scaling
- [ ] Reset Game Button
- [ ] Add warning message when resetting a game

## To Fix
- [ ] Race condition on buyers buying quickly. Does not redirect buyer page when in the middle of refresh.
- [ ] Race condition on auditor bid. Does not redirect pages in middle of refresh.
- [ ] Professor History not updating correctly.

## Medium
- [ ]	Units sold graph
- [x]	Graphing Profits

## Hard
- [ ]	Professor seeing what gets inputted into worksheet
- [ ]	Cumulative profits for buyer/sellers, wealth transfer (Difference between profits of sellers/buyers, show over time)
- [ ]	Bar graph showing qualities sold/bought
- [ ]	Average price for each quality (axis for price, axis for quality)
- [ ]	Increase number of buyers/sellers
  - [x] Timer Force
  - [ ] Restructure Login

## Later
- [ ]	(Option for) show asking prices all at once
- [ ]	More testing with multiple players
- [ ]	Adding an email address field for future use
  - [ ] Toggle leaderboard
  - [ ] Worksheet download
  - [ ] Viewport for Mobile (https://www.w3schools.com/css/css_rwd_viewport.asp)

## DB Reset
```sql
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

INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`) VALUES ('professor', '1234', '3');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('killer queen', '1234', '2', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('crazy diamond', '1234', '2', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('green day', '1234', '2', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('onett', '1234', '1', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('twoson', '1234', '1', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('threed', '1234', '1', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('fourside', '1234', '1', '0');

INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`) VALUES ('professor', '1234', '3');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('seller1', '1234', '2', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('seller2', '1234', '2', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('seller3', '1234', '2', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('buyer1', '1234', '1', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('buyer2', '1234', '1', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('buyer3', '1234', '1', '0');
INSERT INTO `mydb`.`user` (`teamname`, `password`, `role_id`, `profits`) VALUES ('buyer4', '1234', '1', '0');
```