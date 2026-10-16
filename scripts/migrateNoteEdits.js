const SacarverDB = require('../structures/DB');
const { Op } = require('sequelize');

async function migrateNoteEdits() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`========================================`);
  console.log(`Starting Note Edit Retroactive Migration ${isDryRun ? '[DRY RUN]' : '[LIVE]'}`);
  console.log(`========================================`);

  const DB = SacarverDB.getInstance().db;
  
  // Ensure table schema has new columns before querying/updating
  await DB.Notes.sync({ alter: true });

  const notes = await DB.Notes.findAll({
    where: {
      Note: {
        [Op.like]: '%Edited by%'
      }
    }
  });

  console.log(`Found ${notes.length} candidate note(s) containing "Edited by".\n`);

  const editRegex = /(?:\r?\n)+Edited by <@!?(\d+)> on <t:(\d+)(?::[A-Za-z])?>/g;
  let migratedCount = 0;
  let skippedCount = 0;

  for (const note of notes) {
    const rawText = note.Note;
    const matches = [...rawText.matchAll(editRegex)];

    if (matches.length === 0) {
      console.log(`⚠️  Note #${note.ID} matched LIKE query but did not match regex pattern. Skipping.`);
      skippedCount++;
      continue;
    }

    // Use the last edit occurrence if multiple exist
    const lastMatch = matches[matches.length - 1];
    const editorId = lastMatch[1];
    const editTimestamp = parseInt(lastMatch[2], 10);
    const cleanNote = rawText.replace(editRegex, '').trim();

    console.log(`Note #${note.ID}:`);
    console.log(`  Target User: ${note.User}`);
    console.log(`  Extracted Editor: ${editorId}`);
    console.log(`  Extracted Date: ${editTimestamp} (${new Date(editTimestamp * 1000).toISOString()})`);
    console.log(`  Clean Note Snippet: "${cleanNote.substring(0, 60)}${cleanNote.length > 60 ? '...' : ''}"`);

    if (!isDryRun) {
      await note.update({
        Note: cleanNote,
        EditedBy: editorId,
        EditedDate: editTimestamp
      });
      console.log(`  ✅ Successfully updated Note #${note.ID}`);
    } else {
      console.log(`  🔍 [DRY RUN] Would update Note #${note.ID}`);
    }

    migratedCount++;
    console.log('');
  }

  console.log(`========================================`);
  console.log(`Migration Summary:`);
  console.log(`  Total candidate notes: ${notes.length}`);
  console.log(`  ${isDryRun ? 'Notes that would be migrated' : 'Notes successfully migrated'}: ${migratedCount}`);
  console.log(`  Skipped notes: ${skippedCount}`);
  console.log(`========================================\n`);

  process.exit(0);
}

migrateNoteEdits().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
