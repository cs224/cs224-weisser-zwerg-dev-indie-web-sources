const moment = require('moment');
const { DateTime } = require("luxon");

const filters = require('./_eleventy/filters.js')
const shortcodes = require('./_eleventy/shortcodes.js')

moment.locale('en');

const pluginRss = require("@11ty/eleventy-plugin-rss");


module.exports = function(eleventyConfig) {
    eleventyConfig.addPlugin(pluginRss);

    eleventyConfig.addPassthroughCopy({ "./src/assets": "/" });

    eleventyConfig.addFilter('dateIso', date => {
        //return moment(date).toISOString();
        return moment(date).format("YYYY-MM-DD");
    });

    eleventyConfig.addFilter('dateReadable', date => {
        return moment(date).format('LL'); // E.g. May 31, 2019
    });

    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
    });

    eleventyConfig.addFilter('url_encode', parameter => {
        return encodeURI(parameter);
    });

    eleventyConfig.addFilter('urlToSlug', inputUrl => {
        const pathElements = inputUrl.trim().split('/');
        let lastElement = null;
        for(const pe of pathElements) {
            if(pe.trim() != '')
                lastElement = pe.trim();
        }
        if(lastElement.includes('.')) {
            const elements = lastElement.splice('.');
            lastElement = elements[0];
        }
        return lastElement;
    });

    // Filters
    Object.keys(filters).forEach(filterName => {
        console.log(filterName);
        eleventyConfig.addFilter(filterName, filters[filterName])
    })

    eleventyConfig.addShortcode('excerpt', article => extractExcerpt(article));

    // Shortcodes
    Object.keys(shortcodes).forEach(shortCodeName => {
        eleventyConfig.addShortcode(shortCodeName, shortcodes[shortCodeName])
    })


    let markdownIt = require("markdown-it");
    let markdownItEmoji = require("markdown-it-emoji");
    let markdownItFootnote = require('markdown-it-footnote');
    let markdownItAnchor = require('markdown-it-anchor');
    let options = {
        html: true,
        breaks: false,
        linkify: true
    };

    const link_icon = '<svg class="octicon octicon-link" style="vertical-align: middle;" role="img" aria-hidden="true" width="16" height="16"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/icons.svg#octicon-link"></use></svg>'

    let markdownLib = markdownIt(options).use(markdownItEmoji).use(markdownItFootnote).use(markdownItAnchor, {permalink: true, permalinkSymbol: link_icon, permalinkBefore: true});

    eleventyConfig.setLibrary("md", markdownLib);

    return {
        passthroughFileCopy: true,
        markdownTemplateEngine: "njk",
        templateFormats: ["html", "njk", "md"],
        dir: {
            input: "src",
            output: "dist",
            includes: "includes",
            data: "data"
        }
    };
};

function extractExcerpt(article) {
    if (!article.hasOwnProperty('templateContent')) {
        console.warn('Failed to extract excerpt: Document has no property "templateContent".');
        return null;
    }

    let excerpt = null;
    const content = article.templateContent;

    // The start and end separators to try and match to extract the excerpt
    const separatorsList = [
        { start: '<!-- Excerpt Start -->', end: '<!-- Excerpt End -->' },
        { start: '<p>', end: '</p>' }
    ];

    separatorsList.some(separators => {
        const startPosition = content.indexOf(separators.start);
        const endPosition = content.lastIndexOf(separators.end);

        if (startPosition !== -1 && endPosition !== -1) {
            excerpt = content.substring(startPosition + separators.start.length, endPosition).trim();
            return true; // Exit out of array loop on first match
        }
    });

    return excerpt;
};

const anchoredHeaderRenderFn = (slug, opts, state, idx) => {
    const space = () => Object.assign(new state.Token('text', '', 0), { content: ' ' })

    const linkTokens = [
        Object.assign(new state.Token('link_open', 'a', 1), {
            attrs: [
                ['class', opts.permalinkClass],
                ['href', opts.permalinkHref(slug, state)],
                ['aria-hidden', 'true']
            ]
        }),
        Object.assign(new state.Token('html_block', '', 0), { content: opts.permalinkSymbol }),
        new state.Token('link_close', 'a', -1)
    ]

    // `push` or `unshift` according to position option.
    // Space is at the opposite side.
    if (opts.permalinkSpace) {
        linkTokens[position[!opts.permalinkBefore]](space())
    }
    state.tokens[idx + 1].children[position[opts.permalinkBefore]](...linkTokens)
}
