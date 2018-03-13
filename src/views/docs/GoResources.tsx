/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {pgettext, _, getLanguageFlag, interpolate} from "translate";
import {Flag} from "Flag";
import * as data from "data";
import {Markdown} from "Markdown";

/*
                    <div className='about-links'>
                        <Link to='/docs/go-rules-comparison-matrix'>Go Rules Comparision Matrix</Link>
                    </div>
                    */


function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function scramble(...args) {
    return shuffleArray(args);
}

export let GoResources = (props) => {
    let country = data.get("user").country || "us";
    let fr = getLanguageFlag("french", country, "fr");
    let en = getLanguageFlag("english", country, "us");
    let es = getLanguageFlag("spanish", country, "es");
    let de = getLanguageFlag("german", country, "de");
    let cn = getLanguageFlag("chinese", country, "cn");
    let jp = getLanguageFlag("japanese", country, "jp");
    let kr = getLanguageFlag("korean", country, "kr");
    let un = getLanguageFlag("un", country, "un");
    let us = getLanguageFlag("us", country, "us");
    let eu = getLanguageFlag("eu", country, "eu");
    let nl = getLanguageFlag("dutch", country, "nl");
    let uk = getLanguageFlag("uk", country, "uk");
    let au = getLanguageFlag("au", country, "au");
    let ca = getLanguageFlag("ca", country, "ca");
    let ru = getLanguageFlag("ru", country, "ru");
    let ar = getLanguageFlag("spanish", country, "ar");


    return (
    <div id="docs-other-go-resources">
        <div className="container" style={{textAlign: "center"}}>
            <div style={{textAlign: "center"}}>
                <Markdown source={interpolate(pgettext("Go resources", "Have something you want added to the list? Shoot an email to {{email_address}}!"), {"email_address": "contact@online-go.com"})}/>
            </div>

            <div style={{textAlign: "center"}}>
                <i>{("Note: links are randomly ordered")}</i>
            </div>

            <div className="multi-columns">
            <dl>
                <dt>{_("Books")}</dt>

                {scramble(
                    <span><Flag country={kr}/><Flag country={en}/> <a href="https://cdn.online-go.com/Falling-in-love-with-Baduk.pdf">Falling in love with Baduk</a>
                        <br/><span style={{marginLeft: "1.7em", fontSize: "0.9em"}}> Korea Baduk Association</span></span>,
                    <span><Flag country={en}/> <a href="http://tigersmouth.org/downloads/RiverMtnGo-30k-20k.pdf">River Mountain Go 1 (30k-20k)</a>
                        <br/> <span style={{marginLeft: "1.7em", fontSize: "0.9em"}}>Oliver Richman</span></span>,
                    <span><Flag country={en}/> <a href="http://tigersmouth.org/downloads/RiverMtnGo-20k-8k.pdf">River Mountain Go 2 (20k-8k)</a>
                        <br/> <span style={{marginLeft: "1.7em", fontSize: "0.9em"}}>Oliver Richman</span></span>,
                    <span><Flag country={es}/> <a href="https://cdn.online-go.com/Introduccion-al-juego-de-Go.pdf">Introducción al juego de Go</a>
                        <br/> <span style={{marginLeft: "1.7em", fontSize: "0.9em"}}>Mariano López Minnucci</span></span>,
                    <span><Flag country={en}/> <a href="https://cdn.online-go.com/81_little_lions.pdf">81 Little Lions (9x9 intro)</a>
                        <br/> <span style={{marginLeft: "1.7em", fontSize: "0.9em"}}>Françisa d'Alsace</span></span>,
                    <span><Flag country={en}/> <a href="https://cdn.online-go.com/shape_up.pdf">Shape Up!</a>
                        <br/> <span style={{marginLeft: "1.7em", fontSize: "0.9em"}}>Charles Matthews</span>
                        <br/> <span style={{marginLeft: "1.7em", fontSize: "0.9em"}}>Seong-June Kim</span>
                    </span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }

            </dl>
            <dl>
                <dt>{_("Kifu Sheets")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="https://cdn.online-go.com/kifu-en-19x19.pdf">19x19</a> <a href="https://cdn.online-go.com/kifu-en-13x13.pdf">13x13</a> <a href="https://cdn.online-go.com/kifu-en-9x9.pdf">9x9</a></span>,
                <span><Flag country={en}/> <a href="https://cdn.online-go.com/kifu-with-circles-en-19x19.pdf">19x19 with circles</a> </span>,
                <span><Flag country={es}/> <a href="https://cdn.online-go.com/kifu-es-19x19.pdf">19x19</a> <a href="https://cdn.online-go.com/kifu-es-13x13.pdf">13x13</a> <a href="https://cdn.online-go.com/kifu-es-9x9.pdf">9x9</a></span>,
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Learning Resources")}</dt>
                {scramble(
                <span><Flag country={un}/> <a href="http://www.playgo.to/iwtg/">The Interactive Way To Go</a></span>,
                <span><Flag country={en}/> <a href="http://www.josekipedia.com/">Josekipedia</a></span>,
                <span><Flag country={en}/> <a href="http://eidogo.com/#search">Eidogo's Pattern Search</a></span>,
                <span><Flag country={en}/> <a href="http://ps.waltheri.net/">Waltheri's Pattern Search</a></span>,
                <span><Flag country={en}/> <a href="https://alphagoteach.deepmind.com/">AlphaGo Teaching Tool</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Tsumego")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="http://www.goproblems.com">GoProblems.com</a></span>,
                <span><Flag country={en}/> <a href="http://tsumego.tasuki.org/">[PDF] Tsumego Collection</a></span>,
                <span><Flag country={en}/> <a href="http://sahwal.com">Sahwal.com</a></span>,
                <span><Flag country={un}/> <a href="http://gochild2009.appspot.com/?locale=en_US">GoChild</a></span>,
                <span><Flag country={"cn"}/><Flag country={en}/> <a href="http://www.weiqiok.com/asp/English.asp">Weiqiok</a></span>,
                <span><Flag country={un}/> <a href="http://321go.org/">3-2-1 Go</a></span>,
                <span><Flag country={en}/> <a href="https://www.ghost-go.com/">Ghost Go</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Video Resources")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="http://www.gocommentary.com/free-tutorial-videos.html">Go Commentary Videos</a></span>,
                <span><Flag country={en}/> <a href="https://badukmovies.com/">Baduk Movies</a></span>,
                <span><Flag country={eu}/> <a href="http://eurogotv.com/">EuroGoTV Go Broadcasts</a></span>,
                <span><Flag country={en}/> <a href="https://go.twitch.tv/directory/game/Go">Twitch Live Streams for Go</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>
            <dl>
                <dt>{_("Video Channels")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="https://www.youtube.com/user/KNMeepsie">Jonathan Markowitz</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/user/nicksibicky/">Nick Sibicky</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/channel/UCGAASXnrt4FtYfFZ608PqHA">Andrew Jackson</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/user/dwyrin/">Dwyrin</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/user/tokinonagare27/">Shusaku Games</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/channel/UCTji1kQNoWIH85dB_Vxka9g">Haylee</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/user/littlelambgo">Littlelambgo</a></span>,
                <span><Flag country={eu}/> <a href="http://www.eurogotv.com/index.php?menu=Video&log=trefwoordzoeken&trefwoord1=murugandi&pagina=5%20Murugandi">Murugandi</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/user/apetresc">Adrian Petrescu</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/user/longstridebaduk">LongstrideBaduk</a></span>,
                <span><Flag country={es}/> <a href="https://www.youtube.com/user/EscueladeGodeBilbao">EscueladeGodeBilbao</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/channel/UCP14BOcc0Rg9-TXXv2I4AkA">In Sente</a></span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/channel/UCsH0N8Hc4e4AXTnZt8Hg6fQ">BenKyo</a></span>,
                <span><Flag country={ar}/> <a href="https://www.youtube.com/user/lucho4668 ">Luciano Zinni</a></span>,
                <span><Flag country={en}/> <a href="https://www.twitch.tv/xhu98">Xhu98</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }

            </dl>


            <dl>
                <dt>{_("Sites")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="http://gobase.org/">GoBase.org</a></span>,
                <span><Flag country={fr}/> <a href="http://rfg.jeudego.org/">Revue Française de Go</a></span>,
                <span><Flag country={en}/> <a href="http://www.go4go.net/">Go4Go</a></span>,

                <span><Flag country={en}/> <a href="http://www.fuseki.info">Fuseki Database</a></span>,
                <span><Flag country={en}/> <a href="http://www.dailyjoseki.com/">Daily Joseki</a></span>,
                <span><Flag country={en}/> <a href="http://senseis.xmp.net/">Sensei's Library</a></span>,
                <span><Flag country={en}/> <a href="http://www.shawnsgogroup.com/">Shawn Ray's Go Group</a></span>,
                <span><Flag country={en}/> <a href="https://gogameguru.com/">GoGameGuru</a></span>,
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Blogs")}</dt>
                {scramble(
                <span><Flag country={es}/> <a href="http://badukaires.com/">Badukaires</a></span>,
                <span><Flag country={es}/> <a href="http://canbaduk.wordpress.com/">Canbaduk</a></span>,
                <span><Flag country={en}/> <a href="http://weiqitogo.blogspot.com/">Weiqi to go!</a></span>,
                <span><Flag country={en}/> <a href="http://mysanrensei.wordpress.com/">My Sanransei</a></span>,
                <span><Flag country={en}/> <a href="http://onelibertyshort.wordpress.com/">One Liberty Short</a></span>,
                <span><Flag country={en}/> <a href="http://gooften.net/">Go of Ten</a></span>,
                <span><Flag country={es}/> <a href="http://361puntos.blogspot.com/">361 Puntos</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }

            </dl>

            <dl>
                <dt>{_("Forums")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="http://www.lifein19x19.com/forum/">Life in 19x19</a></span>,
                <span><Flag country={fr}/> <a href="http://go-on.forumactif.com/">GO.ON</a></span>,
                <span><Flag country={fr}/> <a href="http://forum.jeudego.org/">FFG</a></span>,

                <span><Flag country={en}/> <a href="http://www.reddit.com/r/baduk/">Reddit</a></span>,
                <span><Flag country={en}/> <a href="https://forums.online-go.com/">OGS Forums</a></span>,
                <span><Flag country={en}/> <a href="http://www.go4go.net/go/forum">Go4Go Forums</a></span>,
                <span><Flag country={en}/> <a href="http://tigersmouth.org/">Tiger's Mouth</a></span>,
                <span><Flag country={de}/> <a href="http://www.dgob.de/yabbse/index.php">DGoB</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>


            <dl>
                <dt>{_("Go Servers")}</dt>
                {scramble(
                <span><Flag country={un}/> <a href="http://www.gokgs.com/">[KGS] KGS Go Server</a></span>,
                <span><Flag country={jp}/> <a href="http://pandanet-igs.com/">[IGS] Internet Go Server</a></span>,
                <span><Flag country={kr}/> <a href="http://www.tygem.com/">Tygem</a></span>,
                <span><Flag country={kr}/> <a href="http://www.wbaduk.com/">WBaduk</a></span>,
                <span><Flag country={en}/> <a href="http://goshrine.com/">Go Shrine</a></span>,
                <span><Flag country={en}/> <a href="http://www.flyordie.com/go/">Fly or Die</a></span>,
                <span><Flag country={en}/> <a href="http://www.funnode.com/games/go">Fun Node</a></span>,
                <span><Flag country={un}/> <a href="http://www.dragongoserver.net/">[DGS] Dragon Go Server</a></span>,
                <span><Flag country={un}/> <a href="https://www.online-go.com/">[OGS] Online-Go.com</a></span>,
                <span><Flag country={cn}/> <a href="http://lanke.cc/">[LKGS] Lanke Go Server</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Organizations")}</dt>
                {scramble(
                <span><Flag country={us}/> <a href="http://www.usgo.org/">American Go Association</a></span>,
                <span><Flag country={"gb"}/> <a href="http://britgo.org/">British Go Association</a></span>,
                <span><Flag country={ca}/> <a href="http://go-canada.org/">Canadian Go Association</a></span>,
                <span><Flag country={de}/> <a href="http://dgob.de/">Deutscher Go-Bund</a></span>,
                <span><Flag country={au}/> <a href="http://www.australiango.asn.au/">Australian Go Association</a></span>,
                <span><Flag country={un}/> <a href="http://intergofed.org/">International Go Federation</a></span>,
                <span><Flag country={eu}/> <a href="http://www.eurogofed.org/">European Go Federation</a></span>,
                <span><Flag country={"ar"}/> <a href="http://www.go.org.ar/">Asociación Argentina de Go</a></span>,
                <span><Flag country={"us"}/> <a href="http://agfgo.org/">American Go Foundation</a></span>,
                <span><Flag country={"es"}/> <a href="http://aego.biz/">Asociación Española de GO</a></span>,
                <span><Flag country={"se"}/> <a href="http://goforbundet.se">Svenska Goförbundet</a></span>,
                <span><Flag country={"ru"}/> <a href="http://gofederation.ru">Russian Go Federation</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Club Support")}</dt>
                {scramble(
                <span><Flag country={us}/> <a href="https://www.goclubs.org/">GoClubsOnline</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Teaching Resources")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="http://agfgo.org/pages/lessonplancoop.php">AGF Lesson Plan Cooperative</a></span>,
                <span><Flag country={en}/> <a href="http://agfgo.org/pages/grants.php">AGF Teaching Programs Grants</a></span>,
                <span><Flag country={en}/> <a href="http://agfgo.org/pages/scholarships.php">AGF Scholarship Programs</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>


            <dl>
                <dt>{_("Equipment")}</dt>
                {scramble(
                <span><Flag country={us}/> <a href="http://www.ymimports.com/">Yellow Mountain Imports</a></span>,
                <span><Flag country={de}/> <a href="http://www.hebsacker-verlag.de/index.php">Hebsacker Verlag</a></span>,
                <span><Flag country={nl}/> <a href="http://www.goshop-keima.com/">Goshop Keima</a></span>,
                <span><Flag country={us}/> <a href="http://agfgo.org/pages/store-playing.php">AGF Store</a></span>,
                <span><Flag country={us}/> <a href="http://www.algorithmicartisan.com/gostones/">Exotic Go Stones</a></span>,
                <span><Flag country={jp}/> <a href="http://www.kurokigoishi.co.jp/english/">Kurokigoishi</a></span>,
                <span><Flag country={"se"}/> <a href="http://gobutiken.se">Gobutiken</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Comics")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="http://www.emptytriangle.com/">Empty Triangle</a></span>,
                <span><Flag country={en}/> <a href="http://home.earthlink.net/~inkwolf/Inkwolf/Ajis_Quest.html">Aji's Quest</a></span>,
                <span><Flag country={de}/> <a href="http://www.rwro.de/">Aji's Quest (German)</a></span>,
                <span><Flag country={en}/> <a href="http://almostsente.tumblr.com/">Almost Sente</a></span>,
                <span><Flag country={en}/> <a href="http://tigersmouth.org/articles.php?article_id=49">The Better move</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Music")}</dt>
                {scramble(
                <span><Flag country={en}/> <a href="https://www.youtube.com/watch?v=dVd959KJWEI">Playing A game of Go</a></span>,
                <span><Flag country={en}/> <a href="http://www.haskellsmall.com/videos/a-game-of-go-part-1">A Game of Go pt. I</a>
                <a href="http://www.haskellsmall.com/videos/a-game-of-go-part-2">pt. II</a>
                </span>,
                <span><Flag country={en}/> <a href="https://www.youtube.com/watch?v=quEN6FE90bM">Tesuji</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>

            <dl>
                <dt>{_("Software")}</dt>
                {scramble(
                <span><i className="fa fa-windows"/> <a href="http://www.ruijiang.com/multigo/">MultiGo</a></span>,
                <span><i className="fa fa-windows"/> <Flag country={jp}/> <a href="http://www.nihonkiin.or.jp/teach/kiin_editor/">Kiin Editor</a></span>,
                <span><i className="fa fa-windows"/> <a href="http://www.smart-games.com/manyfaces.html">The Many Faces of Go</a></span>,
                <span><i className="fa fa-android"/> <a href="https://play.google.com/store/apps/details?id=net.lrstudios.android.tsumego_workshop&hl=en">Tsumego Pro</a></span>,
                <span><i className="fa fa-apple"/> <a href="https://itunes.apple.com/app/smartgo-kifu/id364854741?mt=8&ign-mpt=uo%3D4">SmartGo Kifu</a></span>,
                <span><i className="fa fa-linux"/> <i className="fa fa-apple"/> <i className="fa fa-windows"></i> <a href="https://www.gnu.org/software/gnugo/gnugo.html">GNU Go</a></span>,
                <span><i className="fa fa-linux"/> <i className="fa fa-apple"/> <i className="fa fa-windows"></i> <a href="http://pachi.or.cz/">Pachi</a></span>,
                <span><i className="fa fa-linux"/> <i className="fa fa-apple"/> <i className="fa fa-windows"></i> <a href="http://gogui.sourceforge.net/">GoGui</a></span>,
                <span><i className="fa fa-linux"></i> <i className="fa fa-apple"></i> <i className="fa fa-windows"></i> <a href="https://github.com/SabakiHQ/Sabaki">Sabaki</a></span>,
                <span><i className="fa fa-android"/> <a href="https://play.google.com/store/apps/details?id=net.lrstudios.android.pachi">Pachi for Android</a></span>,
                <span><i className="fa fa-android"/> <a href="https://play.google.com/store/apps/details?id=nl.tengen.gridmaster">Go GridMaster</a></span>,
                <span><i className="fa fa-android"/> <a href="https://play.google.com/store/apps/details?id=org.ligi.gobandroid_hd">Gobandroid HD</a></span>,
                <span><i className="fa fa-dollar"/> <i className="fa fa-android"/> <a href="https://play.google.com/store/apps/details?id=net.gowrite&hl=en">Hactar Go</a></span>,
                <span><i className="fa fa-dollar"/> <i className="fa fa-android"/> <a href="https://play.google.com/store/apps/details?id=lrstudios.games.ego&hl=en">Ely Go</a></span>,
                <span><i className="fa fa-dollar"/> <i className="fa fa-apple"/> <i className="fa fa-windows"></i> <a href="http://smartgo.com/index.html">SmartGo</a></span>,
                <span><i className="fa fa-dollar"/> <i className="fa fa-apple"/> <a href="https://gobooks.com/platforms.html">Go Books</a></span>,
                <span>
                    <i className="fa fa-linux" /> <i className="fa fa-apple" /> <i className="fa fa-windows" /> <a href="https://www.sjeng.org/leela.html">Leela</a></span>,
                <span><i className="fa fa-dollar"/> <i className="fa fa-apple"/> <a href="https://itunes.apple.com/app/apple-store/id492566615?mt=8">EasyGo</a></span>
                ).map((elt, idx) => <dd key={idx}>{elt}</dd>)
                }
            </dl>
            </div>

        </div>
    </div>
    );
};
