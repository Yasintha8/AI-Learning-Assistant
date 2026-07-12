import fs from "fs/promises";
import mammoth from "mammoth";

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<{text: string}>}
 */
export const extractTextFromDOCX = async (filePath) => {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        return { text: result.value };
    } catch (error) {
        console.error("DOCX parsing error:", error);
        throw new Error("Failed to extract text from DOCX");
    }
};