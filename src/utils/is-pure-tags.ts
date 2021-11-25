function isPureTag(tag: string) {
  return !!tag.match(/^(?:v)?([0-9]+)\.([0-9]+)\.([0-9]+)$/i);
}

export default isPureTag;
