const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const natural = require('natural');

class ResumeParser {
  constructor() {
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    
    // Common skills and technologies
    this.skillsDatabase = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
      'TypeScript', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash',
      
      // Web Technologies
      'HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django',
      'Flask', 'Spring', 'Laravel', 'Rails', 'ASP.NET', 'jQuery', 'Bootstrap',
      'Sass', 'Less', 'Webpack', 'Gulp', 'Grunt',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Oracle', 'SQL Server', 'Redis',
      'Elasticsearch', 'Cassandra', 'DynamoDB', 'Firebase',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD',
      'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant', 'Git', 'SVN',
      
      // Data Science & ML
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn',
      'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter', 'Apache Spark',
      
      // Mobile Development
      'iOS', 'Android', 'React Native', 'Flutter', 'Xamarin', 'Ionic',
      
      // Other Technologies
      'REST API', 'GraphQL', 'Microservices', 'SOAP', 'JSON', 'XML', 'YAML',
      'Apache', 'Nginx', 'Linux', 'Windows', 'macOS', 'Agile', 'Scrum', 'Kanban'
    ];
    
    // Education keywords
    this.educationKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'degree', 'university', 'college',
      'institute', 'school', 'education', 'graduated', 'gpa', 'cgpa', 'honors',
      'magna cum laude', 'summa cum laude', 'cum laude', 'diploma', 'certificate'
    ];
    
    // Experience keywords
    this.experienceKeywords = [
      'experience', 'work', 'employment', 'job', 'position', 'role', 'worked',
      'developed', 'managed', 'led', 'created', 'designed', 'implemented',
      'maintained', 'optimized', 'improved', 'achieved', 'responsible',
      'years', 'months', 'intern', 'internship', 'freelance', 'consultant'
    ];
  }

  // Parse PDF resume
  async parseResume(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text;

      const parsedData = {
        rawText: text,
        skills: this.extractSkills(text),
        experience: this.extractExperience(text),
        education: this.extractEducation(text),
        summary: this.extractSummary(text),
        contact: this.extractContact(text),
        projects: this.extractProjects(text)
      };

      return parsedData;
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error('Failed to parse resume');
    }
  }

  // Extract skills from resume text
  extractSkills(text) {
    const foundSkills = new Set();
    const lowerText = text.toLowerCase();
    
    // Direct skill matching
    this.skillsDatabase.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (lowerText.includes(skillLower)) {
        foundSkills.add(skill);
      }
    });

    // Pattern-based skill extraction
    const skillPatterns = [
      /(?:skills?|technologies?|tools?|languages?)[:\s]*([^\n\r]*)/gi,
      /(?:proficient|experienced|familiar)\s+(?:in|with)[:\s]*([^\n\r]*)/gi,
      /(?:knowledge|experience)\s+(?:of|in|with)[:\s]*([^\n\r]*)/gi
    ];

    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const skillLine = match.split(':')[1] || match;
          const skills = skillLine.split(/[,;|•\n\r]/)
            .map(skill => skill.trim())
            .filter(skill => skill.length > 1 && skill.length < 30);
          
          skills.forEach(skill => {
            if (this.isValidSkill(skill)) {
              foundSkills.add(this.normalizeSkill(skill));
            }
          });
        });
      }
    });

    return Array.from(foundSkills).slice(0, 20); // Limit to top 20 skills
  }

  // Extract work experience
  extractExperience(text) {
    const experiences = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Look for experience sections
    const experienceSection = this.findSection(text, [
      'experience', 'work experience', 'employment', 'professional experience',
      'work history', 'career'
    ]);

    if (experienceSection) {
      const expLines = experienceSection.split('\n').filter(line => line.trim());
      let currentExp = null;

      expLines.forEach(line => {
        // Check if line contains company and role pattern
        const roleCompanyMatch = line.match(/^(.+?)\s*[-–—|@]\s*(.+?)(?:\s*\|\s*(.+?))?$/);
        const dateMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|current)/i);
        
        if (roleCompanyMatch && !dateMatch) {
          if (currentExp) {
            experiences.push(currentExp);
          }
          currentExp = {
            role: roleCompanyMatch[1].trim(),
            company: roleCompanyMatch[2].trim(),
            description: []
          };
        } else if (dateMatch && currentExp) {
          currentExp.duration = line.trim();
        } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          if (currentExp) {
            currentExp.description.push(line.substring(1).trim());
          }
        } else if (currentExp && line.length > 20) {
          currentExp.description.push(line);
        }
      });

      if (currentExp) {
        experiences.push(currentExp);
      }
    }

    return experiences.slice(0, 5); // Limit to 5 experiences
  }

  // Extract education information
  extractEducation(text) {
    const education = [];
    const educationSection = this.findSection(text, [
      'education', 'academic', 'qualification', 'degree', 'university', 'college'
    ]);

    if (educationSection) {
      const lines = educationSection.split('\n').filter(line => line.trim());
      let currentEdu = null;

      lines.forEach(line => {
        const degreeMatch = line.match(/(bachelor|master|phd|doctorate|diploma|certificate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|b\.?tech|m\.?tech)/i);
        const yearMatch = line.match(/(\d{4})/);
        const gpaMatch = line.match(/gpa[:\s]*(\d+\.?\d*)/i);

        if (degreeMatch) {
          if (currentEdu) {
            education.push(currentEdu);
          }
          currentEdu = {
            degree: line.trim(),
            year: yearMatch ? yearMatch[1] : null,
            gpa: gpaMatch ? gpaMatch[1] : null
          };
        } else if (currentEdu && line.length > 5) {
          if (!currentEdu.institution && !yearMatch) {
            currentEdu.institution = line.trim();
          }
        }
      });

      if (currentEdu) {
        education.push(currentEdu);
      }
    }

    return education;
  }

  // Extract summary/objective
  extractSummary(text) {
    const summaryKeywords = [
      'summary', 'objective', 'profile', 'about', 'overview', 'introduction'
    ];
    
    const summarySection = this.findSection(text, summaryKeywords);
    if (summarySection) {
      const lines = summarySection.split('\n')
        .filter(line => line.trim())
        .slice(0, 5); // First 5 lines
      
      return lines.join(' ').substring(0, 500); // Limit to 500 characters
    }

    // Fallback: extract first paragraph if no summary section
    const paragraphs = text.split('\n\n');
    const firstParagraph = paragraphs.find(p => p.length > 100 && p.length < 500);
    return firstParagraph ? firstParagraph.trim() : '';
  }

  // Extract contact information
  extractContact(text) {
    const contact = {};
    
    // Email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      contact.email = emailMatch[1];
    }

    // Phone
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) {
      contact.phone = phoneMatch[0];
    }

    // LinkedIn
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9-]+)/i);
    if (linkedinMatch) {
      contact.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
    }

    // GitHub
    const githubMatch = text.match(/(?:github\.com\/)([a-zA-Z0-9-]+)/i);
    if (githubMatch) {
      contact.github = `https://github.com/${githubMatch[1]}`;
    }

    return contact;
  }

  // Extract projects
  extractProjects(text) {
    const projects = [];
    const projectSection = this.findSection(text, [
      'projects', 'personal projects', 'side projects', 'portfolio'
    ]);

    if (projectSection) {
      const lines = projectSection.split('\n').filter(line => line.trim());
      let currentProject = null;

      lines.forEach(line => {
        if (line.match(/^[A-Z][a-zA-Z\s]+:/) || line.match(/^•\s*[A-Z]/)) {
          if (currentProject) {
            projects.push(currentProject);
          }
          currentProject = {
            name: line.replace(/^•\s*/, '').split(':')[0].trim(),
            description: line.split(':')[1] ? line.split(':')[1].trim() : ''
          };
        } else if (currentProject && line.length > 10) {
          currentProject.description += ' ' + line.trim();
        }
      });

      if (currentProject) {
        projects.push(currentProject);
      }
    }

    return projects.slice(0, 5);
  }

  // Find a specific section in the resume
  findSection(text, keywords) {
    const lines = text.split('\n');
    let sectionStart = -1;
    let sectionEnd = -1;

    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (keywords.some(keyword => line.includes(keyword) && line.length < 50)) {
        sectionStart = i;
        break;
      }
    }

    if (sectionStart === -1) return null;

    // Find section end (next major section or end of document)
    const majorSections = [
      'experience', 'education', 'skills', 'projects', 'certifications',
      'awards', 'publications', 'references', 'interests', 'hobbies'
    ];

    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (majorSections.some(section => line.includes(section) && line.length < 50)) {
        sectionEnd = i;
        break;
      }
    }

    if (sectionEnd === -1) sectionEnd = lines.length;

    return lines.slice(sectionStart + 1, sectionEnd).join('\n');
  }

  // Check if extracted text is a valid skill
  isValidSkill(skill) {
    const cleaned = skill.trim().toLowerCase();
    return cleaned.length > 1 && 
           cleaned.length < 30 && 
           !cleaned.match(/^\d+$/) && // Not just numbers
           !cleaned.match(/^[^a-zA-Z]*$/) && // Contains letters
           !this.experienceKeywords.includes(cleaned) &&
           !this.educationKeywords.includes(cleaned);
  }

  // Normalize skill name
  normalizeSkill(skill) {
    const skillMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'reactjs': 'React',
      'nodejs': 'Node.js',
      'vuejs': 'Vue.js',
      'angularjs': 'Angular',
      'html5': 'HTML',
      'css3': 'CSS'
    };

    const normalized = skill.trim();
    return skillMap[normalized.toLowerCase()] || normalized;
  }

  // Calculate match score between resume and job description
  calculateMatchScore(resumeData, jobDescription) {
    if (!resumeData || !jobDescription) return 0;

    const jobSkills = this.extractSkills(jobDescription);
    const resumeSkills = resumeData.skills || [];
    
    // Calculate skill match percentage
    const matchingSkills = resumeSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase() === skill.toLowerCase()
      )
    );

    const skillScore = jobSkills.length > 0 ? 
      (matchingSkills.length / jobSkills.length) * 100 : 0;

    // Calculate text similarity using TF-IDF
    const resumeText = resumeData.rawText || '';
    const textSimilarity = this.calculateTextSimilarity(resumeText, jobDescription);

    // Weighted score: 70% skills, 30% text similarity
    const finalScore = (skillScore * 0.7) + (textSimilarity * 0.3);

    return Math.round(finalScore);
  }

  // Calculate text similarity using basic TF-IDF
  calculateTextSimilarity(text1, text2) {
    const tokens1 = this.tokenizer.tokenize(text1.toLowerCase()) || [];
    const tokens2 = this.tokenizer.tokenize(text2.toLowerCase()) || [];

    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    const filteredTokens1 = tokens1.filter(token => !stopWords.has(token));
    const filteredTokens2 = tokens2.filter(token => !stopWords.has(token));

    // Calculate Jaccard similarity
    const set1 = new Set(filteredTokens1);
    const set2 = new Set(filteredTokens2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  // Generate resume improvement suggestions
  generateSuggestions(resumeData, jobDescription) {
    const suggestions = [];
    const jobSkills = this.extractSkills(jobDescription);
    const resumeSkills = resumeData.skills || [];

    // Missing skills
    const missingSkills = jobSkills.filter(skill => 
      !resumeSkills.some(rSkill => 
        rSkill.toLowerCase() === skill.toLowerCase()
      )
    );

    if (missingSkills.length > 0) {
      suggestions.push({
        type: 'skills',
        message: `Consider adding these relevant skills: ${missingSkills.slice(0, 5).join(', ')}`,
        priority: 'high'
      });
    }

    // Check for summary
    if (!resumeData.summary || resumeData.summary.length < 50) {
      suggestions.push({
        type: 'summary',
        message: 'Add a professional summary to highlight your key qualifications',
        priority: 'medium'
      });
    }

    // Check for contact information
    if (!resumeData.contact.email) {
      suggestions.push({
        type: 'contact',
        message: 'Ensure your email address is clearly visible',
        priority: 'high'
      });
    }

    // Check experience descriptions
    const hasDetailedExperience = resumeData.experience.some(exp => 
      exp.description && exp.description.length > 0
    );

    if (!hasDetailedExperience) {
      suggestions.push({
        type: 'experience',
        message: 'Add detailed descriptions of your work experience with quantifiable achievements',
        priority: 'high'
      });
    }

    return suggestions;
  }
}

module.exports = ResumeParser;