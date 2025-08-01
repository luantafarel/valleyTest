import { OpenAI } from 'openai';
import fetch from 'node-fetch';

interface LinkedInData {
  name: string;
  title?: string;
  company?: string;
  experience?: string[];
  skills?: string[];
  location?: string;
}

class AIService {
  private getOpenAI() {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
    });
  }

  private async scrapeLinkedIn(url: string): Promise<LinkedInData> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,pt;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return this.parseLinkedInHTML(html, url);

    } catch (error) {
      const name = this.extractNameFromUrl(url);
      return {
        name,
        title: undefined,
        company: undefined,
        location: undefined,
        experience: [],
        skills: []
      };
    }
  }

  private parseLinkedInHTML(html: string, url: string): LinkedInData {
    const name = this.extractName(html) || this.extractNameFromUrl(url);
    const title = this.extractTitle(html);
    const company = this.extractCompany(html);
    const location = this.extractLocation(html);
    const experience = this.extractExperience(html);
    const skills = this.extractSkills(html);
    
    return {
      name,
      title,
      company,
      location,
      experience,
      skills
    };
  }

  private extractName(html: string): string | undefined {
    const titlePatterns = [
      /<title>([^-|]+)(?:\s*[-|]|$)/i,
      /<h1[^>]*>([^<]+)</i,
      /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
      /<meta[^>]*name="title"[^>]*content="([^"]+)"/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let name = match[1].trim();
        name = name.replace(/\s*\|\s*LinkedIn.*$/i, '');
        name = name.replace(/\s*-\s*LinkedIn.*$/i, '');
        name = name.replace(/&amp;#39;/g, "'").replace(/&amp;/g, "&");
        
        if (name.length > 2 && name.length < 100 && 
            !/^\d+$/.test(name) && 
            /[a-zA-Z]/.test(name) &&
            !name.toLowerCase().includes('invalid')) {
          return name;
        }
      }
    }
    return undefined;
  }

  private extractTitle(html: string): string | undefined {
    const metaPattern = /<meta[^>]*name="description"[^>]*content="([^"]*passionate[^"]*developer[^"]*)/i;
    const metaMatch = html.match(metaPattern);
    if (metaMatch && metaMatch[1]) {
      const decoded = metaMatch[1].replace(/&amp;#39;/g, "'").replace(/&amp;/g, "&");
      const titleMatch = decoded.match(/I['']?m a (.+?) with/i);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }
    }
    return undefined;
  }

  private extractCompany(html: string): string | undefined {
    const titlePattern = /<title>([^<]+)\s*-\s*([^|]+)\s*\|\s*LinkedIn<\/title>/i;
    const titleMatch = html.match(titlePattern);
    if (titleMatch && titleMatch[2]) {
      const company = titleMatch[2].trim();
      if (company.length > 0 && company.length < 50) {
        return company;
      }
    }
    return undefined;
  }

  private extractLocation(html: string): string | undefined {
    const metaPattern = /<meta[^>]*name="description"[^>]*content="[^"]*Location:\s*([^·]+)/i;
    const metaMatch = html.match(metaPattern);
    if (metaMatch && metaMatch[1]) {
      const location = metaMatch[1].trim();
      if (location.length > 1 && location.length < 100) {
        return location;
      }
    }
    return undefined;
  }

  private extractExperience(html: string): string[] {
    const metaPattern = /<meta[^>]*name="description"[^>]*content="[^"]*([^"]*\d+\s*years?\s*of\s*experience[^"]*)/i;
    const metaMatch = html.match(metaPattern);
    if (metaMatch && metaMatch[1]) {
      return [metaMatch[1].trim()];
    }
    return [];
  }

  private extractSkills(html: string): string[] {
    return [];
  }



  private formatLinkedInData(data: LinkedInData): string {
    const parts = [];
    parts.push(`Name: ${data.name}`);
    
    if (data.title) {
      parts.push(`Current Title: ${data.title}`);
    }
    
    if (data.company) {
      parts.push(`Company: ${data.company}`);
    }
    
    if (data.location) {
      parts.push(`Location: ${data.location}`);
    }
    
    if (data.experience && data.experience.length > 0) {
      parts.push(`Experience: ${data.experience.join(', ')}`);
    }
    
    if (data.skills && data.skills.length > 0) {
      parts.push(`Skills: ${data.skills.join(', ')}`);
    }
    
    return parts.join('\n');
  }

  private getLinkedInInsights(data: LinkedInData): string[] {
    const insights = [];
    
    if (data.title && data.company) {
      insights.push(`Works as ${data.title} at ${data.company}`);
    } else if (data.title) {
      insights.push(`Role: ${data.title}`);
    } else if (data.company) {
      insights.push(`Works at ${data.company}`);
    }
    
    if (data.location) {
      insights.push(`Based in ${data.location}`);
    }
    
    if (data.experience && data.experience.length > 0) {
      insights.push(`Experience: ${data.experience[0]}`);
    }
    
    if (data.skills && data.skills.length > 0) {
      insights.push(`Skills include: ${data.skills.slice(0, 3).join(', ')}`);
    }
    
    if (insights.length === 0) {
      insights.push('Name extracted from LinkedIn URL');
      insights.push('Limited profile data available');
    }
    
    return insights;
  }



  private async callGemini(prompt: string): Promise<string | null> {
    try {
      const API_KEY = process.env.GEMINI_API_KEY;
      if (!API_KEY) return null;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800, topP: 0.8, topK: 10 }
        })
      });

      if (!response.ok) return null;
      const result = await response.json() as any;
      return result.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
      return null;
    }
  }

  async generateSequence(prospectUrl: string, tovConfig: any, companyContext: string, sequenceLength: number): Promise<{
    messages: string[];
    thinking_process: string;
    confidence_scores: { overall: number; personalization: number; tone: number };
    prospect_analysis: { name: string; role: string; company: string; insights: string[] };
    using_mock?: boolean;
    ai_provider?: string;
  }> {
    const linkedinData = await this.scrapeLinkedIn(prospectUrl);
    
    const formality = Math.min(Math.max(tovConfig?.formality || 0.7, 0), 1);
    const warmth = Math.min(Math.max(tovConfig?.warmth || 0.6, 0), 1);
    const directness = Math.min(Math.max(tovConfig?.directness || 0.7, 0), 1);
    
    const formalityLevel = formality > 0.8 ? "very formal" : formality > 0.6 ? "professional" : "casual";
    const warmthLevel = warmth > 0.7 ? "warm and friendly" : warmth > 0.4 ? "professional" : "direct and business-focused";
    const directnessLevel = directness > 0.7 ? "very direct" : directness > 0.4 ? "moderately direct" : "subtle and indirect";

    const prospectInfo = this.formatLinkedInData(linkedinData);
    
    const prompt = `Write sales messages for ${linkedinData.name}.

AVAILABLE INFORMATION:
${prospectInfo}
LinkedIn URL: ${prospectUrl}

REQUIREMENTS:
✅ Use the verified information above
✅ Personalize based on their role and company if available
✅ Create professional, engaging messages
✅ Tone: ${formalityLevel}, ${warmthLevel}, ${directnessLevel}
❌ NO fake details beyond what's provided
❌ NO placeholders, NO brackets [ ]

Context: ${companyContext}

Write ${sequenceLength} messages that:
1. Use their real name and title/company if known
2. Reference their actual role or industry experience
3. Connect their background to the value proposition: ${companyContext}
4. Sound professional and well-researched

JSON format:
{"messages": ["personalized message 1", "personalized message 2"], "thinking_process": "explanation", "confidence_scores": {"overall": 0.85, "personalization": 0.80, "tone": 0.90}}

Be personalized and professional.`;

    const geminiResult = await this.callGemini(prompt);
    if (geminiResult) {
      return {
        messages: this.parseOrCreateMessages(geminiResult, linkedinData.name, sequenceLength),
        thinking_process: `Generated using Google Gemini AI with tone: ${formalityLevel}, ${warmthLevel}, ${directnessLevel}. Extracted: ${linkedinData.title ? `title (${linkedinData.title})` : 'no title'}, ${linkedinData.company ? `company (${linkedinData.company})` : 'no company'}, ${linkedinData.location ? `location (${linkedinData.location})` : 'no location'}.`,
        confidence_scores: { overall: 0.85, personalization: linkedinData.title && linkedinData.company ? 0.9 : 0.7, tone: formality > 0.8 ? 0.95 : 0.85 },
        prospect_analysis: { 
          name: linkedinData.name, 
          role: linkedinData.title || 'Unknown', 
          company: linkedinData.company || 'Unknown', 
          insights: this.getLinkedInInsights(linkedinData)
        },
        using_mock: false,
        ai_provider: 'Gemini'
      };
    }

    return {
      messages: [`Hi ${linkedinData.name}, I found your LinkedIn profile and would like to discuss how we help companies automate their sales processes. Interested in a brief call?`],
      thinking_process: 'AI unavailable, using simple fallback',
      confidence_scores: { overall: 0.5, personalization: 0.3, tone: 0.5 },
      prospect_analysis: {
        name: linkedinData.name,
        role: linkedinData.title || 'Unknown',
        company: linkedinData.company || 'Unknown',
        insights: this.getLinkedInInsights(linkedinData)
      },
      using_mock: true,
      ai_provider: 'Fallback'
    };
  }

  private parseOrCreateMessages(content: string, name: string, sequenceLength: number): string[] {
    try {
      let jsonContent = content;
      if (content.includes('```json')) {
        const match = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonContent = match[1];
      }
      
      const parsed = JSON.parse(jsonContent);
      if (parsed.messages && Array.isArray(parsed.messages)) {
        return parsed.messages.slice(0, sequenceLength);
      }
    } catch {}
    
    return [`Hi ${name}, interested in discussing sales automation for your team?`];
  }

  private createSimpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private extractNameFromUrl(url: string): string {
    const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
    if (!match?.[1]) return 'Professional';
    
    let slug = match[1].toLowerCase();
    
    // Remove trailing numbers (often LinkedIn IDs)
    slug = slug.replace(/-[0-9a-f]{8,}$/, '');
    
    // Split by hyphens and underscores
    const parts = slug.split(/[-_]+/).filter(part => {
      // Filter out parts that are:
      // - Too short (< 2 chars)
      // - Only numbers
      // - Common LinkedIn suffixes
      return part.length >= 2 && 
             !/^\d+$/.test(part) && 
             !['jr', 'sr', 'phd', 'mba', 'md', 'ceo', 'cto', 'cfo'].includes(part);
    });
    
    if (parts.length === 0) return 'Professional';
    
    // Take first 2 meaningful parts as first and last name
    const nameParts = parts.slice(0, 2);
    
    return nameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  isConfigured(): boolean {
    return this.isGeminiConfigured() || this.isOpenAIConfigured();
  }

  private isOpenAIConfigured(): boolean {
    const apiKey = process.env.OPENAI_API_KEY;
    return !!(apiKey && apiKey.startsWith('sk-'));
  }

  private isGeminiConfigured(): boolean {
    const apiKey = process.env.GEMINI_API_KEY;
    return !!(apiKey && apiKey.length > 10);
  }
}

export const aiService = new AIService();