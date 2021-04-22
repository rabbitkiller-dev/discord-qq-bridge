import { handlerAt, handlerAtQQUser, parseEmoji } from './bridge-discord-to-qq';

const fakeMessage: any = {msg: {mentions: {users: [{id: '23332333323333', username: '张三', discriminator: '0000'}]}}};

describe('bridge-bridge-to-qq.spec.ts', () => {
  it('parseEmoji', async () => {
    expect(await parseEmoji(`asd天大aas<:test:1231239849089234>a苛123`)).toBe(`asd天大aas[CQ:image,file=https://cdn.discordapp.com/emojis/1231239849089234.png]a苛123`);
    expect(await parseEmoji(`<:test:1231239849089234>`)).toBe('[CQ:image,file=https://cdn.discordapp.com/emojis/1231239849089234.png]');
    expect(await parseEmoji(`没有消息的时候`)).toBe('没有消息的时候')
  });
  it('handlerAt', async () => {
    expect(await handlerAt(`<@!23332333323333>`, fakeMessage)).toBe(`@张三#0000`)
  });
  it('handlerAtQQ', async () => {
    expect(await handlerAtQQUser(`@零の幻影(1244321579)`, fakeMessage)).toBe(`[CQ:at,qq=1244321579]`)
    expect(await handlerAtQQUser(`@兔子(rabbitkiller)(243249439)`, fakeMessage)).toBe(`[CQ:at,qq=243249439]`)
  });
});
