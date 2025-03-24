function recursiveParse(obj) {
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return obj;
    }
  }

  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = recursiveParse(obj[key]);
      }
    }
  }

  

  return obj;
}

function recursiveParserMiddleware(reqBody) {
  return recursiveParse(reqBody);
}

module.exports = recursiveParserMiddleware;
