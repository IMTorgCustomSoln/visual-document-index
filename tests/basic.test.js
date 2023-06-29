import { vi, assert, expect, test } from 'vitest'
import { WordSplit, WordSplitter, parseJsonFile } from '../components/support/utils'

test('WordSplitter', async()=>{

    const filepath = './components/support/xtra/words_by_freq.json'
    const WordSplit = new WordSplitter(filepath)
    expect( WordSplit.filepath == './xtra/swords_by_freq.json')

    await WordSplit.setup()
    expect( WordSplit.wordsByFreq.length == 125549)
    
    const testText = "i had a lovely day at the park"
    const input = testText.replaceAll(" ","")
    const result = WordSplit.inferSpaces(input)
    expect( result  == testText)
})