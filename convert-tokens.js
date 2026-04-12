const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'design-tokens.tokens.json');
const outputFile = path.join(__dirname, 'design-tokens.css');

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveValue(value, propertyName) {
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const pathParts = value.slice(1, -1).split('.');
    return `var(--sys-${pathParts.map(toKebabCase).join('-')})`;
  }
  
  if (typeof value === 'number') {
    const unitlessProperties = ['fontWeight', 'font-weight', 'paragraphIndent', 'paragraph-indent', 'paragraphSpacing', 'paragraph-spacing', 'textCase', 'text-case'];
    if (unitlessProperties.includes(propertyName) || unitlessProperties.includes(toKebabCase(propertyName))) {
        return value;
    }
    return `${value}px`;
  }

  return value;
}

function processTokens(obj, currentPath = [], allTokens = {}) {
  let cssVariables = [];

  for (const key in obj) {
    const value = obj[key];
    const newPath = [...currentPath, key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // If it has a 'value' property and a 'type', it's a token
      if ('value' in value && ('type' in value || typeof value.value !== 'object')) {
        const varName = `--sys-${newPath.map(toKebabCase).join('-')}`;
        
        // Handle nested values (like in typography)
        if (typeof value.value === 'object') {
            for (const subKey in value.value) {
                const subVarName = `${varName}-${toKebabCase(subKey)}`;
                const resolved = resolveValue(value.value[subKey], subKey);
                cssVariables.push(`${subVarName}: ${resolved};`);
            }
        } else {
            const resolved = resolveValue(value.value, newPath[newPath.length - 1]);
            cssVariables.push(`${varName}: ${resolved};`);
        }
      } else {
        // Recursively process
        cssVariables = cssVariables.concat(processTokens(value, newPath, allTokens));
      }
    } else if (typeof value === 'object' && value !== null) {
        // Handle cases where sub-keys might be property names (like in 'typography' section)
        // Actually, the recursion above handles it if we don't find a 'value' property.
    }
  }

  return cssVariables;
}

try {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const variables = processTokens(data);

  const cssContent = `:root {\n  ${variables.join('\n  ')}\n}\n`;

  fs.writeFileSync(outputFile, cssContent);
  console.log(`Successfully converted tokens to ${outputFile}`);
} catch (error) {
  console.error('Error processing tokens:', error);
  process.exit(1);
}
