CREATE TABLE `Notes` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `User` bigint NOT NULL,
  `Date` bigint NOT NULL,
  `Note` text NOT NULL,
  `Severity` varchar(8) NOT NULL,
  `Link` text,
  `Noter` bigint NOT NULL
);

CREATE TABLE `PlaylistConfig` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `Month` text NOT NULL,
  `ThemeTitle` text NOT NULL,
  `ThemeDescription` text,
  `Current` bool,
  `maxSubmissions` integer DEFAULT 2
);

CREATE TABLE `PlaylistData` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `User` bigint NOT NULL,
  `Track` text NOT NULL,
  `Link` text NOT NULL,
  `Reasoning` text,
  `Picked` bool,
  `Month` integer NOT NULL
);

CREATE INDEX `user_index` ON `Notes` (`User`);

CREATE INDEX `month_index` ON `PlaylistData` (`Month`);

ALTER TABLE `PlaylistData` ADD FOREIGN KEY (`Month`) REFERENCES `PlaylistConfig` (`ID`);
