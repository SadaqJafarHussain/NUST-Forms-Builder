import { AsyncParser } from "@json2csv/node";
import ExcelJS from "exceljs";
import { logger } from "@formbricks/logger";

export const convertToCsv = async (fields: string[], jsonData: Record<string, string | number>[]) => {
  let csv: string = "";

  const parser = new AsyncParser({
    fields,
  });

  try {
    csv = await parser.parse(jsonData).promise();
  } catch (err) {
    logger.error(err, "Failed to convert to CSV");
    throw new Error("Failed to convert to CSV");
  }

  return csv;
};

export const convertToXlsxBuffer = async (
  fields: string[],
  jsonData: Record<string, string | number>[],
  options?: { rtl?: boolean }
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1", {
    views: [{ rightToLeft: options?.rtl ?? false }],
  });

  // Set up columns with headers and auto-width
  worksheet.columns = fields.map((field) => {
    // Calculate column width based on content
    let maxWidth = field.length;
    jsonData.forEach((row) => {
      const cellValue = row[field];
      if (cellValue !== undefined && cellValue !== null) {
        const cellLength = String(cellValue).length;
        if (cellLength > maxWidth) {
          maxWidth = cellLength;
        }
      }
    });

    return {
      header: field,
      key: field,
      width: Math.min(maxWidth + 4, 50),
    };
  });

  // Add data rows
  jsonData.forEach((row) => {
    worksheet.addRow(row);
  });

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 12 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
  });

  // Style data rows
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    row.eachCell((cell) => {
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFEEEEEE" } },
        left: { style: "thin", color: { argb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
        right: { style: "thin", color: { argb: "FFEEEEEE" } },
      };
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
