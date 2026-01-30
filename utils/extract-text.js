export function extractTextFromRecordMap(recordMap) {
    if (!recordMap || !recordMap.block) return "";

    const blocks = Object.values(recordMap.block);
    let textContent = "";

    for (const block of blocks) {
        if (block.value && block.value.properties && block.value.properties.title) {
            // properties.title is an array of [text, annotations]
            const text = block.value.properties.title.map(item => item[0]).join("");

            // Exclude code blocks from the "bag of words" if that was the intent of previous logic
            // The previous logic did: body.replace(codeBlock.innerText, '')
            // Here, we can just check block.value.type !== 'code'
            if (block.value.type !== 'code') {
                textContent += text + "\n";
            }
        }
    }

    // Apply cleaning regexes from original useReadingTime logic
    const cleanedText = textContent
        // 이미지 제거
        .replaceAll(/!\[([^\]]+?)\]\([^)]+?\)/g, '')
        // 링크는 텍스트만 남기고 제거
        .replaceAll(/\[([^\]]+?)\]\([^)]+?\)/g, '$1')
        // 코드 블록 제거 (markup style)
        .replaceAll(/```[^\n]+?\n([\s\S]+?)\n```/g, '')
        // 불렛 제거
        .replaceAll(/- ([^\n]+?)\n/g, '$1\n')
        // 특수문자 제거
        .replaceAll(/([*_`~#>])/g, '')
        // '출처 : <링크>' 형태 제거
        .replaceAll(/출처\s*:\s*https?:\/\/[^\s]+/g, '')
        // 좌우 공백 제거
        .replaceAll("<", " ")
        .trim();

    return cleanedText;
}
