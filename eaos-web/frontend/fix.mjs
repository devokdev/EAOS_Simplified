import fs from 'fs';
const files = [
    'src/app/components/AboutUs.tsx',
    'src/app/components/AuthDownloadModal.tsx',
    'src/app/components/DownloadButton.tsx',
    'src/app/components/FeatureCards.tsx',
    'src/app/components/ui/aspect-ratio.tsx',
    'src/app/components/ui/collapsible.tsx',
    'src/app/components/ui/skeleton.tsx',
    'src/app/components/ui/sonner.tsx'
];
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes("import React ")) {
        content = "import React from 'react';\n" + content;
    }
    if (f.includes('FeatureCards.tsx') && !content.includes('key?: string;')) {
        content = content.replace('interface BuildCardProps {', 'interface BuildCardProps {\n  key?: string;');
    }
    fs.writeFileSync(f, content);
});
console.log("Fixed files");
