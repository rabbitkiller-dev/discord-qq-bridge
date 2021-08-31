// import * as MarkdownIt from 'markdown-it';
// import * as markdownItAST from 'markdown-it-ast';
import { markdownEngine, rules } from 'discord-markdown';
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

// 解析khlMet
/*const ast = markdownEngine.parserFor({
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
})*/

console.log(markdownEngine.parserFor({
  atDC: {
    order: 0,
    match: source => /^@\[DC\] ([^\n#]+)#(\d\d\d\d)/.exec(source),
    parse: function(capture, parse, state) {
      console.log(capture);
      return { type: 'At', source: 'DC', username: capture[1], discriminator: capture[2] };
    },
    html: function(node, output, state) {
      return '{{atDc}}'
    }
  },
  atKHL: {
    order: 0,
    match: source => /^@\[KHL\] ([^\n#]+)#(\d\d\d\d)/.exec(source),
    parse: function(capture, parse, state) {
      console.log(capture);
      return { type: 'At', source: 'KHL', username: capture[1], discriminator: capture[2] };
    },
    html: function(node, output, state) {
      return '{{atDc}}'
    }
  },
  atQQ: {
    order: 0,
    match: source => /^@\[QQ\] ([^\n]+)(?:\()([0-9]+)\)(\#0000)?/.exec(source),
    parse: function(capture, parse, state) {
      console.log(capture);
      return { type: 'At', source: 'QQ', username: capture[1], qqNumber: capture[2] };
    },
    html: function(node, output, state) {
      return '{{atDc}}'
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
})(`asdkjasd
    @[DC] rabbitkiller#7372 asdlkajdsa @[QQ] 夏のdevil•メイエル(1250226509)
 @[KHL] rabbitkiller(兔子)#7435 斯柯达斯柯达`))
