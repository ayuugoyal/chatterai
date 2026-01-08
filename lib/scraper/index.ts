import * as cheerio from "cheerio";

interface ScrapedData {
  title: string;
  description: string;
  content: string;
  headings: string[];
  links: string[];
  images: string[];
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script, style, and other non-content tags
    $("script, style, nav, footer, iframe, noscript").remove();

    // Extract metadata
    const title =
      $("title").text() ||
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text() ||
      "";

    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    // Extract main content
    const contentSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      "#content",
      ".main-content",
      "body",
    ];

    let content = "";
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text();
        break;
      }
    }

    // Clean up content
    content = content.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

    // Extract headings
    const headings: string[] = [];
    $("h1, h2, h3, h4, h5, h6").each((_, element) => {
      const text = $(element).text().trim();
      if (text) headings.push(text);
    });

    // Extract links
    const links: string[] = [];
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (href && (href.startsWith("http") || href.startsWith("/"))) {
        links.push(href);
      }
    });

    // Extract images
    const images: string[] = [];
    $("img[src]").each((_, element) => {
      const src = $(element).attr("src");
      if (src) images.push(src);
    });

    return {
      title,
      description,
      content: content.slice(0, 50000), // Limit content size
      headings,
      links: [...new Set(links)].slice(0, 50), // Unique links, limited
      images: [...new Set(images)].slice(0, 20), // Unique images, limited
    };
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error(
      `Failed to scrape URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function scrapeSitemap(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      // If it's a 404, maybe it's not a sitemap, that's fine.
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const urls: string[] = [];
    $("loc").each((_, element) => {
      const loc = $(element).text().trim();
      if (loc) urls.push(loc);
    });

    return [...new Set(urls)].slice(0, 50); // Limit to 50 URLs for now
  } catch (error) {
    console.error("Sitemap scraping error:", error);
    // Return empty array instead of throwing, so we can fallback to treating it as regular URL if needed, or just report 0 URLs found
    return [];
  }
}

export function formatScrapedDataForAI(data: ScrapedData): string {
  return `
Website: ${data.title}
Description: ${data.description}

Key Sections:
${data.headings.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Content:
${data.content}

Available Pages: ${data.links.slice(0, 10).join(", ")}
`.trim();
}

// Rate limiting helper
const scrapeQueue = new Map<string, Promise<ScrapedData>>();

export async function scrapeWithCache(url: string): Promise<ScrapedData> {
  const existing = scrapeQueue.get(url);
  if (existing) {
    return existing;
  }

  const promise = scrapeUrl(url);
  scrapeQueue.set(url, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    // Remove from queue after 5 seconds
    setTimeout(() => scrapeQueue.delete(url), 5000);
  }
}
