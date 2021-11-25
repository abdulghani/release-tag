function getVersionDetail(version: string) {
  const match = version.match(
    /^(?:v)?([0-9]+)\.([0-9]+)\.([0-9]+)(?:-(.+)\.([0-9]+))?$/i
  );
  if (!match) {
    throw new Error(`version string (${version}) is invalid.`);
  }
  const [major, minor, patch, stage, iteration] = [
    Number(match![1]!),
    Number(match![2]!),
    Number(match![3]!),
    match![4]?.replace(/-/gi, "/"),
    Number(match![5]! ?? 0),
  ];

  return {
    major,
    minor,
    patch,
    stage,
    iteration,
  };
}

export default getVersionDetail;
