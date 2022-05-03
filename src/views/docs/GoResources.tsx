/*
 * Copyright (C) 2012-2022  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { pgettext, _, getLanguageFlag, interpolate } from "translate";
import { Flag } from "Flag";
import * as data from "data";
import { Markdown } from "Markdown";

function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function scramble<T>(...args: T[]) {
    return shuffleArray(args);
}

export const GoResources = () => {
    window.document.title = _("Other Go Resources");

    const country = data.get("user").country || "us";
    const fr = getLanguageFlag("french", country, "fr");
    const en = getLanguageFlag("english", country, "us");
    const es = getLanguageFlag("spanish", country, "es");
    const de = getLanguageFlag("german", country, "de");
    const cn = getLanguageFlag("chinese", country, "cn");
    const jp = getLanguageFlag("japanese", country, "jp");
    const kr = getLanguageFlag("korean", country, "kr");
    const un = getLanguageFlag("un", country, "un");
    const us = getLanguageFlag("us", country, "us");
    const eu = getLanguageFlag("eu", country, "eu");
    const it = getLanguageFlag("italian", country, "it");
    const nl = getLanguageFlag("dutch", country, "nl");
    const gb = getLanguageFlag("gb", country, "gb");
    const au = getLanguageFlag("au", country, "au");
    const ca = getLanguageFlag("ca", country, "ca");
    const ru = getLanguageFlag("ru", country, "ru");
    const gr = "gr";
    const br = "br";
    const ar = getLanguageFlag("spanish", country, "ar");

    return (
        <div id="docs-other-go-resources">
            <div className="container" style={{ textAlign: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <Markdown
                        source={interpolate(
                            pgettext(
                                "Go resources",
                                "Have something you want added to the list? Shoot an email to {{email_address}}!",
                            ),
                            { email_address: "contact@online-go.com" },
                        )}
                    />
                </div>

                <div style={{ textAlign: "center" }}>
                    <i>{"Note: links are randomly ordered"}</i>
                </div>

                <div className="multi-columns">
                    <dl>
                        <dt>{_("Books")}</dt>

                        {scramble(
                            <Book
                                countries={[kr, en]}
                                title="Falling in love with Baduk"
                                href="https://cdn.online-go.com/Falling-in-love-with-Baduk.pdf"
                                authors={["Korea Baduk Association"]}
                            />,
                            <Book
                                countries={[en]}
                                title="Relentless (2016)"
                                href="https://cdn.online-go.com/relentless.pdf"
                                authors={[
                                    "Younggil An",
                                    "Josh Hoak",
                                    "David Ormerod",
                                    <a rel="noopener" href="http://gogameguru.com/relentless/">
                                        Go Game Guru
                                    </a>,
                                ]}
                            />,
                            <Book
                                countries={[en]}
                                title="Go on Go: The Analyzed Games of Go Seigen"
                                href="https://www.usgo.org/sites/default/files/pdf/go-seigen-book.pdf"
                                authors={["Go Seigen", "Translation by Jim Z. Yu"]}
                            />,
                            <Book
                                countries={[en]}
                                title="The Game of Go"
                                href="https://archive.org/details/gameofgonational00smitrich/page/n9"
                                authors={["Arthur Smith (1908)"]}
                            />,
                            <Book
                                countries={[en]}
                                title="River Mountain Go 1 (30k-20k)"
                                href="http://tigersmouth.org/downloads/RiverMtnGo-30k-20k.pdf"
                                authors={["Oliver Richman"]}
                            />,
                            <Book
                                countries={[en]}
                                title="River Mountain Go 2 (20k-8k)"
                                href="http://tigersmouth.org/downloads/RiverMtnGo-20k-8k.pdf"
                                authors={["Oliver Richman"]}
                            />,
                            <Book
                                countries={[es]}
                                title="Introducción al juego de Go"
                                href="https://cdn.online-go.com/Introduccion-al-juego-de-Go.pdf"
                                authors={["Mariano López Minnucci"]}
                            />,
                            <Book
                                countries={[en, ru]}
                                title="81 Little Lions (9x9 intro)"
                                authors={[
                                    "Immanuel deVillers",
                                    "Lucas Félix de Oliveira Santana",
                                    "Рочев Антон",
                                ]}
                                editions={[
                                    {
                                        title: "2019 Edition (pdf)",
                                        country: en,
                                        href: "https://cdn.online-go.com/81_little_lions/Immanuel%20deVillers%20-%2081%20Little%20Lions%20-%20An%20Introduction%20to%20the%209x9%20Board%20for%20Advanced%20Beginners%20-%20Revised%20Edition%20(2019).pdf",
                                    },
                                    {
                                        title: "2019 Edition (azw3)",
                                        country: en,
                                        href: "https://cdn.online-go.com/81_little_lions/Immanuel%20deVillers%20-%2081%20Little%20Lions%20-%20An%20Introduction%20to%20the%209x9%20Board%20for%20Advanced%20Beginners%20-%20Revised%20Edition%20(2019).azw3",
                                    },
                                    {
                                        title: "2019 Edition (epub)",
                                        country: en,
                                        href: "https://cdn.online-go.com/81_little_lions/Immanuel%20deVillers%20-%2081%20Little%20Lions%20-%20An%20Introduction%20to%20the%209x9%20Board%20for%20Advanced%20Beginners%20-%20Revised%20Edition%20(2019).epub",
                                    },
                                    {
                                        title: "81 львёнок (pdf)",
                                        country: ru,
                                        href: "https://cdn.online-go.com/81_little_lions_ru.pdf",
                                    },
                                    {
                                        title: "2015 Edition (pdf)",
                                        country: en,
                                        href: "https://cdn.online-go.com/81_little_lions.pdf",
                                    },
                                ]}
                            />,
                            <span>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{ display: "inline-block", width: "2.5rem" }}>
                                        <Flag country={en} /> <Flag country={gr} />
                                        <Flag country={fr} /> <Flag country={br} />
                                    </span>{" "}
                                    <a rel="noopener" href="https://www.gobook.eu/">
                                        A Go Guide{" "}
                                        <span style={{ fontSize: "0.9em" }}>From a Beginner</span>
                                    </a>
                                </div>

                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Charalampos (Haris) Kapolos
                                </span>
                            </span>,
                            <Book
                                countries={[en]}
                                title="Shape Up!"
                                href="https://cdn.online-go.com/shape_up_v1.2.pdf"
                                authors={["Charles Matthews", "Seong-June Kim"]}
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>
                    <dl>
                        <dt>{_("Kifu Sheets")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/kifu-en-19x19.pdf"
                                >
                                    19x19
                                </a>{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/kifu-en-13x13.pdf"
                                >
                                    13x13
                                </a>{" "}
                                <a rel="noopener" href="https://cdn.online-go.com/kifu-en-9x9.pdf">
                                    9x9
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/kifu-with-circles-en-19x19.pdf"
                                >
                                    19x19 with circles
                                </a>{" "}
                            </span>,
                            <span>
                                <Flag country={es} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/kifu-es-19x19.pdf"
                                >
                                    19x19
                                </a>{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/kifu-es-13x13.pdf"
                                >
                                    13x13
                                </a>{" "}
                                <a rel="noopener" href="https://cdn.online-go.com/kifu-es-9x9.pdf">
                                    9x9
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Learning Resources")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Josekipedia"
                                href="http://www.josekipedia.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Eidogo's Pattern Search"
                                href="http://eidogo.com/#search"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Waltheri's Pattern Search"
                                href="http://ps.waltheri.net/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="AlphaGo Teaching Tool"
                                href="https://alphagoteach.deepmind.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Interactive Tutorial for Beginners"
                                href="https://learn-go.net"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="A Kid's Guide to Playing Go"
                                href="https://www.playgroundequipment.com/a-kids-guide-to-playing-go/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Online Lessons")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Guo Juans Internet Go School"
                                href="https://internetgoschool.com/index.vhtml.com"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Yunguseng Dojang's Online Go School"
                                href="https://www.yunguseng.com/"
                            />,
                            <span>
                                <Flag country={en} />
                                <Flag country={ru} />{" "}
                                <a rel="noopener" href="https://gomagic.org/">
                                    Go Magic
                                </a>
                            </span>,
                            <BasicResource
                                countries={["jp"]}
                                title="Hoenkikaku Co, Ltd."
                                href="https://www.hoenkikaku.co.jp/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Tsumego")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="GoProblems.com"
                                href="http://www.goproblems.com"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="[PDF] Tsumego Collection"
                                href="http://tsumego.tasuki.org/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Sahwal.com"
                                href="http://sahwal.com"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Black To Play"
                                href="https://blacktoplay.com/"
                            />,
                            <BasicResource
                                countries={[un]}
                                title="GoChild"
                                href="http://gochild2009.appspot.com/?locale=en_US"
                            />,
                            <span>
                                <Flag country={"cn"} />
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.weiqiok.com/asp/English.asp">
                                    Weiqiok
                                </a>
                            </span>,
                            <BasicResource
                                countries={[un]}
                                title="3-2-1 Go"
                                href="http://321go.org/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Ghost Go"
                                href="https://www.ghost-go.com/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Video Resources")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Go Commentary Videos"
                                href="http://www.gocommentary.com/free-tutorial-videos.html"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Baduk Movies"
                                href="https://badukmovies.com/"
                            />,
                            <BasicResource
                                countries={[eu]}
                                title="EuroGoTV Go Broadcasts"
                                href="http://eurogotv.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Twitch Live Streams for Go"
                                href="https://go.twitch.tv/directory/game/Go"
                            />,
                            <BasicResource
                                countries={[eu]}
                                title="TED talk - How the ancient game of Go is a guide to modern life"
                                href="https://www.youtube.com/watch?v=wQuh9YI8rn0"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>
                    <dl>
                        <dt>{_("Video Channels")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} /> <Flag country={jp} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCRJyagla1B5cxIfR4i2LdgA"
                                >
                                    Michael Redmond's Go TV
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/sinayaka">
                                    sinayaka Twitch
                                </a>{" "}
                                /{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/c/%E5%A5%B3%E6%B5%81%E6%A3%8B%E5%A3%AB%E7%94%B0%E5%8F%A3%E7%BE%8E%E6%98%9FCHANNEL/featured"
                                >
                                    女流棋士 田口美星 YouTube
                                </a>
                            </span>,
                            <BasicResource
                                countries={[en]}
                                title="Jonathan Markowitz"
                                href="https://www.youtube.com/user/KNMeepsie"
                            />,
                            <span>
                                <Flag country={en} /> <Flag country={ru} />{" "}
                                <a rel="noopener" href="https://twitch.tv/gomagic_live">
                                    Go Magic Twitch
                                </a>{" "}
                                /{" "}
                                <a rel="noopener" href="https://www.youtube.com/c/GoMagic">
                                    YouTube
                                </a>
                            </span>,
                            <BasicResource
                                countries={[en]}
                                title="Nick Sibicky"
                                href="https://www.youtube.com/user/nicksibicky/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Andrew Jackson"
                                href="https://www.youtube.com/channel/UCGAASXnrt4FtYfFZ608PqHA"
                            />,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/battsgo">
                                    Dwyrin Twitch
                                </a>{" "}
                                /{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/dwyrin/">
                                    YouTube
                                </a>
                            </span>,
                            <BasicResource
                                countries={[en]}
                                title="Shusaku Games"
                                href="https://www.youtube.com/user/tokinonagare27/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Haylee"
                                href="https://www.youtube.com/channel/UCTji1kQNoWIH85dB_Vxka9g"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Littlelambgo"
                                href="https://www.youtube.com/user/littlelambgo"
                            />,
                            <BasicResource
                                countries={[eu]}
                                title="Murugandi"
                                href="http://www.eurogotv.com/index.php?menu=Video&log=trefwoordzoeken&trefwoord1=murugandi&pagina=5%20Murugandi"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Adrian Petrescu"
                                href="https://www.youtube.com/user/apetresc"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="LongstrideBaduk"
                                href="https://www.youtube.com/user/longstridebaduk"
                            />,
                            <BasicResource
                                countries={[it]}
                                title="Alessandro Pace"
                                href="https://www.youtube.com/user/PaceAlessandro"
                            />,
                            <BasicResource
                                countries={[es]}
                                title="Escuela de Go en Bilbao"
                                href="https://www.youtube.com/goenbilbao"
                            />,
                            <BasicResource
                                countries={[es]}
                                title="Gogoratu Go"
                                href="https://www.youtube.com/gogoratugo"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="In Sente"
                                href="https://www.youtube.com/channel/UCP14BOcc0Rg9-TXXv2I4AkA"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="BenKyo"
                                href="https://www.youtube.com/channel/UCsH0N8Hc4e4AXTnZt8Hg6fQ"
                            />,
                            <BasicResource
                                countries={[ar]}
                                title="Luciano Zinni"
                                href="https://www.youtube.com/user/lucho4668 "
                            />,
                            <BasicResource
                                countries={[it]}
                                title="Diego Laurenti"
                                href="https://www.youtube.com/user/jejosamurai "
                            />,
                            <BasicResource
                                countries={[es]}
                                title="Estudiando Go con Ini"
                                href="https://www.youtube.com/EstudiandoGoconIni"
                            />,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/xhu98">
                                    Xhu98 Twitch
                                </a>{" "}
                                /{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCohURdr4oSzrXL49qOQQpwg"
                                >
                                    YouTube
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/odnihs">
                                    odnihs Twitch
                                </a>{" "}
                                /{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/Lightvolty">
                                    YouTube
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/danielml001">
                                    danielml001 Twitch
                                </a>{" "}
                                /{" "}
                                <a rel="noopener" href="http://www.youtube.com/danielml01">
                                    YouTube
                                </a>
                            </span>,
                            <BasicResource
                                countries={[en]}
                                title="New York Institute of Go"
                                href="https://www.youtube.com/channel/UCMp-4uv1jfVa0dXkZv3qQYA/videos"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Yoon's Baduk Cafe"
                                href="https://www.youtube.com/channel/UCQ7fRyWobKv_FejtqwUVImA"
                            />,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UC_AU7Wu_tKhFIRjrJZgYA9w"
                                >
                                    Go Pro Yeonwoo
                                </a>{" "}
                                / <Flag country={kr} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCfC7lLfshm-GGKengvBm_HQ"
                                >
                                    프로연우
                                </a>
                            </span>,
                            <BasicResource
                                countries={[cn]}
                                title="围棋TV"
                                href="https://www.youtube.com/channel/UC9BYxg8ZakiOvbDyO2eGLZw"
                            />,
                            <BasicResource
                                countries={[au]}
                                title="Lumbertruck Twitch"
                                href="https://www.twitch.tv/lumbertruck"
                            />,
                            <BasicResource
                                countries={[ru]}
                                title="Alone Go"
                                href="https://www.twitch.tv/alone_go"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Gooplet"
                                href="https://www.twitch.tv/gogogooplet"
                            />,
                            <BasicResource
                                countries={["tr"]}
                                title="Şibumi Go Okulu"
                                href="https://www.youtube.com/channel/UCwTy0RGxDD2ZkQv-qCuWrAQ"
                            />,
                            <BasicResource
                                countries={["tr"]}
                                title="Istanbul Go Association"
                                href="https://www.youtube.com/channel/UCzxYMKMGX_ZXXzBiLE9FVfw"
                            />,

                            <BasicResource
                                countries={[jp]}
                                title="The Nihon Ki-in Youtube Channel (日本棋院囲碁チャンネル)"
                                href="https://www.youtube.com/channel/UCl4UWklKYTaUOZAhSJAprWQ"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="Igo & Shogi"
                                href="https://www.youtube.com/user/igoshogich"
                            />,

                            <BasicResource
                                countries={["br"]}
                                title="Nihon Kiin do Brasil"
                                href="https://www.twitch.tv/brasilnihonkiin"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Sites")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Open Study Room"
                                href="https://openstudyroom.org"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="GoBase.org"
                                href="http://gobase.org/"
                            />,
                            <BasicResource
                                countries={[fr]}
                                title="Revue Française de Go"
                                href="http://rfg.jeudego.org/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Go4Go"
                                href="http://www.go4go.net/"
                            />,
                            <BasicResource
                                countries={["ro"]}
                                title="Despre GO"
                                href="https://desprego.ro/"
                            />,

                            <BasicResource
                                countries={[en]}
                                title="Fuseki Database"
                                href="http://www.fuseki.info"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Daily Joseki"
                                href="http://www.dailyjoseki.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Sensei's Library"
                                href="http://senseis.xmp.net/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="GoGameGuru"
                                href="https://gogameguru.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Got Stats? - OGS Statistics"
                                href="https://avavt.github.io/gotstats/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Blogs")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Seferi's Blog"
                                href="https://blog.seferi.org/"
                            />,
                            <span>
                                <Flag country={en} />
                                <Flag country={br} />{" "}
                                <a rel="noopener" href="https://fanaro.io/">
                                    Fanaro's Site
                                </a>
                            </span>,
                            <BasicResource
                                countries={[en]}
                                title="A Baduk Blog"
                                href="https://write.as/fraze/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Yike Weiqi"
                                href="https://twitter.com/yikego_en"
                            />,
                            <BasicResource
                                countries={[fr]}
                                title="Art du Go"
                                href="https://artdugo.fr"
                            />,
                            <BasicResource
                                countries={[es]}
                                title="Canbaduk"
                                href="http://canbaduk.wordpress.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Weiqi to go!"
                                href="http://weiqitogo.blogspot.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="My Sanransei"
                                href="http://mysanrensei.wordpress.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="One Liberty Short"
                                href="http://onelibertyshort.wordpress.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Go of Ten"
                                href="http://gooften.net/"
                            />,

                            <BasicResource
                                countries={[jp]}
                                title="週刊碁ブログ"
                                href="https://blog.goo.ne.jp/shukango"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="棋院海外室Go日記"
                                href="https://blog.goo.ne.jp/kiin5"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="囲碁ナショナルチーム「GO・碁・ジャパン」"
                                href="http://blog.goo.ne.jp/nationalgo/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="日本棋院市ヶ谷本院事業部イベントブログ"
                                href="http://blog.goo.ne.jp/nihonkiin_event/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="有楽町囲碁センター"
                                href="http://blog.goo.ne.jp/yurakuchoigo/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="日本棋院関西総本部"
                                href="https://blog.goo.ne.jp/osakaigo"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="囲碁ステーション (Go Station)"
                                href="https://blog.goo.ne.jp/igo-station"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="囲碁日記 (Go Diary)"
                                href="http://blog.goo.ne.jp/igo_nikki"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="尾越一郎九段囲碁普及活動"
                                href="https://blog.goo.ne.jp/ogoshi-igo"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="関西棋士会"
                                href="http://blog.goo.ne.jp/kansaikishikai/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="このごろの下島八段と大表二段"
                                href="http://blog.goo.ne.jp/15toyama/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="白石勇一の囲碁日記"
                                href="http://blog.goo.ne.jp/igoshiraishi"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="鈴木伊佐男七段の風来日記"
                                href="http://ichao1515.jugem.jp/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="そらちで囲碁"
                                href="https://blog.goo.ne.jp/ye_igo"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="たかお日記"
                                href="http://blog.goo.ne.jp/s-takao-san/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="竹清勇の囲碁の宝石箱"
                                href="http://blog.goo.ne.jp/starnine"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="千寿の碁紀行"
                                href="http://blog.goo.ne.jp/33612534201"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="時々囲碁日誌+"
                                href="http://blog.goo.ne.jp/kodomoigo111"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="なかねっと"
                                href="http://blog.goo.ne.jp/nakanet_2009/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="nagoya amigo"
                                href="http://ameblo.jp/nagoyaamigo/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="名古屋棋士会"
                                href="http://blog.goo.ne.jp/nagoyakishikai/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="ひろふみのブログ☆"
                                href="https://blog.goo.ne.jp/minamijyuujisei_1984"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="三谷哲也の囲碁日記"
                                href="http://blog.goo.ne.jp/yamaneko1985/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="三村囲碁jp"
                                href="http://mimura15.jp/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="向井3姉妹のGO！GO！Diary☆"
                                href="http://blog.goo.ne.jp/mukai3shimai"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="吉原由香里のつれづれ日記"
                                href="http://yukarigo.at.webry.info/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="ヨダログ"
                                href="http://blog.goo.ne.jp/yoda_norimoto"
                            />,

                            <BasicResource
                                countries={[es]}
                                title="361 Puntos"
                                href="http://361puntos.blogspot.com/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Forums")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Life in 19x19"
                                href="http://www.lifein19x19.com/forum/"
                            />,
                            <BasicResource
                                countries={[fr]}
                                title="GO.ON"
                                href="http://go-on.forumactif.com/"
                            />,
                            <BasicResource
                                countries={[fr]}
                                title="FFG"
                                href="http://forum.jeudego.org/"
                            />,

                            <BasicResource
                                countries={[en]}
                                title="Reddit"
                                href="http://www.reddit.com/r/baduk/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="OGS Forums"
                                href="https://forums.online-go.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Go4Go Forums"
                                href="http://www.go4go.net/go/forum"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Tiger's Mouth"
                                href="http://tigersmouth.org/"
                            />,
                            <BasicResource
                                countries={[de]}
                                title="DGoB"
                                href="http://www.dgob.de/yabbse/index.php"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Go Servers")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[un]}
                                title="[KGS] KGS Go Server"
                                href="http://www.gokgs.com/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="[IGS] Internet Go Server"
                                href="http://pandanet-igs.com/"
                            />,
                            <BasicResource
                                countries={[kr]}
                                title="Tygem"
                                href="http://www.tygem.com/"
                            />,
                            <BasicResource
                                countries={[kr]}
                                title="WBaduk"
                                href="http://www.wbaduk.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Go Shrine"
                                href="http://goshrine.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Fly or Die"
                                href="http://www.flyordie.com/go/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Fun Node"
                                href="http://www.funnode.com/games/go"
                            />,
                            <BasicResource
                                countries={[un]}
                                title="[DGS] Dragon Go Server"
                                href="http://www.dragongoserver.net/"
                            />,
                            <BasicResource
                                countries={[un]}
                                title="[OGS] Online-Go.com"
                                href="https://www.online-go.com/"
                            />,
                            <BasicResource
                                countries={[cn]}
                                title="[LKGS] Lanke Go Server"
                                href="http://lanke.cc/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Organizations")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[us]}
                                title="American Go Association"
                                href="http://www.usgo.org/"
                            />,
                            <BasicResource
                                countries={["gb"]}
                                title="British Go Association"
                                href="http://britgo.org/"
                            />,
                            <BasicResource
                                countries={["ie"]}
                                title="Irish Go Association"
                                href="https://www.irish-go.org"
                            />,
                            <BasicResource
                                countries={[ca]}
                                title="Canadian Go Association"
                                href="http://go-canada.org/"
                            />,
                            <BasicResource
                                countries={[de]}
                                title="Deutscher Go-Bund"
                                href="http://dgob.de/"
                            />,
                            <BasicResource
                                countries={[au]}
                                title="Australian Go Association"
                                href="http://www.australiango.asn.au/"
                            />,
                            <BasicResource
                                countries={[un]}
                                title="International Go Federation"
                                href="http://intergofed.org/"
                            />,
                            <BasicResource
                                countries={["rs"]}
                                title="Go Savez Srbije"
                                href="http://goss.rs/"
                            />,
                            <BasicResource
                                countries={[eu]}
                                title="European Go Federation"
                                href="http://www.eurogofed.org/"
                            />,
                            <BasicResource
                                countries={["cy"]}
                                title="Cyprus Go Association"
                                href="http://www.cyprus-go.org/"
                            />,
                            <BasicResource
                                countries={["ar"]}
                                title="Asociación Argentina de Go"
                                href="http://www.go.org.ar/"
                            />,
                            <BasicResource
                                countries={["us"]}
                                title="American Go Foundation"
                                href="http://agfgo.org/"
                            />,
                            <BasicResource
                                countries={["es"]}
                                title="Asociación Española de GO"
                                href="http://aego.biz/"
                            />,
                            <BasicResource
                                countries={["se"]}
                                title="Svenska Goförbundet"
                                href="http://goforbundet.se"
                            />,
                            <BasicResource
                                countries={[it]}
                                title="Italian Federation of Go"
                                href="https://figg.org"
                            />,
                            <BasicResource
                                countries={[nl]}
                                title="Dutch Go Association"
                                href="https://www.gobond.nl"
                            />,
                            <BasicResource
                                countries={["ru"]}
                                title="Russian Go Federation"
                                href="http://gofederation.ru"
                            />,
                            <BasicResource
                                countries={["pt"]}
                                title="Associação Portuguesa de Go"
                                href="http://www.go-portugal.org"
                            />,
                            <BasicResource
                                countries={["cl"]}
                                title="Chilean Go Federation"
                                href="http://www.igochile.cl/"
                            />,
                            <BasicResource
                                countries={["mx"]}
                                title="Mexican Association of Go"
                                href="http://go.org.mx/ "
                            />,
                            <BasicResource
                                countries={["tr"]}
                                title="Istanbul Go Association"
                                href="https://www.istanbulgo.org/"
                            />,
                            <BasicResource
                                countries={["br"]}
                                title="Nihon Kiin do Brasil"
                                href="http://www.nihonkiin.com.br/"
                            />,

                            <span>
                                <a rel="noopener" href="http://www.nihonkiin.or.jp/">
                                    <Flag country={jp} />
                                </a>
                                <a rel="noopener" href="http://www.nihonkiin.or.jp/english">
                                    <Flag country={en} />
                                </a>
                                <a rel="noopener" href="http://www.nihonkiin.or.jp/">
                                    日本棋院 (Nihon Ki-in), Tokyo Japan
                                </a>
                            </span>,
                            <span>
                                <a rel="noopener" href="http://www.pairgo.or.jp/homej.php">
                                    <Flag country={jp} />
                                </a>
                                <a rel="noopener" href="http://www.pairgo.or.jp/home.htm">
                                    <Flag country={en} />
                                </a>
                                <a rel="noopener" href="http://www.pairgo.or.jp/homej.php">
                                    Japan Pair Go Association
                                </a>
                            </span>,

                            <BasicResource
                                countries={[jp]}
                                title="Japan Go Federation"
                                href="https://jgof.or.jp/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="Igo & Shogi Channel Inc."
                                href="https://www.igoshogi.net/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="関西棋院 (Kansai Ki-in), Osaka Japan"
                                href="https://kansaikiin.jp/"
                            />,
                            <BasicResource
                                countries={["il"]}
                                title="Israeli Go Association"
                                href="https://igo.org.il/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Club Support")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[us]}
                                title="Baduk Club"
                                href="https://baduk.club/"
                            />,
                            <BasicResource
                                countries={[us]}
                                title="GoClubsOnline"
                                href="https://www.goclubs.org/"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Teaching Resources")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="AGF Lesson Plan Cooperative"
                                href="http://agfgo.org/pages/lessonplancoop.php"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="AGF Teaching Programs Grants"
                                href="http://agfgo.org/pages/grants.php"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="AGF Scholarship Programs"
                                href="http://agfgo.org/pages/scholarships.php"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Equipment")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[us]}
                                title="Yellow Mountain Imports"
                                href="http://www.ymimports.com/"
                            />,
                            <BasicResource
                                countries={[au]}
                                title="Institute 361"
                                href="https://institute361.com/"
                            />,
                            <BasicResource
                                countries={[gb]}
                                title="Masters of Games"
                                href="https://www.mastersofgames.com/cat/board/go.htm"
                            />,
                            <BasicResource
                                countries={[de]}
                                title="Hebsacker Verlag"
                                href="http://www.hebsacker-verlag.de/index.php"
                            />,
                            <BasicResource
                                countries={[nl]}
                                title="Goshop Keima"
                                href="http://www.goshop-keima.com/"
                            />,
                            <BasicResource
                                countries={[us]}
                                title="AGF Store"
                                href="http://agfgo.org/pages/store-playing.php"
                            />,
                            <BasicResource
                                countries={[us]}
                                title="Exotic Go Stones"
                                href="http://www.algorithmicartisan.com/gostones/"
                            />,
                            <BasicResource
                                countries={[jp]}
                                title="Kurokigoishi"
                                href="http://www.kurokigoishi.co.jp/english/"
                            />,
                            <BasicResource
                                countries={["se"]}
                                title="Gobutiken"
                                href="http://gobutiken.se"
                            />,
                            <span>
                                <Flag country={"au"} />{" "}
                                <a rel="noopener" href="https://facebook.com/pacifigoshop">
                                    PacifiGo
                                </a>{" "}
                                /{" "}
                                <a rel="noopener" href="https://ebay.com.au/str/pacifigogocompany">
                                    ebay
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Comics")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Empty Triangle"
                                href="http://www.emptytriangle.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Aji's Quest"
                                href="http://home.earthlink.net/~inkwolf/Inkwolf/Ajis_Quest.html"
                            />,
                            <BasicResource
                                countries={[de]}
                                title="Aji's Quest (German)"
                                href="http://www.rwro.de/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="Almost Sente"
                                href="http://almostsente.tumblr.com/"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="The Better move"
                                href="http://tigersmouth.org/articles.php?article_id=49"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Music")}</dt>
                        {scramble(
                            <BasicResource
                                countries={[en]}
                                title="Playing A game of Go"
                                href="https://www.youtube.com/watch?v=dVd959KJWEI"
                            />,
                            <BasicResource
                                countries={[en]}
                                title="The Game of Go - Chris Linn [1981 Swedish New-Wave]"
                                href="https://www.youtube.com/watch?v=-EwuqJfwOU4"
                            />,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://www.haskellsmall.com/videos/a-game-of-go-part-1"
                                >
                                    A Game of Go pt. I
                                </a>
                                <a
                                    rel="noopener"
                                    href="http://www.haskellsmall.com/videos/a-game-of-go-part-2"
                                >
                                    pt. II
                                </a>
                            </span>,
                            <BasicResource
                                countries={[en]}
                                title="Tesuji"
                                href="https://www.youtube.com/watch?v=quEN6FE90bM"
                            />,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Software")}</dt>
                        {scramble(
                            <span>
                                <i className="fa fa-windows" />{" "}
                                <a rel="noopener" href="http://www.ruijiang.com/multigo/">
                                    MultiGo
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-windows" /> <Flag country={jp} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://www.nihonkiin.or.jp/teach/kiin_editor/"
                                >
                                    Kiin Editor
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-windows" />{" "}
                                <a rel="noopener" href="http://www.smart-games.com/manyfaces.html">
                                    The Many Faces of Go
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-android" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://play.google.com/store/apps/details?id=net.lrstudios.android.tsumego_workshop&hl=en"
                                >
                                    Tsumego Pro
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-apple" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://itunes.apple.com/app/smartgo-kifu/id364854741?mt=8&ign-mpt=uo%3D4"
                                >
                                    SmartGo Kifu
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-linux" /> <i className="fa fa-apple" />{" "}
                                <i className="fa fa-windows"></i>{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.gnu.org/software/gnugo/gnugo.html"
                                >
                                    GNU Go
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-linux" /> <i className="fa fa-apple" />{" "}
                                <i className="fa fa-windows"></i>{" "}
                                <a rel="noopener" href="http://pachi.or.cz/">
                                    Pachi
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-linux" /> <i className="fa fa-apple" />{" "}
                                <i className="fa fa-windows"></i>{" "}
                                <a rel="noopener" href="http://gogui.sourceforge.net/">
                                    GoGui
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-linux"></i> <i className="fa fa-apple"></i>{" "}
                                <i className="fa fa-windows"></i>{" "}
                                <a rel="noopener" href="https://github.com/SabakiHQ/Sabaki">
                                    Sabaki
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-android" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://play.google.com/store/apps/details?id=nl.tengen.gridmaster"
                                >
                                    Go GridMaster
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-android" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://play.google.com/store/apps/details?id=org.ligi.gobandroid_hd"
                                >
                                    Gobandroid HD
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-android" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://play.google.com/store/apps/developer?id=Lauri+Paatero"
                                >
                                    Hactar Go
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-android" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://play.google.com/store/apps/details?id=cn.ezandroid.aq"
                                >
                                    Ah Q Go
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-android" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://play.google.com/store/apps/details?id=com.psocha.goclock"
                                >
                                    Go game clock
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-dollar" /> <i className="fa fa-android" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://play.google.com/store/apps/details?id=lrstudios.games.ego&hl=en"
                                >
                                    Ely Go
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-dollar" /> <i className="fa fa-apple" />{" "}
                                <i className="fa fa-windows"></i>{" "}
                                <a rel="noopener" href="http://smartgo.com/index.html">
                                    SmartGo
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-dollar" /> <i className="fa fa-apple" />{" "}
                                <a rel="noopener" href="https://gobooks.com/platforms.html">
                                    Go Books
                                </a>
                            </span>,

                            <span>
                                <i className="fa fa-windows" />{" "}
                                <a rel="noopener" href="http://openbook.qi-you.com/">
                                    LZ Opening Book
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-linux" /> <i className="fa fa-apple" />{" "}
                                <i className="fa fa-windows" />{" "}
                                <a rel="noopener" href="https://www.sjeng.org/leela.html">
                                    Leela
                                </a>
                            </span>,
                            <span>
                                <i className="fa fa-dollar" /> <i className="fa fa-apple" />{" "}
                                <a
                                    rel="noopener"
                                    href="https://itunes.apple.com/app/apple-store/id492566615?mt=8"
                                >
                                    EasyGo
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
};

interface BasicResourceProps {
    countries: string[];
    title: string | JSX.Element;
    href?: string;
}
function BasicResourceInner({ countries, title, href }: BasicResourceProps) {
    return (
        <>
            {countries.map((cc) => (
                <Flag key={cc} country={cc} />
            ))}{" "}
            {href ? (
                <a rel="noopener" href={href}>
                    {title}
                </a>
            ) : (
                <>{title}</>
            )}
        </>
    );
}

function BasicResource({ countries, title, href }: BasicResourceProps) {
    return (
        <span>
            <BasicResourceInner countries={countries} title={title} href={href} />
        </span>
    );
}
interface BookProps extends BasicResourceProps {
    countries: string[];
    title: string | JSX.Element;
    href?: string;
    authors: (string | JSX.Element)[];
    editions?: Array<{ country: string; title: string; href: string }>;
}

function Book({ countries, title, href, authors, editions }: BookProps) {
    return (
        <span>
            <BasicResourceInner countries={countries} title={title} href={href} />
            {editions &&
                editions.map((edition, idx) => (
                    <React.Fragment key={idx}>
                        {" "}
                        <br />
                        <span style={{ marginLeft: "1.7em" }}>
                            <Flag country={edition.country} />
                            <a rel="noopener" href={edition.href}>
                                {edition.title}
                            </a>
                        </span>
                    </React.Fragment>
                ))}
            {authors.map((author, idx) => (
                <React.Fragment key={idx}>
                    <br /> <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>{author}</span>
                </React.Fragment>
            ))}
        </span>
    );
}
