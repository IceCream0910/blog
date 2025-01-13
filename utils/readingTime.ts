export const calculateReadingTime = (text: string) => {
    let cntWord = text?.split(" ").length || 0;
    const readWPM = 200;
    let readMinute = Math.trunc(cntWord / readWPM);
    let readSecond = Math.round((cntWord / readWPM - readMinute) * 60 / 10) * 10;
    if (readSecond === 60) { readSecond = 0; readMinute += 1; };
    return readMinute;
}