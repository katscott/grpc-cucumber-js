import { query } from 'jsonpath';

const evaluatePath = (path: string, content: any) => {
  const evalResult = query(content, path);
  return evalResult.length > 0 ? evalResult[0] : null;
};

export default evaluatePath;
