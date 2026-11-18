/*
 * 宵灯りのほこら — story: prologue, events, dialogue of every NPC, puzzles, ending, credits, help.
 * Scripts are async functions that receive the event API E (engine.js).
 */
(function () {
  'use strict';
  const HR = window.HR, G = window.G;

  HR.SPEAKERS = {
    koharu: ['コハル', 'face-koharu'], koharu2: ['コハル', 'face-koharu-2'],
    genta: ['ゲンタ', 'face-genta'], genta2: ['ゲンタ', 'face-genta-2'],
    suzu: ['スズ', 'face-suzu'], suzu2: ['スズ', 'face-suzu-2'],
    yone: ['ヨネ', null],
  };

  const ST = (HR.STORY = { talk: {}, trigger: {}, enter: {} });
  const T = ST.talk;

  /* ---------------- prologue & opening ---------------- */
  ST.prologue = async (E) => {
    E.R.lightOut = false;
    await E.wait(400);
    await E.narr('山あいの小さな里、灯ノ里（ひのさと）。');
    await E.narr('里の奥山には古い祠があり、\n『宵灯（よいあかり）』という灯がともっている。');
    await E.narr('宵灯は千年のあいだ、人の里と、\n妖（あやかし）の住む山との境を、やさしく照らしてきた。');
    E.sfx('vanish');
    E.R.lightOut = true;
    await E.wait(900);
    await E.narr('――その灯が、ある晩、ふっと消えた。');
    await E.wait(300);
  };
  ST.opening = async (E) => {
    E.music('home');
    await E.wait(500);
    await E.say('yone', 'コハル、起きたかい。……ゆうべ、山の宵灯が消えたよ。');
    await E.say('koharu2', 'えっ……おばあちゃんが毎晩見守ってた、あの灯が？');
    await E.say('yone', '灯が消えると、妖たちは心が濁って、だんだん荒っぽくなる。今朝はもう、里の畑にまで下りてきたそうだ。');
    await E.say('yone', '本当なら祠守のあたしが行くところだけど、この腰じゃあねえ……。');
    await E.say('yone', '宵灯をともし直すには、二つのものがいる。');
    await E.say('yone', 'ひとつは、祠の鈴に宿る付喪神の「スズ」。灯が消えた晩に、宵ノ森のほうへ逃げていったらしい。');
    await E.say('yone', 'もうひとつは「火種石」。鳴き岩の洞の奥に、代々納めてある石だよ。');
    await E.say('koharu', 'わかった。わたしが行ってくる！ 祠守の見習いだもん。');
    await E.say('yone', '頼もしいねえ。それじゃあ、これをお持ち。');
    E.give('dango', 3); E.gold(50); E.sfx('chest');
    await E.msg('よもぎ団子を 3 つと、50 文を受け取った！');
    await E.say('yone', '里のあちこちにある灯籠に手を合わせると、旅の記録が残せる。体の疲れもとれるよ。');
    await E.say('yone', '道具屋や鍛冶屋で支度をととのえたら、南の野原を抜けて宵ノ森へ。……気をつけてお行き。');
    E.set('intro');
    E.goal('宵ノ森でスズを探す');
    E.autosave();
  };

  /* ---------------- village ---------------- */
  T.yone = async (E) => {
    if (E.flag('cave')) { await E.say('yone', '火種石……たしかにこれだ。あとは奥ノ祠だけだね。洞の奥の石段を上れば着くよ。'); await E.say('yone', '無理はおしでないよ。灯籠で記録をとるのを忘れずにね。'); return; }
    if (E.has('suzu')) {
      if (!E.flag('metYone')) {
        E.set('metYone');
        await E.say('suzu2', 'ヨネ！ ……ごめんね。わたし、こわくて逃げちゃって……。');
        await E.say('yone', 'いいんだよ、スズ。無事でよかった。');
        await E.say('yone', 'さあ、次は鳴き岩の洞だ。野原の東、峠の茶屋の先にしめ縄が張ってある。スズの鈴の音でほどけるはずだよ。');
        return;
      }
      await E.say('yone', '鳴き岩の洞は、野原の東の峠の先だよ。中は暗いから足元に気をつけてね。'); return;
    }
    if (E.has('genta')) { await E.say('yone', 'おや、ゲンタも一緒かい。心強いねえ。'); await E.say('genta', 'まかせてくれよ、ばあちゃん！'); return; }
    await E.say('yone', '宵ノ森は里の南、川を渡った先だよ。草むらには妖が出るから、無理はおしでないよ。');
  };
  T.child = async (E) => {
    if (E.has('genta') && !E.flag('childJoke')) {
      E.set('childJoke');
      await E.say('子ども', 'ゲンタ兄ちゃん、森で妖に囲まれて泣きそうになってたって、本当？');
      await E.say('genta2', '……泣いてねえ。ちょっと汗が目に入っただけだ。');
      return;
    }
    await E.say('子ども', 'ねえねえ、草むらで、しっぽに提灯をぶらさげたネズミを見たよ！ あれ、熱くないのかなあ。');
  };
  T.oldman = async (E) => {
    await E.say('長老', 'わしの若いころはのう、妖にもちゃんと名前で呼びかけたもんじゃ。');
    await E.say('長老', '名前を呼ばれると、たいていの妖は落ち着くもんでな。……まあ、聞こえとればの話じゃが。');
  };
  T.hint = async (E) => {
    await E.say('里の男', '草むらを歩くと妖が出てくるぞ。道の上なら、少しは出にくいんだ。');
    await E.say('里の男', 'HP が減ったら、コハルちゃんの「灯し火」で治すといい。メニューの「わざ」から使えるよ。');
  };
  T.cat = async (E) => {
    const lines = ['にゃあ。', '（猫はあくびをした）', '（猫はこっちをじっと見ている……）', 'にゃ。（どこかで見たような顔だ）'];
    await E.say('猫', lines[Math.floor(Math.random() * lines.length)]);
  };
  T.farmer = async (E) => {
    await E.say('お百姓', 'うちのかかしが一体、ゆうべ勝手に歩いていっちまった。');
    await E.say('お百姓', '見かけたら連れ戻して……いや、やっぱりいい。こわいから。');
  };
  T.woman = async (E) => {
    if (E.has('genta')) { await E.say('里の女', 'あら、ゲンタも一緒かい。コハルちゃんの足を引っぱるんじゃないよ。'); await E.say('genta', 'ひでえな、おばさん。'); return; }
    await E.say('里の女', 'ゲンタなら、朝から森の入り口で木を切ってるよ。あの子、力だけは里いちばんだからねえ。');
  };
  T.jizo = async (E) => {
    await E.msg('お地蔵さまが並んでいる。小さな赤い前かけが、風にゆれている。');
    await E.msg('コハルは手を合わせた。……なんだか、見守られている気がする。');
  };
  T.signVillage = async (E) => {
    await E.msg('立て札だ。\n「南：灯ノ野・宵ノ森　東の峠：鳴き岩の洞」');
    await E.msg('「草むらに妖あり。夜道は灯を持って歩くべし」');
  };
  T.shopWeapon = async (E) => {
    await E.say('ゴロウ', E.flag('cave') ? 'おう、洞から帰ったか！ とっておきの大物を並べといたぜ。' : E.flag('forest') ? '森から帰ったって？ いい鋼が入ったぜ。見ていきな。' : 'おう、コハル！ 金床屋のゴロウだ。いい得物がそろってるぜ。');
    await E.shop('weapon');
    await E.say('ゴロウ', 'また来いよ！ 刃こぼれしたら、いつでも見てやる。');
  };
  T.shopArmor = async (E) => {
    await E.say('おタエ', E.flag('forest') ? '新しい反物で、丈夫な上着を仕立てたのよ。旅の装いなら、糸車におまかせ。' : 'いらっしゃい。旅の装いなら、仕立て屋「糸車」におまかせ。');
    await E.shop('armor');
    await E.say('おタエ', 'お気をつけて。服が破れたら、また来てね。');
  };
  T.shopItem = async (E) => {
    await E.say('マメキチ', 'へい、よろず屋の豆吉でございます！ 団子から札まで、なんでもござれ。');
    await E.shop('item');
    await E.say('マメキチ', 'まいどあり！ 煙玉は、あぶないときの心強い味方ですぜ。');
  };
  T.inn = async (E) => {
    await E.say('おかみ', 'ようこそ、月見屋へ。ひと晩 10 文で、ぐっすり休めますよ。');
    await E.inn();
  };
  T.innGuest = async (E) => {
    await E.say('旅の人', '峠に茶屋があってな。そこの団子がまた、うまいんだ。');
    await E.say('旅の人', 'それと、どうしても勝てない妖がいたら、草むらで少し腕をみがくといい。急がば回れ、ってやつだ。');
  };
  T.innKid = async (E) => {
    await E.say('宿の子', 'おかみさんのお吸い物、すっごくおいしいんだよ！');
    await E.say('宿の子', 'あとね、すみの灯籠に手を合わせると、記録ができるんだって。');
  };

  /* ---------------- field ---------------- */
  T.shopTea = async (E) => {
    await E.say('おミツ', '峠の茶屋へようこそ。山へ入るなら、里帰りの札を持っておくと安心ですよ。');
    await E.shop('tea');
    await E.say('おミツ', 'いってらっしゃい。帰りにまた寄ってくださいね。');
  };
  T.traveler = async (E) => {
    if (E.flag('cave')) { await E.say('旅の人', '洞の主をしずめたって？ たまげたなあ。山の空気が、少し澄んだ気がするよ。'); return; }
    if (E.flag('forest')) { await E.say('旅の人', '洞の中の岩は、押せば動くらしいぞ。……誰が試したのかは知らんがね。'); return; }
    await E.say('旅の人', '東の峠の先に、鳴き岩の洞って洞窟がある。中に、ばかでかい主が住んでるって話だ。');
  };
  T.lost = async (E) => {
    if (E.has('genta')) { await E.say('里の若者', 'ゲンタ、無事でよかった……！ 森の奥は霧が深い。気をつけてな。'); return; }
    await E.say('里の若者', 'た、大変だ！ 森の入り口で、木こりのゲンタが妖に囲まれてる！');
    await E.say('里の若者', '宵ノ森は、この道をまっすぐ南だ。たのむ、コハル！');
  };
  T.rope = async (E) => {
    if (!E.has('suzu')) {
      await E.msg('しめ縄が張られていて、先へ進めない。\n……ふしぎな力で守られているようだ。');
      await E.say('koharu', '祠の鈴の音なら、ほどけるかもしれない……。まずはスズちゃんを探さなきゃ。');
      return;
    }
    await E.say('suzu', 'まかせて。……ちりん、ちりーん。');
    E.sfx('bell'); E.flash('rgba(255,240,200,', 0.4);
    await E.wait(500);
    E.set('rope');
    await E.msg('しめ縄が、するりとほどけた！');
    E.autosave();
  };

  /* ---------------- forest ---------------- */
  ST.enter.forest = async (E) => {
    if (E.flag('genta')) return;
    E.set('genta');
    await E.wait(300);
    await E.say('genta2', 'くそっ、こいつら、どこから湧いてきやがる！');
    await E.say('koharu2', 'ゲンタ！');
    await E.say('genta', 'コハル!? ちょうどいい、手を貸してくれ！');
    await E.join('genta');
    await E.battle('gentaEvent');
    await E.say('genta', 'ふう……助かったぜ。森の妖が、こんなに荒れてるのは初めてだ。');
    await E.say('koharu', '宵灯が消えちゃったの。わたし、この森にいるスズって子を探しに来たんだ。');
    await E.say('genta', '鈴の付喪神か。……よし、おれも行く。');
    await E.say('genta2', '木こりの斧は、薪割りだけのもんじゃねえってところを見せてやる！');
    await E.msg('ゲンタは「大鉈」などのわざが使える。わざは戦いの「わざ」から選ぼう。');
    E.autosave();
  };
  T.signForest = async (E) => {
    await E.msg('古い立て札だ。\n「三つの灯籠に火をともせ。さすれば森の霧は晴れん」');
    const n = ['L1', 'L2', 'L3'].filter((k) => E.flag('lit_' + k)).length;
    if (n < 3) await E.msg(`（いまともっている灯籠：${n} / 3）`);
  };
  T.mist = async (E) => {
    const n = ['L1', 'L2', 'L3'].filter((k) => E.flag('lit_' + k)).length;
    await E.msg(`濃い霧が立ちこめていて、先へ進めない。\n（ともした灯籠：${n} / 3）`);
  };
  ST.lantern = async (E, o) => {
    if (E.flag('lit_' + o.id)) { await E.msg('灯籠の火が、あたたかく揺れている。'); return; }
    await E.msg('古い石灯籠だ。火をともしますか？');
    if ((await E.choice(['ともす', 'やめる'])) !== 0) return;
    E.sfx('fire');
    E.set('lit_' + o.id);
    const n = ['L1', 'L2', 'L3'].filter((k) => E.flag('lit_' + k)).length;
    await E.msg(`ぽうっ……灯籠に火がともった。（${n} / 3）`);
    if (n === 3) {
      E.sfx('wind'); E.set('mist');
      await E.msg('森の奥で、霧が晴れていく音がした……。');
      E.autosave();
    }
  };
  T.suzuTrapped = async (E) => { await E.say('suzu2', '……こないで……！ この木が、この木が……！'); };
  T.oak = async (E) => {
    if (E.flag('forest')) { await E.msg('おだやかな老木だ。木の葉のすきまから、やわらかい光がこぼれている。'); return; }
    await E.msg('ねじれた大きな樫の木だ。枝がざわざわと揺れている……。');
  };
  ST.trigger.oakBoss = async (E) => {
    E.music(null);
    await E.wait(300);
    await E.say('suzu2', '……だれ？ こないで……！');
    await E.say('koharu', 'スズちゃん？ 祠守ヨネの孫、コハルだよ。迎えに来たの！');
    await E.say('suzu2', 'ヨネの……？ だめ、この木が、わたしを放してくれないの！');
    E.shake(0.5); E.sfx('quake');
    await E.say('ねじれ樫', 'ギ……ギギ……灯ノ……匂イ……。喰ワセロ……！');
    await E.say('genta2', '木のお化けか。だったら、おれの出番だな！');
    await E.battle('oak', { boss: true });
    E.set('forest');
    E.music('forest');
    await E.narr('ねじれ樫は静かになり、もとの老木の姿にもどった。');
    await E.say('suzu', '……ありがとう。助けに来てくれたんだね。');
    await E.say('suzu', 'あの晩、黒い影みたいなものが祠に来て、宵灯をひと口で飲みこんじゃったの。');
    await E.say('suzu2', 'わたし、こわくて、鈴の音も出せなくて……ここまで逃げてきたの。');
    await E.say('koharu', 'いっしょに帰ろう。宵灯を、もう一度ともそう？');
    await E.say('suzu', '……うん！ わたしの鈴の音なら、山のしめ縄もほどけるよ。');
    await E.join('suzu');
    await E.msg('スズは風や音の術で、敵をまとめて相手にできる。');
    E.goal('鳴き岩の洞で火種石を手に入れる（野原の東の峠）');
    await E.say('koharu', '里のお店にも、新しい品が入ってるかも。一度もどって支度しよう！');
    E.autosave();
  };

  /* ---------------- cave ---------------- */
  T.signCave = async (E) => {
    await E.msg('岩に文字が刻まれている。\n「岩を穴に落とせば、向こうへ渡れる」');
    await E.msg('岩を元の場所にもどしますか？');
    if ((await E.choice(['もどす', 'そのまま'])) === 0) { E.sfx('quake'); await G.resetBoulders(); }
  };
  T.hanzakiBody = async (E) => { await E.msg('山のように大きな体が、行く手をふさいでいる。'); };
  ST.trigger.hanzakiBoss = async (E) => {
    E.music(null);
    E.shake(0.6); E.sfx('quake');
    await E.wait(400);
    await E.narr('洞の奥の湖に、山のような影がうずくまっている。');
    await E.say('はんざき大主', 'グルル……光ル石……ワシノ……モノ……。');
    await E.say('suzu2', 'あっ、火種石を飲みこんじゃってる！');
    await E.say('genta2', '吐き出させてやろうぜ！');
    await E.say('koharu2', 'ごめんね、少しだけ、がまんして！');
    await E.battle('hanzaki', { boss: true });
    E.set('cave');
    E.music('cave');
    await E.narr('はんざき大主は火種石を吐き出すと、ゆっくりと湖の底へ沈んでいった。');
    E.give('hidane'); E.sfx('chest');
    await E.msg('火種石を手に入れた！');
    await E.say('suzu', '湖の奥の石段を上れば、奥ノ祠だよ。');
    await E.say('koharu', 'いよいよだね。……みんな、行こう！');
    await E.say('genta', 'おう。でも腹が減っては戦はできねえ。里で支度してからでもいいんだぜ。');
    E.goal('奥ノ祠で宵灯をともす（洞の奥の石段から）');
    E.autosave();
  };

  /* ---------------- shrine ---------------- */
  ST.enter.shrine = async (E) => {
    if (E.flag('shrineIn')) return;
    E.set('shrineIn');
    await E.wait(300);
    await E.narr('奥ノ祠。いつもは灯に照らされている参道が、いまは深い闇に沈んでいる。');
    await E.say('suzu', '祠の前に、影の結界が張られてる……。左右の影灯籠を祓えば、消えるはずだよ。');
    E.goal('左右の影灯籠を祓い、祠の結界を解く');
  };
  ST.kage = async (E, o) => {
    if (E.flag(o.id)) { await E.msg('祓われた灯籠に、あたたかな火がともっている。'); return; }
    await E.msg('灯籠の中で、黒い炎がゆらめいている……。');
    if ((await E.choice(['祓う', 'やめる'])) !== 0) return;
    await E.battle('kage');
    E.set(o.id);
    E.sfx('holy');
    await E.msg('影灯籠が祓われ、黒い炎が消えた。');
    if (E.flag('kage1') && E.flag('kage2')) {
      E.set('kageOpen'); E.flash('rgba(255,230,180,', 0.5); E.sfx('bell');
      await E.msg('祠の前の、影の結界がほどけていく……！');
      E.goal('奥ノ祠で宵灯をともす');
    }
    E.autosave();
  };
  T.shadowGate = async (E) => {
    const n = ['kage1', 'kage2'].filter((k) => E.flag(k)).length;
    await E.msg(`影がうずまいていて、先へ進めない。\n（祓った影灯籠：${n} / 2）`);
  };
  T.spring = async (E) => {
    E.heal(); E.sfx('heal'); E.flash('rgba(160,220,255,', 0.4);
    await E.msg('清らかな湧き水だ。……ひと口飲むと、体じゅうに力がもどってきた！');
  };
  T.yoiguraiBody = async (E) => { await E.msg('夜よりも濃い影が、祠の前に立っている。'); };
  ST.trigger.finalBoss = async (E) => {
    E.music(null);
    await E.wait(400);
    await E.narr('祠の前に、夜よりも濃い影が立っていた。');
    await E.say('宵喰らい', '……マタ、灯ヲ持ッテキタノカ。ヨイ、ヨイ。ソレモ喰ラッテヤロウ。');
    await E.say('koharu2', 'あなたが宵灯を消したのね。');
    await E.say('宵喰らい', '人ハ灯ヲトモシ、ワレラヲ闇ニ追イヤッタ。ダカラ喰ウ。ゼンブ、喰ウ。');
    await E.say('suzu2', 'ちがう！ 宵灯は、追いはらうための灯じゃない。人と妖の境を、やさしく照らす灯なの！');
    await E.say('genta2', '……話が通じる相手じゃなさそうだな。');
    await E.say('koharu2', 'ううん、きっと届く。……まずは、その影を祓う！');
    await E.battle('final', { boss: true, keepMusic: true });
    E.set('cleared');
    await E.narr('宵喰らいの体から、たくさんの小さな灯がこぼれ出した。');
    await E.say('宵喰らい', '……アタタカイ。コレガ……灯……。');
    await E.say('suzu', 'この子、ずっと暗いところで、ひとりぼっちだったんだね……。');
    await E.say('koharu', 'もう大丈夫。宵灯は、あなたのことも照らすから。');
    await E.narr('コハルは火種石を灯台にそっと置き、スズが鈴を鳴らした。');
    E.sfx('bell');
    await E.wait(900);
    E.flash('rgba(255,220,150,', 0.9);
    await E.narr('――宵灯が、ふたたびともった。');
    await E.fade(1, 1500);
    await E.ending();
  };

  /* ---------------- ending ---------------- */
  ST.ending = async (E) => {
    await E.wait(800);
    await E.narr('その夜、灯ノ里では灯祭りがひらかれた。');
    await E.narr('山から下りてきた妖たちも、灯の輪のなかで、\n楽しそうに踊っていたという。');
    await E.say('yone', 'よくやったね、コハル。今日からは、立派な祠守だ。');
    await E.say('koharu', 'えへへ……。でも、わたしひとりじゃなかったよ。');
    await E.say('genta', 'おう。……腹へったな！ 団子、食いに行こうぜ！');
    await E.say('suzu', 'わたしも！ ……付喪神って、お団子食べられるのかな？');
    await E.wait(600);
  };
  ST.credits = (time, lv) => [
    { t: '宵灯りのほこら', big: true }, { t: '' }, { t: '' },
    { t: 'シナリオ・ゲームデザイン', head: true }, { t: 'コハルたちの旅をつくった人' }, { t: '' },
    { t: 'プログラム', head: true }, { t: 'HTML5 Canvas / JavaScript' }, { t: '' },
    { t: 'ドット絵', head: true }, { t: 'ぜんぶコードで描きました' }, { t: '' },
    { t: '音楽・効果音', head: true }, { t: 'Web Audio API で合成（陽音階・都節）' }, { t: '' },
    { t: 'イラスト', head: true }, { t: '画像生成 AI 用のプロンプトから' }, { t: '' },
    { t: '登場人物', head: true }, { t: 'コハル　ゲンタ　スズ' }, { t: 'ヨネ　ゴロウ　おタエ　マメキチ　おミツ' }, { t: 'そして、灯ノ里と山の妖たち' }, { t: '' },
    { t: 'あそんでくれた、あなたへ', head: true }, { t: 'ありがとうございました' }, { t: '' }, { t: '' },
    { t: `クリアタイム　${time}　　Lv ${lv}` }, { t: '' }, { t: '' },
  ];

  /* ---------------- help ---------------- */
  ST.help = `
    <p>灯ノ里（ひのさと）の祠守見習い・コハルになって、消えてしまった山の灯「宵灯」をともし直す、20〜40 分ほどの和風 RPG です。</p>
    <h3>操作</h3>
    <table>
      <tr><th>移動</th><td><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> または <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>（<kbd>Shift</kbd> を押しながらで小走り）</td></tr>
      <tr><th>決定・話す・調べる</th><td><kbd>Z</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd></td></tr>
      <tr><th>キャンセル・メニュー</th><td><kbd>X</kbd> / <kbd>Esc</kbd></td></tr>
      <tr><th>マウス・タッチ</th><td>画面を押したままにすると、その方向へ歩きます。となりの人や宝箱をタップすると話す・調べる。メニューの項目はタップで選べます。スマホでは画面の下の十字キーと A（決定）・B（キャンセル／メニュー）ボタンも使えます。</td></tr>
    </table>
    <h3>旅のこつ</h3>
    <ul>
      <li>草むらや森・洞の中を歩くと、妖（敵）が出てきます。道の上は少し出にくくなります。</li>
      <li>光る石灯籠に手を合わせると、HP と気が回復し、記録（セーブ）ができます。場所を移るたびにオートでも記録されます。</li>
      <li>戦いのコマンドは「こうげき・わざ・どうぐ・まもる・にげる」。わざは「気」を使います。敵には火・風・雷・灯の弱点があります。</li>
      <li>力つきても、最後の記録から HP と気が回復した状態で再開できます。</li>
      <li>迷ったらメニューの下に出ている「目的」を見てください。</li>
    </ul>
    <h3>仲間</h3>
    <ul>
      <li><b>コハル</b>：回復の「灯し火」、火の「火の粉」、影の妖に強い「宵祓い」。</li>
      <li><b>ゲンタ</b>：重い一撃「大鉈」、全体攻撃「薙ぎ払い」、仲間をかばう「仁王立ち」。</li>
      <li><b>スズ</b>：全体攻撃「鈴風」、眠らせる「眠り鈴」、守りを上げる「守り鈴」、雷の「鳴神」。</li>
    </ul>`;

  G.boot();
})();
