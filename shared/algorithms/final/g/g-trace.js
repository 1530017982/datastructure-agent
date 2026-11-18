export function defineSource(algorithm, lines) {
  return {
    algorithm,
    sourceVersion: algorithm + '-c-v1',
    sourceLines: lines.map(([lineId, text]) => ({ lineId, text })),
  };
}

export function createTrace({ algorithm, sourceVersion, sourceLines }) {
  const steps = [];
  function record(event, lineId, description, variables, result = null) {
    steps.push({
      schemaVersion: '1.0', algorithm, sourceVersion, stepIndex: steps.length,
      event, lineId, description, variables: structuredClone(variables),
      done: event === 'done', result: structuredClone(result),
    });
  }
  return {
    record,
    finish(lineId, description, variables, result) {
      record('done', lineId, description, variables, result);
      return { steps, result, sourceVersion, sourceLines };
    },
  };
}
