const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Try registering Impact font if locally available in assets/fonts/
const customFontPath = path.resolve(__dirname, '../../assets/fonts/impact.ttf');
if (fs.existsSync(customFontPath)) {
    try {
        registerFont(customFontPath, { family: 'Impact' });
    } catch {
        // Ignore font registration error and fall back to system fonts
    }
}

let cachedMockImage = null;

/**
 * Capitalizes every other letter of the input text, preserving non-letter characters.
 * Example: "look at mock.js" -> "lOoK aT mOcK.jS"
 * @param {string} text
 * @returns {string}
 */
function mockText(text) {
    let capitalize = false;
    let result = '';

    for (const char of text) {
        // Check if the character is a letter (Unicode-aware)
        if (char.toLowerCase() !== char.toUpperCase()) {
            result += capitalize ? char.toUpperCase() : char.toLowerCase();
            capitalize = !capitalize;
        } else {
            result += char;
        }
    }

    return result;
}

/**
 * Retrieves and caches the SpongeBob mock template image.
 * If the image is not in assets/images/, checks if a user uploaded file is available and copies it over.
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
        throw new Error('Mock meme template image could not be found');
    }

    cachedMockImage = await loadImage(imagePath);
    return cachedMockImage;
}

/**
 * Word-wraps text within the given maximum width.
 * Splits long words if a single word exceeds maxWidth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if (!word) continue;

        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }

            // Check if the single word itself is wider than maxWidth
            if (ctx.measureText(word).width > maxWidth) {
                let chunk = '';
                for (const char of word) {
                    const testChunk = chunk + char;
                    if (ctx.measureText(testChunk).width <= maxWidth) {
                        chunk = testChunk;
                    } else {
                        if (chunk) lines.push(chunk);
                        chunk = char;
                    }
                }
                currentLine = chunk;
            } else {
                currentLine = word;
            }
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

/**
 * Finds the optimal font size to fit the text into the top section of the image,
 * ensuring it doesn't exceed maxFontSize or cover the main subject (SpongeBob).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} maxFontSize
 * @param {number} minFontSize
 * @returns {{fontSize: number, lines: string[], lineHeight: number}}
 */
function fitText(ctx, text, maxWidth, maxHeight, maxFontSize, minFontSize = 12) {
    for (let size = maxFontSize; size >= minFontSize; size -= 1) {
        ctx.font = `bold ${size}px Impact, "Arial Black", "DejaVu Sans", sans-serif`;
        const lines = wrapText(ctx, text, maxWidth);
        const lineHeight = Math.round(size * 1.18);
        const totalHeight = lines.length * lineHeight;

        const fitsWidth = lines.every(line => ctx.measureText(line).width <= maxWidth);
        if (fitsWidth && totalHeight <= maxHeight) {
            return { fontSize: size, lines, lineHeight };
        }
    }

    // Fallback to minFontSize if text is very long
    ctx.font = `bold ${minFontSize}px Impact, "Arial Black", "DejaVu Sans", sans-serif`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = Math.round(minFontSize * 1.18);
    return { fontSize: minFontSize, lines, lineHeight };
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

            // Load base image template
            const baseImg = await getMockImage();

            // Create canvas matching base image dimensions
            const canvas = createCanvas(baseImg.width, baseImg.height);
            const ctx = canvas.getContext('2d');

            // Draw base SpongeBob image
            ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

            // Boundaries for text placement
            const maxWidth = Math.round(canvas.width * 0.92);
            // Keep text in the top 35% of the image to prevent covering SpongeBob
            const maxHeight = Math.round(canvas.height * 0.35);

            // Max font size so short text doesn't balloon to cover the image
            const maxFontSize = Math.min(
                Math.round(canvas.height * 0.14),
                Math.round(canvas.width * 0.09),
                48
            );

            // Autosize font and wrap text
            const { fontSize, lines, lineHeight } = fitText(ctx, mockedText, maxWidth, maxHeight, maxFontSize);

            // Imgflip meme style typography:
            // Impact bold font, centered, thick black stroke outline, white fill
            ctx.font = `bold ${fontSize}px Impact, "Arial Black", "DejaVu Sans", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.lineWidth = Math.max(3, Math.round(fontSize / 6));
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#FFFFFF';

            const topPadding = Math.max(10, Math.round(canvas.height * 0.04));
            const centerX = Math.round(canvas.width / 2);

            // Render each line with stroke outline followed by fill
            for (let i = 0; i < lines.length; i++) {
                const lineY = topPadding + (i * lineHeight);
                ctx.strokeText(lines[i], centerX, lineY);
                ctx.fillText(lines[i], centerX, lineY);
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