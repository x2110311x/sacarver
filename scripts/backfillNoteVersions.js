const SacarverDB = require('../structures/DB');
const { cleanLegacyNoteText } = require('../helpers/notes/noteHistory');

async function backfillNoteVersions() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`========================================`);
  console.log(`Starting Note Version History Backfill ${isDryRun ? '[DRY RUN]' : '[LIVE]'}`);
  console.log(`========================================`);

  const DB = SacarverDB.getInstance().db;
  const sequelize = DB.Notes.sequelize;

  // Ensure NoteVersions table exists
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`NoteVersions\` (
        \`ID\` integer PRIMARY KEY AUTO_INCREMENT,
        \`NoteID\` integer NOT NULL,
        \`Version\` integer NOT NULL,
        \`Note\` text NOT NULL,
        \`Severity\` varchar(8) NOT NULL,
        \`Link\` text,
        \`Editor\` bigint NOT NULL,
        \`Date\` bigint NOT NULL,
        INDEX \`note_version_idx\` (\`NoteID\`, \`Version\`),
        FOREIGN KEY (\`NoteID\`) REFERENCES \`Notes\` (\`ID\`) ON DELETE CASCADE
      );
    `);
    console.log("Verified database table `NoteVersions` exists.");
  } catch (schemaErr) {
    console.warn("Schema check note:", schemaErr.message);
  }

  await DB.NoteVersions.sync().catch(() => {});

  const allNotes = await DB.Notes.findAll({
    order: [['ID', 'ASC']]
  });

  console.log(`Found ${allNotes.length} total note(s) in database.\n`);

  let alreadyRecordedCount = 0;
  let v1CreatedCount = 0;
  let v2CreatedCount = 0;

  for (const note of allNotes) {
    const existingVersions = await DB.NoteVersions.findAll({
      where: { NoteID: note.ID },
      order: [['Version', 'ASC']]
    });

    if (existingVersions.length > 0) {
      alreadyRecordedCount++;
      continue;
    }

    const cleanText = cleanLegacyNoteText(note.Note);
    const hasEdit = Boolean(note.EditedBy && note.EditedDate);

    console.log(`Note #${note.ID}:`);
    console.log(`  User: ${note.User}`);
    console.log(`  Original Noter: ${note.Noter} at ${note.Date} (${new Date(Number(note.Date) * 1000).toISOString()})`);
    if (hasEdit) {
      console.log(`  Last Editor: ${note.EditedBy} at ${note.EditedDate} (${new Date(Number(note.EditedDate) * 1000).toISOString()})`);
    }

    if (!isDryRun) {
      // Create Version 1
      await DB.NoteVersions.create({
        NoteID: note.ID,
        Version: 1,
        Note: cleanText,
        Severity: note.Severity || 'Note',
        Link: note.Link || 'N/A',
        Editor: note.Noter,
        Date: note.Date
      });
      v1CreatedCount++;

      // If edited, create Version 2
      if (hasEdit) {
        await DB.NoteVersions.create({
          NoteID: note.ID,
          Version: 2,
          Note: cleanText,
          Severity: note.Severity || 'Note',
          Link: note.Link || 'N/A',
          Editor: note.EditedBy,
          Date: note.EditedDate
        });
        v2CreatedCount++;
      }
      console.log(`  ✅ Inserted ${hasEdit ? 'Versions 1 & 2' : 'Version 1'}`);
    } else {
      v1CreatedCount++;
      if (hasEdit) v2CreatedCount++;
      console.log(`  🔍 [DRY RUN] Would insert ${hasEdit ? 'Versions 1 & 2' : 'Version 1'}`);
    }
    console.log('');
  }

  console.log(`========================================`);
  console.log(`Backfill Summary:`);
  console.log(`  Total notes checked: ${allNotes.length}`);
  console.log(`  Notes already having versions: ${alreadyRecordedCount}`);
  console.log(`  ${isDryRun ? 'V1 versions to create' : 'V1 versions created'}: ${v1CreatedCount}`);
  console.log(`  ${isDryRun ? 'V2 versions to create' : 'V2 versions created'}: ${v2CreatedCount}`);
  console.log(`========================================\n`);

  process.exit(0);
}

backfillNoteVersions().catch(err => {
  console.error("Backfill failed with error:", err);
  process.exit(1);
});
