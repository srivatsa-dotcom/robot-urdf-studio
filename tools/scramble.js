// Builds the published site: dist/index.html is index.html with every inline script obfuscated
// (template text included) and the HTML/CSS minified. Run by Vercel as `npm run build`.
const fs = require('fs');
const JO = require('javascript-obfuscator');
const { minify } = require('html-minifier-terser');
const babel = require('@babel/core');
(async () => {
  const src = fs.readFileSync(process.argv[2], 'utf8');
  let i = 0;
  const html = src.replace(/<script>([\s\S]*?)<\/script>/g, (m, code) => {
    i++;
    // template literals → plain string concatenation, so their text is encoded too
    code = babel.transformSync(code, { babelrc: false, configFile: false, compact: false, plugins: [['@babel/plugin-transform-template-literals', { loose: true }]] }).code;
    const out = JO.obfuscate(code, {
      compact: true, controlFlowFlattening: false, deadCodeInjection: false, debugProtection: false,
      identifierNamesGenerator: 'hexadecimal', renameGlobals: false, selfDefending: false,
      stringArray: true, stringArrayEncoding: ['base64'], stringArrayThreshold: 1, stringArrayRotate: true, stringArrayShuffle: true,
      splitStrings: false, transformObjectKeys: false, unicodeEscapeSequence: false, target: 'browser',
    }).getObfuscatedCode();
    return '<script>' + out.replace(/<\/script/gi, '<\\/script') + '</script>';
  });
  const min = await minify(html, { collapseWhitespace: true, conservativeCollapse: true, removeComments: true, minifyCSS: true, minifyJS: false, keepClosingSlash: true });
  fs.mkdirSync(require('path').dirname(process.argv[3]), { recursive: true });
  fs.writeFileSync(process.argv[3], min);
  console.log('scripts obfuscated:', i, ' size', (src.length / 1024).toFixed(0) + 'KB ->', (min.length / 1024).toFixed(0) + 'KB');
})();
