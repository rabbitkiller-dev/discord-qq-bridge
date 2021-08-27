import * as MarkdownIt from 'markdown-it';
import * as markdownItAST from 'markdown-it-ast';
import { htmlOutput, parser, rulesDiscordOnly, markdownEngine } from 'discord-markdown';
// const md = new MarkdownIt();
// const tokens = md.parse(`@evenyone`, {});
// const ast = markdownItAST.makeAST(tokens);
// console.log(ast);
// rulesDiscordOnly['KhlMet'] = {
//   // order: markdownEngine.defaultRules.strong.order,
//   match: source => /\(met\)all\(met\)/.exec(source),
//   parse: function() {
//     return { };
//   },
//   html: function(node, output, state) {
//     return '@everyone'
//     // return htmlTag('span', state.discordCallback.everyone(node), { class: 'd-mention d-user' }, state);
//   }
// }
const ast = markdownEngine.parserFor({
  KhlMet: {
    order: 0,
    match: source => /^\(met\)all\(met\)/.exec(source),
    parse: function() {
      return { };
    },
    html: function(node, output, state) {
      return '@everyone'
      // return htmlTag('span', state.discordCallback.everyone(node), { class: 'd-mention d-user' }, state);
    }
  },
  text: Object.assign({ }, markdownEngine.defaultRules.text, {
    match: source => /^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff-]|\n\n|\n|\w+:\S|$)/.exec(source),
    html: function(node, output, state) {
      if (state.escapeHTML)
        return markdownEngine.sanitizeText(node.content);

      return node.content;
    }
  })
})(
  `
  asdalksdj (met)all(met)\t @everyone 
  \`\`\` function()={} \`\`\`
  `
)
ast.forEach((value)=>{
  console.log(value);
  console.log(htmlOutput(value));
})
