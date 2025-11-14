"use strict";
/**
 * Test script for content moderation system
 * Run with: npx ts-node test-content-moderation.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const contentModeration_1 = require("./utils/contentModeration");
// Test cases
const testCases = [
    // Test 1: Should detect offensive word
    {
        name: 'Detect offensive word',
        content: 'This is a test with the word fuck in it',
        shouldFail: true,
        expectedWords: ['fuck']
    },
    // Test 2: Should pass safe content
    {
        name: 'Pass safe content',
        content: 'This is a completely safe post about video games',
        shouldFail: false,
        expectedWords: []
    },
    // Test 3: Word boundary test - "class" should NOT match "ass"
    {
        name: 'Word boundary - class should not match ass',
        content: 'I love my programming class',
        shouldFail: false,
        expectedWords: []
    },
    // Test 4: Word boundary test - "ass" should match when standalone
    {
        name: 'Word boundary - ass should match when standalone',
        content: 'That is an ass thing to say',
        shouldFail: true,
        expectedWords: ['ass']
    },
    // Test 5: Case insensitivity test
    {
        name: 'Case insensitivity - FUCK should be detected',
        content: 'This post contains FUCK in uppercase',
        shouldFail: true,
        expectedWords: ['fuck']
    },
    // Test 6: Phrase detection
    {
        name: 'Phrase detection - multi-word phrases',
        content: 'Make America Great Again is a slogan',
        shouldFail: true,
        expectedWords: ['Make America Great Again']
    },
    // Test 7: Multiple offensive words
    {
        name: 'Multiple offensive words',
        content: 'This post has both fuck and shit in it',
        shouldFail: true,
        expectedWords: ['fuck', 'shit']
    },
    // Test 8: Name detection (both "Donald Trump" and "Trump" are in the list, so both should be detected)
    {
        name: 'Name detection - Donald Trump',
        content: 'I think Donald Trump is mentioned here',
        shouldFail: true,
        expectedWords: ['Donald Trump', 'Trump'] // Both are in the list, so both should match
    },
    // Test 9: Edge case - empty string
    {
        name: 'Empty string should pass',
        content: '',
        shouldFail: false,
        expectedWords: []
    },
    // Test 10: Edge case - only whitespace
    {
        name: 'Whitespace only should pass',
        content: '   \n\t  ',
        shouldFail: false,
        expectedWords: []
    },
    // Test 11: Word in middle of other text
    {
        name: 'Offensive word in middle of sentence',
        content: 'I really think that this is a good post about gaming',
        shouldFail: false,
        expectedWords: []
    },
    // Test 12: Partial word should not match
    {
        name: 'Partial word - "grass" should not match "ass"',
        content: 'The grass is green',
        shouldFail: false,
        expectedWords: []
    },
    // Test 13: Word at start of sentence
    {
        name: 'Offensive word at start',
        content: 'Fuck this is a test',
        shouldFail: true,
        expectedWords: ['fuck']
    },
    // Test 14: Word at end of sentence
    {
        name: 'Offensive word at end',
        content: 'This is a test fuck',
        shouldFail: true,
        expectedWords: ['fuck']
    },
    // Test 15: Word with punctuation
    {
        name: 'Offensive word with punctuation',
        content: 'This is fuck!',
        shouldFail: true,
        expectedWords: ['fuck']
    },
    // Test 16: Organization name
    {
        name: 'Organization name - Fox News',
        content: 'I watch Fox News sometimes',
        shouldFail: true,
        expectedWords: ['Fox News']
    }
];
// Run tests
async function runTests() {
    console.log('🧪 Starting Content Moderation Tests\n');
    console.log('='.repeat(60));
    let passed = 0;
    let failed = 0;
    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n[Test ${i + 1}/${testCases.length}] ${test.name}`);
        console.log(`Content: "${test.content.substring(0, 50)}${test.content.length > 50 ? '...' : ''}"`);
        try {
            const result = await (0, contentModeration_1.checkContentModeration)(test.content);
            // Check if result matches expectation
            const isSafeMatches = result.isSafe === !test.shouldFail;
            const wordsMatch = test.expectedWords.length === result.detectedWords.length &&
                test.expectedWords.every(word => result.detectedWords.includes(word));
            if (isSafeMatches && wordsMatch) {
                console.log('✅ PASSED');
                if (result.detectedWords.length > 0) {
                    console.log(`   Detected words: ${result.detectedWords.join(', ')}`);
                }
                passed++;
            }
            else {
                console.log('❌ FAILED');
                console.log(`   Expected: isSafe=${!test.shouldFail}, words=[${test.expectedWords.join(', ')}]`);
                console.log(`   Got:      isSafe=${result.isSafe}, words=[${result.detectedWords.join(', ')}]`);
                failed++;
            }
        }
        catch (error) {
            console.log('❌ FAILED - Error occurred');
            console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
            failed++;
        }
    }
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Total:  ${testCases.length}`);
    console.log(`   📊 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);
    if (failed === 0) {
        console.log('🎉 All tests passed! The content moderation system is working correctly.\n');
        process.exit(0);
    }
    else {
        console.log('⚠️  Some tests failed. Please review the results above.\n');
        process.exit(1);
    }
}
// Run the tests
runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
