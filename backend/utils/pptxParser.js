import { parseOffice } from "officeparser";

/**
 * Extract text from PPTX file
 * @param {string} filePath - Path to PPTX file
 * @returns {Promise<{text: string}>}
 */
export const extractTextFromPPTX = async (filePath) => {
    try {
        const ast = await parseOffice(filePath);
        return { text: ast.toText() };
    } catch (error) {
        console.error("PPTX parsing error:", error);
        throw new Error("Failed to extract text from PPTX");
    }
};