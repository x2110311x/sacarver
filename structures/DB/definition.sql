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
