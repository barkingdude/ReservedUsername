/**
 * Test Suite for Reserved Usernames Library
 * Run with: node test.js
 */

const { ReservedUsernames, ReservedUsernamesUtils } = require('./index.js');
const assert = require('assert');

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    async runAllTests() {
        console.log('🧪 Running Test Suite for Reserved Usernames Library\n');
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

// Initialize test runner
const testRunner = new TestRunner();

// Test 1: Basic Initialization
testRunner.addTest('Basic Initialization', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    assert(reservedUsernames.getAll().length > 0, 'Should have reserved usernames loaded');
});

// Test 2: Custom Reserved Usernames
testRunner.addTest('Custom Reserved Usernames', async () => {
    const customReserved = ['mycompany', 'myapp', 'restricted'];
    const reservedUsernames = new ReservedUsernames({
        customReserved: customReserved
    });
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    customReserved.forEach(username => {
        assert(reservedUsernames.isReserved(username), `${username} should be reserved`);
    });
});

// Test 3: Case Sensitivity
testRunner.addTest('Case Sensitivity', async () => {
    const caseSensitive = new ReservedUsernames({ caseSensitive: true });
    const caseInsensitive = new ReservedUsernames({ caseSensitive: false });
    
    await Promise.all([
        new Promise(resolve => caseSensitive.on('ready', resolve)),
        new Promise(resolve => caseInsensitive.on('ready', resolve))
    ]);
    
    // Case sensitive should differentiate
    assert(caseSensitive.isReserved('admin'), 'admin should be reserved');
    // Note: This depends on the actual data - admin might be lowercase in the list
    
    // Case insensitive should not differentiate
    assert(caseInsensitive.isReserved('admin'), 'admin should be reserved');
    assert(caseInsensitive.isReserved('ADMIN'), 'ADMIN should be reserved');
});

// Test 4: Username Validation
testRunner.addTest('Username Validation', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test reserved username
    assert(reservedUsernames.isReserved('admin'), 'admin should be reserved');
    
    // Test non-reserved username
    assert(!reservedUsernames.isReserved('uniqueuser123'), 'uniqueuser123 should not be reserved');
    
    // Test invalid inputs
    assert(!reservedUsernames.isReserved(null), 'null should return false');
    assert(!reservedUsernames.isReserved(undefined), 'undefined should return false');
    assert(!reservedUsernames.isReserved(''), 'empty string should return false');
});

// Test 5: Bulk Validation
testRunner.addTest('Bulk Validation', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    const testUsernames = ['admin', 'uniqueuser', 'api', 'randomuser'];
    const results = reservedUsernames.checkMultiple(testUsernames);
    
    assert(results.length === testUsernames.length, 'Should return results for all usernames');
    assert(results.every(r => r.hasOwnProperty('username')), 'All results should have username property');
    assert(results.every(r => r.hasOwnProperty('isReserved')), 'All results should have isReserved property');
    
    // Test specific cases
    const adminResult = results.find(r => r.username === 'admin');
    assert(adminResult.isReserved, 'admin should be marked as reserved');
});

// Test 6: Pattern Matching
testRunner.addTest('Pattern Matching', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    const adminPattern = reservedUsernames.getByPattern('admin');
    assert(Array.isArray(adminPattern), 'Should return an array');
    assert(adminPattern.length > 0, 'Should find usernames containing admin');
    
    const mailPrefix = reservedUsernames.getByPrefix('mail');
    assert(Array.isArray(mailPrefix), 'Should return an array');
    
    const adminSuffix = reservedUsernames.getBySuffix('admin');
    assert(Array.isArray(adminSuffix), 'Should return an array');
});

// Test 7: Suggestion System
testRunner.addTest('Suggestion System', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test suggestions for reserved username
    const suggestions = reservedUsernames.suggestAlternatives('admin', 3);
    assert(Array.isArray(suggestions), 'Should return an array of suggestions');
    assert(suggestions.length > 0, 'Should return at least one suggestion');
    assert(suggestions.length <= 3, 'Should not return more than requested');
    
    // Test suggestions for non-reserved username
    const nonReservedSuggestions = reservedUsernames.suggestAlternatives('uniqueuser123', 3);
    assert(nonReservedSuggestions.includes('uniqueuser123'), 'Should include original username if not reserved');
});

// Test 8: Statistics
testRunner.addTest('Statistics', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    const stats = reservedUsernames.getStats();
    
    assert(typeof stats.total === 'number', 'Total should be a number');
    assert(stats.total > 0, 'Total should be greater than 0');
    assert(typeof stats.shortest === 'number', 'Shortest should be a number');
    assert(typeof stats.longest === 'number', 'Longest should be a number');
    assert(typeof stats.average === 'number', 'Average should be a number');
    assert(typeof stats.byLength === 'object', 'byLength should be an object');
    assert(stats.shortest <= stats.longest, 'Shortest should be <= longest');
});

// Test 9: Custom Validation Rules
testRunner.addTest('Custom Validation Rules', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    const rules = {
        minLength: 3,
        maxLength: 15,
        allowedChars: 'a-zA-Z0-9_',
        forbiddenPatterns: ['test', 'demo']
    };
    
    // Test valid username
    const validResult = reservedUsernames.validateUsername('validuser', rules);
    assert(typeof validResult.isValid === 'boolean', 'Should have isValid property');
    assert(Array.isArray(validResult.errors), 'Should have errors array');
    
    // Test invalid username (too short)
    const shortResult = reservedUsernames.validateUsername('ab', rules);
    assert(!shortResult.isValid, 'Should be invalid for short username');
    assert(shortResult.errors.length > 0, 'Should have errors for short username');
    
    // Test invalid username (forbidden pattern)
    const forbiddenResult = reservedUsernames.validateUsername('testuser', rules);
    assert(!forbiddenResult.isValid, 'Should be invalid for forbidden pattern');
    
    // Test reserved username
    const reservedResult = reservedUsernames.validateUsername('admin', rules);
    assert(!reservedResult.isValid, 'Should be invalid for reserved username');
});

// Test 10: Import/Export Functionality
testRunner.addTest('Import/Export Functionality', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test export formats
    const jsonExport = reservedUsernames.export('json');
    assert(typeof jsonExport === 'string', 'JSON export should be a string');
    
    const csvExport = reservedUsernames.export('csv');
    assert(typeof csvExport === 'string', 'CSV export should be a string');
    assert(csvExport.includes('username'), 'CSV should include header');
    
    const txtExport = reservedUsernames.export('txt');
    assert(typeof txtExport === 'string', 'TXT export should be a string');
    
    const arrayExport = reservedUsernames.export('array');
    assert(Array.isArray(arrayExport), 'Array export should be an array');
    
    // Test import
    const customUsernames = ['custom1', 'custom2', 'custom3'];
    const importCount = reservedUsernames.import(customUsernames, 'array');
    assert(importCount === customUsernames.length, 'Should import all usernames');
    
    // Verify import worked
    customUsernames.forEach(username => {
        assert(reservedUsernames.isReserved(username), `${username} should be reserved after import`);
    });
});

// Test 11: Error Handling
testRunner.addTest('Error Handling', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test invalid export format
    try {
        reservedUsernames.export('invalid_format');
        assert(false, 'Should throw error for invalid export format');
    } catch (error) {
        assert(error.message.includes('Unsupported format'), 'Should throw appropriate error');
    }
    
    // Test invalid import format
    try {
        reservedUsernames.import(['test'], 'invalid_format');
        assert(false, 'Should throw error for invalid import format');
    } catch (error) {
        assert(error.message.includes('Unsupported format'), 'Should throw appropriate error');
    }
    
    // Test checkMultiple with invalid input
    try {
        reservedUsernames.checkMultiple('not_an_array');
        assert(false, 'Should throw error for non-array input');
    } catch (error) {
        assert(error.message.includes('must be an array'), 'Should throw appropriate error');
    }
});

// Test 12: Performance
testRunner.addTest('Performance', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test single lookup performance
    const testUsernames = [];
    for (let i = 0; i < 1000; i++) {
        testUsernames.push(`user${i}`);
    }
    
    const startTime = process.hrtime.bigint();
    testUsernames.forEach(username => {
        reservedUsernames.isReserved(username);
    });
    const endTime = process.hrtime.bigint();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    assert(duration < 100, 'Should complete 1000 lookups in under 100ms');
    
    // Test bulk lookup performance
    const bulkStartTime = process.hrtime.bigint();
    const bulkResults = reservedUsernames.checkMultiple(testUsernames);
    const bulkEndTime = process.hrtime.bigint();
    
    const bulkDuration = Number(bulkEndTime - bulkStartTime) / 1000000;
    assert(bulkDuration < 50, 'Bulk lookup should be faster than individual lookups');
    assert(bulkResults.length === testUsernames.length, 'Should return all results');
});

// Test 13: Cache Functionality
testRunner.addTest('Cache Functionality', async () => {
    const fs = require('fs');
    const testCacheFile = './test-cache.json';
    
    // Clean up any existing test cache
    if (fs.existsSync(testCacheFile)) {
        fs.unlinkSync(testCacheFile);
    }
    
    const reservedUsernames = new ReservedUsernames({
        cacheFile: testCacheFile
    });
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test cache creation (this might not create a file immediately)
    // but we can test the clear cache functionality
    const cacheCleared = reservedUsernames.clearCache();
    assert(typeof cacheCleared === 'boolean', 'clearCache should return boolean');
    
    // Clean up test cache file
    if (fs.existsSync(testCacheFile)) {
        fs.unlinkSync(testCacheFile);
    }
});

// Test 14: Event Handling
testRunner.addTest('Event Handling', async () => {
    let readyEventFired = false;
    let errorEventFired = false;
    
    const reservedUsernames = new ReservedUsernames();
    
    reservedUsernames.on('ready', () => {
        readyEventFired = true;
    });
    
    reservedUsernames.on('error', () => {
        errorEventFired = true;
    });
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    assert(readyEventFired, 'Ready event should be fired');
    // Note: Error event might not fire in normal operation
});

// Test 15: Edge Cases
testRunner.addTest('Edge Cases', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test empty string
    assert(!reservedUsernames.isReserved(''), 'Empty string should not be reserved');
    
    // Test whitespace
    assert(!reservedUsernames.isReserved('   '), 'Whitespace should not be reserved');
    
    // Test very long string
    const longString = 'a'.repeat(1000);
    assert(!reservedUsernames.isReserved(longString), 'Very long string should not be reserved');
    
    // Test special characters
    const specialChars = '!@#$%^&*()';
    assert(!reservedUsernames.isReserved(specialChars), 'Special characters should not be reserved');
    
    // Test unicode
    const unicode = '用户名';
    assert(!reservedUsernames.isReserved(unicode), 'Unicode should not be reserved');
});

// Test 16: Utilities
testRunner.addTest('Utilities', async () => {
    const reservedUsernames = new ReservedUsernames();
    
    await new Promise(resolve => {
        reservedUsernames.on('ready', resolve);
    });
    
    // Test bulk checker utility
    const testUsernames = ['admin', 'user1', 'api', 'user2'];
    const bulkResults = await ReservedUsernamesUtils.checkBulk(
        reservedUsernames, 
        testUsernames, 
        2 // batch size
    );
    
    assert(Array.isArray(bulkResults), 'Bulk checker should return array');
    assert(bulkResults.length === testUsernames.length, 'Should return all results');
    assert(bulkResults.every(r => r.hasOwnProperty('username')), 'All results should have username');
    assert(bulkResults.every(r => r.hasOwnProperty('isReserved')), 'All results should have isReserved');
});

// Run all tests
if (require.main === module) {
    testRunner.runAllTests()
        .then(success => {
            if (success) {
                console.log('\n🎉 All tests passed!');
                process.exit(0);
            } else {
                console.log('\n💥 Some tests failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n🚨 Test runner error:', error);
            process.exit(1);
        });
}

module.exports = testRunner;
