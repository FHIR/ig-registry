const fs = require('fs');
const path = require('path');

// Constants for validation rules
const MAX_LENGTHS = {
  authority: 40,
  category: 30
};

const VALID_COUNTRIES = [
  'uv', 'eu', 'us', 'at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'dk', 'pl',
  'fi', 'fr', 'gb', 'in', 'it', 'jp', 'kr', 'nl', 'no', 'nz', 'se', 'tw', 'es'
];

const VALID_PRODUCTS = ['fhir', 'cda', 'v2'];

class ValidationError extends Error {
  constructor(message, file = null, guide = null) {
    super(message);
    this.file = file;
    this.guide = guide;
  }
}

class Validator {
  constructor() {
    this.errors = [];
  }

  addError(message, file = null, guide = null) {
    this.errors.push(new ValidationError(message, file, guide));
  }

  // Validate that a file contains valid JSON
  validateJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);
      console.log(`✓ ${filePath} is valid JSON`);
      return JSON.parse(content);
    } catch (error) {
      this.addError(`Invalid JSON in ${filePath}: ${error.message}`, filePath);
      return null;
    }
  }

  // Check for duplicate values in an array
  findDuplicates(array, fieldName) {
    const seen = new Set();
    const duplicates = [];
    
    for (const item of array) {
      if (seen.has(item)) {
        duplicates.push(item);
      } else {
        seen.add(item);
      }
    }
    
    return duplicates;
  }

  // Validate string field length
  validateLength(value, maxLength, fieldName, guideName) {
    if (typeof value === 'string' && value.length > maxLength) {
      this.addError(
        `${fieldName} exceeds maximum length of ${maxLength} characters: "${value}" (${value.length} chars)`,
        'fhir-ig-list.json',
        guideName
      );
    }
  }

  // Check for placeholder values
  validateNotPlaceholder(value, fieldName, guideName, fileName = 'fhir-ig-list.json') {
    if (value === '??') {
      this.addError(
        `${fieldName} cannot be '??' - please provide a valid value`,
        fileName,
        guideName
      );
    }
  }

  // Recursively check for '??' in any object/array
  validateNoPlaceholders(obj, path = '', guideName = null, fileName = 'fhir-ig-list.json') {
    if (obj === '??') {
      this.addError(
        `Property at ${path || 'root'} cannot be '??' - please provide a valid value`,
        fileName,
        guideName
      );
      return;
    }

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          this.validateNoPlaceholders(item, `${path}[${index}]`, guideName, fileName);
        });
      } else {
        Object.keys(obj).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          this.validateNoPlaceholders(obj[key], newPath, guideName, fileName);
        });
      }
    }
  }

  // Validate that URLs don't end with /
  validateUrlFormat(url, fieldName, guideName) {
    if (typeof url === 'string' && url.endsWith('/')) {
      this.addError(
        `${fieldName} must not end with '/': ${url}`,
        'fhir-ig-list.json',
        guideName
      );
    }
  }

  // Validate fhir-ig-list.json
  validateFhirIgList(data) {
    if (!data || !data.guides || !Array.isArray(data.guides)) {
      this.addError('fhir-ig-list.json must contain a "guides" array', 'fhir-ig-list.json');
      return;
    }

    // Check for '??' placeholders in the entire structure
    this.validateNoPlaceholders(data, '', null, 'fhir-ig-list.json');

    const npmNames = [];
    
    data.guides.forEach((guide, index) => {
      const guideName = guide.name || `Guide #${index + 1}`;

      // Check required fields
      const requiredFields = ['npm-name', 'name', 'category', 'description', 'authority', 'country'];
      requiredFields.forEach(field => {
        if (!guide[field]) {
          this.addError(`Missing required field: ${field}`, 'fhir-ig-list.json', guideName);
        } else {
          // Check for placeholder values in required fields
          this.validateNotPlaceholder(guide[field], field, guideName);
        }
      });

      // Validate field lengths
      this.validateLength(guide.authority, MAX_LENGTHS.authority, 'authority', guideName);
      this.validateLength(guide.category, MAX_LENGTHS.category, 'category', guideName);
      this.validateLength(guide.name, MAX_LENGTHS.name, 'name', guideName);

      // Collect npm-names for uniqueness check
      if (guide['npm-name']) {
        npmNames.push(guide['npm-name']);
      }

      // Validate country
      if (guide.country && !VALID_COUNTRIES.includes(guide.country)) {
        this.addError(
          `Invalid country code: ${guide.country}. Must be one of: ${VALID_COUNTRIES.join(', ')}`,
          'fhir-ig-list.json',
          guideName
        );
      }

      // Validate products
      if (guide.product && Array.isArray(guide.product)) {
        const duplicateProducts = this.findDuplicates(guide.product, 'product');
        if (duplicateProducts.length > 0) {
          this.addError(
            `Duplicate products found: ${duplicateProducts.join(', ')}`,
            'fhir-ig-list.json',
            guideName
          );
        }

        guide.product.forEach(product => {
          if (!VALID_PRODUCTS.includes(product.toLowerCase())) {
            this.addError(
              `Invalid product: ${product}. Must be one of: ${VALID_PRODUCTS.join(', ')}`,
              'fhir-ig-list.json',
              guideName
            );
          }
        });
      }

      // Validate language array for duplicates
      if (guide.language && Array.isArray(guide.language)) {
        const duplicateLanguages = this.findDuplicates(guide.language, 'language');
        if (duplicateLanguages.length > 0) {
          this.addError(
            `Duplicate languages found: ${duplicateLanguages.join(', ')}`,
            'fhir-ig-list.json',
            guideName
          );
        }
      }

      // Validate URL formats
      ['history', 'canonical', 'ci-build'].forEach(field => {
        if (guide[field]) {
          this.validateUrlFormat(guide[field], field, guideName);
        }
      });

      // Validate editions
      if (guide.editions && Array.isArray(guide.editions)) {
        const igVersions = [];
        
        guide.editions.forEach((edition, editionIndex) => {
          // Collect ig-versions for uniqueness check
          if (edition['ig-version']) {
            igVersions.push(edition['ig-version']);
          }

          // Validate edition URL format
          if (edition.url) {
            this.validateUrlFormat(edition.url, `editions[${editionIndex}].url`, guideName);
          }
        });

        // Check for duplicate ig-versions
        const duplicateVersions = this.findDuplicates(igVersions, 'ig-version');
        if (duplicateVersions.length > 0) {
          this.addError(
            `Duplicate ig-versions found in editions: ${duplicateVersions.join(', ')}`,
            'fhir-ig-list.json',
            guideName
          );
        }
      }
    });

    // Check for duplicate npm-names
    const duplicateNpmNames = this.findDuplicates(npmNames, 'npm-name');
    if (duplicateNpmNames.length > 0) {
      this.addError(
        `Duplicate npm-names found: ${duplicateNpmNames.join(', ')}`,
        'fhir-ig-list.json'
      );
    }
  }

  // Validate package-feeds.json
  validatePackageFeeds(data) {
    if (!data || !data.feeds || !Array.isArray(data.feeds)) {
      this.addError('package-feeds.json must contain a "feeds" array', 'package-feeds.json');
      return;
    }

    // Check for '??' placeholders in the entire structure
    this.validateNoPlaceholders(data, '', null, 'package-feeds.json');

    const feedUrls = [];
    
    data.feeds.forEach((feed, index) => {
      if (feed.url) {
        feedUrls.push(feed.url);
      } else {
        this.addError(`Feed #${index + 1} is missing required "url" field`, 'package-feeds.json');
      }
    });

    // Check for duplicate feed URLs
    const duplicateUrls = this.findDuplicates(feedUrls, 'url');
    if (duplicateUrls.length > 0) {
      this.addError(
        `Duplicate feed URLs found: ${duplicateUrls.join(', ')}`,
        'package-feeds.json'
      );
    }
  }

  // Get list of changed JSON files (for CI environment)
  getChangedJsonFiles() {
    const changedFiles = process.env.CHANGED_FILES;
    if (changedFiles) {
      return changedFiles.split('\n').filter(file => file.endsWith('.json'));
    }
    
    // Fallback: validate known JSON files
    return ['fhir-ig-list.json', 'package-feeds.json'].filter(file => fs.existsSync(file));
  }

  // Main validation function
  validate() {
    console.log('Starting validation...\n');

    const changedJsonFiles = this.getChangedJsonFiles();
    
    // Validate JSON syntax for all changed JSON files
    const validatedFiles = {};
    changedJsonFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const data = this.validateJsonFile(file);
        if (data) {
          validatedFiles[file] = data;
        }
      }
    });

    // Specific validations for known files
    if (validatedFiles['fhir-ig-list.json']) {
      console.log('\nValidating fhir-ig-list.json...');
      this.validateFhirIgList(validatedFiles['fhir-ig-list.json']);
    }

    if (validatedFiles['package-feeds.json']) {
      console.log('\nValidating package-feeds.json...');
      this.validatePackageFeeds(validatedFiles['package-feeds.json']);
    }

    // Report results
    this.reportResults();
  }

  reportResults() {
    console.log('\n' + '='.repeat(50));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(50));

    if (this.errors.length === 0) {
      console.log('✅ All validations passed!');
      process.exit(0);
    } else {
      console.log(`❌ Found ${this.errors.length} validation error(s):\n`);
      
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        if (error.file) {
          console.log(`   File: ${error.file}`);
        }
        if (error.guide) {
          console.log(`   Guide: ${error.guide}`);
        }
        console.log('');
      });
      
      process.exit(1);
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new Validator();
  validator.validate();
}

module.exports = Validator;