const assert = require('assert');
const fetchNotes = require('../helpers/notes/fetchnotes');
const logNoteAction = require('../helpers/notes/logNoteAction');

async function runTests() {
  console.log('--- Starting Staff Note Improvements Test Suite ---');

  // Test 1: fetchnotes helper pagination and formatting
  console.log('\nTest 1: helpers/notes/fetchnotes.js pagination and card rendering');

  const mockNotes = [
    {
      ID: 101,
      User: '111111111111111111',
      Date: 1700000000,
      Note: 'First test note for user',
      Severity: 'High',
      Link: 'https://discord.com/channels/123/456/789',
      Noter: '999999999999999999',
      EditedBy: null,
      EditedDate: null
    },
    {
      ID: 102,
      User: '111111111111111111',
      Date: 1700010000,
      Note: 'Second note with new native edit fields',
      Severity: 'Medium',
      Link: 'N/A',
      Noter: '999999999999999999',
      EditedBy: '888888888888888888',
      EditedDate: 1700020000
    },
    {
      ID: 103,
      User: '111111111111111111',
      Date: 1700030000,
      Note: 'Third note with legacy appended edit trail\nEdited by <@777777777777777777> on <t:1700040000:F>',
      Severity: 'Low',
      Link: 'N/A',
      Noter: '999999999999999999',
      EditedBy: null,
      EditedDate: null
    }
  ];

  const mockClient = {
    icon: 'https://example.com/icon.png',
    log: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    },
    users: {
      async fetch(id) {
        return {
          id: String(id),
          displayName: `User_${id}`,
          displayAvatarURL: () => `https://example.com/avatar_${id}.png`
        };
      }
    },
    DB: {
      Notes: {
        async findAndCountAll({ where, _order, limit, offset }) {
          assert.strictEqual(where.User, '111111111111111111');
          const slice = mockNotes.slice(offset, offset + limit);
          return {
            count: mockNotes.length,
            rows: slice
          };
        }
      }
    }
  };

  const resultEmbed = await fetchNotes(mockClient, '111111111111111111', { page: 1, pageSize: 2 });
  assert(resultEmbed, 'fetchNotes should return an embed');
  assert.strictEqual(resultEmbed.totalNotes, 3, 'Total notes count should be 3');
  assert.strictEqual(resultEmbed.totalPages, 2, 'Total pages for 3 notes at 2 per page should be 2');
  assert.strictEqual(resultEmbed.notes.length, 2, 'Page 1 should have 2 notes');

  // Validate fields in embed
  const fields = resultEmbed.data.fields;
  assert.strictEqual(fields.length, 2, 'Embed should contain 2 fields for 2 notes');
  assert(fields[0].name.includes('Note #101'), 'Field 1 should mention Note #101');
  assert(fields[0].name.includes('🔴 High Severity'), 'Field 1 should have High severity badge');
  assert(fields[0].value.includes('Jump to Message'), 'Field 1 should include message link');
  assert(!fields[0].value.includes('Last edited by'), 'Unedited note should not have Last edited by');

  assert(fields[1].name.includes('Note #102'), 'Field 2 should mention Note #102');
  assert(fields[1].value.includes('**Last edited by:** <@888888888888888888>'), 'Field 2 should show native Last edited by');

  // Test Page 2 with legacy edit trail
  const page2Embed = await fetchNotes(mockClient, '111111111111111111', { page: 2, pageSize: 2 });
  assert.strictEqual(page2Embed.notes.length, 1, 'Page 2 should have 1 note');
  const page2Field = page2Embed.data.fields[0];
  assert(page2Field.name.includes('Note #103'), 'Page 2 note should be Note #103');
  assert(page2Field.value.includes('**Last edited by:** <@777777777777777777>'), 'Legacy edit trail should be converted to Last edited by');
  assert(!page2Field.value.includes('Edited by <@777777777777777777> on <t:'), 'Legacy raw string should be stripped from note text');

  console.log('✓ fetchnotes pagination, severity badges, and edit attribution passed.');

  // Test 2: Migration regex parsing
  console.log('\nTest 2: scripts/migrateNoteEdits.js regex parsing logic');
  const editRegex = /(?:\r?\n)+Edited by <@!?(\d+)> on <t:(\d+)(?::[A-Za-z])?>/g;
  const sampleNoteWithEdit = "User was warned for spamming.\nEdited by <@123456789012345678> on <t:1710000000:F>";
  const matches = [...sampleNoteWithEdit.matchAll(editRegex)];
  assert.strictEqual(matches.length, 1, 'Should find 1 edit match');
  assert.strictEqual(matches[0][1], '123456789012345678', 'Should extract editor ID');
  assert.strictEqual(matches[0][2], '1710000000', 'Should extract timestamp');
  const cleanedText = sampleNoteWithEdit.replace(editRegex, '').trim();
  assert.strictEqual(cleanedText, 'User was warned for spamming.', 'Should leave clean note text');
  console.log('✓ Migration regex parsing passed.');

  // Test 3: logNoteAction helper resilience
  console.log('\nTest 3: helpers/notes/logNoteAction.js error resilience');
  let sentPayload = null;
  const mockClientWithChannel = {
    icon: 'https://example.com/icon.png',
    config: {
      channels: {
        staffCommandLog: 'channel_123'
      }
    },
    channels: {
      async fetch(id) {
        if (id === 'channel_123') {
          return {
            async send(payload) {
              sentPayload = payload;
            }
          };
        }
        return null;
      }
    },
    log: {
      debug() {},
      info() {},
      warn() {},
      error() {}
    }
  };

  // Test add log
  await logNoteAction(mockClientWithChannel, {
    action: 'add',
    targetUserId: '111',
    staffMemberId: '999',
    noteId: 105,
    severity: 'High',
    noteText: 'Testing add audit',
    link: 'https://discord.com',
    timestamp: 1700000000
  });

  assert(sentPayload && sentPayload.embeds && sentPayload.embeds.length === 1, 'Should send an embed payload');
  const addEmbed = sentPayload.embeds[0].data;
  assert.strictEqual(addEmbed.title, 'Staff Note Added', 'Embed title should match add action');
  assert(addEmbed.fields.some(f => f.name === 'Target User' && f.value.includes('111')), 'Embed should include Target User');

  // Test edit log
  sentPayload = null;
  await logNoteAction(mockClientWithChannel, {
    action: 'edit',
    targetUserId: '111',
    staffMemberId: '888',
    noteId: 105,
    severity: 'High',
    oldNoteText: 'Old text',
    newNoteText: 'New text',
    oldLink: 'N/A',
    newLink: 'https://discord.com/new',
    timestamp: 1700050000
  });

  assert(sentPayload && sentPayload.embeds && sentPayload.embeds.length === 1, 'Should send edit embed');
  const editEmbed = sentPayload.embeds[0].data;
  assert(editEmbed.title.includes('Staff Note Edited'), 'Embed title should match edit action');
  assert(editEmbed.fields.some(f => f.name === 'Previous Note' && f.value === 'Old text'), 'Embed should include previous note');
  assert(editEmbed.fields.some(f => f.name === 'Updated Note' && f.value === 'New text'), 'Embed should include updated note');

  console.log('✓ logNoteAction creates valid add & edit audit embeds.');

  // Test 4: helpers/notes/noteHistory.js
  console.log('\nTest 4: helpers/notes/noteHistory.js versioning and formatting');
  const {
    cleanLegacyNoteText,
    recordVersion,
    fetchNoteHistory,
    buildVersionEmbed,
    buildHistoryButtons
  } = require('../helpers/notes/noteHistory');

  // Test cleanLegacyNoteText
  const sampleClean = cleanLegacyNoteText("Regular note text");
  assert.strictEqual(sampleClean, "Regular note text", "Should return clean string unchanged");
  const sampleLegacy = cleanLegacyNoteText("Note content\nEdited by <@12345> on <t:1700000000:R>");
  assert.strictEqual(sampleLegacy, "Note content", "Should strip legacy edit stamp");

  // Test buildHistoryButtons
  const buttonsFirst = buildHistoryButtons(0, 3);
  const compsFirst = buttonsFirst.components;
  assert.strictEqual(compsFirst.length, 3, "History should have 3 navigation buttons");
  assert.strictEqual(compsFirst[0].data.disabled, true, "Older button should be disabled on first version");
  assert.strictEqual(compsFirst[1].data.disabled, false, "Newer button should be enabled on first version");

  const buttonsMid = buildHistoryButtons(1, 3);
  assert.strictEqual(buttonsMid.components[0].data.disabled, false, "Older button should be enabled on middle version");
  assert.strictEqual(buttonsMid.components[1].data.disabled, false, "Newer button should be enabled on middle version");

  const buttonsLast = buildHistoryButtons(2, 3);
  assert.strictEqual(buttonsLast.components[0].data.disabled, false, "Older button should be enabled on last version");
  assert.strictEqual(buttonsLast.components[1].data.disabled, true, "Newer button should be disabled on last version");

  // Test buildVersionEmbed
  const mockNoteRecord = {
    ID: 55,
    User: '111111111111111111'
  };
  const mockVersion1 = {
    ID: 1,
    NoteID: 55,
    Version: 1,
    Note: 'Original note contents',
    Severity: 'High',
    Link: 'https://discord.com/msg/1',
    Editor: '999999999999999999',
    Date: 1700000000
  };
  const v1Embed = await buildVersionEmbed(mockClient, mockNoteRecord, mockVersion1, 2, mockNoteRecord.User);
  assert(v1Embed.data.title.includes('Note #55 Version History'), 'Embed title should mention Note #55 Version History');
  assert(v1Embed.data.description.includes('Version **1** of **2** (Original Note)'), 'Embed description should identify Original Note');
  assert(v1Embed.data.fields[0].value.includes('> Original note contents'), 'Embed should blockquote note text');
  assert(v1Embed.data.fields[1].value.includes('Added by:'), 'Version 1 should state Added by');
  assert(v1Embed.data.fields[1].value.includes('Jump to Message'), 'Version 1 should include message link');

  // Test recordVersion & fetchNoteHistory
  const inMemoryVersions = [];
  const mockHistoryClient = {
    log: { debug() {}, info() {}, warn() {}, error() {} },
    DB: {
      Notes: {
        async findOne({ where }) {
          if (where.ID === 55) {
            return {
              ID: 55,
              User: '111111111111111111',
              Date: 1700000000,
              Note: 'Original note contents',
              Severity: 'High',
              Link: 'N/A',
              Noter: '999999999999999999',
              EditedBy: '888888888888888888',
              EditedDate: 1700010000
            };
          }
          return null;
        }
      },
      NoteVersions: {
        async findAll({ where }) {
          return inMemoryVersions.filter(v => v.NoteID === where.NoteID);
        },
        async create(record) {
          inMemoryVersions.push({ ...record, ID: inMemoryVersions.length + 1 });
          return record;
        }
      }
    }
  };

  // Record initial version 1
  await recordVersion(mockHistoryClient, {
    noteId: 55,
    noteText: 'Initial creation',
    severity: 'High',
    link: 'N/A',
    editorId: '999999999999999999',
    timestamp: 1700000000,
    isInitial: true
  });
  assert.strictEqual(inMemoryVersions.length, 1, 'Should record 1 initial version');
  assert.strictEqual(inMemoryVersions[0].Version, 1, 'Initial version should be 1');

  // Record an edit (version 2)
  await recordVersion(mockHistoryClient, {
    noteId: 55,
    noteText: 'Edited note text',
    severity: 'Medium',
    link: 'https://discord.com',
    editorId: '888888888888888888',
    timestamp: 1700020000,
    isInitial: false
  });
  assert.strictEqual(inMemoryVersions.length, 2, 'Should record version 2');
  assert.strictEqual(inMemoryVersions[1].Version, 2, 'Second version should be 2');
  assert.strictEqual(inMemoryVersions[1].Note, 'Edited note text', 'Second version should have updated text');

  const historyResult = await fetchNoteHistory(mockHistoryClient, 55);
  assert.strictEqual(historyResult.length, 2, 'fetchNoteHistory should return 2 versions');

  console.log('✓ noteHistory helpers, embed rendering, and version tracking passed.');

  // Test 5: commands/staff/note/history.js builder
  console.log('\nTest 5: commands/staff/note/history.js slash command builder');
  const { SlashCommandBuilder } = require('discord.js');
  const historyCmd = require('../commands/staff/note/history');

  const baseBuilder = new SlashCommandBuilder().setName('testnote').setDescription('testing');
  historyCmd.builder(baseBuilder);
  const builtJson = baseBuilder.toJSON();
  const historyOption = builtJson.options.find(opt => opt.name === 'history');
  assert(historyOption, 'Command should have history subcommand');
  const noteIdOption = historyOption.options.find(opt => opt.name === 'noteid');
  assert(noteIdOption, 'History subcommand should have noteid option');
  assert.strictEqual(noteIdOption.required, true, 'noteid option should be required');

  console.log('✓ /staff note history subcommand builder passed.');

  console.log('\n--- All Staff Note Tests Passed ---');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Note tests failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
