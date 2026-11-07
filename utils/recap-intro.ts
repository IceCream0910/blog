const INTRO_COUNT = 14;

// Titles arrive newest first. Assign oldest first so new posts preserve existing choices.
export function recapIntroUrls(titles: readonly string[]): string[] {
  const urls = new Array<string>(titles.length);
  let remaining: number[] = [];
  let previous: number | undefined;

  for (let index = titles.length - 1; index >= 0; index--) {
    if (!remaining.length) {
      remaining = Array.from({ length: INTRO_COUNT }, (_, track) => track + 1);
    }
    let hash = 5381;
    for (const character of titles[index]) hash = (hash * 33) ^ character.charCodeAt(0);

    // Also avoid repeating the last track when a new cycle starts.
    const candidates = remaining.filter((track) => track !== previous);
    const track = candidates[(hash >>> 0) % candidates.length];
    urls[index] = `/recap-intro/recap_intro${track}.mp3`;
    remaining.splice(remaining.indexOf(track), 1);
    previous = track;
  }
  return urls;
}
