function parseBoolean(value) {
    if (typeof value === 'boolean') return value;
  
    if (typeof value === 'string') {
      const val = value.toLowerCase().trim();
      if (val === 'true' || val === '1') return true;
      if (val === 'false' || val === '0') return false;
    }
  
    return undefined; // o null, o lanzar error si querés ser estricto
}

module.exports = {parseBoolean};