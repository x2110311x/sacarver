CREATE TABLE `Users` (
  `ID` bigint PRIMARY KEY,
  `username` varchar(33)
);

CREATE TABLE `Notes` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `User` bigint NOT NULL,
  `Date` bigint NOT NULL,
  `Note` text NOT NULL,
  `Severity` varchar(8) NOT NULL,
  `ChannelID` bigint,
  `MessageID` bigint,
  `Noter` bigint NOT NULL
);

CREATE INDEX `user_index` ON `Notes` (`User`);

ALTER TABLE `Notes` ADD FOREIGN KEY (`User`) REFERENCES `Users` (`ID`);

ALTER TABLE `Notes` ADD FOREIGN KEY (`Noter`) REFERENCES `Users` (`ID`);
