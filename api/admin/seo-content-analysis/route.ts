import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

interface ContentAnalysisResult {
  score: number;
  keywordDensity: { [key: string]: number };
  readabilityScore: number;
  suggestions: string[];
  missingKeywords: string[];
  contentLength: number;
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasH1: boolean;
    properHierarchy: boolean;
  };
  imageAnalysis: {
    totalImages: number;
    missingAlt: number;
    optimizedImages: number;
    suggestions: string[];
  };
  internalLinks: {
    count: number;
    suggestions: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { content, targetKeywords, pageType, entityId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Content is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeContent(content, targetKeywords || [], pageType, entityId);

    // Store analysis results
    try {
      await executeQuery(`
        INSERT OR REPLACE INTO seo_content_optimization 
        (page_type, entity_id, url_path, target_keyword, content_score, 
         title_optimization, meta_optimization, content_length_score, 
         keyword_density, readability_score, internal_links_count, 
         image_optimization_score, last_analyzed, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        pageType || 'unknown',
        entityId || null,
        '/', // Will be updated with actual URL
        targetKeywords.join(', '),
        analysis.score,
        analysis.headingStructure.hasH1 ? 1 : 0,
        1, // Meta optimization placeholder
        Math.min(100, Math.round((analysis.contentLength / 1000) * 100)),
        Math.round(analysis.keywordDensity[targetKeywords[0]] || 0),
        analysis.readabilityScore,
        analysis.internalLinks.count,
        Math.round((analysis.imageAnalysis.optimizedImages / Math.max(1, analysis.imageAnalysis.totalImages)) * 100)
      ]);
    } catch (error) {
      console.error("Failed to store content analysis:", error);
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error("Content analysis failed:", error);
    return NextResponse.json(
      { success: false, message: "Content analysis failed" },
      { status: 500 }
    );
  }
}

async function analyzeContent(
  content: string, 
  targetKeywords: string[], 
  pageType?: string,
  entityId?: number
): Promise<ContentAnalysisResult> {
  
  // Clean content for analysis
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanContent.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const contentLength = words.length;

  // Analyze keyword density
  const keywordDensity: { [key: string]: number } = {};
  targetKeywords.forEach(keyword => {
    const keywordCount = (cleanContent.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    keywordDensity[keyword] = Math.round((keywordCount / words.length) * 100 * 100) / 100; // 2 decimal places
  });

  // Analyze heading structure
  const headingStructure = {
    h1Count: (content.match(/<h1[^>]*>/gi) || []).length,
    h2Count: (content.match(/<h2[^>]*>/gi) || []).length,
    h3Count: (content.match(/<h3[^>]*>/gi) || []).length,
    hasH1: content.includes('<h1'),
    properHierarchy: true // Simplified for now
  };

  // Analyze images
  const images = content.match(/<img[^>]*>/gi) || [];
  const imagesWithAlt = content.match(/<img[^>]*alt\s*=\s*["'][^"']*["'][^>]*>/gi) || [];
  const imageAnalysis = {
    totalImages: images.length,
    missingAlt: images.length - imagesWithAlt.length,
    optimizedImages: imagesWithAlt.length,
    suggestions: []
  };

  if (imageAnalysis.missingAlt > 0) {
    imageAnalysis.suggestions.push(`Add alt text to ${imageAnalysis.missingAlt} images`);
  }

  // Analyze internal links
  const internalLinks = content.match(/<a[^>]*href\s*=\s*["'][^"']*["'][^>]*>/gi) || [];
  const internalLinksAnalysis = {
    count: internalLinks.length,
    suggestions: []
  };

  if (internalLinks.length < 3) {
    internalLinksAnalysis.suggestions.push("Add more internal links to improve SEO");
  }

  // Calculate readability score (simplified Flesch Reading Ease)
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
  const avgSyllablesPerWord = estimateAverageSyllables(words);
  
  const readabilityScore = Math.max(0, Math.min(100, 
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  ));

  // Generate suggestions
  const suggestions: string[] = [];
  const missingKeywords: string[] = [];

  // Content length suggestions
  if (contentLength < 300) {
    suggestions.push("Content is too short. Aim for at least 300 words for better SEO.");
  } else if (contentLength > 2000) {
    suggestions.push("Content is very long. Consider breaking into multiple pages or sections.");
  }

  // Keyword density suggestions
  targetKeywords.forEach(keyword => {
    const density = keywordDensity[keyword] || 0;
    if (density === 0) {
      missingKeywords.push(keyword);
      suggestions.push(`Add keyword "${keyword}" to content (currently 0% density)`);
    } else if (density < 0.5) {
      suggestions.push(`Increase "${keyword}" keyword density (currently ${density}%, aim for 1-3%)`);
    } else if (density > 4) {
      suggestions.push(`Reduce "${keyword}" keyword density (currently ${density}%, may be over-optimization)`);
    }
  });

  // Heading suggestions
  if (!headingStructure.hasH1) {
    suggestions.push("Add an H1 heading with your main keyword");
  }
  if (headingStructure.h2Count === 0) {
    suggestions.push("Add H2 headings to structure your content better");
  }

  // Readability suggestions
  if (readabilityScore < 30) {
    suggestions.push("Content is difficult to read. Use shorter sentences and simpler words.");
  } else if (readabilityScore < 50) {
    suggestions.push("Content readability can be improved. Consider shorter sentences.");
  }

  // Add image and internal link suggestions
  suggestions.push(...imageAnalysis.suggestions);
  suggestions.push(...internalLinksAnalysis.suggestions);

  // Calculate overall score
  let score = 0;
  
  // Content length score (0-25 points)
  if (contentLength >= 300 && contentLength <= 2000) score += 25;
  else if (contentLength >= 200) score += 15;
  else if (contentLength >= 100) score += 10;

  // Keyword optimization score (0-25 points)
  const avgKeywordDensity = Object.values(keywordDensity).reduce((a, b) => a + b, 0) / Math.max(1, targetKeywords.length);
  if (avgKeywordDensity >= 1 && avgKeywordDensity <= 3) score += 25;
  else if (avgKeywordDensity >= 0.5 && avgKeywordDensity <= 4) score += 15;
  else if (avgKeywordDensity > 0) score += 10;

  // Heading structure score (0-20 points)
  if (headingStructure.hasH1) score += 10;
  if (headingStructure.h2Count > 0) score += 10;

  // Readability score (0-15 points)
  if (readabilityScore >= 60) score += 15;
  else if (readabilityScore >= 40) score += 10;
  else if (readabilityScore >= 20) score += 5;

  // Image optimization score (0-10 points)
  if (imageAnalysis.totalImages > 0) {
    const imageOptimizationRatio = imageAnalysis.optimizedImages / imageAnalysis.totalImages;
    score += Math.round(imageOptimizationRatio * 10);
  } else {
    score += 5; // No images is neutral
  }

  // Internal linking score (0-5 points)
  if (internalLinksAnalysis.count >= 3) score += 5;
  else if (internalLinksAnalysis.count >= 1) score += 3;

  return {
    score: Math.round(score),
    keywordDensity,
    readabilityScore: Math.round(readabilityScore),
    suggestions,
    missingKeywords,
    contentLength,
    headingStructure,
    imageAnalysis,
    internalLinks: internalLinksAnalysis
  };
}

function estimateAverageSyllables(words: string[]): number {
  let totalSyllables = 0;
  words.forEach(word => {
    // Simplified syllable counting
    let syllables = word.toLowerCase().match(/[aeiouy]+/g)?.length || 1;
    if (word.endsWith('e')) syllables--;
    if (syllables === 0) syllables = 1;
    totalSyllables += syllables;
  });
  return totalSyllables / Math.max(1, words.length);
}

export async function GET(request: NextRequest) {
  try {
    // Get recent content analysis results
    const results = await executeQuery(`
      SELECT * FROM seo_content_optimization 
      ORDER BY last_analyzed DESC 
      LIMIT 50
    `);

    return NextResponse.json({
      success: true,
      data: results || []
    });

  } catch (error) {
    console.error("Failed to get content analysis results:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get analysis results" },
      { status: 500 }
    );
  }
}
