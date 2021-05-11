export function wrapText(text: string | undefined, content: string[], prepend = ''): string[] {
  // Constrain the width of the description
  if (!text) return content

  const width = 80
  let description = text
    .trimRight()
    .replace(/\r\n/g, '\n') // Convert CR to LF
    .replace(/ +/g, ' ') //    Squash consecutive spaces
    .replace(/ \n/g, '\n') //  Squash space followed by newline
  while (description) {
    // Longer than width? Find a space to break apart
    let segment: string
    if (description.length > width) {
      segment = description.substr(0, width + 1)
      while (!segment.endsWith(' ') && !segment.endsWith('\n') && segment) {
        segment = segment.substr(0, segment.length - 1)
      }

      // Trimmed too much?
      if (segment.length < width * 0.67) {
        segment = description
      }
    } else {
      segment = description
    }

    // Check for newline
    const newlineIndex = segment.indexOf('\n')
    if (newlineIndex >= 0) {
      segment = segment.substr(0, newlineIndex + 1)
    }
    content.push(`${prepend}${segment}`.trimRight())
    // Remaining
    description = description.substr(segment.length)
  }
  return content
}
