const svgElements = [
    'svg',
    'circle',
    'rect',
    'line',
    'polyline',
    'polygon',
    'path',
    'ellipse',
    'text',
    'tspan',
    'textPath',
    'image',
    'defs',
    'clipPath',
    'mask',
    'pattern',
    'filter',
    'g',
    'use',
    'symbol',
    'marker',
    'style',
    'title',
    'desc',
    'switch',
    'foreignObject',
    'metadata'
  ];

export function loadHighlight(monaco: any)
{
    monaco.languages.register({ id: 'svg', extensions: ['.svg'], aliases: ['SVG', 'svg'], mimetypes: ['image/svg+xml'] });

    monaco.languages.setLanguageConfiguration('svg', {
        comments: {
            lineComment: '<!--',
            blockComment: ['<!--', '-->']
        },
        brackets: [
            ['<', '>'],
            ['<!--', '-->']
        ],
        autoClosingPairs: [
            { open: '<', close: '>' },
            { open: '<!--', close: '-->' }
        ]
    });

    monaco.languages.setMonarchTokensProvider('svg', {
        tokenizer: {
            root: [
                // Define rules for tags
                { regex: /<\s*([a-zA-Z0-9:_-]+)\b/, token: 'tag.open' },
                { regex: /<\/\s*([a-zA-Z0-9:_-]+)\s*>/, token: 'tag.close' },
    
                // Define rules for attributes
                { regex: /([a-zA-Z0-9:_-]+)(=)/, token: ['attribute.name', 'delimiter'] },
    
                // Define rules for attribute values
                { regex: /"[^"]*"/, token: 'attribute.value' },
    
                // Define rules for comments
                { regex: /<!--/, token: 'comment.start' },
                { regex: /-->/, token: 'comment.end' },
                { regex: /<!--[^>]*>/, token: 'comment.content' },
    
                // Define rules for other text content
                { regex: /[^<]+/, token: 'text' }
            ]
        }
    });
}