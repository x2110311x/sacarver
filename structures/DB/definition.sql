CREATE TABLE `Notes` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `User` bigint NOT NULL,
  `Date` bigint NOT NULL,
  `Note` text NOT NULL,
  `Severity` varchar(8) NOT NULL,
  `Link` text,
  `Noter` bigint NOT NULL,
  `EditedBy` bigint,
  `EditedDate` bigint
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

CREATE TABLE `Honeypot` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `BannedCount` integer NOT NULL DEFAULT 0
);

CREATE TABLE `ScamImageHashes` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `Hash` varchar(64) NOT NULL UNIQUE,
  `Label` varchar(255) DEFAULT 'Scam Image',
  `AddedBy` bigint NOT NULL,
  `DateAdded` bigint NOT NULL,
  `MatchCount` integer DEFAULT 0
);

CREATE INDEX `user_index` ON `Notes` (`User`);
CREATE INDEX `hash_index` ON `ScamImageHashes` (`Hash`);

CREATE INDEX `month_index` ON `PlaylistData` (`Month`);

ALTER TABLE `PlaylistData` ADD FOREIGN KEY (`Month`) REFERENCES `PlaylistConfig` (`ID`);

CREATE TABLE `NoteVersions` (
  `ID` integer PRIMARY KEY AUTO_INCREMENT,
  `NoteID` integer NOT NULL,
  `Version` integer NOT NULL,
  `Note` text NOT NULL,
  `Severity` varchar(8) NOT NULL,
  `Link` text,
  `Editor` bigint NOT NULL,
  `Date` bigint NOT NULL
);

CREATE INDEX `note_version_idx` ON `NoteVersions` (`NoteID`, `Version`);
ALTER TABLE `NoteVersions` ADD FOREIGN KEY (`NoteID`) REFERENCES `Notes` (`ID`) ON DELETE CASCADE;
