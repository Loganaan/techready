import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface JobData {
  company: string;
  role: string;
  jobDescription: string;
  companyInfo: string;
  seniority: 'intern' | 'junior' | 'mid' | 'senior';
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the job posting page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract data from the page
    const extractedData = extractJobData($);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape job posting. Please try manual input.' },
      { status: 500 }
    );
  }
}

function extractJobData($: cheerio.CheerioAPI): JobData {
  // Initialize data structure
  const data: JobData = {
    company: '',
    role: '',
    jobDescription: '',
    companyInfo: '',
    seniority: 'junior',
  };

  // Strategy 1: Try JSON-LD structured data first (most reliable and universal)
  const jsonLdScript = $('script[type="application/ld+json"]').html();
  if (jsonLdScript) {
    try {
      const jsonData = JSON.parse(jsonLdScript);
      const jobPosting = Array.isArray(jsonData) 
        ? jsonData.find((item: Record<string, unknown>) => item['@type'] === 'JobPosting')
        : jsonData['@type'] === 'JobPosting' ? jsonData : null;

      if (jobPosting) {
        data.role = jobPosting.title || '';
        data.company = jobPosting.hiringOrganization?.name || '';
        data.jobDescription = cleanText(jobPosting.description || '');
        data.companyInfo = jobPosting.hiringOrganization?.description || '';
      }
    } catch (e) {
      console.log('Failed to parse JSON-LD', e);
    }
  }

  // Strategy 2: Check for iCIMS jobDescriptionConfig (used by many ATS platforms)
  if (!data.jobDescription || data.jobDescription.length < 100) {
    const scriptContent = $('script').toArray()
      .map(el => $(el).html())
      .find(content => content && content.includes('jobDescriptionConfig'));

    if (scriptContent) {
      extractFromJobDescriptionConfig(scriptContent, data);
    }
  }

  // Strategy 3: Try common ATS-specific patterns
  if (!data.jobDescription || data.jobDescription.length < 100) {
    tryATSPatterns($, data);
  }

  // Strategy 4: Smart generic extraction with scoring
  if (!data.jobDescription || data.jobDescription.length < 100) {
    extractWithSmartHeuristics($, data);
  }

  // Strategy 5: Fallback to meta tags if still missing data
  if (!data.company) {
    data.company = extractFromMeta($, 'og:site_name') || 
                   cleanText($('title').text().split('|').pop() || '');
  }

  if (!data.role) {
    data.role = extractFromMeta($, 'og:title') || 
                cleanText($('title').text().split('|')[0] || '');
  }

  if (!data.jobDescription) {
    data.jobDescription = extractFromMeta($, 'og:description') || 
                         extractFromMeta($, 'description');
  }

  // Detect seniority level from role title
  data.seniority = detectSeniority(data.role);

  // Clean and validate
  data.company = cleanText(data.company);
  data.role = cleanText(data.role);
  data.jobDescription = cleanText(data.jobDescription);
  data.companyInfo = cleanText(data.companyInfo);

  return data;
}

// Extract from iCIMS jobDescriptionConfig (universal for iCIMS-based sites)
function extractFromJobDescriptionConfig(scriptContent: string, data: JobData) {
  try {
    const match = scriptContent.match(/window\.jobDescriptionConfig\s*=\s*({[\s\S]*?});/);
    if (match) {
      const config = JSON.parse(match[1]);
      const job = config.job || config.jobFormatted;
      
      if (job) {
        data.role = cleanText(job.title || job.job_title || '');
        data.company = cleanText(job.hiring_organization || job.clientName || job.company_name || '');
        
        // Build comprehensive job description
        let fullDescription = '';
        
        // Main description
        if (job.description) {
          const descHtml = cheerio.load(job.description);
          descHtml('script, style').remove();
          fullDescription += descHtml.text().trim();
        }
        
        // Job summary/overview
        if (job.summary || job.job_summary) {
          const summaryHtml = cheerio.load(job.summary || job.job_summary);
          summaryHtml('script, style').remove();
          const summaryText = summaryHtml.text().trim();
          if (summaryText && !fullDescription.includes(summaryText.substring(0, 50))) {
            fullDescription = summaryText + '\n\n' + fullDescription;
          }
        }
        
        // Qualifications, Responsibilities, Requirements
        const sections = [
          { key: 'qualifications', label: 'Qualifications' },
          { key: 'responsibilities', label: 'Responsibilities' },
          { key: 'requirements', label: 'Requirements' }
        ];
        
        for (const section of sections) {
          if (job[section.key]) {
            const sectionHtml = cheerio.load(job[section.key]);
            sectionHtml('script, style').remove();
            const sectionText = sectionHtml.text().trim();
            if (sectionText) {
              fullDescription += `\n\n${section.label}:\n${sectionText}`;
            }
          }
        }
        
        data.jobDescription = fullDescription.trim();
      }
    }
  } catch (e) {
    console.log('Failed to parse jobDescriptionConfig', e);
  }
}

// Try common ATS platform patterns
function tryATSPatterns($: cheerio.CheerioAPI, data: JobData) {
  const atsPatterns = [
    // iCIMS
    { 
      company: '.iCIMS_Header, .iCIMS_Branding',
      title: 'h1.iCIMS_InfoMsg_Job',
      description: '.iCIMS_InfoMsg, #iCIMS_JobDescription'
    },
    // Greenhouse
    {
      company: '.company-name',
      title: '.app-title',
      description: '#content .content'
    },
    // Lever
    {
      company: '.main-header-text a',
      title: '.posting-headline h2',
      description: '.section.page-centered'
    },
    // Workday
    {
      company: '[data-automation-id="jobPostingCompany"]',
      title: 'h2[data-automation-id="jobPostingHeader"]',
      description: '[data-automation-id="jobPostingDescription"]'
    },
    // LinkedIn
    {
      company: '.topcard__org-name-link, .top-card-layout__card .topcard__flavor--black-link',
      title: '.topcard__title, .top-card-layout__title',
      description: '.show-more-less-html__markup, .description__text'
    },
    // Indeed
    {
      company: '[data-company-name], .jobsearch-InlineCompanyRating-companyHeader a',
      title: '.jobsearch-JobInfoHeader-title, h1.jobsearch-JobInfoHeader-title',
      description: '#jobDescriptionText'
    },
    // SmartRecruiters
    {
      company: '.header-company-name',
      title: 'h1.job-title',
      description: '.job-description'
    },
    // BambooHR
    {
      company: '.company-header__name',
      title: 'h1.BambooHR-ATS-Job-Title',
      description: '.BambooHR-ATS-Description'
    }
  ];

  for (const pattern of atsPatterns) {
    let matchCount = 0;
    
    if (!data.company && pattern.company) {
      const companyEl = $(pattern.company).first();
      if (companyEl.length > 0) {
        data.company = companyEl.text().trim();
        matchCount++;
      }
    }
    
    if (!data.role && pattern.title) {
      const titleEl = $(pattern.title).first();
      if (titleEl.length > 0) {
        data.role = titleEl.text().trim();
        matchCount++;
      }
    }
    
    if ((!data.jobDescription || data.jobDescription.length < 100) && pattern.description) {
      const descEl = $(pattern.description).first();
      if (descEl.length > 0) {
        const clone = descEl.clone();
        clone.find('script, style, nav, header, footer, .apply-button, .social-share').remove();
        const text = clone.text().trim();
        if (text.length > 100) {
          data.jobDescription = text;
          matchCount++;
        }
      }
    }
    
    // If we got at least 2 matches from this pattern, it's likely the right one
    if (matchCount >= 2) {
      break;
    }
  }
}

// Smart heuristic-based extraction using content scoring
function extractWithSmartHeuristics($: cheerio.CheerioAPI, data: JobData) {
  // Find job title if not already found
  if (!data.role) {
    const titleCandidates = $('h1, h2').toArray().map(el => ({
      text: $(el).text().trim(),
      score: 0
    }));
    
    // Score based on common job title patterns
    titleCandidates.forEach(candidate => {
      if (candidate.text.length > 5 && candidate.text.length < 100) candidate.score += 10;
      if (/engineer|developer|manager|analyst|designer|specialist|coordinator|director/i.test(candidate.text)) candidate.score += 20;
      if (/senior|junior|lead|staff|principal|intern/i.test(candidate.text)) candidate.score += 10;
    });
    
    titleCandidates.sort((a, b) => b.score - a.score);
    if (titleCandidates.length > 0 && titleCandidates[0].score > 0) {
      data.role = titleCandidates[0].text;
    }
  }

  // Find job description using content scoring
  if (!data.jobDescription || data.jobDescription.length < 100) {
    const contentCandidates = $('main, article, section, div[class*="content"], div[class*="description"], div[id*="description"]')
      .toArray()
      .map(el => {
        const $el = $(el);
        const clone = $el.clone();
        clone.find('script, style, nav, header, footer, aside, .sidebar, .apply, .share, .navigation').remove();
        
        const text = clone.text().trim();
        const wordCount = text.split(/\s+/).length;
        
        let score = 0;
        
        // Length scoring
        if (wordCount > 100) score += 20;
        if (wordCount > 300) score += 20;
        if (wordCount > 500) score += 10;
        
        // Job posting keywords
        if (/responsibilities|qualifications|requirements|experience|skills/i.test(text)) score += 30;
        if (/bachelor|master|degree|years of experience/i.test(text)) score += 20;
        if (/we are looking for|the ideal candidate|you will/i.test(text)) score += 15;
        
        // Penalize if too short or too long
        if (wordCount < 50) score -= 50;
        if (wordCount > 3000) score -= 20;
        
        // Penalize if contains navigation/footer content
        if (/privacy policy|terms of service|©|copyright|all rights reserved/i.test(text)) score -= 30;
        if (/apply now|share this job|back to jobs/i.test(text)) score -= 10;
        
        return { text, score, wordCount };
      });
    
    contentCandidates.sort((a, b) => b.score - a.score);
    
    if (contentCandidates.length > 0 && contentCandidates[0].score > 0) {
      data.jobDescription = contentCandidates[0].text;
    }
  }
}

// Helper functions
function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove script/style content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    // Clean whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function detectSeniority(role: string): 'intern' | 'junior' | 'mid' | 'senior' {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('intern') || roleLower.includes('internship')) {
    return 'intern';
  }
  
  if (roleLower.includes('senior') || roleLower.includes('sr.') || 
      roleLower.includes('sr ') || roleLower.includes('lead') || 
      roleLower.includes('principal') || roleLower.includes('staff')) {
    return 'senior';
  }
  
  if (roleLower.includes('mid') || roleLower.includes('intermediate') || 
      /\d+\+?\s*years?/.test(roleLower)) {
    return 'mid';
  }
  
  if (roleLower.includes('junior') || roleLower.includes('jr.') || 
      roleLower.includes('jr ') || roleLower.includes('entry')) {
    return 'junior';
  }
  
  // Default to junior if uncertain
  return 'junior';
}

function extractFromMeta($: cheerio.CheerioAPI, property: string): string {
  return $(`meta[property="${property}"], meta[name="${property}"]`).attr('content')?.trim() || '';
}
