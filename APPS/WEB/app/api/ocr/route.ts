import { NextResponse } from "next/server";
import vision from "@google-cloud/vision";

const credentials = process.env.GOOGLE_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
  : undefined;

const client = new vision.ImageAnnotatorClient(
  credentials
    ? { credentials }
    : undefined
);

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function cleanExtractedValue(value: string) {
  return normalizeWhitespace(value)
    .replace(/^[:\-\s]+/, "")
    .replace(/\s+\(.*$/, "")
    .replace(/^"+|"+$/g, "")
    .trim();
}

function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = cleanExtractedValue(match[1]);
      if (value) return value;
    }
  }
  return "";
}

function findLineValue(lines: string[], labels: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = normalizeWhitespace(lines[i]);
    const lower = line.toLowerCase();

    for (const label of labels) {
      if (lower.startsWith(label.toLowerCase())) {
        const value = cleanExtractedValue(line.slice(label.length));
        if (value) return value;

        const nextLine = normalizeWhitespace(lines[i + 1] || "");
        if (
          nextLine &&
          !labels.some((l) => nextLine.toLowerCase().startsWith(l.toLowerCase()))
        ) {
          return cleanExtractedValue(nextLine);
        }
      }
    }
  }
  return "";
}

function extractTenantName(text: string, lines: string[]) {
  const direct = findFirstMatch(text, [
    /tenant[:\s]+([^\n]+)/i,
    /resident[:\s]+([^\n]+)/i,
    /tenant name[:\s]+([^\n]+)/i,
  ]);
  if (direct) return direct;

  const betweenPattern =
    /landlord\/agent"\)\s+and\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,4})\s*(?:_+)?\s*\(hereinafter referred to as "Tenant"\)/i;
  const betweenMatch = text.match(betweenPattern);
  if (betweenMatch?.[1]) return cleanExtractedValue(betweenMatch[1]);

  for (const line of lines) {
    const cleaned = normalizeWhitespace(line);
    if (
      /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,4}$/.test(cleaned) &&
      !/landlord|tenant|lease|agreement|premises|term/i.test(cleaned)
    ) {
      if (cleaned.split(" ").length >= 2) {
        return cleaned;
      }
    }
  }

  return "";
}

function extractLandlordName(text: string, lines: string[]) {
  const direct = findFirstMatch(text, [
    /landlord[:\s]+([^\n]+)/i,
    /property manager[:\s]+([^\n]+)/i,
    /owner[:\s]+([^\n]+)/i,
  ]);
  if (direct) return direct;

  const byLandlordPattern =
    /for\s+Landlord\s+([A-Z][A-Za-z0-9&,'._ -]{2,80})/i;
  const byLandlordMatch = text.match(byLandlordPattern);
  if (byLandlordMatch?.[1]) return cleanExtractedValue(byLandlordMatch[1]);

  return findLineValue(lines, ["Landlord", "Landlord/Agent"]);
}

function extractAddress(text: string, lines: string[]) {
  const direct = findFirstMatch(text, [
    /property address[:\s]+([^\n]+)/i,
    /service address[:\s]+([^\n]+)/i,
    /address[:\s]+([^\n]+)/i,
  ]);
  if (direct && !/known as$/i.test(direct)) return direct;

  const knownAsPattern =
    /premises\s+known\s+as\s+([A-Za-z0-9#.,' -]{6,120})/i;
  const knownAsMatch = text.match(knownAsPattern);
  if (knownAsMatch?.[1]) return cleanExtractedValue(knownAsMatch[1]);

  const streetLine = lines.find((line) =>
    /\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){1,6}/.test(line)
  );
  return streetLine ? cleanExtractedValue(streetLine) : "";
}

function extractCityStateZip(text: string) {
  const cityStateZipPattern =
    /([A-Z][A-Za-z .'-]+),?\s+(DC|MD|VA|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|WA|WI|WV)\s+(\d{5}(?:-\d{4})?)/i;

  const match = text.match(cityStateZipPattern);

  return {
    city: match?.[1] ? cleanExtractedValue(match[1]) : "",
    state: match?.[2] ? cleanExtractedValue(match[2]).toUpperCase() : "",
    zip_code: match?.[3] ? cleanExtractedValue(match[3]) : "",
  };
}

function extractLeaseDate(text: string, labels: RegExp[]) {
  return findFirstMatch(text, labels);
}

function calculateConfidence(fields: {
  tenant_name: string;
  landlord_name: string;
  address: string;
  zip_code: string;
  lease_start_date: string;
}) {
  let score = 0.45;

  if (fields.tenant_name) score += 0.15;
  if (fields.landlord_name) score += 0.1;
  if (fields.address) score += 0.15;
  if (fields.zip_code) score += 0.1;
  if (fields.lease_start_date) score += 0.05;

  return Math.min(Number(score.toFixed(2)), 0.98);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageDataUrl } = body;

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "Missing imageDataUrl" },
        { status: 400 }
      );
    }

    const matches = imageDataUrl.match(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/
    );

    if (!matches?.[1]) {
      return NextResponse.json(
        { error: "Invalid image data format. Please upload PNG or JPG image." },
        { status: 400 }
      );
    }

    const base64Image = matches[1];

    const [result] = await client.textDetection({
      image: { content: base64Image },
    });

    const annotations = result.textAnnotations;
    const rawText = annotations?.[0]?.description?.trim() || "";

    if (!rawText) {
      return NextResponse.json(
        { error: "No text detected in image" },
        { status: 400 }
      );
    }

    const normalizedText = normalizeWhitespace(rawText);
    const lines = rawText
      .split("\n")
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean);

    const documentType =
      /lease|residential lease|lease agreement/i.test(normalizedText)
        ? "Lease Document"
        : /utility|electric|water|gas bill/i.test(normalizedText)
          ? "Utility Bill"
          : /bank statement|statement period/i.test(normalizedText)
            ? "Bank Statement"
            : "Unknown";

    const tenant_name = extractTenantName(rawText, lines);
    const landlord_name = extractLandlordName(rawText, lines);
    const address = extractAddress(rawText, lines);

    const cityStateZip = extractCityStateZip(rawText);

    const lease_start_date = extractLeaseDate(rawText, [
      /lease start date[:\s]+([^\n]+)/i,
      /start date[:\s]+([^\n]+)/i,
      /effective date[:\s]+([^\n]+)/i,
      /beginning on[:\s]+([^\n]+)/i,
    ]);

    const lease_end_date = extractLeaseDate(rawText, [
      /lease end date[:\s]+([^\n]+)/i,
      /end date[:\s]+([^\n]+)/i,
      /ending on[:\s]+([^\n]+)/i,
      /expires on[:\s]+([^\n]+)/i,
    ]);

    const parsed = {
      document_type: documentType,
      tenant_name,
      landlord_name,
      address,
      city: cityStateZip.city,
      state: cityStateZip.state,
      zip_code: cityStateZip.zip_code,
      lease_start_date,
      lease_end_date,
      raw_text: rawText,
      confidence: calculateConfidence({
        tenant_name,
        landlord_name,
        address,
        zip_code: cityStateZip.zip_code,
        lease_start_date,
      }),
    };

    return NextResponse.json({ ok: true, result: parsed });
  } catch (error) {
    console.error("Google Vision OCR error:", error);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}