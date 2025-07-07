/**
 * Reserved Usernames Node.js Library
 * A comprehensive library for handling reserved usernames to prevent URL collisions
 * Based on: https://github.com/shouldbee/reserved-usernames
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const EventEmitter = require('events');

class ReservedUsernames extends EventEmitter {
    constructor(options = {}) {
        super();
        this.reservedList = new Set();
        this.caseSensitive = options.caseSensitive || false;
        this.customReserved = options.customReserved || [];
        this.autoUpdate = options.autoUpdate || false;
        this.cacheFile = options.cacheFile || path.join(__dirname, 'reserved-usernames-cache.json');
        
        // GitHub raw file URLs
        this.sources = {
            json: 'https://raw.githubusercontent.com/shouldbee/reserved-usernames/master/reserved-usernames.json',
            txt: 'https://raw.githubusercontent.com/shouldbee/reserved-usernames/master/reserved-usernames.txt',
            csv: 'https://raw.githubusercontent.com/shouldbee/reserved-usernames/master/reserved-usernames.csv'
        };
        
        this.init();
    }

    /**
     * Initialize the library
     */
    async init() {
        try {
            // Try to load from cache first
            await this.loadFromCache();
            
            // If auto-update is enabled, fetch latest data
            if (this.autoUpdate) {
                await this.fetchLatestData();
            }
            
            // Add custom reserved usernames
            this.addCustomReserved();
            
            this.emit('ready');
        } catch (error) {
            this.emit('error', error);
        }
    }

    /**
     * Load reserved usernames from local cache
     */
    async loadFromCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const data = fs.readFileSync(this.cacheFile, 'utf8');
                const cached = JSON.parse(data);
                
                // Check if cache is less than 24 hours old
                const cacheAge = Date.now() - cached.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (cacheAge < maxAge) {
                    this.reservedList = new Set(cached.usernames);
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load from cache:', error.message);
        }
        
        // If cache loading fails, use fallback data
        await this.loadFallbackData();
        return false;
    }

    /**
     * Load fallback data (embedded list)
     */
    async loadFallbackData() {
        // This is a subset of the reserved usernames for fallback
        const fallbackUsernames = [
            'admin', 'administrator', 'root', 'api', 'www', 'mail', 'email',
            'support', 'help', 'info', 'contact', 'about', 'blog', 'news',
            'forum', 'shop', 'store', 'account', 'login', 'register', 'signup',
            'signin', 'logout', 'profile', 'user', 'users', 'member', 'members',
            'guest', 'public', 'private', 'secure', 'config', 'settings',
            'dashboard', 'panel', 'ftp', 'ssh', 'ssl', 'http', 'https',
            'subdomain', 'domain', 'host', 'server', 'database', 'db',
            'test', 'testing', 'dev', 'development', 'staging', 'production',
            'backup', 'cache', 'tmp', 'temp', 'log', 'logs', 'error', 'errors'
        ];
        
        this.reservedList = new Set(fallbackUsernames);
    }

    /**
     * Fetch latest data from GitHub
     */
    async fetchLatestData() {
        try {
            const usernames = await this.fetchFromUrl(this.sources.json);
            const parsedData = JSON.parse(usernames);
            
            this.reservedList = new Set(parsedData);
            
            // Cache the data
            await this.saveToCache(parsedData);
            
            this.emit('updated', parsedData.length);
        } catch (error) {
            console.warn('Failed to fetch latest data:', error.message);
            this.emit('fetchError', error);
        }
    }

    /**
     * Fetch data from URL
     */
    fetchFromUrl(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Save data to cache
     */
    async saveToCache(usernames) {
        try {
            const cacheData = {
                usernames: Array.from(usernames),
                timestamp: Date.now()
            };
            
            fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.warn('Failed to save cache:', error.message);
        }
    }

    /**
     * Add custom reserved usernames
     */
    addCustomReserved() {
        this.customReserved.forEach(username => {
            const normalizedUsername = this.caseSensitive ? username : username.toLowerCase();
            this.reservedList.add(normalizedUsername);
        });
    }

    /**
     * Check if a username is reserved
     */
    isReserved(username) {
        if (!username || typeof username !== 'string') {
            return false;
        }
        
        const checkUsername = this.caseSensitive ? username : username.toLowerCase();
        return this.reservedList.has(checkUsername);
    }

    /**
     * Check multiple usernames
     */
    checkMultiple(usernames) {
        if (!Array.isArray(usernames)) {
            throw new Error('Input must be an array');
        }
        
        return usernames.map(username => ({
            username,
            isReserved: this.isReserved(username)
        }));
    }

    /**
     * Get all reserved usernames
     */
    getAll() {
        return Array.from(this.reservedList);
    }

    /**
     * Get reserved usernames by pattern
     */
    getByPattern(pattern) {
        const regex = new RegExp(pattern, this.caseSensitive ? 'g' : 'gi');
        return this.getAll().filter(username => regex.test(username));
    }

    /**
     * Get reserved usernames starting with prefix
     */
    getByPrefix(prefix) {
        const searchPrefix = this.caseSensitive ? prefix : prefix.toLowerCase();
        return this.getAll().filter(username => username.startsWith(searchPrefix));
    }

    /**
     * Get reserved usernames ending with suffix
     */
    getBySuffix(suffix) {
        const searchSuffix = this.caseSensitive ? suffix : suffix.toLowerCase();
        return this.getAll().filter(username => username.endsWith(searchSuffix));
    }

    /**
     * Get statistics
     */
    getStats() {
        const all = this.getAll();
        return {
            total: all.length,
            shortest: Math.min(...all.map(u => u.length)),
            longest: Math.max(...all.map(u => u.length)),
            average: Math.round(all.reduce((sum, u) => sum + u.length, 0) / all.length),
            byLength: this.groupByLength(all)
        };
    }

    /**
     * Group usernames by length
     */
    groupByLength(usernames) {
        const grouped = {};
        usernames.forEach(username => {
            const len = username.length;
            if (!grouped[len]) {
                grouped[len] = [];
            }
            grouped[len].push(username);
        });
        return grouped;
    }

    /**
     * Suggest alternative usernames
     */
    suggestAlternatives(username, count = 5) {
        if (!this.isReserved(username)) {
            return [username]; // Not reserved, return as is
        }
        
        const suggestions = [];
        const base = username.toLowerCase();
        
        // Add numbers
        for (let i = 1; i <= count; i++) {
            const suggestion = base + i;
            if (!this.isReserved(suggestion)) {
                suggestions.push(suggestion);
            }
        }
        
        // Add common suffixes
        const suffixes = ['user', 'profile', 'account', 'real', 'official', 'app'];
        for (const suffix of suffixes) {
            if (suggestions.length >= count) break;
            const suggestion = base + suffix;
            if (!this.isReserved(suggestion)) {
                suggestions.push(suggestion);
            }
        }
        
        // Add prefixes
        const prefixes = ['my', 'the', 'real', 'official', 'user'];
        for (const prefix of prefixes) {
            if (suggestions.length >= count) break;
            const suggestion = prefix + base;
            if (!this.isReserved(suggestion)) {
                suggestions.push(suggestion);
            }
        }
        
        return suggestions.slice(0, count);
    }

    /**
     * Validate username with custom rules
     */
    validateUsername(username, rules = {}) {
        const validation = {
            username,
            isValid: true,
            errors: []
        };
        
        // Check if reserved
        if (this.isReserved(username)) {
            validation.isValid = false;
            validation.errors.push('Username is reserved');
        }
        
        // Check length
        if (rules.minLength && username.length < rules.minLength) {
            validation.isValid = false;
            validation.errors.push(`Username must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && username.length > rules.maxLength) {
            validation.isValid = false;
            validation.errors.push(`Username must be at most ${rules.maxLength} characters`);
        }
        
        // Check allowed characters
        if (rules.allowedChars) {
            const regex = new RegExp(`^[${rules.allowedChars}]+$`);
            if (!regex.test(username)) {
                validation.isValid = false;
                validation.errors.push('Username contains invalid characters');
            }
        }
        
        // Check forbidden patterns
        if (rules.forbiddenPatterns) {
            for (const pattern of rules.forbiddenPatterns) {
                if (new RegExp(pattern, 'i').test(username)) {
                    validation.isValid = false;
                    validation.errors.push(`Username matches forbidden pattern: ${pattern}`);
                }
            }
        }
        
        return validation;
    }

    /**
     * Export data in different formats
     */
    export(format = 'json') {
        const data = this.getAll();
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
            
            case 'csv':
                return 'username\n' + data.join('\n');
            
            case 'txt':
                return data.join('\n');
            
            case 'array':
                return data;
            
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Import custom reserved usernames
     */
    import(data, format = 'array') {
        let usernames = [];
        
        switch (format.toLowerCase()) {
            case 'json':
                usernames = JSON.parse(data);
                break;
            
            case 'csv':
                usernames = data.split('\n')
                    .slice(1) // Skip header
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                break;
            
            case 'txt':
                usernames = data.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                break;
            
            case 'array':
                usernames = data;
                break;
            
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        
        // Add to reserved list
        usernames.forEach(username => {
            const normalizedUsername = this.caseSensitive ? username : username.toLowerCase();
            this.reservedList.add(normalizedUsername);
        });
        
        return usernames.length;
    }

    /**
     * Clear cache
     */
    clearCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                fs.unlinkSync(this.cacheFile);
                return true;
            }
        } catch (error) {
            console.warn('Failed to clear cache:', error.message);
        }
        return false;
    }

    /**
     * Force update from remote
     */
    async forceUpdate() {
        await this.fetchLatestData();
    }
}

// Usage Examples
async function examples() {
    console.log('=== Reserved Usernames Library Examples ===\n');
    
    // Initialize with options
    const reservedUsernames = new ReservedUsernames({
        caseSensitive: false,
        customReserved: ['myapp', 'mycompany', 'reserved123'],
        autoUpdate: true
    });
    
    // Wait for initialization
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Basic usage
    console.log('1. Basic Usage:');
    console.log('Is "admin" reserved?', reservedUsernames.isReserved('admin'));
    console.log('Is "john" reserved?', reservedUsernames.isReserved('john'));
    console.log('Is "myapp" reserved?', reservedUsernames.isReserved('myapp'));
    console.log();
    
    // Check multiple usernames
    console.log('2. Check Multiple Usernames:');
    const checkList = ['admin', 'user', 'john', 'api', 'contact'];
    const results = reservedUsernames.checkMultiple(checkList);
    results.forEach(result => {
        console.log(`${result.username}: ${result.isReserved ? 'RESERVED' : 'Available'}`);
    });
    console.log();
    
    // Get statistics
    console.log('3. Statistics:');
    const stats = reservedUsernames.getStats();
    console.log('Total reserved usernames:', stats.total);
    console.log('Shortest username length:', stats.shortest);
    console.log('Longest username length:', stats.longest);
    console.log('Average username length:', stats.average);
    console.log();
    
    // Search by pattern
    console.log('4. Search by Pattern:');
    const adminPattern = reservedUsernames.getByPattern('admin');
    console.log('Usernames containing "admin":', adminPattern.slice(0, 5));
    console.log();
    
    // Get by prefix/suffix
    console.log('5. Get by Prefix/Suffix:');
    const mailPrefix = reservedUsernames.getByPrefix('mail');
    console.log('Usernames starting with "mail":', mailPrefix);
    
    const adminSuffix = reservedUsernames.getBySuffix('admin');
    console.log('Usernames ending with "admin":', adminSuffix);
    console.log();
    
    // Suggest alternatives
    console.log('6. Suggest Alternatives:');
    const alternatives = reservedUsernames.suggestAlternatives('admin', 3);
    console.log('Alternatives for "admin":', alternatives);
    console.log();
    
    // Username validation
    console.log('7. Username Validation:');
    const validationRules = {
        minLength: 3,
        maxLength: 20,
        allowedChars: 'a-zA-Z0-9_',
        forbiddenPatterns: ['test', 'demo']
    };
    
    const testUsernames = ['admin', 'jo', 'validuser123', 'test_user', 'demo'];
    testUsernames.forEach(username => {
        const validation = reservedUsernames.validateUsername(username, validationRules);
        console.log(`${username}: ${validation.isValid ? 'VALID' : 'INVALID'}`);
        if (!validation.isValid) {
            console.log('  Errors:', validation.errors.join(', '));
        }
    });
    console.log();
    
    // Export data
    console.log('8. Export Data:');
    const jsonExport = reservedUsernames.export('json');
    console.log('JSON export length:', jsonExport.length);
    
    const csvExport = reservedUsernames.export('csv');
    console.log('CSV export lines:', csvExport.split('\n').length);
    console.log();
}

// Utility functions
class ReservedUsernamesUtils {
    /**
     * Create a middleware for Express.js
     */
    static createExpressMiddleware(reservedUsernames, options = {}) {
        const errorMessage = options.errorMessage || 'Username is reserved';
        const usernameField = options.usernameField || 'username';
        
        return (req, res, next) => {
            const username = req.body[usernameField] || req.params[usernameField];
            
            if (username && reservedUsernames.isReserved(username)) {
                return res.status(400).json({
                    error: errorMessage,
                    suggestions: reservedUsernames.suggestAlternatives(username)
                });
            }
            
            next();
        };
    }
    
    /**
     * Create a validation schema for Joi
     */
    static createJoiValidator(reservedUsernames) {
        const Joi = require('joi');
        
        return Joi.string().custom((value, helpers) => {
            if (reservedUsernames.isReserved(value)) {
                return helpers.error('username.reserved');
            }
            return value;
        }).messages({
            'username.reserved': 'Username is reserved'
        });
    }
    
    /**
     * Create a bulk checker for large datasets
     */
    static async checkBulk(reservedUsernames, usernames, batchSize = 1000) {
        const results = [];
        
        for (let i = 0; i < usernames.length; i += batchSize) {
            const batch = usernames.slice(i, i + batchSize);
            const batchResults = reservedUsernames.checkMultiple(batch);
            results.push(...batchResults);
            
            // Add small delay to prevent blocking
            if (i + batchSize < usernames.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        return results;
    }
}

// Export the main class and utilities
module.exports = {
    ReservedUsernames,
    ReservedUsernamesUtils,
    examples
};

// Run examples if this file is executed directly
if (require.main === module) {
    examples().catch(console.error);
}
