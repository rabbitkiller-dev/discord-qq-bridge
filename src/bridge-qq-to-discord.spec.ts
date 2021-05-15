import bridgeDiscordToQQ, {handlerAt, parseEmoji} from './bridge-discord-to-qq';

describe('bridge-bridge-to-qq.spec.ts', () => {
  beforeAll(async ()=>{
  });
  it('parseEmoji', async () => {
  });
  it('handlerAt', async () => {
  });
  it('handlerAtDiscordUser', async () => {
    const matchs = `[Discord] @カノープス・カリーナ#8351
    @rabbitkiller#1234 @没有RE0看【#1234
      `.match(/@([^\n#]+)#(\d\d\d\d)/g);
    expect(matchs[0]).toBe('@カノープス・カリーナ#8351')
    expect(matchs[1]).toBe('@rabbitkiller#1234')
    expect(matchs[2]).toBe('@没有RE0看【#1234')
    const m1 = '@カノープス・カリーナ#8351'.match(/@([^\n#]+)#(\d\d\d\d)/);
    expect(m1[1]).toBe('カノープス・カリーナ')
    expect(m1[2]).toBe('8351')
  });
});
