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

/*
                    <div className='about-links'>
                        <Link to='/docs/go-rules-comparison-matrix'>Go Rules Comparision Matrix</Link>
                    </div>
                    */

function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function scramble(...args) {
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
                            <span>
                                <Flag country={kr} />
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/Falling-in-love-with-Baduk.pdf"
                                >
                                    Falling in love with Baduk
                                </a>
                                <br />
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    {" "}
                                    Korea Baduk Association
                                </span>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://cdn.online-go.com/relentless.pdf">
                                    Relentless (2016)
                                </a>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Younggil An
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Josh Hoak
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    David Ormerod
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    <a rel="noopener" href="http://gogameguru.com/relentless/">
                                        Go Game Guru
                                    </a>
                                </span>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.usgo.org/sites/default/files/pdf/go-seigen-book.pdf"
                                >
                                    Go on Go: The Analyzed Games of Go Seigen
                                </a>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Go Seigen
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Translation by Jim Z. Yu
                                </span>
                            </span>,

                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://archive.org/details/gameofgonational00smitrich/page/n9"
                                >
                                    The Game of Go
                                </a>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Arthur Smith (1908)
                                </span>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://tigersmouth.org/downloads/RiverMtnGo-30k-20k.pdf"
                                >
                                    River Mountain Go 1 (30k-20k)
                                </a>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Oliver Richman
                                </span>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://tigersmouth.org/downloads/RiverMtnGo-20k-8k.pdf"
                                >
                                    River Mountain Go 2 (20k-8k)
                                </a>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Oliver Richman
                                </span>
                            </span>,
                            <span>
                                <Flag country={es} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/Introduccion-al-juego-de-Go.pdf"
                                >
                                    Introducción al juego de Go
                                </a>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Mariano López Minnucci
                                </span>
                            </span>,

                            <span>
                                {" "}
                                <Flag country={en} /> <Flag country={ru} /> 81 Little Lions (9x9
                                intro)
                                <br />
                                <span style={{ marginLeft: "1.7em" }}>
                                    <Flag country={en} />
                                    <a
                                        rel="noopener"
                                        href="https://cdn.online-go.com/81_little_lions/Immanuel%20deVillers%20-%2081%20Little%20Lions%20-%20An%20Introduction%20to%20the%209x9%20Board%20for%20Advanced%20Beginners%20-%20Revised%20Edition%20(2019).pdf"
                                    >
                                        2019 Edition (pdf)
                                    </a>
                                </span>
                                <br />
                                <span style={{ marginLeft: "1.7em" }}>
                                    <Flag country={en} />
                                    <a
                                        rel="noopener"
                                        href="https://cdn.online-go.com/81_little_lions/Immanuel%20deVillers%20-%2081%20Little%20Lions%20-%20An%20Introduction%20to%20the%209x9%20Board%20for%20Advanced%20Beginners%20-%20Revised%20Edition%20(2019).azw3"
                                    >
                                        2019 Edition (azw3)
                                    </a>
                                </span>
                                <br />
                                <span style={{ marginLeft: "1.7em" }}>
                                    <Flag country={en} />
                                    <a
                                        rel="noopener"
                                        href="https://cdn.online-go.com/81_little_lions/Immanuel%20deVillers%20-%2081%20Little%20Lions%20-%20An%20Introduction%20to%20the%209x9%20Board%20for%20Advanced%20Beginners%20-%20Revised%20Edition%20(2019).epub"
                                    >
                                        2019 Edition (epub)
                                    </a>
                                </span>
                                <br />
                                <span style={{ marginLeft: "1.7em" }}>
                                    <Flag country={ru} />
                                    <a
                                        rel="noopener"
                                        href="https://cdn.online-go.com/81_little_lions_ru.pdf"
                                    >
                                        81 львёнок (pdf)
                                    </a>
                                </span>
                                <br />
                                <span style={{ marginLeft: "1.7em" }}>
                                    <Flag country={en} />
                                    <a
                                        rel="noopener"
                                        href="https://cdn.online-go.com/81_little_lions.pdf"
                                    >
                                        2015 Edition (pdf)
                                    </a>
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Immanuel deVillers
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Lucas Félix de Oliveira Santana
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Рочев Антон
                                </span>
                            </span>,

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

                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://cdn.online-go.com/shape_up_v1.2.pdf"
                                >
                                    Shape Up!
                                </a>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Charles Matthews
                                </span>
                                <br />{" "}
                                <span style={{ marginLeft: "1.7em", fontSize: "0.9em" }}>
                                    Seong-June Kim
                                </span>
                            </span>,
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
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.josekipedia.com/">
                                    Josekipedia
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://eidogo.com/#search">
                                    Eidogo's Pattern Search
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://ps.waltheri.net/">
                                    Waltheri's Pattern Search
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://alphagoteach.deepmind.com/">
                                    AlphaGo Teaching Tool
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://learn-go.net">
                                    Interactive Tutorial for Beginners
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.playgroundequipment.com/a-kids-guide-to-playing-go/"
                                >
                                    A Kid's Guide to Playing Go
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Online Lessons")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://internetgoschool.com/index.vhtml.com"
                                >
                                    Guo Juans Internet Go School
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.yunguseng.com/">
                                    Yunguseng Dojang's Online Go School
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />
                                <Flag country={ru} />{" "}
                                <a rel="noopener" href="https://gomagic.org/">
                                    Go Magic
                                </a>
                            </span>,
                            <span>
                                <Flag country={"jp"} />{" "}
                                <a rel="noopener" href="https://www.hoenkikaku.co.jp/">
                                    Hoenkikaku Co, Ltd.
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Tsumego")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.goproblems.com">
                                    GoProblems.com
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://tsumego.tasuki.org/">
                                    [PDF] Tsumego Collection
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://sahwal.com">
                                    Sahwal.com
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://blacktoplay.com/">
                                    Black To Play
                                </a>
                            </span>,
                            <span>
                                <Flag country={un} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://gochild2009.appspot.com/?locale=en_US"
                                >
                                    GoChild
                                </a>
                            </span>,
                            <span>
                                <Flag country={"cn"} />
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.weiqiok.com/asp/English.asp">
                                    Weiqiok
                                </a>
                            </span>,
                            <span>
                                <Flag country={un} />{" "}
                                <a rel="noopener" href="http://321go.org/">
                                    3-2-1 Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.ghost-go.com/">
                                    Ghost Go
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Video Resources")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://www.gocommentary.com/free-tutorial-videos.html"
                                >
                                    Go Commentary Videos
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://badukmovies.com/">
                                    Baduk Movies
                                </a>
                            </span>,
                            <span>
                                <Flag country={eu} />{" "}
                                <a rel="noopener" href="http://eurogotv.com/">
                                    EuroGoTV Go Broadcasts
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://go.twitch.tv/directory/game/Go">
                                    Twitch Live Streams for Go
                                </a>
                            </span>,
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
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/KNMeepsie">
                                    Jonathan Markowitz
                                </a>
                            </span>,
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
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/nicksibicky/">
                                    Nick Sibicky
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCGAASXnrt4FtYfFZ608PqHA"
                                >
                                    Andrew Jackson
                                </a>
                            </span>,
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
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/user/tokinonagare27/"
                                >
                                    Shusaku Games
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCTji1kQNoWIH85dB_Vxka9g"
                                >
                                    Haylee
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/littlelambgo">
                                    Littlelambgo
                                </a>
                            </span>,
                            <span>
                                <Flag country={eu} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://www.eurogotv.com/index.php?menu=Video&log=trefwoordzoeken&trefwoord1=murugandi&pagina=5%20Murugandi"
                                >
                                    Murugandi
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/apetresc">
                                    Adrian Petrescu
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/user/longstridebaduk"
                                >
                                    LongstrideBaduk
                                </a>
                            </span>,
                            <span>
                                <Flag country={it} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/user/PaceAlessandro"
                                >
                                    Alessandro Pace
                                </a>
                            </span>,
                            <span>
                                <Flag country={es} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/goenbilbao">
                                    Escuela de Go en Bilbao
                                </a>
                            </span>,
                            <span>
                                <Flag country={es} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/gogoratugo">
                                    Gogoratu Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCP14BOcc0Rg9-TXXv2I4AkA"
                                >
                                    In Sente
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCsH0N8Hc4e4AXTnZt8Hg6fQ"
                                >
                                    BenKyo
                                </a>
                            </span>,
                            <span>
                                <Flag country={ar} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/lucho4668 ">
                                    Luciano Zinni
                                </a>
                            </span>,
                            <span>
                                <Flag country={it} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/jejosamurai ">
                                    Diego Laurenti
                                </a>
                            </span>,
                            <span>
                                <Flag country={es} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/EstudiandoGoconIni">
                                    Estudiando Go con Ini
                                </a>
                            </span>,
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
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCMp-4uv1jfVa0dXkZv3qQYA/videos"
                                >
                                    New York Institute of Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCQ7fRyWobKv_FejtqwUVImA"
                                >
                                    Yoon's Baduk Cafe
                                </a>
                            </span>,
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
                            <span>
                                <Flag country={cn} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UC9BYxg8ZakiOvbDyO2eGLZw"
                                >
                                    围棋TV
                                </a>
                            </span>,
                            <span>
                                <Flag country={au} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/lumbertruck">
                                    Lumbertruck Twitch
                                </a>
                            </span>,
                            <span>
                                <Flag country={ru} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/alone_go">
                                    Alone Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/gogogooplet">
                                    Gooplet
                                </a>
                            </span>,
                            <span>
                                <Flag country={"tr"} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCwTy0RGxDD2ZkQv-qCuWrAQ"
                                >
                                    Şibumi Go Okulu
                                </a>
                            </span>,
                            <span>
                                <Flag country={"tr"} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCzxYMKMGX_ZXXzBiLE9FVfw"
                                >
                                    Istanbul Go Association
                                </a>
                            </span>,

                            <span>
                                <Flag country={jp} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/channel/UCl4UWklKYTaUOZAhSJAprWQ"
                                >
                                    The Nihon Ki-in Youtube Channel (日本棋院囲碁チャンネル)
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://www.youtube.com/user/igoshogich">
                                    Igo &amp; Shogi
                                </a>
                            </span>,

                            <span>
                                <Flag country={"br"} />{" "}
                                <a rel="noopener" href="https://www.twitch.tv/brasilnihonkiin">
                                    Nihon Kiin do Brasil
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Sites")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://openstudyroom.org">
                                    Open Study Room
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://gobase.org/">
                                    GoBase.org
                                </a>
                            </span>,
                            <span>
                                <Flag country={fr} />{" "}
                                <a rel="noopener" href="http://rfg.jeudego.org/">
                                    Revue Française de Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.go4go.net/">
                                    Go4Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={"ro"} />{" "}
                                <a rel="noopener" href="https://desprego.ro/">
                                    Despre GO
                                </a>
                            </span>,

                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.fuseki.info">
                                    Fuseki Database
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.dailyjoseki.com/">
                                    Daily Joseki
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://senseis.xmp.net/">
                                    Sensei's Library
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://gogameguru.com/">
                                    GoGameGuru
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://avavt.github.io/gotstats/">
                                    Got Stats? - OGS Statistics
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Blogs")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://blog.seferi.org/">
                                    Seferi's Blog
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />
                                <Flag country={br} />{" "}
                                <a rel="noopener" href="https://fanaro.io/">
                                    Fanaro's Site
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://write.as/fraze/">
                                    A Baduk Blog
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://twitter.com/yikego_en">
                                    Yike Weiqi
                                </a>
                            </span>,
                            <span>
                                <Flag country={fr} />{" "}
                                <a rel="noopener" href="https://artdugo.fr">
                                    Art du Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={es} />{" "}
                                <a rel="noopener" href="http://badukaires.com/">
                                    Badukaires
                                </a>
                            </span>,
                            <span>
                                <Flag country={es} />{" "}
                                <a rel="noopener" href="http://canbaduk.wordpress.com/">
                                    Canbaduk
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://weiqitogo.blogspot.com/">
                                    Weiqi to go!
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://mysanrensei.wordpress.com/">
                                    My Sanransei
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://onelibertyshort.wordpress.com/">
                                    One Liberty Short
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://gooften.net/">
                                    Go of Ten
                                </a>
                            </span>,

                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://blog.goo.ne.jp/shukango">
                                    週刊碁ブログ
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://blog.goo.ne.jp/kiin5">
                                    棋院海外室Go日記
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/nationalgo/">
                                    囲碁ナショナルチーム「GO・碁・ジャパン」
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/nihonkiin_event/">
                                    日本棋院市ヶ谷本院事業部イベントブログ
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/yurakuchoigo/">
                                    有楽町囲碁センター
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://blog.goo.ne.jp/osakaigo">
                                    日本棋院関西総本部
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://blog.goo.ne.jp/igo-station">
                                    囲碁ステーション (Go Station)
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/igo_nikki">
                                    囲碁日記 (Go Diary)
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://blog.goo.ne.jp/ogoshi-igo">
                                    尾越一郎九段囲碁普及活動
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/kansaikishikai/">
                                    関西棋士会
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/15toyama/">
                                    このごろの下島八段と大表二段
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/igoshiraishi">
                                    白石勇一の囲碁日記
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://ichao1515.jugem.jp/">
                                    鈴木伊佐男七段の風来日記
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://blog.goo.ne.jp/ye_igo">
                                    そらちで囲碁
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/s-takao-san/">
                                    たかお日記
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/starnine">
                                    竹清勇の囲碁の宝石箱
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/33612534201">
                                    千寿の碁紀行
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/kodomoigo111">
                                    時々囲碁日誌+
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/nakanet_2009/">
                                    なかねっと
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://ameblo.jp/nagoyaamigo/">
                                    nagoya amigo
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/nagoyakishikai/">
                                    名古屋棋士会
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://blog.goo.ne.jp/minamijyuujisei_1984"
                                >
                                    ひろふみのブログ☆
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/yamaneko1985/">
                                    三谷哲也の囲碁日記
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://mimura15.jp/">
                                    三村囲碁jp
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/mukai3shimai">
                                    向井3姉妹のGO！GO！Diary☆
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://yukarigo.at.webry.info/">
                                    吉原由香里のつれづれ日記
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://blog.goo.ne.jp/yoda_norimoto">
                                    ヨダログ
                                </a>
                            </span>,

                            <span>
                                <Flag country={es} />{" "}
                                <a rel="noopener" href="http://361puntos.blogspot.com/">
                                    361 Puntos
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Forums")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.lifein19x19.com/forum/">
                                    Life in 19x19
                                </a>
                            </span>,
                            <span>
                                <Flag country={fr} />{" "}
                                <a rel="noopener" href="http://go-on.forumactif.com/">
                                    GO.ON
                                </a>
                            </span>,
                            <span>
                                <Flag country={fr} />{" "}
                                <a rel="noopener" href="http://forum.jeudego.org/">
                                    FFG
                                </a>
                            </span>,

                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.reddit.com/r/baduk/">
                                    Reddit
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="https://forums.online-go.com/">
                                    OGS Forums
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.go4go.net/go/forum">
                                    Go4Go Forums
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://tigersmouth.org/">
                                    Tiger's Mouth
                                </a>
                            </span>,
                            <span>
                                <Flag country={de} />{" "}
                                <a rel="noopener" href="http://www.dgob.de/yabbse/index.php">
                                    DGoB
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Go Servers")}</dt>
                        {scramble(
                            <span>
                                <Flag country={un} />{" "}
                                <a rel="noopener" href="http://www.gokgs.com/">
                                    [KGS] KGS Go Server
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://pandanet-igs.com/">
                                    [IGS] Internet Go Server
                                </a>
                            </span>,
                            <span>
                                <Flag country={kr} />{" "}
                                <a rel="noopener" href="http://www.tygem.com/">
                                    Tygem
                                </a>
                            </span>,
                            <span>
                                <Flag country={kr} />{" "}
                                <a rel="noopener" href="http://www.wbaduk.com/">
                                    WBaduk
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://goshrine.com/">
                                    Go Shrine
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.flyordie.com/go/">
                                    Fly or Die
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.funnode.com/games/go">
                                    Fun Node
                                </a>
                            </span>,
                            <span>
                                <Flag country={un} />{" "}
                                <a rel="noopener" href="http://www.dragongoserver.net/">
                                    [DGS] Dragon Go Server
                                </a>
                            </span>,
                            <span>
                                <Flag country={un} />{" "}
                                <a rel="noopener" href="https://www.online-go.com/">
                                    [OGS] Online-Go.com
                                </a>
                            </span>,
                            <span>
                                <Flag country={cn} />{" "}
                                <a rel="noopener" href="http://lanke.cc/">
                                    [LKGS] Lanke Go Server
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Organizations")}</dt>
                        {scramble(
                            <span>
                                <Flag country={us} />{" "}
                                <a rel="noopener" href="http://www.usgo.org/">
                                    American Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={"gb"} />{" "}
                                <a rel="noopener" href="http://britgo.org/">
                                    British Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={"ie"} />{" "}
                                <a rel="noopener" href="https://www.irish-go.org">
                                    Irish Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={ca} />{" "}
                                <a rel="noopener" href="http://go-canada.org/">
                                    Canadian Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={de} />{" "}
                                <a rel="noopener" href="http://dgob.de/">
                                    Deutscher Go-Bund
                                </a>
                            </span>,
                            <span>
                                <Flag country={au} />{" "}
                                <a rel="noopener" href="http://www.australiango.asn.au/">
                                    Australian Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={un} />{" "}
                                <a rel="noopener" href="http://intergofed.org/">
                                    International Go Federation
                                </a>
                            </span>,
                            <span>
                                <Flag country={"rs"} />{" "}
                                <a rel="noopener" href="http://goss.rs/">
                                    Go Savez Srbije
                                </a>
                            </span>,
                            <span>
                                <Flag country={eu} />{" "}
                                <a rel="noopener" href="http://www.eurogofed.org/">
                                    European Go Federation
                                </a>
                            </span>,
                            <span>
                                <Flag country={"cy"} />{" "}
                                <a rel="noopener" href="http://www.cyprus-go.org/">
                                    Cyprus Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={"ar"} />{" "}
                                <a rel="noopener" href="http://www.go.org.ar/">
                                    Asociación Argentina de Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={"us"} />{" "}
                                <a rel="noopener" href="http://agfgo.org/">
                                    American Go Foundation
                                </a>
                            </span>,
                            <span>
                                <Flag country={"es"} />{" "}
                                <a rel="noopener" href="http://aego.biz/">
                                    Asociación Española de GO
                                </a>
                            </span>,
                            <span>
                                <Flag country={"se"} />{" "}
                                <a rel="noopener" href="http://goforbundet.se">
                                    Svenska Goförbundet
                                </a>
                            </span>,
                            <span>
                                <Flag country={it} />{" "}
                                <a rel="noopener" href="https://figg.org">
                                    Italian Federation of Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={nl} />{" "}
                                <a rel="noopener" href="https://www.gobond.nl">
                                    Dutch Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={"ru"} />{" "}
                                <a rel="noopener" href="http://gofederation.ru">
                                    Russian Go Federation
                                </a>
                            </span>,
                            <span>
                                <Flag country={"pt"} />{" "}
                                <a rel="noopener" href="http://www.go-portugal.org">
                                    Associação Portuguesa de Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={"cl"} />{" "}
                                <a rel="noopener" href="http://www.igochile.cl/">
                                    Chilean Go Federation
                                </a>
                            </span>,
                            <span>
                                <Flag country={"mx"} />{" "}
                                <a rel="noopener" href="http://go.org.mx/ ">
                                    Mexican Association of Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={"tr"} />{" "}
                                <a rel="noopener" href="https://www.istanbulgo.org/">
                                    Istanbul Go Association
                                </a>
                            </span>,
                            <span>
                                <Flag country={"br"} />{" "}
                                <a rel="noopener" href="http://www.nihonkiin.com.br/">
                                    Nihon Kiin do Brasil
                                </a>
                            </span>,

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

                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://jgof.or.jp/">
                                    Japan Go Federation
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://www.igoshogi.net/">
                                    Igo &amp; Shogi Channel Inc.
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="https://kansaikiin.jp/">
                                    関西棋院 (Kansai Ki-in), Osaka Japan
                                </a>
                            </span>,
                            <span>
                                <Flag country={"il"} />{" "}
                                <a rel="noopener" href="https://igo.org.il/">
                                    Israeli Go Association
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Club Support")}</dt>
                        {scramble(
                            <span>
                                <Flag country={us} />{" "}
                                <a rel="noopener" href="https://baduk.club/">
                                    Baduk Club
                                </a>
                            </span>,
                            <span>
                                <Flag country={us} />{" "}
                                <a rel="noopener" href="https://www.goclubs.org/">
                                    GoClubsOnline
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Teaching Resources")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://agfgo.org/pages/lessonplancoop.php">
                                    AGF Lesson Plan Cooperative
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://agfgo.org/pages/grants.php">
                                    AGF Teaching Programs Grants
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://agfgo.org/pages/scholarships.php">
                                    AGF Scholarship Programs
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Equipment")}</dt>
                        {scramble(
                            <span>
                                <Flag country={us} />{" "}
                                <a rel="noopener" href="http://www.ymimports.com/">
                                    Yellow Mountain Imports
                                </a>
                            </span>,
                            <span>
                                <Flag country={gb} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.mastersofgames.com/cat/board/go.htm"
                                >
                                    Masters of Games
                                </a>
                            </span>,
                            <span>
                                <Flag country={de} />{" "}
                                <a rel="noopener" href="http://www.hebsacker-verlag.de/index.php">
                                    Hebsacker Verlag
                                </a>
                            </span>,
                            <span>
                                <Flag country={nl} />{" "}
                                <a rel="noopener" href="http://www.goshop-keima.com/">
                                    Goshop Keima
                                </a>
                            </span>,
                            <span>
                                <Flag country={us} />{" "}
                                <a rel="noopener" href="http://agfgo.org/pages/store-playing.php">
                                    AGF Store
                                </a>
                            </span>,
                            <span>
                                <Flag country={us} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://www.algorithmicartisan.com/gostones/"
                                >
                                    Exotic Go Stones
                                </a>
                            </span>,
                            <span>
                                <Flag country={jp} />{" "}
                                <a rel="noopener" href="http://www.kurokigoishi.co.jp/english/">
                                    Kurokigoishi
                                </a>
                            </span>,
                            <span>
                                <Flag country={"se"} />{" "}
                                <a rel="noopener" href="http://gobutiken.se">
                                    Gobutiken
                                </a>
                            </span>,
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
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://www.emptytriangle.com/">
                                    Empty Triangle
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://home.earthlink.net/~inkwolf/Inkwolf/Ajis_Quest.html"
                                >
                                    Aji's Quest
                                </a>
                            </span>,
                            <span>
                                <Flag country={de} />{" "}
                                <a rel="noopener" href="http://www.rwro.de/">
                                    Aji's Quest (German)
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a rel="noopener" href="http://almostsente.tumblr.com/">
                                    Almost Sente
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="http://tigersmouth.org/articles.php?article_id=49"
                                >
                                    The Better move
                                </a>
                            </span>,
                        ).map((elt, idx) => (
                            <dd key={idx}>{elt}</dd>
                        ))}
                    </dl>

                    <dl>
                        <dt>{_("Music")}</dt>
                        {scramble(
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/watch?v=dVd959KJWEI"
                                >
                                    Playing A game of Go
                                </a>
                            </span>,
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/watch?v=-EwuqJfwOU4"
                                >
                                    The Game of Go - Chris Linn [1981 Swedish New-Wave]
                                </a>
                            </span>,
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
                            <span>
                                <Flag country={en} />{" "}
                                <a
                                    rel="noopener"
                                    href="https://www.youtube.com/watch?v=quEN6FE90bM"
                                >
                                    Tesuji
                                </a>
                            </span>,
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
