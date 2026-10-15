const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Try registering Impact font if locally available in assets/fonts/
const customFontPath = path.resolve(__dirname, '../../assets/fonts/impact.ttf');
if (fs.existsSync(customFontPath)) {
    try {
        registerFont(customFontPath, { family: 'Impact' });
        registerFont(customFontPath, { family: 'Impact', weight: 'bold' });
    } catch {
        // Fall back gracefully to system fonts
    }
}

const MEME_FONT_FAMILY = 'Impact, "Liberation Sans", "DejaVu Sans", sans-serif';

let cachedMockImage = null;

/**
 * Capitalizes every other letter of the input text, starting lowercase,
 * while preserving spaces, numbers, and punctuation without flipping casing parity.
 * Example: "yo mama" -> "yO mAmA"
 * @param {string} str
 * @returns {string}
 */
function mockText(str) {
    let result = '';
    let lower = true;
    for (const ch of str) {
        result += lower ? ch.toLowerCase() : ch.toUpperCase();
        if (ch.match(/[a-z]/i)) {
            lower = !lower;
        }
    }
    return result;
}

/**
 * Retrieves and caches the high-resolution SpongeBob mock template image.
 * Uses assets/images/mock.jpg.
 * @returns {Promise<Image>}
 */
async function getMockImage() {
    if (cachedMockImage) return cachedMockImage;

    const defaultJpgPath = path.resolve(__dirname, '../../assets/images/mock.jpg');
    const defaultPngPath = path.resolve(__dirname, '../../assets/images/mock.png');

    let imagePath = null;
    if (fs.existsSync(defaultJpgPath)) {
        imagePath = defaultJpgPath;
    } else if (fs.existsSync(defaultPngPath)) {
        imagePath = defaultPngPath;
    }

    if (!imagePath) {
        throw new Error('Mock meme template image could not be found in assets/images/ (expected mock.jpg or mock.png)');
    }

    cachedMockImage = await loadImage(imagePath);
    return cachedMockImage;
}

/**
 * Determines optimal font size and balanced line breaks using a dual binary search.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} str
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {{lines: string[], fontSize: number}}
 */
function formatText(ctx, str, canvasWidth, canvasHeight) {
    const MAX_LINE_BOX_WIDTH = Math.round(canvasWidth * 0.94);
    const MIN_LINE_BOX_WIDTH = 1;
    const MIN_FONT_SIZE = 12;

    // Initial max font size (up to ~85px for short text on a 502x353 image)
    const INITIAL_FONT_SIZE = Math.min(
        Math.round(canvasWidth * 0.17),
        Math.round(canvasHeight * 0.24),
        85
    );

    if (!str || str.trim() === '') {
        return { lines: [], fontSize: INITIAL_FONT_SIZE };
    }

    const words = str.trim().split(/\s+/);
    let linesByWord;

    function getTextWidth(text) {
        return ctx.measureText(text).width;
    }

    function fitIntoLinesAtSize(fontSize, boxWidth) {
        // Limits number of lines so total vertical height doesn't cover SpongeBob
        const maxNumberOfLines = Math.max(1, Math.floor(INITIAL_FONT_SIZE / fontSize));

        return (word) => {
            const currentLine = linesByWord[linesByWord.length - 1];
            const modifiedLine = currentLine.concat(word).join(' ').trim();

            if (getTextWidth(modifiedLine) > boxWidth) {
                // If a single word is wider than boxWidth, break it character-by-character
                if (getTextWidth(word) > boxWidth) {
                    if (fontSize <= MIN_FONT_SIZE) {
                        let chunk = '';
                        for (const char of word) {
                            if (getTextWidth(chunk + char) <= boxWidth) {
                                chunk += char;
                            } else {
                                if (chunk) linesByWord.push([chunk]);
                                chunk = char;
                            }
                        }
                        if (chunk) linesByWord.push([chunk]);
                        return true;
                    }
                    return false;
                }

                linesByWord.push([word]);
                return linesByWord.length <= maxNumberOfLines;
            } else {
                currentLine.push(word);
                return true;
            }
        };
    }

    function tryFormatAllWords(fontSize, boxWidth) {
        ctx.font = `${fontSize}px ${MEME_FONT_FAMILY}`;
        linesByWord = [[]];
        return words.every(fitIntoLinesAtSize(fontSize, boxWidth));
    }

    // Binary search 1: find maximum font size that fits all words within MAX_LINE_BOX_WIDTH
    let lowerFontSize = MIN_FONT_SIZE - 1;
    let upperFontSize = INITIAL_FONT_SIZE;
    let numberOfLines = 0;

    while (lowerFontSize !== upperFontSize) {
        const currentFontSize = Math.floor((upperFontSize + lowerFontSize) / 2);
        const formattedAllWords = tryFormatAllWords(currentFontSize, MAX_LINE_BOX_WIDTH);

        if (formattedAllWords) {
            lowerFontSize = currentFontSize + 1;
            numberOfLines = linesByWord.length;
        } else {
            upperFontSize = currentFontSize;
        }
    }

    const finalFontSize = Math.max(MIN_FONT_SIZE, lowerFontSize - 1);

    // Binary search 2: if multiple lines, find the minimal box width that balances lines evenly
    let lowerBoxWidth = MIN_LINE_BOX_WIDTH - 1;
    let upperBoxWidth = MAX_LINE_BOX_WIDTH;

    if (numberOfLines > 1) {
        while (lowerBoxWidth !== upperBoxWidth) {
            const currentBoxWidth = Math.floor((upperBoxWidth + lowerBoxWidth) / 2);
            const formattedAllWords = tryFormatAllWords(finalFontSize, currentBoxWidth);

            if (formattedAllWords) {
                upperBoxWidth = currentBoxWidth;
            } else {
                lowerBoxWidth = currentBoxWidth + 1;
            }
        }
    }

    const finalBoxWidth = upperBoxWidth;
    tryFormatAllWords(finalFontSize, finalBoxWidth);

    return {
        lines: linesByWord.map(line => line.join(' ').trim()).filter(line => line.length > 0),
        fontSize: finalFontSize
    };
}

module.exports = {
    builder: function (SlashCommandBuilder) {
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('mock')
                .setDescription('Mock some text with the SpongeBob meme')
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('The text you want to mock')
                        .setRequired(true)
                )
        );
        return SlashCommandBuilder;
    },

    execute: async function (interaction) {
        await interaction.deferReply();

        try {
            const inputText = interaction.options.getString('text');
            if (!inputText || inputText.trim().length === 0) {
                await interaction.editReply('Please provide some text to mock.');
                return;
            }

            // Convert input text to alternating case
            const mockedText = mockText(inputText.trim());

            // Load high-resolution base image template
            const baseImg = await getMockImage();

            // Create canvas matching base image dimensions
            const canvas = createCanvas(baseImg.width, baseImg.height);
            const ctx = canvas.getContext('2d');

            // Draw base SpongeBob image
            ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

            // Calculate optimal font size and balanced line breaks
            const { lines, fontSize } = formatText(ctx, mockedText, canvas.width, canvas.height);

            if (lines.length > 0) {
                // Typography & styling:
                // Centered, bottom aligned, bold meme styling
                ctx.font = `${fontSize}px ${MEME_FONT_FAMILY}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;

                // Outline width: proportional to font size (12% of font size, min 3px)
                const lineWidth = Math.max(3, Math.round(fontSize * 0.12));
                ctx.lineWidth = lineWidth;

                // Position at the bottom of the image, padded above the bottom edge
                const BOTTOM_MARGIN = Math.max(8, Math.round(canvas.height * 0.025));
                const boxBottom = canvas.height - BOTTOM_MARGIN - Math.ceil(lineWidth / 2);
                const lineHeight = Math.round(fontSize * 1.05);
                const centerX = Math.round(canvas.width / 2);

                // Render each line: thick black border first, solid white fill directly on top
                for (let i = 0; i < lines.length; i++) {
                    const lineY = boxBottom - ((lines.length - 1 - i) * lineHeight);
                    ctx.strokeStyle = '#000000';
                    ctx.strokeText(lines[i], centerX, lineY);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(lines[i], centerX, lineY);
                }
            }

            const outBuffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(outBuffer, {
                name: 'mock.png',
                description: mockedText
            });

            await interaction.editReply({ files: [attachment] });
        } catch (err) {
            interaction.client.log.error({ message: 'Error executing mock command', error: err });
            await interaction.editReply('I encountered an error generating the mock meme.');
        }
    }
};